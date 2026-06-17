# Stories: Memory Origin Verification

## Traceability

- Spec: `.thoughts/specs/2026-06-17-memory-origin-verification.md`
- Research: `.thoughts/research/2026-06-17-memory-origin-verification.md`

## Story 1: Auditor Verifies Memory Origin

As an auditor,
I want to verify the trace session that produced a selected memory,
so that I can confirm the memory event is anchored into an intact Merkle chain.

### Acceptance Criteria

- Given I open a memory drawer, then I can trigger origin verification.
- Given verification succeeds, then I see a verified state with call count and
  trace status.
- Given verification succeeds, then the UI still states that plaintext and
  semantic correctness are not proven.

### Scenarios

- Open `/memories`, select a memory, click "Verify originating trace", observe a
  verified result from `/api/sessions/verify`.

## Story 2: Auditor Sees Failed Verification

As an auditor,
I want failed verification to be visible,
so that I do not trust a broken or unavailable trace.

### Acceptance Criteria

- Given the verify API returns `ok: false`, then the drawer shows a failed state.
- Given the result contains `brokenAt`, then the drawer shows the broken call.
- Given the request fails, then the drawer shows request failure instead of
  silently passing.

## Story 3: Selected Memory Changes Reset Verification

As a user moving through related memory metadata,
I want each selected memory's verification state to be separate,
so that a previous verified state does not carry over to a different memory.

### Acceptance Criteria

- Given I verify one memory and then select another memory, then the new drawer
  state starts unverified.
- Given I verify the new memory, then the request uses the new memory's
  `sessionId`.

## Open Questions

- None blocking this slice.
