# Verification: Recipient Capability Self-Revoke

## Verdict

Pass.

## Artifacts Checked

- `.thoughts/research/2026-06-17-recipient-capability-self-revoke.md`
- `.thoughts/specs/2026-06-17-recipient-capability-self-revoke.md`
- `.thoughts/stories/2026-06-17-recipient-capability-self-revoke.md`
- `.thoughts/plans/2026-06-17-recipient-capability-self-revoke.md`
- `apps/hosted-dashboard/lib/share-capability.ts`
- `apps/hosted-dashboard/lib/share-capability.test.ts`
- `apps/hosted-dashboard/app/share/[capability_id]/page.tsx`
- `apps/hosted-dashboard/README.md`
- `tests/structure.test.ts`

## Requirement Traceability

| Requirement | Evidence |
|---|---|
| R1: Recipient capability pages display a self-revoke section | `/share/[capability_id]/page.tsx` now renders a `Holder self-revoke` card for loaded capabilities. |
| R2: ReadOnly/ReadWrite command is `onemem namespace revoke <cap-id>` | `holderSelfRevokeCommand()` returns the base command for ReadOnly and ReadWrite; unit tests cover both. |
| R3: Admin command includes `--allow-admin` | `holderSelfRevokeCommand()` appends the CLI safety flag for Admin; unit test covers it. |
| R4: Page states owner-driven revoke is unsupported | Self-revoke card copy says owner-driven revocation of another wallet's capability is not supported by contract v0.1. |
| R5: Tests cover command generation | `share-capability.test.ts` includes ReadOnly, ReadWrite, and Admin command assertions. |
| R6: Context trail records cleanup | Research/spec/stories/plan/verification files exist and are registered in structure tests/wiki. |

## Acceptance Criteria Coverage

| Acceptance Criterion | Evidence |
|---|---|
| AC1: hosted tests pass | `pnpm --filter @onemem/hosted-dashboard test` passed: 7 files, 35 tests. |
| AC2: hosted typecheck passes | `pnpm --filter @onemem/hosted-dashboard typecheck` passed. |
| AC3: hosted lint passes | `pnpm --filter @onemem/hosted-dashboard lint` passed after formatting the new test. |
| AC4: hosted build passes | `pnpm --filter @onemem/hosted-dashboard build` passed when rerun serially. |
| AC5: hosted browser smoke passes | `pnpm --filter @onemem/hosted-dashboard browser:smoke` passed 50 checks. |
| AC6: structure tests pass | `pnpm test:structure` passed 229 checks. |
| AC7: diff whitespace check passes | `git diff --check` passed. |

## Quality Gates

- `pnpm --filter @onemem/hosted-dashboard test` — passed, 35 tests.
- `pnpm --filter @onemem/hosted-dashboard typecheck` — passed.
- `pnpm --filter @onemem/hosted-dashboard lint` — initially failed on Biome
  formatting in the new unit test, fixed, then passed.
- `pnpm --filter @onemem/hosted-dashboard build` — one parallel run failed
  with transient Next `/_document` collection error while browser smoke dev
  server was active; serial rerun passed.
- `pnpm --filter @onemem/hosted-dashboard browser:smoke` — passed, 50 checks.
- `pnpm test:structure` — passed, 229 checks.
- `git diff --check` — passed.

## Deviations From Plan

- The Chrome connector was not exposed as a callable tool by `tool_search` in
  this session. Verification used the repo-owned hosted browser smoke harness
  as a recorded fallback.

## Gaps And Risks

- This slice is guidance/UI over the existing CLI path; it does not perform a
  hosted revoke transaction.
- Browser smoke currently verifies route health and share boundary copy, not a
  loaded real capability page with a live object. The command helper is unit
  tested; a future live share smoke can exercise the rendered command against a
  disposable testnet capability.

## Follow-ups

- A hosted wallet-signed holder revoke flow can be designed later if product
  wants one.
- Owner-driven revoke requires a separate protocol design/migration.

## Evidence Log

- Contract boundary checked in `contracts/onemem/sources/namespace.move`:
  `revoke_capability<KIND>` consumes the capability object.
- SDK/CLI boundary checked in `packages/sdk-ts/src/namespaces.ts` and
  `packages/cli-ts/src/commands/namespace.ts`.
