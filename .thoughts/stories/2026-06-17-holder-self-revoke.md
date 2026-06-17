# Stories: Holder Self-Revoke

Date: 2026-06-17

## Story 1: Capability Holder Renounces Access

As a capability holder,
I want to revoke a capability I own,
so that I can stop retaining access to a namespace.

Acceptance:

- Given I hold a ReadOnly or ReadWrite cap, when I run
  `onemem namespace revoke <cap-id>`, then the CLI sends the holder self-revoke
  transaction.
- Given the transaction succeeds, then the CLI prints the cap id, kind, network,
  and transaction digest.
- Given I do not own the cap, then the Sui transaction fails rather than the UI
  pretending revocation happened.

## Story 2: Admin Cap Safety

As an operator,
I want the CLI to protect Admin caps from accidental burn,
so that I do not lose namespace administration by mistake.

Acceptance:

- Given the cap type is Admin, when I run `namespace revoke <cap-id>` without an
  override, then the CLI refuses.
- Given I pass `--allow-admin`, then the CLI allows the self-revoke transaction
  to be built and submitted.

## Story 3: Honest Dashboard Guidance

As a user reading `/share`,
I want to know the real v0.1 revoke path,
so that I can revoke my own cap without expecting owner-driven revoke.

Acceptance:

- `/share` shows `onemem namespace revoke <capability-id>`.
- `/share` keeps the message that owner-driven admin revoke is not supported in
  the current contract.
- `/share` does not render a fake revoke button.
