# Spec: Grouped Session Replay Export

## Objective

Add a real grouped replay/export capability for dashboard-derived unified
session groups so an auditor can inspect or save a cross-runtime work day as
one proof-scoped artifact.

## Background And Current Reality

The dashboard already groups raw `TraceSession` objects by local day/runtime and
can verify all sub-sessions in a group. The Trace page already replays a single
session from on-chain metadata. The missing prototype delta is grouped replay
and export over the existing sub-session list.

## Users

- Operators reviewing a multi-runtime work period.
- Auditors who need a portable proof summary.
- Developers testing runtime integrations across several TraceSessions.

## Goals

- G1: Provide grouped replay over the underlying TraceSessions in a unified
  session group.
- G2: Provide an exportable JSON artifact for the same group.
- G3: Preserve honest proof boundaries: exported/replayed content is on-chain
  metadata and hashes, not decrypted plaintext.
- G4: Reuse existing session IDs and trace verification; do not create a new
  protocol concept.

## Non-goals

- No Move protocol changes.
- No plaintext replay.
- No server-side Seal decryption.
- No hosted dashboard auth/session changes.
- No downloadable PDF or rich report format in this pass.

## Requirements

- R1: The Sessions page must expose grouped replay/export actions for each group.
- R2: The grouped replay UI must show ordered sub-session calls with runtime,
  session, tool, timing, status, content hash, and Walrus blob identifiers where
  available.
- R3: The grouped export must include group metadata, source session IDs, per
  session metadata, call metadata, verification summaries, and proof-boundary
  text.
- R4: The route/API layer must reject missing or invalid session ID input.
- R5: The export must cap requested session IDs to the same bounded safety model
  as grouped verification.
- R6: The implementation must remain read-only: Sui reads and event decoding
  only.
- R7: Tests must cover export shape and proof-boundary behavior.

## Acceptance Criteria

- AC1: A grouped Sessions card has a visible replay/export action.
- AC2: Triggering the action opens a grouped replay dialog/drawer with fetched
  sub-session metadata.
- AC3: The UI can download/copy a JSON export generated from real fetched
  session data.
- AC4: The export response contains `proofBoundary` text stating that plaintext
  and real-world correctness are not proven.
- AC5: Invalid API input returns a 400 response.
- AC6: Focused dashboard unit tests pass.
- AC7: Dashboard lint/typecheck/build and structure checks pass.
- AC8: A browser check proves the `/sessions` UI renders the grouped export
  action.

## Constraints

- Use current Next.js App Router route-handler patterns.
- Keep source files under the repo structure line cap.
- Reuse `fetchSession()` and existing verification logic.
- Keep current unified-session language: dashboard grouping only.

## Stories Needed

- Story 1: Grouped metadata replay.
- Story 2: Portable proof JSON export.
- Story 3: Honest failure and proof-boundary states.

## Open Questions

- Should future exports be signed by the local signer as a separate audit
  receipt?
- Should public verifier pages accept grouped export JSON as input?

## Source References

- Research: `.thoughts/research/2026-06-17-grouped-session-replay-export.md`
- Prototype discovery: `.thoughts/prototype-discovery/2026-06-17-one-mem-2.md`
- Unified sessions spec: `.thoughts/specs/2026-06-17-unified-sessions.md`
