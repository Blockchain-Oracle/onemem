# Spec: npm Provenance Release Hardening

Date: 2026-06-17

## Goal

Make OneMem's JavaScript release path explicitly provenance-aware and
first-publish-safe for public scoped npm packages, without claiming publication
success while npm authentication or org permissions are still unavailable.

## Requirements

- R1: The GitHub release workflow must route TS package publishing through a
  repo-owned script.
- R2: The GitHub release workflow must opt TS npm publishing into provenance.
- R3: The release path must preserve first-time public scoped package behavior
  by ensuring npm public access is configured.
- R4: The release path must support both token-based publishing and npm trusted
  publishing: if `NPM_TOKEN` exists and `NODE_AUTH_TOKEN` is unset, the script
  must forward it; if no token exists, the script must still allow npm's OIDC
  trusted-publishing path in GitHub Actions.
- R5: The Python publication path must continue to work through the same script.
- R6: Structure tests must guard the release workflow and script against
  regressing to implicit/bare npm publishing.
- R7: Documentation/status must clearly distinguish release hardening from
  successful npm upload.

## Acceptance Criteria

- AC1: `scripts/publish-all.sh ts` sets or preserves npm public access config
  before invoking Changesets.
- AC2: `scripts/publish-all.sh ts` can opt into npm provenance through an env
  switch.
- AC3: `.github/workflows/release.yml` uses `bash scripts/publish-all.sh ts`
  for the Changesets action publish command.
- AC4: `.github/workflows/release.yml` sets the provenance env switch for the
  publish step.
- AC5: `pnpm test:structure` verifies the release hardening invariants.
- AC6: Plugin package dry-runs still pass.
- AC7: Verification records that local `npm whoami` remains unauthenticated if
  it still returns `E401`.

## Out Of Scope

- Actually publishing to npm without working credentials/org permission.
- Changing the npm package names or versions.
- Changing Python package versions or PyPI release credentials.

