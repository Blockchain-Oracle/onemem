# Reality Research: Registry Publication Preflight

## Scope

Current repo support for checking npm/PyPI publication state before claiming a
OneMem package is live, and the live registry state for local publishable
packages on 2026-06-18.

## Sources Checked

- `.changeset/README.md`
- `.github/workflows/release.yml`
- `scripts/publish-all.sh`
- `package.json`
- `packages/*/package.json`
- `pyproject.toml`
- `packages/*/pyproject.toml`
- `mise exec -- pnpm registry:status`
- `mise exec -- pnpm registry:status --strict`
- PyPI JSON metadata for `hermes-onemem` and `onemem-sdk-python`
- npm registry metadata queried by the new local preflight command

## Verified Facts

- The release workflow already separates version-only Changesets automation
  from registry upload when `NPM_TOKEN` is empty and
  `ONEMEM_NPM_TRUSTED_PUBLISHING` is not enabled.
- Python publication is gated on successful TS publication plus `PYPI_TOKEN`.
- Before this slice, the repo did not expose a single command that checks all
  local npm and PyPI package versions against public registry metadata.
- Local publishable npm packages are discovered from non-private
  `packages/*/package.json` manifests whose names start with `@onemem/`.
- Local Python packages are listed by the root `uv` workspace and define names
  and versions in package-local `pyproject.toml` files.
- Live registry status from `mise exec -- pnpm registry:status`:
  - Current on npm: `@onemem/mcp@0.1.0`, `@onemem/oc-onemem@0.2.3`,
    `@onemem/openai-agents@0.1.2`,
    `@onemem/vercel-ai-provider@0.1.1`, `@onemem/sdk-ts@0.6.0`.
  - Missing on npm: `@onemem/brand@0.1.0`, `@onemem/cli@0.1.0`,
    `@onemem/dashboard@0.1.0`, `@onemem/claude-code-plugin@0.1.0`,
    `@onemem/codex-plugin@0.1.0`.
  - Current on PyPI: `onemem-crewai@0.1.0`,
    `onemem-elevenlabs@0.1.0`, `onemem-livekit@0.1.0`.
  - Missing on PyPI: `onemem-cli@0.1.0`,
    `onemem-sdk-python@0.2.0`.
  - Version drift on PyPI: local `hermes-onemem@0.2.0`; registry latest is
    `0.1.0`.
- `mise exec -- pnpm registry:status --strict` exits non-zero because the local
  package set is not fully published at matching versions.

## Inferences

- A non-mutating registry preflight is the right next guard because it makes
  release state visible without requiring credentials or consuming package
  publication side effects.
- The strict mode should remain optional until the first-publish auth/permission
  blockers are resolved; making it mandatory in CI today would intentionally
  fail on the current registry truth.

## Unknowns And Questions

- Which npm account, token, or trusted-publisher settings will be used for first
  publishes of the missing `@onemem/*` packages.
- Which PyPI token or trusted-publisher settings will be used to publish
  `onemem-sdk-python`, `onemem-cli`, and `hermes-onemem@0.2.0`.

## Not Included

- No npm or PyPI upload was attempted.
- No version bump was performed.
