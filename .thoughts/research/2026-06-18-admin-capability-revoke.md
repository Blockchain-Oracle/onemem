# Reality Research: Admin Capability Revoke

## Scope

Current OneMem namespace capability revoke behavior, whether owner/admin-driven
revoke can be made enforceable without taking a holder-owned Sui object, and
which code paths must change for honest enforcement.

## Sources Checked

- `contracts/onemem/sources/namespace.move`
- `contracts/onemem/sources/trace.move`
- `contracts/onemem/sources/seal_policy.move`
- `contracts/onemem/sources/version.move`
- `contracts/onemem/tests/capability_transfer_tests.move`
- `packages/sdk-ts/src/namespaces.ts`
- `packages/sdk-ts/src/traces.ts`
- `packages/sdk-ts/src/runtime.ts`
- `packages/cli-ts/src/commands/namespace.ts`
- `packages/mcp-server/src/index.ts`
- `.thoughts/research/2026-06-17-holder-self-revoke.md`
- `.thoughts/research/2026-06-18-hosted-holder-self-revoke.md`
- Context7 docs for `/mystenlabs/sui`, query:
  `Sui Move dynamic_field add exists borrow ID key revocation marker`

## Verified Facts

- `namespace::revoke_capability<KIND>(cap)` is holder self-revoke only because
  it consumes the `NamespaceCapability<KIND>` object supplied by the signer.
- `NamespaceCapability<KIND>` stores only `id` and `namespace_id`; it has no
  epoch or revoked field.
- `MemoryNamespace` already stores schema version as a dynamic field through
  `onemem::version`, so dynamic fields are an accepted upgrade pattern in this
  package.
- Sui `dynamic_field::add` adds a field under a UID and aborts if that field
  already exists; `dynamic_field::exists` can guard idempotent adds.
- `trace::open_session` and `trace::emit_call` currently call
  `namespace::assert_cap_for_namespace`.
- `trace::close_call`, `trace::close_session`, and `seal_policy::seal_approve`
  currently compare namespace IDs without consulting any revocation marker.
- The TS SDK exposes holder self-revoke through
  `NamespacesAPI.revokeCapability`.
- The TS CLI exposes `onemem namespace revoke <cap-id>` as holder self-revoke
  and guards Admin cap burn with `--allow-admin`.
- The MCP server exposes namespace sharing but no capability revoke tool.

## Inferences

- Admin-driven revoke cannot delete someone else's owned cap object directly
  under the current Sui object model.
- Admin-driven revoke can still be enforceable if the admin records a revoked
  cap ID on the shared namespace and every write/decrypt authorization path
  checks that marker against the presented cap object.
- A marker-only event without authorization checks would be fake revoke; the cap
  object would remain usable.
- To enforce revocation for trace close operations, `trace::close_call` and
  `trace::close_session` need a namespace reference, because the revoked marker
  lives under the namespace UID.

## Unknowns And Questions

- Whether existing deployed package IDs should continue accepting the old
  `trace::close_call` and `trace::close_session` shape until all clients
  upgrade. The source package can be made internally consistent now; deployed
  migration/release sequencing remains separate.
- Whether hosted UI should surface owner/admin revoke immediately. The protocol,
  SDK, CLI, and MCP path are the first enforceable layer.

## Not Included

- No live testnet revoke mutation was run during research.
- No recipient claim-link redesign is included in this slice.
