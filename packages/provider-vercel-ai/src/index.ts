// @onemem/vercel-ai-provider — wrap any Vercel AI SDK model so every model call
// is recorded as a verifiable on-chain OneMem TraceSession (Sui + Walrus + Seal).
//
// Trace middleware observes `model.generate` / `model.stream`. Explicit memory
// recall/capture is available through `createOneMemMemory(...)`; automatic
// memory extraction remains a separate product layer.
//
// Verified against ai@6 (LanguageModelV3 middleware) + the official AI SDK
// middleware docs. Provisioning + fire-and-forget recording is handled by the
// shared `createTraceRecorder` in @onemem/sdk-ts/runtime.

import type {
  LanguageModelV3,
  LanguageModelV3Content,
  LanguageModelV3Middleware,
  LanguageModelV3StreamPart,
} from "@ai-sdk/provider";
import {
  createMemoryRecorder,
  createTraceRecorder,
  injectMemories,
  type MemoryRecorder,
  type MemoryRecorderOptions,
  type TraceRecorderOptions,
} from "@onemem/sdk-ts/runtime";
import { wrapLanguageModel } from "ai";

export type WithOneMemOptions = TraceRecorderOptions;
export type OneMemMemoryOptions = MemoryRecorderOptions;
export { injectMemories };

// Defensive: never throw on an unexpected/missing content shape — this runs
// synchronously in wrapGenerate, so a throw would break the host's model call.
function textFromContent(content: readonly LanguageModelV3Content[] | undefined): string {
  if (!Array.isArray(content)) return "";
  return content.map((c) => (c.type === "text" ? c.text : "")).join("");
}

/**
 * Wrap a Vercel AI SDK model so each call records a verifiable on-chain trace.
 * Recording is fire-and-forget (never adds latency to or breaks the call) and
 * zero-config (namespace/cap/signer auto-provision on first use).
 */
export function withOneMem(model: LanguageModelV3, opts: WithOneMemOptions = {}): LanguageModelV3 {
  const recorder = createTraceRecorder({
    ...opts,
    agentId: opts.agentId ?? "vercel-ai",
    environment: opts.environment ?? "vercel-ai",
    label: opts.label ?? "vercel-ai",
  });

  const middleware: LanguageModelV3Middleware = {
    specificationVersion: "v3",
    wrapGenerate: async ({ doGenerate, params }) => {
      const result = await doGenerate();
      recorder.record([
        {
          toolName: "model.generate",
          toolNamespace: "vercel-ai-sdk",
          input: { model: model.modelId, prompt: params.prompt },
          output: {
            text: textFromContent(result.content),
            usage: result.usage,
            finishReason: result.finishReason,
          },
        },
      ]);
      return result;
    },
    wrapStream: async ({ doStream, params }) => {
      const { stream, ...rest } = await doStream();
      let text = "";
      const observer = new TransformStream<LanguageModelV3StreamPart, LanguageModelV3StreamPart>({
        transform(chunk, controller) {
          if (chunk.type === "text-delta") text += chunk.delta;
          controller.enqueue(chunk);
        },
        flush() {
          recorder.record([
            {
              toolName: "model.stream",
              toolNamespace: "vercel-ai-sdk",
              input: { model: model.modelId, prompt: params.prompt },
              output: { text },
            },
          ]);
        },
      });
      return { stream: stream.pipeThrough(observer), ...rest };
    },
  };

  return wrapLanguageModel({ model, middleware });
}

/**
 * OneMem memory for a Vercel AI SDK app — the Mem0-mirror half. Wrap a call:
 *
 *   const mem = createOneMemMemory();
 *   const prompt = await mem.recallInto(userText);     // search → inject context
 *   const { text } = await generateText({ model, prompt });
 *   await mem.capture(`${userText}\n${text}`);          // store the exchange
 *
 * Injection modifies the prompt, so it's a wrapper rather than model middleware
 * (which records traces). Defensive: recall returns the input unchanged on
 * failure; capture is fire-and-forget.
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
