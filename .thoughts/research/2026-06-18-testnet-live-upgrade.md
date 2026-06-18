# Reality Research: Testnet Live Upgrade

## Scope

Establish whether OneMem is ready for a live testnet package upgrade after the
successful non-mutating dry-run proof.

## Sources Checked

- `.thoughts/verification/2026-06-18-testnet-upgrade-dry-run-proof.md`
- `scripts/migrate-contract.sh`
- `config/networks.json`
- `contracts/onemem/Published.toml`
- `docs/05-our-architecture/01-protocol/upgrade-strategy.md`
- Local commands:
  - `/Users/abu/.local/bin/sui --version`
  - `PATH="/Users/abu/.local/bin:$PATH" bash scripts/migrate-contract.sh testnet --dry-run`
  - `git status --short --branch`

## Verified Facts

- Dry-run passed against Sui testnet with `/Users/abu/.local/bin/sui`
  reporting `sui 1.73.1-ff1fe0ec4551`.
- The dry-run compiled the current `onemem` Move package and exited before
  manifest/codegen updates.
- Current checked-in testnet package ID:
  `0x64c14fc069fe3d3584b8474b4e9b58beb55373767edecedf6e4c53732d4ceafc`.
- Current checked-in testnet UpgradeCap:
  `0x2834843d375d7c74d2eba35b8a1919dcd686c11e62e0993fa39577f1bb8151a9`.
- The migration script updates `config/networks.json`, `Published.toml`, and
  generated TS/Python address files after successful live upgrade.

## Inferences

- A live testnet upgrade is now operationally ready if the active address owns
  the UpgradeCap and has gas.
- The command should run under a PATH that prefers the `suiup` testnet binary
  while still exposing `pnpm` and `uv` for post-upgrade codegen.

## Unknowns And Questions

- Whether the active address still owns the UpgradeCap at execution time.
- Whether the active address has enough testnet gas.

## Not Included

- No mainnet mutation.
- No object-schema migration; no v2 object schema exists.
