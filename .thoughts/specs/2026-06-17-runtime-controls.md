# Spec: Runtime Controls

## Objective

Add durable local runtime controls to OneMem so the dashboard Apps page can pause
or resume trace capture for supported runtimes and the shared TypeScript runtime
recorder honors that policy before writing new trace sessions.

## Background And Current Reality

The prototype expects Apps to act like a control surface, but the current
dashboard only displays runtime activity derived from on-chain traces. The repo
does have a shared TypeScript runtime recorder used by framework providers,
which gives this slice a concrete enforcement point.

## Users

- Local dashboard users managing which runtime integrations can emit traces.
- OneMem developers validating prototype parity without fake controls.
- Framework-provider users who rely on `@onemem/sdk-ts/runtime`.

## Goals

- Add a local runtime policy file under `~/.onemem`.
- Let the dashboard list known runtimes even when they have no recent traces.
- Let users pause/resume a runtime from `/apps`.
- Let users toggle trace capture permission from `/apps`.
- Make `createTraceRecorder()` skip new trace writes when the runtime is paused
  or trace capture is disabled.
- Make `onemem-trace` skip before signer/network setup when the runtime is
  paused or trace capture is disabled.
- Keep the UI honest about coverage boundaries.

## Non-goals

- Do not implement package uninstall.
- Do not delete or mutate existing trace sessions.
- Do not claim every runtime package obeys the policy in this slice.
- Do not add hosted policy sync.
- Do not add fake add-runtime provisioning flows.

## Requirements

- R1: Define runtime-control types and helpers in the SDK runtime entrypoint.
- R2: Store policy in an owner-only local JSON file.
- R3: Default missing runtimes to active trace capture.
- R4: `createTraceRecorder()` must check policy before resolving signer,
  provisioning namespace, or writing a trace.
- R5: `onemem-trace` must check policy before resolving signer, provisioning
  namespace, or writing a trace.
- R6: Python providers that shell out to `onemem-trace` must treat a structured
  policy skip as intentional and clear their buffers.
- R7: Dashboard API must expose runtime rows with session counts, recency, install
  commands, and policy state.
- R8: Dashboard API must accept a validated `PATCH` for pause and trace-capture
  changes.
- R9: `/apps` must render interactive pause/resume and trace-capture controls.
- R10: Known runtime metadata must include the Codex plugin.
- R11: Tests must cover policy persistence and SDK/CLI-bridge gating behavior.
- R12: Verification artifacts must state which runtimes are covered now and which
  are adoption follow-ups.

## Acceptance Criteria

- AC1: `pnpm --filter @onemem/sdk-ts test` passes.
- AC2: `pnpm --filter @onemem/sdk-ts lint` passes.
- AC3: `pnpm --filter @onemem/dashboard test` passes.
- AC4: `pnpm --filter @onemem/dashboard lint` passes.
- AC5: `pnpm --filter @onemem/dashboard typecheck` passes.
- AC6: `pnpm --filter @onemem/dashboard build` passes.
- AC7: `pnpm test:structure` passes.
- AC8: A browser proof shows `/apps` controls render and can toggle persisted
  policy.
- AC9: A unit test proves a paused runtime causes `createTraceRecorder()` to skip
  trace work before client creation.
- AC10: A CLI smoke proves `onemem-trace` returns a structured policy skip before
  signer/network setup.

## Constraints

- Use current Next.js route-handler docs for API route shape.
- Keep local policy separate from credentials and never print secrets.
- Keep controls scoped to local dashboard behavior unless hosted support is
  explicitly designed.

## Stories Needed

- Dashboard user pauses a runtime.
- Dashboard user disables trace capture permission.
- SDK user gets no new trace writes while a runtime is paused.

## Source References

- `.thoughts/research/2026-06-17-runtime-controls.md`
- `.thoughts/prototype-discovery/2026-06-17-one-mem-2.md`
- `packages/dashboard/app/apps/page.tsx`
- `packages/sdk-ts/src/runtime.ts`
