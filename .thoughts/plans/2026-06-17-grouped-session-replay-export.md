# Plan: Grouped Session Replay Export

## Inputs

- Research: `.thoughts/research/2026-06-17-grouped-session-replay-export.md`
- Spec: `.thoughts/specs/2026-06-17-grouped-session-replay-export.md`
- Stories: `.thoughts/stories/2026-06-17-grouped-session-replay-export.md`
- Quality profile: `.thoughts/quality/2026-06-17-project-quality-profile.md`
- Current implementation: `packages/dashboard/lib/sessions.ts`,
  `packages/dashboard/app/sessions/SessionsView.tsx`, and existing trace reader.
- Current Next.js docs fetched with Context7 for App Router route handlers.

## Assumptions

- Grouped replay/export remains a dashboard read-only aggregation.
- JSON export is enough for the first portable artifact.
- The local dashboard is the target surface for this pass.

## Open Questions

- Future signed export receipts are out of scope.
- Hosted dashboard parity is out of scope.

## Phase 1: Export Data Model

### Goal

Build a read-only grouped export helper over existing session IDs.

### Work

- Add grouped export types and helper functions to dashboard session code or a
  closely scoped helper.
- Reuse `fetchSession()` per session.
- Include proof-boundary text and partial-failure rows.

### Checks

- Unit tests for export shape, invalid session IDs, and partial failures where
  feasible.

### Acceptance Criteria Covered

- AC4, AC5, AC6.

### Stop Condition

- Helper returns deterministic JSON-ready data without signing or decrypting.

## Phase 2: API Route

### Goal

Expose grouped export data to the client.

### Work

- Add `POST /api/sessions/export`.
- Parse JSON input using current App Router route-handler patterns.
- Return 400 for invalid `sessionIds`.

### Checks

- Dashboard tests cover valid/invalid behavior through helper-level tests.
- Route builds under Next.js.

### Acceptance Criteria Covered

- AC3, AC5.

### Stop Condition

- Client can request export data with a list of session IDs.

## Phase 3: Sessions UI

### Goal

Add grouped replay/export affordance to each Sessions group.

### Work

- Add a client modal/drawer for grouped replay/export.
- Wire each group card to open it.
- Render loading, error, partial failure, no-call, and loaded states.
- Add JSON download from the loaded export.

### Checks

- Dashboard lint/typecheck/build.
- Browser check `/sessions` with Chrome plugin.

### Acceptance Criteria Covered

- AC1, AC2, AC3, AC8.

### Stop Condition

- Sessions UI exposes and renders grouped replay/export without fake protocol
  claims.

## Verification Checkpoint

- `pnpm --filter @onemem/dashboard test`
- `pnpm --filter @onemem/dashboard lint`
- `pnpm --filter @onemem/dashboard typecheck`
- `pnpm --filter @onemem/dashboard build`
- `pnpm test:structure`
- Chrome plugin browser proof for `/sessions`.

## Handoff Notes

- If route or tests expose current trace-fetch limits, keep this slice bounded
  and document the limit rather than widening into a trace indexer rewrite.
