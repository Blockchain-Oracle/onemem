# Plan: CLI Historical Docs Boundary

## Inputs

- Research:
  `.thoughts/research/2026-06-17-cli-historical-docs-boundary.md`
- Spec:
  `.thoughts/specs/2026-06-17-cli-historical-docs-boundary.md`
- Stories:
  `.thoughts/stories/2026-06-17-cli-historical-docs-boundary.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`

## Assumptions

- `docs/05-our-architecture/05-cli/command-surface.md` is the current
  architecture command truth.
- `packages/cli-ts/src/index.ts` and `packages/cli-python/onemem_cli/main.py`
  are the source-of-truth registries.

## Phase 1: Mark Historical Sketches

### Work

- Add explicit historical notes to `cli-typescript-impl.md`,
  `cli-python-impl.md`, and `output-design.md`.
- Update CLI README read-order and principles so historical sketches are not
  described as current implementation plans.

### Acceptance Criteria Covered

R1, R2.

## Phase 2: Correct Login Flow

### Work

- Update `login-flow.md` to describe OS-assigned callback ports.
- Remove current-behavior claims about `onemem logout`.
- Keep the hosted callback contract intact.

### Acceptance Criteria Covered

R3, R4.

## Phase 3: Guard And Verify

### Work

- Add structure tests for historical notes and login-flow stale claims.
- Register artifacts in structure tests and wiki/log.

### Checks

- `pnpm test:structure`
- `git diff --check`
- Targeted `rg` for stale login-flow text.

### Acceptance Criteria Covered

R5, R6, AC1, AC2, AC3, AC4.

## Stop Condition

Verification artifact records pass/fail evidence and residual risk.
