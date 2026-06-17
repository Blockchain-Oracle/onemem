import { describe, expect, it, vi } from "vitest";

import { recordSession } from "../src/runtime.js";

function fakeOneMem() {
  const startSession = vi.fn(async () => ({ sessionId: "0xsession" }));
  let n = 0;
  const appendCall = vi.fn(async () => ({ callId: `0xcall${++n}` }));
  const closeCall = vi.fn(async () => ({}));
  const endSession = vi.fn(async () => ({}));
  return {
    onemem: { traces: { startSession, appendCall, closeCall, endSession } } as never,
    startSession,
    appendCall,
    closeCall,
    endSession,
  };
}

const target = { namespaceId: "0xns", rwCapId: "0xcap" };

describe("recordSession", () => {
  it("Merkle-chains calls: first parent null, each subsequent chains off the prior callId", async () => {
    const f = fakeOneMem();
    const res = await recordSession(f.onemem, {
      target,
      agentId: "hermes",
      environment: "hermes",
      calls: [
        { toolName: "a", input: 1, output: 2 },
        { toolName: "b", input: 3, output: 4 },
        { toolName: "c", input: 5, output: 6 },
      ],
    });
    expect(res.sessionId).toBe("0xsession");
    expect(res.callIds).toEqual(["0xcall1", "0xcall2", "0xcall3"]);
    expect(f.appendCall).toHaveBeenCalledTimes(3);
    expect(f.appendCall.mock.calls[0][0].parentCallId).toBeNull();
    expect(f.appendCall.mock.calls[1][0].parentCallId).toBe("0xcall1");
    expect(f.appendCall.mock.calls[2][0].parentCallId).toBe("0xcall2");
    expect(f.closeCall).toHaveBeenCalledTimes(3);
    // endSession runs last, exactly once, Completed
    expect(f.endSession).toHaveBeenCalledTimes(1);
    expect(f.endSession.mock.calls[0][0].status).toBe(1);
  });

  it("seeds the first call's parent from an external (cross-runtime) parentCallId", async () => {
    const f = fakeOneMem();
    const res = await recordSession(f.onemem, {
      target,
      agentId: "hermes",
      environment: "hermes",
      parentCallId: "0xparent-from-claude-code",
      calls: [
        { toolName: "a", input: 1, output: 2 },
        { toolName: "b", input: 3, output: 4 },
      ],
    });
    // First call chains off the EXTERNAL parent; the second chains off the first.
    expect(f.appendCall.mock.calls[0][0].parentCallId).toBe("0xparent-from-claude-code");
    expect(f.appendCall.mock.calls[1][0].parentCallId).toBe("0xcall1");
    expect(res.callIds).toEqual(["0xcall1", "0xcall2"]);
  });

  it("stores content encrypted (encrypt:true on every append+close)", async () => {
    const f = fakeOneMem();
    await recordSession(f.onemem, {
      target,
      agentId: "hermes",
      environment: "hermes",
      calls: [{ toolName: "a", input: { q: "x" }, output: "y" }],
    });
    expect(f.appendCall.mock.calls[0][0].input.encrypt).toBe(true);
    expect(f.closeCall.mock.calls[0][0].output.encrypt).toBe(true);
  });

  it("on a mid-loop failure, closes the session Failed and rethrows (no orphaned open session)", async () => {
    const f = fakeOneMem();
    f.appendCall.mockRejectedValueOnce(new Error("walrus flake"));
    await expect(
      recordSession(f.onemem, {
        target,
        agentId: "hermes",
        environment: "hermes",
        calls: [{ toolName: "a", input: 1, output: 2 }],
      }),
    ).rejects.toThrow("walrus flake");
    expect(f.endSession).toHaveBeenCalledTimes(1);
    expect(f.endSession.mock.calls[0][0].status).toBe(2); // SessionStatus.Failed
  });
});
