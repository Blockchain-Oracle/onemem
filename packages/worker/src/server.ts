// The local worker's HTTP daemon. Binds 127.0.0.1 only — it serves your private
// observations. Hooks POST tool calls here on the hot path; the worker writes
// them to the local store synchronously and PUSHES them to any connected
// dashboard over SSE (real push, not a poll).

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddObservationInput, InitSessionInput, Observation, WorkerStore } from "./store.js";

export interface WorkerServerOptions {
  readonly store: WorkerStore;
  readonly host?: string;
  readonly port?: number;
}

export interface WorkerServer {
  listen(): Promise<{ host: string; port: number }>;
  close(): Promise<void>;
  broadcast(event: string, data: unknown): void;
  sseClientCount(): number;
}

export function createWorkerServer(opts: WorkerServerOptions): WorkerServer {
  const { store } = opts;
  const host = opts.host ?? "127.0.0.1";
  const desiredPort = opts.port ?? 4041;
  const sseClients = new Set<ServerResponse>();

  function broadcast(event: string, data: unknown): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of sseClients) res.write(payload);
  }

  async function readJson<T>(req: IncomingMessage): Promise<T> {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const raw = Buffer.concat(chunks).toString("utf8");
    return (raw ? JSON.parse(raw) : {}) as T;
  }

  function json(res: ServerResponse, status: number, body: unknown): void {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  }

  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://${host}`);
    const path = url.pathname;
    const method = req.method ?? "GET";

    void (async () => {
      if (method === "GET" && path === "/health") {
        return json(res, 200, { ok: true, sseClients: sseClients.size });
      }

      if (method === "GET" && path === "/stream") {
        res.writeHead(200, {
          "content-type": "text/event-stream",
          "cache-control": "no-cache",
          connection: "keep-alive",
        });
        res.write("event: connected\ndata: {}\n\n");
        sseClients.add(res);
        req.on("close", () => sseClients.delete(res));
        return;
      }

      if (method === "POST" && path === "/api/sessions/init") {
        const session = store.initSession(await readJson<InitSessionInput>(req));
        broadcast("session", session);
        return json(res, 200, session);
      }

      if (method === "POST" && path === "/api/sessions/end") {
        const input = await readJson<{ id?: string; endedAt?: number }>(req);
        if (!input.id) return json(res, 400, { error: "id is required" });
        store.endSession(input.id, input.endedAt);
        const session = store.getSession(input.id);
        if (!session) return json(res, 404, { error: "session not found" });
        broadcast("session_ended", session);
        return json(res, 200, session);
      }

      if (method === "POST" && path === "/api/sessions/observations") {
        const observation: Observation = store.addObservation(
          await readJson<AddObservationInput>(req),
        );
        // Hot path: pushed to the dashboard instantly.
        broadcast("new_observation", observation);
        return json(res, 200, observation);
      }

      if (method === "GET" && path === "/api/observations") {
        const sessionId = url.searchParams.get("session") ?? undefined;
        return json(res, 200, { observations: store.listObservations(sessionId) });
      }

      if (method === "GET" && path === "/api/sessions") {
        return json(res, 200, { sessions: store.listSessions() });
      }

      json(res, 404, { error: "not found" });
    })().catch((err) => {
      json(res, 500, { error: err instanceof Error ? err.message : String(err) });
    });
  });

  return {
    listen: () =>
      new Promise((resolve) => {
        server.listen(desiredPort, host, () => {
          const addr = server.address();
          const port = typeof addr === "object" && addr ? addr.port : desiredPort;
          resolve({ host, port });
        });
      }),
    close: () =>
      new Promise((resolve) => {
        for (const client of sseClients) client.end();
        sseClients.clear();
        server.close(() => resolve());
      }),
    broadcast,
    sseClientCount: () => sseClients.size,
  };
}
