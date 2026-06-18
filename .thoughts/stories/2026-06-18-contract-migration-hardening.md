# Stories: Contract Migration Hardening

## Story 1: Release Operator Rehearses Upgrade

As a release operator, I want to run the upgrade path in dry-run mode so that I
can confirm package compatibility and gas behavior without mutating chain or
repo state.

Acceptance criteria:

- Running `bash scripts/migrate-contract.sh testnet --dry-run` invokes
  `sui client upgrade --dry-run --json`.
- The command prints that no files were changed.
- The command exits before manifest or codegen updates.

## Story 2: Release Operator Runs Live Upgrade

As a release operator, I want the live upgrade command to preflight first and
only update local manifests after a successful on-chain upgrade.

Acceptance criteria:

- Live mode runs an explicit dry-run before the live upgrade command.
- Empty package ID or transaction digest parsing causes a hard failure.
- `config/networks.json` receives the new package ID, digest, timestamp, and
  active network.
- `Published.toml` receives the new `published-at`, incremented version, and
  current toolchain version while preserving `original-id`.

## Story 3: SDK Consumer Avoids Stale Addresses

As an SDK consumer, I want generated address files to refresh during upgrade
bookkeeping so TypeScript and Python clients do not keep pointing at the old
package after a successful upgrade.

Acceptance criteria:

- The script runs `scripts/codegen-move-types.ts`.
- The script runs `scripts/codegen-move-python.py`.
- The script prints verification and commit next steps.

## Story 4: Agent Maintainer Prevents Structural Drift

As a maintainer, I want deployment-script expectations covered by structure
tests in their own shard so future cleanup does not silently remove release
guardrails or violate the line-count convention.

Acceptance criteria:

- A dedicated structure test shard covers migration-script release guardrails.
- Existing structure shards stay below the 300-line target.
