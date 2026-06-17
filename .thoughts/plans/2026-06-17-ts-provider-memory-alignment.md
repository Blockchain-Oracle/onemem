# Plan: TS Provider Memory Alignment

## Inputs

- Reality research:
  `.thoughts/research/2026-06-17-ts-provider-memory-alignment.md`
- Spec:
  `.thoughts/specs/2026-06-17-ts-provider-memory-alignment.md`
- Stories:
  `.thoughts/stories/2026-06-17-ts-provider-memory-alignment.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`
- Current source and tests under:
  - `packages/provider-vercel-ai/`
  - `packages/provider-openai-agents/`
  - `docs/04-framework-providers/`

## Assumptions

- The shared SDK memory recorder is already the canonical implementation.
- This slice documents and tests the explicit helper, not automatic provider
  memory extraction.
- Python provider memory remains deferred unless implemented separately.

## Open Questions

- None blocking for this slice.

## Phase 1: Align Provider Source Comments

### Goal

Remove stale trace-only/deferred-memory comments from TS provider source.

### Work

- Patch `packages/provider-vercel-ai/src/index.ts` top comment.
- Patch `packages/provider-openai-agents/src/index.ts` top comment.

### Checks

- `rg` for stale deferred-memory wording in touched source files.

### Acceptance Criteria Covered

- R1, R2, AC1.

### Stop Condition

Source comments describe trace plus explicit memory helper behavior accurately.

## Phase 2: Add Vercel Memory Helper Coverage

### Goal

Make Vercel provider tests cover the existing helper like OpenAI Agents tests do.

### Work

- Mock `createMemoryRecorder` and `injectMemories` in
  `packages/provider-vercel-ai/tests/provider.test.ts`.
- Import `createOneMemMemory`.
- Add tests for `recallInto(...)` and `capture(...)`.

### Checks

- `pnpm --filter @onemem/vercel-ai-provider test`.

### Acceptance Criteria Covered

- R6, AC2, AC3.

### Stop Condition

Vercel provider tests pass and fail meaningfully if memory helper behavior is
removed.

## Phase 3: Align Current-Facing Docs

### Goal

Make README and framework overview status match the shipped TS helper.

### Work

- Update `packages/provider-vercel-ai/README.md`.
- Update `packages/provider-openai-agents/README.md`.
- Update `docs/04-framework-providers/README.md`.

### Checks

- Targeted `rg` for stale deferred-memory claims in TS provider docs.
- Keep Python deferred-memory statements intact.

### Acceptance Criteria Covered

- R3, R4, R5, AC1, AC4.

### Stop Condition

Current docs distinguish trace middleware/event capture, explicit TS memory
helpers, and deferred automatic/Python memory work.

## Phase 4: Register And Verify

### Goal

Make the Context Engineering trail durable and prove the slice.

### Work

- Register new artifacts in `tests/structure.test.ts`.
- Write verification audit.
- Update wiki status/index/log.

### Checks

- `pnpm --filter @onemem/vercel-ai-provider lint`
- `pnpm --filter @onemem/vercel-ai-provider typecheck`
- `pnpm --filter @onemem/vercel-ai-provider test`
- `pnpm --filter @onemem/vercel-ai-provider build`
- `pnpm --filter @onemem/openai-agents lint`
- `pnpm --filter @onemem/openai-agents typecheck`
- `pnpm --filter @onemem/openai-agents test`
- `pnpm --filter @onemem/openai-agents build`
- `pnpm test:structure`
- `git diff --check`

### Acceptance Criteria Covered

- R7, AC5.

### Stop Condition

All focused gates pass and verification audit records evidence.

## Verification Checkpoint

Use `verification-audit` before claiming completion:
`.thoughts/verification/2026-06-17-ts-provider-memory-alignment.md`.

## Handoff Notes

Do not broaden this into automatic memory injection or Python provider memory.
Those are separate researched feature slices.
