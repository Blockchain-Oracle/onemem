# Honcho — Architecture Deep Dive

## What it is
Honcho (by **Plastic Labs**) is an AGPL-3.0 "memory system that reasons" — built around the premise that retrieval alone misses implicit context, contradictions, and predictions. It models every participant (human, agent, NPC, group) as a first-class **Peer** with cross-peer representations, and runs four specialised background LLM agents (Deriver / Dialectic / Dreamer / Summarizer) that continuously refine those representations. Used by **Nous Research's Hermes Agent** as the default memory provider. Cloud at `app.honcho.dev`, self-hostable via Docker Compose.

## Architecture (ASCII)

```
                ┌──────────────────────────────────────────┐
   write path → │ FastAPI API server (sync)                │
                │  /v3/workspaces/.../peers/.../sessions   │
                │  session.add_messages()                  │
                │  peer.chat()  ← Dialectic agent (sync)   │
                └──────────────┬───────────────────────────┘
                               │
                               ▼  enqueue
                ┌──────────────────────────────────────────┐
                │ Queue (QueueItem in Postgres)            │
                └──────────────┬───────────────────────────┘
                               │
                               ▼
                ┌──────────────────────────────────────────┐
                │ Deriver worker (`python -m src.deriver`) │
                │   ├ Deriver  → peer representations      │
                │   ├ Dreamer  → Deduction + Induction     │
                │   └ Summarizer → short & long summaries  │
                └──────────────┬───────────────────────────┘
                               │
                               ▼
                ┌──────────────────────────────────────────┐
                │ Storage                                  │
                │   Postgres (SQLAlchemy, JSONB, nanoid)   │
                │   pgvector HNSW (default)                │
                │     OR Turbopuffer / LanceDB             │
                │   Redis (cashews cache)                  │
                │   Collections keyed by (observer,observed)│
                └──────────────────────────────────────────┘
```

## Storage model
- **Primary DB**: Postgres + SQLAlchemy ORM; JSONB columns for extensibility; nanoid PKs; composite FKs for multi-tenant isolation.
- **Vector**: pgvector with HNSW indexes by default; **Turbopuffer** or **LanceDB** swappable.
- **Cache**: Redis via `cashews`.
- **Full-text**: Postgres GIN / FTS for BM25.
- **Multi-tenant key**: Collections keyed by `(observer, observed)` peer pairs — same mechanism powers both self-representation and cross-peer modelling.
- **Encryption**: standard at-rest; no client-held key model.

## API surface
- `session.add_messages([alice.message(...), tutor.message(...)])`
- `peer.chat("what does the user prefer?")` → Dialectic synchronous reasoning, 5 tiers (`minimal` → `max`).
- `session.context(summary=True, tokens=10_000)` → prompt-ready context bundle (~200 ms).
- `peer.search(...)` / `session.search(...)` → hybrid BM25 + vector.
- `peer.representation(...)` → low-latency static snapshot of what's known.
- REST routes follow `/v3/{resource}/{id}/{action}`.
- **MCP server** native (HTTP transport) for Claude Code / Cursor / Cline.

## Memory taxonomy
- **Workspaces** — top-level isolation per app/tenant.
- **Peers** — first-class participants (humans, agents, NPCs, groups, ideas).
- **Sessions** — many-to-many peer interaction threads.
- **Messages** — atomic ingest units, labeled by source peer.
- **Representations** — derived peer beliefs (the actual "memory"); keyed by `(observer, observed)`.
- **Peer cards** — compact identity snapshots.
- **Summaries** — short (every 20 msgs) + long (every 60 msgs).
- **Conclusions** — outputs of the Dreamer's Deduction + Induction specialists.

## Integration model
- Python (`pip install honcho-ai`) and TypeScript (`@honcho-ai/sdk`).
- Native **MCP** server.
- First-party plugins: **Claude Code** (`plastic-labs/claude-honcho`), **Cursor** (`plastic-labs/cursor-honcho`), **OpenClaw** (`plastic-labs/openclaw-honcho`), **Hermes Agent** (Nous).
- Managed (`api.honcho.dev`, $1,000 startup credits) or self-hosted (Docker Compose + Postgres).

## Dashboard / UI
- `app.honcho.dev` — managed console (API keys, workspace browser).
- Honcho Chat — experience layer for trying conversations.
- `evals.honcho.dev` — eval dashboard for reasoning tiers.
- No dedicated visual graph / trace viewer surfaced publicly; the focus is on the reasoning output, not the trace.

## What we'd borrow for OneMem
- **Peer-centric model** (`observer, observed`) — far more general than "users + assistants" and maps cleanly to multi-agent / agent-swarm Sui apps.
- **Sync API + async deriver split** — the canonical pattern for "make user turns fast, do the expensive memory work off-path." OneMem should mirror this exactly for Walrus uploads + Sui anchor txs.
- **Tiered reasoning at query time** (`minimal` → `max`) lets the caller pay only for the cognition they need; OneMem can use the same tier idea for verifiability levels (no-anchor → blob-anchor → full-Seal-encrypted).
- **Plugin proliferation** (Claude Code / Cursor / OpenClaw / Hermes) is the playbook for cross-runtime adoption — one core service + thin runtime adapters.
- **Pgvector + Turbopuffer + LanceDB swap** shows the right level of vector pluggability without writing our own.
- **Conclusions as a first-class artifact** — not just embeddings — is the perfect candidate for Walrus anchoring (small, semantically dense, citation-friendly).

## Sources
- https://github.com/plastic-labs/honcho
- https://github.com/plastic-labs/honcho/blob/main/README.md
- https://github.com/plastic-labs/honcho/blob/main/CLAUDE.md
- https://honcho.dev/
- https://honcho.dev/docs/
- https://github.com/plastic-labs/claude-honcho
- https://github.com/plastic-labs/cursor-honcho
- https://github.com/plastic-labs/openclaw-honcho
- https://github.com/elkimek/honcho-self-hosted
