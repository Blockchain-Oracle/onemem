# Verification Audit: Dashboard Browser Regression

## Verdict

Pass.

The dashboard now has a reusable repo-owned browser smoke command for the
highest-risk Sessions grouped replay/export flow. It passed locally against a
temporary dashboard server and cleaned up after itself.

## Artifacts Checked

- Research:
  `.thoughts/research/2026-06-17-dashboard-browser-regression.md`
- Spec: `.thoughts/specs/2026-06-17-dashboard-browser-regression.md`
- Stories:
  `.thoughts/stories/2026-06-17-dashboard-browser-regression.md`
- Plan: `.thoughts/plans/2026-06-17-dashboard-browser-regression.md`
- Code:
  - `packages/dashboard/scripts/browser-smoke.mjs`
  - `packages/dashboard/package.json`
  - `packages/dashboard/app/layout.tsx`
  - `packages/dashboard/public/favicon.svg`
  - `.gitignore`
  - `tests/structure.test.ts`

## Requirement Traceability

- R1 Dashboard package exposes a reusable browser smoke command:
  - `packages/dashboard/package.json` adds `browser:smoke`.
- R2 Provided base URL or temporary server:
  - `browser-smoke.mjs` supports `ONEMEM_DASHBOARD_SMOKE_BASE_URL`; otherwise
    starts `next dev` on `ONEMEM_DASHBOARD_SMOKE_PORT` or `4055`.
- R3 Chrome/Chromium through declared dependency:
  - `packages/dashboard/package.json` declares `playwright-core`.
  - `browser-smoke.mjs` locates `ONEMEM_BROWSER_EXECUTABLE`, local Chrome, or
    common Linux Chrome/Chromium paths before falling back to the Chrome channel.
- R4 Sessions shell and Replay/export:
  - Smoke asserts page title/subtitle and at least one `Replay/export` button.
- R5 Grouped replay/export modal:
  - Smoke opens the modal and asserts grouped replay title, export schema,
    download/copy controls, and proof-boundary text.
- R6 Console/resource errors:
  - Smoke records `console` errors, `pageerror`, and failed HTTP responses and
    fails the run if any are present.
- R7 Cleanup:
  - Smoke closes the browser and stops any temporary server it starts.
- R8 Durable tracking:
  - `tests/structure.test.ts` checks the smoke command, dependency, script, and
    favicon.

## Acceptance Criteria Coverage

- AC1: `pnpm --filter @onemem/dashboard browser:smoke` exists.
- AC2: Browser smoke passed locally:
  - started temporary Next server on `http://127.0.0.1:4055`
  - found 4 `Replay/export` buttons
  - opened grouped replay/export
  - asserted schema `onemem.grouped-session-export.v1`
  - asserted `Download JSON`, `Copy JSON`, and proof-boundary text
  - asserted no failed resource responses and no browser console errors
- AC3: Missing browser handling is implemented with an actionable
  `ONEMEM_BROWSER_EXECUTABLE` error path. Current machine has local Chrome at
  `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, so the failure
  path was not triggered during this verification.
- AC4: Dashboard lint, typecheck, tests, and build passed.
- AC5: Structure test passed after registering the new artifacts.

## Quality Gates

- `pnpm --filter @onemem/dashboard browser:smoke`: passed 10 checks.
- `pnpm --filter @onemem/dashboard lint`: passed.
- `pnpm --filter @onemem/dashboard typecheck`: passed.
- `pnpm --filter @onemem/dashboard test`: 6 files, 16 tests passed.
- `pnpm --filter @onemem/dashboard build`: passed.
- Temporary smoke server cleanup: no listener on port `4055`.

## Deviations From Plan

- The first smoke run failed because Chrome emitted a missing-resource console
  error. The root cause was a missing favicon. The implementation now adds an
  explicit SVG favicon and reports failed resource URLs separately.
- The first harness protects `/sessions` only. Broader route coverage remains a
  follow-up until stable fixture/seed data exists.

## Gaps And Risks

- The harness depends on real testnet Sessions data by default.
- The harness is not wired into CI yet.
- Generated screenshot artifacts are ignored under `.browser-smoke/` and are not
  retained as visual baselines.

## Follow-ups

- Decide if `browser:smoke` should become a pre-release or CI gate.
- Add `/apps`, `/memories`, and `/trace/[session_id]` checks once route fixture
  strategy is settled.
- Consider visual diff baselines after the UI stabilizes.

## Evidence Log

- Context7 Playwright docs fetched:
  - `npx ctx7@latest library Playwright "Playwright core launch Chrome browser current API docs"`
  - `npx ctx7@latest docs /microsoft/playwright "Playwright core launch chromium channel chrome navigate locator screenshot current docs"`
- Smoke command output:
  - `passed 10 checks`
  - `found 4 Replay/export button(s)`
  - `grouped export schema`
  - `download json action`
  - `copy json action`
  - `proof-boundary text`
  - `browser emitted no failed resource responses`
  - `browser console emitted no errors`
- Screenshot artifact from the successful run:
  - `packages/dashboard/.browser-smoke/sessions-grouped-replay.png`
