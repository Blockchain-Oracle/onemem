# Plan: Demo Matrix CI Gate

Date: 2026-06-17

## Inputs

- Research:
  `.thoughts/research/2026-06-17-demo-matrix-ci-gate.md`
- Spec:
  `.thoughts/specs/2026-06-17-demo-matrix-ci-gate.md`
- Stories:
  `.thoughts/stories/2026-06-17-demo-matrix-ci-gate.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`
- Current CI:
  `.github/workflows/ci.yml`

## Assumptions

- Deterministic package checks are the correct CI surface for every PR.
- Live testnet demo writes need a separate researched workflow because they
  consume real chain resources.

## Open Questions

- Whether to add a future scheduled or manually dispatched live testnet demo
  workflow.

## Phase 1: Root Command

### Goal

Expose an explicit deterministic demo matrix command.

### Work

- Add `test:demo-matrix` to root `package.json`.
- Use Turborepo directory filtering over `./demos/*`.

### Checks

- `mise exec -- pnpm test:demo-matrix`

### Acceptance Criteria Covered

- AC1.

### Stop Condition

The command runs all demo package tests/typechecks/lints/builds.

## Phase 2: CI And Guards

### Goal

Make demo matrix verification visible and guarded.

### Work

- Add a named step to `.github/workflows/ci.yml`.
- Add structure tests for the root script and CI step.

### Checks

- `mise exec -- pnpm test:structure`

### Acceptance Criteria Covered

- AC2, AC3.

### Stop Condition

Structure tests prove the command and CI step exist.

## Phase 3: Docs And Verification

### Goal

Update demo status without overclaiming live chain proof.

### Work

- Update demo pillar README.
- Update E2E test plan current reality.
- Write verification audit and wiki updates.

### Checks

- `git diff --check`
- Final `mise exec -- pnpm test:structure`

### Acceptance Criteria Covered

- AC4.

### Stop Condition

The slice is verified, committed, and pushed.

## Verification Checkpoint

Use `abu-context-engineering:verification-audit` before claiming completion.

## Handoff Notes

Do not claim live testnet or mainnet E2E CI. This slice is deterministic demo
matrix CI only.
