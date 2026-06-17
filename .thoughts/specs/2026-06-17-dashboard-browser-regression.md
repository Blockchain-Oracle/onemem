# Spec: Dashboard Browser Regression

## Objective

Add a reusable repo-owned browser smoke harness for the dashboard so important
prototype-derived UI flows can be rechecked without relying only on one-off
manual Chrome-plugin sessions.

## Background And Current Reality

The dashboard has unit tests, builds successfully, and has manual Chrome-plugin
verification artifacts for recent UI slices. It does not yet have a committed
browser smoke command. The next highest-value target is the `/sessions`
grouped replay/export flow because it spans server rendering, client action,
API route, real Sui reads, and browser console health.

## Users

- Codex agents continuing autonomous UI work.
- Maintainers running local pre-demo checks.
- Reviewers checking that `/sessions` still exposes grouped replay/export.

## Goals

- G1: Provide a single package script that runs a real-browser dashboard smoke.
- G2: Start a local dashboard server automatically unless a base URL is supplied.
- G3: Verify `/sessions` renders real grouped data and opens the grouped
  replay/export modal.
- G4: Fail on browser console errors.
- G5: Avoid broad new framework setup until repeated coverage needs justify it.

## Non-goals

- No CI workflow wiring in this pass.
- No screenshot diff or visual baseline storage.
- No hosted login, wallet, or auth testing.
- No broad route matrix beyond the highest-risk Sessions flow.

## Requirements

- R1: Dashboard package must expose a reusable browser smoke command.
- R2: The smoke command must run against either a provided base URL or a
  temporary local dashboard server.
- R3: The smoke command must launch Chrome/Chromium via a declared dependency.
- R4: The smoke command must assert `/sessions` page shell and at least one
  `Replay/export` button.
- R5: The smoke command must open grouped replay/export and assert schema,
  download/copy controls, and proof-boundary text.
- R6: The smoke command must fail if browser console errors are emitted.
- R7: The smoke command must clean up any browser/server process it starts.
- R8: Verification artifacts and structure tests must track the new slice.

## Acceptance Criteria

- AC1: `pnpm --filter @onemem/dashboard browser:smoke` exists.
- AC2: The smoke command passes locally against the current dashboard/testnet
  data.
- AC3: The command exits non-zero with actionable text when Chrome is missing.
- AC4: Dashboard lint/typecheck/build/test continue passing.
- AC5: `pnpm test:structure` tracks the new context artifacts.

## Constraints

- Chrome plugin remains the preferred interactive manual check in Codex.
- The harness is committed regression coverage and may use `playwright-core`.
- Do not log secrets or inspect browser storage.
- Keep the harness deterministic and focused; do not scrape broad page bodies.

## Stories Needed

- Story 1: Maintainer runs browser smoke.
- Story 2: Agent catches grouped replay regression.
- Story 3: Harness fails clearly when the browser runtime is unavailable.

## Open Questions

- When should this become a CI gate?
- Which routes should be added after stable fixture or seeded testnet data exists?

## Source References

- Research: `.thoughts/research/2026-06-17-dashboard-browser-regression.md`
- Quality profile: `.thoughts/quality/2026-06-17-project-quality-profile.md`
- Dashboard context: `packages/dashboard/CLAUDE.md`
