# @onemem/openai-agents

Decentralized memory for an **OpenAI Agents SDK** app — recall prior context and
capture new memories. Memory is stored on MemWal (client-side Seal-encrypted blob
on Walrus — the relayer never sees plaintext) and is owned by you.

**Publication note, 2026-06-18:** `@onemem/openai-agents@0.1.3` is current on npm
after `pnpm registry:status --strict`. Re-run that command before a fresh public
install claim.

## Usage

```ts
import { Agent, Runner } from "@openai/agents";
import { createOneMemMemory } from "@onemem/openai-agents";

const agent = new Agent({ name: "research", instructions: "..." });
const runner = new Runner();
const mem = createOneMemMemory({ agentId: "my-app" });

const input = await mem.recallInto("Find the latest on X and summarize.");
const result = await runner.run(agent, input);
await mem.capture(`User asked: ${input}\nAgent answered: ${result.finalOutput}`);
```

## API

`createOneMemMemory(opts?)` returns:

- `recall(query, topK?)` — search configured MemWal memories.
- `recallInto(input, topK?)` — prepend recalled memories as a context block;
  returns `input` unchanged when memory is disabled or nothing matches.
- `capture(text)` — store a durable memory through MemWal (`true` on success).

Memory is explicit because it changes the agent input. Both calls are defensive —
a OneMem failure never breaks the run.

## Configure

Memory config comes from `onemem login` credentials or env
(`ONEMEM_ACCOUNT_ID`, `ONEMEM_DELEGATE_KEY`, `ONEMEM_EMBEDDING_API_KEY`,
`MEMWAL_PACKAGE_ID`, `MEMWAL_RELAYER_URL`, `SUI_NETWORK`). Options include
`namespace`, `userId`/`agentId`, and `logger`.

Requires `@openai/agents` v0.11+ (peer dependency). Spec:
`docs/05-our-architecture/04-frameworks/openai-agents-tools.md`.
