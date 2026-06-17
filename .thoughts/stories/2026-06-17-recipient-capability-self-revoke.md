# Stories: Recipient Capability Self-Revoke

## Traceability

- R1, R2, R3: Story 1.
- R4: Story 2.
- R5: Story 3.

## Story 1: Recipient Gets A Concrete Self-Revoke Command

As a recipient,
I want the capability page to show the exact CLI command to self-revoke,
so that I can renounce access without guessing the protocol shape.

### Acceptance Criteria

- The page shows `onemem namespace revoke <cap-id>` for ReadOnly/ReadWrite.
- The page shows `--allow-admin` when the viewed capability is Admin.
- The copy says the command must be run by the capability holder.

### Scenarios

- Given a ReadOnly capability object loads
- When the recipient page renders
- Then the self-revoke section shows `onemem namespace revoke <cap-id>`.

## Story 2: Owner Sees No Fake Owner Revoke

As a namespace owner,
I want the page to state that owner-driven revoke is unsupported in v0.1,
so that I do not expect a hosted action that the contract cannot execute.

### Acceptance Criteria

- The page states owner-driven revocation is not supported by contract v0.1.
- The page keeps the existing no-claim boundary.

### Scenarios

- Given any valid capability page
- When the boundary section renders
- Then it distinguishes holder self-revoke from owner-driven revoke.

## Story 3: Maintainer Has A Stable Command Helper

As a maintainer,
I want command generation covered by unit tests,
so that future UI edits do not drop the Admin safety flag.

### Acceptance Criteria

- Unit tests cover ReadOnly, ReadWrite, and Admin command generation.

### Notes

- This story does not require a live Sui transaction because the feature is
  guidance over an already implemented CLI/contract path.

## Open Questions

- None blocking.
