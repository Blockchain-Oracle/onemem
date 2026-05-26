# Letta — Architecture Deep Dive

## What it is
Letta is the open-source platform for stateful agents, evolved out of the **MemGPT** research project (UC Berkeley Sky Computing Lab, rebranded Sept 2024). Its central thesis: treat the LLM context window as RAM and let agents page memory in/out of external storage via tool calls — an OS-style memory hierarchy. Apache-2.0, Python-first, runs as a self-hostable server (Docker / Postgres) with Python + TypeScript SDKs and a desktop Agent Development Environment (ADE).

## Architecture (ASCII)

```
┌────────────────────────────────────────────────────────────────┐
│ Letta Server (FastAPI, Python; Docker / docker-compose)        │
│                                                                │
│  ┌───────────────────────── Agent Loop ─────────────────────┐  │
│  │  System Prompt                                           │  │
│  │  + CORE MEMORY (in-context, editable blocks)             │  │
│  │       persona | human | shared blocks                    │  │
│  │  + MESSAGE BUFFER (recent dialogue, FIFO + summarized)   │  │
│  │                                                          │  │
│  │  Tool calls:                                             │  │
│  │   core_memory_replace / core_memory_append               │  │
│  │   archival_memory_insert / archival_memory_search        │  │
│  │   conversation_search (recall memory)                    │  │
│  │   send_message, plus user-defined tools                  │  │
│  └────────────┬───────────────────────┬─────────────────────┘  │
│               │                       │                        │
│               ▼                       ▼                        │
│      ARCHIVAL MEMORY            RECALL MEMORY                  │
│      (vector store)             (full message log)             │
│      pgvector / chroma          Postgres tables                │
│                                                                │
│  Sleeptime / "Dream" agents: async background memory edits     │
└────────────────────────────────────────────────────────────────┘
                  ▲                       ▲
                  │                       │
            Python SDK             TypeScript SDK
            REST API               Letta Code CLI
            Agent Development Environment (ADE desktop)
```

## Storage model
- **Postgres** is the primary backend (alembic migrations in repo).
- **Vector**: pgvector by default for archival memory; pluggable.
- **Recall memory**: full message history rows, BM25/keyword search.
- **Core memory**: stored as `Block` rows; always materialized into the system prompt at inference time.
- **MemFS**: newer git-tracked memory system referenced on docs (versioned blocks).
- **Encryption**: relies on Postgres / disk encryption; no client-held key or per-block encryption surfaced.

## API surface
- REST API at `/v1/agents/...` with full CRUD for agents, blocks, sources, archival memory.
- Python: `letta` package (`from letta_client import Letta`).
- TypeScript: `@letta-ai/letta-client`.
- Tool-call API exposed to LLM:
  - `core_memory_append(label, content)`
  - `core_memory_replace(label, old, new)`
  - `archival_memory_insert(content)`
  - `archival_memory_search(query, page)`
  - `conversation_search(query, page)`
- Letta Code CLI (Node 18+) for local terminal interaction.

## Memory taxonomy
- **Core memory** — always in-context; editable blocks (persona, human, shared). Functions as RAM.
- **Recall memory** — complete searchable message history (everything ever said).
- **Archival memory** — explicit external vector store for long-form knowledge; agent writes + searches via tools.
- **Message buffer** — recent rolling window; recursive summarization on eviction.
- **Sleeptime agents** — async memory refinement after the user turn, decoupled from latency.
- Blocks can be **shared** across multiple agents (the multi-agent memory primitive).

## Integration model
- Server-first: you run a Letta server (cloud or self-hosted) and connect agents via API.
- SDKs: Python, TypeScript.
- Desktop ADE for visual agent building / inspection.
- Letta Cloud (managed) is the hosted SaaS counterpart.
- Model-agnostic (Anthropic, OpenAI, others); leaderboard at leaderboard.letta.com.

## Dashboard / UI
- **Agent Development Environment (ADE)**: desktop app (macOS / Windows / Linux) — visual memory block editor, message inspector, tool call traces, agent state browser.
- "Memory palace" visualizer of agent memories for human review.
- ADE is the differentiator vs. headless competitors — closest existing thing to an "agent IDE."

## What we'd borrow for OneMem
- **Tiered memory taxonomy** (core / recall / archival + sleeptime) is the most-cited mental model in the space — OneMem should map our anchor types onto these tiers, not invent new ones.
- **Memory blocks as first-class, editable, shared primitives** — perfect granularity for Walrus blob anchoring (one block = one anchor + one Seal key).
- **MemFS git-tracked memory** is the closest existing parallel to OneMem's verifiable-history idea — but git is not cryptographically anchored. We replace git's trust model with Sui+Walrus.
- **Sleeptime agents** — async background reasoning. OneMem should mirror this with async Walrus uploads + Sui anchor txs so the user-turn latency stays clean.
- **ADE pattern** — a visual agent inspector is table stakes for any memory layer worth selling. OneMem's dashboard should look at ADE, not at Langfuse, for layout cues.

## Sources
- https://github.com/letta-ai/letta
- https://www.letta.com
- https://www.letta.com/blog/agent-memory
- https://docs.letta.com/guides/legacy/memgpt-agents-legacy/
- https://docs.letta.com/concepts/memgpt
- https://atlan.com/know/best-ai-agent-memory-frameworks-2026/
