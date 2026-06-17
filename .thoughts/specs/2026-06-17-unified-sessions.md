# Spec: Unified Sessions

## Objective

Upgrade the local dashboard Sessions surface from a flat recent-session list to
an honest unified daily view over multiple on-chain `TraceSession` objects.

## Background And Current Reality

The One Mem 2 prototype presents Sessions as a daily cross-runtime workspace
with runtime lanes, sub-session rows, and a "Verify ALL" product moment.
Current code renders `/sessions` as a simple list of `TraceSessionOpenedEvent`
records. The protocol does not currently expose a first-class unified-session
object, so v0.1 must be a dashboard grouping over existing on-chain sessions.

## Users

- Agent operators who want to understand a day's work across runtimes.
- Auditors who need to verify every sub-session in a grouped work window.
- Demo viewers who need to see OneMem's cross-runtime proof story quickly.

## Goals

- Group recent sessions by day and runtime using real Sui trace data.
- Render lane-style runtime activity using existing dashboard visual primitives.
- Provide a "Verify all" flow that runs real Merkle verification for each
  sub-session in the selected group.
- Clearly distinguish grouped dashboard presentation from an on-chain
  unified-session object.

## Non-goals

- Do not create a new Move object or protocol identity for unified sessions.
- Do not fake call counts or verification state before chain-walking.
- Do not implement replay/export for the full grouped session in this pass.
- Do not add runtime pause/resume, delegate-key, or share/revoke mutations.

## Requirements

- R1: `/sessions` must show at least one grouped day card when recent sessions
  exist, including day label, runtime count, sub-session count, and window.
- R2: Each grouped day must show one lane per runtime with bars derived from
  session opened timestamps.
- R3: Each sub-session row must link to its canonical `/trace/[session_id]`
  route.
- R4: Empty and error states must remain explicit.
- R5: "Verify all" must call server-side verification for the selected group's
  session IDs and display per-session success/failure/call-count results.
- R6: The UI must say the grouping is dashboard-derived when there is no
  first-class on-chain unified-session object.

## Acceptance Criteria

- AC1: With recent sessions, `/sessions` renders grouped day cards instead of a
  flat-only list.
- AC2: The page can render without sessions and still explains how to create one.
- AC3: Clicking "Verify all" performs a network request to a dashboard API route
  and displays actual verification results or a clear error.
- AC4: A failed verification for any sub-session makes the aggregate state fail.
- AC5: Focused dashboard typecheck/build and structure tests pass.
- AC6: The affected route is browser-checked after implementation.

## Constraints

- Use the existing Next.js App Router dashboard package.
- Keep source files below the repository hard cap and avoid expanding already
  near-limit files.
- Use Sui read-only data; no signer should be required.
- Keep plaintext decryption out of this flow.

## Stories Needed

- Story 1: Inspect grouped daily sessions.
- Story 2: Verify all sub-sessions in a group.
- Story 3: Understand limitations of the grouping.

## Open Questions

- Should the grouping eventually use cross-runtime parent links to infer a true
  logical run instead of a day bucket?
- Should `GET /api/sessions/unified` expose every group to hosted dashboard
  consumers, or remain local dashboard-only for now?

## Source References

- `.thoughts/research/2026-06-17-unified-sessions-gap.md`
- `.thoughts/prototype-discovery/2026-06-17-one-mem-2.md`
- `/Users/abu/Downloads/One Mem 2/Sessions.html`
