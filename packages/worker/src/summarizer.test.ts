import { describe, expect, it } from "vitest";
import type { ObserverBackend } from "./observer.js";
import { WorkerStore } from "./store.js";
import { buildSummaryPrompt, parseSummaryOutput, runSummaryOnce } from "./summarizer.js";

const fake = (resp: string): ObserverBackend => ({
  name: "fake",
  available: async () => true,
  compress: async () => resp,
});

describe("parseSummaryOutput", () => {
  it("parses a 5-section summary", () => {
    const s = parseSummaryOutput(
      JSON.stringify({
        request: "r",
        investigated: "i",
        learned: "l",
        completed: "c",
        next_steps: "n",
        notes: "x",
      }),
    );
    expect(s).toMatchObject({
      request: "r",
      investigated: "i",
      learned: "l",
      completed: "c",
      nextSteps: "n",
      notes: "x",
    });
  });

  it("returns null for unparseable output", () => {
    expect(parseSummaryOutput("nope, not json")).toBeNull();
  });
});

describe("buildSummaryPrompt", () => {
  it("lists observation titles and names the 5 sections", () => {
    const store = new WorkerStore(":memory:");
    store.initSession({ id: "s", runtime: "claude-code" });
    const o = store.addObservation({
      sessionId: "s",
      type: "bugfix",
      title: "Fixed X",
      narrative: "n",
    });
    const prompt = buildSummaryPrompt([o]);
    expect(prompt).toContain("Fixed X");
    expect(prompt).toContain("next_steps");
    store.close();
  });
});

describe("runSummaryOnce", () => {
  it("summarizes a closed session, broadcasts it, and drains the queue", async () => {
    const store = new WorkerStore(":memory:");
    store.initSession({ id: "s", runtime: "claude-code" });
    store.addObservation({
      sessionId: "s",
      type: "feature",
      title: "Added cost meter",
      narrative: "n",
    });
    store.endSession("s", 5);
    const seen: string[] = [];
    const backend = fake(
      JSON.stringify({
        request: "Build cost meter",
        investigated: "dashboard",
        learned: "x",
        completed: "meter added",
        next_steps: "polish",
      }),
    );
    const summary = await runSummaryOnce({ store, backend, broadcast: (e) => seen.push(e) });
    expect(summary?.request).toBe("Build cost meter");
    expect(summary?.nextSteps).toBe("polish");
    expect(seen).toContain("new_summary");
    expect(store.findSessionNeedingSummary()).toBeNull();
    store.close();
  });

  it("returns null when no session needs a summary", async () => {
    const store = new WorkerStore(":memory:");
    expect(await runSummaryOnce({ store, backend: fake("") })).toBeNull();
    store.close();
  });

  it("stores an honest fallback summary when the model output is unusable", async () => {
    const store = new WorkerStore(":memory:");
    store.initSession({ id: "s", runtime: "claude-code" });
    store.addObservation({
      sessionId: "s",
      type: "bugfix",
      title: "Fixed leak",
      narrative: "n",
      filesModified: ["a.ts"],
    });
    store.endSession("s", 5);
    const summary = await runSummaryOnce({ store, backend: fake("garbage not json") });
    expect(summary).not.toBeNull();
    expect(summary?.completed).toContain("Fixed leak"); // derived from observations
    expect(store.findSessionNeedingSummary()).toBeNull(); // drained, no re-loop
    store.close();
  });
});
