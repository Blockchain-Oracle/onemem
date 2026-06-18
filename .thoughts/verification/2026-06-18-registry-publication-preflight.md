# Verification Audit: Registry Publication Preflight

## Verdict

Pass.

The implementation adds a read-only registry preflight and does not attempt to
publish npm or PyPI packages. Live command output shows the current registry
state and strict mode fails on the known missing/drifted packages.

## Artifacts Checked

- Research:
  `.thoughts/research/2026-06-18-registry-publication-preflight.md`
- Plan:
  `.thoughts/plans/2026-06-18-registry-publication-preflight.md`
- Script:
  `scripts/check-registry-status.py`
- Root script wiring:
  `package.json`
- Release docs:
  `.changeset/README.md`
- Structure guards:
  `tests/structure/helpers.ts`
  `tests/structure/root.test.ts`
  `tests/structure/context-artifacts.test.ts`

## Requirement Traceability

| Requirement | Evidence |
|---|---|
| Read-only npm/PyPI registry status command | `package.json` exposes `registry:status`; the script queries npm/PyPI JSON endpoints and contains no `npm publish`, `uv publish`, or `twine publish` command. |
| Structured local metadata parsing | npm packages are read from JSON manifests; Python packages are read from `uv` workspace metadata and `pyproject.toml` through Python `tomllib`. |
| Human-readable status output | `mise exec -- pnpm registry:status` printed npm and PyPI tables with `current`, `missing`, and `version-drift` statuses. |
| Machine-readable output | `mise exec -- pnpm registry:status --json --ecosystem pypi` emitted JSON records for all local PyPI packages. |
| Strict failure mode | `mise exec -- pnpm registry:status --strict` exited 1 because current registry state does not match every local package version. |
| Release docs | `.changeset/README.md` documents `pnpm registry:status` and `pnpm registry:status --strict`. |
| Structure guards | `tests/structure/root.test.ts` asserts script wiring and registry endpoints; `tests/structure/helpers.ts` registers the script inventory. |

## Acceptance Criteria Coverage

| Acceptance Criterion | Evidence |
|---|---|
| Operators can see registry truth in one command | `pnpm registry:status` reports all non-private npm packages and all `uv` workspace PyPI packages. |
| The command does not require credentials | The command uses public JSON metadata endpoints and succeeded without `NPM_TOKEN` or `PYPI_TOKEN`. |
| Strict mode can block a release handoff | `pnpm registry:status --strict` exits non-zero on missing/drifted packages. |
| CI remains deterministic | Network status itself is not a mandatory CI gate; structure tests guard command wiring instead. |

## Quality Gates

Executed:

```bash
mise exec -- pnpm registry:status
mise exec -- pnpm registry:status --strict
mise exec -- pnpm registry:status --json --ecosystem pypi
mise exec -- uv run ruff check scripts/check-registry-status.py
mise exec -- pnpm test:structure
mise exec -- pnpm exec biome check tests/structure package.json
git diff --check
```

Results:

- `registry:status`: passed and reported live npm/PyPI status.
- `registry:status --strict`: failed with exit 1 as expected because several
  packages are missing or drifted.
- `registry:status --json --ecosystem pypi`: passed and emitted JSON.
- Ruff check: passed after formatting.
- Structure tests: passed, 356/356.
- Biome check on touched TS/JSON: passed.
- `git diff --check`: clean.

## Deviations From Plan

- None.

## Gaps And Risks

- This does not publish missing npm or PyPI packages.
- Registry results are time-sensitive by design; rerun the command before any
  public claim.

## Follow-ups

- Configure authorized npm and PyPI publication credentials or trusted
  publisher settings.
- After first publishes, consider making strict registry status part of the
  release workflow.

## Evidence Log

- npm current: `@onemem/mcp`, `@onemem/oc-onemem`,
  `@onemem/openai-agents`, `@onemem/vercel-ai-provider`,
  `@onemem/sdk-ts`.
- npm missing: `@onemem/brand`, `@onemem/cli`, `@onemem/dashboard`,
  `@onemem/claude-code-plugin`, `@onemem/codex-plugin`.
- PyPI current: `onemem-crewai`, `onemem-elevenlabs`, `onemem-livekit`.
- PyPI missing: `onemem-cli`, `onemem-sdk-python`.
- PyPI drift: `hermes-onemem` local `0.2.0`, registry `0.1.0`.
