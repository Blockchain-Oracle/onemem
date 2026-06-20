import { describe, expect, it } from "vitest";
import { WorkerStore } from "./store.js";

describe("WorkerStore", () => {
  it("captures tool calls instantly on the hot path", () => {
    const store = new WorkerStore(":memory:");
    store.initSession({ id: "cc-1", runtime: "claude-code", namespaceId: "0xns" });

    // Hot path: each tool call lands immediately.
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

    // Live read — the order the dashboard would render mid-session.
    expect(store.listObservations("cc-1").map((o) => o.toolName)).toEqual(["Bash", "Read"]);

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
