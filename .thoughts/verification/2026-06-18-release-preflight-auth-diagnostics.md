# Verification Audit: Release Preflight Auth Diagnostics

## Verdict

Pass for the repo change. Registry publication itself remains a blocked
follow-up because this shell and repository metadata do not expose npm/PyPI
publish credentials.

## Artifacts Checked

- Research:
  `.thoughts/research/2026-06-18-release-preflight-auth-diagnostics.md`
- Spec:
  `.thoughts/specs/2026-06-18-release-preflight-auth-diagnostics.md`
- Stories:
  `.thoughts/stories/2026-06-18-release-preflight-auth-diagnostics.md`
- Plan:
  `.thoughts/plans/2026-06-18-release-preflight-auth-diagnostics.md`
- Script:
  `scripts/check-release-preflight.py`
- Provider manifests:
  `packages/provider-vercel-ai/package.json`
  `packages/provider-openai-agents/package.json`
  `packages/provider-crewai/pyproject.toml`
  `packages/provider-livekit/pyproject.toml`
  `packages/provider-elevenlabs/pyproject.toml`
- Workflow:
  `.github/workflows/release.yml`
- Docs:
  `.changeset/README.md`
  `docs/05-our-architecture/04-frameworks/README.md`
- Tests:
  `tests/structure/root.test.ts`
  `tests/structure/release-docs.test.ts`
  `tests/structure/release-artifacts.test.ts`

## Requirement Traceability

| Requirement | Evidence |
|---|---|
| R1: Root script | `package.json` exposes `release:preflight`. |
| R2: Reads registry status | `scripts/check-release-preflight.py` shells through `scripts/check-registry-status.py --json`. |
| R3: Reports auth readiness safely | Preflight output reports boolean gate state only; no secret values are printed. |
| R4: Supports strict/json modes | Default, `--json`, `--require-auth`, and `--strict` were exercised. |
| R5: Release workflow runs preflight | `.github/workflows/release.yml` runs `pnpm release:preflight` before publish decisions. |
| R6: Structure guards | `pnpm test:structure` passes 384 tests, including release-doc and release-artifact shards. |
| R7: Detects helper-marker artifact drift | Preflight script includes npm tarball and PyPI artifact marker checks for `createOneMemMemory` / `create_onemem_memory`. |
| R8: Provider versions advance past stale artifacts | Vercel AI `0.1.2`, OpenAI Agents `0.1.3`, Python providers `0.1.1`. |
| R9: Python providers require SDK memory bridge version | Python providers require `onemem-sdk-python>=0.2.0`; frozen uv sync passed. |

## Acceptance Criteria Coverage

| Acceptance Criterion | Evidence |
|---|---|
| AC1: Default preflight reports drift/auth | `pnpm release:preflight` exits zero and reports npm/PyPI packages needing publication plus missing auth gates. |
| AC2: Require-auth fails without auth | `pnpm release:preflight -- --require-auth` exits 1 in the current no-auth state. |
| AC3: JSON mode works | `pnpm release:preflight -- --json` exits zero and emits machine-readable status/auth data. |
| AC4: Structure tests pass | `pnpm test:structure`: 384 pass, 0 fail. |
| AC5: Docs mention preflight | Structure release-doc test passes. |
| AC6: Stale artifacts become version drift | Default preflight now reports affected providers as version-drift pending publish. |
| AC7: Framework docs state local pending versions | Release-artifact structure test checks pending local versions and stale registry evidence. |

## Quality Gates

Passed:

```bash
mise exec -- uv lock
mise exec -- pnpm install --lockfile-only
mise exec -- pnpm release:preflight
mise exec -- pnpm release:preflight -- --json
mise exec -- python -m py_compile scripts/check-release-preflight.py scripts/check-registry-status.py
mise exec -- uv run ruff check scripts/check-release-preflight.py scripts/check-registry-status.py packages/provider-crewai packages/provider-livekit packages/provider-elevenlabs
mise exec -- pnpm exec biome check package.json packages/provider-vercel-ai/package.json packages/provider-openai-agents/package.json .github/workflows/release.yml .changeset/README.md docs/05-our-architecture/04-frameworks/README.md tests/structure .thoughts
mise exec -- pnpm --filter @onemem/vercel-ai-provider test
mise exec -- pnpm --filter @onemem/openai-agents test
mise exec -- uv run pytest packages/provider-crewai packages/provider-livekit packages/provider-elevenlabs -q
mise exec -- pnpm --filter @onemem/vercel-ai-provider typecheck
mise exec -- pnpm --filter @onemem/vercel-ai-provider lint
mise exec -- pnpm --filter @onemem/vercel-ai-provider build
mise exec -- pnpm --filter @onemem/openai-agents typecheck
mise exec -- pnpm --filter @onemem/openai-agents lint
mise exec -- pnpm --filter @onemem/openai-agents build
mise exec -- uv sync --all-packages --frozen
mise exec -- pnpm test:structure
NPM_CONFIG_DRY_RUN=true npm_config_dry_run=true NPM_CONFIG_ACCESS=public npm_config_access=public PUBLISH_ALL_NPM_PROVENANCE=0 mise exec -- pnpm changeset publish --no-git-tag
```

Expected failing handoff gates:

```bash
mise exec -- pnpm release:preflight -- --require-auth
mise exec -- pnpm release:preflight -- --strict
```

Both exit 1 because package publication is still needed and npm/PyPI auth gates
are absent.

## Deviations From Plan

- Scope expanded after artifact inspection: same-version provider artifacts on
  npm/PyPI were stale, so this slice also bumps provider patch versions and
  tightens Python SDK dependency minimums. This is aligned with the release
  objective because publication cannot honestly fix stale same-version
  artifacts.

## Gaps And Risks

- Real npm/PyPI publication remains blocked until credentials or trusted
  publisher configuration exists.
- The preflight intentionally does not read or validate secret values.
- Provider registry parity remains pending until the new local versions are
  actually published.

## Follow-ups

- Add repo `NPM_TOKEN`/`PYPI_TOKEN` secrets or configure trusted publishing.
- Publish the missing packages and new provider patch versions.
- Re-run `pnpm registry:status -- --strict` after publication.

## Evidence Log

- Default preflight reports:
  `@onemem/openai-agents@0.1.3` vs registry `0.1.2`,
  `@onemem/vercel-ai-provider@0.1.2` vs registry `0.1.1`, Python providers
  `0.1.1` vs registry `0.1.0`, missing npm/PyPI auth, and no current published
  artifacts requiring marker checks.
- JSON preflight includes `auth.npm_token=false`,
  `auth.npm_trusted_publishing=false`, `auth.pypi_token=false`, and provider
  statuses as `version-drift`.
- npm dry-run Changesets publish selected seven packages:
  `@onemem/brand@0.1.0`, `@onemem/cli@0.1.0`,
  `@onemem/dashboard@0.1.0`, `@onemem/claude-code-plugin@0.1.0`,
  `@onemem/codex-plugin@0.1.0`, `@onemem/openai-agents@0.1.3`, and
  `@onemem/vercel-ai-provider@0.1.2`.
