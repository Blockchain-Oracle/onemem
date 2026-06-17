# Plan: Framework Provider Status Refresh

## Inputs

- Reality research:
  `.thoughts/research/2026-06-17-framework-provider-status-refresh.md`
- Spec:
  `.thoughts/specs/2026-06-17-framework-provider-status-refresh.md`
- Stories:
  `.thoughts/stories/2026-06-17-framework-provider-status-refresh.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`

## Assumptions

- This is a docs/status correction, not a provider implementation slice.
- Structure tests are the right guard because the risk is stale documentation.

## Open Questions

- Runtime plugin/CLI publication remains a separate release slice.

## Phase 1: Patch Architecture Status

### Goal

Make `docs/05-our-architecture/04-frameworks/README.md` reflect current provider
scope and registry evidence.

### Work

- Update the current note and read-order rows.
- Clarify v0.1 provider coverage means provider packages with trace capture.
- Replace stale pending implementation rows with current scoped status,
  registry evidence, and deferred boundaries.

### Checks

- Targeted `rg` for stale pending rows.
- `pnpm test:structure`.

### Acceptance Criteria Covered

- R1-R4, Story 1.

### Stop Condition

The architecture README no longer shows the five built providers as pending.

## Phase 2: Add Regression Guard

### Goal

Prevent stale provider pending status from returning.

### Work

- Add a structure test that rejects `⏳ pending` rows for the five built
  framework provider package names.
- Add Context Engineering artifact paths to the artifact-existence guard.

### Checks

- `pnpm test:structure`.

### Acceptance Criteria Covered

- R5, Story 2.

### Stop Condition

Structure tests pass and would fail on the old pending rows.

## Verification Checkpoint

Write `.thoughts/verification/2026-06-17-framework-provider-status-refresh.md`
with command evidence and any deviations.

## Handoff Notes

This slice records that framework providers are built/published at their current
scoped versions. It does not publish missing runtime/CLI packages or claim
`hermes-onemem@0.2.0` is on PyPI.
