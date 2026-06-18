# Reality Research: Trace Close Upgrade Compatibility

## Scope

Audit whether the admin-revoke trace close changes are safe for a Sui package
upgrade from the published testnet package, and identify the smallest source,
SDK, and test changes needed before live migration.

## Sources Checked

- `contracts/onemem/sources/trace.move`
- `contracts/onemem/tests/trace_tests.move`
- `contracts/onemem/tests/admin_revoke_tests.move`
- `packages/sdk-ts/src/traces.ts`
- `packages/sdk-ts/tests/traces.unit.test.ts`
- `scripts/sdk-smoke-testnet.ts`
- `config/networks.json`
- `contracts/onemem/Published.toml`
- `scripts/migrate-contract.sh`
- Context7 docs for `/mystenlabs/sui`, query:
  `Sui package upgrade compatibility public entry function signature changes`
- `sui client upgrade --help`

## Verified Facts

- The published testnet package is still version 1 in `Published.toml`, with the
  same package/original ID recorded in `config/networks.json`.
- The admin-revoke slice changed existing public `trace::close_call` and
  `trace::close_session` signatures by adding a `&MemoryNamespace` argument.
- Current Sui docs say upgrades must keep existing public function signatures and
  struct layouts compatible; adding new functions is allowed.
- The Sui CLI supports `sui client upgrade --dry-run` for non-mutating upgrade
  validation.
- The TS SDK currently targets `trace::close_call` and `trace::close_session`
  with the new namespace argument shape.
- `scripts/sdk-smoke-testnet.ts` is stale: it calls `closeCall` and
  `endSession` without `namespaceId`, so it is not a reliable manual test for the
  current SDK.

## Inferences

- Leaving the changed public close signatures in place risks an upgrade
  compatibility failure even though local Move tests pass.
- Restoring the old public signatures while adding new namespace-aware functions
  is the safest additive upgrade shape.
- The restored old close functions must not keep working, because they cannot
  check namespace-level revoked-cap markers. They should fail loudly and push
  clients to the namespace-aware close functions.
- SDK and docs should target the new functions directly so fresh clients do not
  depend on deprecated close paths.

## Unknowns And Questions

- The exact dry-run result is unknown until the source is patched and
  `sui client upgrade --dry-run` is run against testnet.
- Live testnet upgrade sequencing is separate from this compatibility patch,
  because `scripts/migrate-contract.sh` does not yet update all recorded package
  metadata after a successful upgrade.

## Not Included

- No live upgrade transaction is submitted in this research phase.
- No public marketplace or package publishing is included in this slice.
