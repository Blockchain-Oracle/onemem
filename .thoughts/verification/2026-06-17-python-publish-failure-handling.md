# Verification Audit: Python Publish Failure Handling

## Verdict

Pass.

The Python release script no longer swallows `uv publish` failures. It builds
each Python package into an explicit package-local `dist/` directory, publishes
those exact artifacts, and supports `PUBLISH_ALL_DRY_RUN=1` for non-uploading
verification. Current release docs now reference the real script and no longer
claim missing changeset-metadata parsing.

## Artifacts Checked

- `.thoughts/research/2026-06-17-python-publish-failure-handling.md`
- `.thoughts/specs/2026-06-17-python-publish-failure-handling.md`
- `.thoughts/stories/2026-06-17-python-publish-failure-handling.md`
- `.thoughts/plans/2026-06-17-python-publish-failure-handling.md`
- `scripts/publish-all.sh`
- `.github/workflows/release.yml`
- `.changeset/README.md`
- `docs/05-our-architecture/00-overview/TOOLING_DECISIONS.md`
- `tests/structure.test.ts`

## Requirement Traceability

| Requirement | Evidence |
|---|---|
| R1: publish script must not swallow `uv publish` failures | `scripts/publish-all.sh` no longer contains `uv publish || echo`; with `set -euo pipefail`, `uv publish` failures propagate. |
| R2: Python publish path must remove stale package `dist/` before build | Script runs `rm -rf "$pkg/dist"` before each package build and uses `uv build "$pkg" --out-dir "$pkg/dist" --clear`. |
| R3: script must support dry-run mode | Script accepts `PUBLISH_ALL_DRY_RUN=1`, adds `--dry-run --trusted-publishing never`, and prints a dry-run banner. |
| R4: script must keep all six Python packages in python/all modes | The script still loops over `sdk-python`, `cli-python`, `plugin-hermes`, `provider-crewai`, `provider-livekit`, and `provider-elevenlabs`. |
| R5: structure tests reject old skeleton pattern | `tests/structure.test.ts` asserts no `uv publish ||` and no `skeleton` text exist in `scripts/publish-all.sh`. |
| R6: release docs refer to `publish-all.sh` | `.changeset/README.md` and `TOOLING_DECISIONS.md` now point to `scripts/publish-all.sh`. |
| R7: release docs do not claim changeset-note parsing exists | `.changeset/README.md` explicitly states the current script does not parse changeset metadata; `TOOLING_DECISIONS.md` no longer claims metadata parsing. |
| R8: CE artifacts are registered | `tests/structure.test.ts` registers this research/spec/stories/plan/verification artifact set. |

## Acceptance Criteria Coverage

| Acceptance Criterion | Evidence |
|---|---|
| AC1: no swallowed publish fallback | Script text guard checks no `uv publish ||` and no `skeleton`. |
| AC2: dry-run builds all six packages and invokes `uv publish --dry-run` | `PUBLISH_ALL_DRY_RUN=1 bash scripts/publish-all.sh python` passed. Output built all six Python packages and started with `Dry run enabled: uv publish will not upload artifacts.` |
| AC3: structure guard passes | `pnpm test:structure` passed, 279 tests. |
| AC4: whitespace guard passes | `git diff --check` passed after final audit/wiki updates. |

## Quality Gates

- `PUBLISH_ALL_DRY_RUN=1 bash scripts/publish-all.sh python` - passed; all six
  Python packages built and `uv publish --dry-run` completed.
- Python dry-run artifact cleanup - passed; package-local Python `dist/`
  folders were removed after verification.
- `bash -n scripts/publish-all.sh` - passed.
- `pnpm exec biome check tests/structure.test.ts` - passed; checked one file
  with no fixes applied.
- `pnpm test:structure` - passed, 279 tests.
- `git diff --check` - passed after final audit/wiki updates.

## Deviations From Plan

Dry-run verification exposed that workspace `uv build` wrote to the monorepo
root `dist/` by default. The implementation was adjusted to build with explicit
`--out-dir "$pkg/dist"` and publish `"$pkg"/dist/*`, which better satisfies the
release-script objective than the original package-local subshell approach.

## Gaps And Risks

- This slice did not perform a real PyPI upload or consume `PYPI_TOKEN`.
- uv dry-run output still prints the word `Uploading`; the script now prints an
  explicit dry-run banner before those uv messages.
- Selective Python package publishing via parsed changeset metadata remains
  out of scope.

## Follow-ups

- Consider trusted publishing migration separately from token-based PyPI
  publishing.
- Consider a changeset metadata parser only if publishing all Python packages
  with uv's duplicate handling becomes too noisy.

## Evidence Log

- Changed script:
  - `scripts/publish-all.sh`
- Changed docs:
  - `.changeset/README.md`
  - `docs/05-our-architecture/00-overview/TOOLING_DECISIONS.md`
- Changed guard:
  - `tests/structure.test.ts`
- Added artifacts:
  - `.thoughts/research/2026-06-17-python-publish-failure-handling.md`
  - `.thoughts/specs/2026-06-17-python-publish-failure-handling.md`
  - `.thoughts/stories/2026-06-17-python-publish-failure-handling.md`
  - `.thoughts/plans/2026-06-17-python-publish-failure-handling.md`
- Updated wiki:
  - `.thoughts/wiki/context-engineering-status.md`
  - `.thoughts/wiki/index.md`
  - `.thoughts/wiki/log.md`
