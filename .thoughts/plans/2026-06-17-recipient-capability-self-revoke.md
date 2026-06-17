# Plan: Recipient Capability Self-Revoke

## Inputs

- Research:
  `.thoughts/research/2026-06-17-recipient-capability-self-revoke.md`
- Spec:
  `.thoughts/specs/2026-06-17-recipient-capability-self-revoke.md`
- Stories:
  `.thoughts/stories/2026-06-17-recipient-capability-self-revoke.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`

## Assumptions

- Contract v0.1 cannot support owner-driven revoke without a protocol migration.
- The TS CLI remains the supported self-revoke surface for this slice.

## Open Questions

- None blocking.

## Phase 1: Add Self-Revoke Helper

### Goal

Centralize command generation so Admin safety behavior is tested.

### Work

- Add a helper in `apps/hosted-dashboard/lib/share-capability.ts`.
- Add tests in `apps/hosted-dashboard/lib/share-capability.test.ts`.

### Checks

- `pnpm --filter @onemem/hosted-dashboard test`

### Acceptance Criteria Covered

R2, R3, R5, AC1.

### Stop Condition

Command helper tests pass for ReadOnly, ReadWrite, and Admin.

## Phase 2: Update Recipient Page

### Goal

Expose holder self-revoke guidance without implying a hosted revoke action.

### Work

- Add a self-revoke card to `/share/[capability_id]`.
- Include the generated command and explicit owner-driven revoke boundary.
- Keep existing claim/no-claim proof copy.

### Checks

- `pnpm --filter @onemem/hosted-dashboard typecheck`
- `pnpm --filter @onemem/hosted-dashboard lint`
- `pnpm --filter @onemem/hosted-dashboard build`
- `pnpm --filter @onemem/hosted-dashboard browser:smoke`

### Acceptance Criteria Covered

R1, R4, AC2, AC3, AC4, AC5.

### Stop Condition

Hosted dashboard checks pass.

## Phase 3: Verification And Wiki

### Goal

Record evidence and keep the Context Engineering status current.

### Work

- Add/update verification audit.
- Register artifacts in structure tests and wiki/log.

### Checks

- `pnpm test:structure`
- `git diff --check`

### Acceptance Criteria Covered

R6, AC6, AC7.

### Stop Condition

Verification audit has pass/fail evidence and residual risks.

## Verification Checkpoint

Write `.thoughts/verification/2026-06-17-recipient-capability-self-revoke.md`
before claiming this slice complete.

## Handoff Notes

Do not implement owner-driven revoke in this slice. That requires a separate
contract design and migration.
