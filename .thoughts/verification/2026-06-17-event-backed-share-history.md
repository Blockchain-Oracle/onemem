# Verification: Event-backed Share History

## Scope

Implemented read-only, event-backed namespace capability history for hosted
`/share`.

In scope:
- SDK history reader for `NamespaceCapabilityMintedEvent` and
  `NamespaceCapabilityRevokedEvent`.
- Hosted `GET /api/share/history` validation and response mapping.
- Hosted `/share` owner history panel and refresh after sponsored mint.
- Documentation/status updates for actual v0.1 event shapes and self-revoke
  boundaries.

Out of scope:
- Owner-driven revoke.
- Claim/transfer transactions.
- Server-side share database or fake history rows.

## Requirement Mapping

| Requirement | Evidence |
|---|---|
| Query minted/revoked events exactly | `packages/sdk-ts/src/namespace-history.ts`; `packages/sdk-ts/tests/namespaces.unit.test.ts` asserts exact `MoveEventType` queries. |
| Join revoked rows by cap id | SDK reader maps revokes by `capId` and marks rows `active` or `revoked`. |
| Preserve event evidence | SDK rows expose minted/revoked tx digests, event sequence, and timestamp metadata. |
| Reusable SDK API | `NamespacesAPI.getCapabilityHistory(namespaceId)` and exports from `packages/sdk-ts/src/index.ts`. |
| Hosted read-only API | `apps/hosted-dashboard/app/api/share/history/route.ts` and `apps/hosted-dashboard/lib/share-history.ts`. |
| Hosted owner UI | `apps/hosted-dashboard/app/share/ShareHistoryPanel.tsx` rendered by `HostedShareView.tsx`. |
| No fake/server-persisted history | API creates a read-only SDK client and reads Sui events directly. |
| Refresh after mint | `HostedShareView.tsx` increments `historyRefreshKey` after successful execution. |

## Commands

- `pnpm --filter @onemem/sdk-ts test` — passed after fixing cursor typing and
  pagination-test interleaving.
- `pnpm --filter @onemem/sdk-ts typecheck` — passed.
- `pnpm --filter @onemem/sdk-ts build` — passed; emitted existing tsup package
  export-order warnings.
- `pnpm --filter @onemem/sdk-ts lint` — passed with pre-existing warnings.
- `pnpm --filter @onemem/hosted-dashboard test` — passed, 34 tests.
- `pnpm --filter @onemem/hosted-dashboard lint` — passed after formatting and
  import ordering fixes.
- `pnpm --filter @onemem/hosted-dashboard typecheck` — passed.
- `pnpm --filter @onemem/hosted-dashboard build` — passed; route table includes
  `/api/share/history`.
- `pnpm --filter @onemem/hosted-dashboard browser:smoke` — passed, 50 checks,
  including `/share` capability history panel and empty state.
- `pnpm test:structure` — passed, 205 checks.
- `git diff --check` — passed.

## Residual Risk

Live wallet-popup share execution remains a manual/integration proof boundary.
The browser smoke covers the rendered share history panel and missing-config API
guards without minting a real capability.
