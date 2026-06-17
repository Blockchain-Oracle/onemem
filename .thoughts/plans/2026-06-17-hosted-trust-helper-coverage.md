# Plan: Hosted Trust Helper Coverage

Date: 2026-06-17

## Inputs

- `.thoughts/specs/2026-06-17-hosted-cli-delegate-minting.md`
- `.thoughts/stories/2026-06-17-hosted-cli-delegate-minting.md`
- `.thoughts/verification/2026-06-17-hosted-cli-delegate-minting.md`
- `.thoughts/quality/2026-06-17-project-quality-profile.md`
- Current hosted-dashboard code under `apps/hosted-dashboard`

## Assumptions

- Live wallet approval remains manual because it depends on a browser wallet popup.
- Server-side and browser-helper behavior can still be unit-tested without faking
  a successful chain transaction.
- No secrets are available in the current shell, so live Enoki/private-key proof is
  not claimed by this slice.

## Phase 1: Package Test Hook

### Goal

Make hosted-dashboard helpers testable through a package-local command.

### Work

- Add `test` script to `apps/hosted-dashboard/package.json`.
- Add `vitest` dev dependency, matching existing package conventions.

### Checks

- `pnpm --filter @onemem/hosted-dashboard test`

### Acceptance Criteria Covered

- Hosted trust helpers have a repeatable local test gate.

### Stop Condition

- The command runs without relying on wallet, Enoki, or Sui private keys.

## Phase 2: Helper Coverage

### Goal

Cover the non-interactive trust boundaries in hosted CLI/onboarding.

### Work

- Test `hosted-state` wallet/network scoping and malformed storage handling.
- Test `cli-login-client` digest/object parsing and hex validation helpers.
- Test `cli-login` config validation and MemWal account lookup parsing through an
  injected client.
- Test sponsored provisioning config/network validation without executing Enoki.

### Checks

- `pnpm --filter @onemem/hosted-dashboard test`
- `pnpm --filter @onemem/hosted-dashboard lint`
- `pnpm --filter @onemem/hosted-dashboard typecheck`
- `pnpm --filter @onemem/hosted-dashboard build`
- `pnpm test:structure`
- `git diff --check`

### Acceptance Criteria Covered

- Missing config returns structured non-secret failures.
- Wallet-scoped local storage does not cross owners or networks.
- Created-object parsing fails closed when expected chain objects are absent.
- MemWal registry lookup can distinguish existing account IDs from missing fields.

### Stop Condition

- Tests and existing hosted quality gates pass.

## Verification Checkpoint

Write a verification audit with command output and any manual-wallet limitation.

## Handoff Notes

This slice does not replace the required manual wallet popup proof for hosted CLI
delegate registration. It makes the underlying helpers harder to regress before
that live UX proof is run.
