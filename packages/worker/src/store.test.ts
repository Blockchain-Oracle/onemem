import { describe, expect, it } from "vitest";
import { WorkerStore } from "./store.js";

describe("WorkerStore — raw event queue (the alive hot path)", () => {
  it("captures a raw tool call instantly as a pending event with a per-session seq", () => {
    const store = new WorkerStore(":memory:");
    store.initSession({ id: "cc-1", runtime: "claude-code" });

    const e1 = store.addEvent({ sessionId: "cc-1", toolName: "Bash", inputPreview: "ls" });
    const e2 = store.addEvent({ sessionId: "cc-1", toolName: "Read", inputPreview: "file.ts" });

    expect(e1.seq).toBe(1);
    expect(e2.seq).toBe(2);
    expect(e1.status).toBe("pending");
    expect(e1.contentHash).toMatch(/^[0-9a-f]{64}$/);
    expect(store.pendingEventCount()).toBe(2);
    store.close();
  });

  it("hands the observer the oldest pending session's batch, then drains it on mark", () => {
    const store = new WorkerStore(":memory:");
    store.initSession({ id: "a", runtime: "claude-code", startedAt: 1000 });
    store.initSession({ id: "b", runtime: "codex", startedAt: 2000 });
    store.addEvent({ sessionId: "a", toolName: "Bash", createdAt: 1001 });
    store.addEvent({ sessionId: "a", toolName: "Read", createdAt: 1002 });
    store.addEvent({ sessionId: "b", toolName: "Edit", createdAt: 1003 });

    // oldest pending event belongs to session "a" → its whole pending batch comes back
    const batch = store.nextPendingBatch(10);
    expect(batch?.sessionId).toBe("a");
    expect(batch?.events.map((e) => e.toolName)).toEqual(["Bash", "Read"]);

    store.markEvents(batch?.events.map((e) => e.id) ?? [], "compressed");
    expect(store.pendingEventCount()).toBe(1);

    // now session "b" is next
    expect(store.nextPendingBatch(10)?.sessionId).toBe("b");
    store.close();
  });

  it("returns null batch when nothing is pending", () => {
    const store = new WorkerStore(":memory:");
    expect(store.nextPendingBatch(10)).toBeNull();
    store.close();
  });
});

describe("WorkerStore — compressed observations (the readable cards)", () => {
  it("stores a structured observation and reads it back with parsed arrays", () => {
    const store = new WorkerStore(":memory:");
    store.initSession({ id: "s", runtime: "claude-code" });

    const obs = store.addObservation({
      sessionId: "s",
      type: "bugfix",
      title: "Fixed Read timeout",
      subtitle: "Connection pool was leaking sockets under load",
      facts: ["The pool max was 10", "Sockets were never released on error"],
      narrative: "Traced the leak to the error path and released sockets in finally.",
      concepts: ["problem-solution", "gotcha"],
      filesRead: ["src/pool.ts"],
      filesModified: ["src/pool.ts"],
    });

    expect(obs.seq).toBe(1);
    expect(obs.type).toBe("bugfix");
    expect(obs.facts).toEqual(["The pool max was 10", "Sockets were never released on error"]);
    expect(obs.concepts).toEqual(["problem-solution", "gotcha"]);
    expect(obs.filesModified).toEqual(["src/pool.ts"]);
    expect(obs.blobId).toBeNull();

    const read = store.listObservations("s");
    expect(read).toHaveLength(1);
    expect(read[0]?.title).toBe("Fixed Read timeout");
    store.close();
  });

  it("dedups observations by content hash so a replayed write is idempotent", () => {
    const store = new WorkerStore(":memory:");
    store.initSession({ id: "s", runtime: "claude-code" });
    const input = {
      sessionId: "s",
      type: "feature" as const,
      title: "Add cost meter",
      narrative: "Added a cost meter to the dashboard.",
      facts: [],
      concepts: ["what-changed"],
      filesRead: [],
      filesModified: ["dashboard/cost.tsx"],
    };
    const a = store.addObservation(input);
    const b = store.addObservation(input);
    expect(b.id).toBe(a.id); // same content → same row, not a duplicate
    expect(store.listObservations("s")).toHaveLength(1);
    store.close();
  });

  it("records the MemWal blob id once the durable write lands", () => {
    const store = new WorkerStore(":memory:");
    store.initSession({ id: "s", runtime: "claude-code" });
    const obs = store.addObservation({
      sessionId: "s",
      type: "discovery",
      title: "Learned the recall format",
      narrative: "It is a markdown timeline.",
      facts: [],
      concepts: ["how-it-works"],
      filesRead: [],
      filesModified: [],
    });
    store.setObservationBlob(obs.id, "blob_abc");
    expect(store.getObservation(obs.id)?.blobId).toBe("blob_abc");
    store.close();
  });
});

