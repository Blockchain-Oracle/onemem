# Spec: Recipient Share Landing

## Objective

Add a hosted public `/share/[capability_id]` route that lets a recipient inspect
the real Sui namespace capability they received without pretending there is a
separate hosted claim transaction.

## Users

- Recipients who receive a OneMem capability link from a namespace owner.
- Namespace owners verifying that a share link points at a real capability.
- Demo reviewers who need to see capability ownership and namespace metadata.

## Goals

- Add a reusable SDK helper for reading capability kind, namespace id, owner,
  and object type from Sui.
- Add hosted server-side loading for capability plus namespace summary.
- Render `/share/[capability_id]` for both found and not-found capability IDs.
- Let a connected wallet compare itself against the on-chain capability owner.
- Link to Suiscan for both capability and namespace objects.
- Preserve the contract boundary: minted capabilities are already owned by the
  recipient; there is no claim transfer in v0.1.

## Non-goals

- No ownership transfer or hosted claim transaction.
- No owner-driven revoke.
- No Seal/Walrus decrypt.
- No runtime credential creation.
- No server-side share history database.
- No live wallet-popup transaction in automated smoke.

## Requirements

- R1: SDK must expose a full capability read method in addition to
  `getCapabilityKind()`.
- R2: The parser must reject non-capability object types and missing
  `namespace_id` fields.
- R3: Hosted loader must return a public not-found result instead of throwing a
  route-level 500 when the capability object is absent.
- R4: Hosted loader must degrade gracefully if namespace lookup fails after a
  capability was read.
- R5: The page must show capability kind, owner kind/address, namespace id,
  network, namespace metadata when available, and Suiscan links.
- R6: Connected-account UI must compare the current wallet to the capability
  owner without creating a claim mutation.
- R7: Browser smoke must cover the dynamic route with a deterministic missing
  object state.
- R8: Docs/status must distinguish implemented recipient landing from future
  claim/transfer and owner-driven revoke work.

## Acceptance Criteria

- AC1: SDK unit tests parse capability details and owner variants.
- AC2: `NamespacesAPI.getCapability()` calls `getObject` with type, content,
  and owner options and returns parsed metadata.
- AC3: Hosted helper tests cover success, missing capability, and namespace
  lookup failure.
- AC4: `/share/[capability_id]` renders a public not-found state in browser
  smoke without console/resource failures.
- AC5: Hosted and SDK test/typecheck/build gates pass for affected packages.
- AC6: Structure tests include the dynamic route and new context artifacts.
- AC7: Verification audit records that this is a landing page, not a claim
  transaction.

## Source References

- `.thoughts/specs/2026-06-17-hosted-share-capability-creation.md`
- `.thoughts/research/2026-06-17-recipient-share-landing.md`
- `contracts/onemem/sources/namespace.move`
- `packages/sdk-ts/src/namespaces.ts`
- `apps/hosted-dashboard/app/share/HostedShareView.tsx`
- Context7 `/mystenlabs/ts-sdks` Sui object read documentation
