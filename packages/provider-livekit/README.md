# onemem-livekit

Record **LiveKit Agents** voice sessions as **verifiable on-chain OneMem
TraceSessions** (Sui + Walrus + Seal) — every conversation turn + tool/function
call captured as Merkle-chained `ActionCall`s anyone can verify.

**Publication note, 2026-06-18:** this README describes repo-local
`onemem-livekit@0.1.1`. `pnpm registry:status` currently reports PyPI latest as
`0.1.0`, which does not include `create_onemem_memory(...)`; use source or wait
for registry status to report `0.1.1` current before relying on that helper from
PyPI.

## Usage

```python
from livekit.agents import AgentSession
from onemem_livekit import OneMemTracer

session = AgentSession(...)
OneMemTracer(agent_id="voice-bot").attach(session)   # auto-flushes on close
# ... run the session as usual ...
```

Optional explicit memory helper:

```python
from onemem_livekit import create_onemem_memory

memory = create_onemem_memory(namespace="voice-room")
context = memory.recall_context("How should I greet Alice?")
# Inject `context` into your LiveKit agent prompt or instructions.
memory.capture("User: hi\nAssistant: concise greeting")
```

## How it works

`OneMemTracer.attach(session)` subscribes to the LiveKit `AgentSession` events
(`conversation_item_added`, `function_tools_executed`) and flushes one
TraceSession on `close` via the `onemem-trace` Node CLI (`@onemem/sdk-ts`) —
LiveKit Agents is Python and OneMem's trace stack (Walrus/Seal) is JS-only, so
the on-chain write + **zero-config** provisioning happen in the bridge.
Defensive: a OneMem failure never breaks the voice session.

`create_onemem_memory(...)` uses `onemem-sdk-python`'s `MemoryClient` bridge for
explicit recall/capture. `recall_context(...)` returns the original text when
memory is disabled, empty, or failing; `capture(...)` returns `False` instead of
raising when the bridge is unavailable.

## Prerequisite

**Node 20+ with `npx` on `PATH`** (the on-chain bridge).

## Config (env, read by the bridge)

`SUI_NETWORK` (default `testnet`), `ONEMEM_PRIVATE_KEY` (else sui keystore, else a
generated+persisted wallet), `ONEMEM_NAMESPACE_ID` + `ONEMEM_RW_CAP_ID` (else
auto-provisioned), `ONEMEM_TRACE_CMD` (override the CLI invocation).

## Scope (v0.1)

Trace capture and explicit memory recall/capture are shipped in repo-local
source. Native LiveKit memory subclassing and automatic memory injection remain
tracked follow-ups. Spec:
`docs/05-our-architecture/04-frameworks/livekit-voice-provider.md`.
