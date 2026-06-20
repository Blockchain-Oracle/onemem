// The durable-write reconciler. The relayer's remember() returns a job_id in
// ~1s, but the real Walrus blob lands 1-3 min later (and can outlive a single
// in-process wait). This loop polls each in-flight job's status and backfills the
// REAL blob id — so the dashboard's explorer link only appears once the blob
// genuinely exists, and a slow upload (or a worker restart) can't leave a memory
// stuck "saving" forever (it's reconciled from the persisted job_id on next tick).

import type { DurableStore } from "./durable.js";
import type { WorkerStore } from "./store.js";

export interface ReconcileDeps {
  readonly store: WorkerStore;
  readonly durable: DurableStore;
  readonly broadcast?: (event: string, data: unknown) => void;
  readonly limit?: number;
}

/** One reconcile pass over in-flight durable jobs. Returns how many resolved. */
export async function runReconcileOnce(deps: ReconcileDeps): Promise<number> {
  const { store, durable, broadcast } = deps;
  const pending = store.findPendingDurable(deps.limit ?? 50);
  let resolved = 0;

  for (const p of pending) {
    let result: Awaited<ReturnType<DurableStore["status"]>>;
    try {
      result = await durable.status(p.jobId);
    } catch {
      continue; // transient relayer error — leave pending, retry next tick
    }

    if (result.state === "done" && result.blobId) {
      if (p.kind === "observation") {
        store.setObservationBlob(p.id, result.blobId);
        broadcast?.("observation_stored", { id: p.id, blobId: result.blobId });
      } else {
        store.setSummaryBlob(p.id, result.blobId);
        broadcast?.("summary_stored", { id: p.id, blobId: result.blobId });
      }
      resolved++;
    } else if (result.state === "failed") {
      // Give up so it stops being polled; the memory stays local-only (honest).
      if (p.kind === "observation") store.setObservationJob(p.id, null);
      else store.setSummaryJob(p.id, null);
    }
    // "pending" → leave it for the next pass
  }

  return resolved;
}
