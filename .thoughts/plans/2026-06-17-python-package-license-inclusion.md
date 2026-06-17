# Plan: Python Package License Inclusion

## Inputs

- Reality research:
  `.thoughts/research/2026-06-17-python-package-license-inclusion.md`
- Spec:
  `.thoughts/specs/2026-06-17-python-package-license-inclusion.md`
- Stories:
  `.thoughts/stories/2026-06-17-python-package-license-inclusion.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`

## Assumptions

- Package-local `LICENSE` files are the smallest release-artifact fix for
  Hatchling-built Python packages.
- The existing `PY_PACKAGES` inventory in `tests/structure.test.ts` is the
  correct scope for the guard.

## Open Questions

- Python license metadata modernization is out of scope.

## Phase 1: Add Package-local License Files

### Goal

Give each Python package full Apache-2.0 license text at its package root.

### Work

- Copy root `LICENSE` into:
  - `packages/sdk-python/LICENSE`
  - `packages/cli-python/LICENSE`
  - `packages/plugin-hermes/LICENSE`
  - `packages/provider-crewai/LICENSE`
  - `packages/provider-livekit/LICENSE`
  - `packages/provider-elevenlabs/LICENSE`

### Checks

- Package scan reports `local_LICENSE=true` and `apache_text=true` for all six.

### Acceptance Criteria Covered

- R1-R6, AC1.

### Stop Condition

All six package directories contain Apache-2.0 license text.

## Phase 2: Add Structure Guard

### Goal

Prevent Python package license files from disappearing silently.

### Work

- Add structure tests that verify package-local Python `LICENSE` files exist and
  contain Apache-2.0 text.
- Register this artifact set in structure tests.

### Checks

- `pnpm test:structure`.

### Acceptance Criteria Covered

- R7, R10, AC4.

### Stop Condition

Structure tests pass and would fail on the pre-fix state.

## Phase 3: Build And Inspect Artifacts

### Goal

Prove wheels and sdists include license archive entries.

### Work

- Rebuild all six Python packages with `uv build` into `/tmp`.
- Inspect every generated `.whl` and `.tar.gz` archive for `LICENSE` entries.

### Checks

- `uv build` loop for all six packages.
- Python archive inspection script.
- `git diff --check`.

### Acceptance Criteria Covered

- R8, R9, AC2, AC3, AC5.

### Stop Condition

Each rebuilt wheel and sdist reports a license archive entry; structure and diff
guards pass.

## Verification Checkpoint

Write:
`.thoughts/verification/2026-06-17-python-package-license-inclusion.md`.

## Handoff Notes

Do not publish or bump versions in this slice. Keep build outputs outside the
repo.
