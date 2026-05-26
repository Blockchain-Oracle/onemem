# Memory Systems Comparison — OneMem Context

Side-by-side reference for the 7 production memory systems characterized in this folder.
Per-product deep dives live in sibling folders. Mem0 and claude-mem are covered in the parent (`MEM0_DEEP_DIVE.md`, `DEEP_DIVE.md`) and intentionally excluded here.

Folder mapping:
- `zep/` — Zep + Graphiti
- `letta/` — Letta (MemGPT successor)
- `honcho/` — Honcho (Plastic Labs, used by Nous Hermes)
- `memori/` — Memori (MemoriLabs / GibsonAI)
- `mem-ai/` — Mem.ai (consumer notes app, no API)
- `supermemory/` — Supermemory (Cloudflare-native)
- `omega/` — OMEGA (local-first, MCP-native)

---

## 1. Comparison matrix

| Product       | Architecture style                       | Primary storage                          | Vector / graph                          | Encryption                          | Verifiability   | Integration surface                       | Dashboard                                  | Pricing entry                          | Openness                       |
|---------------|------------------------------------------|------------------------------------------|------------------------------------------|--------------------------------------|------------------|--------------------------------------------|---------------------------------------------|-----------------------------------------|---------------------------------|
| **Zep**       | Temporal graph + hybrid retrieval        | Neo4j (or FalkorDB / Kuzu / Neptune)     | Embeddings co-located w/ graph nodes     | At-rest (cloud); SOC 2 / HIPAA       | **None**         | Python, TS, Go SDK + MCP + framework adapters | Cloud console + graph browser               | Free tier; cloud-only                   | Apache-2.0 SDK; closed cloud   |
| **Letta**     | OS-style tiered memory (core/recall/arch)| Postgres + pgvector                      | pgvector (pluggable)                     | DB-level                             | **None**         | REST API + Python/TS SDK + CLI + ADE        | **ADE desktop app** (memory palace)         | Free OSS; managed cloud TBD             | **Apache-2.0** full OSS         |
| **Honcho**    | Sync API + async deriver workers         | Postgres + pgvector / Turbopuffer / LanceDB | pgvector HNSW; cross-peer collections | At-rest; managed cloud               | **None**         | Python, TS SDK + **native MCP** + plugins   | `app.honcho.dev` + `evals.honcho.dev`       | $1K startup credits; $2/M tokens        | **AGPL-3.0** OSS               |
| **Memori**    | LLM-client interceptor + SQL-native     | Postgres / MySQL / SQLite / MongoDB      | Optional embeddings; SQL is primary      | DB-level; RBAC + audit trails        | **None** (lineage only) | SDK wrapper + MCP + framework adapters | `app.memorilabs.ai` (memories + lineage)    | Free 5K mem; $19 → $99 → custom         | **Apache-2.0** OSS              |
| **Mem.ai**    | Closed consumer notes app                | Closed SaaS                              | Unknown                                  | **None claimed**                     | **None**         | **None (no API)** — apps + Chrome ext only | The app itself                              | $12/mo Pro                              | **Closed source**               |
| **Supermemory** | 5-layer stack on Cloudflare workers     | Custom + pluggable Pinecone/Weaviate/Qdrant | **Custom vector + graph engine** w/ ontology edges | SOC 2 / HIPAA on Scale tier  | **None**         | Python, TS, REST SDK + **MCP** + connectors | Developer Console + personal app            | Free $5/mo built-in; $19 → $399 → ent.  | **Closed source** (paid SaaS)   |
| **OMEGA**     | **Local-first** MCP server               | **SQLite + sqlite-vec** (on user machine) | sqlite-vec 384-dim + FTS5               | **AES-256-GCM** + macOS Keychain (Pro) | **None** (audit trail only) | **MCP only** (no REST/SDK)              | **None** (CLI: `omega doctor`)              | Free Core (forever); $19/mo Pro         | **Apache-2.0 forever** (Core)   |

Notes on the verifiability column: **none of the 7 systems publish to a verifiable substrate** (no blockchain anchors, no Merkle proofs, no public bulletin boards). Memori and OMEGA come closest by surfacing audit trails / lineage; neither is cryptographically anchored. This is the wedge gap OneMem targets.

---

## 2. What each one teaches us

