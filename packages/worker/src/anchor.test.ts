import { describe, expect, it, vi } from "vitest";
import { createSdkAnchor, type TraceWriter } from "./anchor.js";
import type { Observation } from "./store.js";

function obs(id: number, sessionId: string, toolName: string): Observation {
  return {
    id,
    sessionId,
    seq: id,
    type: "tool_use",
    toolName,
    toolNamespace: null,
    inputPreview: "in",
    outputPreview: null,
    parentCallId: null,
    createdAt: 0,
    proofStatus: "queued",
    callId: null,
    txDigest: null,
  };
}

describe("createSdkAnchor", () => {
  it("opens one TraceSession per local session and appends each observation to it", async () => {
    const startSession = vi.fn(async () => ({ sessionId: "0xsess", txDigest: "0xs" }));
    const appendCall = vi.fn(async (_args: Parameters<TraceWriter["appendCall"]>[0]) => ({
      callId: "0xcall",
      txDigest: "0xtx",
    }));
    const traces: TraceWriter = { startSession, appendCall };
    const anchor = createSdkAnchor({ traces, namespaceId: "0xns", rwCapId: "0xcap" });

    const r1 = await anchor(obs(1, "s", "Bash"));
    const r2 = await anchor(obs(2, "s", "Read"));

    expect(r1).toEqual({ callId: "0xcall", txDigest: "0xtx" });
    expect(r2.callId).toBe("0xcall");
    // ONE on-chain session reused for both observations in the same local session
    expect(startSession).toHaveBeenCalledTimes(1);
    expect(appendCall).toHaveBeenCalledTimes(2);
    // appendCall targets the opened session with the right namespace/cap
    expect(appendCall.mock.calls[0]?.[0]).toMatchObject({
      sessionId: "0xsess",
      namespaceId: "0xns",
      rwCapId: "0xcap",
      toolName: "Bash",
    });

    // a different local session opens its own on-chain session
    await anchor(obs(3, "s2", "Edit"));
    expect(startSession).toHaveBeenCalledTimes(2);
  });
});
