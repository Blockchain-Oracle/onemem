// @onemem/oc-onemem — OpenClaw plugin.
//
// Strict superset of Mysten's oc-memwal: delegates to it for Walrus-backed
// memory (recall/capture), then ADDS a verifiable on-chain trace — each agent
// run becomes a OneMem TraceSession with Merkle-chained ActionCalls.
//
// Config: `api.pluginConfig` (namespaceId, rwCapId, network, privateKey) takes
// precedence, then env (ONEMEM_NAMESPACE_ID, ONEMEM_RW_CAP_ID, SUI_NETWORK,
// ONEMEM_PRIVATE_KEY); the signer falls back to the sui keystore. Without a
// namespace + cap, trace recording is inert (memory still works).
//
// Hook surface verified against openclaw 2026.6.6 plugin-sdk + the
// verifiable-execution reference plugin: register typed lifecycle hooks via
// `api.on(name, (event, ctx) => …)`. We capture on every run, not just on tool
// use:
//   after_tool_call  → buffer the OpenClaw-dispatched tool call
//   llm_output       → buffer the model response when present (the usual path to
//                      ≥1 entry when the agent uses no OpenClaw tools — many
//                      providers run tools internally and never hit
//                      after_tool_call)
//   agent_end        → flush the buffer as one on-chain TraceSession + close it
// `session_start` is intentionally NOT relied upon — it isn't reliably exposed,
// so all on-chain work is deferred to the agent_end flush.
//
// Spec: docs/05-our-architecture/03-runtimes/openclaw-plugin.md

import { loadConfig, type PluginConfigOverrides, TraceRecorder } from "./onemem-trace.js";

// oc-memwal is an OPTIONAL peer: when installed, we delegate to it for
// Walrus-backed memory; when absent, OneMem still provides the verifiable trace
// layer standalone. Loaded dynamically so a missing dep never breaks load.
async function delegateToOcMemwal(api: unknown): Promise<void> {
  try {
    const mod = (await import("@mysten-incubation/oc-memwal")) as {
      default?: { register?: (api: unknown) => void };
    };
    mod.default?.register?.(api);
  } catch {
    // oc-memwal not present — trace layer works without it.
  }
}

// Event payloads vary across OpenClaw versions, so they're loosely typed and
// field reads are defensive — see sessionKeyOf + the per-hook plucking.
type HookEvent = Record<string, unknown>;
type HookCtx = { sessionKey?: string; sessionId?: string };
interface OpenClawApi {
  logger?: { info?: (msg: string) => void; warn?: (msg: string) => void };
  pluginConfig?: PluginConfigOverrides;
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

const plugin = {
  id: "oc-onemem",
  name: "OneMem",
  description: "Verifiable on-chain memory + action traces for OpenClaw (superset of oc-memwal).",
  register(api: OpenClawApi): void {
    // 1) Delegate to oc-memwal (optional) — Walrus-backed memory when present.
    void delegateToOcMemwal(api);

    // 2) Add the OneMem verifiable trace layer via the typed lifecycle hooks.
    // Zero-config: namespace/cap/signer auto-provision at first flush (see
    // provision.ts), so the only hard requirement is the hook surface.
    if (!api.on) {
      api.logger?.info?.("[oc-onemem] trace inert (host provided no hook surface)");
      return;
    }
    const recorder = new TraceRecorder(loadConfig(api.pluginConfig), api.logger);

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
      safe("after_tool_call", (event, ctx) => {
        recorder.record(sessionKeyOf(event, ctx), {
          toolName: (event.toolName as string) ?? "tool",
          input: event.params ?? null,
          output: event.result ?? event.error ?? null,
        });
      }),
    );

    api.on(
      "llm_output",
      safe("llm_output", (event, ctx) => {
        const output = event.lastAssistant ?? event.assistantTexts ?? null;
        if (output === null) return;
        recorder.record(sessionKeyOf(event, ctx), {
          toolName: "llm_call",
          input: { provider: event.provider, model: event.model, runId: event.runId },
          output,
        });
      }),
    );

    api.on(
      "agent_end",
      safe("agent_end", async (event, ctx) => {
        const sessionId = await recorder.end(sessionKeyOf(event, ctx));
        if (sessionId) api.logger?.info?.(`[oc-onemem] verifiable trace ${sessionId}`);
      }),
    );
  },
};

export default plugin;
