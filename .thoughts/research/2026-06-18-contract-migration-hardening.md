# Reality Research: Contract Migration Hardening

## Question

Is `scripts/migrate-contract.sh` safe enough to use after the trace close ABI
compatibility work, and what must change before relying on it for testnet or
mainnet upgrades?

## Sources Checked

- `scripts/migrate-contract.sh`
- `scripts/deploy-contract.sh`
- `scripts/codegen-move-types.ts`
- `scripts/codegen-move-python.py`
- `config/networks.json`
- `config/networks.schema.json`
- `contracts/onemem/Published.toml`
- `tests/structure/*.test.ts`
- Context7 docs for `/mystenlabs/sui`
- `sui client upgrade --help`

## Findings

The migration script is currently a thin live-upgrade wrapper. It switches the
active Sui CLI environment, runs `sui client upgrade`, parses the new package
ID and digest, then prints a reminder about future per-object migrations.

The script does not currently:

- Validate that the requested network is one of the supported repo networks.
- Restore the previous active Sui CLI environment after success or failure.
- Perform an explicit dry-run preflight before a live upgrade.
- Support a dry-run-only mode for release rehearsal.
- Check required tools before starting.
- Fail defensively when package ID or transaction digest parsing returns empty.
- Update `config/networks.json` after a successful upgrade.
- Update `contracts/onemem/Published.toml` after a successful upgrade.
- Regenerate TypeScript and Python address artifacts after manifest updates.

`deploy-contract.sh` already updates `config/networks.json`, but it is only for
initial publish. Upgrade must keep registry and capability IDs stable while
replacing the package ID, tx digest, deployed timestamp, and generated addresses.

`config/networks.schema.json` does not allow extra fields, so upgrade history
cannot be recorded there without a schema change. For this slice, the script
should update the current network block only.

`Published.toml` currently has a `published.testnet` table with:

- `published-at`: current package ID
- `original-id`: original package ID
- `version`: 1
- `toolchain-version`: `1.72.2`
- `upgrade-capability`: testnet UpgradeCap

After an upgrade, `published-at` should point to the new package ID, the
`original-id` should remain stable, and `version` should increment.

Context7 for `/mystenlabs/sui` confirms `sui client upgrade` is the canonical
upgrade command and requires the package `UpgradeCap`. The installed local Sui
CLI confirms `sui client upgrade` supports `--dry-run`, `--json`,
`--upgrade-capability`, and `--gas-budget`.

The structure tests are already close to the requested shard limit:

- `tests/structure/root.test.ts`: 298 lines
- `tests/structure/context-artifacts.test.ts`: 259 lines
- `tests/structure/docs-frameworks.test.ts`: 273 lines
- `tests/structure/protocol.test.ts`: 252 lines

New deployment-script assertions should live in a separate shard to avoid
pushing existing shards over the 300-line target.

## Decision

Harden `scripts/migrate-contract.sh` before attempting another live upgrade.
The script should make the safe path the default:

- `--dry-run` runs preflight only and mutates no repo files.
- Live mode first runs the same dry-run preflight.
- Live mode updates manifests and regenerated SDK address files only after a
  successful live upgrade.
- The script restores the previous active Sui CLI environment on exit.

## Open Constraints

Live dry-run against testnet is currently blocked on local Sui CLI protocol
skew: installed CLI is `1.72.2-homebrew`, while testnet requires a newer
protocol than that binary supports. This slice can still be verified with shell
syntax, static structure tests, codegen, and full repo gates.
