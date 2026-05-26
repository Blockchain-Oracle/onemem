# RetainDB

## What it is

RetainDB is a closed-source, cloud-only persistent memory API for AI agents, marketed as "the state layer" between LLMs and apps. It explicitly differentiates itself from vector databases: a vector DB retrieves semantically similar content, a memory layer remembers *what matters over time*. RetainDB claims SOTA on LongMemEval preference recall (88%) and a 0% hallucination rate on documentation questions.

## Storage model

- **Cloud-only.** No self-hostable option. All memory is stored in RetainDB's managed infrastructure.
- **Hybrid retrieval.** Vector + BM25 + a reranker — claimed to be the best mix for arbitrary query types.
- **Seven memory types.** Not enumerated publicly, but the docs reference types covering facts, preferences, conversation, tool-use traces, etc.
- **Delta compression.** Memory deltas are compressed for storage efficiency.
- **Multi-user isolation, deduplication, token-budget management** built in — explicit selling point that "teams take 4-8 weeks to build this; we sell it as a service."

## API surface

Hermes-bound tools:

- `retaindb_profile` — manage agent/user profile
- `retaindb_search` — hybrid retrieval
- `retaindb_context` — assemble a context window for the next prompt
- `retaindb_remember` — write a memory
- `retaindb_forget` — delete

Auth: `RETAINDB_API_KEY` env var. Pricing: $20/month base.

## Integration model

- **REST API** (uses `requests` library client-side).
- **Hermes Agent provider plugin.**
- **Direct framework integrations** documented for LangChain.
- No MCP server bundled (as of latest doc check).
- **No public repo.** RetainDB has a GitHub org (`github.com/RetainDB`) but no public source code — closed-source product.

## What we'd borrow for OneMem

- **The "memory layer ≠ vector DB" framing** is exactly OneMem's positioning differentiator vs. Pinecone/Qdrant/etc.: a memory layer adds dedup, token-budget management, deltas, retention policies. OneMem adds verifiability on top of that, but the underlying value prop is the same.
- **Hybrid retrieval (vector + BM25 + rerank) is table stakes** for any serious memory product. OneMem needs this — RetainDB confirms it's not optional.
- **Seven memory types** — even without the full list, the existence of typed memory (facts vs preferences vs tool-traces vs reflections) is a schema lesson. OneMem's `MemoryNamespace` should be type-aware.
- **Delta compression for Walrus.** Walrus pricing rewards small blobs. Storing deltas (against a previous snapshot) instead of full state per write is the obvious optimization.
- **Wedge inversion.** RetainDB is closed, cloud-only, no portability between users/teams unless you stay on their platform. OneMem's pitch: verifiable + portable + chain-anchored. Same product category, opposite trust assumptions.

## Sources

- https://www.retaindb.com/
- https://www.retaindb.com/features
- https://www.retaindb.com/blogs/vector-database-vs-memory-layer
- https://www.retaindb.com/blogs/persistent-memory-ai-agents
- https://github.com/RetainDB (org, no public repos)
- https://hermes-agent.nousresearch.com/docs/user-guide/features/memory-providers
- https://gamgee.ai/vs/supermemory-vs-retaindb/
