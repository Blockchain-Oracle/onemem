# OneMem Context — Fast-Path Index

Navigation page. Pairs with `README.md` (overview / philosophy).
This file is the jump-table — agent or human lands here and grabs the exact file needed for the task at hand.

---

## Quick task index

| If you're doing… | Read first | Then drill into |
|---|---|---|
| Understanding the project goal | `00-goal/GOAL.md` | `../WEDGE_V2.md` (current wedge) |
| Designing the Move contract | `01-sui-ecosystem/move-patterns-for-onemem.md` + `01-sui-ecosystem/memwal-deep-dive.md` | `01-sui-ecosystem/walrus-deep-dive.md` + `01-sui-ecosystem/seal-deep-dive.md` |
| Designing the JS/TS SDK | `../MEM0_DEEP_DIVE.md` §2 + `../TRACE_AND_PROVIDERS.md` §1 | `02-inspirations/mem0/MEM0_DOCS_TECH.md` |
| Designing the Python SDK | `../MEM0_DEEP_DIVE.md` §2 + `../TRACE_AND_PROVIDERS.md` §1 + `../TRACE_AND_PROVIDERS.md` §2 (Hermes) | `02-inspirations/letta/architecture.md` |
| Designing the trace data model | `../TRACE_AND_PROVIDERS.md` §3 + `02-inspirations/langsmith-langfuse/TRACE_VIEWERS_COMPARISON.md` | `02-inspirations/langsmith-langfuse/{langfuse,langsmith,phoenix}.md` |
| Designing the dashboard UX | `02-inspirations/BRAND_AND_SURFACES.md` + `../TRACE_AND_PROVIDERS.md` §4 | `02-inspirations/langsmith-langfuse/VISUAL_DESIGN_{LANGSMITH,LANGFUSE,PHOENIX,HELICONE}.md` |
| Designing the marketing landing | `02-inspirations/BRAND_AND_SURFACES.md` §6–7 + `02-inspirations/mem0/MEM0_DOCS_IA.md` | `01-sui-ecosystem/visual/memwal/VISUAL_DESIGN.md` |
| Designing the docs site | `02-inspirations/BRAND_AND_SURFACES.md` §7.2 + `02-inspirations/mem0/MEM0_DOCS_IA.md` + `02-inspirations/mem0/MEM0_DOCS_TECH.md` | `02-inspirations/mem0/MEM0_DOCS_DESIGN.md` |
| Designing the CLI surface | `../BRAND_AND_SURFACES_LEGACY.md` §3.3 + `../BRAND_AND_SURFACES_LEGACY.md` §4 | `../TRACE_AND_PROVIDERS.md` §1 |
| Picking brand colors / typography | `02-inspirations/BRAND_AND_SURFACES.md` §§1, 2, 6 | Per-product `VISUAL_DESIGN.md` files (see complete index below) |
| Per-runtime plugin design | `03-target-runtimes/README.md` | `../DEEP_DIVE.md` §§2–3 + `../WEDGE_REFINEMENT.md` |
| Per-framework provider design | `04-framework-providers/README.md` | `../TRACE_AND_PROVIDERS.md` §1 + `../MEM0_DEEP_DIVE.md` §2 |
| Cross-tool MCP server design | `03-target-runtimes/README.md` (Cursor/Windsurf/Codex rows) | `../DEEP_DIVE.md` §3 |
| Reviewing competitor landscape | `02-inspirations/MEMORY_SYSTEMS_COMPARISON.md` + `02-inspirations/other-memory-systems/WEB3_VERIFIABLE_AI_LANDSCAPE.md` | Per-competitor files in `02-inspirations/other-memory-systems/` |
| Reviewing Sui ecosystem docs | `01-sui-ecosystem/SUI_DOC_TREE.md` | `01-sui-ecosystem/REFERENCE_APPS.md` |
| Wallet-connect / zkLogin flow | `01-sui-ecosystem/enoki-zklogin.md` + `02-inspirations/other-memory-systems/onlyfins/VISUAL_DESIGN.md` | `01-sui-ecosystem/REFERENCE_APPS.md` |
| TEE / confidential compute | `01-sui-ecosystem/nautilus-tee.md` + `02-inspirations/other-memory-systems/eigen-cloud.md` | `02-inspirations/other-memory-systems/elizaos-walrus.md` |
| Identifying URLs/sources to cite | `06-references/CANONICAL_URLS.md` | — |

