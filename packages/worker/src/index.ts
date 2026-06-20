// @onemem/worker entry. Assembles the tested pieces into a runnable local
// daemon: SQLite store + 127.0.0.1 HTTP/SSE server + observer loop + durable
// MemWal store. Hooks POST raw tool calls on the hot path; the worker writes
// them to local SQLite and SSE-pushes a processing_status instantly (the "alive"
// feel). A background loop compresses batches into readable observation cards
// (via the user's own coding CLI — zero key), summarizes closed sessions, and
// writes both durably to MemWal/Walrus (relayer TEE — also zero key).

import {
  type DurableStore,
  makeDurableStore,
  observationText,
  projectNamespace,
  summaryText,
} from "./durable.js";
import { type ObserverBackend, type ObserverRunResult, runObserverOnce } from "./observer.js";
import { selectObserverBackend } from "./observer-backends.js";
import { runReconcileOnce } from "./reconciler.js";
import { createWorkerServer, type WorkerServer } from "./server.js";
import type { Summary, WorkerStore as WorkerStoreType } from "./store.js";
import { WorkerStore } from "./store.js";
import { runSummaryOnce } from "./summarizer.js";

export * from "./durable.js";
export * from "./observer.js";
export {
  CodexBackend,
  KeyBackend,
  selectObserverBackend,
} from "./observer-backends.js";
export * from "./reconciler.js";
export type { WorkerServer, WorkerServerOptions } from "./server.js";
export { createWorkerServer } from "./server.js";
export * from "./store.js";
export * from "./summarizer.js";

export interface WorkerLogger {
  info(message: string): void;
  warn(message: string): void;
}

export interface StartWorkerOptions {
  readonly host?: string;
  readonly port?: number;
  readonly dbPath?: string;
  readonly logger?: WorkerLogger;
  /**
   * Observer backend: provide one to inject (tests), `null` to disable
   * compression (raw capture only), or omit to auto-select the user's CLI.
   */
  readonly observerBackend?: ObserverBackend | null;
  /**
   * Durable store: provide one to inject (tests), `null` to disable durable
   * writes (local only), or omit to auto-resolve MemWal from env/credentials.
   */
  readonly durableStore?: DurableStore | null;
  readonly observerIntervalMs?: number;
  readonly observerBatchSize?: number;
  readonly reconcilerIntervalMs?: number;
}

export interface RunningWorker {
  readonly host: string;
  readonly port: number;
  readonly store: WorkerStore;
  readonly server: WorkerServer;
  readonly observerBackend: ObserverBackend | null;
  readonly durable: DurableStore | null;
  stop(): Promise<void>;
}

const defaultLogger: WorkerLogger = {
  info: (m) => process.stderr.write(`${m}\n`),
  warn: (m) => process.stderr.write(`${m}\n`),
};

/**
 * Enqueue each fresh observation for durable MemWal storage and record the job
 * id. Detached/best-effort (remember() returns in ~1s); the reconciler later
 * backfills the REAL Walrus blob id from the job id — so a slow upload or a
 * restart can't lose the link.
 */
function persistObservationsDurably(
  result: ObserverRunResult,
  store: WorkerStoreType,
  durable: DurableStore,
  logger: WorkerLogger,
): void {
  const session = store.getSession(result.sessionId);
  const namespace = projectNamespace(session?.project);
  for (const obs of result.observations) {
    if (obs.blobId) continue;
    void durable
      .write(observationText(obs), namespace)
      .then((jobId) => store.setObservationJob(obs.id, jobId))
      .catch((err) =>
        logger.warn(
          `[durable] observation ${obs.id}: ${err instanceof Error ? err.message : String(err)}`,
        ),
      );
  }
}

/** Enqueue a fresh summary for durable storage and record its job id. Detached. */
function persistSummaryDurably(
  summary: Summary,
  store: WorkerStoreType,
  durable: DurableStore,
  logger: WorkerLogger,
): void {
  if (summary.blobId) return;
  const session = store.getSession(summary.sessionId);
  const namespace = projectNamespace(session?.project);
  void durable
    .write(summaryText(summary), namespace)
    .then((jobId) => store.setSummaryJob(summary.id, jobId))
    .catch((err) =>
      logger.warn(
        `[durable] summary ${summary.id}: ${err instanceof Error ? err.message : String(err)}`,
      ),
    );
}

