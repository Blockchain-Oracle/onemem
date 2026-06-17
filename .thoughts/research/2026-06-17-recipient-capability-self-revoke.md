# Reality Research: Recipient Capability Self-Revoke

## Scope

Audit whether the hosted recipient share page can support any revocation action
honestly under the current contract, SDK, CLI, and hosted share implementation.

## Sources Checked

- `contracts/onemem/sources/namespace.move`
- `packages/sdk-ts/src/namespaces.ts`
- `packages/cli-ts/src/index.ts`
- `packages/cli-ts/src/commands/namespace.ts`
- `apps/hosted-dashboard/app/share/HostedShareView.tsx`
- `apps/hosted-dashboard/app/share/[capability_id]/page.tsx`
- `apps/hosted-dashboard/app/share/[capability_id]/ShareCapabilityAccountHint.tsx`
- `apps/hosted-dashboard/lib/share-capability.ts`
- `apps/hosted-dashboard/scripts/browser-smoke.mjs`

## Verified Facts

- The Move contract mints ReadOnly/ReadWrite capability objects directly to the
  recipient during `mint_capability_readonly` and
  `mint_capability_readwrite`.
- The Move contract's only revoke entry point is
  `revoke_capability<KIND>(cap: NamespaceCapability<KIND>)`, which consumes the
  capability object. Because Sui only lets a transaction use objects it owns or
  is authorized to use, this is holder self-revoke.
- The Move source explicitly says admin-driven revocation of another holder's
  cap is a v0.2 design requiring a wrapper container or namespace version bump.
- The SDK mirrors that boundary with `NamespacesAPI.revokeCapability()`, whose
  comment says it is holder self-revoke, not owner-driven revocation.
- The TS CLI exposes `onemem namespace revoke <cap-id>` and prints
  `scope holder self-revoke`; it requires `--allow-admin` for Admin caps.
- Hosted `/share/[capability_id]` already loads the capability object, owner,
  kind, namespace, and public Suiscan links, and it states there is no separate
  claim transaction.
- Hosted `/share/[capability_id]` does not currently show the exact self-revoke
  command that a capability holder can run.

## Inferences

- The correct next product improvement is to expose holder self-revoke guidance
  on the recipient capability page, not to invent owner-driven revoke or a hosted
  claim transaction.
- The command should include `--allow-admin` only for Admin capabilities because
  the CLI intentionally guards Admin-cap revocation.

## Unknowns And Questions

- A future contract version may support owner/admin-driven revoke, but this
  cannot be done honestly against the current contract.

## Not Included

- No contract migration.
- No hosted wallet-signed revoke transaction.
- No separate claim/transfer flow.
