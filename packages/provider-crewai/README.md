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

## How it works

`OneMemTracer` buffers CrewAI's `step_callback`/`task_callback` events and, on
`flush()`, writes one TraceSession via the `onemem-trace` Node CLI
(`@onemem/sdk-ts`) — CrewAI is Python and OneMem's trace stack (Walrus/Seal) is
JS-only, so the on-chain write + **zero-config** provisioning of
namespace/cap/signer happen in the bridge. Defensive: a OneMem failure never
breaks the crew; a failed flush keeps the buffer so a later `flush()` can retry.

## Prerequisite

**Node 20+ with `npx` on `PATH`** (the on-chain bridge; `npx` fetches the CLI on
first use).

## Config (env, read by the bridge)

`SUI_NETWORK` (default `testnet`), `ONEMEM_PRIVATE_KEY` (else sui keystore, else a
generated+persisted wallet), `ONEMEM_NAMESPACE_ID` + `ONEMEM_RW_CAP_ID` (else
auto-provisioned), `ONEMEM_TRACE_CMD` (override the CLI invocation).

## Scope (v0.1)

Trace-only. The Mem0-style `memory_config={"provider": "onemem"}` memory
integration is a tracked follow-up. Spec:
`docs/05-our-architecture/04-frameworks/crewai-provider.md`.
