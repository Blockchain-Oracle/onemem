# Plan: npm Provenance Release Hardening

Date: 2026-06-17

## Inputs

- Research: `.thoughts/research/2026-06-17-npm-provenance-release-hardening.md`
- Spec: `.thoughts/specs/2026-06-17-npm-provenance-release-hardening.md`
- Stories: `.thoughts/stories/2026-06-17-npm-provenance-release-hardening.md`
- Quality profile: `.thoughts/quality/2026-06-17-project-quality-profile.md`
- Current release workflow: `.github/workflows/release.yml`
- Current release script: `scripts/publish-all.sh`
- Current structure tests: `tests/structure.test.ts`

## Assumptions

- Changesets will continue to decide which JavaScript packages are unpublished
  or version-bumped.
- npm config environment variables are honored by the `npm publish` process
  spawned by Changesets.
- The repo should not require local provenance for manual token-based npm
  publishing; provenance is a CI/trusted-publishing concern.

## Open Questions

- npm-side organization permissions or trusted-publisher registration remain
  external state and cannot be proven from this repo alone.

## Phase 1: Script Hardening

### Goal

Centralize TS npm publish defaults in `scripts/publish-all.sh`.

### Work

- Forward `NPM_TOKEN` to `NODE_AUTH_TOKEN` when needed.
- Set default npm public access config for TS publishing.
- Add an env switch to enable npm provenance for CI.
- Keep Python publishing behavior intact.

### Checks

- Shell syntax review.
- `PUBLISH_ALL_DRY_RUN=1 bash scripts/publish-all.sh python`.

### Acceptance Criteria Covered

- AC1, AC2.

### Stop Condition

The script still delegates to Changesets but with explicit npm release config.

## Phase 2: Workflow Hardening

### Goal

Make the GitHub release workflow call the hardened script.

### Work

- Replace the bare Changesets publish command with `bash scripts/publish-all.sh
  ts`.
- Set the provenance env switch and public access config in the publish step.
- Preserve Python publication after successful Changesets publish.

### Checks

- Structure test coverage.

### Acceptance Criteria Covered

- AC3, AC4.

### Stop Condition

The workflow publish command and env are explicit and test-guarded.

## Phase 3: Guards And Verification

### Goal

Prevent silent drift and record honest evidence.

### Work

- Add structure tests for workflow/script release hardening.
- Run plugin dry-runs and structure checks.
- Write verification audit.
- Update wiki/index/status/log.

### Checks

- `pnpm test:structure`
- `cd packages/plugin-codex && npm publish --dry-run --access public`
- `cd packages/plugin-claude-code && npm publish --dry-run --access public`
- `git diff --check`

### Acceptance Criteria Covered

- AC5, AC6, AC7.

### Stop Condition

The release path is hardened and verified, while actual npm upload remains
explicitly unclaimed until registry evidence proves it.

## Verification Checkpoint

Use `abu-context-engineering:verification-audit` before claiming this slice
complete.

## Handoff Notes

If npm upload still fails after this slice, inspect npm-side `@onemem` org
publish permissions, repository `NPM_TOKEN`, and npm trusted-publisher
registration for `Blockchain-Oracle/onemem/.github/workflows/release.yml`.

