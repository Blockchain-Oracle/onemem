# OneMem Docs Archive Index

> Current note, 2026-06-17: this index points into the copied research and
> architecture archive that exists in this repo. It deliberately avoids the old
> parent-folder references from the original research workspace because those
> files are not present in this checkout.

Start active agent work from `AGENTS.md` and `.thoughts/wiki/index.md`. Use this
file when you need historical rationale, inspiration, or older architecture
material.

## Fast Path

| If you're doing... | Read first | Then drill into |
|---|---|---|
| Understanding the project goal | `00-goal/GOAL.md` | `.thoughts/wiki/project-map.md` |
| Designing or auditing the Move contract | `01-sui-ecosystem/move-patterns-for-onemem.md` + `01-sui-ecosystem/memwal-deep-dive.md` | `05-our-architecture/01-protocol/` + `contracts/onemem/sources/` |
| Designing or auditing the TS/Python SDKs | `05-our-architecture/02-sdks/README.md` | `packages/sdk-ts/README.md` + `packages/sdk-python/README.md` |
| Designing trace data or verification | `02-inspirations/langsmith-langfuse/TRACE_VIEWERS_COMPARISON.md` | `05-our-architecture/01-protocol/data-model.md` |
| Designing dashboard UX | `02-inspirations/BRAND_AND_SURFACES.md` + `02-inspirations/langsmith-langfuse/` | `05-our-architecture/06-dashboard/` + `packages/dashboard/README.md` |
| Working on runtime plugins | `03-target-runtimes/README.md` | `packages/plugin-*/README.md` + `packages/mcp-server/README.md` |
| Working on framework providers | `04-framework-providers/README.md` | `packages/provider-*/README.md` |
| Reviewing competitors or landscape | `02-inspirations/MEMORY_SYSTEMS_COMPARISON.md` + `02-inspirations/other-memory-systems/WEB3_VERIFIABLE_AI_LANDSCAPE.md` | Per-product files under `02-inspirations/` |
| Reviewing Sui ecosystem docs | `01-sui-ecosystem/SUI_DOC_TREE.md` | Per-topic deep dives under `01-sui-ecosystem/` |
| Finding external URLs | `06-references/CANONICAL_URLS.md` | Current docs via Context7 or web when freshness matters |

## Archive Layout

```text
docs/
├── README.md
├── INDEX.md
├── 00-goal/
├── 01-sui-ecosystem/
├── 02-inspirations/
├── 03-target-runtimes/
├── 04-framework-providers/
├── 05-our-architecture/
├── 06-references/
└── 06-specs/
```

## Source-of-truth Rule

- Current operating rules: `AGENTS.md`, package `CLAUDE.md` files, and
  `.thoughts/wiki/`.
- Current package behavior: package READMEs plus source under `packages/` and
  `apps/`.
- Historical rationale: this `docs/` tree.
- External library/API truth: use Context7 per `AGENTS.md` before relying on
  memory or old copied docs.
