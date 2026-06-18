# Reality Research: Testnet Upgrade Dry-run Proof

## Scope

Check whether the hardened contract migration script can run a real Sui testnet
upgrade dry-run, and identify the current toolchain requirement for that proof.

## Sources Checked

- `scripts/migrate-contract.sh`
- `config/networks.json`
- `docs/05-our-architecture/01-protocol/upgrade-strategy.md`
- `docs/05-our-architecture/01-protocol/MAINNET_DEPLOY.md`
- Context7 docs for `/mystenlabs/sui`
- Local commands:
  - `sui --version`
  - `sui client active-env`
  - `brew info sui --json=v2`
  - `brew upgrade sui`
  - `/Users/abu/.local/bin/suiup install sui@testnet`
  - `PATH="/Users/abu/.local/bin:$PATH" bash scripts/migrate-contract.sh testnet --dry-run`

## Verified Facts

- The repo is clean at the start of this slice on branch `pillar-3-plugins`.
- The recorded active network is `testnet`.
- `config/networks.json` has a testnet package ID:
  `0x64c14fc069fe3d3584b8474b4e9b58beb55373767edecedf6e4c53732d4ceafc`.
- `config/networks.json` has a testnet UpgradeCap:
  `0x2834843d375d7c74d2eba35b8a1919dcd686c11e62e0993fa39577f1bb8151a9`.
- Context7 documents `sui client upgrade` as the package upgrade command and
  documents `suiup install sui@testnet` for testnet-channel CLI installs.
- Homebrew upgraded Sui from `1.72.2-homebrew` to `1.73.0-homebrew`.
- `sui 1.73.0-homebrew` still cannot run the current testnet upgrade dry-run:
  it supports protocol max 125 while testnet reports protocol 126.
- `suiup` installed `sui@testnet` version `v1.73.1`.
- `/Users/abu/.local/bin/sui --version` reports `sui 1.73.1-ff1fe0ec4551`.
- Running the hardened script with the suiup binary first in PATH succeeds:
  `PATH="/Users/abu/.local/bin:$PATH" bash scripts/migrate-contract.sh testnet --dry-run`.
- The successful dry-run prints:
  - current active address
  - current package ID
  - UpgradeCap ID
  - dependency/build progress
  - `No chain state changed.`
  - `No repo files were updated.`
- `git status --short --branch` remains clean after the successful dry-run.

## Inferences

- For current testnet protocol, operators need a testnet-channel Sui binary, not
  just the latest Homebrew stable binary.
- The hardened migration script works for the non-mutating upgrade proof when
  the Sui CLI supports the active network protocol.

## Unknowns And Questions

- Homebrew stable may catch up later; the exact protocol/version mismatch is
  time-sensitive.
- A live upgrade has not been executed in this slice.

## Not Included

- No live `sui client upgrade` mutation.
- No changes to on-chain package IDs.
- No per-object schema migration proof, because no v2 object schema exists yet.
