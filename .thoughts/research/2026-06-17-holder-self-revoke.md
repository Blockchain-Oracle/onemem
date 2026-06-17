# Research: Holder Self-Revoke

Date: 2026-06-17

## Source Material

- `contracts/onemem/sources/namespace.move`
- `packages/sdk-ts/src/namespaces.ts`
- `packages/cli-ts/src/commands/namespace.ts`
- `packages/dashboard/app/share/ShareView.tsx`
- `.thoughts/prototype-discovery/2026-06-17-one-mem-2.md`
- `.thoughts/verification/2026-06-17-share-capability-readiness.md`

## Findings

- The Move contract already exposes
  `namespace::revoke_capability<KIND>(cap: NamespaceCapability<KIND>)`.
- This function consumes the cap object and emits
  `NamespaceCapabilityRevokedEvent`.
- This is holder self-revoke only. The contract comment explicitly says
  admin-driven revocation of someone else's capability is v0.2 work.
- The TS SDK currently lists active capabilities by subtracting revoked events
  from minted events, but it does not expose a method to burn a capability.
- The TS CLI now exposes share/list commands, but no revoke command.
- Dashboard `/share` honestly states the contract boundary but does not give the
  holder a concrete self-revoke command.

## Decision

Implement the v0.1 holder self-revoke path:

- SDK method to inspect capability kind from object type.
- SDK method to revoke a capability by consuming the cap object.
- CLI command `onemem namespace revoke <cap-id>`.
- CLI safety guard for Admin caps, requiring an explicit opt-in.
- Dashboard copy that points holders to the real CLI command while preserving
  the owner-driven revoke limitation.

Do not implement hosted revoke, admin-driven revoke, or a fake dashboard button.
