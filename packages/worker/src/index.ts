// @onemem/worker entry. Assembles the tested pieces into a runnable local
// daemon: the SQLite store + the 127.0.0.1 HTTP/SSE server + the observer loop.
// Hooks POST raw tool calls on the hot path; the worker writes them to local
// SQLite and SSE-pushes a processing_status instantly (the "alive" feel). A
// background loop then compresses batches into readable observation cards (via
// the user's own coding CLI — zero API key) and broadcasts them as they land.

import { type ObserverBackend, runObserverOnce } from "./observer.js";
import { selectObserverBackend } from "./observer-backends.js";
import { createWorkerServer, type WorkerServer } from "./server.js";
import { WorkerStore } from "./store.js";
import { runSummaryOnce } from "./summarizer.js";

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
  readonly observerIntervalMs?: number;
  readonly observerBatchSize?: number;
}

export interface RunningWorker {
  readonly host: string;
  readonly port: number;
  readonly store: WorkerStore;
  readonly server: WorkerServer;
  readonly observerBackend: ObserverBackend | null;
  stop(): Promise<void>;
}

const defaultLogger: WorkerLogger = {
  info: (m) => process.stderr.write(`${m}\n`),
  warn: (m) => process.stderr.write(`${m}\n`),
};

/**
 * The observer loop: drain the pending-event queue in batches. Drains greedily
 * (schedule 0) while there's work, idles at `intervalMs`, and backs off on
 * error so a transient failure doesn't hot-loop. Returns a stop function.
 */
function startObserverLoop(
  store: WorkerStore,
  server: WorkerServer,
  backend: ObserverBackend,
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
        schedule(0); // drained an event batch; check for more immediately
        return;
      }
      // No pending events — summarize a closed session that still needs one.
      const summary = await runSummaryOnce({ store, backend, broadcast: server.broadcast });
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
  const server = createWorkerServer({ store, host: opts.host, port: opts.port });
  const { host, port } = await server.listen();
  logger.info(`[worker] listening on http://${host}:${port}`);

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
    async stop() {
      stopObserver?.();
      await server.close();
      store.close();
    },
  };
}
