# Cognee (Cogni)

## What it is

Cognee is the leading open-source **graph + vector** memory layer for AI agents, from `topoteretes/cognee`. The project frames itself as "the memory control plane for AI agents in 6 lines of code." It's Apache-2.0, ~6K+ GitHub stars (and graduated GitHub's Secure Open Source Program), and is one of the most architecturally distinctive memory systems in the open ecosystem.

The differentiator: documents aren't only matched on similarity — they're **linked through shared concepts and entities** in a knowledge graph, so retrieval can traverse a semantic network and pull richer, contextually connected info than pure vector RAG.

## Storage model

- **Hybrid graph + vector.**
  - Graph backend: Neo4j (default), with adapters for KuzuDB, FalkorDB, Memgraph.
  - Vector backend: LanceDB (default), with adapters for Qdrant, Weaviate, Chroma, Milvus, PGVector, Pinecone.
  - Relational metadata: SQLite or PostgreSQL.
- **Session memory.** Fast in-memory cache for the current interaction, async-synced to the permanent graph in the background.
- **Ontology grounding.** Maintains consistent semantic meaning across documents as data evolves — facts get re-linked when the underlying ontology shifts.
- **Multimodal.** Handles text, images, audio, code.

## API surface

Just 4 primitives:

- `cognee.add(data)` — ingest raw documents/data
- `cognee.cognify()` — build the graph + vectors (extracts entities, relationships, builds embeddings)
- `cognee.search(query)` — auto-routes between graph traversal and vector similarity
- `cognee.prune()` / `cognee.delete()` — remove

Higher-level: `remember`, `recall`, `forget`, `improve` (with feedback loop).

Plus a managed Cognee Cloud (`await cognee.serve()`), notebooks UI, graph explorer, and Claude Code plugin (lifecycle hooks → session memory → permanent graph at session-end).

## Integration model

- **Python SDK** is primary.
- **Claude Code plugin** that automatically captures tool calls into session memory via hooks and syncs to the permanent knowledge graph at session end — this is *exactly* the pattern OneMem wants for MemWal.
- **MCP server** available for cross-tool use.
- **Deployment**: Docker, Modal, Railway, Fly.io, Render.
- **Framework support**: LangChain, LlamaIndex, OpenAI Agents, etc.

## What we'd borrow for OneMem

- **The 4-primitive API surface (`add`, `cognify`, `search`, `prune`)** is the cleanest in the space. OneMem should mirror this — every additional verb is friction.
- **The Claude Code lifecycle-hook pattern** is a near-direct template for MemWal's session-end commit. Cognee does it for a centralized graph; OneMem does it for Walrus + Sui anchor. Same UX, different substrate.
- **Graph + vector hybrid is the right architectural floor.** A pure vector layer can't represent entity relationships; a pure graph can't do fuzzy semantic match. OneMem's chain object schema needs to support both (relationships as Move object refs, vectors as Walrus-stored embeddings with on-chain hashes).
- **Ontology grounding.** When the underlying schema changes, you need re-linking. On-chain, this is non-trivial — but a Sui `MemoryNamespace` could carry a version number and a migration policy.
- **Direct integration target.** Cognee is large enough that "OneMem as a verifiable backend for cognee" is a real PR conversation, not vapor.

## Sources

- https://github.com/topoteretes/cognee
- https://www.cognee.ai/
- https://medium.com/@cognee/cognee-ai-memory-with-graph-based-search-how-cognee-links-data-952b34686ed4
- https://cohorte.co/blog/cognee-building-ai-agent-memory-in-five-lines-of-code--a-friendly-no-hype-field-guide
- https://www.cognee.ai/blog/cognee-news/cognee-github-secure-open-source-program
