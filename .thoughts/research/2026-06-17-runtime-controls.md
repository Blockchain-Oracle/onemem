# Reality Research: Runtime Controls

## Scope

Current reality for implementing the prototype's Apps runtime controls in the
local dashboard and shared runtime recorder without overclaiming control of every
existing integration.

## Sources Checked

- Prototype discovery:
  - `.thoughts/prototype-discovery/2026-06-17-one-mem-2.md`
- Dashboard runtime UI/API:
  - `packages/dashboard/app/apps/page.tsx`
  - `packages/dashboard/app/api/runtimes/heartbeat/route.ts`
  - `packages/dashboard/app/settings/SettingsView.tsx`
- Shared TypeScript runtime path:
  - `packages/sdk-ts/src/runtime.ts`
  - `packages/sdk-ts/bin/onemem-trace.mjs`
  - `packages/provider-vercel-ai/src/index.ts`
  - `packages/provider-openai-agents/src/index.ts`
- Other runtime paths:
  - `packages/plugin-openclaw/src/onemem-trace.ts`
  - `packages/plugin-claude-code/scripts/summarize.js`
  - `packages/provider-crewai/onemem_crewai/tracer.py`
- Existing local config pattern:
  - `packages/sdk-ts/src/credentials.ts`
  - `packages/dashboard/lib/local-credentials.ts`
- Current Next.js docs via `ctx7`:
  - `/vercel/next.js`, App Router route handlers

## Verified Facts

- The high-fidelity prototype includes Apps UI controls for adding a runtime,
  pausing/resuming, permission toggles, and uninstall.
- The current dashboard `/apps` page is a server-rendered read-only list derived
  from recent on-chain `TraceSession` events.
- Current `/apps` cards show recency status, session count, tracing badge, and
  install command, but no persisted controls.
- The dashboard already exposes `/api/runtimes/heartbeat`, but heartbeat state
  is process-local and does not represent durable runtime policy.
- `createTraceRecorder()` in `@onemem/sdk-ts/runtime` receives the runtime
  `environment` and is the shared trace-recording path for Vercel AI and
  OpenAI Agents providers.
- `onemem-trace` is the Node CLI bridge used by Hermes, CrewAI, LiveKit, and
  ElevenLabs provider packages for full-fidelity on-chain trace writes.
- OpenClaw, Claude Code, Codex, and Python provider traces do not currently use
  `createTraceRecorder()` for capture control.
- The repo already uses owner-only local files under `~/.onemem` for sensitive
  local state such as credentials and generated wallet material.
- Next.js App Router route handlers live in `app/.../route.ts` and support
  HTTP methods including `GET`, `PATCH`, and `DELETE`.

## Inferences

- The first honest runtime-controls slice should create a durable local policy
  file and wire it into the shared TypeScript recorder and the Node CLI bridge.
- Dashboard controls can be made real for the shared TS recorder and CLI bridge
  immediately while documenting that plugin-specific recorders still need
  adoption.
- Pause/resume must mean "do not create new traces for covered runtimes"; it
  cannot remove already-written on-chain traces.
- Permission toggles should start with trace capture because that has a clear
  enforcement point today.
- Adding install commands for all known runtimes, including Codex, lets `/apps`
  show configurable runtimes before they have recent sessions.

## Unknowns And Questions

- Whether each non-TS runtime should read the same policy file directly or shell
  through a shared CLI helper.
- Whether hosted dashboard users should manage runtime policy server-side later;
  this slice is local-dashboard only.
- Whether uninstall should delete runtime policy, remove local package config,
  or only hide a card. No single honest semantics exists yet.

## Not Included

- No claim that OpenClaw, Claude Code, or Codex hook recorders already obey
  runtime pause state.
- No hosted policy sync.
- No destructive uninstall behavior.
- No mutation of already-recorded Sui/Walrus data.
