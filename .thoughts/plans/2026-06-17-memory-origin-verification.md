# Plan: Memory Origin Verification

## Inputs

- Research: `.thoughts/research/2026-06-17-memory-origin-verification.md`
- Spec: `.thoughts/specs/2026-06-17-memory-origin-verification.md`
- Stories: `.thoughts/stories/2026-06-17-memory-origin-verification.md`
- Prior audit: `.thoughts/verification/2026-06-17-memory-provenance.md`

## Assumptions

- Reusing `/api/sessions/verify` is the correct trust path because it already
  walks real TraceSession data.
- User-triggered verification is preferable to automatic verification for this
  slice.

## Open Questions

- Browser interaction automation remains a project-level follow-up.

## Phase 1: Drawer State And API Call

### Goal

Add a selected-memory verification state machine and API call.

### Work

- Update `MemoryDrawer.tsx`.
- Use `memory.sessionId` as the reset key.
- Validate the response shape before rendering success/failure.

### Checks

- Dashboard typecheck and lint.

### Acceptance Criteria Covered

- AC1, AC2, AC3.

### Stop Condition

- Drawer can render unverified, loading, done, and error states.

## Phase 2: Proof-Boundary UI

### Goal

Display verification results without overclaiming.

### Work

- Add a compact result panel under the existing proof boundary.
- Show session id, call count, status, and broken call when present.
- Keep plaintext/semantic non-proof language.

### Checks

- `/memories` HTTP-render.
- Dashboard build.

### Acceptance Criteria Covered

- AC3, AC4, AC6.

### Stop Condition

- Rendered route includes the new action and proof-boundary copy.

## Verification Checkpoint

- Run focused dashboard checks.
- Run `pnpm test:structure` after adding Context Engineering artifacts.
- Write `.thoughts/verification/2026-06-17-memory-origin-verification.md`.

## Handoff Notes

Do not add automatic verification or memory plaintext decrypt in this slice.
