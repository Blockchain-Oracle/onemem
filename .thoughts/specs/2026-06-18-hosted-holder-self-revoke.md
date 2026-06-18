# Spec: Hosted Holder Self-Revoke

## Objective

Let a connected capability holder revoke their own OneMem namespace capability
from the hosted recipient share page using the existing contract v0.1
`revoke_capability<KIND>` path and the existing Enoki-sponsored transaction
boundary.

## Background And Current Reality

Contract v0.1 supports holder self-revoke by consuming the capability object
owned by the signer. It does not support an owner/admin revoking another
wallet's capability. Hosted recipient share pages already show owner metadata
and a CLI command, but there is no hosted wallet action.

## Users

- Capability recipients who want to renounce access from the hosted page.
- Namespace admins who need honest UI that does not imply owner-driven revoke.
- Demo operators who need the hosted share lifecycle to look complete without
  bypassing contract constraints.

## Goals

- Add a hosted self-revoke action for the connected holder.
- Reuse the existing `/api/share/sponsored/prepare` and `/execute` boundary.
- Require the connected account to match the capability's address owner before
  enabling the action.
- Guard Admin-cap revocation with an explicit safety acknowledgement.
- Keep owner-driven revoke explicitly out of scope.

## Non-goals

- No owner/admin revocation of another wallet's capability.
- No Move protocol changes.
- No claim transaction.
- No plaintext, Walrus, or Seal access in this slice.
- No live wallet-popup proof if Enoki/wallet config is unavailable.

## Requirements

- R1: The sponsored provisioning helper accepts a new self-revoke action with
  capability ID and kind.
- R2: The helper builds a transaction calling
  `namespace::revoke_capability<KIND>` with the capability object.
- R3: Execution returns the transaction digest, revoked capability ID, and kind
  after Sui reports success.
- R4: The recipient share page exposes a client-side self-revoke control for
  address-owned capabilities.
- R5: The control is disabled unless the connected wallet matches the
  capability owner.
- R6: Admin capabilities require a safety acknowledgement before the control is
  enabled.
- R7: The UI and docs keep owner-driven revoke as a future protocol/product
  boundary.

## Acceptance Criteria

- AC1: Unit tests cover request validation, target allowlist, transaction
  execution parsing, and invalid kind handling for the self-revoke action.
- AC2: Hosted browser smoke still passes without Enoki private key config and
  without wallet state.
- AC3: `@onemem/hosted-dashboard` typecheck, tests, build, and browser smoke
  pass.
- AC4: Structure tests pass after CE artifacts are registered.
- AC5: No docs or UI claim owner-driven revoke exists in contract v0.1.

## Constraints

- Use existing dApp Kit wallet-signing flow patterns.
- Use existing hosted sponsorship config errors and route shape.
- Do not expose secrets in API errors.
- Do not mutate chain in automated tests.

## Stories Needed

- Story 1: Holder revokes own capability from hosted share page.
- Story 2: Non-owner cannot initiate hosted revoke.
- Story 3: Admin holder must acknowledge risk before hosted self-revoke.

## Open Questions

- Whether Enoki's production policy accepts this new transaction shape without
  additional app-side configuration.

## Source References

- `.thoughts/research/2026-06-18-hosted-holder-self-revoke.md`
- `contracts/onemem/sources/namespace.move`
- `apps/hosted-dashboard/lib/sponsored-provisioning.ts`
- `apps/hosted-dashboard/app/share/[capability_id]/page.tsx`
