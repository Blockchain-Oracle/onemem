# Research: npm Provenance Release Hardening

Date: 2026-06-17

## Question

The public plugin marketplace install path works, but npm publication of the
plugin packages remains blocked. What can the repo itself improve without
pretending local npm auth or npm org permissions are fixed?

## Current Evidence

- Local npm auth is not active:

  ```bash
  npm whoami
  # npm error code E401
  # npm error 401 Unauthorized - GET https://registry.npmjs.org/-/whoami
  ```

- No npm auth-related environment variables are present in this shell:

  ```bash
  env | cut -d= -f1 | rg '^(NPM|NODE_AUTH|YARN_NPM_AUTH|COREPACK|GITHUB|PYPI|UV_PUBLISH|SUI|ONEMEM)'
  # no output
  ```

- `.github/workflows/release.yml` currently invokes:

  ```yaml
  publish: pnpm changeset publish
  ```

- `scripts/publish-all.sh ts` also delegates directly to:

  ```bash
  pnpm changeset publish
  ```

- Changesets CLI publish help only exposes tag, OTP, and git-tag flags:

  ```bash
  pnpm changeset publish --help
  # changeset publish [--tag <name>] [--otp <code>] [--no-git-tag]
  ```

- Changesets CLI code passes `--access <value>` when configured, but does not
  expose an explicit provenance flag. npm itself can receive configuration
  through npm config environment variables.

## Current Documentation Checked

Context7 npm docs (`/websites/npmjs`) for trusted publishing and provenance say:

- GitHub Actions trusted publishing needs `permissions.id-token: write`.
- Publishing with provenance from GitHub Actions needs `npm publish
  --provenance`.
- First-time public scoped package publish needs `--access public`.

The workflow already has `id-token: write` and `.changeset/config.json` already
sets `"access": "public"`, but the release command does not make provenance
intent visible or guarded.

## Interpretation

The repo cannot solve missing local npm credentials or npm org publish
permissions by code. It can make the CI release path stricter and more
auditable:

- Route TS release publishing through the repo-owned script instead of a bare
  command embedded in the GitHub workflow.
- Have that script set npm public-access defaults for Changesets.
- Have CI opt into npm provenance through `NPM_CONFIG_PROVENANCE=true`.
- Forward `NPM_TOKEN` to `NODE_AUTH_TOKEN` when token publishing is used.
- Add structure tests so release config cannot silently drift back to a bare
  `pnpm changeset publish`.

## Non-Goals

- Do not claim npm upload is fixed until `npm view @onemem/codex-plugin` and
  `npm view @onemem/claude-code-plugin` return real versions.
- Do not create or expose npm tokens.
- Do not bypass npm org permissions.
- Do not change package versions in this slice.

