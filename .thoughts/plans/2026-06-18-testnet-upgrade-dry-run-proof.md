# Plan: Testnet Upgrade Dry-run Proof

## Inputs

- Research: `.thoughts/research/2026-06-18-testnet-upgrade-dry-run-proof.md`
- Spec: `.thoughts/specs/2026-06-18-testnet-upgrade-dry-run-proof.md`
- Stories: `.thoughts/stories/2026-06-18-testnet-upgrade-dry-run-proof.md`
- Current script: `scripts/migrate-contract.sh`
- Current docs: `docs/05-our-architecture/01-protocol/upgrade-strategy.md`

## Assumptions

- The successful dry-run with suiup `sui@testnet` is the right proof boundary
  before a live upgrade.
- Documentation should describe the durable pattern, not hard-code a claim that
  Homebrew will always lag testnet.

## Open Questions

- Live testnet upgrade timing remains a separate decision/slice.

## Phase 1: Script Visibility

### Goal

Make the script output show the exact Sui CLI path and version.

### Work

- Add `SUI_BIN="$(command -v sui)"`.
- Print `SUI_BIN` and `sui --version` before switching env and running dry-run.

### Checks

- `bash -n scripts/migrate-contract.sh`
- Dry-run command output includes Sui CLI path/version.

### Acceptance Criteria Covered

- Spec requirement 1.
- Story 2.

### Stop Condition

The script remains syntactically valid and dry-run output contains toolchain
identity.

## Phase 2: Documentation

### Goal

Document the current testnet-channel CLI path for upgrade rehearsals.

### Work

- Add an operational dry-run section to `upgrade-strategy.md`.
- Include the `suiup install sui@testnet` command.
- Include the PATH-prefixed dry-run command.
- Record that the dry-run is non-mutating and does not update repo files.

### Checks

- Documentation is concise and does not expose secrets.

### Acceptance Criteria Covered

- Spec requirements 2-3.
- Story 1.

### Stop Condition

The docs explain how to reproduce the successful dry-run when Homebrew stable
lags testnet.

## Phase 3: Verification

### Goal

Prove the updated script/docs match the observed dry-run behavior.

### Work

- Re-run dry-run with the suiup binary first in PATH.
- Run focused local gates.
- Write verification audit.
- Commit, push, and watch CI if repo files changed.

### Checks

- `PATH="/Users/abu/.local/bin:$PATH" bash scripts/migrate-contract.sh testnet --dry-run`
- `git status --short --branch`
- `mise exec -- pnpm lint`
- `mise exec -- pnpm test:structure`
- `sui move test`

### Acceptance Criteria Covered

- Spec requirement 4.
- Story 1.

### Stop Condition

Dry-run proof and local gates pass, files are committed and pushed, and CI is
green.

## Verification Checkpoint

Create `.thoughts/verification/2026-06-18-testnet-upgrade-dry-run-proof.md`
before finalizing.

## Handoff Notes

The next logical slice after this is a deliberate live testnet upgrade using
the proven suiup testnet binary and the hardened migration script.
