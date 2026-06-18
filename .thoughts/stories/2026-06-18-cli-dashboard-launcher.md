# Stories: CLI Dashboard Launcher

## Traceability

Stories derive from
`.thoughts/specs/2026-06-18-cli-dashboard-launcher.md` requirements R1-R6 and
acceptance criteria AC1-AC4.

## Story 1: Local Dashboard Launch

As a OneMem CLI user,
I want `onemem dashboard` to start the local dashboard,
so that demo docs and daily usage have one obvious command.

### Acceptance Criteria

- `onemem dashboard` is registered in the TS CLI.
- `--port <port>` overrides the default `4040`.
- The launcher delegates to `onemem-dashboard` rather than duplicating dashboard
  server logic.

### Scenarios

- Given `onemem-dashboard` is available, when the user runs
  `onemem dashboard --port 5050`, then the CLI spawns the dashboard binary with
  `PORT=5050`.

## Story 2: Missing Dashboard Package Guidance

As a user with only the CLI package installed,
I want a clear failure when the dashboard package is absent,
so that I know exactly what to install.

### Acceptance Criteria

- Spawn `ENOENT` is handled without a stack trace.
- The error names `@onemem/dashboard` and `onemem-dashboard`.
- The command exits non-zero.

## Story 3: Current Documentation Surface

As a maintainer,
I want docs and structure tests to reflect the actual command surface,
so that stale deferred-command claims do not return.

### Acceptance Criteria

- `packages/cli-ts/README.md`, CLI reference docs, and command-surface docs list
  `onemem dashboard` as current.
- The deferred command list no longer includes `onemem dashboard`.
- Structure tests guard the current docs.

## Open Questions

- Browser auto-open remains a separate optional UX improvement.
