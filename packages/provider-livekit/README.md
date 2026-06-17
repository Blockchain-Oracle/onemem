# onemem-livekit

Record **LiveKit Agents** voice sessions as **verifiable on-chain OneMem
TraceSessions** (Sui + Walrus + Seal) — every conversation turn + tool/function
call captured as Merkle-chained `ActionCall`s anyone can verify.

## Usage

```python
from livekit.agents import AgentSession
from onemem_livekit import OneMemTracer

session = AgentSession(...)
OneMemTracer(agent_id="voice-bot").attach(session)   # auto-flushes on close
# ... run the session as usual ...
```

## How it works

`OneMemTracer.attach(session)` subscribes to the LiveKit `AgentSession` events
(`conversation_item_added`, `function_tools_executed`) and flushes one
TraceSession on `close` via the `onemem-trace` Node CLI (`@onemem/sdk-ts`) —
LiveKit Agents is Python and OneMem's trace stack (Walrus/Seal) is JS-only, so
the on-chain write + **zero-config** provisioning happen in the bridge.
Defensive: a OneMem failure never breaks the voice session.

## Prerequisite

**Node 20+ with `npx` on `PATH`** (the on-chain bridge).

## Config (env, read by the bridge)

`SUI_NETWORK` (default `testnet`), `ONEMEM_PRIVATE_KEY` (else sui keystore, else a
generated+persisted wallet), `ONEMEM_NAMESPACE_ID` + `ONEMEM_RW_CAP_ID` (else
auto-provisioned), `ONEMEM_TRACE_CMD` (override the CLI invocation).

## Scope (v0.1)

Trace-only. Memory recall/capture is a tracked follow-up. Spec:
`docs/05-our-architecture/04-frameworks/livekit-voice-provider.md`.
