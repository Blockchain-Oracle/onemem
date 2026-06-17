# Reality Research: TS Package Export Condition Order

## Scope

Audit TypeScript package `exports` metadata for the `types` condition ordering
warning observed during provider package builds. This pass covers publishable
packages under `packages/` with root package exports.

## Sources Checked

- `packages/sdk-ts/package.json`
- `packages/provider-vercel-ai/package.json`
- `packages/provider-openai-agents/package.json`
- `packages/brand/package.json`
- Build output from:
  - `pnpm --filter @onemem/vercel-ai-provider build`
  - `pnpm --filter @onemem/openai-agents build`
- Node metadata scan:
  - enumerated `packages/*/package.json` files with `exports`.
- Previous verification:
  - `.thoughts/verification/2026-06-17-ts-provider-memory-alignment.md`

## Verified Facts

- `@onemem/vercel-ai-provider` build succeeds but tsup/esbuild warns:
  `The condition "types" here will never be used as it comes after both
  "import" and "require"`.
- `@onemem/openai-agents` build succeeds with the same warning.
- `packages/provider-vercel-ai/package.json`,
  `packages/provider-openai-agents/package.json`, and
  `packages/sdk-ts/package.json` all use this root export key order:
  `import`, `require`, `types`.
- `packages/brand/package.json` has exports, but they are path exports for CSS,
  logo, fonts, and images. It does not have the `import`/`require`/`types`
  condition-order pattern.
- The previous provider-memory verification recorded the build warning as a
  follow-up rather than fixing it inside that slice.

## Inferences

- The release-quality cleanup should apply to all TypeScript packages that share
  the problematic root export condition order, not only the two providers that
  happened to be built in the previous slice.
- Reordering the root export object to put `types` first should remove the build
  warning without changing runtime import/require entrypoints.
- A structure guard can prevent the same warning pattern from returning.

## Unknowns And Questions

- Other package managers or bundlers may have additional preferred condition
  orders, but the current observable issue is the local tsup/esbuild warning.
- The repo has many unpublished apps/packages without root conditional exports;
  they are not part of this metadata cleanup.

## Not Included

- Version bumps or npm publishing.
- Changes to generated `dist/` output.
- Changes to package public API shapes.