- **Zep** — The reference implementation for **temporal, contradiction-aware memory**. The `valid_at` / `invalid_at` bi-temporal pattern (and Graphiti's open-source library) is the canonical way to make memory honest about how facts evolve. Teaches us that a knowledge graph is not optional once you care about provenance — anchoring without provenance is theater.
- **Letta** — The reference for **tiered memory taxonomy** (core / recall / archival / message-buffer + sleeptime). Also the only system in the set with a real **agent IDE** (ADE). Teaches us that memory blocks must be first-class, editable, shareable, inspectable — and that an inspector UI is table stakes.
- **Honcho** — The reference for **peer-centric reasoning memory** (vs. retrieval memory). Sync-API + async-deriver split is the canonical "fast user turn, expensive offline reasoning" pattern. Plugin proliferation across Claude Code / Cursor / OpenClaw / Hermes is the playbook for cross-runtime adoption.
- **Memori** — The reference for **SQL-native, classified, explainable memory** with an interceptor integration model. Eight typed categories (facts/preferences/rules/skills/...) + per-row lineage are the right primitives for anchoring. Wraps the LLM client; doesn't ask you to refactor your agent.
- **Mem.ai** — The reference for **consumer-UX patterns** (auto-org, Heads-Up surfacing, voice/meeting capture). Also a cautionary tale: $40M+ burned with no developer surface and no defensible moat. Don't compete here; learn the UX cues and move on.
- **Supermemory** — The reference for **ontology-aware edges** (`Updates` / `Extends` / `Derives`) — the most useful structural innovation in the set for verifiable memory, because each edge type implies a different anchor obligation. Also the reference for **pluggable vector backends** (don't force migration) and `/.well-known/mcp` discovery.
- **OMEGA** — The reference for **local-first + MCP-only + Apache-2.0-forever**. Proves you can ship serious agent memory entirely on a user's machine with zero cloud, zero API keys. The closest existing precedent for "owned intelligence" — which is the same instinct that motivates verifiable memory on Walrus/Sui.

---

## 3. OneMem-positioning summary

Mapping each system to the OneMem pillar(s) it most informs:

| OneMem pillar                                                | Most relevant prior art                                | What we take                                                                                              |
|----------------------------------------------------------------|----------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| **Verifiable memory schema** (anchorable typed records)        | Memori, Letta (memory blocks), Zep (graph + temporal)   | Eight typed categories + first-class blocks + bi-temporal validity. Each block is one Walrus blob ref.    |
| **Cross-runtime integration** (MCP first)                      | OMEGA, Honcho, Supermemory                              | MCP-as-primary surface; `/.well-known/mcp` discovery; thin per-runtime plugins (Claude Code / Cursor / OpenClaw). |
| **Sync API + async anchoring** (latency discipline)            | Honcho (deriver workers), Letta (sleeptime agents)      | Mirror Honcho's sync-API + async-worker split: synchronous read/write to local SQLite, async upload to Walrus + Sui anchor tx. |
| **Ontology / edge taxonomy** (what gets anchored, how)         | Supermemory (Updates/Extends/Derives), Zep (Graphiti)   | Steal edge types directly; map each to a different anchor obligation (replace-anchor / share-anchor / derive-new-anchor). |
| **Local-first + client-held keys** (Seal integration)          | OMEGA (AES-256-GCM + Keychain), Memori (BYODB)          | Local SQLite + sqlite-vec for hot path; Seal-managed keys instead of OS Keychain; Walrus for cold mirror. |
| **Dashboard / inspector UX**                                   | Letta ADE, Memori console (lineage), Mem.ai (Heads Up)  | Block inspector + lineage view + proactive related-context surfacing — plus an OneMem-unique column: "verify on Sui." |
| **Trace / telemetry layer**                                    | (Honcho `evals.honcho.dev`); rest delegate to Langfuse  | Most memory systems do NOT have a trace viewer. OneMem can ship one as the cross-cutting differentiator. (Langfuse/LangSmith characterized by separate agent.) |
| **Pricing / monetization model**                               | OMEGA (additive Pro), Supermemory (dedup-token billing), Memori (BYODB free + cloud paid) | Apache-2.0 Core forever; paid managed = anchoring/Walrus/Seal infra + dashboard; dedup on Walrus blobs to mirror SM-token model. |
| **Verifiability layer**                                        | **None of the 7** publish to a verifiable substrate     | This is the wedge. None compete here. OneMem wins by being the only one with Sui anchors + Walrus blobs + Seal encryption. |

### Architectural archetypes (compressed)
- **Graph-centric**: Zep, Supermemory.
- **Tiered/paging**: Letta.
- **Reasoning-engine**: Honcho.
- **SQL-native interceptor**: Memori.
- **Local-first MCP**: OMEGA.
- **Closed consumer**: Mem.ai.

OneMem sits at the intersection of **local-first MCP (OMEGA)** + **SQL-native typed records (Memori)** + **ontology edges (Supermemory)** + **sync/async split (Honcho)** + **bi-temporal validity (Zep/Graphiti)** + **block inspector UX (Letta ADE)**, with the **verifiability column** (Walrus + Seal + Sui anchor txs) that none of them have.

---

## Sources (consolidated)

Per-product source URLs live in each product's `architecture.md`. High-signal cross-cutting references:
- https://atlan.com/know/best-ai-agent-memory-frameworks-2026/
- https://vectorize.io/articles/mem0-vs-letta
- https://tokenmix.ai/blog/ai-agent-memory-mem0-vs-letta-vs-memgpt-2026
- https://supermemory.ai/blog/ai-memory-vs-vector-databases-complete-guide/
- https://memverge.ai/memory-talk/ai-memory-architecture/
- https://medium.com/@parthshr370/from-chat-history-to-ai-memory-a-better-way-to-build-intelligent-agents-f30116b0c124
