# Stories: Unified Sessions

## Traceability

- Spec: `.thoughts/specs/2026-06-17-unified-sessions.md`
- Prototype discovery: `.thoughts/prototype-discovery/2026-06-17-one-mem-2.md`
- Research: `.thoughts/research/2026-06-17-unified-sessions-gap.md`

## Story 1: Inspect Grouped Daily Sessions

As an agent operator,
I want recent sessions grouped by day and runtime,
so that I can understand what happened across tools without opening each trace
one by one.

### Acceptance Criteria

- Covers R1, R2, R3, R4, and R6.
- Day cards show runtime count, sub-session count, and time window.
- Runtime lanes and sub-session rows are built from real recent session data.
- Each sub-session row links to `/trace/[session_id]`.

### Scenarios

- Given recent sessions exist, when I open `/sessions`, then I see grouped day
  cards and runtime lanes.
- Given no sessions exist, when I open `/sessions`, then I see an empty state
  with a concrete command path to create traces.

### Notes

The grouping is a dashboard view, not a new on-chain object.

## Story 2: Verify All Sub-sessions

As an auditor,
I want to verify every sub-session in a grouped day,
so that I can trust the group only after every underlying chain verifies.

### Acceptance Criteria

- Covers R5.
- Clicking "Verify all" triggers a server-side API request with the group's
  session IDs.
- The result lists each session with verified/failed status and call count.
- The aggregate state fails if any sub-session fails.

### Scenarios

- Given all sub-sessions verify, when verification completes, then the group is
  marked verified and each row shows success.
- Given one sub-session fails, when verification completes, then the group is
  marked failed and the failed session is visible.

### Notes

The UI must not mark a group verified before the server returns verification
results.

## Story 3: Understand Grouping Limits

As a demo viewer,
I want the Sessions page to explain what the grouping proves and does not prove,
so that I do not mistake a dashboard day bucket for a protocol-level unified
session.

### Acceptance Criteria

- Covers R6.
- The page includes concise copy that the group is derived from recent on-chain
  TraceSession events.
- Verification copy states that plaintext and real-world correctness are not
  proven by this flow.

### Scenarios

- Given I inspect a grouped day, when I read its proof copy, then I understand
  that verification walks each underlying TraceSession.

### Notes

This mirrors the public verifier's "proven / not proven" honesty rule.

## Open Questions

- Whether a future version should group by explicit parent-call lineage instead
  of local calendar day.
