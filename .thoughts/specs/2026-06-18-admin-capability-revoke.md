# Spec: Admin Capability Revoke

## Objective

Add real Admin-capability revocation for namespace capabilities so a namespace
admin can revoke a shared cap by ID and the revoked cap can no longer authorize
trace writes or Seal decrypt approval.

## Background And Current Reality

OneMem already supports direct capability sharing and holder self-revoke.
Holder self-revoke consumes the holder-owned capability object. An admin cannot
consume another user's owned Sui object, so admin revoke needs a namespace-level
revocation marker that authorization gates enforce.

## Users

- Namespace administrators who need to withdraw shared access.
- Runtime/plugin operators whose write caps must stop working after revoke.
- Recipients whose held cap object may still exist but should no longer grant
  OneMem authorization.

## Goals

- Add an Admin-gated protocol function that records a cap ID as revoked under
  the namespace.
- Make the revocation enforceable for trace writes and Seal decrypt approval.
- Expose the path through TS SDK, TS CLI, and MCP.
- Keep holder self-revoke behavior intact.
- Preserve current event-backed capability history where possible.

## Non-goals

- Do not delete a cap object owned by another address.
- Do not implement recipient claim links.
- Do not build a hosted dashboard admin-revoke UI in this slice.
- Do not run destructive live revoke against existing real cap objects.

## Requirements

- R1: `namespace.move` must expose an Admin-gated revoke-by-cap-id function.
- R2: Revoked cap IDs must be stored on-chain under the namespace UID.
- R3: Revoking the same cap ID twice must not fail because the marker already
  exists.
- R4: `namespace::assert_cap_for_namespace` must reject revoked caps.
- R5: `trace::open_session`, `trace::emit_call`, `trace::close_call`, and
  `trace::close_session` must reject revoked RW caps.
- R6: `seal_policy::seal_approve` must reject revoked ReadOnly, ReadWrite, and
  Admin caps.
- R7: TS SDK must expose admin revoke without claiming it deletes the cap object.
- R8: TS CLI must expose admin revoke and guard Admin cap revocation by default.
- R9: MCP must expose admin revoke for agent/runtime use.
- R10: Documentation must distinguish holder self-revoke from admin revoke.

## Acceptance Criteria

- AC1: Move tests cover admin revoke marker behavior and authorization denial.
- AC2: TS unit tests cover CLI option parsing/safety and SDK transaction target.
- AC3: MCP tests confirm the revoke tool is registered.
- AC4: Contract tests and focused TS tests pass locally.
- AC5: Structure tests pass.
- AC6: Verification audit records any live-test omissions honestly.

## Constraints

- Product source files should stay under the repo's 400-line cap.
- Existing holder self-revoke command remains `onemem namespace revoke <cap-id>`.
- Admin revoke must not be represented as object deletion.

## Stories Needed

- Admin revokes a ReadWrite cap and the recipient can no longer write traces.
- Admin revokes a ReadOnly cap and the recipient can no longer approve Seal
  decrypt.
- Operator invokes admin revoke through CLI/MCP without accidentally burning an
  Admin cap.

## Open Questions

- Should hosted dashboard owner/admin revoke be a follow-up after protocol and
  CLI/MCP coverage lands?
- Should future events include revoker metadata, or is the current
  minted-minus-revoked history enough for this milestone?

## Source References

- `.thoughts/research/2026-06-18-admin-capability-revoke.md`
- `.thoughts/research/2026-06-17-holder-self-revoke.md`
- Context7 `/mystenlabs/sui` dynamic field docs
