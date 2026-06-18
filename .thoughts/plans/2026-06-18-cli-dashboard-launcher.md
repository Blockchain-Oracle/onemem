# Plan: CLI Dashboard Launcher

## Inputs

- Reality research:
  `.thoughts/research/2026-06-18-cli-dashboard-launcher.md`
- Spec:
  `.thoughts/specs/2026-06-18-cli-dashboard-launcher.md`
- Stories:
  `.thoughts/stories/2026-06-18-cli-dashboard-launcher.md`
- Current CLI source:
  `packages/cli-ts/src/index.ts`
- Dashboard binary:
  `packages/dashboard/bin/onemem-dashboard`

## Assumptions

- The dashboard remains a separate package; the CLI launcher depends on the
  binary being installed or available on `PATH`.
- A non-auto-opening launcher is acceptable for v0.1 because no current CLI
  browser opener dependency exists.

## Open Questions

- Whether future packaging should add `@onemem/dashboard` as an optional CLI
  dependency.

## Phase 1: Launcher Implementation

### Goal

Add a defensive TS CLI command for `onemem dashboard`.

### Work

- Add `packages/cli-ts/src/commands/dashboard.ts`.
- Register `dashboard` in `packages/cli-ts/src/index.ts`.
- Support `--port <port>` with default `4040`.
- Spawn `onemem-dashboard` with `PORT` and `ONEMEM_MODE=local`.
- Return non-zero with install guidance when the binary is absent.

### Checks

- `pnpm --filter @onemem/cli test`
- `pnpm --filter @onemem/cli typecheck`

### Acceptance Criteria Covered

- AC1, AC2.

### Stop Condition

- Unit tests prove success and missing-binary behavior.

## Phase 2: Docs And Structure Guards

### Goal

Make current docs match the implemented command surface.

### Work

- Update CLI package README, CLI reference docs, command-surface docs, CLI
  architecture status, and local dashboard deploy docs.
- Update structure tests to treat `onemem dashboard` as current.
- Add this CE artifact set to context-artifact structure guards.

### Checks

- `pnpm test:structure`
- Targeted Biome docs/test check.

### Acceptance Criteria Covered

- AC3, AC4.

### Stop Condition

- Structure tests pass and line caps remain under limits.

## Verification Checkpoint

Run focused CLI tests/typecheck/lint/build, structure tests, targeted formatting,
and `git diff --check`. Record the verification audit before commit.

## Handoff Notes

This slice does not start a real dashboard server. The dashboard binary already
has its own package/browser smoke coverage; this slice verifies the CLI
delegation boundary.
