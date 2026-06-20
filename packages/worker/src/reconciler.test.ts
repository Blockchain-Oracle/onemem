import { describe, expect, it } from "vitest";
import type { DurableJobStatus, DurableStore } from "./durable.js";
import { runReconcileOnce } from "./reconciler.js";
import { WorkerStore } from "./store.js";

function durableWith(statuses: Record<string, DurableJobStatus>): DurableStore {
  return {
    available: () => true,
    write: async () => "unused",
    status: async (jobId) => statuses[jobId] ?? { state: "pending" },
    recall: async () => [],
  };
}

describe("runReconcileOnce", () => {
  it("backfills the real blob id when a job is done and broadcasts it", async () => {
    const store = new WorkerStore(":memory:");
    store.initSession({ id: "s", runtime: "claude-code" });
    const o = store.addObservation({ sessionId: "s", type: "feature", title: "T", narrative: "n" });
    store.setObservationJob(o.id, "job-done");

    const seen: { event: string; data: unknown }[] = [];
    const n = await runReconcileOnce({
      store,
      durable: durableWith({ "job-done": { state: "done", blobId: "REALBLOB" } }),
      broadcast: (event, data) => seen.push({ event, data }),
    });

    expect(n).toBe(1);
    expect(store.getObservation(o.id)?.blobId).toBe("REALBLOB");
    expect(store.findPendingDurable(10)).toHaveLength(0);
    expect(seen).toContainEqual({
      event: "observation_stored",
      data: { id: o.id, blobId: "REALBLOB" },
    });
    store.close();
  });

  it("leaves a still-pending job for the next pass", async () => {
    const store = new WorkerStore(":memory:");
    store.initSession({ id: "s", runtime: "claude-code" });
    const o = store.addObservation({ sessionId: "s", type: "feature", title: "T", narrative: "n" });
    store.setObservationJob(o.id, "job-pending");

    const n = await runReconcileOnce({
      store,
      durable: durableWith({ "job-pending": { state: "pending" } }),
    });
    expect(n).toBe(0);
    expect(store.findPendingDurable(10)).toHaveLength(1);
    store.close();
  });

  it("drops a failed job so it stops being polled (stays local-only)", async () => {
    const store = new WorkerStore(":memory:");
    store.initSession({ id: "s", runtime: "claude-code" });
    const sum = store.addSummary({ sessionId: "s", request: "r" });
    store.setSummaryJob(sum.id, "job-failed");

    await runReconcileOnce({
      store,
      durable: durableWith({ "job-failed": { state: "failed" } }),
    });
    expect(store.findPendingDurable(10)).toHaveLength(0);
    expect(store.getSummary(sum.id)?.blobId).toBeNull();
    store.close();
  });

  it("keeps the job pending when status() throws (transient relayer error)", async () => {
    const store = new WorkerStore(":memory:");
    store.initSession({ id: "s", runtime: "claude-code" });
    const o = store.addObservation({ sessionId: "s", type: "feature", title: "T", narrative: "n" });
    store.setObservationJob(o.id, "job-err");

    const durable: DurableStore = {
      available: () => true,
      write: async () => "x",
      status: async () => {
        throw new Error("relayer 503");
      },
      recall: async () => [],
    };
    const n = await runReconcileOnce({ store, durable });
    expect(n).toBe(0);
    expect(store.findPendingDurable(10)).toHaveLength(1);
    store.close();
  });
});
