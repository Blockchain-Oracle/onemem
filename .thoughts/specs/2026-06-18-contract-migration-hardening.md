# Spec: Contract Migration Hardening

## Goal

Make the OneMem contract upgrade script safe enough for release operations by
adding explicit preflight, defensive parsing, manifest updates, generated
address refresh, and active-env cleanup.

## In Scope

- Harden `scripts/migrate-contract.sh`.
- Add structure coverage for deployment-script expectations.
- Keep changes compatible with the current `config/networks.schema.json`.
- Do not perform a live Sui upgrade in this slice.

## Out Of Scope

- Adding a new upgrade history schema.
- Publishing or upgrading the package on testnet or mainnet.
- Adding per-object `migrate_*_v<N>` loops before a schema-breaking migration
  exists.
- Changing `deploy-contract.sh` behavior except as context for parity.

## Requirements

1. The script must accept `testnet`, `mainnet`, or `devnet` and reject unknown
   networks.
2. The script must support a dry-run-only mode via `--dry-run`.
3. A live upgrade must run an explicit `sui client upgrade --dry-run --json`
   preflight before executing the real upgrade.
4. The script must restore the previously active Sui CLI environment after
   completion or failure when one existed.
5. The script must fail if the upgrade output does not include a new package ID
   or transaction digest.
6. After a successful live upgrade, the script must update
   `config/networks.json` for the target network.
7. After a successful live upgrade, the script must update
   `contracts/onemem/Published.toml` for the target network.
8. After manifest updates, the script must regenerate TypeScript and Python
   address artifacts.
9. Dry-run-only mode must not update repo files.
10. Structure tests must enforce the critical script behaviors without bloating
    the existing near-limit structure shards.

## Acceptance Criteria

- `bash -n scripts/migrate-contract.sh` passes.
- `mise exec -- pnpm test:structure` passes.
- Structure coverage verifies dry-run support, active-env restoration,
  manifest updates, codegen calls, and defensive parse checks.
- Full repo quality gates pass.
- Verification audit records that live upgrade execution was intentionally not
  performed in this slice.
