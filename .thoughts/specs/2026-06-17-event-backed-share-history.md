# Spec: Event-backed Share History

## Objective

Show hosted `/share` users a read-only namespace capability history backed by
Sui events, so the page is not limited to the last capability minted in the
current browser session.

## Background And Current Reality

Hosted `/share` can mint ReadOnly/ReadWrite capabilities and display the latest
created capability ID returned from transaction effects. The contract already
emits capability mint and revoke events, and the SDK already uses those events
to compute active capabilities. The hosted page does not currently display
event-backed history.

## Users

- Hosted namespace owners reviewing who has been granted access.
- Recipients and demo reviewers checking that capability state is derived from
  Sui, not local UI state.
- Operators verifying that hosted sharing remains read-only outside explicit
  sponsored mint actions.

## Goals

- Add a reusable SDK read method for namespace capability history.
- Join minted and revoked events into rows with active/revoked status.
- Include cap id, kind, recipient, mint tx, mint timestamp, revoke tx, revoke
  timestamp, and active flag when available.
- Add a hosted read-only API route for share history.
- Render a hosted `/share` history panel for the current/manual namespace ID.
- Refresh history after a successful hosted share mint.
- Keep no-history, loading, error, and not-configured states explicit.
- Keep owner-driven revoke and claim/transfer semantics out of scope.

## Non-goals

- No revoke mutation.
- No hosted claim transaction.
- No server database for shares.
- No fake rows when no namespace is entered.
- No claim that live wallet-popup share execution is automated.

## Requirements

- R1: SDK history reader must query both
  `NamespaceCapabilityMintedEvent` and `NamespaceCapabilityRevokedEvent` for a
  namespace.
- R2: SDK history reader must join revoked rows to original minted rows by
  `cap_id` and mark `active` false when revoked.
- R3: History rows must retain transaction digest, event sequence, timestamp,
  kind tag, and recipient where available.
- R4: Hosted API must validate namespace IDs and network before querying.
- R5: Hosted `/share` must show history from the current namespace input,
  including empty, loading, error, active, and revoked states.
- R6: Successful hosted share mint must trigger a history refresh.
- R7: Browser smoke must cover the visible history panel without requiring a
  wallet popup or live share execution.
- R8: Docs and Context Engineering status must record that share history is
  event-backed and read-only.

## Acceptance Criteria

- AC1: SDK unit tests prove minted/revoked event joining and sorting.
- AC2: Hosted helper/API tests prove namespace validation and response shape.
- AC3: Hosted `/share` browser smoke sees the history panel and no-namespace
  empty state.
- AC4: Hosted test/lint/typecheck/build/browser-smoke pass.
- AC5: SDK test/typecheck/build pass for the new read method.
- AC6: `pnpm test:structure` and `git diff --check` pass.

## Constraints

- Use Sui SDK `queryEvents`; do not introduce another indexer.
- Keep source files below the repository 400-line cap.
- Do not expose private keys or Enoki server config.
- Treat timestamps as best-effort event metadata; show stable fallback text when
  unavailable.

## Stories Needed

- Story 1: Owner sees event-backed capability history for a namespace.
- Story 2: Revoked capabilities are labeled honestly.
- Story 3: Hosted page handles missing namespace/history safely.
- Story 4: Share creation refreshes history.

## Open Questions

- Whether local dashboard `/share` should later replace its active-only list
  with the same event-history component.
- Whether future history should include namespace deactivation/reactivation
  alongside capability rows.

## Source References

- `.thoughts/research/2026-06-17-event-backed-share-history.md`
- `contracts/onemem/sources/namespace.move`
- `packages/sdk-ts/src/namespaces.ts`
- `apps/hosted-dashboard/app/share/HostedShareView.tsx`
- Context7 `/mystenlabs/ts-sdks` event query docs
