# onemem-elevenlabs

Record **ElevenLabs Conversational AI** voice sessions as **verifiable on-chain
OneMem TraceSessions** (Sui + Walrus + Seal) — every transcript turn + client
tool call captured as Merkle-chained `ActionCall`s anyone can verify.

**Publication note, 2026-06-18:** `onemem-elevenlabs@0.1.1` is current on PyPI
after `pnpm registry:status --strict` and includes
`create_onemem_memory(...)`. Re-run that command before making a fresh public
install claim.

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

Optional explicit memory helper:

```python
from onemem_elevenlabs import create_onemem_memory

memory = create_onemem_memory(namespace="voice-conversation")
context = memory.recall_context("What does this caller prefer?")
# Inject `context` into your conversation prompt or agent config.
memory.capture("User: appointment tomorrow\nAssistant: confirmed reminder")
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

`create_onemem_memory(...)` uses `onemem-sdk-python`'s `MemoryClient` bridge for
explicit recall/capture. `recall_context(...)` returns the original text when
memory is disabled, empty, or failing; `capture(...)` returns `False` instead of
raising when the bridge is unavailable.

## Prerequisite

**Node 18+ with `npx` on `PATH`** (the on-chain bridge).

## Config (env, read by the bridge)

`SUI_NETWORK` (default `testnet`), `ONEMEM_PRIVATE_KEY` (else sui keystore, else a
generated+persisted wallet), `ONEMEM_NAMESPACE_ID` + `ONEMEM_RW_CAP_ID` (else
auto-provisioned), `ONEMEM_TRACE_CMD` (override the CLI invocation).

## Scope (v0.1)

Trace capture and explicit memory recall/capture are shipped in repo-local
source. Native ElevenLabs memory-adapter integration and automatic memory
injection remain tracked follow-ups. Spec:
`docs/05-our-architecture/04-frameworks/elevenlabs-voice-provider.md`.
