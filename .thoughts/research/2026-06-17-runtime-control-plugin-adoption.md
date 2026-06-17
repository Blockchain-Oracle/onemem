# Reality Research: Runtime-Control Plugin Adoption

## Scope

Current reality for applying local runtime controls to the remaining
plugin-specific OneMem trace paths: OpenClaw, Claude Code hooks, and Codex hooks.

## Sources Checked

- Current status:
  - `.thoughts/wiki/context-engineering-status.md`
  - `.thoughts/verification/2026-06-17-runtime-controls.md`
- Existing runtime-control implementation:
  - `packages/sdk-ts/src/runtime-controls.ts`
  - `packages/dashboard/lib/runtimes.ts`
- OpenClaw plugin:
  - `packages/plugin-openclaw/src/onemem-trace.ts`
  - `packages/plugin-openclaw/tests/unit.test.ts`
- Codex plugin:
  - `packages/plugin-codex/scripts/inject.js`
  - `packages/plugin-codex/scripts/observe.js`
  - `packages/plugin-codex/scripts/summarize.js`
  - `packages/plugin-codex/scripts/onemem-lib.mjs`
  - `packages/plugin-codex/tests/plugin.test.ts`
- Claude Code plugin:
  - `packages/plugin-claude-code/scripts/inject.js`
  - `packages/plugin-claude-code/scripts/observe.js`
  - `packages/plugin-claude-code/scripts/summarize.js`
  - `packages/plugin-claude-code/scripts/onemem-lib.mjs`
  - `packages/plugin-claude-code/tests/plugin.integration.test.ts`

## Verified Facts

- Runtime Controls already persists local policy under
  `~/.onemem/runtime-controls.json` or `ONEMEM_RUNTIME_CONTROLS_PATH`.
- `createTraceRecorder()` and `onemem-trace` already call `shouldTraceRuntime()`
  before signer/network work.
- Dashboard `/apps` still marks OpenClaw, Claude Code, and Codex as stored-only
  coverage.
- OpenClaw has a long-lived `TraceRecorder` that buffers calls in memory and
  calls `OneMem.create()`, `ensureTarget()`, and `recordSession()` in `end()`.
- OpenClaw currently buffers calls even if runtime policy is paused and does not
  call `shouldTraceRuntime()`.
- Codex `inject.js` opens a trace session at `SessionStart` when namespace/RW
  cap config exists.
- Codex `observe.js` buffers tool calls only when a session state file exists.
- Codex `summarize.js` reads buffered calls, loads a client, appends calls, ends
  the session, and clears state/buffer after success.
- Claude Code `inject.js` opens a trace session at `SessionStart` when config
  exists.
- Claude Code `observe.js` buffers tool calls only when a state file exists.
- Claude Code `summarize.js` drains tool calls before loading the client, which
  means client/setup failure loses the local buffer.
- Claude Code state currently uses a fixed `~/.onemem/cc-sessions` directory;
  Codex already supports plugin data directory overrides.

## Inferences

- OpenClaw should check runtime policy both before buffering and before flushing,
  because policy may change between a captured call and `agent_end`.
- Codex and Claude should check policy at `SessionStart` before opening any
  on-chain session.
- Codex and Claude should also check policy before buffering and before final
  flush so mid-session pause stops further content capture.
- Claude Code should gain non-destructive buffer helpers so policy skips and
  client failures are distinguishable from successful drains.
- Once these checks exist, dashboard metadata can mark OpenClaw, Claude Code,
  and Codex controls as enforced.

## Unknowns And Questions

- If a user pauses after a hook already opened an on-chain TraceSession, the
  safest no-new-content behavior is to clear local buffers and state. This does
  not retroactively delete or amend the already-open on-chain session.
- Live Claude/Codex trusted hook sessions are still separate proof paths; this
  slice can unit-test hook scripts by simulation.

## Not Included

- No hosted runtime policy sync.
- No owner-driven revoke or hosted share/revoke UX.
- No package uninstall semantics.
- No claim that a mid-session pause can remove an already-open on-chain
  TraceSession.
