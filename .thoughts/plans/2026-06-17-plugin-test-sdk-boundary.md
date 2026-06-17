# Plan: Plugin Test SDK Boundary

## Inputs

- `main` CI run `27722929853` failed in `@onemem/codex-plugin#test`.
- Failing assertions called `setRuntimePaused` from `@onemem/sdk-ts/runtime`.
- The plugin package manifests intentionally depend on published `@onemem/sdk-ts@^0.6.0` so install metadata is usable outside the pnpm workspace.
- The current repository SDK source exports `setRuntimePaused` from `packages/sdk-ts/src/runtime-controls.ts`.

## Assumptions

- Plugin runtime code should keep using public package imports or script-local helpers.
- Unit tests may import repository source when setting up repository-only policy fixtures.
- Reintroducing `workspace:` into publishable plugin manifests would regress installation outside this repo.

## Phase 1: Repair Test Boundary

### Goal

Make plugin tests exercise the current repository runtime-control behavior without depending on a published SDK version having unreleased helpers.

### Work

- Change Codex and Claude Code plugin unit tests to import `setRuntimePaused` from the repo-local SDK runtime-controls source.
- Add a structure guard preventing those unit tests from importing `@onemem/sdk-ts/runtime` for this fixture helper.

### Checks

- `mise exec -- pnpm --filter @onemem/codex-plugin test`
- `mise exec -- pnpm --filter @onemem/claude-code-plugin test`
- `mise exec -- pnpm test:structure`
- `mise exec -- pnpm test:demo-matrix`
- `git diff --check`

### Acceptance Criteria Covered

- CI plugin tests no longer fail on a registry SDK that lacks repo-current helpers.
- Publishable plugin manifests keep registry-compatible dependency declarations.
- Regression test protects the boundary.

## Phase 2: Repair Shipped Claude Hook Policy Boundary

### Goal

Keep Claude Code plugin runtime-control enforcement available when the installed SDK package is the published `0.6.0` release.

### Work

- Replace the Claude hook helper's dynamic `@onemem/sdk-ts/runtime` import with plugin-local runtime-control JSON reading, matching the Codex helper behavior.
- Add a structure guard that rejects `@onemem/sdk-ts/runtime` in the Claude hook helper.

### Checks

- Same gate list as Phase 1.

### Acceptance Criteria Covered

- Claude Code hooks still default to trace capture enabled when no runtime-control file exists.
- Paused runtime controls still stop capture.
- Published plugin runtime no longer depends on an unreleased SDK runtime export.
- Claude Code shipped hook policy code no longer depends on the registry SDK runtime entry for runtime controls.

### Stop Condition

Local gates pass and the fix is pushed to both `pillar-3-plugins` and `main`; remote CI is rechecked.

## Verification Checkpoint

Write `.thoughts/verification/2026-06-17-plugin-test-sdk-boundary.md` with command evidence and remote workflow outcome.

## Handoff Notes

This is a CI repair, not a package publication proof. Actual npm upload remains gated by npm credentials or trusted publishing setup.
