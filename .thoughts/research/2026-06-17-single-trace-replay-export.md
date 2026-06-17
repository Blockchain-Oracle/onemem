# Reality Research: Single Trace Replay Export

## Scope

Audit the dashboard trace replay flow and compare it with the existing grouped
session export implementation.

## Sources Checked

- `packages/dashboard/app/trace/[session_id]/TraceView.tsx`
- `packages/dashboard/app/trace/[session_id]/ReplayModal.tsx`
- `packages/dashboard/app/trace/[session_id]/page.tsx`
- `packages/dashboard/app/sessions/GroupedReplayModal.tsx`
- `packages/dashboard/app/api/sessions/export/route.ts`
- `packages/dashboard/lib/session-export.ts`
- `packages/dashboard/lib/session-export.test.ts`
- `packages/dashboard/scripts/browser-smoke.mjs`

## Verified Facts

- The trace page already has a `Replay session` button that opens
  `ReplayModal`.
- `ReplayModal` steps through reconstructed call metadata, content hashes,
  Walrus input IDs, and status. It has no JSON export action.
- The replay modal explicitly says full content replay is client-side via
  SessionKey; it does not attempt plaintext replay.
- Grouped sessions already have proof-scoped JSON export through
  `POST /api/sessions/export`, `buildGroupedSessionExport()`, and
  `GroupedReplayModal`.
- `buildGroupedSessionExport()` already serializes session metadata, verify
  result, call hashes, Walrus blob IDs, status labels, and proof-boundary copy.
- Dashboard `browser:smoke` verifies grouped Replay/export on `/sessions`, but
  it does not visit `/trace/[session_id]` or check single-session replay/export.

## Inferences

- The smallest honest improvement is to add a single-trace JSON export that
  reuses the existing export serialization/verification path.
- The single export should have its own schema/proof boundary so it does not
  present a one-session export as a dashboard-derived group.
- Plaintext replay/decrypt should remain out of scope. Existing per-call decrypt
  stays in the trace detail content tab.

## Unknowns And Questions

- A future richer replay could integrate explicit per-call decrypt frames, but
  that requires capability/session-key state and should not be folded into this
  metadata export slice.

## Not Included

- No plaintext export.
- No Walrus blob fetch/decrypt during export.
- No protocol changes.
