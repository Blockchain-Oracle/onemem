# Pillar 9 + 10 — Marketing Landing + Docs Site (OneMem)

The user-facing front door (`onemem.ai`) + the developer reference (`docs.onemem.ai`).

---

## Read order

| File | Purpose |
|---|---|
| `README.md` | This file — design principles |
| `landing-architecture.md` | `onemem.ai` — copy, IA, hero, comparison, integration installs |
| `docs-architecture.md` | `docs.onemem.ai` — Mintlify config, IA, 5 must-have pages at v0.1 |

---

## Design principles

1. **Brand applied per `BRAND_AND_SURFACES.md`** — lavender + chartreuse + cream + Sui blue (links only).
2. **Mintlify for docs** — same stack as Mem0 + claude-mem (proven). Cream surface aligns with Walrus/Sui ecosystem.
3. **Landing leads with the wedge** — "Verifiable agent memory + trace, for every runtime."
4. **Honest comparison sections** — vs Mem0, vs claude-mem, vs Zep. No FUD; emphasize complementary positioning.
5. **5 must-have docs pages at v0.1** — Get Started (5-min), Concepts, Verify-a-trace tutorial, API Reference, Integrations index. Lean baseline matching claude-mem's 38-page approach (not Mem0's 218-page surface).
6. **Vision teaser on landing** — hint at v0.2+ (reputation graphs, memory marketplaces, ERC-8004 bridge) to land the bigger picture.
7. **Apache-2.0 license.**

---

## Cross-references

- `../../02-inspirations/BRAND_AND_SURFACES.md` — canonical brand
- `../../02-inspirations/mem0/MEM0_DOCS_DESIGN.md` — Mintlify config + IA template
- `../../02-inspirations/claude-mem/CLAUDE_MEM_DOCS_DESIGN.md` — minimum-viable Mintlify baseline
- `../00-goal/GOAL.md` — what we're building, in one paragraph
- `../00-overview/PRODUCT_INVENTORY.md` — what to mention in landing + docs

---

## Implementation status

| Component | Status |
|---|---|
| `onemem.ai` landing | ⏳ pending |
| `docs.onemem.ai` Mintlify setup | ⏳ pending |
| 5 must-have docs pages | ⏳ pending |
