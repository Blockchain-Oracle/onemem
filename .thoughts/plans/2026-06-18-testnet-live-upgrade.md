# Plan: Testnet Live Upgrade

## Inputs

- Research: `.thoughts/research/2026-06-18-testnet-live-upgrade.md`
- Spec: `.thoughts/specs/2026-06-18-testnet-live-upgrade.md`
- Stories: `.thoughts/stories/2026-06-18-testnet-live-upgrade.md`
- Dry-run verification:
  `.thoughts/verification/2026-06-18-testnet-upgrade-dry-run-proof.md`

## Assumptions

- The active testnet address owns the recorded UpgradeCap.
- The active testnet address has enough gas for package upgrade.
- `PATH="/Users/abu/.local/bin:$PATH" mise exec -- ...` can expose the suiup
  Sui binary plus repo pnpm/uv tooling.

## Open Questions

- None blocking.

## Phase 1: Environment Confirmation

### Goal

Confirm the live command environment resolves the right `sui`, `pnpm`, and `uv`.

### Work

- Print `command -v sui`, `sui --version`, `command -v pnpm`, and `command -v uv`
  inside the exact command wrapper.

### Checks

- `sui` path begins with `/Users/abu/.local/bin`.
- `sui --version` reports `1.73.1`.

### Acceptance Criteria Covered

- Spec requirement 1.

### Stop Condition

Tooling paths are confirmed.

## Phase 2: Live Upgrade

### Goal

Run the testnet upgrade through the hardened migration script.

### Work

- Run `PATH="/Users/abu/.local/bin:$PATH" mise exec -- bash scripts/migrate-contract.sh testnet`.
- Capture package ID and tx digest.
- Inspect changed manifests and generated address files.

### Checks

- Command exits successfully.
- New package ID differs from previous package ID.

### Acceptance Criteria Covered

- Spec requirements 2-4.

### Stop Condition

Live upgrade is published and local files are updated.

## Phase 3: Verification And Commit

### Goal

Verify the upgraded package state and land the manifest update.

### Work

- Run local gates.
- Run post-upgrade verification script where feasible.
- Write verification audit.
- Commit, push, and watch CI/Release.

### Checks

- `bash scripts/verify-mainnet.sh testnet`
- `mise exec -- pnpm lint`
- `mise exec -- pnpm typecheck`
- `mise exec -- pnpm build`
- `mise exec -- pnpm test:structure`
- `sui move test`
- `mise exec -- uv run ruff check .`
- GitHub CI/Release.

### Acceptance Criteria Covered

- Spec requirement 5.

### Stop Condition

Commit is pushed and CI/Release are green.

## Verification Checkpoint

Create `.thoughts/verification/2026-06-18-testnet-live-upgrade.md`.

## Handoff Notes

If the live upgrade fails after publishing but before local codegen, rerun
codegen manually and reconcile manifests before doing any other work.
