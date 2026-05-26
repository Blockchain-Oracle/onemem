# OpenViking

## What it is

OpenViking is an open-source context database for AI agents from **Volcengine (ByteDance)**. Rather than the usual chunk-and-embed RAG model, it organizes agent context (memory, resources, and skills) as a **filesystem-paradigm** — directories, files, hierarchies. The pitch is that this both compresses what the agent sees and gives the agent an intuitive structure to navigate.

Combined with ByteDance's OpenClaw coding agent, OpenViking is reported to raise task completion from 35.65% → 52.08% while cutting input tokens by ~80% (from 24.6M → 4.3M). Repo went viral fast — 13K+ GitHub stars shortly after release in early 2026.

## Storage model

- **Filesystem paradigm.** Memories, resources, and skills are stored as files in a directory tree, not as a flat vector index. The agent navigates them with a `viking://` URI scheme.
- **Three-tier context loading.** Every entry is processed into:
  - **L0** — one-sentence summary (cheap to retrieve, cheap to scan)
  - **L1** — overview with core info (used during planning)
  - **L2** — full original content (loaded only when needed for deep reading)
- **Directory recursive retrieval.** Retrieval pipeline first scores directories with vector search, then descends into the winning directory and re-runs retrieval, recursing as deep as needed.
- **Self-evolving memory.** On session commit, the server runs an LLM-driven extraction pass that automatically updates `User/` and `Agent/` memory directories — six categories of extracted facts.
- **Self-hosted** (local or cloud), AGPL-3.0.

## API surface

Hermes-bound tools:

- `viking_search` — vector + recursive directory search
- `viking_read` — read a node at L0/L1/L2
- `viking_browse` — list children of a directory
- `viking_remember` — write an entry (triggers extraction)
- `viking_add_resource` — attach a resource (file/asset) into the tree

Install: `pip install openviking` + `openviking-server`. Config: `OPENVIKING_ENDPOINT` env var.

## Integration model

- **Standalone server** with HTTP API.
- **Native OpenClaw plugin** — the primary integration target.
- **Hermes Agent provider** for cross-runtime use.
- **`viking://` URI** scheme for embedding hierarchical refs anywhere.

## What we'd borrow for OneMem

- **L0/L1/L2 tiering is the single most copyable idea.** For a Walrus-backed store, this maps to: L0 inline on Sui (cheap), L1 in a small Walrus blob (medium), L2 in a large Walrus blob (only loaded on demand). OneMem could literally adopt this taxonomy and call it the same names.
- **Filesystem-as-namespace.** A Sui `MemoryNamespace` could mirror a filesystem hierarchy of child objects — gives users an intuitive mental model and lets agents reason about scope.
- **Token-economics validation.** The 80% token reduction OpenViking reports is the precise pain OneMem also addresses — provides OneMem a marketing comparable.
- **Server-side extraction on commit.** OneMem's "anchor at session end" workflow could trigger the same kind of LLM-driven distillation, write the L0/L1 to Sui, and pin the L2 raw transcript to Walrus.
- **Negative diff.** OpenViking is centralized and AGPL — OneMem's wedge is the verifiable + decentralized storage layer that OpenViking deliberately doesn't have. A "MemWal-backed OpenViking" is an actual integration story.

## Sources

- https://github.com/volcengine/OpenViking
- https://openviking.ai/
- https://docs.openviking.ai/
- https://developers.redhat.com/articles/2026/04/23/deploy-openviking-openshift-ai-improve-ai-agent-memory
- https://www.marktechpost.com/2026/03/15/meet-openviking-an-open-source-context-database-that-brings-filesystem-based-memory-and-retrieval-to-ai-agent-systems-like-openclaw/
- https://hermes-agent.nousresearch.com/docs/user-guide/features/memory-providers
