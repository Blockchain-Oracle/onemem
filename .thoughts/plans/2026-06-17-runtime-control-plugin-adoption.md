# Plan: Runtime-Control Plugin Adoption

## Inputs

- Research:
  `.thoughts/research/2026-06-17-runtime-control-plugin-adoption.md`
- Spec: `.thoughts/specs/2026-06-17-runtime-control-plugin-adoption.md`
- Stories:
  `.thoughts/stories/2026-06-17-runtime-control-plugin-adoption.md`
- Prior runtime controls verification:
  `.thoughts/verification/2026-06-17-runtime-controls.md`
- Quality profile: `.thoughts/quality/2026-06-17-project-quality-profile.md`

## Assumptions

- Missing runtime-control files default to trace capture enabled.
- Policy parse/read failures should fail closed for trace capture.
- A mid-session pause should stop further content writes and clear local state;
  cleanup of already-open on-chain sessions can be a later explicit design.

## Open Questions

- Whether mid-session pause should later issue an Aborted close transaction for
  already-open hook sessions.

## Phase 1: OpenClaw Policy Enforcement

### Goal

Stop OpenClaw from buffering or flushing traces when `openclaw` policy disables
trace capture.

### Work

- Import `shouldTraceRuntime()` in `packages/plugin-openclaw/src/onemem-trace.ts`.
- Check policy in `record()` and `end()`.
- Add unit tests for no-buffer and no-client/no-record policy skips.

### Checks

- `pnpm --filter @onemem/oc-onemem test`
- `pnpm --filter @onemem/oc-onemem lint`

### Acceptance Criteria Covered

- AC1, AC2, AC10.

### Stop Condition

OpenClaw policy skip is tested without chain/network work.

## Phase 2: Codex Hook Policy Enforcement

### Goal

Make Codex hooks honor `codex` policy before session open, buffering, and flush.

### Work

- Add shared `traceCaptureEnabled()` helper.
- Check policy in `inject.js`, `observe.js`, and `summarize.js`.
- Add tests for paused PostToolUse and Stop behavior.

### Checks

- `pnpm --filter @onemem/codex-plugin test`
- `pnpm --filter @onemem/codex-plugin lint`

### Acceptance Criteria Covered

- AC3, AC4, AC10.

### Stop Condition

Codex simulated hooks skip capture under paused policy.

## Phase 3: Claude Code Hook Policy Enforcement

### Goal

Make Claude Code hooks honor `claude-code` policy and add isolated state helpers
for tests.

### Work

- Add state directory override support.
- Add non-destructive buffer read/clear helpers.
- Add shared policy helper.
- Check policy in `inject.js`, `observe.js`, and `summarize.js`.
- Add simulated-hook unit tests.

### Checks

- `pnpm --filter @onemem/claude-code-plugin test`
- `pnpm --filter @onemem/claude-code-plugin lint`

### Acceptance Criteria Covered

- AC5, AC6, AC10.

### Stop Condition

Claude Code simulated hooks skip capture under paused policy.

## Phase 4: Dashboard Metadata And Traceability

### Goal

Make the dashboard and Context Engineering trail reflect enforced coverage.

### Work

- Mark OpenClaw, Claude Code, and Codex coverage as enforced in
  `packages/dashboard/lib/runtimes.ts`.
- Update dashboard runtime tests.
- Register Context Engineering artifacts in wiki and structure tests.
- Write verification audit.

### Checks

- `pnpm --filter @onemem/dashboard test`
- `pnpm --filter @onemem/dashboard lint`
- `pnpm test:structure`

### Acceptance Criteria Covered

- AC7, AC8, AC9.

### Stop Condition

All remaining current runtime cards can honestly show enforced coverage.

## Verification Checkpoint

- Run all focused package tests/lints.
- Run dashboard tests/lint.
- Run structure tests.
- Write `.thoughts/verification/2026-06-17-runtime-control-plugin-adoption.md`.

## Handoff Notes

Live trusted Claude/Codex hook sessions remain separate smoke proof. This slice
proves hook script behavior by local simulation.
