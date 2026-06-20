import { describe, expect, it } from "vitest";
import {
  buildObserverPrompt,
  type ObserverBackend,
  parseObserverOutput,
  runObserverOnce,
} from "./observer.js";
import { WorkerStore } from "./store.js";

class FakeBackend implements ObserverBackend {
  readonly name = "fake";
  constructor(private readonly responder: (prompt: string) => string) {}
  async available(): Promise<boolean> {
    return true;
  }
  async compress(prompt: string): Promise<string> {
    return this.responder(prompt);
  }
}

describe("parseObserverOutput", () => {
  it("parses the observations array into normalized records", () => {
    const out = parseObserverOutput(
      JSON.stringify({
        observations: [
          {
            type: "bugfix",
            title: "T",
            subtitle: "S",
            facts: ["f"],
            narrative: "N",
            concepts: ["gotcha"],
            files_read: ["r.ts"],
            files_modified: ["m.ts"],
          },
        ],
      }),
    );
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      type: "bugfix",
      title: "T",
      subtitle: "S",
      facts: ["f"],
      narrative: "N",
      concepts: ["gotcha"],
      filesRead: ["r.ts"],
      filesModified: ["m.ts"],
    });
  });

  it("coerces an invalid type to 'change' and keeps only valid concepts", () => {
    const out = parseObserverOutput(
      JSON.stringify({
        observations: [
          {
            type: "wizardry",
            title: "T",
            narrative: "N",
            facts: [],
            concepts: ["bugfix", "gotcha", "not-a-concept"],
            files_read: [],
            files_modified: [],
          },
        ],
      }),
    );
    expect(out[0]?.type).toBe("change");
    // "bugfix" is a TYPE not a concept → dropped; "not-a-concept" → dropped
    expect(out[0]?.concepts).toEqual(["gotcha"]);
  });

  it("clamps concepts to at most 5", () => {
    const out = parseObserverOutput(
      JSON.stringify({
        observations: [
          {
            type: "feature",
            title: "T",
            narrative: "N",
            concepts: [
              "how-it-works",
              "why-it-exists",
              "what-changed",
              "problem-solution",
              "gotcha",
              "pattern",
              "trade-off",
            ],
          },
        ],
      }),
    );
    expect(out[0]?.concepts.length).toBe(5);
  });

  it("skips an empty observation (no title, narrative, facts, or concepts)", () => {
    const out = parseObserverOutput(
      JSON.stringify({
        observations: [{ type: "change", title: "", narrative: "", facts: [], concepts: [] }],
      }),
    );
    expect(out).toHaveLength(0);
  });

  it("tolerates a json code fence and a bare array", () => {
    expect(
      parseObserverOutput(
        '```json\n{"observations":[{"type":"feature","title":"T","narrative":"N"}]}\n```',
      ),
    ).toHaveLength(1);
    expect(
      parseObserverOutput(JSON.stringify([{ type: "feature", title: "T", narrative: "N" }])),
    ).toHaveLength(1);
  });

  it("returns [] for prose / idle / unparseable output", () => {
    expect(parseObserverOutput("Skipping — nothing substantive here.")).toEqual([]);
    expect(parseObserverOutput("")).toEqual([]);
    expect(parseObserverOutput("   ")).toEqual([]);
  });
});

describe("buildObserverPrompt", () => {
  it("includes each tool call and the type/concept guidance", () => {
    const store = new WorkerStore(":memory:");
    store.initSession({ id: "s", runtime: "claude-code" });
    const e1 = store.addEvent({
      sessionId: "s",
      toolName: "Edit",
      inputPreview: "old->new",
      outputPreview: "done",
    });
    const prompt = buildObserverPrompt([e1]);
    expect(prompt).toContain("Edit");
    expect(prompt).toContain("old->new");
    expect(prompt).toContain("bugfix"); // type guidance present
    expect(prompt).toContain("problem-solution"); // concept guidance present
    store.close();
  });

  it("truncates an oversized field with an elision marker", () => {
    const store = new WorkerStore(":memory:");
    store.initSession({ id: "s", runtime: "claude-code" });
    const huge = "x".repeat(50_000);
    const e1 = store.addEvent({ sessionId: "s", toolName: "Read", inputPreview: huge });
    const prompt = buildObserverPrompt([e1]);
    expect(prompt.length).toBeLessThan(huge.length);
    expect(prompt).toContain("elided");
    store.close();
  });
});

describe("runObserverOnce", () => {
  it("compresses the oldest pending batch and drains the queue", async () => {
    const store = new WorkerStore(":memory:");
    store.initSession({ id: "s", runtime: "claude-code" });
    store.addEvent({ sessionId: "s", toolName: "Edit", outputPreview: "fixed the leak" });
    const backend = new FakeBackend(() =>
      JSON.stringify({
        observations: [
          {
            type: "bugfix",
            title: "Fixed the leak",
            subtitle: "x",
            facts: ["a"],
            narrative: "n",
            concepts: ["problem-solution"],
            files_read: [],
            files_modified: ["a.ts"],
          },
        ],
      }),
    );
    const result = await runObserverOnce({ store, backend });
    expect(result?.sessionId).toBe("s");
    expect(result?.observations).toHaveLength(1);
    expect(result?.observations[0]?.type).toBe("bugfix");
    expect(store.pendingEventCount()).toBe(0);
    expect(store.listObservations("s")).toHaveLength(1);
    store.close();
  });

  it("marks events skipped when the observer records nothing (no infinite loop)", async () => {
    const store = new WorkerStore(":memory:");
    store.initSession({ id: "s", runtime: "claude-code" });
    store.addEvent({ sessionId: "s", toolName: "TodoWrite" });
    const backend = new FakeBackend(() => ""); // idle output
    const result = await runObserverOnce({ store, backend });
    expect(result?.observations).toHaveLength(0);
    expect(store.pendingEventCount()).toBe(0); // drained as skipped
    expect(store.listObservations("s")).toHaveLength(0);
    store.close();
  });

  it("returns null when there is nothing pending", async () => {
    const store = new WorkerStore(":memory:");
    const backend = new FakeBackend(() => "");
    expect(await runObserverOnce({ store, backend })).toBeNull();
    store.close();
  });

  it("leaves events pending when the backend throws (retryable)", async () => {
    const store = new WorkerStore(":memory:");
    store.initSession({ id: "s", runtime: "claude-code" });
    store.addEvent({ sessionId: "s", toolName: "Edit" });
    const backend = new FakeBackend(() => {
      throw new Error("rate limited");
    });
    await expect(runObserverOnce({ store, backend })).rejects.toThrow("rate limited");
    expect(store.pendingEventCount()).toBe(1); // not lost; retryable
    store.close();
  });

  it("broadcasts each new observation and a processing_status update", async () => {
    const store = new WorkerStore(":memory:");
    store.initSession({ id: "s", runtime: "claude-code" });
    store.addEvent({ sessionId: "s", toolName: "Edit" });
    const seen: { event: string; data: unknown }[] = [];
    const backend = new FakeBackend(() =>
      JSON.stringify({
        observations: [{ type: "feature", title: "t", narrative: "n" }],
      }),
    );
    await runObserverOnce({
      store,
      backend,
      broadcast: (event, data) => seen.push({ event, data }),
    });
    expect(seen.some((e) => e.event === "new_observation")).toBe(true);
    expect(seen.some((e) => e.event === "processing_status")).toBe(true);
    store.close();
  });
});
