# Spec: Runtime-Control Plugin Adoption

## Objective

Make OpenClaw, Claude Code, and Codex trace capture obey OneMem runtime controls
so the dashboard Apps controls are enforced across all current first-party
runtime capture paths.

## Background And Current Reality

Runtime Controls already works for `createTraceRecorder()` users and
`onemem-trace` bridge users. The remaining first-party runtimes use
plugin-specific recorders or hooks, so dashboard controls are currently stored
for those paths but not enforced.

## Users

- Local dashboard users pausing or disabling trace capture for a runtime.
- OpenClaw, Claude Code, and Codex users who expect controls to stop new trace
  content.
- OneMem developers validating prototype parity without fake controls.

## Goals

- Enforce runtime controls in OpenClaw before buffering and flushing.
- Enforce runtime controls in Codex hooks before opening sessions, buffering
  calls, or flushing calls.
- Enforce runtime controls in Claude Code hooks before opening sessions,
  buffering calls, or flushing calls.
- Preserve buffers on ordinary client/setup failures where possible.
- Mark OpenClaw, Claude Code, and Codex as enforced in dashboard runtime
  metadata.
- Add focused tests for policy skips.

## Non-goals

- Do not remove already-written on-chain traces.
- Do not define uninstall behavior.
- Do not require live trusted Claude/Codex hook execution for this unit-tested
  adoption slice.
- Do not change the Move contract.

## Requirements

- R1: OpenClaw must not buffer new calls when `openclaw` runtime policy disables
  tracing.
- R2: OpenClaw must not create a client, provision a target, or call
  `recordSession()` when policy disables tracing at flush time.
- R3: Codex `SessionStart` must not open a OneMem TraceSession when `codex`
  policy disables tracing.
- R4: Codex `PostToolUse` must not buffer calls when `codex` policy disables
  tracing.
- R5: Codex `Stop` must clear local state/buffers and avoid append/end writes
  when `codex` policy disables tracing.
- R6: Claude Code `SessionStart` must not open a OneMem TraceSession when
  `claude-code` policy disables tracing.
- R7: Claude Code `PostToolUse` must not buffer calls when `claude-code` policy
  disables tracing.
- R8: Claude Code `SessionEnd` must clear local state/buffers and avoid
  append/end writes when `claude-code` policy disables tracing.
- R9: Claude Code hook helpers must support an isolated state directory for
  tests.
- R10: Dashboard runtime metadata must mark OpenClaw, Claude Code, and Codex as
  enforced.
- R11: Tests must prove policy skip behavior for OpenClaw, Claude Code, and
  Codex.

## Acceptance Criteria

- AC1: `pnpm --filter @onemem/oc-onemem test` passes.
- AC2: `pnpm --filter @onemem/oc-onemem lint` passes.
- AC3: `pnpm --filter @onemem/codex-plugin test` passes.
- AC4: `pnpm --filter @onemem/codex-plugin lint` passes.
- AC5: `pnpm --filter @onemem/claude-code-plugin test` passes.
- AC6: `pnpm --filter @onemem/claude-code-plugin lint` passes.
- AC7: `pnpm --filter @onemem/dashboard test` passes.
- AC8: `pnpm --filter @onemem/dashboard lint` passes.
- AC9: `pnpm test:structure` passes.
- AC10: Unit tests prove the remaining stored-only runtime controls are now
  enforced.

## Constraints

- Hooks must remain defensive and exit successfully.
- Policy checks must not print secrets.
- Missing policy files default to trace capture enabled.
- Policy unreadability must fail closed for trace capture.

## Stories Needed

- OpenClaw user pauses tracing and no new trace is written.
- Codex user disables trace capture and hooks no-op without network.
- Claude Code user disables trace capture and hooks no-op without losing buffers
  on unrelated failures.

## Open Questions

- Whether mid-session pause should later close already-open sessions as Aborted
  using an explicit cleanup write.

## Source References

- `.thoughts/research/2026-06-17-runtime-control-plugin-adoption.md`
- `.thoughts/specs/2026-06-17-runtime-controls.md`
- `.thoughts/verification/2026-06-17-runtime-controls.md`
