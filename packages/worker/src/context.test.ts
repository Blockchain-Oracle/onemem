import { describe, expect, it } from "vitest";
import { buildContextMarkdown, buildRecallMarkdown } from "./context.js";
import type { Observation, Summary } from "./store.js";

function obs(partial: Partial<Observation>): Observation {
  return {
    id: 1,
    sessionId: "s",
    seq: 1,
    type: "feature",
    title: "T",
    subtitle: null,
    facts: [],
    narrative: "n",
    concepts: [],
    filesRead: [],
    filesModified: [],
    contentHash: "h",
    blobId: null,
    createdAt: 1,
    ...partial,
  };
}

describe("buildContextMarkdown (SessionStart recall)", () => {
  it("renders recent observations with type emoji and the last summary", () => {
    const summary: Summary = {
      id: 1,
      sessionId: "s",
      request: "Build the observer",
      investigated: null,
      learned: null,
      completed: "Store redesign",
      nextSteps: "Wire the loop",
      notes: null,
      contentHash: "h",
      blobId: null,
      createdAt: 1,
    };
    const md = buildContextMarkdown({
      project: "onemem",
      observations: [
        obs({ type: "bugfix", title: "Fixed the leak", subtitle: "sockets released" }),
        obs({ type: "feature", title: "Added cost meter" }),
      ],
      summary,
    });
    expect(md).toContain("onemem");
    expect(md).toContain("🔴 Fixed the leak — sockets released");
    expect(md).toContain("🟣 Added cost meter");
    expect(md).toContain("**Request:** Build the observer");
    expect(md).toContain("**Next steps:** Wire the loop");
  });

  it("returns empty string when there is nothing to inject", () => {
    expect(buildContextMarkdown({ project: "x", observations: [], summary: null })).toBe("");
  });
});

describe("buildRecallMarkdown (UserPromptSubmit recall)", () => {
  it("lists semantic hits under the query", () => {
    const md = buildRecallMarkdown("connection pool", [
      { text: "Released sockets in the error path of pool.ts", distance: 0.3, blobId: "b1" },
      { text: "Pool max was 10", distance: 0.5, blobId: "b2" },
    ]);
    expect(md).toContain('relevant to "connection pool"');
    expect(md).toContain("Released sockets in the error path");
  });

  it("returns empty when there are no hits", () => {
    expect(buildRecallMarkdown("x", [])).toBe("");
  });
});
