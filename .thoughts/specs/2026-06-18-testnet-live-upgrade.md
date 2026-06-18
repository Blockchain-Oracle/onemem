# Spec: Testnet Live Upgrade

## Objective

Run the first live Sui testnet package upgrade using the hardened migration
script, then commit the new package manifest and generated address state.

## Background And Current Reality

The dry-run path is proven with the `suiup` testnet binary. The source now
contains upgrade-compatible trace close functions and a hardened migration
script.

## Users

- OneMem release operator.
- SDK and dashboard consumers using `config/networks.json` and generated
  address artifacts.

## Goals

- Execute `sui client upgrade` on testnet through `scripts/migrate-contract.sh`.
- Update `config/networks.json` with the new testnet package ID and tx digest.
- Update `contracts/onemem/Published.toml`.
- Regenerate TypeScript and Python address artifacts.
- Verify the new package path with local gates and the repo verify script where
  feasible.

## Non-goals

- Do not mutate mainnet.
- Do not add object-schema migration loops.
- Do not change registry or capability object IDs unless Sui output requires it.

## Requirements

1. Use the `suiup` testnet binary that passed dry-run.
2. Run the live upgrade only for `testnet`.
3. Preserve registry and UpgradeCap IDs in `config/networks.json`.
4. Commit the new package ID, tx digest, Published.toml metadata, and generated
   address artifacts.
5. Verify local quality gates and GitHub CI after push.

## Acceptance Criteria

- Live migration script exits successfully.
- New package ID differs from the old testnet package ID.
- `config/networks.json` and generated address artifacts reference the new
  package ID.
- `Published.toml` increments the testnet package version.
- Local verification gates pass.
- GitHub CI and Release pass.

## Constraints

- The command consumes testnet gas and mutates Sui testnet state.
- Private keys must not be printed or committed.

## Stories Needed

- Release operator upgrades the testnet package.
- SDK consumer resolves the new package ID after codegen.

## Open Questions

- Whether post-upgrade smoke verification needs a fresh namespace/session or
  read-only package inspection is enough for this slice.

## Source References

- `.thoughts/research/2026-06-18-testnet-live-upgrade.md`
- `.thoughts/verification/2026-06-18-testnet-upgrade-dry-run-proof.md`
