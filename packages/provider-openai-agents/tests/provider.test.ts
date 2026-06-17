import { afterEach, describe, expect, it, vi } from "vitest";

// Mock the shared recorder — provisioning/fire-and-forget is tested in sdk-ts.
const record = vi.fn();
const recall = vi.fn(async () => [
  { text: "user prefers Move", walrusBlobId: "b", relevance: 0.9 },
]);
const capture = vi.fn(async () => true);
vi.mock("@onemem/sdk-ts/runtime", () => ({
  createTraceRecorder: () => ({ record, enabled: true }),
  createMemoryRecorder: () => ({ recall, capture, enabled: true }),
  injectMemories: (input: string, mems: { text: string }[]) =>
    mems.length
      ? `Relevant memories from past sessions:\n${mems.map((m) => `- ${m.text}`).join("\n")}\n\n${input}`
      : input,
}));
vi.mock("@openai/agents", () => ({ Runner: class {} }));

import { attachOneMem, createOneMemMemory } from "../src/index.js";

type Call = { toolName: string; input: unknown; output: unknown };
const recordedAt = (i: number) => record.mock.calls[i]?.[0] as Call[];

// Fake Runner: records .on listeners and lets the test emit lifecycle events.
function fakeRunner() {
  const handlers = new Map<string, (...a: unknown[]) => void>();
  return {
    on(event: string, fn: (...a: unknown[]) => void) {
      handlers.set(event, fn);
      return this;
    },
    emit(event: string, ...args: unknown[]) {
      handlers.get(event)?.(...args);
    },
  };
}

afterEach(() => record.mockClear());

describe("attachOneMem (OpenAI Agents)", () => {
  it("buffers tool calls (paired by callId) + final output into one record at agent_end", () => {
    const r = fakeRunner();
    attachOneMem(r as never, {});
    const ctx = {};
    r.emit(
      "agent_tool_start",
      ctx,
      {},
      { name: "search" },
      { toolCall: { callId: "c1", arguments: { q: "x" } } },
    );
    r.emit("agent_tool_end", ctx, {}, { name: "search" }, "found 3", {
      toolCall: { callId: "c1" },
    });
    r.emit("agent_end", ctx, {}, "the answer");
    expect(record).toHaveBeenCalledTimes(1);
    const calls = recordedAt(0);
    expect(calls).toHaveLength(2);
    expect(calls[0].toolName).toBe("search");
    expect(calls[0].input).toEqual({ q: "x" });
    expect(calls[0].output).toBe("found 3");
    expect(calls[1].toolName).toBe("agent.response");
    expect(calls[1].output).toBe("the answer");
  });

  it("isolates concurrent runs by RunContext", () => {
    const r = fakeRunner();
    attachOneMem(r as never, {});
    const a = {};
    const b = {};
    r.emit("agent_tool_start", a, {}, { name: "ta" }, { toolCall: { callId: "a1" } });
    r.emit("agent_tool_start", b, {}, { name: "tb" }, { toolCall: { callId: "b1" } });
    r.emit("agent_tool_end", a, {}, { name: "ta" }, "ra", { toolCall: { callId: "a1" } });
    r.emit("agent_end", a, {}, "out-a");
    r.emit("agent_end", b, {}, "out-b");
    expect(record).toHaveBeenCalledTimes(2);
    expect(recordedAt(0).map((c) => c.toolName)).toEqual(["ta", "agent.response"]);
    // b's tool started but never ended → still recorded (with null output) — a
    // started-but-unfinished call is part of the trace, not dropped.
    expect(recordedAt(1).map((c) => c.toolName)).toEqual(["tb", "agent.response"]);
    expect(recordedAt(1)[0].output).toBeNull();
  });

  it("tolerates an orphan agent_tool_end (no matching start) without throwing", () => {
    const r = fakeRunner();
    attachOneMem(r as never, {});
    const ctx = {};
    // end with no prior start for c9 — must no-op cleanly, then record the run
    expect(() =>
      r.emit("agent_tool_end", ctx, {}, { name: "t" }, "late", { toolCall: { callId: "c9" } }),
    ).not.toThrow();
    r.emit("agent_end", ctx, {}, "done");
    expect(recordedAt(0).map((c) => c.toolName)).toEqual(["agent.response"]);
  });

  it("does not throw on a malformed event (missing details/toolCall)", () => {
    const r = fakeRunner();
    attachOneMem(r as never, {});
    expect(() => r.emit("agent_tool_start", {}, {}, undefined, undefined)).not.toThrow();
  });

  it("records a no-tool run as a single agent.response call", () => {
    const r = fakeRunner();
    attachOneMem(r as never, {});
    r.emit("agent_end", {}, {}, "just text");
    expect(record).toHaveBeenCalledTimes(1);
    expect(recordedAt(0)).toHaveLength(1);
    expect(recordedAt(0)[0].toolName).toBe("agent.response");
  });
});

describe("createOneMemMemory (OpenAI Agents)", () => {
  it("recallInto searches and prepends recalled memories to the input", async () => {
    const mem = createOneMemMemory({});
    const out = await mem.recallInto("what should I build with?");
    expect(recall).toHaveBeenCalledWith("what should I build with?", undefined);
    expect(out).toContain("user prefers Move");
    expect(out.endsWith("what should I build with?")).toBe(true);
  });

  it("exposes capture passthrough", async () => {
    const mem = createOneMemMemory({});
    expect(await mem.capture("remember this")).toBe(true);
    expect(capture).toHaveBeenCalledWith("remember this");
  });
});
