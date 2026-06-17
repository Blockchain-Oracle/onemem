# @onemem/openai-agents

Record **OpenAI Agents SDK** runs as **verifiable on-chain OneMem TraceSessions**
(Sui + Walrus + Seal) — every tool call + the final output captured as
Merkle-chained `ActionCall`s anyone can verify.

## Usage

```ts
import { Agent } from "@openai/agents";
import { createOneMemMemory, createTracedRunner } from "@onemem/openai-agents";

const agent = new Agent({ name: "research", instructions: "..." });

// A Runner with OneMem trace recording attached.
const runner = createTracedRunner({ agentId: "my-app" });

// Optional explicit memory helper — recall before a run, capture after.
const memory = createOneMemMemory();
const input = await memory.recallInto("Find the latest on X and summarize.");
const result = await runner.run(agent, input);
await memory.capture(`User asked: ${input}\nAgent answered: ${result.finalOutput}`);
// → each tool call + the final answer recorded as one verifiable trace.
```

Already have a `Runner`? Attach to it:

```ts
import { Runner } from "@openai/agents";
import { attachOneMem } from "@onemem/openai-agents";

const runner = attachOneMem(new Runner(), { agentId: "my-app" });
```

## How it works

Listens to the Runner lifecycle events (`agent_tool_start`/`agent_tool_end`/
`agent_end`), buffers each run's calls **per RunContext** (so concurrent runs are
isolated), and flushes one TraceSession via `@onemem/sdk-ts/runtime`'s
`recordSession` at `agent_end`. Recording is **fire-and-forget** — it never slows
or breaks the run; a OneMem failure is logged and swallowed.

**Zero-config:** namespace/cap/signer auto-provision on first use (persisted under
`~/.onemem/`). Override via options or env (`ONEMEM_NAMESPACE_ID` +
`ONEMEM_RW_CAP_ID`, `ONEMEM_PRIVATE_KEY`, `SUI_NETWORK`).

## Options

`agentId` / `environment` (default `"openai-agents"`), `network`, `privateKey`,
`target`, `label`, `enableTrace` (default true), `onTrace(sessionId)`, `logger`.

## Memory helper

`createOneMemMemory()` exposes the Mem0-style side of OneMem for OpenAI Agents
apps:

- `recall(query, topK?)` searches configured MemWal memories.
- `recallInto(input, topK?)` prepends recalled memories as a context block and
  returns `input` unchanged when memory is disabled or no memories match.
- `capture(text)` stores a durable memory through MemWal and returns `true` on
  success, `false` when disabled or failed.

Memory is explicit because it changes the agent input. Runner event listeners
remain responsible for trace capture only. Configure memory with the same
credentials used by the SDK memory layer: delegate key, MemWalAccount id,
embedding API key, MemWal package id, and relayer URL. Local `onemem login`
credentials and env vars are both supported by the shared runtime resolver.

## Scope (v0.1)

Trace capture is automatic through Runner lifecycle events. Memory
recall/capture is shipped as the explicit `createOneMemMemory()` helper.
Verify/replay tools and automatic memory extraction remain tracked follow-ups.
Requires `@openai/agents` v0.11+ (peer dependency). Spec:
`docs/05-our-architecture/04-frameworks/openai-agents-tools.md`.
