# Stories: Dashboard Status Refresh

## Traceability

- R1/R2: Accurate status table in dashboard README.
- R3: Structure guard.
- R4: Context Engineering trail.

## Story 1: Developer Reads Dashboard Status

As a developer,
I want the dashboard README to show which local and hosted surfaces are built,
so that I do not plan work from stale pending labels.

### Acceptance Criteria

- The README marks current local routes as built.
- The README marks current hosted routes and APIs as built where code exists.
- The README keeps Walrus Sites mirror pending unless proven otherwise.

### Scenarios

- Given a developer opens the dashboard README,
  when they inspect the implementation-status table,
  then built routes are not shown as pending.

### Notes

- This is a docs/status story only.

## Story 2: Agent Runs Structure Guard

As a future agent,
I want structure tests to catch stale dashboard pending statuses,
so that route status drift does not return silently.

### Acceptance Criteria

- `pnpm test:structure` fails if the dashboard README marks known built routes
  as pending.
- `pnpm test:structure` passes after the README is corrected.

### Scenarios

- Given the dashboard README claims `/login` is pending,
  when structure tests run,
  then the stale status guard fails.

### Notes

- The guard should stay narrow and avoid asserting unverified deploy claims.

## Open Questions

- None for this cleanup slice.
