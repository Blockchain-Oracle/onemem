# OneMem Context Folder

> Current note, 2026-06-17: this is a historical research/context archive from
> the first architecture pass. It remains useful source material, but active
> Context Engineering artifacts now live in `.thoughts/`
> and the repo entrypoint for agents is `AGENTS.md`.

**Purpose:** load-bearing reference material for architecture design + implementation.

This folder is the *agent-consumable inspiration library* for OneMem. When we start designing the architecture or writing code, every relevant production reference is one read away — Mem0's provider patterns, claude-mem's viewer architecture, MemWal's source layout, Walrus + Seal + Sui patterns from the MystenLabs/sui repo, trace-viewer UX from LangSmith/Langfuse/Phoenix, plus the broader memory-systems + Web3-verifiable-AI landscape.

**Stance:** we are building on top of every layer that already exists. Not competing. Not routing around. Complementing.

---

## How to use this folder

For current work, first read `AGENTS.md`, then the relevant artifact in
`.thoughts/`. Use this folder when you need the older
research trail or architecture rationale.

| When you're doing… | Read first | Then drill into… |
|---|---|---|
| Understanding the goal | `00-goal/GOAL.md` | nothing — goal is the entry |
| Designing the Move contract | `01-sui-ecosystem/move-patterns-for-onemem.md` + `01-sui-ecosystem/memwal-deep-dive.md` | `05-our-architecture/01-protocol/` |
| Designing the JS/TS SDK | `02-inspirations/mem0/README.md` + `02-inspirations/memwal-incubation/README.md` | `05-our-architecture/02-sdks/` |
| Designing the Python SDK | `02-inspirations/mem0/README.md` + `02-inspirations/memwal-incubation/README.md` | `05-our-architecture/02-sdks/` |
| Designing the trace data model | `02-inspirations/langsmith-langfuse/*.md` | `05-our-architecture/01-protocol/data-model.md` |
| Designing the dashboard UX | `02-inspirations/BRAND_AND_SURFACES.md` + `02-inspirations/langsmith-langfuse/*.md` | `05-our-architecture/06-dashboard/` |
| Per-runtime plugin design | `03-target-runtimes/README.md` | `05-our-architecture/03-runtimes/` |
| Per-framework provider design | `04-framework-providers/README.md` | `05-our-architecture/04-frameworks/` |
| Looking at competitors / landscape | `02-inspirations/MEMORY_SYSTEMS_COMPARISON.md` + `02-inspirations/other-memory-systems/WEB3_VERIFIABLE_AI_LANDSCAPE.md` | — |
| Looking at Sui ecosystem docs | `01-sui-ecosystem/SUI_DOC_TREE.md` | per-topic deep dives in `01-sui-ecosystem/` |

---

## Folder layout