/**
 * The reconciler loop: poll in-flight durable jobs and backfill the real Walrus
 * blob id once each lands (broadcasting observation_stored/summary_stored). This
 * is what makes the explorer link reliably appear; it survives restarts because
 * the job id is persisted in SQLite.
 */
function startReconcileLoop(
  store: WorkerStore,
  server: WorkerServer,
  durable: DurableStore,
  logger: WorkerLogger,
  intervalMs: number,
): () => void {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  async function tick(): Promise<void> {
    if (stopped) return;
    try {
      await runReconcileOnce({ store, durable, broadcast: server.broadcast });
    } catch (err) {
      logger.warn(`[reconciler] ${err instanceof Error ? err.message : String(err)}`);
    }
    if (!stopped) timer = setTimeout(() => void tick(), intervalMs);
  }

  timer = setTimeout(() => void tick(), intervalMs);
  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}

/**
 * The observer loop: drain the pending-event queue in batches, summarize closed
 * sessions, and write both durably to MemWal. Drains greedily while there's
 * work, idles at `intervalMs`, and backs off on error. Returns a stop function.
 */
function startObserverLoop(
  store: WorkerStore,
  server: WorkerServer,
  backend: ObserverBackend,
  durable: DurableStore | null,
  logger: WorkerLogger,
  intervalMs: number,
  batchSize: number,
): () => void {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const schedule = (ms: number): void => {
    if (stopped) return;
    timer = setTimeout(() => {
      void tick();
    }, ms);
  };

  async function tick(): Promise<void> {
    if (stopped) return;
    try {
      const result = await runObserverOnce({
        store,
        backend,
        broadcast: server.broadcast,
        batchSize,
      });
      if (result !== null) {
        // Fire-and-forget: enqueue durable writes without blocking the loop.
        if (durable?.available()) persistObservationsDurably(result, store, durable, logger);
        schedule(0); // drained an event batch; check for more immediately
        return;
      }
      // No pending events — summarize a closed session that still needs one.
      const summary = await runSummaryOnce({ store, backend, broadcast: server.broadcast });
      if (summary && durable?.available()) {
        persistSummaryDurably(summary, store, durable, logger);
      }
      schedule(summary ? 0 : intervalMs);
    } catch (err) {
      logger.warn(`[observer] ${err instanceof Error ? err.message : String(err)}`);
      schedule(intervalMs * 5); // back off on error; work stays pending/un-summarized
    }
  }

  schedule(intervalMs);
  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}

export async function startWorker(opts: StartWorkerOptions = {}): Promise<RunningWorker> {
  const logger = opts.logger ?? defaultLogger;
  const store = new WorkerStore(opts.dbPath ?? ":memory:");

  // Resolve the durable store: injected, explicitly disabled, or auto-resolved.
  const durable = opts.durableStore === undefined ? makeDurableStore() : opts.durableStore;

  const server = createWorkerServer({
    store,
    host: opts.host,
    port: opts.port,
    durable: durable?.available() ?? false,
    recall: durable
      ? (query, project, limit) => durable.recall(query, projectNamespace(project), limit)
      : undefined,
  });
  const { host, port } = await server.listen();
  logger.info(`[worker] listening on http://${host}:${port}`);
  if (durable?.available()) logger.info("[worker] durable: MemWal relayer (zero-key)");

  // Resolve the observer backend: injected, explicitly disabled, or auto-select.
  const backend =
    opts.observerBackend === undefined ? await selectObserverBackend() : opts.observerBackend;

  let stopObserver: (() => void) | null = null;
  if (backend && (await backend.available())) {
    logger.info(`[worker] observer: ${backend.name} (zero-key compression)`);
    stopObserver = startObserverLoop(
      store,
      server,
      backend,
      durable,
      logger,
      opts.observerIntervalMs ?? 1500,
      opts.observerBatchSize ?? 40,
    );
  } else {
    logger.warn("[worker] no observer backend available — raw capture only (no compression)");
  }

  // Reconciler: backfills real Walrus blob ids for in-flight durable writes.
  let stopReconciler: (() => void) | null = null;
  if (durable?.available()) {
    stopReconciler = startReconcileLoop(
      store,
      server,
      durable,
      logger,
      opts.reconcilerIntervalMs ?? 15_000,
    );
  }

  return {
    host,
    port,
    store,
    server,
    observerBackend: backend ?? null,
    durable: durable ?? null,
    async stop() {
      stopObserver?.();
      stopReconciler?.();
      await server.close();
      store.close();
    },
  };
}
