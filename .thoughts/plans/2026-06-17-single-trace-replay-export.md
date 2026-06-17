# Plan: Single Trace Replay Export

## Inputs

- Research:
  `.thoughts/research/2026-06-17-single-trace-replay-export.md`
- Spec:
  `.thoughts/specs/2026-06-17-single-trace-replay-export.md`
- Stories:
  `.thoughts/stories/2026-06-17-single-trace-replay-export.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`

## Assumptions

- `fetchSession()` is the authoritative dashboard server path for trace metadata
  plus verification.
- Single trace export should reuse grouped export call serialization semantics
  while using a distinct schema/source/proof boundary.

## Open Questions

- None blocking.

## Phase 1: Export Builder And Route

### Goal

Add a server-generated single TraceSession export.

### Work

- Extend `packages/dashboard/lib/session-export.ts` with a
  `buildTraceSessionExport()` function.
- Add tests in `packages/dashboard/lib/session-export.test.ts`.
- Add a dynamic route at `packages/dashboard/app/api/trace/[session_id]/export/route.ts`.

### Checks

- `pnpm --filter @onemem/dashboard test`
- `pnpm --filter @onemem/dashboard typecheck`

### Acceptance Criteria Covered

R1, R2, R3, R6, AC1, AC2.

### Stop Condition

The route and builder return a proof-scoped single-session export with tests.

## Phase 2: Replay Modal UI

### Goal

Expose Download JSON and Copy JSON in the existing single trace replay modal.

### Work

- Pass the session ID into `ReplayModal`.
- Fetch the new export route when the modal opens.
- Add Download JSON and Copy JSON controls.
- Keep no-plaintext copy visible.

### Checks

- `pnpm --filter @onemem/dashboard lint`
- `pnpm --filter @onemem/dashboard build`

### Acceptance Criteria Covered

R4, R5, AC3, AC4.

### Stop Condition

The dashboard builds and the modal UI is type/lint clean.

## Phase 3: Browser Smoke And Context Trail

### Goal

Prove the feature through the dashboard browser harness and record the slice.

### Work

- Extend `packages/dashboard/scripts/browser-smoke.mjs` to check
  `/trace/[session_id]` replay/export.
- Register artifacts in structure tests and wiki/log.
- Write final verification audit.

### Checks

- `pnpm --filter @onemem/dashboard browser:smoke`
- `pnpm test:structure`
- `git diff --check`

### Acceptance Criteria Covered

R7, R8, AC5, AC6, AC7.

### Stop Condition

Verification audit records pass/fail evidence and residual risks.

## Verification Checkpoint

Write `.thoughts/verification/2026-06-17-single-trace-replay-export.md` before
claiming this slice complete.

## Handoff Notes

Do not include plaintext in export. Future decrypt-aware replay needs separate
capability/session-key design.
