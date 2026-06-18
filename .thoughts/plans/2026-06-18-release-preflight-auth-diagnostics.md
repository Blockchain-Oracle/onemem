# Plan: Release Preflight Auth Diagnostics

## Inputs

- Reality research:
  `.thoughts/research/2026-06-18-release-preflight-auth-diagnostics.md`
- Spec:
  `.thoughts/specs/2026-06-18-release-preflight-auth-diagnostics.md`
- Stories:
  `.thoughts/stories/2026-06-18-release-preflight-auth-diagnostics.md`
- Existing scripts:
  `scripts/check-registry-status.py` and `scripts/publish-all.sh`
- Existing workflow:
  `.github/workflows/release.yml`

## Assumptions

- The release workflow should keep succeeding without credentials so Changesets
  release-PR automation remains available.
- Strict auth enforcement is useful for local handoff, not yet for every Release
  workflow run.

## Open Questions

- Whether npm-side trusted publisher entries are already configured.
- Whether PyPI token publishing or trusted publishing is the final PyPI path.

## Phase 1: Preflight Script

### Goal

Add a read-only script that combines registry drift and auth readiness.

### Work

- Add `scripts/check-release-preflight.py`.
- Read registry status through `scripts/check-registry-status.py --json`.
- Check only credential presence, never values.
- Support human output, `--json`, `--require-auth`, and `--strict`.

### Checks

- `pnpm release:preflight`
- `pnpm release:preflight -- --json`
- `pnpm release:preflight -- --require-auth`

### Acceptance Criteria Covered

- AC1, AC2, AC3.

### Stop Condition

- Default and JSON modes pass; require-auth fails in the current no-auth state.

## Phase 2: Workflow And Docs

### Goal

Surface preflight output in Release logs and docs.

### Work

- Add root `release:preflight` script.
- Run `pnpm release:preflight` in `.github/workflows/release.yml`.
- Document the command in `.changeset/README.md`.

### Checks

- Structure tests.
- Targeted Biome/docs checks.

### Acceptance Criteria Covered

- AC4, AC5.

### Stop Condition

- Tests guard the workflow/docs/script contract.

## Phase 3: Published Artifact Drift Repair

### Goal

Make stale same-version provider artifacts publishable as fresh versions.

### Work

- Bump `@onemem/vercel-ai-provider` from `0.1.1` to `0.1.2`.
- Bump `@onemem/openai-agents` from `0.1.2` to `0.1.3`.
- Bump Python providers from `0.1.0` to `0.1.1`.
- Require `onemem-sdk-python>=0.2.0` for Python providers that import the
  SDK memory bridge.
- Update framework docs to distinguish local pending versions from stale
  registry artifacts.
- Add structure tests for provider versions, SDK dependency minimums, and
  preflight artifact marker checks.

### Checks

- `pnpm release:preflight`
- `pnpm test:structure`
- Targeted TypeScript provider tests/builds
- Targeted Python provider tests

### Acceptance Criteria Covered

- AC4, AC6, AC7.

### Stop Condition

- Registry status reports affected providers as version drift pending publish,
  not current same-version artifacts missing helpers.

## Verification Checkpoint

Run focused preflight modes, structure tests, targeted lint/format checks, and
`git diff --check`. Write the verification audit before commit.

## Handoff Notes

This slice does not publish. Publication still requires adding npm/PyPI auth or
trusted-publishing config and then proving registry parity with
`pnpm registry:status -- --strict`.