---

## Key files only (the 10–15 most load-bearing for the architecture phase)

Start here when you have an hour, not a day.

1. `00-goal/GOAL.md` — vision + pillars + non-goals
2. `../WEDGE_V2.md` — current wedge (Pillar 2 reframed as trace+replay)
3. `02-inspirations/BRAND_AND_SURFACES.md` — canonical brand + 5-surface inventory + ship recommendations
4. `01-sui-ecosystem/memwal-deep-dive.md` — what MemWal gives us for free
5. `01-sui-ecosystem/walrus-deep-dive.md` — storage layer primitives
6. `01-sui-ecosystem/seal-deep-dive.md` — encryption / access control
7. `01-sui-ecosystem/move-patterns-for-onemem.md` — Move struct decisions
8. `../TRACE_AND_PROVIDERS.md` — trace pillar + provider patterns (most load-bearing single doc)
9. `../MEM0_DEEP_DIVE.md` — what Mem0 gets right; what we borrow
10. `../DEEP_DIVE.md` — MemWal source, oc-memwal teardown, Hermes ABC, claude-mem viewer
11. `03-target-runtimes/README.md` — runtime plugin matrix (10 runtimes)
12. `04-framework-providers/README.md` — framework provider matrix (14 frameworks)
13. `02-inspirations/MEMORY_SYSTEMS_COMPARISON.md` — competitor matrix
14. `02-inspirations/langsmith-langfuse/TRACE_VIEWERS_COMPARISON.md` — trace UX prior art
15. `02-inspirations/mem0/MEM0_DOCS_IA.md` — docs IA reference (verbatim mirror of docs.mem0.ai)

---

## Complete file index (tree-style)

