# Reality Research: Unified Sessions Gap

## Scope

Inspect the current OneMem repo and the `/Users/abu/Downloads/One Mem 2`
prototype to verify the real gap around the dashboard Sessions surface before
planning implementation.

## Sources Checked

- `.thoughts/prototype-discovery/2026-06-17-one-mem-2.md`
- `/Users/abu/Downloads/One Mem 2/Sessions.html`
- `packages/dashboard/app/sessions/page.tsx`
- `packages/dashboard/lib/trace.ts`
- `packages/dashboard/styles/dash.css`
- `contracts/onemem/sources/events.move`
- `contracts/onemem/sources/trace.move`
- `.thoughts/quality/2026-06-17-project-quality-profile.md`

## Verified Facts

- The prototype Sessions screen is a unified daily session view. It shows a
  header for "Today's work across 3 runtimes", runtime lanes, sub-sessions, and
  a "Verify ALL" drawer that walks every sub-session.
- The current dashboard `/sessions` route is a flat list of recent
  `TraceSessionOpenedEvent` rows. It links each row to `/trace/[sessionId]` and
  does not group by day or runtime.
- `packages/dashboard/styles/dash.css` already contains the prototype lane and
  sub-session classes: `.lane-gantt`, `.lane`, `.lane-track`, `.lane-bar`, and
  `.subsess-row`.
- `packages/dashboard/lib/trace.ts` already provides `fetchRecentSessions()`,
  `fetchSession()`, and Sui network/package resolution for read-only dashboard
  trace data.
- `TraceSessionOpenedEvent` includes `session_id`, `namespace_id`, `agent_id`,
  `environment`, `sdk_version`, `captured_by_address`, `started_at`, and
  `initial_merkle_root`; it does not include final `call_count`.
- `TraceSessionClosedEvent` includes `call_count`, `status`, and `ended_at`.
  The shared `TraceSession` object also has `call_count`, `status`, and
  `ended_at`.
- The project quality profile requires UI changes to build affected Next.js apps
  and browser-check affected routes with representative data.
- Relevant file sizes before implementation: `/sessions/page.tsx` is small, but
  `TraceView.tsx` and landing page are already above 300 lines and should not be
  expanded for this scope.

## Inferences

- A first production translation of the prototype can group recent sessions by
  local day and runtime using the existing opened-event list without introducing
  new storage.
- The "Verify ALL" interaction should run an explicit chain-walk request when
  clicked. Doing that lazily keeps the route load cheap and avoids claiming
  verification before it has actually happened.
- Final per-session call counts can be shown after verification because
  `verifyTraceChain()` and `fetchSession()` read the current object/events.

## Unknowns And Questions

- There is no current explicit unified-session on-chain identity. The UI can only
  present a dashboard grouping over multiple `TraceSession` objects.
- Cross-runtime causal stitching through `parent_call_id` is available at the
  trace-call level, but this pass does not prove whether all historical sessions
  have enough parent links to build a single hierarchy.

## Not Included

- Runtime pause/resume settings.
- Delegate-key mint/revoke UX.
- Share recipient mode.
- Cross-runtime inline trace hierarchy inside `/trace/[session_id]`.
