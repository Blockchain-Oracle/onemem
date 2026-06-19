// @onemem/worker entry. Assembles the tested pieces into a runnable local
// daemon: the SQLite store + the 127.0.0.1 HTTP/SSE server + a periodic
// reconcile loop. The on-chain anchor is injected — when none is provided the
// daemon runs in LOCAL-ONLY mode (observations are captured + streamed live but
// stay proof_status 'local'); wiring the SDK appendCall as the anchor turns on
// the local→anchored→verified badge flow without changing anything else.

import { type AnchorFn, reconcileOnce } from "./reconciler.js";
import { createWorkerServer, type WorkerServer } from "./server.js";
import { WorkerStore } from "./store.js";

export type { SdkAnchorConfig, TraceWriter } from "./anchor.js";
export { createSdkAnchor } from "./anchor.js";
export type { AnchorFn, AnchorResult, ReconcileOptions } from "./reconciler.js";
export { reconcileOnce } from "./reconciler.js";
export type { WorkerServer, WorkerServerOptions } from "./server.js";
export { createWorkerServer } from "./server.js";
export * from "./store.js";

export interface WorkerLogger {
  info(message: string): void;
  warn(message: string): void;
}

export interface StartWorkerOptions {
  readonly host?: string;
  readonly port?: number;
  readonly dbPath?: string;
  /** On-chain anchor; omit to run local-only (no proof reconciliation). */
  readonly anchor?: AnchorFn;
  readonly reconcileIntervalMs?: number;
  readonly logger?: WorkerLogger;
}

export interface RunningWorker {
  readonly host: string;
  readonly port: number;
  readonly store: WorkerStore;
  readonly server: WorkerServer;
  stop(): Promise<void>;
}

const defaultLogger: WorkerLogger = {
  info: (m) => process.stderr.write(`${m}\n`),
  warn: (m) => process.stderr.write(`${m}\n`),
};

export async function startWorker(opts: StartWorkerOptions = {}): Promise<RunningWorker> {
  const logger = opts.logger ?? defaultLogger;
  const store = new WorkerStore(opts.dbPath ?? ":memory:");
  const server = createWorkerServer({ store, host: opts.host, port: opts.port });
  const { host, port } = await server.listen();

  let timer: ReturnType<typeof setInterval> | null = null;
  const { anchor } = opts;
  if (anchor) {
    const intervalMs = opts.reconcileIntervalMs ?? 3000;
    let running = false;
    timer = setInterval(() => {
      if (running) return; // never overlap reconcile passes
      running = true;
      reconcileOnce({ store, anchor, onUpdate: (o) => server.broadcast("proof_update", o) })
        .catch((e) =>
          logger.warn(`[worker] reconcile error: ${e instanceof Error ? e.message : String(e)}`),
        )
        .finally(() => {
          running = false;
        });
    }, intervalMs);
    timer.unref?.();
  }

  logger.info(
    `[worker] listening on http://${host}:${port} — anchor ${anchor ? "ON" : "OFF (local-only)"}`,
  );

  return {
    host,
    port,
    store,
    server,
    async stop() {
      if (timer) clearInterval(timer);
      await server.close();
      store.close();
    },
  };
}
