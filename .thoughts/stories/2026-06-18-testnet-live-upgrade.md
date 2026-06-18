# Stories: Testnet Live Upgrade

## Traceability

- Spec requirements 1-2: use proven testnet Sui binary and mutate only testnet.
- Spec requirements 3-4: update package manifests and generated addresses.
- Spec requirement 5: verify local and remote gates.

## Story 1: Release Operator Upgrades Testnet Package

As a release operator,
I want to run the live package upgrade on testnet,
so that the on-chain package matches the current source.

### Acceptance Criteria

- The script prints the `suiup` testnet binary path/version.
- The script exits successfully.
- The new package ID is parsed and recorded.
- The transaction digest is parsed and recorded.

### Scenarios

- Given the active address owns the UpgradeCap and has gas, when the live
  migration script runs for `testnet`, then Sui publishes a new package version
  and the script updates local manifests.

### Notes

- Mainnet is excluded.

## Story 2: SDK Consumer Gets New Package Address

As an SDK consumer,
I want generated address files to point to the upgraded package,
so that client calls target the current testnet deployment.

### Acceptance Criteria

- TypeScript generated addresses include the new package ID.
- Python generated addresses include the new package ID.
- `config/networks.json` and generated artifacts agree.

### Scenarios

- Given the live upgrade succeeds, when codegen runs, then SDK address helpers
  resolve the new testnet package ID.

### Notes

- Registry and capability IDs should stay stable.

## Open Questions

- None for the live testnet package-upgrade slice.
