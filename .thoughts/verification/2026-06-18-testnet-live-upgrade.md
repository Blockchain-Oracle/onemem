# Verification Audit: Testnet Live Upgrade

## Verdict

Pass.

The live testnet package upgrade was executed, the manifests and generated SDK
addresses now point at the upgraded package, and the upgraded package was
verified read-only against Sui testnet.

## Artifacts Checked

- `.thoughts/research/2026-06-18-testnet-live-upgrade.md`
- `.thoughts/specs/2026-06-18-testnet-live-upgrade.md`
- `.thoughts/stories/2026-06-18-testnet-live-upgrade.md`
- `.thoughts/plans/2026-06-18-testnet-live-upgrade.md`
- `.thoughts/verification/2026-06-18-testnet-upgrade-dry-run-proof.md`
- `config/networks.json`
- `contracts/onemem/Published.toml`
- `packages/sdk-ts/src/generated/addresses.ts`
- `packages/sdk-python/onemem/generated/addresses.py`
- `scripts/migrate-contract.sh`
- `scripts/verify-mainnet.sh`
- `tests/structure/deploy-scripts.test.ts`
- `docs/05-our-architecture/01-protocol/upgrade-strategy.md`

## Requirement Traceability

- Requirement 1: Use the `suiup` testnet binary that passed dry-run.
  - Evidence: live wrapper resolved `sui` to `/Users/abu/.local/bin/sui`.
  - Evidence: `sui --version` reported `sui 1.73.1-ff1fe0ec4551`.
- Requirement 2: Run the live upgrade only for `testnet`.
  - Evidence: command executed `bash scripts/migrate-contract.sh testnet`.
  - Evidence: `config/networks.json` changed only `.networks.testnet`.
- Requirement 3: Preserve registry and UpgradeCap IDs.
  - Evidence: `registry_id`, `registry_admin_cap_id`, and `upgrade_cap_id`
    remain unchanged in `config/networks.json`.
- Requirement 4: Commit new package ID, tx digest, `Published.toml`, and
  generated address artifacts.
  - Evidence: testnet package ID now
    `0xc2e839c719e1c61222440f5661199e68de5413d8cfb49dd8bae3223e92fcf138`.
  - Evidence: tx digest now
    `6aARmWJadHzwCf6iF3PooZKVSypHTL7jREsWUZEwqrhP`.
  - Evidence: TypeScript and Python generated address files match
    `config/networks.json`.
- Requirement 5: Verify local gates and GitHub CI after push.
  - Evidence: local gates passed; remote CI is pending until the commit is
    pushed.

## Acceptance Criteria Coverage

- Live migration script exits successfully.
  - Passed. The live command completed and printed the new package ID and tx
    digest.
- New package ID differs from old package ID.
  - Passed. Previous:
    `0x64c14fc069fe3d3584b8474b4e9b58beb55373767edecedf6e4c53732d4ceafc`.
    Current:
    `0xc2e839c719e1c61222440f5661199e68de5413d8cfb49dd8bae3223e92fcf138`.
- `config/networks.json` and generated address artifacts reference the new
  package ID.
  - Passed.
- `Published.toml` increments the testnet package version.
  - Passed after correction. On-chain package object reports
    `content.Package.version = 2`; local `Published.toml` now says
    `version = 2`.
- Local verification gates pass.
  - Passed.
- GitHub CI and Release pass.
  - Pending until push.

## Quality Gates

- `bash -n scripts/migrate-contract.sh && bash -n scripts/verify-mainnet.sh`
  - Passed.
- `env PATH="$LIVE_UPGRADE_PATH" bash scripts/verify-mainnet.sh testnet`
  - Passed.
  - Verified package:
    `0xc2e839c719e1c61222440f5661199e68de5413d8cfb49dd8bae3223e92fcf138`.
  - Verified registry:
    `0x3c78a19edad83c6e7d62b4ccd2941531b7b0551f499b961e89ca8355c7ae16e0`.
  - Verified registry type origin package:
    `0x64c14fc069fe3d3584b8474b4e9b58beb55373767edecedf6e4c53732d4ceafc`.
  - Verified registry version dynamic field: `1`.
- `mise exec -- pnpm lint`
  - Passed.
  - Non-blocking Biome schema version info reported.
- `mise exec -- pnpm typecheck`
  - Passed.
- `mise exec -- pnpm build`
  - Passed.
  - Non-blocking Next.js `experimental.typedRoutes` warning reported.
  - Non-blocking Turbo missing-output warnings reported for tsc-only demos.
- `mise exec -- pnpm test:structure`
  - Passed, 409 tests.
- `mise exec -- uv run ruff check .`
  - Passed.
- `mise exec -- uv run pyright`
  - Passed, 0 errors.
  - Non-blocking pyright newer-version warning reported.
- `mise exec -- uv run pytest packages/sdk-python`
  - Passed, 12 passed and 1 skipped.
- `PATH="/Users/abu/.local/bin:$PATH" sui move test`
  - Passed, 40 tests.
- `PATH="/Users/abu/.local/bin:$PATH" sui client object <new-package> --json`
  - Passed.
  - Evidence: `package_version=2`.
  - Evidence: `prevTx=6aARmWJadHzwCf6iF3PooZKVSypHTL7jREsWUZEwqrhP`.

## Deviations From Plan

- The plan expected `verify-mainnet.sh testnet` to work as-is. It failed by
  inspection before execution because the script expected registry object type
  package ID to equal the latest package ID. After an upgrade, long-lived shared
  objects keep their original type package. The verifier now checks the
  `::registry::OneMemRegistry` suffix and reports the origin package.
- The live upgrade left `Published.toml` at `version = 3` because Sui CLI
  appears to have already advanced the file before the migration script's Python
  updater added another increment. On-chain package inspection proved the real
  package version is `2`. The manifest was corrected and the migration script
  now captures the pre-upgrade version before invoking live `sui client upgrade`.
- The exact live command used an explicit `LIVE_UPGRADE_PATH` instead of
  wrapping the script with `mise exec`, because the script itself needs `sui`,
  `pnpm`, and `uv` simultaneously and the `suiup` binary must stay first.

## Gaps And Risks

- Remote CI and Release have not run for this commit yet.
- This is a package-level upgrade. There is still no object-schema migration
  loop because v0.1 has no v2 object schema.
- The registry dynamic field remains at object-schema version `1`, which is
  expected for this package-only upgrade.

## Follow-ups

- Push the commit and watch GitHub CI and Release.
- When a schema-breaking v0.2 change lands, extend `scripts/migrate-contract.sh`
  with per-object migration loops.

## Evidence Log

- Live package upgrade:
  - Previous package:
    `0x64c14fc069fe3d3584b8474b4e9b58beb55373767edecedf6e4c53732d4ceafc`
  - New package:
    `0xc2e839c719e1c61222440f5661199e68de5413d8cfb49dd8bae3223e92fcf138`
  - Tx digest: `6aARmWJadHzwCf6iF3PooZKVSypHTL7jREsWUZEwqrhP`
  - Deployed at: `2026-06-18T12:01:45Z`
- Read-only testnet verifier:
  - Package readable.
  - Registry readable.
  - Registry type suffix valid.
  - Registry version dynamic field present.
- On-chain package object:
  - `content.Package.version = 2`
  - `prevTx = 6aARmWJadHzwCf6iF3PooZKVSypHTL7jREsWUZEwqrhP`
