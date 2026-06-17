# Verification: CLI Command Surface Refresh

## Verdict

Pass.

## Artifacts Checked

- `.thoughts/research/2026-06-17-cli-command-surface-refresh.md`
- `.thoughts/specs/2026-06-17-cli-command-surface-refresh.md`
- `.thoughts/stories/2026-06-17-cli-command-surface-refresh.md`
- `.thoughts/plans/2026-06-17-cli-command-surface-refresh.md`
- `packages/cli-ts/src/index.ts`
- `packages/cli-python/onemem_cli/main.py`
- `packages/cli-ts/README.md`
- `apps/docs/reference/cli.mdx`
- `docs/05-our-architecture/05-cli/README.md`
- `docs/05-our-architecture/05-cli/command-surface.md`
- `tests/structure.test.ts`

## Requirement Traceability

| Requirement | Evidence |
|---|---|
| R1: CLI README status reflects current TS/Python surfaces | README status now marks TS and Python package skeletons/surfaces as built and describes Python as read-only. |
| R2: Command surface lists only current registered commands | `command-surface.md` current sections match `packages/cli-ts/src/index.ts` and `packages/cli-python/onemem_cli/main.py`. |
| R3: Deferred commands are visible as deferred, not current | `command-surface.md` has a dedicated Deferred Commands section. |
| R4: Structure tests guard stale command headings | `tests/structure.test.ts` rejects current `###` headings for known deferred commands. |
| R5: Package/public CLI references match current commands | `packages/cli-ts/README.md` and `apps/docs/reference/cli.mdx` now document login, namespace share/revoke/capabilities, signer + MemWal needs, and `local` network support. |
| R6: Context trail records cleanup | Research/spec/stories/plan/verification files exist and are registered in structure tests/wiki. |

## Acceptance Criteria Coverage

| Acceptance Criterion | Evidence |
|---|---|
| AC1: `pnpm test:structure` passes | Passed, 218 checks. |
| AC2: `git diff --check` passes | Passed. |
| AC3: Targeted stale heading search passes | Passed; no current headings found for known deferred commands. |
| AC4: Verification artifact records scope/evidence/risk | This file. |

## Quality Gates

- `pnpm --filter @onemem/cli test` — passed, 52 tests.
- `pnpm --filter @onemem/cli typecheck` — passed.
- `pnpm --filter @onemem/cli build` — passed.
- `pnpm --filter @onemem/cli lint` — passed.
- `pnpm test:structure` — passed, 218 checks.
- `git diff --check` — passed.
- Targeted `rg` for current deferred-command headings — passed with no matches.

## Deviations From Plan

None.

## Gaps And Risks

- `cli-typescript-impl.md` and `cli-python-impl.md` still contain historical
  planned implementation sketches. They were not rewritten in this narrow
  current-surface cleanup.
- Live hosted login popup execution is still manual proof; this slice only
  corrects docs to current implementation scope.

## Follow-ups

- Consider marking the older implementation-design docs as historical in a
  separate cleanup.
- Implement any deferred CLI command only through a separate researched feature
  slice.

## Evidence Log

- Actual TS command registry inspected in `packages/cli-ts/src/index.ts`.
- Actual Python command registry inspected in
  `packages/cli-python/onemem_cli/main.py`.
