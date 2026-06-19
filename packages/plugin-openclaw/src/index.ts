// @onemem/oc-onemem — OpenClaw plugin.
//
// Delegates to Mysten's oc-memwal for Walrus-backed memory (recall/capture) when
// installed, and captures each agent run's tool/LLM calls as readable
// observations posted to the local OneMem worker (127.0.0.1:4041) — the same
// alive local feed the Claude Code / Codex plugins write to. The worker streams
// them to the local dashboard over SSE.
//
// Capture is best-effort and never on the host's critical path: a worker that's
// down just means the observation isn't recorded, never a broken agent run.
//
// Hook surface verified against openclaw 2026.6.6 plugin-sdk:
//   after_tool_call  → post the OpenClaw-dispatched tool call as an observation
//   llm_output       → post the model response as an observation
//   agent_end        → mark the worker session ended
//
// Spec: docs/05-our-architecture/03-runtimes/openclaw-plugin.md

const DEFAULT_WORKER_URL = "http://127.0.0.1:4041";
const POST_TIMEOUT_MS = 800;
const PREVIEW_LIMIT = 2_000;

// oc-memwal is an OPTIONAL peer: when installed, we delegate to it for
// Walrus-backed memory. Loaded dynamically so a missing dep never breaks load.
async function delegateToOcMemwal(api: unknown): Promise<void> {
  try {
    const mod = (await import("@mysten-incubation/oc-memwal")) as {
      default?: { register?: (api: unknown) => void };
    };
    mod.default?.register?.(api);
  } catch {
    // oc-memwal not present — capture works without it.
  }
}

// Event payloads vary across OpenClaw versions, so they're loosely typed and
// field reads are defensive — see sessionKeyOf + the per-hook plucking.
type HookEvent = Record<string, unknown>;
type HookCtx = { sessionKey?: string; sessionId?: string };
interface OpenClawApi {
  logger?: { info?: (msg: string) => void; warn?: (msg: string) => void };
  on?: (hookName: string, handler: (event: HookEvent, ctx: HookCtx) => unknown) => void;
  [k: string]: unknown;
}

const errMsg = (err: unknown): string => (err instanceof Error ? err.message : String(err));

export function sessionKeyOf(event: HookEvent, ctx: HookCtx): string {
  return (
    ctx.sessionKey ??
    ctx.sessionId ??
    (event.sessionKey as string) ??
    (event.sessionId as string) ??
    "default"
  );
}

function workerUrl(): string {
  return (process.env.ONEMEM_WORKER_URL || DEFAULT_WORKER_URL).replace(/\/+$/, "");
}

export function preview(value: unknown): string | null {
  if (value == null) return null;
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.length > PREVIEW_LIMIT ? `${text.slice(0, PREVIEW_LIMIT)}…` : text;
}

async function postWorker(path: string, body: unknown): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), POST_TIMEOUT_MS);
  try {
    const res = await fetch(`${workerUrl()}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

const plugin = {
  id: "oc-onemem",
  name: "OneMem",
  description:
    "Decentralized memory + a live local capture feed for OpenClaw (superset of oc-memwal).",
  register(api: OpenClawApi): void {
    // 1) Delegate to oc-memwal (optional) — Walrus-backed memory when present.
    void delegateToOcMemwal(api);

    // 2) Capture readable observations to the local OneMem worker.
    if (!api.on) {
      api.logger?.info?.("[oc-onemem] capture inert (host provided no hook surface)");
      return;
    }

    // Track which worker sessions we've opened so each gets one init.
    const opened = new Set<string>();
    async function ensureSession(sessionKey: string): Promise<void> {
      if (opened.has(sessionKey)) return;
      opened.add(sessionKey);
      await postWorker("/api/sessions/init", { id: sessionKey, runtime: "openclaw" });
    }

    // All hooks run inside the host's dispatch and api.on is fire-and-forget
    // (returns void), so an uncaught throw/rejection in a handler could crash
    // the host. `safe` guarantees the never-break-the-agent contract uniformly.
    const safe =
      (name: string, fn: (e: HookEvent, c: HookCtx) => unknown) => (e: HookEvent, c: HookCtx) => {
        try {
          const r = fn(e, c);
          if (r instanceof Promise) {
            r.catch((err) => api.logger?.warn?.(`[oc-onemem] ${name} failed: ${errMsg(err)}`));
          }
        } catch (err) {
          api.logger?.warn?.(`[oc-onemem] ${name} failed: ${errMsg(err)}`);
        }
      };

    api.on(
      "after_tool_call",
      safe("after_tool_call", async (event, ctx) => {
        const sessionKey = sessionKeyOf(event, ctx);
        await ensureSession(sessionKey);
        await postWorker("/api/sessions/observations", {
          sessionId: sessionKey,
          type: "tool_use",
          toolName: (event.toolName as string) ?? "tool",
          toolNamespace: "openclaw",
          inputPreview: preview(event.params ?? null),
          outputPreview: preview(event.result ?? event.error ?? null),
        });
      }),
    );

    api.on(
      "llm_output",
      safe("llm_output", async (event, ctx) => {
        const output = event.lastAssistant ?? event.assistantTexts ?? null;
        if (output === null) return;
        const sessionKey = sessionKeyOf(event, ctx);
        await ensureSession(sessionKey);
        await postWorker("/api/sessions/observations", {
          sessionId: sessionKey,
          type: "llm_output",
          toolName: "llm_call",
          toolNamespace: "openclaw",
          inputPreview: preview({ provider: event.provider, model: event.model }),
          outputPreview: preview(output),
        });
      }),
    );

    api.on(
      "agent_end",
      safe("agent_end", async (event, ctx) => {
        const sessionKey = sessionKeyOf(event, ctx);
        if (!opened.has(sessionKey)) return;
        opened.delete(sessionKey);
        await postWorker("/api/sessions/end", { id: sessionKey });
      }),
    );
  },
};

export default plugin;
