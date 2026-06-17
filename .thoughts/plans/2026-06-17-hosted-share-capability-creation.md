# Plan: Hosted Share Capability Creation

## Inputs

- Spec:
  `.thoughts/specs/2026-06-17-hosted-share-capability-creation.md`
- Stories:
  `.thoughts/stories/2026-06-17-hosted-share-capability-creation.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`
- Prototype:
  `/Users/abu/Downloads/One Mem 2/Share.html`
- Current hosted sponsorship helper and onboarding UI.
- Context7 Enoki sponsored transaction docs.

## Assumptions

- Testnet remains the default hosted network.
- The browser may not have a connected wallet during automated smoke, so smoke
  proves render/no-config/account-gate behavior while unit tests prove helper
  validation and parsing.
- Live transaction proof is desirable but not required for the code path to be
  merged unless the current environment exposes usable wallet signing.

## Open Questions

- Whether to build recipient `/share/[capability_id]` next after creation.
- Whether share history should be a later on-chain event view.

## Phase 1: Sponsorship Action Extension

### Goal

Extend the existing hosted sponsorship helper without weakening its allowlist.

### Work

- Add `ro-cap-share` and `rw-cap-share` actions.
- Validate sender, recipient, namespace ID, Admin cap ID, and network.
- Build the matching `namespace::mint_capability_readonly` or
  `namespace::mint_capability_readwrite` transaction kind bytes.
- Allowlist the exact Move target and sender/recipient addresses.
- Parse the corresponding created capability object type on execution.

### Checks

- `pnpm --filter @onemem/hosted-dashboard test`
- `pnpm --filter @onemem/hosted-dashboard typecheck`

### Acceptance Criteria Covered

R1, R2, R3, R4, AC1, AC2, AC3.

### Stop Condition

The helper rejects malformed share requests and returns typed capability IDs for
share actions.

## Phase 2: Hosted Share Route

### Goal

Add a hosted-owned `/share` route with a real sponsored share form.

### Work

- Add `apps/hosted-dashboard/app/share/page.tsx`.
- Add a client component that uses dApp Kit account/signing state.
- Load hosted provisioning state for connected account/network.
- Provide manual namespace/Admin cap inputs.
- Preserve public verification link sharing.
- Show proof-boundary and unsupported revoke/recipient-claim copy.

### Checks

- Hosted typecheck/build.
- Hosted browser smoke covers `/share`.

### Acceptance Criteria Covered

R5, R6, R7, R8, R9, R10, AC4.

### Stop Condition

Hosted `/share` no longer 404s and does not depend on the local dashboard route.

## Phase 3: Verification And Context

### Goal

Prove the slice and update durable project state.

### Work

- Extend hosted unit tests and browser smoke.
- Update structure tests for the hosted route and Context Engineering artifacts.
- Update `.thoughts/wiki/context-engineering-status.md`.
- Write verification audit.

### Checks

- `pnpm --filter @onemem/hosted-dashboard test`
- `pnpm --filter @onemem/hosted-dashboard lint`
- `pnpm --filter @onemem/hosted-dashboard typecheck`
- `pnpm --filter @onemem/hosted-dashboard build`
- `pnpm --filter @onemem/hosted-dashboard browser:smoke`
- `pnpm test:structure`
- `git diff --check`

### Acceptance Criteria Covered

AC5, AC6.

### Stop Condition

Verification audit maps stories/spec to code and command evidence.

## Verification Checkpoint

Write
`.thoughts/verification/2026-06-17-hosted-share-capability-creation.md` before
claiming completion.

## Handoff Notes

Superseded by `.thoughts/plans/2026-06-17-recipient-share-landing.md`:
`/share/[capability_id]` recipient landing is now the next slice. Do not claim
owner-driven revoke, event-backed share history, or a claim transaction.
