# Verification Audit: Runtime Controls

Date: 2026-06-17

## Scope

Verify the runtime-controls slice: local policy persistence, SDK recorder
enforcement, `onemem-trace` bridge enforcement, dashboard Apps controls, and
Context Engineering traceability.

## Result

Conditional pass.

The delivered controls are real for:

- Vercel AI and OpenAI Agents through `createTraceRecorder()`.
- Hermes, CrewAI, LiveKit, and ElevenLabs when they use the current
  `onemem-trace` CLI bridge.
- Dashboard local policy storage and `/api/runtimes`/`PATCH /api/runtimes/:id`.

Coverage still pending:

- OpenClaw's plugin-specific recorder.
- Claude Code plugin hooks.
- Codex plugin hooks.
- Hosted dashboard/server-side policy sync.
- Package-manager uninstall semantics.

## Evidence

### SDK

- `pnpm --filter @onemem/sdk-ts test`
  - Passed: 63 tests, 5 skipped integration tests.
- `pnpm --filter @onemem/sdk-ts typecheck`
  - Passed.
- `pnpm --filter @onemem/sdk-ts lint`
  - Passed with existing warnings only.
- `pnpm --filter @onemem/sdk-ts build`
  - Passed. Warnings were existing package-export condition warnings.

### Dashboard

- `pnpm --filter @onemem/dashboard test`
  - Passed: 12 tests.
- `pnpm --filter @onemem/dashboard lint`
  - Passed.
- `pnpm --filter @onemem/dashboard typecheck`
  - Passed.
- `pnpm --filter @onemem/dashboard build`
  - Passed after the final UI selector addition.

### Python Bridge Providers

- `uv run pytest --import-mode=importlib packages/provider-crewai/tests packages/provider-livekit/tests packages/provider-elevenlabs/tests packages/plugin-hermes/tests`
  - Passed: 36 tests.

### Structure

- `pnpm test:structure`
  - Passed: 143 tests.

### CLI Skip Smoke

Command used a temporary `ONEMEM_RUNTIME_CONTROLS_PATH`, paused `crewai`, and ran
`node packages/sdk-ts/bin/onemem-trace.mjs` with one buffered call.

Observed stdout:

```json
{"skipped":true,"reason":"runtime-controls","environment":"crewai","callIds":[]}
```

Observed stderr:

```text
[onemem-trace] trace skipped by runtime controls for crewai
```

No signer or network setup was required.

### Chrome Browser Proof

Using the Codex Chrome plugin against `http://localhost:4044/apps` with a
temporary policy file:

- `/apps` rendered policy file path, Codex card, pause button, and trace capture
  control.
- DOM-layer click on Codex trace capture persisted:
  - UI `aria-pressed`: `false`
  - `/api/runtimes` Codex row: `traceCapture: false`, `statusLabel: "trace off"`.
- DOM-layer click on Codex pause persisted:
  - Pause button label: `Resume Codex`
  - Trace toggle disabled: `true`
  - `/api/runtimes` Codex row: `paused: true`, `traceCapture: false`,
    `statusLabel: "paused"`.
- Server log confirmed `PATCH /api/runtimes/codex 200`.
- Temporary dashboard server was stopped and the temporary policy directory was
  removed.

## Files Touched

- `packages/sdk-ts/src/runtime-controls.ts`
- `packages/sdk-ts/src/runtime.ts`
- `packages/sdk-ts/bin/onemem-trace.mjs`
- `packages/sdk-ts/tests/runtime-controls.test.ts`
- `packages/sdk-ts/tests/recorder.test.ts`
- `packages/dashboard/lib/runtimes.ts`
- `packages/dashboard/lib/runtimes.test.ts`
- `packages/dashboard/app/api/runtimes/route.ts`
- `packages/dashboard/app/api/runtimes/[id]/route.ts`
- `packages/dashboard/app/apps/page.tsx`
- `packages/dashboard/app/apps/AppsView.tsx`
- `packages/dashboard/app/settings/SettingsView.tsx`
- `packages/provider-crewai/onemem_crewai/tracer.py`
- `packages/provider-livekit/onemem_livekit/tracer.py`
- `packages/provider-elevenlabs/onemem_elevenlabs/tracer.py`
- `packages/plugin-hermes/hermes_onemem/provider.py`

## Follow-up

- Wire runtime policy into OpenClaw, Claude Code hooks, and Codex hooks.
- Decide hosted policy storage.
- Define honest uninstall semantics before adding uninstall UI.
