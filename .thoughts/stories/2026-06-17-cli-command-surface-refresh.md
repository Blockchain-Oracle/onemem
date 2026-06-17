# Stories: CLI Command Surface Refresh

## Traceability

- R1/R2/R3: Current docs match actual TS/Python command surfaces.
- R4: Structure guard prevents deferred command headings from returning.
- R5: Context Engineering trail records the cleanup.

## Story 1: Developer Reads CLI Command Surface

As a developer,
I want the CLI command surface doc to show only commands that exist now,
so that I do not plan or test against unavailable commands.

### Acceptance Criteria

- Current TS commands match `packages/cli-ts/src/index.ts`.
- Python commands are described as read-only verify/trace/health.
- Deferred commands are outside the current command list.

### Scenarios

- Given a developer opens `command-surface.md`,
  when they read a command heading,
  then the command is registered in the current CLI or explicitly scoped to the
  Python mirror.

### Notes

- This story does not add CLI commands.

## Story 2: Agent Runs Structure Guard

As a future agent,
I want structure tests to fail when a deferred command is documented as current,
so that docs do not silently drift back to the old planned surface.

### Acceptance Criteria

- The guard rejects current headings for known deferred commands.
- `pnpm test:structure` passes after the cleanup.

### Scenarios

- Given `command-surface.md` contains `### onemem dashboard`,
  when structure tests run,
  then the test fails because the unified TS CLI does not register that command.

## Open Questions

- None blocking.
