# Reality Research: Event-backed Share History

## Scope

Current reality for showing hosted `/share` users a real capability history
after owner-sponsored share creation. This research is limited to reading Sui
events and rendering history; it does not propose owner-driven revoke or a claim
transaction.

## Sources Checked

- Context7 `/mystenlabs/ts-sdks` docs for `queryEvents`.
- `contracts/onemem/sources/namespace.move`
- `packages/sdk-ts/src/namespaces.ts`
- `packages/dashboard/lib/namespaces.ts`
- `packages/dashboard/app/share/ShareView.tsx`
- `apps/hosted-dashboard/app/share/HostedShareView.tsx`
- `apps/hosted-dashboard/app/share/[capability_id]/page.tsx`
- `.thoughts/wiki/context-engineering-status.md`

## Verified Facts

- The Move contract emits `NamespaceCapabilityMintedEvent` with
  `namespace_id`, `cap_id`, `kind_tag`, and `recipient`.
- The Move contract emits `NamespaceCapabilityRevokedEvent` with
  `namespace_id` and `cap_id`.
- Revoked events do not include recipient or kind; those must be joined from
  the original mint event when displaying revoked rows.
- `NamespacesAPI.getCapabilities(namespaceId)` already queries minted and
  revoked events and returns active minted-minus-revoked rows.
- Local dashboard `/share` renders active capabilities but does not show
  timestamps, transaction digests, or revoked rows.
- Hosted `/share` currently shows the last capability minted in the current
  browser session only. It does not read chain history for the namespace.
- Hosted `/share/[capability_id]` can inspect an individual capability object,
  but it is not a namespace history surface.
- Context7 documents `queryEvents({ query, limit })` for Sui SDK event queries
  and notes event filtering by criteria such as sender/type; existing repo code
  already uses `MoveEventType`, `cursor`, `order`, and `limit`.

## Inferences

- A chain-backed history should be derived from
  `NamespaceCapabilityMintedEvent` plus `NamespaceCapabilityRevokedEvent`.
- The history can safely show Admin cap creation as a row because namespace
  creation emits an Admin cap mint event; the UI should label it instead of
  pretending every row is a user-created share.
- Since `NamespaceCapabilityRevokedEvent` does not include recipient/kind, the
  UI should mark unmatched revoked events conservatively if they ever appear.
- The hosted route can expose a read-only API for history because it does not
  need Enoki private keys or wallet signing.

## Unknowns And Questions

- Event timestamp availability depends on Sui event response metadata; existing
  repo code uses `timestampMs` on event responses, so this slice should preserve
  a `0` fallback instead of overclaiming exact time for all rows.
- Live wallet-popup share execution remains manual proof; automated tests can
  validate event joining and browser empty-state behavior.

## Not Included

- Owner-driven revoke.
- Recipient claim/transfer transaction.
- Server-side share history persistence.
- Seal/Walrus decrypt or runtime usage proof.
