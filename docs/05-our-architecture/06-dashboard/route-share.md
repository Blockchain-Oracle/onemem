# Route: `/share/[capability_id]` — Dashboard

NFT-gated namespace mint + capability transfer UX. Where "share my memory" becomes a Sui-native primitive.

---

## When this route renders

Two access modes:

1. **Owner viewing their own caps:** `/share/[capability_id]` shows the cap they own + lets them revoke or transfer it
2. **Recipient receiving a cap (via link):** they navigate to `/share/[capability_id]?token=<encrypted>` — the cap is then claimed into their wallet

---

## Layout (owner mode)

```
┌──────────────────────────────────────────────────────────────────────┐
│ Sidebar │ Topbar                                                      │
├─────────┼────────────────────────────────────────────────────────────┤
│         │  Capability 0xcap...                                        │
│         │                                                             │
│         │  Namespace: "research-team-2026" (SHARED)                   │
│         │  Type: ReadWrite                                            │
│         │  Granted to: 0xrecipient... ("alice.sui")                   │
│         │  Granted by: you (0xowner...)                               │
│         │  Granted at: 2026-05-26 14:30                               │
│         │                                                             │
│         │  Sui object: 0xcap... ↗ Suiscan                             │
│         │                                                             │
│         │  Status: ● Active                                           │
│         │                                                             │
│         │  Actions:                                                   │
│         │  [Revoke this capability]                                   │
│         │  [Generate sharing link to send by email/chat]              │
│         │                                                             │
│         │  Sharing link (active 7 days):                              │
│         │  https://app.onemem.ai/share/0xcap?token=...     [Copy]    │
│         │                                                             │
│         │  Recipient activity (Sui events):                           │
│         │  ├─ 14:32  First access (decrypt event on Walrus)           │
│         │  ├─ 15:18  Decrypt event                                    │
│         │  └─ 16:45  Decrypt event                                    │
│         │                                                             │
└─────────┴────────────────────────────────────────────────────────────┘
```

---

## Layout (recipient mode — receiving a cap)

```
┌──────────────────────────────────────────────────────────────────────┐
│  OneMem                                                               │
│                                                                       │
│  You've been granted access to a OneMem namespace                     │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ Namespace: "research-team-2026"                              │     │
│  │ Type: ReadWrite                                              │     │
│  │ Granted by: 0xowner... ("bob.sui")                           │     │
│  │ Description: "Project memory for the research team"          │     │
│  │                                                              │     │
│  │ This capability gives you the ability to:                    │     │
│  │  ✓ Read memories in this namespace                           │     │
│  │  ✓ Write new memories                                        │     │
│  │  ✓ Use this namespace in your AI coding agents               │     │
│  │  ✗ Mint new capabilities (Admin only)                        │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                       │
│              [Accept and add to my wallet]                            │
│                                                                       │
│              (You'll need a Sui wallet connected)                     │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

On Accept:
1. User connects wallet (if not already)
2. Sui PTB: `namespace::mint_capability_<kind>` — but the cap is already minted; this is just claiming the transferred object into the wallet
   (Actually: the cap should already be transferred when minted; this UX just confirms receipt)
3. Hosted mode: Enoki sponsors the tx (gasless)
4. Confirmation: "Capability added to your wallet. Use it via `onemem set-namespace 0x...`"

---

## Components

| Component | Purpose |
|---|---|
| `<CapabilityCard>` | Owner's view of the cap |
| `<ShareLinkGenerator>` | Encrypts cap-link token; generates URL; copy-to-clipboard |
| `<RevokeConfirmDialog>` | Confirmation before burning the cap |
| `<RecipientAcceptCard>` | Recipient's view of the cap |
| `<RecipientActivityFeed>` | Sui event log for the cap's usage |

---

## Sharing link mechanics

The "link" doesn't actually contain the cap (caps are Sui objects, not data). Instead:
- Owner generates a one-time-use link with an encrypted token
- Token contains: `{cap_id, namespace_id, recipient_hint, expires_at, signature}`
- Recipient visits the link → dashboard validates token → walks them through accepting
- If recipient's wallet matches the cap's transfer target → cap already in their wallet
- If they need a wallet → guide them to Enoki/zkLogin to mint one (gasless)

For v0.1: the cap is transferred at mint-time; the "share link" is just a deep link to `/share/[cap_id]` so the recipient knows what to expect. No token cryptography needed.

For v0.2: deferred-transfer caps (mint-but-don't-transfer-yet) + claim-via-link for users who don't yet have a wallet.

---

## Revoke flow

User clicks "Revoke this capability":

```
┌──────────────────────────────────────────────┐
│ Revoke capability?                           │
├──────────────────────────────────────────────┤
│ This will permanently revoke 0xcap.          │
│ The recipient (0xrecipient) will lose access │
│ to all memories in this namespace.           │
│                                              │
│ This action is recorded on Sui and cannot    │
│ be undone.                                   │
│                                              │
│      [Cancel]    [Revoke]                    │
└──────────────────────────────────────────────┘
```

On confirm:
1. Build PTB: `namespace::revoke_capability(ns, admin_cap, cap_to_revoke)`
2. Sign via dApp Kit
3. On success: cap object burned on chain; emits `NamespaceRevoked` event
4. UI updates: status changes to "Revoked"; recipient activity feed shows revocation timestamp

---

## Cross-references

- `ui-architecture.md`
- `../01-protocol/access-control-and-sharing.md` — capability mechanics
- `../02-sdks/shared-api-surface.md` — `namespace.share`, `namespace.revoke`
- `../../01-sui-ecosystem/enoki-zklogin.md` — gasless tx mechanism
