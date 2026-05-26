# Hindsight

## What it is

Hindsight is an agent memory system that combines a knowledge graph, entity resolution, and multi-strategy retrieval. It is positioned as a "memory that learns" — every interaction is automatically retained, entity-resolved, and made queryable across banks. It claims SOTA on the LongMemEval benchmark.

There are several Hindsight implementations in the wild — the dominant one is **vectorize-io/hindsight** (the project that bundles the Vectorize.io cloud UI at `ui.hindsight.vectorize.io`). Earlier forks live at `hindsight-ai/hindsight-ai` and `ai-genius-automations/hindsight`. Hermes Agent's bundled provider uses the Vectorize line.

## Storage model

- **Banks.** Memories are scoped into named banks (per-user, per-agent, per-project).
- **Two memory pathways.** Inputs are routed into either *world facts* (durable knowledge) or *experiences* (episodic conversation turns).
- **Representation.** Each memory is stored as entities + relationships + time-series, with both sparse and dense vector representations for hybrid recall.
- **Backends.** Hindsight Cloud (managed PostgreSQL + vector store) or local embedded PostgreSQL via `hindsight-all`.

## API surface

The MCP tools (also the Hermes provider tools) are:

- `hindsight_retain` — write a memory block (auto or manual)
- `hindsight_recall` — multi-strategy retrieval
- `hindsight_reflect` — cross-memory synthesis (the differentiator — no other provider in the Hermes set offers this)
- plus REST endpoints for managing agents, memory blocks (CRUD/archive), feedback, keywords, and search

Hermes provider config keys are extensive: `mode`, `bank_id`, `recall_budget`, `memory_mode`, `auto_retain`, `auto_recall`, `retain_async`, `retain_context`, `retain_tags`, `retain_source`, `retain_user_prefix`, `retain_assistant_prefix`, `recall_tags`.

## Integration model

- **MCP server** (`hindsight-mcp`) for agent clients.
- **REST API** for direct service-to-service integration.
- **Hermes Agent provider plugin** with the broadest config-key surface of any of the eight Hermes providers.
- **Vectorize.io cloud UI** at `ui.hindsight.vectorize.io` for inspecting banks and tuning retrieval.

## What we'd borrow for OneMem

- **The two-pathway split** (world facts vs experiences) is a near-perfect match for a Sui `MemoryNamespace` schema: durable facts as long-lived Move objects, episodic experiences as Walrus blobs with on-chain hashes.
- **The `reflect` tool** — synthesis across the memory bank — is exactly the kind of derived view that benefits from a verifiable substrate. If an agent's "reflection" is anchored to Sui with input-hashes, you can later prove which memories produced the conclusion.
- **Bank-as-namespace primitive.** Hindsight's `bank_id` config is essentially what OneMem's `MemoryNamespace` Sui object is — a scoping unit that can be shared across agents.
- **The benchmark-driven positioning** (LongMemEval SOTA) is a model: OneMem should publish its own retrieval-quality numbers from day one.

## Sources

- https://github.com/vectorize-io/hindsight
- https://github.com/hindsight-ai/hindsight-ai
- https://github.com/ai-genius-automations/hindsight
- https://github.com/NousResearch/hermes-agent/blob/main/plugins/memory/hindsight/README.md
- https://ui.hindsight.vectorize.io
- https://hermes-agent.nousresearch.com/docs/user-guide/features/memory-providers
