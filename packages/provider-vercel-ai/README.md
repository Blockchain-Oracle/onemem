# @onemem/vercel-ai-provider

Wrap any **Vercel AI SDK** model so every model call is recorded as a
**verifiable on-chain OneMem TraceSession** (Sui + Walrus + Seal) — Merkle-chained
`ActionCall`s with content stored on Walrus and Seal-encrypted.

**Publication note, 2026-06-18:** `@onemem/vercel-ai-provider@0.1.2` is
current on npm after `pnpm registry:status --strict` and includes
`createOneMemMemory(...)`. Re-run that command before making a fresh public
install claim.

## Usage

```ts
import { createOneMemMemory, withOneMem } from "@onemem/vercel-ai-provider";
import { openai } from "@ai-sdk/openai";
import { generateText, streamText } from "ai";

const model = withOneMem(openai("gpt-4o"), {
  agentId: "my-app",          // optional, stamped on the trace
  // target / signer / network are all optional — auto-provisioned on first use
});

// Use it like any AI SDK model — generate and stream both record a trace.
const { text } = await generateText({ model, prompt: "What did we decide about auth?" });

// Optional explicit memory helper — recall before a call, capture after.
const memory = createOneMemMemory();
const prompt = await memory.recallInto("What did we decide about auth?");
const result = await generateText({ model, prompt });
await memory.capture(`User asked: ${prompt}\nAssistant answered: ${result.text}`);
```

## How it works

`withOneMem` wraps the model with AI SDK middleware (`wrapLanguageModel` →
`wrapGenerate` / `wrapStream`). After each call it records a 1-call TraceSession
via `@onemem/sdk-ts/runtime`'s `recordSession`. Recording is **fire-and-forget**:
it never adds latency to, or breaks, your model call — a OneMem failure is logged
and swallowed.

**Zero-config:** the namespace, ReadWrite cap, and signer are auto-provisioned on
first use and persisted under `~/.onemem/` (same engine as the OpenClaw/Hermes
plugins). Override via options or env (`ONEMEM_NAMESPACE_ID` + `ONEMEM_RW_CAP_ID`,
`ONEMEM_PRIVATE_KEY`, `SUI_NETWORK`).

## Options

| Option | Default | Notes |
|---|---|---|
| `agentId` / `environment` | `"vercel-ai"` | stamped on the trace |
| `network` | `$SUI_NETWORK` or `testnet` | |
| `privateKey` | sui keystore → generated wallet | signer |
| `target` | env → auto-provisioned | `{ namespaceId, rwCapId }` |
| `enableTrace` | `true` | set `false` to disable |
| `onTrace` | — | callback with the on-chain session id |

## Memory helper

`createOneMemMemory()` exposes the Mem0-style side of OneMem for Vercel AI apps:

- `recall(query, topK?)` searches configured MemWal memories.
- `recallInto(input, topK?)` prepends recalled memories as a context block and
  returns `input` unchanged when memory is disabled or no memories match.
- `capture(text)` stores a durable memory through MemWal and returns `true` on
  success, `false` when disabled or failed.

Memory is explicit so it is easy to see what prompt text changes. Configure it
with the same credentials used by the SDK memory layer: delegate key,
MemWalAccount id, embedding API key, MemWal package id, and relayer URL. Local
`onemem login` credentials and env vars are both supported by the shared runtime
resolver.

## Scope (v0.1)

Trace capture is automatic for `model.generate` / `model.stream`. In repo-local
source, memory recall/capture is shipped as the explicit `createOneMemMemory()`
helper.
Automatic memory extraction and per-tool-call interception remain tracked
follow-ups.

Requires `ai` v6 (peer dependency). Spec:
`docs/05-our-architecture/04-frameworks/vercel-ai-provider.md`.
