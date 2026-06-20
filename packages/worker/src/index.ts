// @onemem/worker entry. Assembles the tested pieces into a runnable local
// daemon: the SQLite store + the 127.0.0.1 HTTP/SSE server. Hooks POST tool
// calls here on the hot path; they're written to the local store and streamed
// to the dashboard over SSE live (the claude-mem "alive" model).

import { createWorkerServer, type WorkerServer } from "./server.js";
import { WorkerStore } from "./store.js";

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

  logger.info(`[worker] listening on http://${host}:${port}`);

  return {
    host,
    port,
    store,
    server,
    async stop() {
      await server.close();
      store.close();
    },
  };
}
