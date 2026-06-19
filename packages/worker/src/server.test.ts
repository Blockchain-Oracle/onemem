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

  async function start(): Promise<string> {
    store = new WorkerStore(":memory:");
    server = createWorkerServer({ store, port: 0 });
    const { port } = await server.listen();
    return `http://127.0.0.1:${port}`;
  }

  it("ingests tool calls over HTTP and reads them back", async () => {
    const base = await start();
    const init = (await (
      await fetch(`${base}/api/sessions/init`, {
        method: "POST",
        body: JSON.stringify({ id: "s1", runtime: "claude-code" }),
      })
    ).json()) as { id: string };
    expect(init.id).toBe("s1");

    await fetch(`${base}/api/sessions/observations`, {
      method: "POST",
      body: JSON.stringify({
        sessionId: "s1",
        type: "tool_use",
        toolName: "Bash",
        inputPreview: "ls",
      }),
    });

    const read = (await (await fetch(`${base}/api/observations?session=s1`)).json()) as {
      observations: { toolName: string; proofStatus: string }[];
    };
    expect(read.observations).toHaveLength(1);
    const first = read.observations[0];
    expect(first?.toolName).toBe("Bash");
    expect(first?.proofStatus).toBe("local");
  });

  it("ends sessions over HTTP and broadcasts the session end", async () => {
    const base = await start();
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

  it("pushes new observations to a connected SSE client in real time", async () => {
    const base = await start();
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

    // Initial connection frame proves the client is registered before we POST.
    const first = await reader.read();
    expect(decoder.decode(first.value)).toContain("connected");

    await fetch(`${base}/api/sessions/observations`, {
      method: "POST",
      body: JSON.stringify({ sessionId: "s1", type: "tool_use", toolName: "Read" }),
    });

    let buf = "";
    while (!buf.includes("new_observation")) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) buf += decoder.decode(value);
    }
    expect(buf).toContain("new_observation");
    expect(buf).toContain("Read");

    controller.abort();
    await reader.cancel().catch(() => {});
  });
});
