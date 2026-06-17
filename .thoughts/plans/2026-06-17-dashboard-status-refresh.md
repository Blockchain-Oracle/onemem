# Plan: Dashboard Status Refresh

## Inputs

- Research:
  `.thoughts/research/2026-06-17-dashboard-status-refresh.md`
- Spec:
  `.thoughts/specs/2026-06-17-dashboard-status-refresh.md`
- Stories:
  `.thoughts/stories/2026-06-17-dashboard-status-refresh.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`

## Assumptions

- This is docs/status work; no app behavior changes are needed.
- Walrus Sites mirror remains pending because this pass has no deployment
  evidence.

## Open Questions

- None blocking.

## Phase 1: Correct Dashboard Status

### Goal

Remove stale pending labels for currently implemented dashboard surfaces.

### Work

- Update `docs/05-our-architecture/06-dashboard/README.md`.
- Keep the table honest about automated proof vs live/manual boundaries.

### Checks

- `rg` for stale pending status in the dashboard README.

### Acceptance Criteria Covered

R1, R2, AC2.

### Stop Condition

The README no longer calls built dashboard routes pending.

## Phase 2: Add Guard

### Goal

Prevent the same stale status table drift from returning.

### Work

- Add a narrow structure test for dashboard README pending-route drift.
- Register the new Context Engineering artifacts in the structure artifact list.

### Checks

- `pnpm test:structure`

### Acceptance Criteria Covered

R3, AC1.

### Stop Condition

The structure test passes and would fail on stale built-route pending status.

## Phase 3: Verification Trail

### Goal

Record proof and update the durable wiki/log.

### Work

- Add verification audit.
- Update `.thoughts/wiki/index.md`, `.thoughts/wiki/log.md`, and
  `.thoughts/wiki/context-engineering-status.md`.

### Checks

- `pnpm test:structure`
- `git diff --check`

### Acceptance Criteria Covered

R4, AC3, AC4.

### Stop Condition

Verification audit includes command evidence and residual risks.

## Verification Checkpoint

Write `.thoughts/verification/2026-06-17-dashboard-status-refresh.md` before
claiming this slice complete.

## Handoff Notes

This slice is intentionally narrow. Do not claim live hosted deployment or
Walrus Sites mirror deployment without direct deploy evidence.
