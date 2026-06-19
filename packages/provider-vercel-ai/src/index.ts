// @onemem/vercel-ai-provider — decentralized memory for a Vercel AI SDK app.
//
// Explicit memory recall/capture via `createOneMemMemory(...)`: search prior
// memories to inject into the prompt, capture new ones after the call. Memory is
// stored on MemWal (Seal-encrypted blob on Walrus) via the shared
// `createMemoryRecorder` in @onemem/sdk-ts/runtime.

import {
  createMemoryRecorder,
  injectMemories,
  type MemoryRecorder,
  type MemoryRecorderOptions,
} from "@onemem/sdk-ts/runtime";

export type OneMemMemoryOptions = MemoryRecorderOptions;
export { injectMemories };

/**
 * OneMem memory for a Vercel AI SDK app. Wrap a call:
 *
 *   const mem = createOneMemMemory();
 *   const prompt = await mem.recallInto(userText);     // search → inject context
 *   const { text } = await generateText({ model, prompt });
 *   await mem.capture(`${userText}\n${text}`);          // store the exchange
 *
 * Defensive: recall returns the input unchanged on failure; capture is
 * fire-and-forget.
 */
export function createOneMemMemory(opts: OneMemMemoryOptions = {}): MemoryRecorder & {
  /** Search memories for `input` and prepend them as context. Returns `input` unchanged if none. */
  recallInto(input: string, topK?: number): Promise<string>;
} {
  const recorder = createMemoryRecorder({
    ...opts,
    logger: opts.logger ?? { warn: (m) => console.warn(m) },
  });
  return {
    ...recorder,
    async recallInto(input: string, topK?: number): Promise<string> {
      return injectMemories(input, await recorder.recall(input, topK));
    },
  };
}
