// The real on-chain anchor for the reconciler. It lazily opens ONE TraceSession
// per local session and appends each observation as a Merkle-chained ActionCall
// (the same path proven by the keystone + MCP attestation tests). It's typed
// against a structural TraceWriter — which the SDK's `onemem.traces` satisfies —
// so the worker package needs no sdk-ts dependency and this logic is fully
// unit-testable with a mock.

import type { AnchorFn } from "./reconciler.js";
import type { Observation } from "./store.js";

export interface TraceWriter {
  startSession(args: {
    namespaceId: string;
    rwCapId: string;
    agentId: string;
    environment: string;
    sdkVersion: string;
  }): Promise<{ sessionId: string; txDigest: string }>;
  appendCall(args: {
    sessionId: string;
    namespaceId: string;
    rwCapId: string;
    toolName: string;
    toolNamespace: string;
    input: { content: Uint8Array; encrypt: boolean };
    label?: string;
  }): Promise<{ callId: string; txDigest: string }>;
}

export interface SdkAnchorConfig {
  readonly traces: TraceWriter;
  readonly namespaceId: string;
  readonly rwCapId: string;
  readonly agentId?: string;
  readonly sdkVersion?: string;
}

export function createSdkAnchor(config: SdkAnchorConfig): AnchorFn {
  const onchainSessions = new Map<string, Promise<string>>();
  const agentId = config.agentId ?? "worker";

  function ensureSession(localSessionId: string): Promise<string> {
    let pending = onchainSessions.get(localSessionId);
    if (!pending) {
      pending = config.traces
        .startSession({
          namespaceId: config.namespaceId,
          rwCapId: config.rwCapId,
          agentId,
          environment: "worker",
          sdkVersion: config.sdkVersion ?? "0.1.0",
        })
        .then((s) => s.sessionId);
      onchainSessions.set(localSessionId, pending);
    }
    return pending;
  }

  return async (observation: Observation) => {
    const sessionId = await ensureSession(observation.sessionId);
    const payload = JSON.stringify({
      tool: observation.toolName,
      input: observation.inputPreview,
      output: observation.outputPreview,
    });
    const emitted = await config.traces.appendCall({
      sessionId,
      namespaceId: config.namespaceId,
      rwCapId: config.rwCapId,
      toolName: observation.toolName ?? observation.type,
      toolNamespace: observation.toolNamespace ?? "@onemem/worker",
      input: { content: new TextEncoder().encode(payload), encrypt: true },
      label: "observation",
    });
    return { callId: emitted.callId, txDigest: emitted.txDigest };
  };
}
