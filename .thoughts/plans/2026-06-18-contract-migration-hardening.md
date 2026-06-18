# Plan: Contract Migration Hardening

## Inputs

- Research: `.thoughts/research/2026-06-18-contract-migration-hardening.md`
- Spec: `.thoughts/specs/2026-06-18-contract-migration-hardening.md`
- Stories: `.thoughts/stories/2026-06-18-contract-migration-hardening.md`

## Phase 1: Script Safety

### Goal

Make `scripts/migrate-contract.sh` safe by default for upgrade rehearsals and
live releases.

### Work

- Add argument parsing for `NETWORK` and `--dry-run`.
- Validate supported networks.
- Check required commands before switching environments.
- Capture and restore the previous active Sui CLI environment.
- Extract common upgrade execution into a helper that can run dry-run or live
  mode.
- Fail defensively if live output has no package ID or digest.

### Checks

- `bash -n scripts/migrate-contract.sh`

## Phase 2: Manifest And Codegen Updates

### Goal

Keep repo-local deployment state synchronized after successful live upgrades.

### Work

- Update `config/networks.json` for package ID, digest, timestamp, and active
  network.
- Update `contracts/onemem/Published.toml` for `published-at`, incremented
  version, current toolchain version, and UpgradeCap.
- Preserve `original-id`.
- Regenerate TypeScript and Python address files.
- Print explicit verification and commit next steps.

### Checks

- `mise exec -- pnpm exec tsx scripts/codegen-move-types.ts`
- `mise exec -- uv run python scripts/codegen-move-python.py`

## Phase 3: Structural Guardrails

### Goal

Prevent future regression of the release guardrails.

### Work

- Add `tests/structure/deploy-scripts.test.ts`.
- Keep the new shard below 300 lines.
- Assert dry-run, env restoration, manifest update, Published.toml update,
  codegen calls, and defensive parsing are present.

### Checks

- `mise exec -- pnpm test:structure`

## Phase 4: Full Verification

### Goal

Prove the change does not degrade the repo and record the honest live-upgrade
boundary.

### Work

- Run repo gates.
- Write verification audit.
- Commit and push.
- Watch GitHub CI.

### Checks

- `mise exec -- pnpm lint`
- `mise exec -- pnpm typecheck`
- `mise exec -- pnpm build`
- `mise exec -- pnpm exec turbo run test --force`
- `mise exec -- pnpm test:structure`
- `git diff --check`

## Stop Condition

Script hardening is committed and pushed, local gates pass, and CI result is
known.
