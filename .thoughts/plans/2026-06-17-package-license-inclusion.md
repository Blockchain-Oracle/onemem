# Plan: Package License Inclusion

## Inputs

- Reality research:
  `.thoughts/research/2026-06-17-package-license-inclusion.md`
- Spec:
  `.thoughts/specs/2026-06-17-package-license-inclusion.md`
- Stories:
  `.thoughts/stories/2026-06-17-package-license-inclusion.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`

## Assumptions

- Copying the root Apache-2.0 license text into package-local `LICENSE` files
  is the correct publish artifact fix because npm packages are consumed outside
  the repo root.
- The current JS package inventory in `tests/structure.test.ts` is the right
  scope for the guard.

## Open Questions

- Python package license artifact checks are out of scope for this slice.

## Phase 1: Add Package-local License Files

### Goal

Make each targeted npm package tarball able to include full license text.

### Work

- Copy root `LICENSE` into:
  - `packages/brand/LICENSE`
  - `packages/cli-ts/LICENSE`
  - `packages/dashboard/LICENSE`
  - `packages/mcp-server/LICENSE`
  - `packages/plugin-claude-code/LICENSE`
  - `packages/plugin-codex/LICENSE`
  - `packages/plugin-openclaw/LICENSE`
  - `packages/provider-openai-agents/LICENSE`
  - `packages/provider-vercel-ai/LICENSE`
  - `packages/sdk-ts/LICENSE`

### Checks

- Manifest scan reports local license files present.

### Acceptance Criteria Covered

- R1-R10, AC1.

### Stop Condition

All targeted package directories contain Apache-2.0 license text.

## Phase 2: Add Structure Guard

### Goal

Prevent package license allowlists from drifting away from actual publish
artifacts.

### Work

- Add a structure test that inspects TS package manifests and asserts package
  directories contain `LICENSE` whenever `files` includes `LICENSE`.
- Register this artifact set in structure tests.

### Checks

- `pnpm test:structure`.

### Acceptance Criteria Covered

- R11, R13, AC3.

### Stop Condition

Structure tests pass and would fail on the pre-fix state.

## Phase 3: Dry-pack Verification

### Goal

Prove npm publish artifacts include the license file.

### Work

- Run `npm pack --dry-run --json` for each targeted package and assert
  `LICENSE` appears in the returned file list.

### Checks

- All targeted dry-pack checks pass.
- `git diff --check`.

### Acceptance Criteria Covered

- R12, AC2, AC4.

### Stop Condition

Every targeted package dry-pack output includes `LICENSE`; structure and diff
guards pass.

## Verification Checkpoint

Write:
`.thoughts/verification/2026-06-17-package-license-inclusion.md`.

## Handoff Notes

Do not bump versions or publish packages in this slice. Treat this as publish
artifact hygiene only.
