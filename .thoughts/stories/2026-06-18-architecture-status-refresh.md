# Stories: Architecture Status Refresh

## Traceability

- Story 1 covers spec requirements 1, 2, and 6.
- Story 2 covers spec requirements 3, 4, and 6.
- Story 3 covers spec requirement 5.

## Story 1: Developer Sees Current Protocol Status

As a developer,
I want the protocol README status table to reflect built and deployed protocol
components,
so that I do not plan work from stale `pending` rows.

### Acceptance Criteria

- Built Move components are not marked `⏳ pending`.
- Testnet deployment is named with the current package ID or version.
- Mainnet remains explicitly pending.

### Scenarios

- Given a developer opens the protocol README, when they read the status table,
  then they can identify what is built, what is testnet-proven, and what still
  needs mainnet evidence.

### Notes

- This is a documentation/status correction only.

## Story 2: Release Operator Sees Current SDK Status

As a release operator,
I want the SDK README status table to distinguish source readiness from registry
publication,
so that I do not claim unpublished packages are installable.

### Acceptance Criteria

- TypeScript SDK rows show source built and npm current at `0.6.0`.
- Python SDK rows show repo-local source at `0.2.0`.
- Python PyPI publication remains explicitly missing.
- Python write parity remains scoped honestly.

### Scenarios

- Given a release operator opens the SDK README, when they compare rows against
  `pnpm registry:status`, then the README and registry state agree.

### Notes

- This story does not publish any package.

## Story 3: Structure Tests Catch Stale Core Status

As a future agent,
I want structure tests to reject stale all-pending core status rows,
so that docs do not regress after future edits.

### Acceptance Criteria

- `pnpm test:structure` includes assertions for protocol README status rows.
- `pnpm test:structure` includes assertions for SDK README status rows.
- The assertions allow real pending rows such as mainnet/PyPI gaps.

### Scenarios

- Given someone changes built protocol or TS SDK rows back to `⏳ pending`, when
  structure tests run, then the test fails with a targeted message.

### Notes

- The guard should be narrow and should not require every historical table in
  the architecture folder to be current.

## Open Questions

- None.
