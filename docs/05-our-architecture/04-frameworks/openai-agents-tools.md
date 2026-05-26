# OpenAI Agents Tools — `@onemem/openai-agents`

Function tools that any `Agent` in OpenAI Agents SDK can use to read/write OneMem. Matches Mem0's `save_memory` / `search_memory` shape exactly.

---

## API surface

```python
from agents import Agent
from onemem.openai_agents import (
    save_memory,
    search_memory,
    verify_trace,
    replay_session,
)

agent = Agent(
    name="research_agent",
    instructions="You are a research assistant. Use OneMem to remember user preferences and prior findings.",
    tools=[save_memory, search_memory, verify_trace, replay_session],
)

# The agent now has access to OneMem as callable functions.
result = agent.run("Remember that the user prefers TypeScript over Python.")
# → agent calls save_memory(text=..., metadata=...) → memory persisted on Walrus + attested on Sui
```

TypeScript variant (matching OpenAI Agents JS SDK):

```ts
import { Agent } from "openai-agents";
import { saveMemory, searchMemory, verifyTrace, replaySession } from "@onemem/openai-agents";

const agent = new Agent({
  name: "research_agent",
  instructions: "...",
  tools: [saveMemory, searchMemory, verifyTrace, replaySession],
});
```

---

## Tool implementations

```python
# onemem/openai_agents/__init__.py
from agents import function_tool
from onemem import OneMem, OneMemConfig
import os
import asyncio

_client: OneMem | None = None

async def _get_client() -> OneMem:
    global _client
    if _client is None:
        _client = await OneMem.create(OneMemConfig.from_env())
    return _client


@function_tool
async def save_memory(
    text: str,
    memory_class: str = "semantic",
    metadata: dict | None = None,
) -> dict:
    """
    Save a memory to OneMem (encrypted on Walrus, attested on Sui).

    Args:
        text: The memory content to save.
        memory_class: One of "semantic" | "episodic" | "procedural". Default "semantic".
        metadata: Optional dict of metadata to attach.

    Returns:
        { "memory_id": "...", "walrus_blob_id": "...", "sui_tx_digest": "..." }
    """
    client = await _get_client()
    result = await client.add(text, memory_class=memory_class, metadata=metadata or {})
    return {
        "memory_id": result.memory_id,
        "walrus_blob_id": result.walrus_blob_id,
        "sui_tx_digest": result.sui_tx_digest,
    }


@function_tool
async def search_memory(
    query: str,
    top_k: int = 5,
    threshold: float = 0.3,
) -> dict:
    """
    Search OneMem for memories relevant to the query.

    Args:
        query: Search query (natural language).
        top_k: Max results to return.
        threshold: Minimum relevance score (0.0-1.0).

    Returns:
        { "memories": [{ "text": "...", "memory_id": "...", "verified": true, ... }, ...] }
    """
    client = await _get_client()
    result = await client.search(query, top_k=top_k, threshold=threshold)
    return {
        "memories": [
            {
                "text": m.text,
                "memory_id": m.id,
                "memory_class": m.memory_class.value,
                "verified": m.verified,
                "metadata": m.metadata,
            }
            for m in result.results
        ]
    }


@function_tool
async def verify_trace(session_id: str) -> dict:
    """
    Verify the Merkle chain integrity of a OneMem trace session.

    Args:
        session_id: Sui object ID of the TraceSession.

    Returns:
        { "verified": true | false, "details": {...} }
    """
    client = await _get_client()
    result = await client.trace.verify_session(session_id)
    return {"verified": result.verified, "details": result.details.dict() if result.details else None}


@function_tool
async def replay_session(session_id: str) -> dict:
    """
    Reconstruct a OneMem trace session from on-chain commits + Walrus blobs.

    Args:
        session_id: Sui object ID of the TraceSession.

    Returns:
        { "session": {...}, "calls": [{...}, ...] }
    """
    client = await _get_client()
    result = await client.trace.replay_session(session_id)
    return {"session": result.session.dict(), "calls": [c.dict() for c in result.calls]}
```

---

## Trace emit (auto)

When an OpenAI Agents SDK agent is initialized with OneMem tools, the agent's actions are NOT auto-traced (the SDK doesn't have hook injection like Claude Code). However:

- Every call to `save_memory` / `search_memory` / `verify_trace` / `replay_session` is itself an `ActionCall` on the trace session
- For full coverage, users wrap their agent with the `OneMemAgentObserver` (planned for v0.2 — captures every tool call the agent makes)

At v0.1: only the OneMem tool calls themselves are traced. This is the "partial coverage" tier per `03-runtimes/mcp-server.md`.

---

## Install + distribution

```bash
# Python
pip install onemem-openai-agents

# TypeScript
npm install @onemem/openai-agents
```

---

## Cross-references

- `README.md`
- `trace-emit-contract.md`
- `../02-sdks/shared-api-surface.md`
- `../../../TRACE_AND_PROVIDERS.md` §1 — Mem0 `save_memory` / `search_memory` reference