```
context/
├── README.md                          # overview + philosophy
├── INDEX.md                           # you are here — fast-path navigation
│
├── 00-goal/
│   └── GOAL.md                        # OneMem vision, pillars, what we're NOT
│
├── 01-sui-ecosystem/                  # Sui + Walrus + Seal + MemWal + Nautilus + Enoki primitives
│   ├── SUI_DOC_TREE.md                # Map of MystenLabs/sui docs/content/ subtree
│   ├── REFERENCE_APPS.md              # onlyfins, ticketing-poc, MemWal apps, etc.
│   ├── move-patterns-for-onemem.md # Move struct + capability patterns for our contract
│   ├── walrus-deep-dive.md            # Storage primitives (blob, certificate, aggregator/publisher)
│   ├── seal-deep-dive.md              # Encryption + access control (quorum, IBE)
│   ├── memwal-deep-dive.md            # MemWal stack — what we build on top of
│   ├── sui-stack-messaging.md         # Sui Stack messaging patterns (for live-trace delivery)
│   ├── nautilus-tee.md                # Nautilus TEE for confidential compute
│   ├── enoki-zklogin.md               # zkLogin OAuth flow for hosted dashboard
│   └── visual/
│       ├── memwal/
│       │   ├── VISUAL_DESIGN.md       # MemWal brand tokens — cream + lavender + Ratch
│       │   └── screenshots/01-landing-full.png
│       ├── sui/
│       │   ├── VISUAL_DESIGN.md       # Sui brand tokens — black + Sui blue + TWK Everett
│       │   └── screenshots/01-landing-full.png
│       └── walrus/
│           ├── VISUAL_DESIGN.md       # Walrus brand tokens — inverse cream/black + Ratch
│           └── screenshots/01-landing-full.png
│
├── 02-inspirations/                   # Production products we're inspired by
│   ├── MEMORY_SYSTEMS_COMPARISON.md   # Cross-product matrix (Mem0/Zep/Letta/Honcho/etc.)
│   ├── BRAND_AND_SURFACES.md          # ★ CANONICAL brand + 5-surface inventory + recommendations
│   │
│   ├── mem0/                          # The integration-ergonomics pattern model
│   │   ├── README.md
│   │   ├── MEM0_DOCS_IA.md            # docs.mem0.ai IA — verbatim mirror
│   │   ├── MEM0_DOCS_DESIGN.md        # Visual design extraction from docs.mem0.ai
│   │   ├── MEM0_DOCS_TECH.md          # Mintlify + Framer tech stack reference
│   │   ├── MEM0_DOCS_VS_MEMWAL_DOCS.md# Diff of mem0 docs vs MemWal docs IA
│   │   └── screenshots/               # 32+ captures of mem0.ai + docs.mem0.ai
│   │
│   ├── claude-mem/
│   │   └── README.md                  # claude-mem viewer + plugin manifest reference
│   │
│   ├── memwal-incubation/
│   │   └── README.md                  # @mysten-incubation/oc-memwal teardown + Mysten apps
│   │
│   ├── zep/
│   │   ├── architecture.md            # Temporal graph memory architecture
│   │   ├── VISUAL_DESIGN.md           # Zep brand (purple lineage)
│   │   └── screenshots/01-landing-full.png
│   │
│   ├── letta/
│   │   ├── architecture.md            # MemGPT lineage; agent-runtime-native memory
│   │   ├── VISUAL_DESIGN.md           # Letta brand (cool gray + Roobert)
│   │   └── screenshots/01-landing-full.png
│   │
│   ├── mem-ai/
│   │   ├── architecture.md            # Mem.ai (personal-memory consumer product)
│   │   ├── VISUAL_DESIGN.md
│   │   └── screenshots/{01-landing-full,02-docs-full}.png
│   │
│   ├── pieces/
│   │   ├── VISUAL_DESIGN.md           # Pieces brand (monochrome + GT America)
│   │   └── screenshots/01-landing-full.png
│   │
│   ├── khoj/
│   │   ├── VISUAL_DESIGN.md           # Khoj brand (white + serif body)
│   │   └── screenshots/01-landing-full.png
│   │
│   ├── supermemory/
│   │   ├── architecture.md
│   │   ├── VISUAL_DESIGN.md           # Supermemory brand (light-blue tint + Space Grotesk)
│   │   └── screenshots/01-landing-full.png
│   │
│   ├── honcho/
│   │   └── architecture.md            # Honcho (Plastic Labs personalization layer)
│   │
│   ├── memori/
│   │   └── architecture.md            # GibsonAI Memori (SQLAlchemy-style memory ORM)
│   │
│   ├── omega/
│   │   └── architecture.md            # Omega (lightweight personal memory)
│   │
│   ├── langsmith-langfuse/            # Trace viewer UX inspiration (the dashboard prior art)
│   │   ├── TRACE_VIEWERS_COMPARISON.md# Cross-tool matrix (LangSmith vs Langfuse vs Phoenix vs Helicone)
│   │   ├── langsmith.md               # LangSmith architecture + IA
│   │   ├── langfuse.md                # Langfuse architecture + IA
│   │   ├── phoenix.md                 # Arize Phoenix architecture + IA
│   │   ├── VISUAL_DESIGN_LANGSMITH.md
│   │   ├── VISUAL_DESIGN_LANGFUSE.md
│   │   ├── VISUAL_DESIGN_PHOENIX.md
│   │   ├── VISUAL_DESIGN_HELICONE.md
│   │   ├── langsmith/screenshots/
│   │   ├── langfuse/screenshots/
│   │   ├── phoenix/screenshots/
│   │   └── helicone/screenshots/
│   │
│   ├── trace-viewers/                 # (empty placeholder — see langsmith-langfuse/ above)
│   │
│   └── other-memory-systems/          # The broader landscape (memory + verifiable AI)
│       ├── WEB3_VERIFIABLE_AI_LANDSCAPE.md  # ★ landscape doc — what's in Web3 verifiable AI
│       ├── elizaos-walrus.md          # ★ elizaOS + Walrus = the precedent that validates our substrate
│       ├── talus.md                   # Talus (AI agent earnings layer)
│       ├── theoriq.md                 # Theoriq (asset management agentic economy)
│       ├── olas.md                    # Olas / Autonolas (co-own AI / agent marketplace)
│       ├── memgpt-letta.md            # MemGPT lineage (text companion to letta/)
│       ├── eigen-cloud.md             # EigenCloud (EigenAI + EigenCompute verifiable inference)
│       ├── shade-agents.md            # NEAR Shade Agents
│       ├── chaingpt.md                # ChainGPT
│       ├── cogni.md                   # Cogni (open-source memory)
│       ├── recall.md                  # Recall
│       ├── retaindb.md                # RetainDB (Hermes-bundled provider)
│       ├── byterover.md               # Byterover (Hermes-bundled provider)
│       ├── holographic.md             # Holographic (Hermes-bundled provider)
│       ├── openviking.md              # OpenViking (Hermes-bundled provider)
│       ├── hindsight.md               # Hindsight (Hermes-bundled provider)
│       ├── khoj.md                    # Khoj (text companion to khoj/)
│       ├── pieces.md                  # Pieces (text companion to pieces/)
│       ├── anythingllm.md
│       ├── cline-memory-bank.md
│       ├── composio-memory.md
│       ├── cortex.md
│       ├── dspy.md
│       ├── erc-8004.md                # ERC-8004 trust agents standard
│       ├── inflection-pi.md           # Inflection Pi
│       ├── langmem.md                 # LangChain LangMem
│       ├── openviking.md
│       ├── taskweaver.md              # Microsoft TaskWeaver
│       ├── elizaos/
│       │   ├── VISUAL_DESIGN.md       # elizaOS brand (full dark + orange + NHaasFont)
│       │   └── screenshots/01-landing-full.png
│       ├── theoriq/
│       │   ├── VISUAL_DESIGN.md       # Theoriq brand (white/dark alt + yellow + Founders Grotesk)
│       │   └── screenshots/01-landing-full.png
│       ├── olas/
│       │   ├── VISUAL_DESIGN.md       # Olas brand (white + violet + Inter)
│       │   └── screenshots/01-landing-full.png
│       ├── onlyfins/
│       │   ├── VISUAL_DESIGN.md       # OnlyFins brand (Radix Themes + Sui blue + dapp-kit)
│       │   └── screenshots/01-landing-full.png
│       └── talus/
│           ├── VISUAL_DESIGN.md       # Talus brand (warm gray + BelfastGrotesk + Borna)
│           └── screenshots/01-landing-full.png
│
├── 03-target-runtimes/                # Runtimes we ship plugins into
│   └── README.md                      # ★ 10-runtime matrix — Claude Code / OpenClaw / Hermes / Codex / Cursor / Windsurf / Antigravity / OpenCode / VS Code / Cline
│
├── 04-framework-providers/            # AI app frameworks (Mem0-style provider config)
│   └── README.md                      # ★ 14-framework matrix — Vercel AI SDK / OpenAI Agents / CrewAI / LiveKit / LangGraph / LangChain / AutoGen / LlamaIndex / Google ADK / Pipecat / ElevenLabs / Mastra / Agno
│
├── 05-our-architecture/               # ⏳ PENDING — synthesizes the above into our design
│   (empty — populated in the design phase after context complete)
│
└── 06-references/                     # Canonical external docs
    └── CANONICAL_URLS.md              # URL list for citation
```

