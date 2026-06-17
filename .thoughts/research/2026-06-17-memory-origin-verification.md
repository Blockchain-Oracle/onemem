# Reality Research: Memory Origin Verification

## Scope

Determine whether the dashboard can verify a selected memory event's originating
TraceSession from the memory drawer without inventing a new verifier or claiming
plaintext proof.

## Sources Checked

- `packages/dashboard/app/memories/MemoryDrawer.tsx`
- `packages/dashboard/app/memories/MemoriesView.tsx`
- `packages/dashboard/app/api/sessions/verify/route.ts`
- `packages/dashboard/lib/sessions.ts`
- `packages/dashboard/lib/memory-view.ts`
- `.thoughts/verification/2026-06-17-memory-provenance.md`

## Verified Facts

- `MemoryDrawer` already receives a full `MemoryRef`, including `sessionId`,
  `callId`, hashes, namespace, and transaction data.
- The drawer links to `/trace/[session_id]`, but it does not verify the session
  inline.
- `POST /api/sessions/verify` already accepts `{ sessionIds: string[] }` and
  returns `VerifySessionsResponse`.
- `verifySessions()` deduplicates ids, calls `fetchSession()`, and returns
  per-session results with `ok`, `callCount`, `statusLabel`, `brokenAt`, and
  `error`.
- `VerifyAllDrawer` already validates the verify API response in a client
  component.
- The previous Memory Provenance verification audit lists lazy selected-session
  verification as an explicit follow-up.

## Inferences

- The drawer can reuse `/api/sessions/verify` for a single selected
  `memory.sessionId`.
- Inline verification should remain user-triggered to avoid extra chain reads
  for every drawer open.
- The UI must keep the existing proof boundary: session verification proves
  Merkle integrity for the originating trace, not plaintext or semantic truth.

## Unknowns And Questions

- Whether future UX should auto-run verification on drawer open.
- Whether a later browser automation harness should cover the drawer click path.

## Not Included

- No new trace verifier.
- No memory plaintext decrypt.
- No semantic memory correctness validation.
