# Plan: Hosted Holder Self-Revoke

## Inputs

- Research:
  `.thoughts/research/2026-06-18-hosted-holder-self-revoke.md`
- Spec:
  `.thoughts/specs/2026-06-18-hosted-holder-self-revoke.md`
- Stories:
  `.thoughts/stories/2026-06-18-hosted-holder-self-revoke.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`
- Current hosted share code and tests.

## Assumptions

- The existing hosted sponsorship API should remain the transaction boundary.
- The self-revoke action should be sponsored only for the connected holder.
- Live wallet-popup execution remains a manual proof unless local Enoki/wallet
  config is available.

## Open Questions

- Whether production Enoki policy needs an additional dashboard-side allowlist
  entry for `namespace::revoke_capability`.

## Phase 1: Sponsorship Helper

### Goal

Teach the hosted sponsorship helper to prepare and execute holder self-revoke.

### Work

- Add a `cap-self-revoke` action.
- Validate `capId` and `capKind`.
- Build `namespace::revoke_capability<KIND>` transaction bytes.
- Return revoked capability metadata after successful execution.
- Add unit tests for validation, target selection, and execution output.

### Checks

- `mise exec -- pnpm --filter @onemem/hosted-dashboard test`

### Acceptance Criteria Covered

- AC1.

### Stop Condition

The helper has deterministic test coverage and no chain mutation in tests.

## Phase 2: Recipient Page UI

### Goal

Expose hosted self-revoke on `/share/[capability_id]`.

### Work

- Add a client component using dApp Kit account and transaction signing.
- Disable action unless connected wallet matches capability owner.
- Add Admin safety acknowledgement.
- Keep CLI fallback and owner-driven-revoke boundary copy.
- Update browser smoke expectations for the static route surface.

### Checks

- `mise exec -- pnpm --filter @onemem/hosted-dashboard typecheck`
- `mise exec -- pnpm --filter @onemem/hosted-dashboard build`
- `mise exec -- pnpm --filter @onemem/hosted-dashboard browser:smoke`

### Acceptance Criteria Covered

- AC2, AC3, AC5.

### Stop Condition

The hosted route renders cleanly without wallet/Enoki config and browser smoke
passes.

## Phase 3: Verification And Context

### Goal

Prove the slice and keep CE status current.

### Work

- Register CE artifacts in structure tests.
- Update context wiki/log.
- Write verification audit.
- Run structure and affected gates.

### Checks

- `mise exec -- pnpm test:structure`
- `mise exec -- pnpm exec biome check apps/hosted-dashboard tests/structure package.json`
- `git diff --check`

### Acceptance Criteria Covered

- AC4 and overall traceability.

### Stop Condition

All affected gates pass and verification audit records any live-proof gap.

## Verification Checkpoint

Write `.thoughts/verification/2026-06-18-hosted-holder-self-revoke.md` before
claiming completion.

## Handoff Notes

Do not claim owner-driven revoke. Do not claim live wallet-popup execution
unless a real connected wallet signs and the resulting Sui transaction is
verified.
