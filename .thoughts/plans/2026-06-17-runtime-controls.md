# Plan: Runtime Controls

## Inputs

- Research: `.thoughts/research/2026-06-17-runtime-controls.md`
- Spec: `.thoughts/specs/2026-06-17-runtime-controls.md`
- Stories: `.thoughts/stories/2026-06-17-runtime-controls.md`
- Prototype discovery: `.thoughts/prototype-discovery/2026-06-17-one-mem-2.md`
- Quality profile: `.thoughts/quality/2026-06-17-project-quality-profile.md`

## Assumptions

- The first enforcement boundaries are `@onemem/sdk-ts/runtime` and the
  `onemem-trace` CLI bridge because both can skip trace work before signer or
  network setup.
- Plugin-specific recorders should be adoption follow-ups rather than
  silently claimed as covered.
- The local dashboard can manage a local file policy; hosted policy sync is a
  separate product decision.

## Open Questions

- Whether the eventual hosted policy source should be Sui-backed, account-backed,
  or browser-local.
- Whether add/uninstall runtime actions should delegate to each package manager
  or stay as copyable commands.

## Phase 1: SDK Policy Helpers

### Goal

Add runtime-control persistence and recorder gating in `@onemem/sdk-ts/runtime`.

### Work

- Add runtime-control types and helpers.
- Use `ONEMEM_RUNTIME_CONTROLS_PATH` for tests and overrides.
- Persist owner-only JSON under `~/.onemem/runtime-controls.json`.
- Add `shouldTraceRuntime()` check to `createTraceRecorder()`.
- Add `shouldTraceRuntime()` check to `onemem-trace`.
- Treat structured CLI skips as intentional clears in bridge-based Python
  providers.
- Add focused tests for persistence and skip-before-client behavior.

### Checks

- `pnpm --filter @onemem/sdk-ts test`
- `pnpm --filter @onemem/sdk-ts lint`
- Python bridge tests for Hermes, CrewAI, LiveKit, and ElevenLabs.

### Acceptance Criteria Covered

- AC1, AC2, AC9, AC10.

## Phase 2: Dashboard API And UI

### Goal

Turn `/apps` into a real local control surface backed by the shared policy file.

### Work

- Add dashboard runtime metadata/helper module.
- Add `GET /api/runtimes` for rows.
- Add `PATCH /api/runtimes/[id]` for pause and trace-capture updates.
- Add Codex install metadata.
- Convert `/apps` to a server page plus client controls.

### Checks

- `pnpm --filter @onemem/dashboard test`
- `pnpm --filter @onemem/dashboard lint`
- `pnpm --filter @onemem/dashboard typecheck`
- `pnpm --filter @onemem/dashboard build`

### Acceptance Criteria Covered

- AC3, AC4, AC5, AC6, AC8.

## Phase 3: Context, Structure, Verification

### Goal

Register the slice in the Context Engineering trail and prove the delivered
behavior with focused gates.

### Work

- Update wiki status/index/log.
- Register artifacts in `tests/structure.test.ts`.
- Use the Chrome plugin for browser proof if available.
- Write verification audit with explicit coverage boundaries.

### Checks

- `pnpm test:structure`

### Acceptance Criteria Covered

- AC7, AC8, AC10.

## Verification Checkpoint

- Run focused SDK and dashboard gates.
- Run structure test.
- Browser-test `/apps` control rendering and a toggle roundtrip.
- Inspect the runtime policy file only for non-secret policy shape, not secrets.
- Write `.thoughts/verification/2026-06-17-runtime-controls.md`.
