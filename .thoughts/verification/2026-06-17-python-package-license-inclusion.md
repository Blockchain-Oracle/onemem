# Verification Audit: Python Package License Inclusion

## Verdict

Pass.

All six publishable Python packages now contain package-local Apache-2.0
`LICENSE` files. Rebuilt wheels and source distributions include license archive
entries, and structure tests guard the package-local license requirement.

## Artifacts Checked

- `.thoughts/research/2026-06-17-python-package-license-inclusion.md`
- `.thoughts/specs/2026-06-17-python-package-license-inclusion.md`
- `.thoughts/stories/2026-06-17-python-package-license-inclusion.md`
- `.thoughts/plans/2026-06-17-python-package-license-inclusion.md`
- Root `LICENSE`
- Python package `pyproject.toml` files
- Package-local `LICENSE` files under the six Python packages
- Built wheels and sdists under `/tmp/onemem-py-license-audit`
- `tests/structure.test.ts`

## Requirement Traceability

| Requirement | Evidence |
|---|---|
| R1: `packages/sdk-python/LICENSE` exists and contains Apache-2.0 text | Package scan reported `packages/sdk-python local_LICENSE=True apache_text=True`. |
| R2: `packages/cli-python/LICENSE` exists and contains Apache-2.0 text | Package scan reported `packages/cli-python local_LICENSE=True apache_text=True`. |
| R3: `packages/plugin-hermes/LICENSE` exists and contains Apache-2.0 text | Package scan reported `packages/plugin-hermes local_LICENSE=True apache_text=True`. |
| R4: `packages/provider-crewai/LICENSE` exists and contains Apache-2.0 text | Package scan reported `packages/provider-crewai local_LICENSE=True apache_text=True`. |
| R5: `packages/provider-livekit/LICENSE` exists and contains Apache-2.0 text | Package scan reported `packages/provider-livekit local_LICENSE=True apache_text=True`. |
| R6: `packages/provider-elevenlabs/LICENSE` exists and contains Apache-2.0 text | Package scan reported `packages/provider-elevenlabs local_LICENSE=True apache_text=True`. |
| R7: Structure tests guard package-local license presence | `tests/structure.test.ts` now checks each Python package has `LICENSE` containing Apache-2.0 text. |
| R8: Rebuilt wheels include license archive entries | Archive inspection found `*.dist-info/licenses/LICENSE` in all six wheels. |
| R9: Rebuilt sdists include license archive entries | Archive inspection found top-level package `LICENSE` entries in all six source distributions. |
| R10: CE artifacts are registered | `tests/structure.test.ts` registers this research/spec/stories/plan/verification artifact set. |

## Acceptance Criteria Coverage

| Acceptance Criterion | Evidence |
|---|---|
| AC1: Package scan reports license files present | Scan reported `local_LICENSE=True apache_text=True` for all six Python packages. |
| AC2: `uv build` succeeds for all six packages | `uv build` loop succeeded for `sdk-python`, `cli-python`, `plugin-hermes`, `provider-crewai`, `provider-livekit`, and `provider-elevenlabs`. |
| AC3: Archive inspection reports license entries | Archive inspection reported license entries in all six wheels and all six sdists. |
| AC4: Structure guard passes | `pnpm test:structure` passed, 272 tests. |
| AC5: Whitespace guard passes | `git diff --check` passed after final audit/wiki updates. |

## Quality Gates

- Package-local license scan - passed; all six packages report
  `local_LICENSE=True` and `apache_text=True`.
- `uv build` loop for all six Python packages - passed; wheels and sdists built
  under `/tmp/onemem-py-license-audit`.
- Python archive inspection script - passed; each wheel and sdist includes a
  `LICENSE` archive entry.
- `pnpm exec biome check tests/structure.test.ts` - passed; checked one file
  with no fixes applied.
- `pnpm test:structure` - passed, 272 tests.
- `git diff --check` - passed after final audit/wiki updates.

## Deviations From Plan

None.

## Gaps And Risks

- This slice did not publish to PyPI or bump versions.
- This slice did not modernize Python license metadata style.
- The proof covers locally rebuilt artifacts, not artifacts already published to
  PyPI.

## Follow-ups

- PyPI version bump and publish remain separate release operations.
- License metadata modernization can be handled as a separate packaging cleanup
  if needed.

## Evidence Log

- Added package-local license files:
  - `packages/sdk-python/LICENSE`
  - `packages/cli-python/LICENSE`
  - `packages/plugin-hermes/LICENSE`
  - `packages/provider-crewai/LICENSE`
  - `packages/provider-livekit/LICENSE`
  - `packages/provider-elevenlabs/LICENSE`
- Changed guard:
  - `tests/structure.test.ts`
- Added artifacts:
  - `.thoughts/research/2026-06-17-python-package-license-inclusion.md`
  - `.thoughts/specs/2026-06-17-python-package-license-inclusion.md`
  - `.thoughts/stories/2026-06-17-python-package-license-inclusion.md`
  - `.thoughts/plans/2026-06-17-python-package-license-inclusion.md`
- Updated wiki:
  - `.thoughts/wiki/context-engineering-status.md`
  - `.thoughts/wiki/index.md`
  - `.thoughts/wiki/log.md`
