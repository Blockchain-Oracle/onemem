# Plan: Unified Sessions

## Inputs

- Reality research:
  `.thoughts/research/2026-06-17-unified-sessions-gap.md`
- Spec: `.thoughts/specs/2026-06-17-unified-sessions.md`
- Stories: `.thoughts/stories/2026-06-17-unified-sessions.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`
- Prototype source: `/Users/abu/Downloads/One Mem 2/Sessions.html`
- Current route: `packages/dashboard/app/sessions/page.tsx`

## Assumptions

- Abu's latest instruction accepts the next autonomous implementation scope, so
  this plan can be executed after writing it.
- v0.1 unified sessions are dashboard-derived day/runtime groups over existing
  `TraceSession` objects, not new protocol objects.
- Verification can run lazily on user action to avoid expensive chain walks on
  every page load.

## Open Questions

- Whether future grouping should use parent-call lineage when enough sessions
  carry cross-runtime parent links.
- Whether hosted dashboard should expose the same API route immediately.

## Phase 1: Data Model And API

### Goal

Create reusable server helpers for grouped sessions and real "verify all"
results.

### Work

- Add unified-session types and grouping helpers to `packages/dashboard/lib`.
- Group `fetchRecentSessions()` by local day and runtime.
- Add a dashboard API route that verifies an explicit list of session IDs and
  returns per-session and aggregate results.

### Checks

- `pnpm --filter @onemem/dashboard typecheck`

### Acceptance Criteria Covered

- AC1, AC3, AC4.

### Stop Condition

Server code can provide grouped sessions and real verification results without a
signer.

## Phase 2: Sessions UI

### Goal

Translate the prototype Sessions surface into the current Next.js dashboard.

### Work

- Replace the flat `/sessions` page with grouped day cards.
- Render runtime lanes and sub-session rows with existing CSS classes.
- Add a client "Verify all" drawer that calls the verify API and handles
  loading, success, failure, and network error states.
- Include concise proof-boundary copy.

### Checks

- `pnpm --filter @onemem/dashboard typecheck`
- `pnpm --filter @onemem/dashboard build`

### Acceptance Criteria Covered

- AC1, AC2, AC3, AC4, AC6.

### Stop Condition

`/sessions` visually and behaviorally matches the accepted v0.1 slice of the
prototype without fake state.

## Phase 3: Verification And Context Update

### Goal

Prove the implementation and preserve the result in `.thoughts`.

### Work

- Run focused quality gates.
- Browser-check `/sessions` against representative or live data.
- Add a verification audit under `.thoughts/verification`.
- Update wiki index/log with the new spec, stories, plan, and audit.

### Checks

- `pnpm test:structure`
- Dashboard typecheck/build.
- Browser route check.

### Acceptance Criteria Covered

- AC5, AC6.

### Stop Condition

The route is implemented, tested, and traceable back to research/spec/stories.

## Verification Checkpoint

Use the `verification-audit` skill before claiming this scope complete.

## Handoff Notes

This scope intentionally leaves runtime controls, delegate-key lifecycle, share
recipient mode, and full grouped replay/export for later prototype deltas.
