# Verification Audit: Holder Self-Revoke

Date: 2026-06-17

## Verdict

Pass.

The TS SDK now derives a capability's phantom kind from real object type data
and can build the holder self-revoke transaction. The TS CLI exposes
`onemem namespace revoke <cap-id>` with an Admin-cap safety guard. Dashboard
`/share` now shows the real self-revoke command while still stating that
owner-driven admin revoke is not supported by the current contract.

## Artifacts Checked

- `contracts/onemem/sources/namespace.move`
- `packages/sdk-ts/src/namespaces.ts`
- `packages/sdk-ts/src/index.ts`
- `packages/sdk-ts/tests/namespaces.unit.test.ts`
- `packages/cli-ts/src/index.ts`
- `packages/cli-ts/src/commands/namespace.ts`
- `packages/cli-ts/tests/namespace.test.ts`
- `packages/dashboard/app/share/ShareView.tsx`
- `.thoughts/research/2026-06-17-holder-self-revoke.md`
- `.thoughts/specs/2026-06-17-holder-self-revoke.md`
- `.thoughts/stories/2026-06-17-holder-self-revoke.md`
- `.thoughts/plans/2026-06-17-holder-self-revoke.md`

## Requirement Traceability

- R1: `capabilityKindFromObjectType()` derives `ReadOnly`, `ReadWrite`, or
  `Admin` from `NamespaceCapability<...>` object types.
- R2: `NamespacesAPI.revokeCapability({ capId })` calls
  `namespace::revoke_capability<KIND>` with the derived or supplied kind.
- R3: CLI exposes `namespace revoke <cap-id>`.
- R4: CLI refuses Admin capability revocation unless `--allow-admin` is passed.
- R5: CLI success output includes cap id, kind, network, and transaction digest.
- R6: `/share` displays `onemem namespace revoke <capability-id>` and keeps the
  owner-driven revoke limitation explicit.

## Quality Gates

```bash
pnpm exec biome check --write packages/sdk-ts/src/namespaces.ts packages/sdk-ts/src/index.ts packages/sdk-ts/tests/namespaces.unit.test.ts packages/cli-ts/src/index.ts packages/cli-ts/src/commands/namespace.ts packages/cli-ts/tests/namespace.test.ts packages/dashboard/app/share/ShareView.tsx
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
```

All listed gates passed.

The SDK build still prints the existing package-export ordering warning for
`types` conditions. That warning predates this slice and did not fail the build.

## Live Evidence

- `node packages/cli-ts/dist/index.js namespace revoke --help` shows
  `namespace revoke <cap-id>` and `--allow-admin`.
- A read-only SDK smoke check against cap
  `0x69609e22820d65113e238bde6bf6e5fe0a2aa76bcd1a19ba1b8da77f1daa0109`
  returned `kind: "Admin"`.
- `GET /share` returned HTTP 200 and rendered
  `onemem namespace revoke <capability-id>`, `--allow-admin`,
  `holder self-revokes`, and `fake revoke action` boundary copy.
- Live disposable testnet revoke proof:
  - Temporary namespace:
    `0x362495a8baba1cc166c3a898d9069200b95aff7855fdb7eaad9a191d8bc254fd`.
  - Shared ReadOnly cap:
    `0xcf95dbe4d5387b349f53189997f2bf25ed4cc9b4472b1f8e1cf53d41924ef90b`.
  - `onemem namespace capabilities` showed the cap after share.
  - `onemem namespace revoke` consumed that cap as `ReadOnly`.
  - Revoke transaction digest: `VxQsgGzoPGBjT5Eqr5ZVzCeL4N5QWkG4RQhMSgyMWaT`.
  - Capability count changed from `3` to `2` after revoke, and the revoked cap
    was absent from the post-revoke capability list.

## Deviations From Plan

- No hosted revoke endpoint or button was added.

## Remaining Follow-ups

- Implement owner-driven revoke only after the Move contract supports it.
