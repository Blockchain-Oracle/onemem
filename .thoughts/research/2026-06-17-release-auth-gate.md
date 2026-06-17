# Reality Research: Release Auth Gate

Date: 2026-06-17

## Scope

Current GitHub Release workflow behavior when npm/PyPI credentials are absent.
This research records why `main` is red and what should be gated before another
default-branch release attempt.

## Sources Checked

- `.github/workflows/release.yml`
- `scripts/publish-all.sh`
- `tests/structure.test.ts`
- `.changeset/README.md`
- `.thoughts/verification/2026-06-17-public-plugin-release-state.md`
- `gh run list --repo Blockchain-Oracle/onemem --branch main --limit 10`
- `gh run view 27714560227 --repo Blockchain-Oracle/onemem --log-failed`
- `npm whoami`
- `npm view @onemem/codex-plugin version`
- `gh secret list --repo Blockchain-Oracle/onemem`
- Context7 GitHub Actions docs:
  - `npx ctx7@latest library "GitHub Actions" ...`
  - `npx ctx7@latest docs /websites/github_en_actions ...`

## Verified Facts

- The latest `main` CI run for commit `4eb36e2` passed, but the matching
  Release workflow run `27714560227` failed in the npm publish step.
- `gh secret list --repo Blockchain-Oracle/onemem` returned no secrets visible
  to this authenticated account.
- This shell has `NPM_TOKEN`, `NODE_AUTH_TOKEN`, `PYPI_TOKEN`,
  `UV_PUBLISH_TOKEN`, and `TWINE_PASSWORD` unset.
- `npm whoami` returns npm `E401`.
- `npm view @onemem/codex-plugin version` returns npm `E404`, so the Codex
  plugin package is still not published.
- Release logs show Changesets/npm tried to publish unpublished `@onemem/*`
  packages and npm returned `E404 Not Found - PUT`, a permission/trusted
  publisher configuration failure.
- The existing release workflow grants `id-token: write` and installs
  npm@latest, so the workflow is structurally capable of trusted publishing.
  It is not authorized on npmjs.com for first publishes under the `@onemem`
  scope yet.
- GitHub Actions docs state that secrets cannot be referenced directly in
  `if:` conditionals; the supported pattern is to assign them to job-level env
  variables and test `env.<name>`.

## Inferences

- The Release workflow should keep creating or updating Changesets release PRs
  when npm auth is missing, but it should not attempt npm upload unless a
  working token is present or trusted publishing is deliberately enabled.
- Trusted publishing should remain available, but it needs an explicit repo
  variable opt-in so CI does not keep failing before npm-side configuration is
  complete.
- Python publishing should not run unless PyPI credentials are present and the
  TS publish step actually reports `published == true`.

## Unknowns And Questions

- Which npm account or organization permission can create first `@onemem/*`
  package versions.
- Whether npm trusted publishers have been configured on npmjs.com for this
  repository/workflow since the previous audit. Current release evidence says
  no.

## Not Included

- No npm or PyPI upload.
- No package version bump.
- No trusted-publisher setup on npmjs.com.
