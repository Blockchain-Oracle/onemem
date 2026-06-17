# Verification Audit: Plugin Test SDK Boundary

## Verdict

Pass locally; remote CI pending after push.

## Artifacts Checked

- `packages/plugin-codex/tests/plugin.test.ts`
- `packages/plugin-claude-code/tests/plugin.test.ts`
- `packages/plugin-claude-code/scripts/onemem-lib.mjs`
- `tests/structure.test.ts`
- `.thoughts/plans/2026-06-17-plugin-test-sdk-boundary.md`

## Requirement Traceability

- Keep publishable plugin manifests registry-compatible: no manifest changes made.
- Make plugin unit tests use repository-current runtime-control helper: both unit test files import `setRuntimePaused` from `../../sdk-ts/src/runtime-controls.ts`.
- Guard against reintroducing the registry SDK internal import in unit tests: `tests/structure.test.ts` asserts the local source import and rejects `@onemem/sdk-ts/runtime` in those test files.
- Keep Claude Code hook policy independent from unreleased SDK exports: `packages/plugin-claude-code/scripts/onemem-lib.mjs` now reads `ONEMEM_RUNTIME_CONTROLS_PATH` directly and structure tests reject `@onemem/sdk-ts/runtime` there.

## Acceptance Criteria Coverage

- CI plugin tests no longer fail on a registry SDK that lacks repo-current helpers:
  `mise exec -- pnpm --filter @onemem/codex-plugin test` passed with 8/8 tests;
  `mise exec -- pnpm --filter @onemem/claude-code-plugin test` passed with 4/4
  unit tests and 1 skipped live integration test.
- Publishable plugin manifests keep registry-compatible dependency declarations:
  no plugin manifest dependency changes were made; structure test still asserts
  no `workspace:` protocol in plugin package metadata.
- Regression test protects the boundary: `mise exec -- pnpm test:structure`
  passed 344/344 checks, including plugin unit-test import and Claude hook
  policy-locality guards.
- Claude Code shipped hook policy no longer depends on the registry SDK runtime
  entry: `packages/plugin-claude-code/scripts/onemem-lib.mjs` now reads
  `ONEMEM_RUNTIME_CONTROLS_PATH` directly and defaults to enabled when the file
  does not exist.

## Quality Gates

- `mise exec -- pnpm --filter @onemem/codex-plugin test` - pass.
- `mise exec -- pnpm --filter @onemem/claude-code-plugin test` - pass.
- `mise exec -- pnpm test:structure` - pass, 344/344.
- `mise exec -- pnpm test` - pass, 16/16 Turbo tasks.
- `mise exec -- pnpm test:demo-matrix` - pass, 17/17 Turbo tasks.
- `mise exec -- pnpm turbo run lint typecheck build` - pass, 42/42 Turbo tasks.
- `git diff --check` - pass.

## Deviations From Plan

The initial plan expected a test-only import fix. Focused Claude Code tests
showed the shipped Claude hook helper had the same registry SDK runtime-export
dependency, so the implementation expanded to make that helper read runtime
controls locally, matching the Codex helper.

## Gaps And Risks

- Remote CI must still be rechecked after push.
- This does not publish npm packages; release upload is still controlled by npm credentials or trusted publishing configuration.

## Follow-ups

- Recheck GitHub Actions CI and Release after push.

## Evidence Log

- Before fix: `mise exec -- pnpm --filter @onemem/codex-plugin test` reproduced
  the remote failure with `setRuntimePaused is not a function`.
- First fix: Codex plugin focused test passed; Claude Code focused test exposed
  empty buffers because `traceCaptureEnabled()` depended on
  `@onemem/sdk-ts/runtime`.
- Final focused proof: both plugin focused suites passed.
- Broader local proof: structure, root test, demo matrix, and TS
  lint/typecheck/build gates passed.
