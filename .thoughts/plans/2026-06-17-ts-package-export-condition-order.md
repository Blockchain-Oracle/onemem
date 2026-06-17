# Plan: TS Package Export Condition Order

## Inputs

- Reality research:
  `.thoughts/research/2026-06-17-ts-package-export-condition-order.md`
- Spec:
  `.thoughts/specs/2026-06-17-ts-package-export-condition-order.md`
- Stories:
  `.thoughts/stories/2026-06-17-ts-package-export-condition-order.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`

## Assumptions

- Reordering JSON object keys in `exports["."]` does not change runtime
  entrypoint paths.
- Package builds are the right proof for the observed warning.

## Open Questions

- None blocking for this cleanup slice.

## Phase 1: Patch Affected Manifests

### Goal

Put `types` before runtime conditions in affected root exports.

### Work

- Edit:
  - `packages/sdk-ts/package.json`
  - `packages/provider-vercel-ai/package.json`
  - `packages/provider-openai-agents/package.json`

### Checks

- Metadata scan confirms key order.

### Acceptance Criteria Covered

- R1, R2, R3, AC1.

### Stop Condition

All affected package root exports list `types,import,require`.

## Phase 2: Add Structure Guard

### Goal

Prevent the warning pattern from returning.

### Work

- Add a structure test that inspects package root exports and fails when `types`
  appears after `import` or `require`.
- Register this artifact set.

### Checks

- `pnpm test:structure`.

### Acceptance Criteria Covered

- R4, R6, AC3.

### Stop Condition

Structure tests pass and would fail on the previous metadata order.

## Phase 3: Verify Package Builds

### Goal

Prove the build warning is gone.

### Work

- Build affected packages and inspect output for `condition "types"` warnings.

### Checks

- `pnpm --filter @onemem/sdk-ts build`
- `pnpm --filter @onemem/vercel-ai-provider build`
- `pnpm --filter @onemem/openai-agents build`
- `git diff --check`

### Acceptance Criteria Covered

- R5, AC2, AC4.

### Stop Condition

All focused builds pass without the previous warning and whitespace check passes.

## Verification Checkpoint

Write:
`.thoughts/verification/2026-06-17-ts-package-export-condition-order.md`.

## Handoff Notes

Do not publish or bump versions in this slice. Treat this as release-readiness
metadata cleanup only.
