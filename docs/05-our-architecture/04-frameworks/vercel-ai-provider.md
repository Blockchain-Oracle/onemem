# Vercel AI Provider — `@onemem/vercel-ai-provider`

Middleware that wraps any Vercel AI SDK model with OneMem memory + trace. Matches Mem0's `withMem0` shape exactly.

Reference: `../../../TRACE_AND_PROVIDERS.md` §1 (Mem0 + memwal middleware patterns)

---

## API surface

```ts
import { withOneMem } from "@onemem/vercel-ai-provider";
import { openai } from "@ai-sdk/openai";
import { generateText, streamText } from "ai";

const model = withOneMem(openai("gpt-4o"), {
  key: process.env.ONEMEM_DELEGATE_KEY!,
  accountId: process.env.ONEMEM_ACCOUNT_ID!,
  serverUrl: "https://relayer.memwal.ai",
  namespaceId: process.env.ONEMEM_NAMESPACE_ID!,
  agentId: "my-vercel-app",
  // Optional behavior knobs:
  enableRecall: true,           // inject memories into prompt (default true)
  enableCapture: true,          // extract durable facts after each call (default true)
  enableTrace: true,            // emit ActionCall per model/tool call (default true)
  maxMemories: 5,
  minRelevance: 0.3,
  environment: "production",
});

// Use like any Vercel AI model
const result = await generateText({
  model,
  messages: [{ role: "user", content: "What did we decide about auth?" }],
});

// Streaming works too
const stream = await streamText({
  model,
  prompt: "Summarize today's design decisions",
});
```

---

## Implementation

```ts
// src/index.ts
import {
  LanguageModelV2Middleware,
  wrapLanguageModel,
  type LanguageModelV2,
} from "ai";
import { OneMem, OneMemConfig } from "@onemem/sdk-ts";

export interface WithOneMemOptions extends OneMemConfig {
  enableRecall?: boolean;
  enableCapture?: boolean;
  enableTrace?: boolean;
  maxMemories?: number;
  minRelevance?: number;
}

export function withOneMem(
  model: LanguageModelV2,
  opts: WithOneMemOptions
): LanguageModelV2 {
  const clientPromise = OneMem.create(opts);
  let sessionId: string | null = null;

  const middleware: LanguageModelV2Middleware = {
    transformParams: async ({ params }) => {
      if (!opts.enableRecall) return params;
      const client = await clientPromise;
      if (!sessionId) {
        const session = await client.trace.startSession({
          agentId: opts.agentId,
          environment: opts.environment,
        });
        sessionId = session.sessionId;
      }

      // Recall memories relevant to the last user message
      const lastUserMessage = params.messages.findLast(m => m.role === "user");
      if (!lastUserMessage) return params;

      const query = typeof lastUserMessage.content === "string"
        ? lastUserMessage.content
        : lastUserMessage.content.find(p => p.type === "text")?.text ?? "";

      const { results } = await client.search(query, {
        topK: opts.maxMemories ?? 5,
        threshold: opts.minRelevance ?? 0.3,
      });

      if (results.length === 0) return params;

      const memoryBlock = formatMemoriesForPrompt(results);
      return {
        ...params,
        messages: [
          { role: "system", content: memoryBlock },
          ...params.messages,
        ],
      };
    },

    wrapGenerate: async ({ doGenerate, params }) => {
      const client = await clientPromise;
      let callId: string | undefined;

      if (opts.enableTrace && sessionId) {
        const { callId: appendedId } = await client.trace.appendCall(sessionId, {
          toolName: "model.generate",
          toolNamespace: "vercel-ai-sdk",
          input: { messages: params.messages, model: model.modelId },
        });
        callId = appendedId;
      }

      const result = await doGenerate();

      if (opts.enableTrace && sessionId && callId) {
        await client.trace.closeCall(sessionId, callId, {
          output: { text: result.text, usage: result.usage },
        }, "SUCCESS");
      }

      if (opts.enableCapture && sessionId) {
        // Extract durable facts in background; don't block return
        captureMemoriesAsync(client, params, result, opts);
      }

      return result;
    },

    wrapStream: async ({ doStream, params }) => {
      const client = await clientPromise;
      let callId: string | undefined;

      if (opts.enableTrace && sessionId) {
        const { callId: appendedId } = await client.trace.appendCall(sessionId, {
          toolName: "model.stream",
          toolNamespace: "vercel-ai-sdk",
          input: { messages: params.messages, model: model.modelId },
        });
        callId = appendedId;
      }

      const { stream, ...rest } = await doStream();

      // Wrap stream to capture final result on close
      const wrappedStream = new ReadableStream({
        async start(controller) {
          const reader = stream.getReader();
          let collected = "";
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (value?.type === "text-delta") collected += value.textDelta;
              controller.enqueue(value);
            }
            if (callId && sessionId) {
              await client.trace.closeCall(sessionId, callId, {
                output: { text: collected },
              }, "SUCCESS");
            }
          } catch (err) {
            if (callId && sessionId) {
              await client.trace.closeCall(sessionId, callId, {
                output: { error: String(err) },
                events: [{ kind: "EXCEPTION", message: String(err), timestamp: Date.now() }],
              }, "FAILURE");
            }
            throw err;
          } finally {
            controller.close();
          }
        },
      });

      return { stream: wrappedStream, ...rest };
    },
  };

  return wrapLanguageModel({ model, middleware });
}

async function captureMemoriesAsync(client: OneMem, params: any, result: any, opts: WithOneMemOptions) {
  try {
    const conversationText = [
      ...params.messages.map(m => `${m.role}: ${typeof m.content === "string" ? m.content : "..."}`),
      `assistant: ${result.text}`,
    ].join("\n\n");
    await client.add(conversationText, {
      memoryClass: "episodic",
      contextTier: "L0",
      metadata: { source: "vercel-ai-sdk", model: opts.agentId },
    });
  } catch (err) {
    // Silent — don't block the user
  }
}
```

---

## Configuration via env vars (default if not passed in opts)

```bash
export ONEMEM_DELEGATE_KEY="<from credentials>"
export ONEMEM_ACCOUNT_ID="0x..."
export ONEMEM_NAMESPACE_ID="0x..."
export ONEMEM_SERVER_URL="https://relayer.memwal.ai"
```

Then in code:

```ts
const model = withOneMem(openai("gpt-4o"));  // reads all opts from env
```

---

## What we DON'T support at v0.1

- Tool calls within Vercel AI SDK (we observe `model.generate` but not individual tool calls within a streamed response that uses tools). v0.2 adds tool-call interception.
- Multi-modal input/output (images, files). v0.2.
- Provider-specific extensions (e.g., OpenAI's `metadata` parameter). v0.2.

---

## Install + distribution

```bash
npm install @onemem/vercel-ai-provider
```

Distribution:
- npm: `@onemem/vercel-ai-provider`
- GitHub: `onemem/vercel-ai-provider`

---

## Cross-references

- `README.md` (this folder)
- `trace-emit-contract.md` — the consistent emission pattern this provider uses
- `../02-sdks/shared-api-surface.md` — SDK methods called
- `../../../TRACE_AND_PROVIDERS.md` §1 — Mem0 `withMem0` reference shape
