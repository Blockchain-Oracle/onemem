// @onemem/oc-onemem — OpenClaw plugin.
//
// Strict superset of Mysten's oc-memwal: delegates to it for Walrus-backed
// memory (recall/capture), then ADDS a verifiable on-chain trace — each agent
// run becomes a OneMem TraceSession with Merkle-chained ActionCalls.
//
// Config via env: ONEMEM_NAMESPACE_ID + ONEMEM_RW_CAP_ID (the OneMem namespace
// + ReadWrite cap to record into), ONEMEM_PRIVATE_KEY (else sui keystore),
// SUI_NETWORK. Without them, trace recording is inert (memory still works).
//
// Spec: docs/05-our-architecture/03-runtimes/openclaw-plugin.md

import ocMemwal from "@mysten-incubation/oc-memwal";

import { loadConfig, TraceRecorder } from "./onemem-trace.js";

// OpenClaw's plugin api is large + version-bundled; we use only a couple seams
// (registerHook + logger), typed loosely to stay resilient across versions.
interface OpenClawApi {
  logger?: { info?: (msg: string) => void; warn?: (msg: string) => void };
  registerHook?: (
    events: string | string[],
    handler: (event: Record<string, unknown>) => unknown,
  ) => void;
  [k: string]: unknown;
}

/** Best-effort session-key extraction across OpenClaw event shapes. */
function sessionKeyOf(event: Record<string, unknown>): string {
  const session = event.session as { key?: string; id?: string } | undefined;
  return (
    (event.sessionKey as string) ??
    (event.sessionId as string) ??
    session?.key ??
    session?.id ??
    "default"
  );
}

const plugin = {
  id: "oc-onemem",
  name: "OneMem",
  description: "Verifiable on-chain memory + action traces for OpenClaw (superset of oc-memwal).",
  kind: "memory" as const,
  register(api: OpenClawApi): void {
    // 1) Delegate to oc-memwal — all Walrus-backed memory functionality.
    try {
      (ocMemwal as { register?: (api: unknown) => void }).register?.(api);
    } catch {
      // oc-memwal is optional at runtime; the trace layer still works.
    }

    // 2) Add the OneMem verifiable trace layer.
    const config = loadConfig();
    if (!config || !api.registerHook) {
      api.logger?.info?.("[oc-onemem] trace inert (set ONEMEM_NAMESPACE_ID + ONEMEM_RW_CAP_ID)");
      return;
    }
    const recorder = new TraceRecorder(config);

    api.registerHook("agent_start", async (event) => {
      await recorder.start(sessionKeyOf(event));
    });

    api.registerHook(["tool_execution_end", "tool_call"], (event) => {
      const tool = event.tool as { name?: string } | undefined;
      const toolName = (event.toolName as string) ?? tool?.name ?? (event.name as string) ?? "tool";
      recorder.record(sessionKeyOf(event), {
        toolName,
        input: event.input ?? event.args ?? event.params ?? null,
        output: event.output ?? event.result ?? event.response ?? null,
      });
    });

    api.registerHook("agent_end", async (event) => {
      const sessionId = await recorder.end(sessionKeyOf(event));
      if (sessionId) api.logger?.info?.(`[oc-onemem] verifiable trace ${sessionId}`);
    });
  },
};

export default plugin;
