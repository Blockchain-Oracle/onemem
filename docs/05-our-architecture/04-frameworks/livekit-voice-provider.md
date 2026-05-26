# LiveKit Voice Provider — `onemem-livekit`

OneMem integration for LiveKit voice agents. Subclass of LiveKit's memory primitive, backed by `onemem-sdk-python`.

---

## API surface

```python
from livekit.agents import VoiceAgent, llm
from onemem_livekit import OneMemMemory

agent = VoiceAgent(
    llm=llm.OpenAI(model="gpt-4o"),
    memory=OneMemMemory(
        key=os.getenv("ONEMEM_DELEGATE_KEY"),
        account_id=os.getenv("ONEMEM_ACCOUNT_ID"),
        namespace_id=os.getenv("ONEMEM_NAMESPACE_ID"),
        server_url="https://relayer.memwal.ai",
        agent_id="voice-bot",
        per_room_namespace=True,  # mint a sub-namespace per LiveKit room
    ),
)

# In your LiveKit room handler:
@room.on("participant_connected")
async def on_participant(participant):
    await agent.start(room, participant)
```

Per Mem0's LiveKit integration shape (per `../../../TRACE_AND_PROVIDERS.md` §1).

---

## Implementation

```python
# onemem_livekit/__init__.py
from livekit.agents.memory import Memory
from onemem import OneMem, OneMemConfig
from typing import Optional, Any
import asyncio


class OneMemMemory(Memory):
    """OneMem-backed memory provider for LiveKit voice agents."""

    def __init__(
        self,
        key: str,
        account_id: str,
        namespace_id: str,
        server_url: str = "https://relayer.memwal.ai",
        agent_id: str = "livekit-voice",
        environment: str = "production",
        per_room_namespace: bool = False,
        auto_recall: bool = True,
        auto_capture: bool = True,
        auto_trace: bool = True,
    ):
        super().__init__()
        self._base_config = OneMemConfig(
            key=key,
            account_id=account_id,
            namespace_id=namespace_id,
            server_url=server_url,
            agent_id=agent_id,
            environment=environment,
        )
        self._per_room_namespace = per_room_namespace
        self._auto_recall = auto_recall
        self._auto_capture = auto_capture
        self._auto_trace = auto_trace
        self._client: Optional[OneMem] = None
        self._room_namespaces: dict[str, str] = {}
        self._room_sessions: dict[str, str] = {}

    async def _ensure_client(self):
        if self._client is None:
            self._client = await OneMem.create(self._base_config)

    async def on_room_start(self, room_id: str, room_metadata: dict[str, Any]):
        """LiveKit calls this when a room is joined."""
        await self._ensure_client()
        if self._per_room_namespace:
            # Mint a sub-namespace per room (for privacy + scoping)
            ns_result = await self._client.namespace.create(
                f"livekit-room-{room_id}",
                kind="SESSION",
            )
            self._room_namespaces[room_id] = ns_result.namespace_id
        else:
            self._room_namespaces[room_id] = self._base_config.namespace_id

        if self._auto_trace:
            # Start a trace session per room
            session = await self._client.trace.start_session(
                agent_id=f"{self._base_config.agent_id}/room-{room_id}",
                environment=self._base_config.environment,
            )
            self._room_sessions[room_id] = session.session_id

    async def on_room_end(self, room_id: str):
        """LiveKit calls this when a room ends."""
        if self._auto_trace and room_id in self._room_sessions:
            await self._client.trace.end_session(self._room_sessions[room_id], "COMPLETED")
            del self._room_sessions[room_id]

    async def on_user_message(self, room_id: str, user_id: str, transcript: str):
        """User said something. Optionally inject relevant memories."""
        if not self._auto_recall:
            return None
        results = await self._client.search(
            transcript,
            top_k=3,
            threshold=0.4,
            opts={"namespace_id": self._room_namespaces.get(room_id)},
        )
        if not results.results:
            return None
        # Return as system context to be injected before LLM call
        return _format_memories_for_voice(results.results)

    async def on_assistant_response(self, room_id: str, user_transcript: str, assistant_response: str):
        """LiveKit calls after the assistant responds. Capture if enabled."""
        if not self._auto_capture:
            return
        text = f"User said: {user_transcript}\n\nAssistant replied: {assistant_response}"
        await self._client.add(
            text,
            memory_class="episodic",
            context_tier="L0",
            metadata={"room_id": room_id, "source": "livekit"},
            opts={"namespace_id": self._room_namespaces.get(room_id)},
        )

    async def on_tool_call(self, room_id: str, tool_name: str, tool_input: dict, tool_output: dict):
        """LiveKit fires this when the assistant calls a tool. Trace it."""
        if not self._auto_trace or room_id not in self._room_sessions:
            return
        session_id = self._room_sessions[room_id]
        call = await self._client.trace.append_call(session_id, {
            "tool_name": tool_name,
            "tool_namespace": "livekit-tool",
            "input": tool_input,
        })
        await self._client.trace.close_call(session_id, call.call_id, {
            "output": tool_output,
        }, "SUCCESS")


def _format_memories_for_voice(memories) -> str:
    """Format memories as a system context block for voice TTS-friendly delivery."""
    if not memories:
        return ""
    return "Context from prior conversations:\n" + "\n".join(
        f"- {m.text}" for m in memories[:3]
    )
```

---

## Voice-specific considerations

- **Streaming partial transcripts**: `on_user_message` fires on final transcript per LiveKit convention. Partial transcripts are NOT memorized — too noisy.
- **TTS-friendly memory format**: when injecting memories into a voice agent's context, format as brief sentences (no markdown, no code blocks). The `_format_memories_for_voice` helper handles this.
- **Per-room sessions**: optional. If enabled (`per_room_namespace=True`), each LiveKit room gets its own MemoryNamespace + TraceSession. Useful for privacy in multi-tenant voice apps.
- **Latency budget**: voice agents need <500ms recall p95. `client.search` is fast (~200ms typical via MemWal relayer); fine.

---

## Install + distribution

```bash
pip install onemem-livekit
```

Distribution: PyPI + GitHub `onemem/onemem-livekit`.

---

## Cross-references

- `README.md`
- `elevenlabs-voice-provider.md` — sibling voice provider, same pattern
- `trace-emit-contract.md`
- `../02-sdks/sdk-python.md`
- `../../../TRACE_AND_PROVIDERS.md` §1 — Mem0 LiveKit reference
