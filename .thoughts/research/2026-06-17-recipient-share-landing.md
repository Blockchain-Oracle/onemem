# Research: Recipient Share Landing

## Question

What should `/share/[capability_id]` honestly do now that hosted `/share`
can mint ReadOnly/ReadWrite capability objects?

## Findings

- Hosted `/share` creates a capability object directly for the recipient
  address through sponsored transaction execution. The created object ID is the
  durable share link target.
- The Move contract stores `NamespaceCapability<KIND> { id, namespace_id }`.
  The permission kind is a phantom type, so the SDK must derive it from the
  Sui object type.
- Sui object reads can fetch the object type, content, and owner in one
  `getObject({ id, options: { showType, showContent, showOwner } })` call.
  Context7 refreshed the current Mysten TypeScript SDK docs from
  `/mystenlabs/ts-sdks` before this slice.
- The current contract has no separate recipient claim transaction. A minted
  capability already belongs to its recipient owner. A recipient landing page
  should therefore be a public object inspector plus account-owner comparison,
  not a fake claim button.
- Namespace metadata can be loaded from `MemoryNamespace` fields after reading
  the `namespace_id` from the capability object. If namespace lookup fails, the
  capability object remains the source of truth.
- Codex-memory plugin work is already tracked separately in
  `.thoughts/research/2026-06-17-codex-memory-plugin.md`,
  `.thoughts/specs/2026-06-17-codex-memory-plugin.md`, and
  `.thoughts/plans/2026-06-17-codex-memory-plugin.md`; it should stay parked
  while this share-specific route is completed.

## Current Gaps

- `packages/sdk-ts` exposes `getCapabilityKind()` but not a full
  capability-metadata read helper.
- Hosted dashboard has `/share` but no `/share/[capability_id]`.
- Browser smoke covers `/share` and `/verify/[session_id]`, not recipient share
  links.
- Current docs still say recipient claim links are future work; after this
  slice, the accurate statement should be that recipient landing links exist,
  while claim/transfer mutation remains future work.

## Decision

Build `/share/[capability_id]` as a read-only recipient landing page:

- read capability kind, owner, namespace id, and namespace summary from Sui;
- show account-owner comparison when a wallet is connected;
- link to Suiscan for capability and namespace objects;
- state that no claim transaction exists in contract v0.1;
- keep owner-driven revoke and runtime usage proof out of this slice.
