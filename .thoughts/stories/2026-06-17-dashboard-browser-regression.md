# Stories: Dashboard Browser Regression

## Traceability

- Spec: `.thoughts/specs/2026-06-17-dashboard-browser-regression.md`
- Research: `.thoughts/research/2026-06-17-dashboard-browser-regression.md`

## Story 1: Maintainer Runs Browser Smoke

As a maintainer,
I want one command to run the dashboard Sessions smoke in a real browser,
so that I can recheck the demo-critical flow before a demo or review.

### Acceptance Criteria

- Covers R1, R2, R3, R7 and AC1, AC2.
- The command starts a local dashboard server when no base URL is supplied.
- The command can also target an existing server through an environment variable.
- The command closes its browser and temporary server.

### Scenarios

- Given no dashboard server is running, when I run the browser smoke command,
  then it starts a temporary server, runs checks, and stops it.
- Given `ONEMEM_DASHBOARD_SMOKE_BASE_URL` is set, when I run the command, then it
  uses that URL and does not start a server.

### Notes

- This is committed regression coverage, not a replacement for Codex Chrome
  plugin manual inspection after UI work.

## Story 2: Agent Catches Grouped Replay Regression

As a coding agent,
I want the smoke command to verify grouped replay/export,
so that missing buttons, broken route wiring, or modal failures are caught before
claiming UI work is done.

### Acceptance Criteria

- Covers R4, R5, R6 and AC2, AC4.
- The harness asserts `Replay/export`, export schema, copy/download controls, and
  proof-boundary text.
- Browser console errors fail the run.

### Scenarios

- Given `/sessions` renders grouped TraceSession data, when the harness runs,
  then it opens grouped replay/export and validates the modal content.
- Given client code throws or logs an error, when the harness runs, then it fails.

### Notes

- The first smoke target intentionally protects the newest and most integrated
  dashboard flow.

## Story 3: Clear Browser Runtime Failure

As a developer on a fresh machine,
I want a clear error when Chrome/Chromium is unavailable,
so that I know how to make the smoke harness runnable.

### Acceptance Criteria

- Covers R3 and AC3.
- The error mentions `ONEMEM_BROWSER_EXECUTABLE` and common Chrome/Chromium
  expectations.

### Scenarios

- Given no supported browser binary exists, when I run the smoke command, then
  it exits non-zero with setup guidance.

### Notes

- The harness should not silently skip; skipped browser coverage creates false
  confidence.

## Open Questions

- Should future route smoke checks run against recorded fixtures instead of live
  Sui testnet data?
