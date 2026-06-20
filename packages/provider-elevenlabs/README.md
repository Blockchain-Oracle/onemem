# onemem-elevenlabs

Decentralized memory for **ElevenLabs Conversational AI** voice sessions — recall
prior context and capture turns. Memory is stored on MemWal (client-side
Seal-encrypted blob on Walrus — the relayer never sees plaintext) and is owned by
you.

**Publication note, 2026-06-18:** `onemem-elevenlabs@0.1.1` is current on PyPI
after `pnpm registry:status --strict`. Re-run that command before a fresh public
install claim.

## Usage

```python
from onemem_elevenlabs import create_onemem_memory

memory = create_onemem_memory(namespace="voice-conversation")

context = memory.recall_context("What does this caller prefer?")  # search → inject
# Inject `context` into your conversation prompt or agent config.
memory.capture("User: appointment tomorrow\nAssistant: confirmed reminder")
```

## How it works

`create_onemem_memory(...)` uses the `onemem` Python SDK's `MemoryClient`, which
shells out to the `onemem-memory` Node bridge (`@onemem/sdk-ts`) for the full
MemWal round-trip (client-side Seal encryption + Walrus + embeddings), since the
MemWal stack is JS-only. `recall_context(...)` returns the original text when
memory is disabled, empty, or failing; `capture(...)` returns `False` instead of
raising when the bridge is unavailable. A OneMem failure never breaks the voice
conversation.

## Prerequisite

**Node 18+ with `npx` on `PATH`** (the memory bridge).

## Config (env, read by the bridge)

`SUI_NETWORK` (default `testnet`), `ONEMEM_ACCOUNT_ID`, `ONEMEM_DELEGATE_KEY`,
`ONEMEM_EMBEDDING_API_KEY`, `MEMWAL_PACKAGE_ID`, `MEMWAL_RELAYER_URL`,
`ONEMEM_PRIVATE_KEY` (else sui keystore, else a generated+persisted wallet),
`ONEMEM_MEMORY_CMD` (override the bridge invocation).

Spec: `docs/05-our-architecture/04-frameworks/elevenlabs-voice-provider.md`.
