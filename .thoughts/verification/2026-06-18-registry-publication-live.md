# Verification: Registry Publication Live

## Scope

Publish the repo's npm and PyPI packages that were missing or version-drifted,
then prove registry parity without printing or storing secrets.

## Result

Pass. All local npm and PyPI package versions are current on public registries.

## Live Publications

PyPI packages published:

- `onemem-sdk-python@0.2.0`
- `onemem-cli@0.1.0`
- `hermes-onemem@0.2.0`
- `onemem-crewai@0.1.1`
- `onemem-livekit@0.1.1`
- `onemem-elevenlabs@0.1.1`

npm packages published:

- `@onemem/brand@0.1.2`
- `@onemem/cli@0.1.0`
- `@onemem/dashboard@0.1.2`
- `@onemem/claude-code-plugin@0.1.0`
- `@onemem/codex-plugin@0.1.0`
- `@onemem/openai-agents@0.1.3`
- `@onemem/vercel-ai-provider@0.1.2`

Changesets created matching npm git tags. The first npm pass published
`@onemem/brand@0.1.0` and `@onemem/dashboard@0.1.0`; a follow-up linked patch
release published `@onemem/brand@0.1.1` and `@onemem/dashboard@0.1.1` after the
active brand domain/assets changed. A final linked patch release published
`@onemem/brand@0.1.2` and `@onemem/dashboard@0.1.2` after the generated
campaign artwork palette changed.

## Fixes Before Publish

- Fixed `scripts/publish-all.sh` so an empty `publish_args` array does not fail
  under `set -u` on macOS bash.
- Updated structure tests to guard both dry-run and no-optional-args publish
  paths.
- Corrected stale strict command guidance from `pnpm ... -- --strict` to
  `pnpm ... --strict`.

## Evidence

Commands run:

```bash
bash -n scripts/publish-all.sh
PUBLISH_ALL_DRY_RUN=1 mise exec -- bash scripts/publish-all.sh python
mise exec -- pnpm test:structure
git diff --check
npm pack @onemem/brand@0.1.2 --json
npm view @onemem/dashboard@0.1.2 version dist.tarball --json
mise exec -- pnpm registry:status --strict
mise exec -- pnpm release:preflight --strict
gh secret list -R Blockchain-Oracle/onemem --app actions
```

Observed proof:

- `test:structure` passed 427/427 tests before publication.
- `git diff --check` passed.
- Live PyPI publish command exited 0 after uploading all six Python packages.
- Live npm publish commands exited 0 across the initial, domain-refresh, and
  final asset-refresh passes. The final pass published only
  `@onemem/brand@0.1.2` and `@onemem/dashboard@0.1.2`, as expected.
- The packed `@onemem/brand@0.1.2` tarball contains the current campaign domain
  strings: `onemem.xyz`, `docs.onemem.xyz`, and `x.com/OneMemAI`.
- `npm view @onemem/dashboard@0.1.2` returned version `0.1.2` and the public
  registry tarball URL.
- `pnpm registry:status --strict` exited 0 and reported every npm/PyPI package
  as `current`.
- `pnpm release:preflight --strict` exited 0 with "all current" for npm and
  PyPI and no missing shipped markers.
- GitHub Actions repository secrets `NPM_TOKEN` and `PYPI_TOKEN` are configured
  for `Blockchain-Oracle/onemem` for future release workflow runs.

## Boundaries

- Tokens were read into transient shell environment variables and temporary
  config only; they were not written to repo files.
- This verifies registry publication, not Vercel deployment, DNS, trusted
  Claude/Codex live hook execution, or hosted wallet popup flows.
- GitHub Actions token secrets are configured, but npm trusted publishing is not
  claimed.
