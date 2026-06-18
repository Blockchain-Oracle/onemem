# Verification Audit: Contract Migration Hardening

## Verdict

Pass.

The migration script now has explicit dry-run support, live-upgrade preflight,
active Sui env restoration, defensive parsing, manifest updates, Published.toml
updates, generated address refresh, and structure coverage. Live chain upgrade
execution was intentionally out of scope for this slice.

## Artifacts Checked

- `.thoughts/research/2026-06-18-contract-migration-hardening.md`
- `.thoughts/specs/2026-06-18-contract-migration-hardening.md`
- `.thoughts/stories/2026-06-18-contract-migration-hardening.md`
- `.thoughts/plans/2026-06-18-contract-migration-hardening.md`
- `scripts/migrate-contract.sh`
- `tests/structure/deploy-scripts.test.ts`
- `packages/sdk-python/onemem/generated/addresses.py`

## Requirement Traceability

- Supported network validation: `scripts/migrate-contract.sh` accepts
  `testnet`, `mainnet`, and `devnet`; unknown arguments print usage and exit 2.
- Dry-run-only mode: `--dry-run` sets `DRY_RUN_ONLY=1`, runs the dry-run helper,
  prints that no repo files were updated, and exits before manifest writes.
- Live preflight: live mode runs `run_upgrade dry-run` before
  `run_upgrade live`.
- Active env restoration: the script captures `sui client active-env` and uses
  `trap restore_env EXIT`.
- Defensive parsing: package ID and tx digest are extracted through helpers and
  missing values fail with the full Sui JSON output.
- `config/networks.json` update: live success updates package ID, tx digest,
  deployed timestamp, and active network.
- `Published.toml` update: live success updates the target published table,
  preserves `original-id`, increments version, refreshes toolchain version, and
  records the UpgradeCap.
- Codegen refresh: live success runs TypeScript and Python address generators.
- Structure coverage: `tests/structure/deploy-scripts.test.ts` verifies the
  release guardrails in a dedicated 86-line shard.

## Acceptance Criteria Coverage

- `bash -n scripts/migrate-contract.sh`: pass.
- `bash scripts/migrate-contract.sh --help`: pass; prints current usage.
- `mise exec -- pnpm exec tsx scripts/codegen-move-types.ts`: pass.
- `mise exec -- uv run python scripts/codegen-move-python.py`: pass.
- `mise exec -- pnpm test:structure`: pass, 407 tests.
- Structure shard size: pass; new shard is 86 lines.
- Full repo gates: pass, listed below.

## Quality Gates

- `bash -n scripts/migrate-contract.sh`: pass.
- `mise exec -- pnpm exec biome check --write tests/structure/deploy-scripts.test.ts`: pass; formatted new shard.
- `mise exec -- pnpm lint`: pass; existing Biome schema-version info only.
- `mise exec -- pnpm typecheck`: pass, 15 Turbo tasks.
- `mise exec -- pnpm build`: pass, 13 Turbo tasks.
- `sui move test`: pass, 40/40 Move tests.
- `mise exec -- pnpm exec turbo run test --force`: pass, 16 Turbo tasks.
- `mise exec -- pnpm test:structure`: pass, 407 tests.
- `mise exec -- pnpm test:demo-matrix`: pass, 17 Turbo tasks.
- `mise exec -- uv run pytest packages/sdk-python`: pass, 12 passed, 1 skipped.
- `git diff --check`: pass.

## Deviations From Plan

- The Python generated address file changed during the planned codegen check.
  The change is deterministic output from the current generator and is included
  because the hardened migration script now invokes that generator after live
  upgrades.

## Gaps And Risks

- No live `sui client upgrade` was executed.
- No network dry-run was executed in this slice. Earlier upgrade probing showed
  local Sui CLI `1.72.2-homebrew` is behind current testnet protocol, so live
  upgrade proof still requires updating the Sui CLI first.

## Follow-ups

- Upgrade local Sui CLI, then run
  `bash scripts/migrate-contract.sh testnet --dry-run`.
- If dry-run passes, run the live upgrade only when release timing is approved
  and the UpgradeCap holder is ready.

## Evidence Log

- Context7 `/mystenlabs/sui` docs confirm `sui client upgrade` is the canonical
  package upgrade command and uses the package UpgradeCap.
- Local `sui client upgrade --help` confirms `--dry-run`, `--json`,
  `--upgrade-capability`, and `--gas-budget` flags.
- `tests/structure/deploy-scripts.test.ts` locks the script guardrails without
  adding to the near-limit `root.test.ts` shard.
