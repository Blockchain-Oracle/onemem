# Spec: Hosted Share Capability Creation

## Objective

Let a connected hosted user sponsor and sign a real namespace capability mint to
another Sui address from `/share`, using the same Enoki sponsored transaction
boundary already used for onboarding.

## Background And Current Reality

The local dashboard `/share` now gives honest CLI commands for capability
sharing, but hosted share was explicitly excluded from that readiness slice.
The hosted app has Enoki/dApp Kit providers, a two-step sponsored onboarding
flow, and server routes that prepare/execute allowlisted transaction kinds. At
spec time, the hosted dashboard linked to `/share`, but the hosted app did not
own that route. The prototype shows owner and recipient share views, link
generation, and revoke UI; the current Move contract only supports holder
self-revoke, not owner-driven revoke of another holder's capability.

## Users

- Hosted namespace owners who have a namespace and Admin cap from onboarding.
- Teammates receiving ReadOnly or ReadWrite namespace access.
- Deployment operators verifying that hosted sharing is real and does not leak
  Enoki/private signing material.

## Goals

- Add a hosted `/share` route with account-gated share capability creation.
- Reuse locally persisted hosted provisioning IDs for namespace/Admin cap
  inputs when available.
- Let the owner choose recipient address and ReadOnly/ReadWrite capability kind.
- Prepare only allowlisted OneMem capability-mint transactions on the server.
- Sign sponsored bytes in the browser with dApp Kit and execute on the server.
- Display only real transaction digests and created capability IDs returned from
  executed Sui transaction effects.
- Keep public verification-link sharing available.
- State the revocation and recipient-claim boundaries honestly.

## Non-goals

- No owner-driven revoke button.
- No `/share/[capability_id]` recipient claim route.
- No direct private-key or unsponsored transaction flow.
- No contract changes.
- No fake capability IDs, fake successful states, or simulated on-chain
  activity.
- No server-side persistence of share history in this slice.

## Requirements

- R1: Hosted sponsorship actions must include ReadOnly and ReadWrite recipient
  capability mints in addition to existing onboarding actions.
- R2: Preparation must validate sender, recipient, namespace ID, Admin cap ID,
  network, and capability kind before calling Enoki.
- R3: Sponsored preparation must allowlist only the exact OneMem Move target for
  the chosen capability kind and the sender/recipient addresses involved.
- R4: Execution must wait for the Sui transaction and parse the created
  `NamespaceCapability<ReadOnly|ReadWrite>` object ID from transaction object
  changes.
- R5: Hosted `/share` must be usable without a shared local dashboard route and
  must render disconnected, missing-provisioning, and ready-to-share states.
- R6: The hosted UI must use `useSignTransaction` on bytes returned by the
  server and must not expose Enoki private keys or raw secrets.
- R7: The share form must default from `loadHostedProvisioningState()` when the
  connected account/network matches, but allow explicit namespace/Admin cap
  input for manual recovery.
- R8: Successful UI state must show recipient, capability kind, capability ID,
  and transaction digest from server execution.
- R9: The page must preserve the public verification-link helper.
- R10: The page must state that recipient claim links and owner-driven revocation
  are separate future work under the current contract boundary.

## Acceptance Criteria

- AC1: Hosted sponsored preparation rejects malformed share inputs before Enoki
  calls.
- AC2: The helper can prepare ReadOnly and ReadWrite share actions with strict
  target/address allowlists.
- AC3: Execute parsing returns the expected capability ID for each share kind
  from real transaction object changes.
- AC4: Hosted `/share` renders disconnected, missing provisioning/manual input,
  public verification, proof-boundary, and share form copy in browser smoke.
- AC5: Hosted test/lint/typecheck/build/browser-smoke and structure gates pass.
- AC6: Context Engineering status and verification artifacts record what is
  complete and what remains manual/live proof.

## Constraints

- Use installed `@mysten/enoki`, `@mysten/dapp-kit`, and `@mysten/sui` APIs.
- Automated browser smoke runs without wallet popup completion and with Enoki
  private config intentionally blank.
- Do not print or persist private keys.
- Do not claim hosted share is live-proven unless a real sponsored share
  transaction is executed and inspected.

## Stories Needed

- Story 1: Owner opens hosted `/share` and sees current readiness.
- Story 2: Owner prepares, signs, and executes a sponsored share mint.
- Story 3: Operator verifies missing-config and proof-boundary behavior safely.

## Open Questions

- Superseded by `.thoughts/specs/2026-06-17-recipient-share-landing.md`:
  `/share/[capability_id]` became a read-only recipient capability object view,
  not a claim transaction.
- Should share history be read from on-chain events and filtered by the connected
  owner's namespaces in a later slice?

## Source References

- `.thoughts/specs/2026-06-17-share-capability-readiness.md`
- `.thoughts/specs/2026-06-17-hosted-sponsored-provisioning.md`
- `.thoughts/prototype-discovery/2026-06-17-one-mem-2.md`
- `/Users/abu/Downloads/One Mem 2/Share.html`
- `apps/hosted-dashboard/lib/sponsored-provisioning.ts`
- `apps/hosted-dashboard/app/onboarding/SponsoredProvisioning.tsx`
- `packages/dashboard/app/share/ShareView.tsx`
- Enoki sponsored transactions docs via Context7 `/websites/enoki_mystenlabs`
