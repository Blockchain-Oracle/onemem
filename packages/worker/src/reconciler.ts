// The background proof reconciler. It runs OFF the hot path: it drains
// observations the hooks captured locally (proof_status 'local'/'failed'),
// anchors each on-chain, and flips its proof_status to 'anchored', pushing the
// update so the dashboard's proof badge upgrades live. The on-chain anchor is
// injected (an AnchorFn) so this logic is unit-testable without a signer/network
// and so the same reconciler works for any runtime.

import type { Observation, WorkerStore } from "./store.js";

export interface AnchorResult {
  readonly callId: string;
  readonly txDigest: string;
}

/** Anchors one observation on-chain (e.g. SDK traces.appendCall) and returns its ids. */
export type AnchorFn = (observation: Observation) => Promise<AnchorResult>;

export interface ReconcileOptions {
  readonly store: WorkerStore;
  readonly anchor: AnchorFn;
  /** Called after every proof_status change so the daemon can SSE-push it. */
  readonly onUpdate?: (observation: Observation) => void;
  readonly batchSize?: number;
}

/**
 * Process one batch of pending observations. Each is marked 'queued' (so it
 * isn't double-anchored mid-flight), anchored, then marked 'anchored' — or
 * 'failed' (retryable) if anchoring throws. Returns the count anchored.
 * Callers must not run this concurrently with itself.
 */
export async function reconcileOnce(opts: ReconcileOptions): Promise<number> {
  const { store, anchor, onUpdate, batchSize = 25 } = opts;
  const pending = store.pendingProof(batchSize);
  let anchored = 0;

  for (const observation of pending) {
    const queued = store.setProofStatus(observation.id, "queued");
    if (queued) onUpdate?.(queued);
    try {
      const { callId, txDigest } = await anchor(observation);
      const done = store.setProofStatus(observation.id, "anchored", { callId, txDigest });
      if (done) onUpdate?.(done);
      anchored += 1;
    } catch {
      const failed = store.setProofStatus(observation.id, "failed");
      if (failed) onUpdate?.(failed);
    }
  }

  return anchored;
}
