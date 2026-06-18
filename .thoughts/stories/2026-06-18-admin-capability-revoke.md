# Stories: Admin Capability Revoke

## Traceability

- Spec: `.thoughts/specs/2026-06-18-admin-capability-revoke.md`
- Requirements: R1-R10
- Acceptance Criteria: AC1-AC6

## Story 1: Admin Revokes Shared Write Access

As a namespace admin,
I want to revoke a shared ReadWrite cap by ID,
so that the recipient can no longer write or mutate traces in my namespace.

### Acceptance Criteria

- Covers R1-R5, R7-R8, AC1-AC4.
- Revoked cap object may still be owned by the recipient.
- Any later trace write path using that cap aborts.

### Scenarios

- Given Alice owns a namespace and Bob owns a ReadWrite cap, when Alice admin
  revokes Bob's cap ID, then Bob's cap is marked revoked on-chain.
- Given Bob still owns the cap object, when Bob tries to open or mutate a trace,
  then the transaction aborts with the namespace revoked-cap error.

### Notes

- This is not holder self-revoke and does not delete Bob's object.

## Story 2: Admin Revokes Decrypt Access

As a namespace admin,
I want revoked ReadOnly caps to stop approving Seal decrypt,
so that read shares can be withdrawn without relying on off-chain UI state.

### Acceptance Criteria

- Covers R4, R6, AC1.
- Seal approval fails because the namespace authorization gate sees the cap ID
  marker.

### Scenarios

- Given Carol owns a ReadOnly cap, when Alice admin revokes Carol's cap ID, then
  `seal_approve` rejects Carol's cap for that namespace.

### Notes

- Existing wrong-namespace and inactive-namespace abort behavior stays intact.

## Story 3: Operator Uses Public Tooling

As an operator,
I want admin revoke in SDK, CLI, and MCP,
so that humans and agents can use the same enforceable protocol path.

### Acceptance Criteria

- Covers R7-R10, AC2-AC5.
- CLI output describes the scope as admin revoke, not holder burn.
- Admin-cap revoke requires an explicit override.

### Scenarios

- Given I have a namespace ID, Admin cap ID, and target cap ID, when I run
  `onemem namespace admin-revoke`, then the CLI submits the Admin-gated revoke
  transaction.
- Given I target an Admin cap without override, then the CLI refuses before
  submitting the transaction.
- Given an MCP runtime has signer credentials and Admin cap ID, when it calls
  the revoke tool, then the server calls the same SDK method.

### Notes

- Live mutation proof is deferred unless a disposable target cap is available.

## Open Questions

- Hosted dashboard UI for admin revoke remains a follow-up candidate.
