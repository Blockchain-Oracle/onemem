# Verification Audit: Runtime-Control Plugin Adoption

## Verdict

Pass.

OpenClaw, Claude Code, and Codex now enforce local runtime controls. Dashboard
runtime metadata can honestly show all current first-party runtime capture paths
as enforced when using this repo's current packages.

## Artifacts Checked

- Research:
  `.thoughts/research/2026-06-17-runtime-control-plugin-adoption.md`
- Spec: `.thoughts/specs/2026-06-17-runtime-control-plugin-adoption.md`
- Stories:
  `.thoughts/stories/2026-06-17-runtime-control-plugin-adoption.md`
- Plan: `.thoughts/plans/2026-06-17-runtime-control-plugin-adoption.md`
- Prior runtime controls verification:
  `.thoughts/verification/2026-06-17-runtime-controls.md`

## Requirement Traceability

- R1/R2 OpenClaw policy enforcement:
  - `packages/plugin-openclaw/src/onemem-trace.ts` checks
    `shouldTraceRuntime("openclaw")` before buffering and before flush client
    setup.
  - `packages/plugin-openclaw/tests/unit.test.ts` proves no buffer and
    no-client/no-record behavior under disabled policy.
- R3/R4/R5 Codex hook enforcement:
  - `packages/plugin-codex/scripts/onemem-lib.mjs` adds
    `traceCaptureEnabled()`.
  - `inject.js`, `observe.js`, and `summarize.js` check `codex` policy before
    opening, buffering, and flushing.
  - `summarize.js` clears local state/buffers on intentional policy skip.
- R6/R7/R8/R9 Claude Code hook enforcement:
  - `packages/plugin-claude-code/scripts/onemem-lib.mjs` adds isolated state
    directory support, non-destructive buffer reads, clear helpers, and
    `traceCaptureEnabled()`.
  - `inject.js`, `observe.js`, and `summarize.js` check `claude-code` policy.
  - `summarize.js` preserves buffers on client setup failure and clears them on
    intentional policy skip.
- R10 Dashboard coverage metadata:
  - `packages/dashboard/lib/runtimes.ts` marks OpenClaw, Claude Code, and Codex
    as enforced.
- R11 Tests:
  - Focused unit tests cover OpenClaw, Codex, and Claude Code policy skips.

## Acceptance Criteria Coverage

- AC1: `pnpm --filter @onemem/oc-onemem test` passed.
- AC2: `pnpm --filter @onemem/oc-onemem lint` passed.
- AC3: `pnpm --filter @onemem/codex-plugin test` passed.
- AC4: `pnpm --filter @onemem/codex-plugin lint` passed.
- AC5: `pnpm --filter @onemem/claude-code-plugin test` passed.
- AC6: `pnpm --filter @onemem/claude-code-plugin lint` passed.
- AC7: `pnpm --filter @onemem/dashboard test` passed.
- AC8: `pnpm --filter @onemem/dashboard lint` passed.
- AC9: `pnpm test:structure` passed.
- AC10: Tests prove policy skip behavior for OpenClaw, Codex, and Claude Code.

## Quality Gates

- `pnpm --filter @onemem/oc-onemem test`: 23 passed.
- `pnpm --filter @onemem/oc-onemem lint`: passed.
- `pnpm --filter @onemem/oc-onemem typecheck`: passed.
- `pnpm --filter @onemem/oc-onemem build`: passed.
- `pnpm --filter @onemem/codex-plugin test`: 6 passed.
- `pnpm --filter @onemem/codex-plugin lint`: passed.
- `pnpm --filter @onemem/claude-code-plugin test`: 4 passed, 1 live
  integration skipped by default.
- `pnpm --filter @onemem/claude-code-plugin lint`: passed.
- `pnpm --filter @onemem/dashboard test`: 12 passed.
- `pnpm --filter @onemem/dashboard lint`: passed.
- `pnpm --filter @onemem/dashboard typecheck`: passed.
- `pnpm --filter @onemem/dashboard build`: passed.
- `pnpm test:structure`: 148 passed.

## Deviations From Plan

- Added an extra OpenClaw typecheck/build gate because OpenClaw is a compiled TS
  package.
- Fixed a pre-existing Claude live-test non-null assertion warning while inside
  that package.

## Gaps And Risks

- Live trusted Claude/Codex hook sessions are still not rerun here; behavior is
  verified by script simulation.
- If a hook session has already opened an on-chain TraceSession and policy is
  disabled mid-session, this slice clears local buffers/state and stops further
  content writes. It does not issue an Aborted close transaction.

## Follow-ups

- Decide whether mid-session policy disable should close already-open hook
  sessions as Aborted.
- Continue the prototype accept/reject queue: delegate-key lifecycle, hosted
  share/revoke UX, grouped replay/export, and reusable browser regression
  coverage.

## Evidence Log

- OpenClaw tests added:
  - no buffering while policy disabled.
  - no client/provisioning/recording when policy disables tracing before flush.
- Codex tests added:
  - no buffering while policy disabled.
  - local state/buffer clear on disabled-policy Stop.
- Claude tests added:
  - active PostToolUse buffering.
  - no buffering while policy disabled.
  - buffer preservation on client setup failure.
  - local state/buffer clear on disabled-policy SessionEnd.
