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

import { createOneMemMemory, withOneMem } from "../src/index.js";

type Call = { toolName: string; input: unknown; output: { text: string } };
const lastCalls = () => record.mock.calls.at(-1)?.[0] as Call[];

// Minimal fake LanguageModelV3 — only the fields the middleware touches.
function fakeModel(genContent?: unknown[]) {
  return {
    specificationVersion: "v3",
    provider: "fake",
    modelId: "fake-model",
    supportedUrls: {},
    async doGenerate() {
      return {
        content: genContent ?? [{ type: "text", text: "hello world" }],
        finishReason: "stop",
        usage: { inputTokens: 1, outputTokens: 2, totalTokens: 3 },
        warnings: [],
      };
    },
    async doStream() {
      const parts = [
        { type: "text-delta", id: "1", delta: "hel" },
        { type: "text-delta", id: "1", delta: "lo" },
      ];
      return {
        stream: new ReadableStream({
          start(c) {
            for (const p of parts) c.enqueue(p);
            c.close();
          },
        }),
        warnings: [],
      };
    },
  } as never;
}

afterEach(() => {
  record.mockClear();
  recall.mockClear();
  capture.mockClear();
});

describe("withOneMem", () => {
  it("records model.generate with decoded text; passthrough intact", async () => {
    const model = withOneMem(fakeModel());
    const res = await model.doGenerate({ prompt: [] } as never);
    expect((res.content[0] as { text: string }).text).toBe("hello world");
    expect(lastCalls()[0].toolName).toBe("model.generate");
    expect(lastCalls()[0].output.text).toBe("hello world");
  });

  it("joins only text parts across mixed content", async () => {
    const model = withOneMem(
      fakeModel([
        { type: "text", text: "a" },
        { type: "reasoning", text: "ignore" },
        { type: "tool-call", toolCallId: "1" },
        { type: "text", text: "b" },
      ]),
    );
    await model.doGenerate({ prompt: [] } as never);
    expect(lastCalls()[0].output.text).toBe("ab");
  });

  it("never throws on malformed content (records empty text)", async () => {
    const bad = {
      ...fakeModel(),
      async doGenerate() {
        return { content: undefined, finishReason: "stop", usage: {}, warnings: [] };
      },
    } as never;
    const model = withOneMem(bad);
    await expect(model.doGenerate({ prompt: [] } as never)).resolves.toBeDefined();
    expect(lastCalls()[0].output.text).toBe("");
  });

  it("records model.stream and passes the stream through unbroken", async () => {
    const model = withOneMem(fakeModel());
    const { stream } = await model.doStream({ prompt: [] } as never);
    const reader = (stream as ReadableStream).getReader();
    let out = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if ((value as { type: string }).type === "text-delta")
        out += (value as { delta: string }).delta;
    }
    expect(out).toBe("hello");
    expect(lastCalls()[0].toolName).toBe("model.stream");
    expect(lastCalls()[0].output.text).toBe("hello");
  });
});

describe("createOneMemMemory (Vercel AI)", () => {
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
