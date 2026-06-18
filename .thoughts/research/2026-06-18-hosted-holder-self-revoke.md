# Reality Research: Hosted Holder Self-Revoke

## Scope

Current support for revoking namespace capabilities from hosted recipient share
pages, and whether contract v0.1 can support a hosted wallet-signed holder
self-revoke without protocol changes.

## Sources Checked

- `contracts/onemem/sources/namespace.move`
- `packages/sdk-ts/src/namespaces.ts`
- `apps/hosted-dashboard/app/share/[capability_id]/page.tsx`
- `apps/hosted-dashboard/app/share/[capability_id]/ShareCapabilityAccountHint.tsx`
- `apps/hosted-dashboard/lib/sponsored-provisioning.ts`
- `apps/hosted-dashboard/app/api/share/sponsored/prepare/route.ts`
- `apps/hosted-dashboard/app/api/share/sponsored/execute/route.ts`
- `apps/hosted-dashboard/lib/sponsored-provisioning.test.ts`
- `apps/hosted-dashboard/scripts/browser-smoke.mjs`
- `.thoughts/wiki/context-engineering-status.md`

## Verified Facts

- Contract v0.1 exposes `namespace::revoke_capability<KIND>(cap)` and consumes
  the capability object passed by the transaction sender.
- The Move contract comments explicitly state this is holder self-revoke only;
  admin-driven revocation of somebody else's capability is a v0.2 design.
- The TypeScript SDK exposes `NamespacesAPI.revokeCapability(...)` for holder
  self-revoke and resolves the phantom capability kind when the caller does not
  provide it.
- Hosted `/share/[capability_id]` already loads the capability object, owner,
  namespace ID, namespace metadata, and capability kind from Sui.
- Hosted `/share/[capability_id]` currently renders only a CLI command for
  holder self-revoke.
- Hosted `/share` already uses `/api/share/sponsored/prepare` and
  `/api/share/sponsored/execute` for Enoki-sponsored namespace capability mint
  transactions.
- The hosted sponsorship helper has a strict action allowlist and builds named
  transaction kinds. Current actions include namespace creation, RW cap mint,
  RO share, and RW share. It does not yet include self-revoke.
- The hosted browser smoke validates the recipient-share not-found path and
  share sponsorship missing-config behavior, but it does not exercise a
  connected wallet popup.

## Inferences

- Hosted holder self-revoke can be implemented as another named sponsored
  action that calls `namespace::revoke_capability<KIND>` with the holder-owned
  cap object. It does not require a contract change.
- The page can enable the action only when the connected account matches the
  address owner of the capability object, because object ownership is already
  read from Sui.
- Admin-cap self-revoke should be guarded in UI because consuming an Admin cap
  can remove namespace administration access.
- Owner-driven revoke remains out of scope and should keep being described as
  protocol v0.2 work.

## Unknowns And Questions

- Whether Enoki sponsorship policy enforces extra object allowlisting beyond
  `allowedMoveCallTargets` and `allowedAddresses` for this transaction shape.
- Whether a live wallet-popup execution can be completed from this shell without
  configured Enoki and wallet state.

## Not Included

- No live wallet popup transaction was executed during research.
- No Move protocol change was researched beyond confirming current v0.1
  self-revoke semantics.
