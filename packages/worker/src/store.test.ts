import { describe, expect, it } from "vitest";
import { WorkerStore } from "./store.js";

describe("WorkerStore", () => {
  it("captures tool calls instantly and reconciles proof status asynchronously", () => {
    const store = new WorkerStore(":memory:");
    store.initSession({ id: "cc-1", runtime: "claude-code", namespaceId: "0xns" });

    // Hot path: each tool call lands immediately with proof_status 'local'.
    const o1 = store.addObservation({
      sessionId: "cc-1",
      type: "tool_use",
      toolName: "Bash",
      inputPreview: "ls",
    });
    const o2 = store.addObservation({
      sessionId: "cc-1",
      type: "tool_use",
      toolName: "Read",
      inputPreview: "file.ts",
    });
    expect(o1.seq).toBe(1);
    expect(o2.seq).toBe(2);
    expect(o1.proofStatus).toBe("local");

    // Live read — the order the dashboard would render mid-session.
    expect(store.listObservations("cc-1").map((o) => o.toolName)).toEqual(["Bash", "Read"]);

    // Both await anchoring; the reconciler picks them up.
    expect(store.pendingProof().map((o) => o.id)).toEqual([o1.id, o2.id]);

    // Async on-chain settlement flips the badge local → anchored → verified.
    const anchored = store.setProofStatus(o1.id, "anchored", {
      callId: "0xcall",
      txDigest: "0xtx",
    });
    expect(anchored?.proofStatus).toBe("anchored");
    expect(anchored?.callId).toBe("0xcall");
    expect(anchored?.txDigest).toBe("0xtx");

    store.setProofStatus(o1.id, "verified");
    expect(store.getObservation(o1.id)?.proofStatus).toBe("verified");
    // setting verified without meta must NOT wipe the earlier callId/txDigest
    expect(store.getObservation(o1.id)?.callId).toBe("0xcall");

    // o2 is still pending; o1 is done.
    expect(store.pendingProof().map((o) => o.id)).toEqual([o2.id]);

    // Closing the session is durable.
    store.endSession("cc-1");
    expect(store.getSession("cc-1")?.status).toBe("closed");
    expect(store.getSession("cc-1")?.endedAt).not.toBeNull();

    store.close();
  });

  it("scopes seq per session and lists sessions newest-first", () => {
    const store = new WorkerStore(":memory:");
    store.initSession({ id: "a", runtime: "claude-code", startedAt: 1000 });
    store.initSession({ id: "b", runtime: "codex", startedAt: 2000 });
    const a1 = store.addObservation({ sessionId: "a", type: "tool_use", toolName: "X" });
    const b1 = store.addObservation({ sessionId: "b", type: "tool_use", toolName: "Y" });
    // independent seq counters per session
    expect(a1.seq).toBe(1);
    expect(b1.seq).toBe(1);
    // newest session first
    expect(store.listSessions().map((s) => s.id)).toEqual(["b", "a"]);
    store.close();
  });

  it("idempotent initSession updates metadata without losing the onemem session id", () => {
    const store = new WorkerStore(":memory:");
    store.initSession({ id: "s", runtime: "claude-code", onememSessionId: "0xopen" });
    // a later SessionStart (e.g. resume) without the onemem id must not clobber it
    store.initSession({ id: "s", runtime: "claude-code", projectPath: "/repo" });
    const s = store.getSession("s");
    expect(s?.onememSessionId).toBe("0xopen");
    expect(s?.projectPath).toBe("/repo");
    store.close();
  });
});
