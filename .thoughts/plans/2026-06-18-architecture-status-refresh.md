# Plan: Architecture Status Refresh

## Inputs

- Research: `.thoughts/research/2026-06-18-architecture-status-refresh.md`
- Spec: `.thoughts/specs/2026-06-18-architecture-status-refresh.md`
- Stories: `.thoughts/stories/2026-06-18-architecture-status-refresh.md`
- Quality profile: `.thoughts/quality/2026-06-17-project-quality-profile.md`

## Assumptions

- This is a docs/status slice; no package publication or chain mutation belongs
  in this work.
- Mainnet remains pending because only testnet package evidence exists.
- Python SDK should be described as source-built/read-verify oriented until a
  verified write-parity implementation exists.

## Open Questions

- None blocking.

## Phase 1: Refresh Protocol Status

### Goal

Replace stale protocol pending rows with current scoped status.

### Work

- Edit `docs/05-our-architecture/01-protocol/README.md`.
- Name current source/test evidence and testnet package state.
- Keep mainnet pending.

### Checks

- Targeted text review.
- Structure test assertions added in Phase 3.

### Acceptance Criteria Covered

- AC1, AC2.

### Stop Condition

Protocol README status rows are no longer stale.

## Phase 2: Refresh SDK Status

### Goal

Replace stale SDK pending rows with current TS/Python source and registry truth.

### Work

- Edit `docs/05-our-architecture/02-sdks/README.md`.
- State TS SDK source and npm status.
- State Python SDK source and PyPI/parity boundaries.

### Checks

- `pnpm registry:status`
- Targeted text review.

### Acceptance Criteria Covered

- AC3, AC4.

### Stop Condition

SDK README status rows match source and registry evidence.

## Phase 3: Add Guardrails

### Goal

Prevent core protocol/SDK status rows from regressing to stale pending claims.

### Work

- Add structure tests in an existing docs/status shard.
- Keep assertions narrow to built protocol rows and TS SDK rows.
- Allow mainnet/PyPI pending rows.

### Checks

- `pnpm test:structure`
- A targeted structure shard run if useful.

### Acceptance Criteria Covered

- AC5.

### Stop Condition

Structure tests pass and would fail on old stale rows.

## Phase 4: Verify And Land

### Goal

Prove the docs match the accepted spec and push the cleanup.

### Work

- Run relevant docs/structure gates.
- Write verification audit.
- Commit, push, and watch CI/Release.

### Checks

- `pnpm registry:status`
- `pnpm test:structure`
- `git diff --check`
- GitHub CI/Release.

### Acceptance Criteria Covered

- AC6.

### Stop Condition

Commit is on `main` and relevant remote checks pass.

## Verification Checkpoint

Create `.thoughts/verification/2026-06-18-architecture-status-refresh.md`.

## Handoff Notes

Registry publication remains a separate blocked release task until npm/PyPI
credentials or trusted-publisher settings exist.
