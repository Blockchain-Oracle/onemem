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

/** Write each fresh observation durably to MemWal and backfill its blob ref. Best-effort. */
async function persistObservationsDurably(
  result: ObserverRunResult,
  store: WorkerStoreType,
  durable: DurableStore,
  server: WorkerServer,
  logger: WorkerLogger,
): Promise<void> {
  const session = store.getSession(result.sessionId);
  const namespace = projectNamespace(session?.project);
  for (const obs of result.observations) {
    if (obs.blobId) continue;
    try {
      const ref = await durable.write(observationText(obs), namespace);
      store.setObservationBlob(obs.id, ref);
      server.broadcast("observation_stored", { id: obs.id, blobId: ref });
    } catch (err) {
      logger.warn(
        `[durable] observation ${obs.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}

/** Write a fresh summary durably to MemWal and backfill its blob ref. Best-effort. */
async function persistSummaryDurably(
  summary: Summary,
  store: WorkerStoreType,
  durable: DurableStore,
  server: WorkerServer,
  logger: WorkerLogger,
): Promise<void> {
  if (summary.blobId) return;
  const session = store.getSession(summary.sessionId);
  const namespace = projectNamespace(session?.project);
  try {
    const ref = await durable.write(summaryText(summary), namespace);
    store.setSummaryBlob(summary.id, ref);
    server.broadcast("summary_stored", { id: summary.id, blobId: ref });
  } catch (err) {
    logger.warn(
      `[durable] summary ${summary.id}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
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
        if (durable?.available()) {
          await persistObservationsDurably(result, store, durable, server, logger);
        }
        schedule(0); // drained an event batch; check for more immediately
        return;
      }
      // No pending events — summarize a closed session that still needs one.
      const summary = await runSummaryOnce({ store, backend, broadcast: server.broadcast });
      if (summary && durable?.available()) {
        await persistSummaryDurably(summary, store, durable, server, logger);
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

  return {
    host,
    port,
    store,
    server,
    observerBackend: backend ?? null,
    durable: durable ?? null,
    async stop() {
      stopObserver?.();
      await server.close();
      store.close();
    },
  };
}
