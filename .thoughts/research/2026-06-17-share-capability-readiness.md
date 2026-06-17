# Reality Research: Share Capability Readiness

## Scope

Inspect the current Share route, static prototype, Move namespace capability
contract, SDK namespace API, and CLI surface to determine the real gap around
namespace sharing before implementation.

## Sources Checked

- `.thoughts/prototype-discovery/2026-06-17-one-mem-2.md`
- `.thoughts/wiki/context-engineering-status.md`
- `/Users/abu/Downloads/One Mem 2/Share.html`
- `packages/dashboard/app/share/ShareView.tsx`
- `packages/dashboard/app/share/page.tsx`
- `packages/dashboard/lib/namespaces.ts`
- `packages/dashboard/app/api/capabilities/[id]/route.ts`
- `packages/sdk-ts/src/namespaces.ts`
- `packages/sdk-ts/src/runtime.ts`
- `contracts/onemem/sources/namespace.move`
- `packages/cli-ts/src/index.ts`
- `packages/cli-ts/src/commands/init.ts`
- `packages/cli-python/onemem_cli/main.py`

## Verified Facts

- The Share prototype has owner and recipient modes, capability details, generated
  sharing link, revoke confirmation, recipient activity, and recipient accept UI.
- Current `/share` only renders a public verification-link helper and a static
  "Grant namespace access" card.
- Current `/share` prints `onemem namespace share <recipient> --cap ReadOnly`.
- The current TypeScript CLI does not define a `namespace` command group or a
  `namespace share` subcommand.
- The current Python CLI is verification-focused and does not expose namespace
  provisioning or capability sharing.
- The TypeScript SDK already supports signer-backed `shareReadOnly()` and
  `shareReadWrite()` methods that mint and transfer capabilities with an admin
  cap.
- The TypeScript SDK supports read-only `getCapabilities(namespaceId)`, returning
  active capabilities by subtracting revoked cap IDs from minted events.
- The Move contract emits `NamespaceCapabilityMintedEvent` with namespace ID, cap
  ID, kind tag, and recipient.
- The Move contract emits `NamespaceCapabilityRevokedEvent` when a capability
  object is burned.
- `namespace.move` v0.1 revoke is holder self-revoke: `revoke_capability<KIND>`
  consumes the cap object the caller owns. Admin-driven revocation of another
  holder's cap is explicitly noted as v0.2 design.
- `ensureNamespace()` creates an Admin cap and uses it to mint a ReadWrite cap,
  but current `ProvisionedTarget` only persists/returns namespace ID and RW cap
  ID, not the Admin cap ID.

## Inferences

- The first safe Share implementation should make capability sharing executable
  from the TS CLI and make the dashboard explain the exact signer/admin-cap
  requirements.
- The dashboard should list active capabilities for the configured namespace when
  `ONEMEM_NAMESPACE_ID` is set, using existing read-only event data.
- The dashboard must not show an owner "revoke this recipient" button until the
  protocol supports admin-driven revocation or a hosted signer boundary is built.
- Persisting and printing the Admin cap ID during `onemem init` would make future
  sharing easier, but old persisted targets may not have that field.

## Unknowns And Questions

- Whether the CLI should add holder self-revoke in this pass or wait for a
  clearer UX around generic Move type arguments.
- Whether hosted dashboard should later sponsor recipient claim/share transactions
  through Enoki.
- Whether `/share/[capability-id]` should be built as a separate recipient route
  after this readiness slice.

## Not Included

- Hosted recipient claim flow.
- Owner-driven revocation of someone else's capability.
- Enoki/sponsored transaction implementation.
- Python CLI namespace mutation support.
