# onemem-crewai

Decentralized memory for **CrewAI** crews — recall prior context and capture
outcomes. Memory is stored on MemWal (client-side Seal-encrypted blob on Walrus —
the relayer never sees plaintext) and is owned by you.

**Publication note, 2026-06-18:** `onemem-crewai@0.1.1` is current on PyPI after
`pnpm registry:status --strict`. Re-run that command before a fresh public
install claim.

## Usage

```python
from crewai import Crew
from onemem_crewai import create_onemem_memory

memory = create_onemem_memory(namespace="my-crew")

context = memory.recall_context("Plan the research task")  # search → inject
result = Crew(agents=[...], tasks=[...]).kickoff(inputs={"topic": context})
memory.capture(f"Crew result: {result}")                   # store the outcome
```

## How it works

`create_onemem_memory(...)` uses the `onemem` Python SDK's `MemoryClient`, which
shells out to the `onemem-memory` Node bridge (`@onemem/sdk-ts`) for the full
MemWal round-trip (client-side Seal encryption + Walrus + embeddings), since the
MemWal stack is JS-only. `recall_context(...)` returns the original input when
memory is disabled, empty, or failing; `capture(...)` returns `False` instead of
raising when the bridge is unavailable. A OneMem failure never breaks the crew.

## Prerequisite

**Node 20+ with `npx` on `PATH`** (the memory bridge; `npx` fetches the CLI on
first use).

## Config (env, read by the bridge)

`SUI_NETWORK` (default `testnet`), `ONEMEM_ACCOUNT_ID`, `ONEMEM_DELEGATE_KEY`,
`ONEMEM_EMBEDDING_API_KEY`, `MEMWAL_PACKAGE_ID`, `MEMWAL_RELAYER_URL`,
`ONEMEM_PRIVATE_KEY` (else sui keystore, else a generated+persisted wallet),
`ONEMEM_MEMORY_CMD` (override the bridge invocation).

Spec: `docs/05-our-architecture/04-frameworks/crewai-provider.md`.
