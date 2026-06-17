# Verification Audit: Share Capability Readiness

Date: 2026-06-17

## Verdict

Pass.

The TypeScript CLI now exposes executable namespace capability commands, fresh
runtime provisioning preserves `adminCapId`, and dashboard `/share` renders
honest no-namespace and configured-namespace states backed by real testnet data.

## Artifacts Checked

- `packages/sdk-ts/src/runtime.ts`
- `packages/cli-ts/src/index.ts`
- `packages/cli-ts/src/commands/init.ts`
- `packages/cli-ts/src/commands/namespace.ts`
- `packages/cli-ts/tests/namespace.test.ts`
- `packages/dashboard/app/share/page.tsx`
- `packages/dashboard/app/share/ShareView.tsx`
- `packages/dashboard/styles/dash.css`
- `.thoughts/research/2026-06-17-share-capability-readiness.md`
- `.thoughts/specs/2026-06-17-share-capability-readiness.md`
- `.thoughts/stories/2026-06-17-share-capability-readiness.md`
- `.thoughts/plans/2026-06-17-share-capability-readiness.md`

## Requirement Traceability

- R1: `onemem namespace share <namespace-id> <recipient>` exists with
  `--cap ReadOnly|ReadWrite` and `--admin-cap`, with
  `ONEMEM_ADMIN_CAP_ID` fallback.
- R2: `onemem namespace capabilities <namespace-id>` exists and reads active
  capabilities without signing.
- R3: Fresh runtime provisioning stores and prints `adminCapId`; `onemem init`
  emits `ONEMEM_ADMIN_CAP_ID` when available.
- R4: `/share` no longer references the old nonexistent
  `onemem namespace share <recipient>` command shape.
- R5: `/share` fetches configured namespace details and active capabilities
  from the SDK when `ONEMEM_NAMESPACE_ID` is set.
- R6: `/share` states that mint/share requires the owner's signer and Admin cap.
- R7: `/share` states that owner-driven admin revoke is not available in the
  current contract and avoids rendering a fake revoke action.
- R8: Public verification link sharing remains present.

## Quality Gates

```bash
pnpm --filter @onemem/sdk-ts typecheck
pnpm --filter @onemem/sdk-ts test
pnpm --filter @onemem/sdk-ts build
pnpm --filter @onemem/cli typecheck
pnpm --filter @onemem/cli lint
pnpm --filter @onemem/cli test
pnpm --filter @onemem/cli build
pnpm --filter @onemem/dashboard typecheck
pnpm --filter @onemem/dashboard lint
pnpm --filter @onemem/dashboard build
pnpm exec biome check --write packages/sdk-ts/src/runtime.ts packages/cli-ts/src/index.ts packages/cli-ts/src/commands/init.ts packages/cli-ts/src/commands/namespace.ts packages/cli-ts/tests/namespace.test.ts packages/dashboard/app/share/page.tsx packages/dashboard/app/share/ShareView.tsx packages/dashboard/styles/dash.css
```

All listed gates passed.

The SDK build still prints the existing package-export ordering warning for
`types` conditions. That warning predates this slice and did not fail the build.

## Live Evidence

- `node packages/cli-ts/dist/index.js namespace share --help` shows the
  namespace id, recipient, `--cap`, and `--admin-cap` arguments.
- `node packages/cli-ts/dist/index.js namespace capabilities --help` shows the
  read-only capability listing command.
- `node packages/cli-ts/dist/index.js --json namespace capabilities 0x36bdec35bfa0fe9abc0d91fc82cd11f9d6fac2c57f626a684d393841b2f657d2`
  returned `ok: true`, `network: testnet`, and `count: 2`; the first active
  capability was labeled `Admin`.
- `GET /api/capabilities/0x36bdec35bfa0fe9abc0d91fc82cd11f9d6fac2c57f626a684d393841b2f657d2`
  returned `ok: true` and two active capabilities.
- `GET /share` with no namespace env returned HTTP 200 and rendered no-namespace
  setup guidance, `onemem init`, `ONEMEM_NAMESPACE_ID`, and
  `ONEMEM_ADMIN_CAP_ID`.
- `GET /share` with
  `ONEMEM_NAMESPACE_ID=0x36bdec35bfa0fe9abc0d91fc82cd11f9d6fac2c57f626a684d393841b2f657d2`
  returned HTTP 200 and rendered namespace `mem-mqcurlha`, `Personal`,
  `active`, the full namespace-aware share command, and two active capabilities
  (`Admin` and `ReadWrite`).
- The built CSS contains `share-grid` and the `max-width: 860px` collapse rule
  for the share cards.
- Live disposable testnet share/revoke proof:
  - Signer address:
    `0x633dbf84ab127de37c212dfe4ceb75ee254ae26ad78a68e6b8289c7be60c235a`.
  - Temporary label: `revoke-smoke-mqhuiily`.
  - Temporary namespace:
    `0x362495a8baba1cc166c3a898d9069200b95aff7855fdb7eaad9a191d8bc254fd`.
  - Admin cap:
    `0xef82d4f329ff953f92a986ffb84afdf489972b78f5b8e4718135dfa044198ddb`.
  - Persistent ReadWrite cap:
    `0x143087e6c816b2200fe6712108b53373211b4568c20eea2b09294d0495597b1b`.
  - Shared ReadOnly cap:
    `0xcf95dbe4d5387b349f53189997f2bf25ed4cc9b4472b1f8e1cf53d41924ef90b`.
  - Share transaction digest: `2LKuUyke5tsJxZkco2Smr8ZNDzV5YoQBBC4y7Aa72YX3`.
  - Capability count changed from `2` to `3` after share and back to `2`
    after revoke.
  - The temporary namespace was deactivated after the smoke test:
    `4n8PqNtkiVFwkVd3HQtLuMvpWDfQG2AzA8Ndnp1bS6V6`.

## Deviations From Plan

- The CLI read command initially had a Commander callback-shape bug. It was
  caught by live execution, fixed in `packages/cli-ts/src/index.ts`, rebuilt,
  and re-run successfully.
- Browser proof should use the Codex `@chrome` plugin for local Codex sessions.
  In this slice the acceptance criteria allowed HTTP-render verification, so
  `/share` was verified through production `next start` and real HTML output.

## Remaining Follow-ups

- Design and implement owner-driven admin revoke only after the Move contract
  supports it.
- Decide whether hosted dashboard should sponsor share transactions or stay
  command-oriented.
