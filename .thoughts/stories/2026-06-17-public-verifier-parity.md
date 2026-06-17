# Stories: Public Verifier Prototype Parity

Date: 2026-06-17

## Story 1: Verify Without Login

As an external auditor,
I want to open a public verification URL without signing in,
so that I can independently inspect a trace's chain integrity.

Acceptance:

- The page renders without wallet/account state.
- Missing sessions show a clear failure state.
- Successful sessions show a verified badge and Suiscan link.

## Story 2: Understand Proof Boundaries

As a non-expert viewer,
I want to see exactly what OneMem proves and does not prove,
so that I do not confuse trace integrity with plaintext or real-world action
truth.

Acceptance:

- The page has separate Proven and Not proven sections.
- Not proven includes plaintext, agent intent, and real-world correctness.
- Proven includes sequence integrity, hash chain integrity, and Sui root anchor.

## Story 3: Inspect Call Evidence

As an auditor,
I want the call list to reflect all matching events for the session,
so that long or older sessions do not appear empty because of a shallow global
event query.

Acceptance:

- Event query follows pagination until exhausted.
- Call count mismatch is surfaced honestly.
- Per-call rows show sequence, namespace/tool, and call ID.
