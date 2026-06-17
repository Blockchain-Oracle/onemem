# Stories: Event-backed Share History

## Traceability

- Research:
  `.thoughts/research/2026-06-17-event-backed-share-history.md`
- Spec:
  `.thoughts/specs/2026-06-17-event-backed-share-history.md`

## Story 1: Owner Reviews Capability History

As a hosted namespace owner,
I want `/share` to list capability grants from Sui events,
so that I can review access without relying on local browser state.

### Acceptance Criteria

- The history panel loads for a valid namespace ID.
- Each row shows capability id, recipient, kind, status, and transaction
  evidence when available.
- Admin cap creation is labeled as Admin instead of treated as a normal
  ReadOnly/ReadWrite share.

### Scenarios

- Given a namespace with mint events, when I open hosted `/share`, then the
  history panel shows event-backed rows.

## Story 2: Revoked Rows Stay Visible

As an operator,
I want revoked capabilities to remain visible as revoked rows,
so that history does not erase past grants.

### Acceptance Criteria

- A revoked capability row remains in history.
- The row status is `revoked`.
- Revoke transaction and timestamp are displayed when event metadata exists.

### Scenarios

- Given a cap id appears in both minted and revoked events, when history is
  built, then the row is inactive and includes revoke evidence.

## Story 3: Safe Empty And Error States

As a hosted user without a namespace configured,
I want `/share` to tell me what is missing,
so that it does not query or render fake share history.

### Acceptance Criteria

- With no namespace ID, the panel asks for a namespace ID.
- With no events, the panel says no event-backed history was found.
- With an API error, the panel shows an explicit error.

### Scenarios

- Given no wallet and no manual namespace ID, when browser smoke opens `/share`,
  then it sees the history panel empty state and no console/resource errors.

## Story 4: Refresh After Share Mint

As an owner who just minted a capability,
I want the history panel to refresh,
so that the latest on-chain share appears after the transaction settles.

### Acceptance Criteria

- Successful hosted share execution increments a history refresh trigger.
- The panel fetches history again after the trigger changes.

### Notes

Automated smoke does not complete a wallet popup; unit tests and code path
coverage prove the refresh trigger while live wallet proof remains manual.

## Open Questions

- Whether local dashboard should consume the same history model in a later
  slice.
