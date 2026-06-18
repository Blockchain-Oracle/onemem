# Spec: Release Preflight Auth Diagnostics

## Objective

Add a repo-owned release preflight that reports registry drift, published
artifact drift, and credential readiness without publishing packages or exposing
secrets. Repair provider package versions where already-published artifacts are
stale.

## Background And Current Reality

The release workflow is hardened for token and trusted-publishing paths, but
current GitHub and local auth checks show no configured npm/PyPI credentials.
Registry status still has missing/drifted npm and PyPI packages. A safe npm
dry-run proves Changesets would publish the five missing npm packages once npm
auth is available. Artifact inspection also shows five current registry
versions lack the memory helpers present in this repo, so those provider
packages need patch versions before publication can be honest.

## Users

- OneMem maintainers preparing a release.
- Future agents checking whether a green Release workflow means package
  publication or only release-PR automation.

## Goals

- Provide one command that combines registry status and auth gate visibility.
- Keep the command read-only by default and in strict modes.
- Run the command in the Release workflow so logs show missing package/auth
  state before publish decisions.
- Test-guard that the preflight cannot publish packages.
- Advance local provider versions past stale same-version published artifacts.
- Require `onemem-sdk-python>=0.2.0` where Python provider helpers depend on
  the SDK memory bridge.

## Non-goals

- Do not publish npm or PyPI packages in this slice.
- Do not store, print, or infer secret values.
- Do not publish npm or PyPI packages in this slice.
- Do not change Changesets release semantics.

## Requirements

- R1: Root `package.json` exposes `release:preflight`.
- R2: The preflight reads registry status from the existing registry status
  script.
- R3: The preflight reports npm token/trusted-publishing readiness and PyPI
  token readiness without printing values.
- R4: The preflight supports `--strict`, `--require-auth`, and `--json`.
- R5: The Release workflow runs the preflight before publish decisions.
- R6: Structure tests guard the script, workflow step, docs, and no-publish
  boundary.
- R7: The preflight detects helper-marker drift in current published artifacts.
- R8: Provider package versions advance past published artifacts that lack
  memory helpers.
- R9: Python provider dependencies require the SDK version that exports the
  memory bridge.

## Acceptance Criteria

- AC1: `pnpm release:preflight` reports current registry drift and missing auth
  while exiting zero by default.
- AC2: `pnpm release:preflight -- --require-auth` exits non-zero when packages
  need publication and auth is absent.
- AC3: `pnpm release:preflight -- --json` emits machine-readable auth/status
  data without secret values.
- AC4: Structure tests pass.
- AC5: Release docs mention the combined preflight.
- AC6: Same-version stale provider artifacts become local version-drift entries
  instead of silently looking current.
- AC7: Framework docs state local pending-publish versions and stale registry
  artifact evidence.

## Constraints

- Keep source files under the 400-line cap and structure-test shards under 300
  lines.
- Use `.thoughts/` for repo-local context artifacts.
- Do not use destructive git commands.

## Stories Needed

- Maintainer release preflight.
- CI/release log visibility.
- Future-agent no-publish guard.

## Open Questions

- Should the Release workflow later use `--require-auth` after credentials are
  guaranteed in GitHub?
- Should PyPI trusted publishing be added as a separate release-auth slice?

## Source References

- `.thoughts/research/2026-06-18-release-preflight-auth-diagnostics.md`
- `.github/workflows/release.yml`
- `scripts/check-registry-status.py`
- `scripts/publish-all.sh`
