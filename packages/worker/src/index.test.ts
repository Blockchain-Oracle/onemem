import { describe, expect, it } from "vitest";
import type { DurableStore } from "./durable.js";
import { type RunningWorker, startWorker } from "./index.js";
import type { ObserverBackend } from "./observer.js";

const fakeBackend: ObserverBackend = {
  name: "fake",
  available: async () => true,
  compress: async () =>
    JSON.stringify({
      observations: [
        {
          type: "discovery",
          title: "Ran a command",
          subtitle: "",
          facts: [],
          narrative: "listed files",
          concepts: ["how-it-works"],
          files_read: [],
          files_modified: [],
        },
      ],
    }),
};

const fakeDurable: DurableStore = {
  available: () => true,
  write: async () => "job_fake_123",
  recall: async () => [{ text: "Past work: built the observer", distance: 0.2, blobId: "b1" }],
};

async function waitFor<T>(
  fn: () => Promise<T>,
  pred: (v: T) => boolean,
  timeoutMs = 3000,
): Promise<T> {
  const start = Date.now();
  let last = await fn();
  while (!pred(last)) {
    if (Date.now() - start > timeoutMs) return last;
    await new Promise((r) => setTimeout(r, 20));
    last = await fn();
  }
  return last;
}

describe("startWorker", () => {
  it("ingests raw events and compresses them via the observer loop", async () => {
    let worker: RunningWorker | null = null;
    try {
      worker = await startWorker({
        port: 0,
        logger: { info: () => {}, warn: () => {} },
        observerBackend: fakeBackend,
        durableStore: null,
        observerIntervalMs: 20,
      });
      const base = `http://${worker.host}:${worker.port}`;

      expect((await (await fetch(`${base}/health`)).json()) as { ok: boolean }).toMatchObject({
        ok: true,
      });

      await fetch(`${base}/api/sessions/init`, {
        method: "POST",
        body: JSON.stringify({ id: "s", runtime: "claude-code" }),
      });
      await fetch(`${base}/api/events`, {
        method: "POST",
        body: JSON.stringify({ sessionId: "s", toolName: "Bash", outputPreview: "a.ts b.ts" }),
      });

      // Compression is async (off the hot path) — poll until the card lands.
      const read = await waitFor(
        async () =>
          (await (await fetch(`${base}/api/observations?session=s`)).json()) as {
            observations: { title: string; type: string }[];
          },
        (v) => v.observations.length >= 1,
      );
      expect(read.observations).toHaveLength(1);
      expect(read.observations[0]?.type).toBe("discovery");
      expect(read.observations[0]?.title).toBe("Ran a command");
    } finally {
      await worker?.stop();
    }
  });

  it("boots fine with no observer backend (raw capture, no compression)", async () => {
    let worker: RunningWorker | null = null;
    try {
      worker = await startWorker({
        port: 0,
        logger: { info: () => {}, warn: () => {} },
        observerBackend: null,
        durableStore: null,
      });
      const base = `http://${worker.host}:${worker.port}`;
      await fetch(`${base}/api/sessions/init`, {
        method: "POST",
        body: JSON.stringify({ id: "s", runtime: "claude-code" }),
      });
      await fetch(`${base}/api/events`, {
        method: "POST",
        body: JSON.stringify({ sessionId: "s", toolName: "Bash" }),
      });
      const health = (await (await fetch(`${base}/health`)).json()) as { pendingEvents: number };
      expect(health.pendingEvents).toBe(1); // raw event kept; nothing compresses it
    } finally {
      await worker?.stop();
    }
  });

  it("writes observations durably and serves recall from the durable store", async () => {
    let worker: RunningWorker | null = null;
    try {
      worker = await startWorker({
        port: 0,
        logger: { info: () => {}, warn: () => {} },
        observerBackend: fakeBackend,
        durableStore: fakeDurable,
        observerIntervalMs: 20,
      });
      const base = `http://${worker.host}:${worker.port}`;
      await fetch(`${base}/api/sessions/init`, {
        method: "POST",
        body: JSON.stringify({ id: "s", runtime: "claude-code", projectPath: "/repo/onemem" }),
      });
      await fetch(`${base}/api/events`, {
        method: "POST",
        body: JSON.stringify({ sessionId: "s", toolName: "Bash", outputPreview: "x" }),
      });

      // observation compresses, then its durable blob ref is backfilled
      const read = await waitFor(
        async () =>
          (await (await fetch(`${base}/api/observations?session=s`)).json()) as {
            observations: { blobId: string | null }[];
          },
        (v) => v.observations.length >= 1 && v.observations[0]?.blobId === "job_fake_123",
      );
      expect(read.observations[0]?.blobId).toBe("job_fake_123");

      // recall is served from the durable store, scoped to the project namespace
      const recall = (await (
        await fetch(`${base}/api/recall?q=observer&project=onemem&limit=3`)
      ).json()) as { results: { text: string }[] };
      expect(recall.results[0]?.text).toContain("built the observer");
    } finally {
      await worker?.stop();
    }
  });
});
