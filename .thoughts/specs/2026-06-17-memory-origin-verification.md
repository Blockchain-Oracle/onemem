# Spec: Memory Origin Verification

## Objective

Let a dashboard user verify the originating TraceSession for a selected memory
event directly from the memory drawer.

## Background And Current Reality

The Memories route exposes chain-anchored memory provenance, but selected memory
verification currently requires leaving the drawer for the trace page. The
dashboard already has a server API for verifying arbitrary TraceSession IDs.

## Users

- Auditors inspecting whether a memory event is anchored into a valid trace.
- Demo users evaluating OneMem's proof boundary.

## Goals

- Add an explicit drawer action to verify the selected memory's originating
  session.
- Reuse the existing `/api/sessions/verify` endpoint.
- Display loading, success, failure, and request-error states.
- Keep proof-boundary language honest.

## Non-goals

- Do not verify memory plaintext.
- Do not auto-verify every row or every drawer open.
- Do not change the underlying verifier or API contract.

## Requirements

- R1: The drawer must expose a user-triggered action to verify
  `memory.sessionId`.
- R2: The action must call `POST /api/sessions/verify` with exactly the selected
  session id.
- R3: The drawer must render success, failed verification, and request-error
  states distinctly.
- R4: Verification output must show at least session id, call count, status, and
  broken call index when present.
- R5: Changing the selected memory must reset stale verification state.
- R6: Copy must state that verification proves TraceSession Merkle integrity, not
  plaintext or semantic correctness.

## Acceptance Criteria

- AC1: `/memories` renders the verify-origin action in the drawer.
- AC2: Clicking the action sends the selected `sessionId` to the existing verify
  API.
- AC3: The drawer shows verified, failed, or request-failed state from the real
  API response.
- AC4: Existing memory filters and related metadata behavior remain unchanged.
- AC5: Focused dashboard tests/typecheck/lint/build pass.
- AC6: `/memories` HTTP-render check passes.

## Constraints

- UI must stay read-only and must not imply plaintext proof.
- Use existing dashboard visual primitives where practical.
- Keep source files under the repository's line-count guard.

## Stories Needed

- Story 1: Auditor verifies memory origin.
- Story 2: Auditor sees a failed origin verification.
- Story 3: User changes selected memory without stale verification state.

## Open Questions

- Whether to add auto-verification after a stable browser test harness exists.

## Source References

- `.thoughts/research/2026-06-17-memory-origin-verification.md`
- `.thoughts/verification/2026-06-17-memory-provenance.md`
