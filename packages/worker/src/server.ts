// The local worker's HTTP daemon. Binds 127.0.0.1 only — it serves your private
// memory. The hot path is POST /api/events: a hook posts a raw tool call, the
// worker writes it to the local SQLite queue synchronously and broadcasts a
// `processing_status` over SSE, so the dashboard's spinner reacts instantly.
// The observer (see observer.ts, driven from index.ts) compresses those events
// into readable observation cards and broadcasts `new_observation` as they land.

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddEventInput, AddPromptInput, InitSessionInput, WorkerStore } from "./store.js";

export interface WorkerServerOptions {
  readonly store: WorkerStore;
  readonly host?: string;
  readonly port?: number;
  /** Semantic recall from the durable store (MemWal); wired by index.ts. */
  readonly recall?: (query: string, project: string | undefined, limit: number) => Promise<unknown>;
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

  function broadcastProcessingStatus(): void {
    const queueDepth = store.pendingEventCount();
    broadcast("processing_status", { isProcessing: queueDepth > 0, queueDepth });
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
    const session = url.searchParams.get("session") ?? undefined;

    void (async () => {
      if (method === "GET" && path === "/health") {
        return json(res, 200, {
          ok: true,
          sseClients: sseClients.size,
          pendingEvents: store.pendingEventCount(),
        });
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
        const result = store.initSession(await readJson<InitSessionInput>(req));
        broadcast("session", result);
        return json(res, 200, result);
      }

      if (method === "POST" && path === "/api/sessions/end") {
        const input = await readJson<{ id?: string; endedAt?: number }>(req);
        if (!input.id) return json(res, 400, { error: "id is required" });
        store.endSession(input.id, input.endedAt);
        const ended = store.getSession(input.id);
        if (!ended) return json(res, 404, { error: "session not found" });
        broadcast("session_ended", ended);
        return json(res, 200, ended);
      }

      // Hot path: a raw tool call. Written instantly; the observer compresses it.
      if (method === "POST" && path === "/api/events") {
        const event = store.addEvent(await readJson<AddEventInput>(req));
        broadcastProcessingStatus();
        return json(res, 200, event);
      }

      if (method === "POST" && path === "/api/prompts") {
        const prompt = store.addPrompt(await readJson<AddPromptInput>(req));
        broadcast("new_prompt", prompt);
        return json(res, 200, prompt);
      }

      if (method === "GET" && path === "/api/observations") {
        return json(res, 200, { observations: store.listObservations(session) });
      }

      if (method === "GET" && path === "/api/summaries") {
        return json(res, 200, { summaries: store.listSummaries(session) });
      }

      if (method === "GET" && path === "/api/prompts") {
        return json(res, 200, { prompts: store.listPrompts(session) });
      }

      if (method === "GET" && path === "/api/sessions") {
        return json(res, 200, { sessions: store.listSessions() });
      }

      // Semantic recall from the durable (MemWal) store, scoped to a project.
      if (method === "GET" && path === "/api/recall") {
        if (!opts.recall) return json(res, 200, { results: [] });
        const query = url.searchParams.get("q") ?? "";
        const project = url.searchParams.get("project") ?? undefined;
        const limit = Number(url.searchParams.get("limit") ?? "5") || 5;
        return json(res, 200, { results: await opts.recall(query, project, limit) });
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
