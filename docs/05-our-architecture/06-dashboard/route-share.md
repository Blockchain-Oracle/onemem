# Route: `/share` — Dashboard

Namespace sharing is a Sui-native capability mint. A share is complete only when
a real `NamespaceCapability<ReadOnly|ReadWrite>` object is minted and
transferred to the recipient address.

---

## Current Route Split

| Surface | Route | Current behavior |
|---|---|---|
| Local dashboard | `/share` in `packages/dashboard` | Shows public verifier links, configured namespace state, active capabilities, CLI share commands, and the v0.1 revoke boundary. |
| Hosted dashboard | `/share` in `apps/hosted-dashboard` | Lets a connected account mint a sponsored ReadOnly or ReadWrite capability to a recipient address and review event-backed capability history for a namespace. |
| Recipient landing | `/share/[capability_id]` in `apps/hosted-dashboard` | Public read-only capability object view. Reads `NamespaceCapability` kind, owner, namespace id, and namespace summary from Sui; no claim transaction. |

---

## Hosted Owner Share Flow

```
Owner opens app.onemem.ai/share
  ↓
Connects wallet / Enoki account through dApp Kit
  ↓
Page loads hosted provisioning state from browser storage when available
  ↓
GET /api/share/history?namespaceId=<namespace>&network=<network>
  - validates namespace ID and supported network
  - reads NamespaceCapabilityMintedEvent and NamespaceCapabilityRevokedEvent
  - joins revoked rows by cap_id
  - returns read-only history rows with tx digest/event sequence evidence
  ↓
Owner enters or confirms:
  - namespace ID
  - Admin cap ID
  - recipient Sui address
  - capability kind: ReadOnly or ReadWrite
  ↓
POST /api/share/sponsored/prepare
  - validates sender, recipient, namespace, Admin cap, network, action
  - builds only namespace::mint_capability_readonly or
    namespace::mint_capability_readwrite transaction kind bytes
  - calls Enoki with exact allowedMoveCallTargets and allowedAddresses
  ↓
Browser signs returned sponsored bytes with useSignTransaction()
  ↓
POST /api/share/sponsored/execute
  - executes through Enoki
  - waits for transaction effects
  - parses the created NamespaceCapability object ID from objectChanges
  ↓
UI displays recipient, kind, capability ID, and transaction digest
  ↓
Capability history refreshes from events; no server-side share database is used
```

No client route accepts arbitrary transaction bytes. The server builds only the
named OneMem share actions.

---

## Capability Semantics

| Kind | Recipient can | Recipient cannot |
|---|---|---|
| ReadOnly | Read/decrypt namespace content allowed by Seal policy | Write traces/memories or mint new capabilities |
| ReadWrite | Read/decrypt and write traces/memories using the namespace | Mint new capabilities |
| Admin | Mint/deactivate/reactivate namespace capabilities | Owned only by namespace admin; not minted by hosted `/share` |

---

## Recipient Capability Link Flow

```
Recipient opens app.onemem.ai/share/<capability_id>
  ↓
Server reads the Sui object with showType + showContent + showOwner
  ↓
SDK derives:
  - capability kind from NamespaceCapability<KIND>
  - namespace ID from the Move object field
  - owner kind/address from Sui object owner metadata
  ↓
Server attempts to read the MemoryNamespace summary
  ↓
Page renders capability owner, namespace metadata, Suiscan links,
connected-account owner comparison, and holder self-revoke action
```

The minted capability already belongs to the owner shown by Sui. There is no
separate hosted claim transaction in contract v0.1.

---

## Non-Implemented Boundaries

- Hosted recipient landing links are implemented as read-only capability object
  views. Hosted claim/transfer execution is not implemented because the current
  share mint already transfers ownership to the recipient address.
- Hosted owner/admin revoke UI is not implemented in this app boundary. The
  protocol supports Admin-cap marker revoke through CLI/MCP, and hosted
  recipient pages expose holder self-revoke for the connected holder wallet.
- Share history is not server-persisted by the hosted app. Hosted `/share`
  reads Sui events through `GET /api/share/history` and the SDK history reader.
- Public verifier links remain separate from namespace capability sharing.

---

## Local Dashboard Behavior

The local dashboard stays command-oriented because it has no hosted Enoki
sponsorship boundary. It shows executable commands:

```bash
onemem namespace share <namespace-id> <recipient-address> --cap ReadOnly --admin-cap <admin-cap-id>
onemem namespace capabilities <namespace-id>
onemem namespace revoke <capability-id>
onemem namespace admin-revoke <namespace-id> <capability-id> --admin-cap <admin-cap-id>
```

The `revoke` command is holder self-revoke. The `admin-revoke` command records a
namespace-level marker; the capability object remains, but OneMem gates reject
it. Revoking an Admin cap requires the CLI `--allow-admin` override.

---

## Cross-references

- `hosted-deploy.md` — hosted route/API surface
- `purpose-local-vs-hosted.md` — why hosted owns account/recipient share flows
- `data-flow.md` — dashboard data/API flow
- `../01-protocol/access-control-and-sharing.md` — capability mechanics
- `../02-sdks/shared-api-surface.md` — namespace share/read methods
- `../../01-sui-ecosystem/enoki-zklogin.md` — sponsored transaction mechanism
