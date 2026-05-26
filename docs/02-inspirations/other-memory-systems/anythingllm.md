# AnythingLLM

## What it is

AnythingLLM (`Mintplex-Labs/anything-llm`) is an open-source, self-hostable, privacy-first **"all-in-one AI productivity accelerator"** — a Docker-deployable app that combines a model runner, vector DB, embedder, and chat UI into one workspace-organized product. Targets both individuals and teams; ships with sensible local defaults so nothing leaves the box unless you allow it.

Memory in AnythingLLM is workspace-scoped: each workspace is an isolated environment with its own documents, vectors, and chat history.

## Storage model

- **Workspaces as isolation unit.** Different projects/clients get different workspaces; security policies and embeddings are workspace-local.
- **Vector store: LanceDB by default** (embedded, serverless, on-disk, scales to millions of vectors with zero config). Adapters for PGVector, Astra, Pinecone, Chroma, Weaviate, Qdrant, Milvus, Zilliz.
- **Relational store: SQLite** (`anythingllm.db`) for workspace/user/auth state.
- **Storage layout:** `lancedb/` folder for vectors, JSON for processed docs, cached embedding calcs, uploaded files, profile pics, branding assets, anonymous usage.
- **Document pipeline:** drag-and-drop ingest → chunk → embed → index. Reuses cached embeddings across re-imports.

## API surface

- Web UI (primary)
- REST API for programmatic doc ingest, chat, workspace management
- Embedding provider plugins (OpenAI, local, etc.)
- LLM provider plugins (OpenAI, Anthropic, Ollama, LM Studio, etc.)
- Agent skills system (function-calling tools the workspace LLM can invoke)

## Integration model

- **Monorepo** with a Vite/React frontend, Node/Express server, and a separate doc-processing service.
- **Docker** as the primary deployment unit.
- **Self-host first**, but also has a cloud tier.
- **OSS** under MIT.

## What we'd borrow for OneMem

- **Workspace as the unit of isolation = MemoryNamespace as the unit of scope.** AnythingLLM validates that users naturally organize memory by project/client/team — OneMem's Sui `MemoryNamespace` object should match that mental model.
- **LanceDB as embedded default.** For OneMem's local cache, an embedded vector store (LanceDB, sqlite-vss, or DuckDB+vss) keeps the install footprint small and dependency-free. No separate Pinecone account needed for a developer to try it.
- **Cached embeddings.** AnythingLLM caches embedding computation aggressively. OneMem should do the same — re-anchoring shouldn't re-embed every blob.
- **Pluggable backend adapters.** AnythingLLM lets users swap vector DBs trivially. OneMem should let users swap blob storage (Walrus default, Arweave/IPFS fallback) and chain anchor (Sui default, EVM bridge later).
- **The "privacy by default" pitch is gold.** AnythingLLM leads with "nothing is shared unless you allow it." OneMem inherits this from Walrus + Seal — leverage it heavily in messaging.
- **Negative diff.** AnythingLLM has no portability, no verifiability, no cross-user sharing primitive beyond "send the Docker volume." OneMem's wedge is precisely "your AnythingLLM workspace as a verifiable, portable, on-chain object."

## Sources

- https://github.com/Mintplex-Labs/anything-llm
- https://anythingllm.com/
- https://deepwiki.com/Mintplex-Labs/anything-llm/1.1-architecture-overview
- https://github.com/Mintplex-Labs/anythingllm-docs/blob/main/pages/setup/vector-database-configuration/local/lancedb.mdx
- https://www.datacamp.com/blog/anythingllm
