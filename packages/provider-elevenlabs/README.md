# onemem-elevenlabs

Record **ElevenLabs Conversational AI** voice sessions as **verifiable on-chain
OneMem TraceSessions** (Sui + Walrus + Seal) — every transcript turn + client
tool call captured as Merkle-chained `ActionCall`s anyone can verify.

## Usage

```python
from elevenlabs.conversational_ai.conversation import Conversation, ClientTools
from onemem_elevenlabs import OneMemTracer

tracer = OneMemTracer(agent_id="voice-bot")
conv = Conversation(
    client, agent_id, requires_auth=True,
    client_tools=tracer.wrap_tools(ClientTools()),   # captures tool calls
    **tracer.callbacks(),                             # captures transcripts; flushes on end
)
# ... run the conversation as usual ...
```

`callbacks(...)` chains any callbacks you already pass, so OneMem observes
without displacing your own handlers.

## How it works

ElevenLabs invokes callbacks (`callback_user_transcript`,
`callback_agent_response`, `callback_agent_response_correction`,
`callback_end_session`) and client-tool handlers during a conversation.
`OneMemTracer` wraps them to buffer each turn + tool call, then flushes one
TraceSession on session end via the `onemem-trace` Node CLI (`@onemem/sdk-ts`) —
the ElevenLabs SDK is Python and OneMem's trace stack (Walrus/Seal) is JS-only,
so the on-chain write + **zero-config** provisioning happen in the bridge.
Defensive: a OneMem failure never breaks the voice conversation.

## Prerequisite

**Node 18+ with `npx` on `PATH`** (the on-chain bridge).

## Config (env, read by the bridge)

`SUI_NETWORK` (default `testnet`), `ONEMEM_PRIVATE_KEY` (else sui keystore, else a
generated+persisted wallet), `ONEMEM_NAMESPACE_ID` + `ONEMEM_RW_CAP_ID` (else
auto-provisioned), `ONEMEM_TRACE_CMD` (override the CLI invocation).

## Scope (v0.1)

Trace-only. Memory recall/capture is a tracked follow-up. Spec:
`docs/05-our-architecture/04-frameworks/elevenlabs-voice-provider.md`.
