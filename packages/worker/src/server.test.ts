import { afterEach, describe, expect, it } from "vitest";
import { createWorkerServer, type WorkerServer } from "./server.js";
import { WorkerStore } from "./store.js";

describe("worker HTTP daemon", () => {
  let server: WorkerServer | null = null;
  let store: WorkerStore | null = null;

  afterEach(async () => {
    await server?.close();
    store?.close();
    server = null;
    store = null;
  });

  async function start(): Promise<{ base: string; store: WorkerStore }> {
    store = new WorkerStore(":memory:");
    server = createWorkerServer({ store, port: 0 });
    const { port } = await server.listen();
    return { base: `http://127.0.0.1:${port}`, store };
  }

  it("ingests a raw tool call on the hot path and reports queue depth", async () => {
    const { base } = await start();
    await fetch(`${base}/api/sessions/init`, {
      method: "POST",
      body: JSON.stringify({ id: "s1", runtime: "claude-code" }),
    });

    const ev = (await (
      await fetch(`${base}/api/events`, {
        method: "POST",
        body: JSON.stringify({ sessionId: "s1", toolName: "Bash", inputPreview: "ls" }),
      })
    ).json()) as { seq: number; status: string; toolName: string };
    expect(ev.seq).toBe(1);
    expect(ev.status).toBe("pending");
    expect(ev.toolName).toBe("Bash");

    const health = (await (await fetch(`${base}/health`)).json()) as { pendingEvents: number };
    expect(health.pendingEvents).toBe(1);
  });

  it("serves the compressed observations the observer has stored", async () => {
    const { base, store } = await start();
    store.initSession({ id: "s1", runtime: "claude-code" });
    store.addObservation({
      sessionId: "s1",
      type: "bugfix",
      title: "Fixed the leak",
      narrative: "released sockets",
      facts: [],
      concepts: [],
      filesRead: [],
      filesModified: [],
    });

    const read = (await (await fetch(`${base}/api/observations?session=s1`)).json()) as {
      observations: { title: string }[];
    };
    expect(read.observations).toHaveLength(1);
    expect(read.observations[0]?.title).toBe("Fixed the leak");
  });

  it("records and reads back user prompts", async () => {
    const { base } = await start();
    await fetch(`${base}/api/sessions/init`, {
      method: "POST",
      body: JSON.stringify({ id: "s1", runtime: "claude-code" }),
    });
    const p = (await (
      await fetch(`${base}/api/prompts`, {
        method: "POST",
        body: JSON.stringify({ sessionId: "s1", text: "do the thing" }),
      })
    ).json()) as { text: string };
    expect(p.text).toBe("do the thing");

    const read = (await (await fetch(`${base}/api/prompts?session=s1`)).json()) as {
      prompts: { text: string }[];
    };
    expect(read.prompts).toHaveLength(1);
  });

  it("ends sessions over HTTP and broadcasts the session end", async () => {
    const { base } = await start();
    await fetch(`${base}/api/sessions/init`, {
      method: "POST",
      body: JSON.stringify({ id: "s1", runtime: "claude-code" }),
    });

    const controller = new AbortController();
    const res = await fetch(`${base}/stream`, { signal: controller.signal });
    const body = res.body;
    if (!body) throw new Error("no SSE body");
    const reader = body.getReader();
    const decoder = new TextDecoder();
    const first = await reader.read();
    expect(decoder.decode(first.value)).toContain("connected");

    const ended = (await (
      await fetch(`${base}/api/sessions/end`, {
        method: "POST",
        body: JSON.stringify({ id: "s1", endedAt: 1234 }),
      })
    ).json()) as { id: string; status: string; endedAt: number };
    expect(ended).toMatchObject({ id: "s1", status: "closed", endedAt: 1234 });

    let buf = "";
    while (!buf.includes("session_ended")) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) buf += decoder.decode(value);
    }
    expect(buf).toContain("session_ended");
    expect(buf).toContain("closed");

    controller.abort();
    await reader.cancel().catch(() => {});
  });

  it("pushes a processing_status update to a connected SSE client when a tool call lands", async () => {
    const { base } = await start();
    await fetch(`${base}/api/sessions/init`, {
      method: "POST",
      body: JSON.stringify({ id: "s1", runtime: "claude-code" }),
    });

    const controller = new AbortController();
    const res = await fetch(`${base}/stream`, { signal: controller.signal });
    const body = res.body;
    if (!body) throw new Error("no SSE body");
    const reader = body.getReader();
    const decoder = new TextDecoder();
    const first = await reader.read();
    expect(decoder.decode(first.value)).toContain("connected");

    await fetch(`${base}/api/events`, {
      method: "POST",
      body: JSON.stringify({ sessionId: "s1", toolName: "Read" }),
    });

    let buf = "";
    while (!buf.includes("processing_status")) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) buf += decoder.decode(value);
    }
    expect(buf).toContain("processing_status");
    expect(buf).toContain("queueDepth");

    controller.abort();
    await reader.cancel().catch(() => {});
  });
});
