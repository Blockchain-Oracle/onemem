# Spec: Recipient Capability Self-Revoke

## Objective

Make hosted recipient capability pages explain and expose the only revocation
path supported by contract v0.1: holder self-revoke through the CLI.

## Background And Current Reality

The hosted share flow mints a namespace capability directly to the recipient
wallet. Contract v0.1 has no separate claim transaction and no owner/admin revoke
of another holder's object. The holder can consume their own capability object
with `namespace::revoke_capability<KIND>`, surfaced by the TS CLI as
`onemem namespace revoke <cap-id>`.

## Users

- Capability recipients who want to understand or renounce access.
- Namespace owners reviewing what the hosted share page can and cannot do.
- Future agents maintaining the share lifecycle.

## Goals

- Show the exact holder self-revoke CLI command on `/share/[capability_id]`.
- State that self-revoke consumes the capability object and must be run by the
  wallet or runtime credential that owns it.
- Preserve the no-claim and no-owner-driven-revoke boundaries.
- Add tests for command generation and browser smoke coverage for the public
  missing-capability route boundary.

## Non-goals

- Do not add owner/admin-driven revoke.
- Do not add a hosted wallet-signed revoke flow.
- Do not add a separate claim transaction.
- Do not change the Move contract.

## Requirements

- R1: Recipient capability pages must display a self-revoke section for loaded
  capabilities.
- R2: The self-revoke command must be `onemem namespace revoke <cap-id>` for
  ReadOnly/ReadWrite capabilities.
- R3: The self-revoke command must include `--allow-admin` for Admin
  capabilities, matching the CLI safety guard.
- R4: The page must state that owner-driven revocation is not supported by
  contract v0.1.
- R5: Tests must cover revoke command generation.
- R6: Context Engineering artifacts and wiki/log must record the slice.

## Acceptance Criteria

- AC1: `pnpm --filter @onemem/hosted-dashboard test` passes.
- AC2: `pnpm --filter @onemem/hosted-dashboard typecheck` passes.
- AC3: `pnpm --filter @onemem/hosted-dashboard lint` passes.
- AC4: `pnpm --filter @onemem/hosted-dashboard build` passes.
- AC5: `pnpm --filter @onemem/hosted-dashboard browser:smoke` passes.
- AC6: `pnpm test:structure` passes.
- AC7: `git diff --check` passes.

## Constraints

- Existing dirty worktree must be preserved.
- UI copy must not imply a hosted revoke or owner-driven revoke action.
- Browser verification should prefer the Chrome plugin when available; the
  repo-owned smoke harness remains committed regression coverage.

## Stories Needed

- Recipient sees how to self-revoke.
- Owner sees the honest protocol boundary.
- Maintainer gets tests for command generation.

## Open Questions

- Whether a future hosted revoke button should be added after wallet-signed
  holder transactions are product-approved.

## Source References

- `.thoughts/research/2026-06-17-recipient-capability-self-revoke.md`
- `contracts/onemem/sources/namespace.move`
- `packages/cli-ts/src/commands/namespace.ts`
- `apps/hosted-dashboard/app/share/[capability_id]/page.tsx`
