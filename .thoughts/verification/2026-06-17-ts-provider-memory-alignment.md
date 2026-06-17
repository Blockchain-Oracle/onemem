# Verification Audit: TS Provider Memory Alignment

## Verdict

Pass.

The TypeScript provider memory surface is now aligned across source comments,
package READMEs, the framework-provider overview, tests, and structure guards.
This slice documents and tests explicit memory helpers only; automatic memory
extraction and Python provider memory helpers remain out of scope.

## Artifacts Checked

- `.thoughts/research/2026-06-17-ts-provider-memory-alignment.md`
- `.thoughts/specs/2026-06-17-ts-provider-memory-alignment.md`
- `.thoughts/stories/2026-06-17-ts-provider-memory-alignment.md`
- `.thoughts/plans/2026-06-17-ts-provider-memory-alignment.md`
- `packages/provider-vercel-ai/src/index.ts`
- `packages/provider-vercel-ai/tests/provider.test.ts`
- `packages/provider-vercel-ai/README.md`
- `packages/provider-openai-agents/src/index.ts`
- `packages/provider-openai-agents/tests/provider.test.ts`
- `packages/provider-openai-agents/README.md`
- `docs/04-framework-providers/README.md`
- `tests/structure.test.ts`

## Requirement Traceability

| Requirement | Evidence |
|---|---|
| R1: Vercel source comment describes trace plus explicit memory helper support | `packages/provider-vercel-ai/src/index.ts` top comment now says trace middleware observes generate/stream and explicit memory recall/capture is available through `createOneMemMemory(...)`. |
| R2: OpenAI Agents source comment describes event trace plus explicit memory helper support | `packages/provider-openai-agents/src/index.ts` top comment now says trace recording is event-driven and explicit memory recall/capture is available through `createOneMemMemory(...)`. |
| R3: Vercel README shows memory helper usage | `packages/provider-vercel-ai/README.md` imports `createOneMemMemory`, demonstrates `recallInto(...)` before `generateText`, and demonstrates `capture(...)` afterward. |
| R4: OpenAI Agents README shows memory helper usage | `packages/provider-openai-agents/README.md` imports `createOneMemMemory`, demonstrates recall before `runner.run(...)`, and capture after `finalOutput`. |
| R5: Framework overview distinguishes TS helper support from Python deferred memory | `docs/04-framework-providers/README.md` marks Vercel AI and OpenAI Agents as explicit memory-helper providers while keeping CrewAI/LiveKit/ElevenLabs memory helpers deferred. |
| R6: Vercel tests cover memory helper behavior | `packages/provider-vercel-ai/tests/provider.test.ts` now has `createOneMemMemory (Vercel AI)` tests for `recallInto(...)` and `capture(...)`. |
| R7: Structure tests register artifacts | `tests/structure.test.ts` registers this research/spec/stories/plan/verification set. |

## Acceptance Criteria Coverage

| Acceptance Criterion | Evidence |
|---|---|
| AC1: TS provider docs/source no longer claim memory recall/capture is deferred | Targeted `rg` over touched provider docs/source returned no matches for stale deferred-memory phrases. |
| AC2: Vercel recall injection is tested | `pnpm --filter @onemem/vercel-ai-provider test` passed; new test asserts recalled memory appears and original input remains at the end. |
| AC3: Vercel capture passthrough is tested | Same Vercel test suite passed; new test asserts `capture("remember this")` returns `true` and delegates to the mocked recorder. |
| AC4: Python provider memory remains deferred | `docs/04-framework-providers/README.md` deferred-work list keeps memory helper follow-up language for CrewAI, LiveKit, and ElevenLabs only. |
| AC5: Focused gates pass | See Quality Gates. |

## Quality Gates

- `pnpm --filter @onemem/vercel-ai-provider lint` - passed.
- `pnpm --filter @onemem/vercel-ai-provider typecheck` - passed.
- `pnpm --filter @onemem/vercel-ai-provider test` - passed, 1 file / 6 tests.
- `pnpm --filter @onemem/vercel-ai-provider build` - passed. Existing tsup
  warning remains: package export condition `types` appears after `import` and
  `require`.
- `pnpm --filter @onemem/openai-agents lint` - passed.
- `pnpm --filter @onemem/openai-agents typecheck` - passed.
- `pnpm --filter @onemem/openai-agents test` - passed, 1 file / 7 tests.
- `pnpm --filter @onemem/openai-agents build` - passed. Existing tsup warning
  remains: package export condition `types` appears after `import` and
  `require`.
- `pnpm exec biome check tests/structure.test.ts` - passed.
- `pnpm test:structure` - passed, 240 tests.
- `git diff --check` - passed.
- Targeted stale-claim search - passed with no matches:
  `rg -n "memory recall/capture is a tracked follow-up|Memory recall/capture \\+ verify/replay tools are tracked follow-ups|memory injection/extraction deferred|memory tools deferred|Trace-only: we observe|Trace-only\\." packages/provider-vercel-ai packages/provider-openai-agents docs/04-framework-providers`

## Deviations From Plan

None. The slice stayed inside docs/comments/tests/structure guards and did not
change shared memory runtime behavior.

## Gaps And Risks

- No live MemWal provider smoke in this slice.
- Automatic memory extraction remains out of scope.
- Build warnings about package export `types` condition ordering existed during
  both provider builds and were not fixed in this slice.

## Follow-ups

- Consider a separate package-manifest cleanup for export condition ordering if
  desired.
- Design automatic memory extraction/tool wiring as a separate product slice.
- Add Python provider memory helpers only through separate researched
  implementation.

## Evidence Log

- Added CE artifacts:
  - `.thoughts/research/2026-06-17-ts-provider-memory-alignment.md`
  - `.thoughts/specs/2026-06-17-ts-provider-memory-alignment.md`
  - `.thoughts/stories/2026-06-17-ts-provider-memory-alignment.md`
  - `.thoughts/plans/2026-06-17-ts-provider-memory-alignment.md`
- Updated source:
  - `packages/provider-vercel-ai/src/index.ts`
  - `packages/provider-openai-agents/src/index.ts`
- Updated docs:
  - `packages/provider-vercel-ai/README.md`
  - `packages/provider-openai-agents/README.md`
  - `docs/04-framework-providers/README.md`
- Updated tests/guards:
  - `packages/provider-vercel-ai/tests/provider.test.ts`
  - `tests/structure.test.ts`
- Updated wiki:
  - `.thoughts/wiki/context-engineering-status.md`
  - `.thoughts/wiki/index.md`
  - `.thoughts/wiki/log.md`