describe("WorkerStore — session summaries", () => {
  it("stores a 5-section summary and returns the latest for a project", () => {
    const store = new WorkerStore(":memory:");
    store.initSession({
      id: "s1",
      runtime: "claude-code",
      projectPath: "/repo/onemem",
      startedAt: 10,
    });
    store.addSummary({
      sessionId: "s1",
      request: "Build the observer",
      investigated: "claude-mem source",
      learned: "XML output format",
      completed: "Store redesign",
      nextSteps: "Wire the loop",
      createdAt: 20,
    });

    const latest = store.getLatestSummary("onemem");
    expect(latest?.request).toBe("Build the observer");
    expect(latest?.nextSteps).toBe("Wire the loop");
    store.close();
  });

  it("finds a closed session with observations but no summary", () => {
    const store = new WorkerStore(":memory:");
    store.initSession({ id: "open1", runtime: "claude-code", startedAt: 1 });
    store.addObservation({ sessionId: "open1", type: "feature", title: "T", narrative: "N" });
    expect(store.findSessionNeedingSummary()).toBeNull(); // still open

    store.initSession({ id: "done1", runtime: "claude-code", startedAt: 2 });
    store.addObservation({ sessionId: "done1", type: "bugfix", title: "T2", narrative: "N2" });
    store.endSession("done1", 3);
    expect(store.findSessionNeedingSummary()).toBe("done1");

    store.addSummary({ sessionId: "done1", request: "r" });
    expect(store.findSessionNeedingSummary()).toBeNull(); // summarized now
    store.close();
  });
});

describe("WorkerStore — user prompts", () => {
  it("stores prompts in order for prompt cards", () => {
    const store = new WorkerStore(":memory:");
    store.initSession({ id: "s", runtime: "claude-code" });
    store.addPrompt({ sessionId: "s", text: "first ask" });
    store.addPrompt({ sessionId: "s", text: "second ask" });
    expect(store.listPrompts("s").map((p) => p.text)).toEqual(["first ask", "second ask"]);
    store.close();
  });
});

describe("WorkerStore — sessions", () => {
  it("derives the project basename from the project path", () => {
    const store = new WorkerStore(":memory:");
    store.initSession({ id: "s", runtime: "claude-code", projectPath: "/Users/abu/dev/onemem" });
    expect(store.getSession("s")?.project).toBe("onemem");
    store.close();
  });

  it("idempotent initSession preserves the onemem session id and lists newest-first", () => {
    const store = new WorkerStore(":memory:");
    store.initSession({
      id: "a",
      runtime: "claude-code",
      onememSessionId: "0xopen",
      startedAt: 1000,
    });
    store.initSession({ id: "a", runtime: "claude-code", projectPath: "/repo" });
    store.initSession({ id: "b", runtime: "codex", startedAt: 2000 });
    const a = store.getSession("a");
    expect(a?.onememSessionId).toBe("0xopen");
    expect(a?.projectPath).toBe("/repo");
    expect(store.listSessions().map((s) => s.id)).toEqual(["b", "a"]);
    store.close();
  });

  it("closes a session durably", () => {
    const store = new WorkerStore(":memory:");
    store.initSession({ id: "s", runtime: "claude-code" });
    store.endSession("s", 1234);
    expect(store.getSession("s")?.status).toBe("closed");
    expect(store.getSession("s")?.endedAt).toBe(1234);
    store.close();
  });
});

describe("WorkerStore — durable job tracking (reconciler)", () => {
  it("tracks a pending durable job and clears it once the Walrus blob lands", () => {
    const store = new WorkerStore(":memory:");
    store.initSession({ id: "s", runtime: "claude-code" });
    const o = store.addObservation({ sessionId: "s", type: "feature", title: "T", narrative: "n" });

    expect(store.findPendingDurable(10)).toHaveLength(0); // no job yet
    store.setObservationJob(o.id, "job-1");
    expect(store.findPendingDurable(10)).toEqual([
      { kind: "observation", id: o.id, jobId: "job-1" },
    ]);

    store.setObservationBlob(o.id, "blobX"); // blob lands → no longer pending
    expect(store.findPendingDurable(10)).toHaveLength(0);
    expect(store.getObservation(o.id)?.blobId).toBe("blobX");
    store.close();
  });

  it("tracks pending summaries and drops a job on failure (null clears it)", () => {
    const store = new WorkerStore(":memory:");
    store.initSession({ id: "s", runtime: "claude-code" });
    const sum = store.addSummary({ sessionId: "s", request: "r" });
    store.setSummaryJob(sum.id, "job-2");
    expect(store.findPendingDurable(10)).toEqual([{ kind: "summary", id: sum.id, jobId: "job-2" }]);

    store.setSummaryJob(sum.id, null); // failed → drop from pending, no blob claimed
    expect(store.findPendingDurable(10)).toHaveLength(0);
    expect(store.getSummary(sum.id)?.blobId).toBeNull();
    store.close();
  });
});
