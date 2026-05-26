# Deferred Frameworks — v0.2+

Frameworks we'll ship providers for AFTER v0.1. At v0.1, users on these frameworks can use OneMem via the MCP server (`@onemem/mcp`) — partial coverage but functional.

---

## v0.2 framework rollout (in priority order)

### 1. LangChain — `onemem-langchain` (Python)

The most-used AI app framework. Mem0 has `Mem0Memory` class; we ship `OneMemMemory`.

```python
# Planned v0.2 shape
from langchain.memory import OneMemMemory
from langchain.chains import ConversationChain

memory = OneMemMemory(api_key=..., account_id=..., namespace_id=...)
chain = ConversationChain(llm=llm, memory=memory)
```

Effort: ~1-2 days. Wraps the SDK's memory API to LangChain's `BaseMemory` interface.

### 2. LangGraph — `onemem-langgraph` (Python)

Multi-agent workflow framework. Critical for "multi-agent coordination" Walrus track must-have at v0.2 depth.

```python
from langgraph.checkpoint.onemem import OneMemCheckpointer
graph.compile(checkpointer=OneMemCheckpointer(client=onemem_client))
```

Effort: ~2 days. Implements LangGraph's `BaseCheckpointSaver` interface backed by our trace pillar.

### 3. AutoGen — `onemem-autogen` (Python)

Microsoft's multi-agent framework. Same pattern as Mem0's AutoGen integration.

Effort: ~1 day. Provider class for AutoGen's memory interface.

### 4. LlamaIndex — `onemem-llamaindex` (Python)

```python
from llama_index.memory.onemem import OneMemMemory
memory = OneMemMemory.from_defaults()
```

Effort: ~1 day. Same `Mem0Memory` class shape mirrored.

### 5. Google ADK — `onemem-google-adk` (Python)

Google's Agent Development Kit. New framework; less established. Match Mem0's integration shape per `../../../TRACE_AND_PROVIDERS.md` §1.

Effort: ~1-2 days.

### 6. Pipecat — `onemem-pipecat` (Python)

Third voice agent provider (after LiveKit + ElevenLabs at v0.1). Same memory adapter pattern.

Effort: ~1 day after LiveKit + ElevenLabs land (same subclass pattern).

### 7. Mastra — `onemem-mastra` (TypeScript)

Mastra is a TS-first agent framework. Shape: `mastra.use(onemem(opts))`.

Effort: ~1-2 days.

### 8. Agno — `onemem-agno` (Python)

Mem0 has `agno` integration. Match shape.

Effort: ~1 day.

---

## What's served via MCP at v0.1 (interim solution)

Until v0.2 ships native providers, users on these frameworks can:

1. Install `@onemem/mcp` per `../03-runtimes/mcp-server.md`
2. Their framework's MCP integration (if any) gives them access to OneMem tools
3. Agent can call `onemem_search_memory` / `onemem_add_memory` / etc as MCP tools

Coverage tier: "agent-routed" — only calls the agent explicitly makes to OneMem tools are traced.

### Frameworks that already support MCP at v0.1

- LangGraph (via langchain-mcp-adapters)
- AutoGen (community MCP integration)
- LlamaIndex (via llama-index-tools-mcp)
- Google ADK (built-in MCP)
- Mastra (built-in MCP)
- LangChain (via langchain-mcp-adapters)

Pipecat + Agno: MCP support TBD; check at v0.2.

---

## Why these are v0.2, not v0.1

All eight are Mem0-mirror pattern (same provider shape, swap backend). Each is ~1-2 days work. v0.1 covers 5 framework categories (model SDK / agent SDK / agent framework / two voice agents) which is sufficient for the Walrus track demo. v0.2 expands to category-saturation.

---

## What's NOT planned (out of scope entirely)

- Frameworks Mem0 doesn't have providers for (smaller / older / niche)
- Frameworks that are themselves orchestration layers OVER LangChain etc (covered transitively)
- Closed-source proprietary frameworks (no integration surface)

---

## Cross-references

- `README.md` — main framework matrix
- `../03-runtimes/mcp-server.md` — the v0.1 fallback for any MCP-capable framework
- `../../../TRACE_AND_PROVIDERS.md` §1 — Mem0 provider patterns per framework (the reference for each v0.2 provider)
- `../../02-inspirations/mem0/README.md` — Mem0 integration matrix
