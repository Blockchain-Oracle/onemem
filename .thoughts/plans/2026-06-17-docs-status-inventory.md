# Plan: Docs Status Inventory

## Inputs

- Reality research:
  `.thoughts/research/2026-06-17-docs-status-inventory.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`
- Current status:
  `.thoughts/wiki/context-engineering-status.md`
- Current package READMEs and source under `packages/`.
- Structure tests in `tests/structure.test.ts`.

## Assumptions

- This is a docs/context cleanup slice, not a product behavior slice.
- Current package README + source is stronger evidence than historical design
  docs.
- Missing parent-folder files should not be linked as required reading from
  current entry points.

## Open Questions

- Whether Abu wants a later full rewrite of all historical architecture docs or
  only entry-point cleanup plus targeted status patches.

## Phase 1: Patch Entry Points

### Goal

Make current-facing docs route agents to files that exist and describe current
implementation status honestly.

### Work

- Correct root package count in `README.md`.
- Replace missing-parent references in `docs/README.md`, `docs/INDEX.md`,
  `docs/03-target-runtimes/README.md`, and
  `docs/05-our-architecture/README.md`.
- Rewrite `docs/04-framework-providers/README.md` around the current trace-only
  provider packages and deferred memory work.
- Mark `docs/05-our-architecture/00-overview/MONOREPO_LAYOUT.md` package count
  as historical and point to current repo state.
- Patch `docs/06-references/CANONICAL_URLS.md` so missing parent research files
  are not implied to exist locally.

### Checks

- `rg` over current entry points for missing parent research links.
- `pnpm test:structure`.

### Acceptance Criteria Covered

- Agents starting from current docs should not hit broken parent-file paths.
- Package count in the root README matches `packages/`.
- Framework provider status distinguishes shipped trace wrappers from deferred
  memory-provider work.

### Stop Condition

Entry-point docs are patched, structure tests encode the boundary, and the docs
verification artifact records evidence.

## Phase 2: Guard Against Regression

### Goal

Prevent reintroducing this class of docs drift.

### Work

- Add structure tests for README package count and missing parent research links
  in current entry points.
- Register this slice's Context Engineering artifacts in structure tests.

### Checks

- `pnpm test:structure`.
- `pnpm lint` if formatting touches shared TS.

### Acceptance Criteria Covered

- Future drift fails locally/CI instead of silently misleading agents.

### Stop Condition

Tests pass with the new assertions.

## Verification Checkpoint

Write `.thoughts/verification/2026-06-17-docs-status-inventory.md` with changed
files, commands, evidence, deviations, and verdict.

## Handoff Notes

This pass deliberately leaves deeper historical architecture pages as historical
source material. The next docs slice can inventory and rewrite package-specific
README claims or public docs pages if needed.