---

## Parent-folder file index

These predate the `context/` folder and remain the source-of-truth research material. The `context/` folder is being distilled FROM them.

Path: `/Users/abu/dev/hackathon/sui-overflow/research/sui-overflow-2026/ideas/.greenfield/memwal-cross-tool-mcp/`

| File | Purpose |
|---|---|
| `idea.md` | Original greenfield candidate that seeded the project |
| `scores.json` | Multiplicative-floor scoring (current: 0.92) — track confidence over time |
| `WEDGE_REFINEMENT.md` | First pivot from generic "cross-tool MCP" to "MemWal-Bridge"; per-runtime plugin integration model verbatim |
| `DEEP_DIVE.md` | 6-target research (MemWal source, oc-memwal teardown, Hermes plugin, claude-mem UI, audit landscape, name candidates) |
| `MEM0_DEEP_DIVE.md` | Mem0 architecture, 30+ integrations, dashboard inventory, ship velocity analysis |
| `TRACE_AND_PROVIDERS.md` | Mem0 provider patterns + trace pillar design (most load-bearing single doc for SDK + trace work) |
| `FINAL_WEDGE.md` | Superseded by WEDGE_V2.md — kept for archival |
| `WEDGE_V2.md` | ★ Current wedge — Pillar 2 reframed as trace+replay |
| `BRAND_AND_SURFACES_LEGACY.md` | Legacy brand brief from trace+providers agent — superseded by `context/02-inspirations/BRAND_AND_SURFACES.md`, kept for verbatim CLI command surface (§3.3) and full landing IA (§3.1) |

