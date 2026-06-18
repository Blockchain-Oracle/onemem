# Stories: Testnet Upgrade Dry-run Proof

## Traceability

- Spec requirement 1: script prints selected Sui binary path and version.
- Spec requirements 2-3: docs explain current testnet-channel `suiup` path.
- Spec requirement 4: verification records dry-run proof and no-mutation state.

## Story 1: Release Operator Rehearses Testnet Upgrade

As a release operator,
I want to run the contract migration script in dry-run mode against current
testnet,
so that I can prove package upgrade compatibility without mutating chain state.

### Acceptance Criteria

- The command uses a Sui CLI that supports current testnet protocol.
- The command exits successfully.
- The script reports no chain state changed and no repo files were updated.
- The repo remains clean afterward.

### Scenarios

- Given Homebrew stable lags testnet protocol, when the operator runs the
  dry-run with `/Users/abu/.local/bin` first in PATH, then the suiup testnet
  binary is used and the dry-run succeeds.

### Notes

- This story does not authorize or require a live upgrade.

## Story 2: Maintainer Diagnoses CLI Channel

As a maintainer,
I want the migration script to print the Sui binary path and version,
so that protocol-version failures identify the local CLI channel immediately.

### Acceptance Criteria

- The script prints `command -v sui`.
- The script prints `sui --version`.

### Scenarios

- Given a stale Homebrew binary is first in PATH, when the script runs, then the
  output shows the Homebrew binary and version before any upgrade attempt.

### Notes

- The script does not need to manage PATH itself.

## Open Questions

- Whether to make the docs refer to a generic `$HOME/.local/bin` path or the
  observed absolute path for this local Codex machine.
