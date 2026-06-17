# Stories: Single Trace Replay Export

## Traceability

- R1, R2, R3: Story 1.
- R4, R5: Story 2.
- R6, R7: Story 3.

## Story 1: Reviewer Downloads Single Trace Evidence

As a reviewer,
I want to download one TraceSession as proof-scoped JSON,
so that I can inspect the session outside the dashboard without relying on UI
state.

### Acceptance Criteria

- The JSON uses `onemem.trace-session-export.v1`.
- It includes verification result, session metadata, calls, hashes, and Walrus
  blob IDs.
- It includes proof-boundary copy.

### Scenarios

- Given a trace page with a valid session
- When I open Replay session and click Download JSON
- Then the export is generated from the server route for that session.

## Story 2: Viewer Sees No-Plaintext Boundary

As a trace viewer,
I want replay/export controls to say no plaintext is exported,
so that I understand Seal/Walrus content is not being silently revealed.

### Acceptance Criteria

- The modal shows Download JSON and Copy JSON.
- The modal states no plaintext is included.
- Existing per-call decrypt remains separate.

## Story 3: Maintainer Has Regression Coverage

As a maintainer,
I want tests and browser smoke coverage,
so that future replay changes do not drop the export or weaken the proof copy.

### Acceptance Criteria

- Unit tests cover the single trace export builder.
- Browser smoke opens `/trace/[session_id]`, opens Replay session, and finds the
  single-session schema plus Download/Copy actions.

## Open Questions

- None.