---

## Status table (per top-level section)

| Section | Status | Notes |
|---|---|---|
| `00-goal/GOAL.md` | ✅ complete | Crystallizes Abu's vision |
| `01-sui-ecosystem/` | ✅ complete | All 8 core primitives covered + 3 visual brands captured |
| `02-inspirations/` (text research) | ✅ complete | 18 products + landscape doc + comparison matrix |
| `02-inspirations/` (visual capture) | ✅ complete | 18 of 18 products captured with screenshots + computed-style data |
| `02-inspirations/BRAND_AND_SURFACES.md` | ✅ complete (canonical) | Merged from 2 source docs, 2026-05-23 |
| `03-target-runtimes/` | ✅ complete (matrix) | README is single-file index; per-runtime sub-files not yet split |
| `04-framework-providers/` | ✅ complete (matrix) | README is single-file index; per-framework sub-files not yet split |
| `05-our-architecture/` | ⏳ pending | Next phase — written after this index is read |
| `06-references/` | 🔄 in flight | `CANONICAL_URLS.md` exists; per-product URL lists pending |

---

## Next steps after context is complete

Context-loading phase is done. The next phase is the `05-our-architecture/` design pass. Recommended sequence:

1. **`05-our-architecture/data-model.md`** — pin down `MemoryNamespace` / `TraceSession` / `ActionCall` / `MemoryFact` / `AgentActionAttestation` Move structs. Inputs: `01-sui-ecosystem/move-patterns-for-onemem.md` + `01-sui-ecosystem/memwal-deep-dive.md` + `../TRACE_AND_PROVIDERS.md` §3
2. **`05-our-architecture/move-contract.md`** — capabilities, entry funs, events, upgrade story. Inputs: data-model.md (above) + `01-sui-ecosystem/seal-deep-dive.md` (for `TraceReadCap` design)
3. **`05-our-architecture/trace-capture-design.md`** — the hook contracts per runtime + the unified `ActionCall` lifecycle. Inputs: `03-target-runtimes/README.md` + `../TRACE_AND_PROVIDERS.md` §§2–3
4. **`05-our-architecture/sdk-design.md`** — Python + JS SDK shape, 1-line provider API, `--output agent` envelope. Inputs: `04-framework-providers/README.md` + `../TRACE_AND_PROVIDERS.md` §1 + `../BRAND_AND_SURFACES_LEGACY.md` §3.3 (CLI surface)
5. **`05-our-architecture/dashboard-design.md`** — `/trace/[id]` layout, span chip colorway, Verify drawer, Replay modal. Inputs: `02-inspirations/BRAND_AND_SURFACES.md` §§6–7 + `02-inspirations/langsmith-langfuse/*.md`
6. **`05-our-architecture/plugin-design.md`** — per-runtime plugin manifest + hook bindings (Claude Code first, then OpenClaw, Hermes, Codex). Inputs: `03-target-runtimes/README.md` + `02-inspirations/claude-mem/README.md` + `02-inspirations/memwal-incubation/README.md`
7. **`05-our-architecture/integration-pattern.md`** — the cross-runtime + cross-framework trace composition pattern. Inputs: `04-framework-providers/README.md` (cross-framework section) + `03-target-runtimes/README.md` (capture-hook canonical mapping)

After `05-our-architecture/` is populated, `06-references/CANONICAL_URLS.md` gets filled in last as the citation index.

The wedge is locked. The brand is locked. The 5 surfaces are locked. Build phase begins.
