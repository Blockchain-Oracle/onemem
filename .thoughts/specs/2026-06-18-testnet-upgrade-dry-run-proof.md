# Spec: Testnet Upgrade Dry-run Proof

## Objective

Make the contract upgrade rehearsal path reproducible for current Sui testnet
by documenting and surfacing the Sui CLI channel/version needed to run the
hardened migration script in non-mutating dry-run mode.

## Background And Current Reality

The migration script now supports `--dry-run`, but the first testnet attempt
failed with Homebrew Sui `1.73.0-homebrew` because current testnet protocol is
ahead of Homebrew stable. The `suiup` testnet-channel binary `v1.73.1` succeeds.

## Users

- OneMem release operator.
- Future coding agent running a package-upgrade rehearsal.
- Maintainer reviewing whether the contract source can upgrade against testnet.

## Goals

- Preserve a repeatable command for testnet upgrade dry-run proof.
- Make script output reveal which `sui` binary/version is being used.
- Document the fallback when Homebrew stable lags current testnet protocol.
- Keep dry-run proof non-mutating.

## Non-goals

- Do not execute a live upgrade.
- Do not change checked-in package IDs.
- Do not require every developer to use suiup when their existing `sui` binary
  is already protocol-compatible.

## Requirements

1. The migration script must print the selected `sui` binary path and version.
2. Upgrade strategy docs must explain the current testnet-channel `suiup` path.
3. The documented dry-run command must put `/Users/abu/.local/bin` first in
   PATH when using suiup locally.
4. The verification record must include the successful dry-run command and the
   no-mutation evidence.

## Acceptance Criteria

- `PATH="/Users/abu/.local/bin:$PATH" bash scripts/migrate-contract.sh testnet --dry-run` passes.
- `git status --short --branch` is clean after the dry-run.
- `bash -n scripts/migrate-contract.sh` passes.
- Structure, lint, and relevant Python/Move gates pass after documentation and
  script-output changes.

## Constraints

- The active env and keystore are local machine state; do not commit secrets or
  private key material.
- Testnet protocol can move faster than Homebrew stable.

## Stories Needed

- Release operator rehearses a package upgrade without mutating chain state.
- Maintainer diagnoses a stale Sui CLI from script output.

## Open Questions

- Whether the next slice should execute the live testnet upgrade now that
  dry-run is proven.

## Source References

- `.thoughts/research/2026-06-18-testnet-upgrade-dry-run-proof.md`
- `scripts/migrate-contract.sh`
- `docs/05-our-architecture/01-protocol/upgrade-strategy.md`
