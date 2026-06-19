import { describe, expect, it } from "vitest";
import { type RunningWorker, startWorker } from "./index.js";

describe("startWorker", () => {
  it("boots a local daemon that ingests + serves observations", async () => {
    let worker: RunningWorker | null = null;
    try {
      worker = await startWorker({ port: 0, logger: { info: () => {}, warn: () => {} } });
      const base = `http://${worker.host}:${worker.port}`;

      expect((await (await fetch(`${base}/health`)).json()) as { ok: boolean }).toMatchObject({
        ok: true,
      });

      await fetch(`${base}/api/sessions/init`, {
        method: "POST",
        body: JSON.stringify({ id: "s", runtime: "claude-code" }),
      });
      await fetch(`${base}/api/sessions/observations`, {
        method: "POST",
        body: JSON.stringify({ sessionId: "s", type: "tool_use", toolName: "Bash" }),
      });

      const read = (await (await fetch(`${base}/api/observations?session=s`)).json()) as {
        observations: { toolName: string }[];
      };
      expect(read.observations).toHaveLength(1);
      expect(read.observations[0]?.toolName).toBe("Bash");
    } finally {
      await worker?.stop();
    }
  });
});
