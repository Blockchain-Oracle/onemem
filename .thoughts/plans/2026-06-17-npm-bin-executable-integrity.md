# Plan: Npm Bin Executable Integrity

## Inputs

- Reality research:
  `.thoughts/research/2026-06-17-npm-bin-executable-integrity.md`
- Spec:
  `.thoughts/specs/2026-06-17-npm-bin-executable-integrity.md`
- Stories:
  `.thoughts/stories/2026-06-17-npm-bin-executable-integrity.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`

## Assumptions

- Local executable file mode is the right source for npm dry-pack mode.
- Bin script contents do not need behavior changes because all current bin files
  already have the required Node shebang.

## Open Questions

- None blocking.

## Phase 1: Fix OpenClaw Bin Mode

### Goal

Make the advertised `oc-onemem` bin executable in source and dry-pack output.

### Work

- Set owner executable bit on `packages/plugin-openclaw/bin/init.mjs`.

### Checks

- `ls -l packages/plugin-openclaw/bin/init.mjs`.
- `npm pack --dry-run --json` for `packages/plugin-openclaw`.

### Acceptance Criteria Covered

- R4, R5, AC1, AC2.

### Stop Condition

The OpenClaw bin file reports executable local and dry-pack modes.

## Phase 2: Add Structure Guard

### Goal

Prevent invalid npm bin entries from returning.

### Work

- Add a structure test that scans TS package manifests and validates all `bin`
  targets exist, start with `#!/usr/bin/env node`, and have owner execute bit.
- Register this artifact set.

### Checks

- `pnpm test:structure`.

### Acceptance Criteria Covered

- R1-R3, R6, AC3.

### Stop Condition

Structure tests pass and would fail on the pre-fix OpenClaw bin mode.

## Phase 3: Verify Release Artifact Mode

### Goal

Prove npm dry-pack artifacts now carry executable bin modes.

### Work

- Run `npm pack --dry-run --json` for all packages with bin entries and assert
  each bin path has executable mode.

### Checks

- Dry-pack loop over bin packages.
- `pnpm exec biome check tests/structure.test.ts`.
- `git diff --check`.

### Acceptance Criteria Covered

- AC2-AC4.

### Stop Condition

All bin package dry-pack outputs report executable mode and all gates pass.

## Verification Checkpoint

Write:
`.thoughts/verification/2026-06-17-npm-bin-executable-integrity.md`.

## Handoff Notes

Do not publish or bump versions in this slice.
