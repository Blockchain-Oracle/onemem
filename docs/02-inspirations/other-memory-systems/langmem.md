# LangMem

## What it is

LangMem is the **LangChain team's official long-term memory SDK** for AI agents, distinct from (but compatible with) Letta. It's a lightweight Python library that gives agents tools to extract, update, and retrieve memory across sessions, organized around the cognitive science taxonomy of **semantic / episodic / procedural** memory.

LangMem is positioned as the official LangChain-canonical answer to long-term agent memory. Sub-second is *not* its strength — published p95 search latency on LOCOMO is ~60 seconds. The differentiator is the modular, framework-agnostic API and the prompt-optimization angle (it can update an agent's system prompt as it learns).

## Storage model

- **Three memory types** modeled on human cognition:
  - **Semantic** — durable facts, user preferences, domain knowledge, relationships.
  - **Episodic** — past experiences (full conversation turns or distilled).
  - **Procedural** — learned behaviors, prompt updates the agent applies to itself.
- **Storage backend agnostic.** Uses LangGraph's `BaseStore` interface — works with in-memory, Postgres, Redis, S3, custom.
- **Structured writes via `trustcall`.** Type-safe memory consolidation and invalidation; prevents memory corruption from sloppy LLM extractions.

## API surface

- `create_memory_manager` — extract/update memory from conversations
- `create_memory_store_manager` — manage long-term store ops
- Prompt-optimizer hooks — derive system prompt updates from episodic patterns
- Tools that LangGraph agents call inline during runs

## Integration model

- **LangGraph-native** but works standalone with any agent framework.
- **Backend-agnostic.** You bring your own store.
- **Python SDK** (no MCP server bundled, no managed cloud).

## Performance note

The published p95 search latency of ~60s on LOCOMO is significantly slower than Mem0 (~200ms) or Zep. If you need hot-path recall, LangMem isn't the right choice; it's better for batch/post-session memory updates and prompt evolution.

## What we'd borrow for OneMem

- **The semantic / episodic / procedural taxonomy is the strongest schema in the space.** It maps cleanly onto a Sui `MemoryNamespace` with three child objects (or three tag types). OneMem should adopt this taxonomy explicitly — it's already developer-familiar from cognitive science and LangChain docs.
- **Procedural memory = self-modifying prompts.** This is the most interesting category — and the one most in need of verifiability. If an agent rewrites its own prompt, you absolutely want an immutable on-chain trail of what the prompt was at what time. OneMem has a direct value-prop for procedural memory that LangMem can't provide (their store is mutable + opaque).
- **`trustcall`-style structured writes.** LangMem's lesson: LLMs are sloppy at writing structured memory; you need a typed write API with schema validation. OneMem's Move modules give you typed writes at the chain layer — borrow LangMem's UX for the SDK layer.
- **Direct integration target.** LangMem's `BaseStore` interface is the obvious place for an `OneMemStore` adapter. Build it, get every LangGraph agent for free.
- **Negative diff.** Latency. LangMem is slow; OneMem can't be. Use LangMem's batch/async patterns but ensure the hot read path stays under 200ms via local cache.

## Sources

- https://langchain-ai.github.io/langmem/
- https://langchain-ai.github.io/langmem/concepts/conceptual_guide/
- https://docs.langchain.com/oss/python/langchain/long-term-memory
- https://www.langchain.com/blog/langmem-sdk-launch
- https://changelog.langchain.com/announcements/langmem-sdk-for-long-term-agent-memory
- https://www.digitalocean.com/community/tutorials/langmem-sdk-agent-long-term-memory
