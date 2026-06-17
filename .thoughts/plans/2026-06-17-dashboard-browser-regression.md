# Plan: Dashboard Browser Regression

## Inputs

- Research: `.thoughts/research/2026-06-17-dashboard-browser-regression.md`
- Spec: `.thoughts/specs/2026-06-17-dashboard-browser-regression.md`
- Stories: `.thoughts/stories/2026-06-17-dashboard-browser-regression.md`
- Quality profile: `.thoughts/quality/2026-06-17-project-quality-profile.md`
- Current dashboard UI and package scripts.
- Current Playwright docs fetched through Context7.

## Assumptions

- The first browser smoke target should protect `/sessions` grouped
  replay/export.
- Local Chrome exists on the current machine and can run headless.
- CI wiring should wait until maintainers decide how much live testnet
  dependency is acceptable.

## Open Questions

- Should future smokes use seeded/mocked API data?
- Should screenshots be stored once visual baselines stabilize?

## Phase 1: Browser Smoke Script

### Goal

Create a focused dashboard browser smoke command.

### Work

- Add `playwright-core` as dashboard dev dependency.
- Add `packages/dashboard/scripts/browser-smoke.mjs`.
- Support `ONEMEM_DASHBOARD_SMOKE_BASE_URL`,
  `ONEMEM_DASHBOARD_SMOKE_PORT`, `ONEMEM_BROWSER_EXECUTABLE`, and
  `ONEMEM_DASHBOARD_SMOKE_HEADLESS`.
- Start/stop a temporary dashboard server when needed.
- Launch Chrome/Chromium and run `/sessions` assertions.

### Checks

- Run `pnpm --filter @onemem/dashboard browser:smoke`.

### Acceptance Criteria Covered

- AC1, AC2, AC3.

### Stop Condition

- Smoke command passes locally and fails clearly on missing browser setup.

## Phase 2: Package And Structure Wiring

### Goal

Make the harness discoverable and tracked.

### Work

- Add `browser:smoke` script to dashboard package.
- Track context artifacts in `tests/structure.test.ts`.
- Update wiki/status/log.

### Checks

- `pnpm --filter @onemem/dashboard lint`
- `pnpm --filter @onemem/dashboard typecheck`
- `pnpm --filter @onemem/dashboard test`
- `pnpm --filter @onemem/dashboard build`
- `pnpm test:structure`

### Acceptance Criteria Covered

- AC1, AC4, AC5.

### Stop Condition

- Harness is documented in durable context and all affected checks pass.

## Verification Checkpoint

- Write `.thoughts/verification/2026-06-17-dashboard-browser-regression.md`.
- Include command output and browser-smoke result.
- Confirm no temporary server remains listening on the smoke port.

## Handoff Notes

- Future slices can add more route checks to the same script once route data
  dependencies are stable.
