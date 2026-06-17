# Reality Research: Grouped Session Replay Export

## Scope

Current reality for adding grouped replay/export to dashboard-derived unified
session groups. This covers the local dashboard Sessions and Trace surfaces,
existing trace readers, and relevant App Router route-handler behavior.

## Sources Checked

- `.thoughts/prototype-discovery/2026-06-17-one-mem-2.md`
- `.thoughts/specs/2026-06-17-unified-sessions.md`
- `packages/dashboard/lib/sessions.ts`
- `packages/dashboard/lib/trace.ts`
- `packages/dashboard/app/sessions/SessionsView.tsx`
- `packages/dashboard/app/sessions/VerifyAllDrawer.tsx`
- `packages/dashboard/app/trace/[session_id]/ReplayModal.tsx`
- `packages/dashboard/app/api/sessions/verify/route.ts`
- `packages/mcp-server/src/index.ts`
- Context7 Next.js docs lookup:
  `npx ctx7@latest docs /vercel/next.js "App Router route handler POST JSON response current docs"`

## Verified Facts

- Prototype discovery names `Trace.html` as containing trace replay and
  `Sessions.html` as containing cross-runtime grouped sessions and Verify ALL.
- The Unified Sessions spec explicitly excluded full grouped replay/export from
  the first pass.
- `packages/dashboard/lib/sessions.ts` currently groups recent on-chain
  `TraceSessionOpenedEvent` rows into local-day groups. Each group contains
  canonical underlying `sessionId` values and makes clear it is not a protocol
  object.
- `verifySessions()` already accepts a list of session IDs and verifies each
  underlying TraceSession with `fetchSession()`.
- `packages/dashboard/lib/trace.ts` can fetch a single TraceSession, decode
  emitted/closed call events, and return verifier output. It reads Sui objects
  and events only; it does not require a signer, Walrus plaintext, or Seal
  decryption.
- The Trace page has a single-session `ReplayModal` that steps through on-chain
  metadata: tool name, namespace, timing, content hash, Walrus input blob, and
  status. Its comment states that full content replay waits for the SessionKey
  flow.
- The Sessions page currently exposes Verify all only. It has no grouped replay
  or export action.
- The MCP server already exposes `onemem_replay_session` for one session by
  calling `onemem.traces.replaySession(sessionId)`.
- Current Next.js App Router route handlers can parse POST JSON with
  `request.json()` and return JSON with `Response.json()` / `NextResponse.json()`.

## Inferences

- A grouped replay/export can be implemented safely as a dashboard aggregation
  over existing session IDs without changing the Move protocol.
- The first correct export format is proof-scoped JSON: sessions, calls, hashes,
  blobs, statuses, Merkle verification summary, and proof-boundary language.
- A grouped replay UI should mirror the single-session replay scope: on-chain
  metadata only, no plaintext claim and no server-side decryption.

## Unknowns And Questions

- Whether grouped replay should later include plaintext when a client-side Seal
  SessionKey flow exists.
- Whether grouped exports should be signed as a separate attestation object in a
  later protocol version.
- Whether hosted dashboard should support the same export once auth/session
  boundaries are implemented there.

## Not Included

- New Move objects for unified sessions.
- Plaintext decryption or Walrus blob fetches.
- Hosted account/session storage.
- Owner-driven share/revoke changes.
