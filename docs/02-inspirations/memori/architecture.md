# Memori — Architecture Deep Dive

## What it is
Memori (by **MemoriLabs / GibsonAI** — same team; org is `MemoriLabs`, repo lives under `GibsonAI/memori`) is an Apache-2.0, **SQL-native**, LLM-agnostic memory layer that intercepts chat completions, distills each turn into structured records (facts, preferences, rules, skills, relationships), and exposes them back to the next call — with **no agent-code changes**. Hit **81.95% on LoCoMo while using ~5% of the full-context footprint**. Available as open-source SDK (Python + TypeScript) or **Memori Cloud**. The same team also operates **GibsonAI**, a serverless MySQL/Postgres backend tuned for Memori workloads. ~14.3k GitHub stars.

## Architecture (ASCII)

```
┌──────────────────────────────────────────────────────────────────┐
│ Your existing LLM client (OpenAI/Anthropic/Gemini/Bedrock/etc.)  │
│                                                                  │
│      const mem = new Memori().llm.register(client)               │
│      mem.attribution('user_123', 'support_agent')                │
└────────────────────────────┬─────────────────────────────────────┘
                             │ intercepted chat.completions.create
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ Memori interceptor                                               │
│   1. Inject relevant memories into the prompt (recall)           │
│   2. Forward to LLM                                              │
│   3. On response: classify the turn into                         │
│      attributes | events | facts | people | preferences          │
│      | relationships | rules | skills                            │
│   4. Persist with attribution (user, agent, session)             │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ Storage (BYODB)                                                  │
│   SQLAlchemy adapters: PostgreSQL | MySQL | SQLite | MongoDB     │
│   Hosted: Memori Cloud (managed) or GibsonAI serverless          │
│   Schema is the product: structured rows, not opaque blobs       │
└──────────────────────────────────────────────────────────────────┘

Modes:  Auto (background, zero code)   |   Conscious (explicit recall tool)
```

## Storage model
- **Datastore-agnostic** via SQLAlchemy adapters: `mysql_adapter`, `postgresql_adapter`, `sqlite_adapter`, plus a MongoDB adapter (added in a recent release).
- **SQL-native**: memories live in typed tables with classified columns — explainable lineage, not just vectors.
- Embeddings are **optional** (semantic recall is supported but the headline pitch is structured SQL recall).
- **Encryption**: relies on the underlying DB; no client-side key story.
- **Memori Cloud** is the managed option; **BYODB** is the self-hosted norm.

## API surface
- `Memori()` constructor; `.llm.register(client)` wraps an existing OpenAI/Anthropic/Gemini SDK client.
- `mem.attribution(user_id, agent_id)` — namespaces all subsequent memories.
- `memori_recall(query)` tool exposed to the agent (Conscious mode).
- REST API (Memori Cloud) for memory CRUD and search.
- Drop-in support for LangChain, Pydantic AI, Agno.
- MCP server shipped; OpenClaw plugin; Hermes Agent provider.

## Memory taxonomy
Three tracking layers:
- **Entity** — users, places, things.
- **Process** — agents, programs.
- **Session** — current interaction.

Eight structured categories applied to each captured turn:
**attributes, events, facts, people, preferences, relationships, rules, skills.**

Two operating modes:
- **Auto mode** — background capture + auto-inject, zero code changes.
- **Conscious mode** — agent explicitly calls `memori_recall` as a tool.

## Integration model
- Python (`pip install memorisdk` / `pip install memori`) + TypeScript (`npm install @memorilabs/memori`).
- Wraps the LLM client (interceptor pattern) — does **not** require a framework.
- First-party connectors: LangChain, Pydantic AI, Agno, OpenClaw, Hermes, Claude Code, Cursor.
- MCP server.
- BYODB lets you sit it on top of an existing Postgres/MySQL/SQLite — no extra infra.

## Dashboard / UI
- **`app.memorilabs.ai`** managed console:
  - memories explorer (rows with classification + lineage)
  - analytics
  - playground
  - API key management
- Each result includes "why this was included" (entity / time / source) — explainability surfaced in the UI.

## Pricing (signal-only)
Free ($0; 5K created / 15K recalled), Starter ($19; 25K/100K), Pro ($99; 150K/500K + private Slack), Enterprise (custom + forward-deployed engineers). All tiers include the full Augmentation feature set; tiers differ on volume.

## What we'd borrow for OneMem
- **SQL-native, typed memory schema** — OneMem's anchored records should be **structured + classified**, not opaque blobs. Walrus blob ID + a SQL row referencing it = the clean pattern.
- **Interceptor integration model** — wrap the LLM client, don't ask the user to refactor their agent. This is the lowest-friction way to ship OneMem into existing OpenAI/Anthropic SDK codebases.
- **Auto vs Conscious split** — mirrors the always-on telemetry vs. agent-controlled-recall distinction OneMem needs.
- **Explainability lineage in the dashboard** ("why this was included by entity/time/source") — this is the UX cue for OneMem's verifiability story; we add "+ verify on Sui" to that same row.
- **BYODB pattern** — meets devs where they are; OneMem's parallel is "bring your own Walrus publisher / your own Sui address."
- **GibsonAI verticalization** (paid managed DB tuned to the OSS lib) is a viable revenue path that doesn't cannibalize the OSS — worth modeling.

## Sources
- https://github.com/GibsonAI/memori
- https://github.com/GibsonAI/memori/blob/main/README.md
- https://gibsonai.github.io/memori/
- https://gibsonai.github.io/memori/core-concepts/overview/
- https://gibsonai.github.io/memori/getting-started/quick-start/
- https://memorilabs.ai/
- https://memorilabs.ai/pricing/
- https://memorilabs.ai/docs/open-source/databases/gibsonai/
