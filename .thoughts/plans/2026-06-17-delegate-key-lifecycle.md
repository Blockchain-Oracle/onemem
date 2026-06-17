# Plan: Delegate Key Lifecycle

## Inputs

- Research:
  `.thoughts/research/2026-06-17-delegate-key-lifecycle.md`
- Spec:
  `.thoughts/specs/2026-06-17-delegate-key-lifecycle.md`
- Stories:
  `.thoughts/stories/2026-06-17-delegate-key-lifecycle.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`
- Current source in SDK, CLI, dashboard, and hosted dashboard.

## Assumptions

- Expiry belongs to the delegate credential bundle, so file-backed credential
  fields should not be used after `expiresAt`.
- Env overrides are explicit operator intent and can still provide usable values
  even if an old file exists.
- Hosted minting remains external/configured; UI can send requested metadata but
  must not synthesize credentials.

## Open Questions

- Hosted backend mint endpoint schema is not final. Keep the request body small
  and explicit.

## Phase 1: SDK And CLI Expiry Semantics

### Goal

Make the shared credential resolver expiry-aware.

### Work

- Add expiry/lifecycle fields to `MemoryConfigResolution`.
- Ignore expired file-backed credentials when resolving memory config.
- Let env overrides still produce config.
- Update CLI memory error to mention expired credentials.

### Checks

- `pnpm --filter @onemem/sdk-ts test`
- `pnpm --filter @onemem/cli test`

### Acceptance Criteria Covered

R1, R2, R3, R7.

### Stop Condition

Tests prove expired file credentials do not configure memory and env override
still works.

## Phase 2: Dashboard Lifecycle Summary

### Goal

Expose sanitized lifecycle metadata in local dashboard Settings.

### Work

- Extend `localCredentialSummary` with delegate label, TTL, lifecycle status,
  expiry note, and days remaining.
- Update Settings Delegate keys tab to show lifecycle status and re-pair
  guidance when expired.
- Add dashboard tests for active/expiring/expired and secret non-leakage.

### Checks

- `pnpm --filter @onemem/dashboard test`
- `pnpm --filter @onemem/dashboard typecheck`
- `pnpm --filter @onemem/dashboard build`
- Manual Chrome visual pass before demo polish.

### Acceptance Criteria Covered

R4, R5, R7.

### Stop Condition

Settings renders lifecycle information from the tested summary helper.

## Phase 3: Hosted CLI Pairing Request Metadata

### Goal

Let hosted pairing request delegate label and TTL without faking minting.

### Work

- Add label and TTL controls to `apps/hosted-dashboard/app/cli-login/page.tsx`.
- POST JSON request metadata to `NEXT_PUBLIC_ONEMEM_MINT_URL`.
- Preserve honest missing-endpoint behavior.

### Checks

- `pnpm --filter @onemem/hosted-dashboard typecheck`
- `pnpm --filter @onemem/hosted-dashboard build`

### Acceptance Criteria Covered

R6.

### Stop Condition

Hosted page compiles and request contract is explicit in code.

## Verification Checkpoint

Run focused package tests/typechecks/builds and write
`.thoughts/verification/2026-06-17-delegate-key-lifecycle.md` before claiming
the slice complete.

## Handoff Notes

Do not implement hosted share/revoke buttons until signer/session and contract
support are real. The local `/share` page should continue to avoid fake
owner-driven revoke actions.
