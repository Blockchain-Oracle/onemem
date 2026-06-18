# Reality Research: Release Preflight Auth Diagnostics

## Scope

Current registry-publication and release-auth reality for OneMem after the
Codex hook-boundary slice. This brief checks what can be proven locally and
from GitHub metadata without exposing secret values.

## Sources Checked

- `.thoughts/wiki/context-engineering-status.md`
- `.github/workflows/release.yml`
- `.changeset/README.md`
- `scripts/publish-all.sh`
- `scripts/check-registry-status.py`
- `package.json`
- `mise exec -- pnpm registry:status`
- `npm whoami`
- Environment presence check for `NPM_TOKEN`, `NODE_AUTH_TOKEN`,
  `PYPI_TOKEN`, and `ONEMEM_NPM_TRUSTED_PUBLISHING`
- `gh secret list --repo Blockchain-Oracle/onemem --app actions`
- `gh variable list --repo Blockchain-Oracle/onemem`
- `NPM_CONFIG_DRY_RUN=true ... mise exec -- pnpm changeset publish --no-git-tag`
- Published npm tarballs for `@onemem/vercel-ai-provider@0.1.1` and
  `@onemem/openai-agents@0.1.2`
- Published PyPI artifacts for `onemem-crewai@0.1.0`,
  `onemem-livekit@0.1.0`, and `onemem-elevenlabs@0.1.0`
- Provider package manifests and Python SDK memory bridge imports
- Context7 docs for `/npm/cli`
- Context7 docs for `/changesets/changesets`

## Verified Facts

- `pnpm registry:status` reports five missing npm packages:
  `@onemem/brand`, `@onemem/cli`, `@onemem/dashboard`,
  `@onemem/claude-code-plugin`, and `@onemem/codex-plugin`.
- `pnpm registry:status` reports three PyPI gaps: `onemem-cli` missing,
  `onemem-sdk-python` missing, and `hermes-onemem` local `0.2.0` vs registry
  `0.1.0`.
- This shell has no `NPM_TOKEN`, `NODE_AUTH_TOKEN`, `PYPI_TOKEN`, or
  `ONEMEM_NPM_TRUSTED_PUBLISHING` env value.
- `npm whoami` returns `E401`.
- `gh secret list` and `gh variable list` returned no configured repository
  Actions secrets or variables for this repo in the current account context.
- The release workflow maps `NPM_TOKEN`, `PYPI_TOKEN`, and
  `ONEMEM_NPM_TRUSTED_PUBLISHING`, has `id-token: write`, installs npm latest,
  and gates npm publication on token auth or explicit trusted-publishing opt-in.
- The release workflow only runs Python publication after Changesets reports a
  successful npm publish and a PyPI token exists.
- An npm dry-run Changesets publish reports it would publish the five missing
  npm packages and skip already-current packages.
- Published `@onemem/vercel-ai-provider@0.1.1` and
  `@onemem/openai-agents@0.1.2` artifacts do not contain the shipped
  `createOneMemMemory` helper, even though the current repo source does.
- Published `onemem-crewai@0.1.0`, `onemem-livekit@0.1.0`, and
  `onemem-elevenlabs@0.1.0` artifacts do not contain the shipped
  `create_onemem_memory` helper, even though the current repo source does.
- The Python provider helpers import `onemem.provider_memory`, which is part of
  local `onemem-sdk-python@0.2.0`.
- Context7 npm docs confirm scoped packages need public access on first publish
  and npm config can be set through `NPM_CONFIG_*` env variables.
- Context7 Changesets docs confirm `changeset add --empty` exists for changes
  that do not require package release and `changeset publish` is the publication
  command.

## Inferences

- The current blocker to real registry publication is missing auth/trusted
  publisher configuration plus fresh provider versions for already-published
  stale artifacts.
- Release logs currently say npm publication is disabled, but a combined
  registry/auth preflight would make the missing package list and auth gates
  visible before publish decisions.
- A repo-owned preflight can improve handoff quality without uploading packages
  or exposing secret values.
- Same-version registry artifacts cannot be corrected by republishing in-place;
  affected provider packages need patch version bumps before the next publish.

## Unknowns And Questions

- Whether npm-side trusted publisher entries already exist for the missing npm
  packages.
- Whether PyPI trusted publishing is desired later or token publishing is the
  intended path.
- Whether the user's claimed npm token exists outside this shell or needs to be
  added as a repo secret.
- Whether PyPI trusted publishing should replace token publishing before the
  provider patch versions are published.

## Not Included

- No real npm or PyPI publish was attempted.
- No secret values were read or printed.
