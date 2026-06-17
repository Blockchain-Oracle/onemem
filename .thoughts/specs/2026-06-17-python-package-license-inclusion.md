# Spec: Python Package License Inclusion

## Objective

Ensure every publishable OneMem Python package ships full Apache-2.0 license
text in its built wheel and source distribution artifacts.

## Background And Current Reality

All six Python packages declare `license = { text = "Apache-2.0" }`, and
Hatchling builds both wheels and sdists successfully. Archive inspection of the
current built artifacts shows no `LICENSE` entries, even though metadata
contains `License: Apache-2.0`.

Source:
`.thoughts/research/2026-06-17-python-package-license-inclusion.md`.

## Users

- Maintainers preparing PyPI releases.
- Consumers inspecting wheel and sdist license files.
- Future agents validating release artifacts.

## Goals

- Add a package-local Apache-2.0 license file to every publishable Python
  package.
- Add structure-test coverage so Python package license files remain present.
- Verify rebuilt wheels and sdists include license archive entries.

## Non-goals

- Do not publish to PyPI.
- Do not bump versions.
- Do not change runtime code.
- Do not migrate license metadata style in this slice.

## Requirements

- R1: `packages/sdk-python/LICENSE` exists and contains Apache-2.0 license text.
- R2: `packages/cli-python/LICENSE` exists and contains Apache-2.0 license text.
- R3: `packages/plugin-hermes/LICENSE` exists and contains Apache-2.0 license text.
- R4: `packages/provider-crewai/LICENSE` exists and contains Apache-2.0 license text.
- R5: `packages/provider-livekit/LICENSE` exists and contains Apache-2.0 license text.
- R6: `packages/provider-elevenlabs/LICENSE` exists and contains Apache-2.0 license text.
- R7: Structure tests guard package-local license presence for Python packages.
- R8: Rebuilt wheel artifacts for all six Python packages include a license
  archive entry.
- R9: Rebuilt sdist artifacts for all six Python packages include a license
  archive entry.
- R10: Context Engineering artifacts are registered in structure tests.

## Acceptance Criteria

- AC1: A package scan reports `local_LICENSE=true` and `apache_text=true` for
  all six Python packages.
- AC2: `uv build` succeeds for all six Python packages.
- AC3: Archive inspection reports at least one `LICENSE` entry for each rebuilt
  wheel and sdist.
- AC4: `pnpm test:structure` passes with the Python license guard.
- AC5: `git diff --check` passes.

## Constraints

- Preserve unrelated dirty worktree changes.
- Keep this slice scoped to package-local license files, structure guard, and
  CE artifacts.
- Build outputs must go to temporary storage outside the repo.

## Stories Needed

- Maintainer verifies PyPI artifacts include license files.
- Future agent catches missing Python package license files before release.

## Open Questions

- Whether to modernize Python license metadata remains separate from this
  artifact-inclusion fix.

## Source References

- `.thoughts/research/2026-06-17-python-package-license-inclusion.md`
- `LICENSE`
- `packages/*/pyproject.toml`
- `tests/structure.test.ts`
