# Plan: Public Verifier Prototype Parity

Date: 2026-06-17

## Inputs

- Prototype discovery: `.thoughts/prototype-discovery/2026-06-17-one-mem-2.md`
- Static prototype: `/Users/abu/Downloads/One Mem 2/Verify.html`
- Spec: `.thoughts/specs/2026-06-17-public-verifier-parity.md`
- Stories: `.thoughts/stories/2026-06-17-public-verifier-parity.md`
- Quality profile: `.thoughts/quality/2026-06-17-project-quality-profile.md`
- Current route: `apps/hosted-dashboard/app/verify/[session_id]/page.tsx`

## Assumptions

- Public verification is read-only and safe to run from the hosted server.
- The existing SDK `verifyTraceChain` remains the source of truth for trace
  integrity.
- Browser smoke can use a known example session id and does not need private
  credentials.

## Phase 1: Extract Data Helper

### Goal

Move public verifier data loading into a testable hosted helper.

### Work

- Add `apps/hosted-dashboard/lib/public-verify.ts`.
- Implement paginated `ActionCallEmittedEvent` loading.
- Keep dependency injection for tests.

### Checks

- `pnpm --filter @onemem/hosted-dashboard test`

### Acceptance Criteria Covered

- AC1 and AC2.

### Stop Condition

- Unit tests prove pagination and formatting helpers.

## Phase 2: Route UI Parity

### Goal

Render the prototype's trust disclosure in the hosted route.

### Work

- Update `/verify/[session_id]` to use the helper.
- Add Proven/Not proven panels.
- Show expected/computed roots, call evidence rows, mismatch copy, and failure
  state.

### Checks

- Hosted lint/typecheck/build.
- Hosted browser smoke.

### Acceptance Criteria Covered

- AC3 and AC4.

### Stop Condition

- Public verifier route renders in smoke without login and gates pass.

## Verification Checkpoint

Write a verification audit with command output and note any live-data limits.
