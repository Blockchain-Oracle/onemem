# ElevenLabs Voice Provider — `onemem-elevenlabs`

OneMem integration for ElevenLabs conversational AI agents. Same subclass pattern as LiveKit; different framework hooks.

---

## API surface

```python
from elevenlabs.conversational_ai import ConversationalAgent
from onemem_elevenlabs import OneMemMemoryAdapter

agent = ConversationalAgent(
    voice_id="...",
    llm_config={"model": "gpt-4o"},
    memory=OneMemMemoryAdapter(
        key=os.getenv("ONEMEM_DELEGATE_KEY"),
        account_id=os.getenv("ONEMEM_ACCOUNT_ID"),
        namespace_id=os.getenv("ONEMEM_NAMESPACE_ID"),
        server_url="https://relayer.memwal.ai",
        agent_id="elevenlabs-voice-bot",
        per_conversation_namespace=False,  # default: share namespace across all conversations
    ),
)

# Start a conversation
conversation = agent.start_conversation(user_id="alice")
```

Per Mem0's ElevenLabs integration shape (per `../../../TRACE_AND_PROVIDERS.md` §1).

---

## Implementation

```python
# onemem_elevenlabs/__init__.py
from elevenlabs.conversational_ai.memory import MemoryAdapter
from onemem import OneMem, OneMemConfig
from typing import Optional, Any
import asyncio


class OneMemMemoryAdapter(MemoryAdapter):
    """OneMem memory adapter for ElevenLabs Conversational AI."""

    def __init__(
        self,
        key: str,
        account_id: str,
        namespace_id: str,
        server_url: str = "https://relayer.memwal.ai",
        agent_id: str = "elevenlabs-voice",
        environment: str = "production",
        per_conversation_namespace: bool = False,
        auto_recall: bool = True,
        auto_capture: bool = True,
        auto_trace: bool = True,
    ):
        super().__init__()
        self._base_config = OneMemConfig(
            key=key, account_id=account_id, namespace_id=namespace_id,
            server_url=server_url, agent_id=agent_id, environment=environment,
        )
        self._per_conversation_namespace = per_conversation_namespace
        self._auto_recall = auto_recall
        self._auto_capture = auto_capture
        self._auto_trace = auto_trace
        self._client: Optional[OneMem] = None
        self._conversation_namespaces: dict[str, str] = {}
        self._conversation_sessions: dict[str, str] = {}

    async def _ensure_client(self):
        if self._client is None:
            self._client = await OneMem.create(self._base_config)

    async def on_conversation_start(self, conversation_id: str, user_id: str, metadata: dict[str, Any]):
        await self._ensure_client()
        if self._per_conversation_namespace:
            ns = await self._client.namespace.create(
                f"elevenlabs-conv-{conversation_id}", kind="SESSION",
            )
            self._conversation_namespaces[conversation_id] = ns.namespace_id
        else:
            self._conversation_namespaces[conversation_id] = self._base_config.namespace_id

        if self._auto_trace:
            session = await self._client.trace.start_session(
                agent_id=f"{self._base_config.agent_id}/conv-{conversation_id}",
                environment=self._base_config.environment,
            )
            self._conversation_sessions[conversation_id] = session.session_id

    async def on_conversation_end(self, conversation_id: str):
        if self._auto_trace and conversation_id in self._conversation_sessions:
            await self._client.trace.end_session(
                self._conversation_sessions[conversation_id], "COMPLETED"
            )
            del self._conversation_sessions[conversation_id]

    async def recall_context(self, conversation_id: str, user_message: str) -> Optional[str]:
        """ElevenLabs calls this BEFORE LLM generation. Inject memories."""
        if not self._auto_recall:
            return None
        results = await self._client.search(
            user_message,
            top_k=3,
            threshold=0.4,
            opts={"namespace_id": self._conversation_namespaces.get(conversation_id)},
        )
        if not results.results:
            return None
        return "Relevant context from prior conversations:\n" + "\n".join(
            f"- {m.text}" for m in results.results[:3]
        )

    async def remember_turn(
        self,
        conversation_id: str,
        user_message: str,
        assistant_message: str,
    ):
        """ElevenLabs calls this AFTER the assistant's response. Capture if enabled."""
        if not self._auto_capture:
            return
        text = f"User: {user_message}\n\nAssistant: {assistant_message}"
        await self._client.add(
            text,
            memory_class="episodic",
            context_tier="L0",
            metadata={"conversation_id": conversation_id, "source": "elevenlabs"},
            opts={"namespace_id": self._conversation_namespaces.get(conversation_id)},
        )

    async def on_tool_call(
        self,
        conversation_id: str,
        tool_name: str,
        tool_input: dict,
        tool_output: dict,
    ):
        if not self._auto_trace or conversation_id not in self._conversation_sessions:
            return
        session_id = self._conversation_sessions[conversation_id]
        call = await self._client.trace.append_call(session_id, {
            "tool_name": tool_name,
            "tool_namespace": "elevenlabs-tool",
            "input": tool_input,
        })
        await self._client.trace.close_call(session_id, call.call_id, {
            "output": tool_output,
        }, "SUCCESS")
```

---

## Why LiveKit AND ElevenLabs at v0.1 (both, not one)

You raised this explicitly: voice agents are a category, and the two leaders are both worth shipping for at v0.1.

- **Same architectural pattern** (memory adapter subclass) → minimal incremental work after LiveKit lands
- **Different developer audiences** — LiveKit users build their own apps; ElevenLabs users use the ElevenLabs platform. Two non-overlapping user pools
- **Voice category as a wedge** — Mem0 has both; we match. Pipecat (v0.2) completes the voice trio

---

## Install + distribution

```bash
pip install onemem-elevenlabs
```

Distribution: PyPI + GitHub `onemem/onemem-elevenlabs`.

---

## Cross-references

- `README.md`
- `livekit-voice-provider.md` — sibling, same pattern
- `trace-emit-contract.md`
- `../02-sdks/sdk-python.md`
- `../../../TRACE_AND_PROVIDERS.md` §1 — Mem0 ElevenLabs reference
