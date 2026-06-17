# Reality Research: Dashboard Browser Regression

## Scope

Current reality for adding reusable browser regression coverage to the local
dashboard, focused on the `/sessions` grouped replay/export flow that currently
requires manual Chrome-plugin proof after UI changes.

## Sources Checked

- `.thoughts/wiki/context-engineering-status.md`
- `.thoughts/prototype-discovery/2026-06-17-one-mem-2.md`
- `packages/dashboard/CLAUDE.md`
- `packages/dashboard/package.json`
- `packages/dashboard/app/sessions/SessionsView.tsx`
- `packages/dashboard/app/sessions/GroupedReplayModal.tsx`
- `packages/dashboard/app/api/sessions/export/route.ts`
- `package.json`
- `turbo.json`
- Context7 Playwright docs:
  - `npx ctx7@latest library Playwright "Playwright core launch Chrome browser current API docs"`
  - `npx ctx7@latest docs /microsoft/playwright "Playwright core launch chromium channel chrome navigate locator screenshot current docs"`

## Verified Facts

- The active queue still includes reusable browser regression coverage.
- `packages/dashboard/CLAUDE.md` requires Chrome plugin checks before claiming UI
  work done and permits a separate repo-owned browser harness for committed
  regression coverage.
- The dashboard package currently has unit tests via Vitest and no committed
  browser smoke script.
- `playwright-core` was present in the pnpm store transitively, but not linked
  for dashboard imports until it was declared in `packages/dashboard`.
- Official Playwright library-mode docs show the relevant flow: launch Chromium,
  open a page, navigate, optionally capture screenshots, close the browser.
- Local macOS has Google Chrome installed at
  `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`.
- The grouped replay/export flow is visible and browser-verifiable on
  `/sessions` when testnet TraceSession data is reachable.

## Inferences

- A small script using `playwright-core` can provide reusable local browser
  regression coverage without introducing the full `@playwright/test` framework.
- The harness should start a temporary dashboard server when no base URL is
  supplied so it can run from a package script.
- The harness should fail on browser console errors and missing grouped
  replay/export controls.

## Unknowns And Questions

- Whether CI runners for this project will always have Chrome or Chromium
  installed. The harness should support an explicit executable-path env var.
- Whether future browser coverage should expand to `/apps`, `/memories`, and
  `/trace/[session_id]` once stable seeded data exists.

## Not Included

- Full visual regression screenshots.
- A Playwright test-runner config.
- CI wiring.
- Browser coverage for hosted-only auth flows.
