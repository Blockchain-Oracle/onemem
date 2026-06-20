# @onemem/vercel-ai-provider

Decentralized memory for a **Vercel AI SDK** app — recall prior context and
capture new memories. Memory is stored on MemWal (client-side Seal-encrypted blob
on Walrus — the relayer never sees plaintext) and is owned by you.

**Publication note, 2026-06-18:** `@onemem/vercel-ai-provider@0.1.2` is current on npm
after `pnpm registry:status --strict`. Re-run that command before a fresh public
install claim.

## Usage

```ts
import { createOneMemMemory } from "@onemem/vercel-ai-provider";
import { generateText } from "ai";

const mem = createOneMemMemory({ agentId: "my-app" });

const prompt = await mem.recallInto(userText); // search → inject prior context
const { text } = await generateText({ model, prompt });
await mem.capture(`${userText}\n${text}`); // store the exchange
```

## API

`createOneMemMemory(opts?)` returns:

- `recall(query, topK?)` — search configured MemWal memories.
- `recallInto(input, topK?)` — prepend recalled memories as a context block;
  returns `input` unchanged when memory is disabled or nothing matches.
- `capture(text)` — store a durable memory through MemWal (`true` on success).

Both recall and capture are defensive — a OneMem failure never breaks your model
call.

## Configure

Memory config comes from `onemem login` credentials or env
(`ONEMEM_ACCOUNT_ID`, `ONEMEM_DELEGATE_KEY`, `ONEMEM_EMBEDDING_API_KEY`,
`MEMWAL_PACKAGE_ID`, `MEMWAL_RELAYER_URL`, `SUI_NETWORK`). Options include
`namespace`, `userId`/`agentId`, and `logger`.

Requires `ai` v6 (peer dependency). Spec:
`docs/05-our-architecture/04-frameworks/vercel-ai-provider.md`.
