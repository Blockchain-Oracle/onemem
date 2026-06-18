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
mise exec -- pnpm registry:status --strict
mise exec -- pnpm release:preflight --strict
```

Observed proof:

- `test:structure` passed 427/427 tests before publication.
- `git diff --check` passed.
- Live PyPI publish command exited 0 after uploading all six Python packages.
- Live npm publish command exited 0 and reported the seven expected packages as
  published successfully.
- `pnpm registry:status --strict` exited 0 and reported every npm/PyPI package
  as `current`.
- `pnpm release:preflight --strict` exited 0 with "all current" for npm and
  PyPI and no missing shipped markers.

## Boundaries

- Tokens were read into transient shell environment variables and temporary
  config only; they were not written to repo files.
- This verifies registry publication, not Vercel deployment, DNS, trusted
  Claude/Codex live hook execution, or hosted wallet popup flows.
- CI secrets/trusted publishing still need to be configured separately for
  future automated releases.
