# Verification Audit: TS Package Export Condition Order

## Verdict

Pass.

The affected TypeScript package manifests now put `types` before runtime export
conditions. Focused SDK/provider builds pass without the previous
`condition "types"` warning, and structure tests now guard conditional export
ordering across TS package manifests.

## Artifacts Checked

- `.thoughts/research/2026-06-17-ts-package-export-condition-order.md`
- `.thoughts/specs/2026-06-17-ts-package-export-condition-order.md`
- `.thoughts/stories/2026-06-17-ts-package-export-condition-order.md`
- `.thoughts/plans/2026-06-17-ts-package-export-condition-order.md`
- `packages/sdk-ts/package.json`
- `packages/provider-vercel-ai/package.json`
- `packages/provider-openai-agents/package.json`
- `tests/structure.test.ts`

## Requirement Traceability

| Requirement | Evidence |
|---|---|
| R1: SDK root export lists `types` before runtime conditions | `packages/sdk-ts/package.json` root `"."` export now has key order `types`, `import`, `require`. |
| R2: Vercel provider root export lists `types` before runtime conditions | `packages/provider-vercel-ai/package.json` root `"."` export now has key order `types`, `import`, `require`. |
| R3: OpenAI Agents provider root export lists `types` before runtime conditions | `packages/provider-openai-agents/package.json` root `"."` export now has key order `types`, `import`, `require`. |
| R4: Structure test detects bad ordering | `tests/structure.test.ts` now walks TS package export objects and asserts `types` appears before `import` and `require`. |
| R5: Focused package builds pass without the previous warning | SDK, Vercel provider, and OpenAI Agents provider builds passed and no `condition "types"` warning appeared in output. |
| R6: CE artifacts registered | `tests/structure.test.ts` registers this research/spec/stories/plan/verification artifact set. |

## Acceptance Criteria Coverage

| Acceptance Criterion | Evidence |
|---|---|
| AC1: Metadata scan shows `types,import,require` | Node metadata scan printed `types,import,require` for `@onemem/sdk-ts` `"."`, `@onemem/sdk-ts` `"./runtime"`, `@onemem/vercel-ai-provider` `"."`, and `@onemem/openai-agents` `"."`. |
| AC2: Focused builds pass without warning | `pnpm --filter @onemem/sdk-ts build`, `pnpm --filter @onemem/vercel-ai-provider build`, and `pnpm --filter @onemem/openai-agents build` all passed with no `condition "types"` warning. |
| AC3: Structure guard passes | `pnpm test:structure` passed, 246 tests, including `conditional package exports put types before runtime conditions`. |
| AC4: Whitespace guard passes | `git diff --check` passed. |

## Quality Gates

- `pnpm exec biome check tests/structure.test.ts packages/sdk-ts/package.json packages/provider-vercel-ai/package.json packages/provider-openai-agents/package.json` - passed.
- `pnpm --filter @onemem/sdk-ts build` - passed, no previous warning.
- `pnpm --filter @onemem/vercel-ai-provider build` - passed, no previous warning.
- `pnpm --filter @onemem/openai-agents build` - passed, no previous warning.
- `pnpm test:structure` - passed, 246 tests.
- `git diff --check` - passed.

## Deviations From Plan

Implementation widened slightly from root exports to every conditional export
object in the affected packages after inspection showed `@onemem/sdk-ts` also
had `./runtime` ordered as `import`, `require`, `types`.

## Gaps And Risks

- No version bump or publish in this slice.
- Package builds rewrite `dist/` outputs locally, but `dist/` is not part of
  this source-control verification scope.

## Follow-ups

- Version bumping and npm publishing remain separate release operations.

## Evidence Log

- Changed manifests:
  - `packages/sdk-ts/package.json`
  - `packages/provider-vercel-ai/package.json`
  - `packages/provider-openai-agents/package.json`
- Changed guard:
  - `tests/structure.test.ts`
- Added artifacts:
  - `.thoughts/research/2026-06-17-ts-package-export-condition-order.md`
  - `.thoughts/specs/2026-06-17-ts-package-export-condition-order.md`
  - `.thoughts/stories/2026-06-17-ts-package-export-condition-order.md`
  - `.thoughts/plans/2026-06-17-ts-package-export-condition-order.md`
- Updated wiki:
  - `.thoughts/wiki/context-engineering-status.md`
  - `.thoughts/wiki/index.md`
  - `.thoughts/wiki/log.md`
