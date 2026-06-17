# Stories: Hosted Share Capability Creation

## Traceability

- Spec:
  `.thoughts/specs/2026-06-17-hosted-share-capability-creation.md`
- Prior share readiness:
  `.thoughts/specs/2026-06-17-share-capability-readiness.md`
- Hosted sponsorship:
  `.thoughts/specs/2026-06-17-hosted-sponsored-provisioning.md`

## Story 1: Hosted Owner Sees Share Readiness

As a hosted namespace owner,
I want `/share` to recognize my connected account and provisioned namespace,
so that I know whether I can share now or what input is missing.

### Acceptance Criteria

- Covers R5, R7, R9, R10, AC4.
- Disconnected users see a wallet/account gate.
- Users without local hosted provisioning state can still enter namespace and
  Admin cap IDs manually.
- Public verification link generation remains available.
- The page explains that recipient capability links are read-only object views,
  and that claim transactions plus owner-driven revoke are not implemented in
  this slice.

### Scenarios

- Given no account is connected, when I open `/share`, then I see the public
  verification helper and the share form is disabled by the account gate.
- Given a connected account with no provisioning state, when I open `/share`,
  then I can manually provide namespace/Admin cap IDs instead of seeing fake
  state.

## Story 2: Owner Mints A Sponsored Capability

As a hosted namespace owner,
I want to mint a ReadOnly or ReadWrite capability to a recipient address through
a sponsored wallet transaction,
so that sharing memory is a real Sui capability transfer.

### Acceptance Criteria

- Covers R1, R2, R3, R4, R6, R8, AC1, AC2, AC3.
- Recipient, namespace, Admin cap, network, and cap kind are validated before
  sponsorship.
- The wallet signs only sponsored bytes returned by the server.
- The execute response shows a capability ID parsed from Sui transaction object
  changes.
- ReadOnly and ReadWrite actions use distinct Move targets and output types.

### Scenarios

- Given valid share inputs and configured sponsorship, when I sign and execute a
  ReadOnly share, then the page shows the recipient, ReadOnly kind, transaction
  digest, and ReadOnly capability ID.
- Given the same inputs but ReadWrite selected, when I sign and execute, then the
  page shows a ReadWrite capability ID.

## Story 3: Operator-Safe Verification

As a hosted deployment operator,
I want no-config and browser smoke paths to fail safely,
so that CI can prove the page does not fake successful sharing.

### Acceptance Criteria

- Covers R6, R10, AC4, AC5, AC6.
- With Enoki private config blank, prepare returns structured `not_configured`
  before any fake sponsorship.
- Browser smoke covers `/share` copy and missing-account behavior.
- Verification artifacts state whether live wallet/sponsorship proof was run.

### Scenarios

- Given no Enoki private key, when an API share prepare request is made, then it
  returns `503` with `code: not_configured` and does not leak secrets.
- Given the smoke browser opens `/share`, then no failed browser resources or
  console errors occur.

## Open Questions

- Superseded follow-up: recipient capability landing now exists as
  `.thoughts/specs/2026-06-17-recipient-share-landing.md`. Claim transaction
  and owner-driven revoke still stay out unless contract/API support changes.
