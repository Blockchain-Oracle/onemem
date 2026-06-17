# Spec: TS Package Export Condition Order

## Objective

Remove TypeScript package build warnings caused by root export objects placing
`types` after `import` and `require`, and add a structure guard so publishable
package metadata stays warning-free.

## Background And Current Reality

The previous TS provider memory alignment slice passed builds but recorded a
tsup/esbuild warning for both provider packages: the `types` condition is never
used because it comes after `import` and `require`. Repo metadata inspection
shows the same root export condition order in `@onemem/sdk-ts`.

Source:
`.thoughts/research/2026-06-17-ts-package-export-condition-order.md`.

## Users

- Maintainers preparing npm releases.
- Consumers relying on correct package typings.
- Future agents reading build output as release evidence.

## Goals

- Reorder root package export conditions for affected TS packages so `types`
  appears before runtime conditions.
- Keep `import` and `require` entrypoints unchanged.
- Add a structure test that rejects `types` after runtime conditions for package
  root exports.
- Verify builds no longer emit the condition-order warning.

## Non-goals

- Do not bump package versions.
- Do not publish packages.
- Do not rewrite all package manifests.
- Do not change public API code or generated build outputs manually.

## Requirements

- R1: `packages/sdk-ts/package.json` root export must list `types` before
  `import` and `require`.
- R2: `packages/provider-vercel-ai/package.json` root export must list `types`
  before `import` and `require`.
- R3: `packages/provider-openai-agents/package.json` root export must list
  `types` before `import` and `require`.
- R4: Structure tests must detect package root exports where `types` appears
  after `import` or `require`.
- R5: Focused package builds must pass without the previous warning.
- R6: Context Engineering artifacts must be registered in structure tests.

## Acceptance Criteria

- AC1: Package metadata scan shows affected package export condition order as
  `types,import,require`.
- AC2: `pnpm --filter @onemem/sdk-ts build`,
  `pnpm --filter @onemem/vercel-ai-provider build`, and
  `pnpm --filter @onemem/openai-agents build` pass with no
  `condition "types"` warning.
- AC3: `pnpm test:structure` passes and includes the new guard.
- AC4: `git diff --check` passes.

## Constraints

- Preserve unrelated dirty worktree changes.
- Keep edits scoped to package metadata, structure guard, and CE artifacts.
- Use package builds as the authoritative warning check.

## Stories Needed

- Maintainer runs provider/package build and sees clean output.
- Future agent catches bad export condition order before release.

## Open Questions

- Version bumps and actual npm publish remain separate release operations.

## Source References

- `.thoughts/research/2026-06-17-ts-package-export-condition-order.md`
- `packages/sdk-ts/package.json`
- `packages/provider-vercel-ai/package.json`
- `packages/provider-openai-agents/package.json`
- `tests/structure.test.ts`
