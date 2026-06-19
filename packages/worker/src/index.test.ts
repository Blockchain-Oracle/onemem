import { describe, expect, it, vi } from "vitest";
import { type AnchorResult, type RunningWorker, startWorker } from "./index.js";

describe("startWorker", () => {
  it("boots a local-only daemon that ingests + serves observations", async () => {
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
        observations: { toolName: string; proofStatus: string }[];
      };
      expect(read.observations).toHaveLength(1);
      // local-only mode: captured + live, but not anchored
      expect(read.observations[0]?.proofStatus).toBe("local");
    } finally {
      await worker?.stop();
    }
  });

  it("runs the reconcile loop when an anchor is provided", async () => {
    let worker: RunningWorker | null = null;
    try {
      const anchor = vi.fn(
        async (): Promise<AnchorResult> => ({ callId: "0xcall", txDigest: "0xtx" }),
      );
      worker = await startWorker({
        port: 0,
        anchor,
        reconcileIntervalMs: 20,
        logger: { info: () => {}, warn: () => {} },
      });
      const base = `http://${worker.host}:${worker.port}`;
      await fetch(`${base}/api/sessions/init`, {
        method: "POST",
        body: JSON.stringify({ id: "s", runtime: "claude-code" }),
      });
      await fetch(`${base}/api/sessions/observations`, {
        method: "POST",
        body: JSON.stringify({ sessionId: "s", type: "tool_use", toolName: "Bash" }),
      });

      // the periodic reconciler should anchor it shortly
      await vi.waitFor(
        () => {
          expect(worker?.store.getObservation(1)?.proofStatus).toBe("anchored");
        },
        { timeout: 2000, interval: 25 },
      );
      expect(anchor).toHaveBeenCalled();
    } finally {
      await worker?.stop();
    }
  });
});
