# OneMem Architecture — README

This folder is the **design phase** of OneMem. Each sub-group is organized per build component ("per stuff" — UI, CLI, SDKs, plugins, etc.) so a coding agent can pick up any single doc and ship that component without reading the whole folder.

**Sequencing:** read in order 00 → 01 → 02 → ... unless you know exactly which component you're implementing, in which case jump straight to that sub-group.

---

## How to navigate

| Sub-group | What's inside | When to read |
|---|---|---|
| `00-overview/` | PRODUCT_INVENTORY (12 pillars frozen) + DEPENDENCY_GRAPH + BUILD_SEQUENCE | First, every time |
| `01-protocol/` | Move contract design — `MemoryNamespace`, `TraceSession`, `ActionCall`, events, access control, upgrade strategy | Before any SDK/plugin work |
| `02-sdks/` | `@onemem/sdk-ts` + `onemem-sdk-python` — API surface, relayer integration, compatibility | After protocol locks |
| `03-runtimes/` | Per-runtime native plugin design (Claude Code, OpenClaw, Hermes, Codex, MCP server for the rest) | After SDKs lock |
| `04-frameworks/` | Per-framework provider design (Vercel AI, OpenAI Agents, CrewAI, LiveKit, ElevenLabs at v0.1) | After SDKs lock |
| `05-cli/` | `onemem` CLI design (Node + Python, mirrored commands) | After SDKs lock |
| `06-dashboard/` | Local + hosted dashboard UI architecture (Next.js, SSE, Radix Themes + dapp-kit) | After SDKs lock |
| `07-marketing-and-docs/` | `onemem.ai` landing + `docs.onemem.ai` Mintlify | Parallel with dashboard |
| `08-demos-and-tests/` | The 4 demo apps + e2e test matrix | After everything else is designed |
| `09-stretch/` | Nautilus TEE + v0.2+ vision (reputation graphs, marketplaces, ERC-8004) | Last; only for the pitch's vision section |

---

## Status table (live)

| Sub-group | Status | Notes |
|---|---|---|
| `00-overview/` | 🔄 in flight (Phase 1) | Writing now |
| `01-protocol/` | ⏳ pending | Phase 2; sequential |
| `02-sdks/` | ⏳ pending | Phase 3; parallel after protocol |
| `03-runtimes/` | ⏳ pending | Phase 4; parallel after SDKs |
| `04-frameworks/` | ⏳ pending | Phase 4; parallel with runtimes |
| `05-cli/` | ⏳ pending | Phase 5; parallel after SDKs |
| `06-dashboard/` | ⏳ pending | Phase 5; parallel with CLI |
| `07-marketing-and-docs/` | ⏳ pending | Phase 6; parallel with dashboard |
| `08-demos-and-tests/` | ⏳ pending | Phase 7; final |
| `09-stretch/` | ⏳ pending | Phase 7; final |

---

## What's already loaded (the inspiration library)

Every architecture doc in this folder references material from these neighboring locations. Do not re-research; reference these:

### From this project's research
- `../00-goal/GOAL.md` — frozen vision; what we're building + why
- `../01-sui-ecosystem/` — every Sui primitive deep dive (Walrus, Seal, MemWal, Nautilus, Enoki, Sui Stack Messaging, move-patterns-for-onemem, REFERENCE_APPS)
- `../02-inspirations/` — 18+ production memory + trace products deep-dived, with VISUAL_DESIGN per product
- `../02-inspirations/BRAND_AND_SURFACES.md` — canonical brand + design tokens (lavender `#B08FFF`, chartreuse `#D4FF5E`, cream surface, Sui blue `#0090FF` for Suiscan)
- `../02-inspirations/mem0/MEM0_DOCS_DESIGN.md` — Mintlify config + IA template
- `../02-inspirations/claude-mem/CLAUDE_MEM_DOCS_DESIGN.md` — Mintlify minimum-viable baseline (38 pages, vanilla theme)
- `../02-inspirations/claude-mem/HOOKS_AND_VIEWER_REFERENCE.md` — claude-mem hook contract + 62-endpoint REST API + SSE pattern
- `../02-inspirations/langsmith-langfuse/TRACE_VIEWERS_COMPARISON.md` — trace data model + UX patterns
- `../02-inspirations/MEMORY_SYSTEMS_COMPARISON.md` — memory taxonomies to adopt (LangMem semantic/episodic/procedural + OpenViking L0/L1/L2)
- `../02-inspirations/other-memory-systems/WEB3_VERIFIABLE_AI_LANDSCAPE.md` — Talus / elizaOS / ERC-8004 context
- `../03-target-runtimes/README.md` + per-runtime deep dives (claude-code, openclaw, hermes, codex-cli-deep, cursor-mcp-deep, antigravity-deep)
- `../04-framework-providers/README.md` — provider integration matrix
- `../06-references/CANONICAL_URLS.md` — fast URL lookup
- `../06-references/SUI_OVERFLOW_2026_HANDBOOK.md` — canonical handbook (track problem statements, must-have checklists)

### From the parent folder (living wedge docs)
- `../../WEDGE_V2.md` — current wedge framing
- `../../MEM0_DEEP_DIVE.md` — Mem0 architecture + 30+ integrations
- `../../DEEP_DIVE.md` — MemWal source + oc-memwal teardown + Hermes ABC + audit competitor landscape
- `../../TRACE_AND_PROVIDERS.md` — Mem0 provider patterns + `ActionCall` / `TraceSession` data model draft

---

## Design rules (every doc honors these)

1. **Per "stuff" docs** — one component per doc; sub-grouped where useful. Don't bundle dashboard with CLI.
2. **Reference, don't reinvent** — every doc cites the inspiration source(s) it draws from. If a pattern exists in `02-inspirations/`, link to it.
3. **Coding-agent ready** — every doc should be picked up cold and produce working code. No assumptions about prior reading.
4. **Lens: satisfy + surprise** — every doc explicitly identifies (a) which must-have it satisfies (Walrus track or Agentic Web track) and (b) which "surprise" it contributes to (verifiability, cross-runtime trace, end-user persona, replay).
5. **Brand consistency** — every UI-facing design doc references `../02-inspirations/BRAND_AND_SURFACES.md` for tokens; never invent colors/fonts/spacing.
6. **Complement, never compete** — frame every incumbent as a layer to build on top of (Mem0 ergonomic, claude-mem hooks, MemWal storage, OpenClaw `oc-memwal`). Never frame as competitive threat.
7. **Just build our thing** — no "tracking risk" framings against competitor roadmaps. Structural moats survive feature shipping.
8. **OneMem name everywhere** — locked 2026-05-26. Pre-existing "Anchorlog" references have been sed-renamed.

---

## How to use this folder in a build session

1. Read `00-overview/PRODUCT_INVENTORY.md` to know what's being built
2. Read `00-overview/DEPENDENCY_GRAPH.md` to know what depends on what
3. Read `00-overview/BUILD_SEQUENCE.md` to know what gets built when
4. Jump to the sub-group for whatever you're implementing
5. The sub-group's `README.md` lists the docs in suggested read order
6. Each doc tells you which inspiration to mine + which Sui primitive to consume + what to build

When done with implementation: the doc you implemented gets a `## Implementation Status` footer marking what shipped vs what deferred.
