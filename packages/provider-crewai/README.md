# onemem-crewai

Record **CrewAI** crew runs as **verifiable on-chain OneMem TraceSessions**
(Sui + Walrus + Seal) — every agent step + task captured as Merkle-chained
`ActionCall`s anyone can verify.

## Usage

```python
from crewai import Crew
from onemem_crewai import OneMemTracer

tracer = OneMemTracer(agent_id="my-crew")
crew = Crew(
    agents=[...],
    tasks=[...],
    step_callback=tracer.step,   # each agent step
    task_callback=tracer.task,   # each completed task
)
crew.kickoff()
tracer.flush()   # → one verifiable TraceSession
```

Optional explicit memory helper:

```python
from onemem_crewai import create_onemem_memory

memory = create_onemem_memory(namespace="crew-namespace")
prompt = memory.recall_context("Plan the research task")
result = crew.kickoff(inputs={"topic": prompt})
memory.capture(f"Crew result: {result}")
```

## How it works

`OneMemTracer` buffers CrewAI's `step_callback`/`task_callback` events and, on
`flush()`, writes one TraceSession via the `onemem-trace` Node CLI
(`@onemem/sdk-ts`) — CrewAI is Python and OneMem's trace stack (Walrus/Seal) is
JS-only, so the on-chain write + **zero-config** provisioning of
namespace/cap/signer happen in the bridge. Defensive: a OneMem failure never
breaks the crew; a failed flush keeps the buffer so a later `flush()` can retry.

`create_onemem_memory(...)` uses `onemem-sdk-python`'s `MemoryClient` bridge for
explicit recall/capture. `recall_context(...)` returns the original input when
memory is disabled, empty, or failing; `capture(...)` returns `False` instead of
raising when the bridge is unavailable.

## Prerequisite

**Node 20+ with `npx` on `PATH`** (the on-chain bridge; `npx` fetches the CLI on
first use).

## Config (env, read by the bridge)

`SUI_NETWORK` (default `testnet`), `ONEMEM_PRIVATE_KEY` (else sui keystore, else a
generated+persisted wallet), `ONEMEM_NAMESPACE_ID` + `ONEMEM_RW_CAP_ID` (else
auto-provisioned), `ONEMEM_TRACE_CMD` (override the CLI invocation).

## Scope (v0.1)

Trace capture and explicit memory recall/capture are shipped. The Mem0-style
`memory_config={"provider": "onemem"}` automatic memory integration is a tracked
follow-up. Spec:
`docs/05-our-architecture/04-frameworks/crewai-provider.md`.
