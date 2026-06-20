import { afterEach, describe, expect, it, vi } from "vitest";

// Mock the shared recorder — provisioning/fire-and-forget is tested in sdk-ts.
const recall = vi.fn(async () => [
  { text: "user prefers Move", walrusBlobId: "b", relevance: 0.9 },
]);
const capture = vi.fn(async () => true);
vi.mock("@onemem/sdk-ts/runtime", () => ({
  createMemoryRecorder: () => ({ recall, capture, enabled: true }),
  injectMemories: (input: string, mems: { text: string }[]) =>
    mems.length
      ? `Relevant memories from past sessions:\n${mems.map((m) => `- ${m.text}`).join("\n")}\n\n${input}`
      : input,
}));

import { createOneMemMemory } from "../src/index.js";

afterEach(() => {
  recall.mockClear();
  capture.mockClear();
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
