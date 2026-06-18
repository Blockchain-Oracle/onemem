# Stories: Hosted Holder Self-Revoke

## Traceability

- Spec: `.thoughts/specs/2026-06-18-hosted-holder-self-revoke.md`
- Requirements: R1-R7
- Acceptance criteria: AC1-AC5

## Story 1: Holder Revokes Own Capability

As a capability holder,
I want to revoke my own capability from the hosted recipient page,
so that I can renounce access without switching to the CLI.

### Acceptance Criteria

- The page prepares a sponsored self-revoke transaction for the loaded
  capability ID and kind.
- The holder signs the prepared transaction with the connected wallet.
- The page executes the sponsored transaction and displays the transaction
  digest after success.

### Scenarios

- Given a connected wallet owns a ReadOnly capability
  When the holder clicks self-revoke and signs
  Then the hosted app calls `namespace::revoke_capability<ReadOnly>`.
- Given a connected wallet owns a ReadWrite capability
  When the holder clicks self-revoke and signs
  Then the hosted app calls `namespace::revoke_capability<ReadWrite>`.

### Notes

- Automated tests use injected helper dependencies and do not mutate chain.

## Story 2: Non-owner Cannot Initiate Hosted Revoke

As a recipient page viewer,
I want the revoke action to reflect the on-chain owner,
so that I do not try to sign an impossible transaction.

### Acceptance Criteria

- If no wallet is connected, the action is disabled.
- If the connected wallet differs from the address owner, the action is
  disabled.
- If the capability is not address-owned, the action is disabled.

### Scenarios

- Given a viewer connects a different address
  When the page compares ownership
  Then the revoke action remains disabled and owner metadata is shown.

### Notes

- The contract would reject non-owner object consumption anyway; the UI should
  avoid a known-bad wallet prompt.

## Story 3: Admin Safety

As an Admin-cap holder,
I want an explicit safety acknowledgement before revoking,
so that I do not accidentally remove namespace administration access.

### Acceptance Criteria

- Admin-cap pages show an acknowledgement control.
- The revoke action stays disabled until the acknowledgement is checked.
- The existing CLI command still includes `--allow-admin`.

### Scenarios

- Given an Admin capability page
  When the connected holder has not acknowledged the risk
  Then hosted self-revoke is disabled.

### Notes

- This does not add owner-driven revoke.

## Open Questions

- None for this implementation slice.
