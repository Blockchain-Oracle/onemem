# Stories: Grouped Session Replay Export

## Traceability

- Spec: `.thoughts/specs/2026-06-17-grouped-session-replay-export.md`
- Research: `.thoughts/research/2026-06-17-grouped-session-replay-export.md`

## Story 1: Grouped Metadata Replay

As an operator,
I want to replay a unified session group across sub-sessions,
so that I can review the cross-runtime sequence without opening every trace one
by one.

### Acceptance Criteria

- Covers R1, R2, R6 and AC1, AC2.
- Replay fetches metadata for every selected sub-session.
- Replay presents calls in a deterministic order across sessions.
- Replay says the group is dashboard-derived, not a protocol object.

### Scenarios

- Given a group with multiple sub-sessions, when I open grouped replay, then I
  see session rows and call rows with runtime/tool/status/hash metadata.
- Given a group fetch partially fails, when I open grouped replay, then failed
  sub-sessions are shown as unavailable instead of hiding them.

### Notes

- No plaintext replay in this slice.

## Story 2: Portable Proof JSON Export

As an auditor,
I want a downloadable JSON export of the grouped session,
so that I can preserve the proof metadata outside the dashboard.

### Acceptance Criteria

- Covers R3, R5 and AC3, AC4.
- Export includes source session IDs, calls, content hashes, Walrus blob IDs,
  Merkle verification summary, and a generated timestamp.
- Export includes proof-boundary copy.

### Scenarios

- Given a grouped replay has loaded, when I choose export, then the browser saves
  a JSON file representing the loaded group.

### Notes

- JSON is the only export format in this pass.

## Story 3: Honest Invalid And Empty States

As a developer testing the dashboard,
I want invalid export inputs and no-call groups to be explicit,
so that failures are debuggable and not confused with verified empty proof.

### Acceptance Criteria

- Covers R4, R7 and AC5, AC6, AC7.
- API rejects missing or non-string session IDs.
- Replay handles groups whose fetched sessions have zero calls.

### Scenarios

- Given the API receives no session IDs, when it processes the request, then it
  returns a 400 error.
- Given a session has zero decoded calls, when grouped replay loads, then its
  session still appears with zero calls.

### Notes

- This is distinct from a broken Merkle verification state.

## Open Questions

- Should grouped replay later support range filtering inside a day group?
