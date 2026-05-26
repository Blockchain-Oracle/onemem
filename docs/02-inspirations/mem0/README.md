# Mem0 — Inspiration Pack

**Source-of-truth files** (read these for full depth):
- `../../../MEM0_DEEP_DIVE.md` — architecture + 30+ integrations matrix + dashboard + pricing + ship velocity (369 lines)
- `../../../TRACE_AND_PROVIDERS.md` §1 — verbatim provider code snippets for 12 frameworks (CrewAI, LiveKit, ElevenLabs, Pipecat, Vercel AI SDK, LangGraph, LangChain, AutoGen, OpenAI Agents SDK, Google ADK, Mastra, Agno)

This README distills what OneMem should borrow from Mem0.

---

## What Mem0 is (one paragraph)

A managed memory layer for LLM agents. `add()` runs an LLM extraction pass that pulls atomic facts from conversation, embeds them with `text-embedding-3-small`, writes to Qdrant (default), and stitches entity links into a parallel collection. `search()` does multi-signal retrieval (semantic + BM25 + entity) with temporal decay rerank. Multi-tenancy via `(org, project, user, agent, run)` 5-tuple. Ships as Python + TS SDK, CLI, cloud HTTP API, self-hosted Docker, hosted MCP, and editor plugins across every major coding agent. 56.5k ⭐ GitHub, ~6 releases/month, SOC 2 + HIPAA compliant. Real business with Hobby/Starter/Growth/Pro/Enterprise tiers.

---

## What OneMem borrows from Mem0

### The 5-tuple multi-tenancy key
`(org_id, project_id, user_id, agent_id, run_id)` is the canonical scoping. We adopt this verbatim — same semantics, same field names — so users moving from Mem0 to OneMem don't have to rethink their schema.

### Memory taxonomy
- **Conversation** — single-turn, in-flight
- **Session** — minutes-to-hours, tied to `run_id`
- **User** — weeks-to-permanent, tied to `user_id`
- **Organizational** — shared across agents/teams
- Sub-types: factual / episodic / semantic / working/attention

### The "ADD-only" extraction pattern (v3, April 2026)
Single-pass LLM call extracts atomic facts; no read-then-write loop. LoCoMo 71.4→91.6 + LongMemEval 67.8→93.4 in one rewrite. We adopt the single-pass model and benchmark against the same datasets — `services/server/benchmarks/` in MemWal repo already runs LoCoMo + LongMemEval.

### The provider config ergonomic
Every framework gets a 1-line config:
- CrewAI: `memory_config={"provider": "onemem"}`
- LangChain: `Mem0Memory(api_key=...)` → `OneMemMemory(...)`
- Vercel AI SDK: `withOneMem(model, opts)` (matches `withMem0` shape)
- OpenAI Agents SDK: `save_memory` / `search_memory` function tools

This is the bar for adoption velocity. Lower than this and users won't migrate. Match exactly.

### Webhook events
Mem0 emits 4 events: `memory_add`, `memory_update`, `memory_delete`, `memory_categorize`. We add: `trace_session_start`, `action_call`, `trace_session_end`, `namespace_share`, `namespace_revoke` for the trace pillar.

### Memory history (versioning)
`client.history(memory_id)` returns version history per memory. We extend: every version is a separate Walrus blob + on-chain commit. The full history is replayable.

### Batch operations
`batch_update([...])` + `batch_delete([...])` — performance pattern for bulk operations.

### Memory feedback
`client.feedback(memory_id, feedback, reason)` — pattern for memory-quality signal.

### Memory export
`client.create_memory_export(...)` + `client.get_memory_export(...)` — pattern. We extend: our exports include the Sui txid + Walrus blob ID + Seal policy proof per memory for tamper-evident archive.

---

## What Mem0 has that we DON'T need to replicate

- **Multi-modal (images, PDFs)** — Mem0 ships it. We defer to v0.2; not blocking Walrus track.
- **Custom categories UI** — table stakes for SaaS dashboard; we ship without at v0.1.
- **SOC 2 / HIPAA paperwork** — Mem0's compliance moat. Not relevant for hackathon judging; consider for v0.2.
- **Graph memory** — Mem0 deprecated it April 2026 (replaced with entity linking). We skip it entirely.

---

## What Mem0 explicitly does NOT have (the structural gaps we exploit)

| Gap | Why it matters for OneMem |
|---|---|
| End-to-end encryption | We have Seal threshold encryption (relayer can't decrypt without quorum) |
| Cryptographic verifiability | We have Sui-attested Merkle-chained `ActionCall` objects |
| On-chain access control / sharing | We have Sui capability transfer for namespace sharing |
| Tamper-evident audit logs | The `/platform/features/audit-logs` page on Mem0 docs returns 404 |
| Cross-runtime UNIFIED trace tree | Mem0 has per-app provenance (OpenMemory pane) but not unified trace tree |
| Hermes Agent integration | Mem0 ships as a Hermes bundled provider but doesn't have native Hermes-specific tooling |

---

## Dashboard inspiration

Mem0 has TWO dashboards:

### Cloud dashboard (`app.mem0.ai`)
- Memories tab — list per `user_id` with search + filter + manual add/delete
- Projects tab — config: custom categories, retention, decay
- API keys management
- Webhooks
- Analytics (Growth $79+, Pro $249+)
- Members / Orgs (RBAC)

### OpenMemory dashboard (`localhost:3000`, **sunsetting**)
- `/` Home — install commands per client + stats
- `/memories` — debounced search, Create Memory, filter by (app/category/archive), bulk actions, per-memory: archive/pause/resume/delete, access logs view, **related memories view**, GPT-4o auto-categorization
- `/apps` — connected app monitor with **per-app pause + per-app permissions**

**Direct lift for OneMem dashboard:**
1. `/memories` route — copy debounced search + filter UX
2. `/apps` route — copy per-runtime pause + permissions UX
3. Per-memory **access logs view** — adapt to show on-chain access events (Seal decryptions, capability transfers)
4. Per-memory **related memories view** — adapt to show trace lineage (which `ActionCall` produced/consumed each memory)

---

## Mem0's ship velocity (the bar)

~6 releases/month. We can't match this in 29 days obviously, but the pattern is: **plugin / MCP / editor distribution is the explicit priority** (4 of last 10 ships were editor-plugin updates). Means: post-hackathon, the work that matters most is shipping more provider integrations, not deepening any one.

---

## Pricing model (for v0.2+ planning, not v0.1)

| Tier | $/mo | Adds | Searches | Projects |
|---|---|---|---|---|
| Hobby | $0 | Unlimited | 1k | 1 |
| Starter | $19 | 50k | 5k | 1 |
| Growth | $79 | 200k | 20k | 3 |
| Pro | $249 | 500k | 50k | ∞ |
| Enterprise | custom | — | — | — |

OneMem v0.1 is free + OSS (mainnet-deployed contracts). Post-hackathon pricing will track Mem0 if a managed offering ships.

---

## Sources

Mem0 GitHub: https://github.com/mem0ai/mem0 (56.5k ⭐)
Docs: https://docs.mem0.ai
Pricing: https://mem0.ai/pricing
OpenMemory: https://mem0.ai/openmemory
Changelog: https://docs.mem0.ai/changelog
Hosted MCP: https://mcp.mem0.ai/mcp

Detailed source list: see `../../../MEM0_DEEP_DIVE.md` Appendix.