```
context/
├── README.md                          ← you are here
├── 00-goal/
│   └── GOAL.md                        # OneMem vision, pillars, what we're NOT
│
├── 01-sui-ecosystem/                  # Sui + Walrus + Seal + MemWal + Nautilus + Enoki primitives
│   ├── SUI_DOC_TREE.md                # Map of MystenLabs/sui docs/content/ subtree
│   ├── REFERENCE_APPS.md              # onlyfins, ticketing-poc, MemWal apps, etc.
│   ├── move-patterns-for-onemem.md
│   ├── walrus-deep-dive.md
│   ├── seal-deep-dive.md
│   ├── memwal-deep-dive.md
│   ├── sui-stack-messaging.md
│   ├── nautilus-tee.md
│   └── enoki-zklogin.md
│
├── 02-inspirations/                   # Production products we're inspired by
│   ├── MEMORY_SYSTEMS_COMPARISON.md   # Cross-product matrix
│   ├── mem0/                          # The integration-ergonomics pattern model
│   ├── claude-mem/                    # The Claude Code memory + viewer model
│   ├── memwal-incubation/             # Mysten's own MemWal source + sample apps
│   ├── zep/                           # Temporal graph memory
│   ├── letta/                         # MemGPT lineage; agent-runtime-native memory
│   ├── langsmith-langfuse/            # Trace viewer UX inspiration
│   └── other-memory-systems/          # Honcho, Supermemory, Pieces, Khoj, Cogni, Talus, elizaOS, ERC-8004, etc.
│
├── 03-target-runtimes/                # Runtimes we ship plugins into (we ship to ALL)
│   ├── claude-code-plugins.md
│   ├── openclaw-plugins.md            # USES @mysten-incubation/oc-memwal underneath
│   ├── hermes-agent.md                # Standalone PyPI MemoryProvider
│   ├── codex-cli.md
│   ├── cursor.md
│   ├── windsurf.md
│   └── gemini-cli-antigravity.md
│
├── 04-framework-providers/            # AI app frameworks (Mem0-style provider config)
│   ├── vercel-ai-sdk.md
│   ├── langchain.md
│   ├── langgraph.md
│   ├── crewai.md
│   ├── autogen.md
│   ├── llamaindex.md
│   ├── openai-agents-sdk.md
│   ├── google-adk.md
│   ├── pipecat.md
│   ├── elevenlabs.md
│   ├── livekit.md
│   └── mastra.md
│
├── 05-our-architecture/               # WIP — synthesizes the above into our design
│   ├── data-model.md                  # ActionCall / TraceSession / MemoryNamespace / AgentActionAttestation
│   ├── move-contract.md
│   ├── trace-capture-design.md
│   ├── dashboard-design.md
│   ├── sdk-design.md                  # Python + JS
│   ├── plugin-design.md
│   └── integration-pattern.md
│
└── 06-references/                     # Canonical external docs (URL lists)
    ├── walrus-docs.md
    ├── memwal-docs.md
    ├── seal-docs.md
    ├── sui-docs-toc.md
    ├── mem0-docs.md
    └── trace-viewers-docs.md
```

---

## Status (live)

| Section | Status | Notes |
|---|---|---|
| `00-goal/GOAL.md` | ✅ written | Crystallizes Abu's stated vision |
| `01-sui-ecosystem/` | 🔄 in flight | Research agent populating now |
| `02-inspirations/mem0/` | ✅ source material in `MEM0_DEEP_DIVE.md` (parent folder); needs sub-file split |
| `02-inspirations/claude-mem/` | ✅ source material in `DEEP_DIVE.md` §4 (parent folder); needs sub-file split |
| `02-inspirations/memwal-incubation/` | ✅ source material in `DEEP_DIVE.md` §1+§2 (parent folder); needs sub-file split |
| `02-inspirations/zep/` + `letta/` + `other-memory-systems/` | 🔄 in flight | Research agent populating now |
| `02-inspirations/langsmith-langfuse/` | 🔄 in flight | Research agent populating now |
| `03-target-runtimes/` | ✅ source material in `DEEP_DIVE.md` §2+§3 + `TRACE_AND_PROVIDERS.md` §2 (parent folder); needs sub-file split |
| `04-framework-providers/` | ✅ source material in `MEM0_DEEP_DIVE.md` §2 + `TRACE_AND_PROVIDERS.md` §1 (parent folder); needs sub-file split |
| `05-our-architecture/` | historical archive | Written during the design phase; verify against current code |
| `06-references/` | historical/archive | URL lists and external references |

---

## Missing parent-folder research docs

The original design pass referenced parent-folder files such as
`WEDGE_REFINEMENT.md`, `DEEP_DIVE.md`, `MEM0_DEEP_DIVE.md`,
`TRACE_AND_PROVIDERS.md`, `FINAL_WEDGE.md`, `WEDGE_V2.md`, `scores.json`, and
`idea.md`. Those files are not present in this repo checkout. Use this copied
and split `docs/` archive for historical source material, and use `.thoughts/`
for active Context Engineering decisions.

---

## What this folder is NOT

- ❌ A current decision memo (active decisions live in `.thoughts/`)
- ❌ A current risk analysis (active gaps live in `.thoughts/wiki/context-engineering-status.md`)
- ❌ A pitch deck (TBD post-context-loading)
- ❌ Architecture decisions (those go in `05-our-architecture/` AFTER inspiration is loaded)
- ❌ A wedge framing or competitor analysis — this folder is for **complementary inspiration**, not for "how we beat X"
