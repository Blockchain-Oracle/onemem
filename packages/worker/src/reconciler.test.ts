import { describe, expect, it, vi } from "vitest";
import { type AnchorResult, reconcileOnce } from "./reconciler.js";
import { type Observation, WorkerStore } from "./store.js";

describe("reconciler", () => {
  it("anchors pending observations, flips proof_status, and pushes each update", async () => {
    const store = new WorkerStore(":memory:");
    store.initSession({ id: "s", runtime: "claude-code" });
    const o1 = store.addObservation({ sessionId: "s", type: "tool_use", toolName: "Bash" });
    const o2 = store.addObservation({ sessionId: "s", type: "tool_use", toolName: "Read" });

    const updates: string[] = [];
    const anchor = vi.fn(
      async (o: Observation): Promise<AnchorResult> => ({
        callId: `call-${o.id}`,
        txDigest: `tx-${o.id}`,
      }),
    );

    const count = await reconcileOnce({
      store,
      anchor,
      onUpdate: (o) => updates.push(`${o.id}:${o.proofStatus}`),
    });

    expect(count).toBe(2);
    expect(anchor).toHaveBeenCalledTimes(2);
    expect(store.getObservation(o1.id)?.proofStatus).toBe("anchored");
    expect(store.getObservation(o1.id)?.callId).toBe(`call-${o1.id}`);
    expect(store.getObservation(o2.id)?.proofStatus).toBe("anchored");
    // each observation is pushed twice: queued then anchored
    expect(updates).toContain(`${o1.id}:queued`);
    expect(updates).toContain(`${o1.id}:anchored`);
    expect(store.pendingProof()).toHaveLength(0);
    store.close();
  });

  it("marks an observation 'failed' (retryable) when anchoring throws", async () => {
    const store = new WorkerStore(":memory:");
    store.initSession({ id: "s", runtime: "claude-code" });
    const o = store.addObservation({ sessionId: "s", type: "tool_use", toolName: "Bash" });

    const anchor = vi.fn(async (): Promise<AnchorResult> => {
      throw new Error("rpc down");
    });

    await reconcileOnce({ store, anchor });

    expect(store.getObservation(o.id)?.proofStatus).toBe("failed");
    // failed rows remain in the pending queue so a later pass retries them
    expect(store.pendingProof().map((x) => x.id)).toContain(o.id);
    store.close();
  });
});
