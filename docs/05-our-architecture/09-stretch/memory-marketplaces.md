# Memory Marketplaces — v0.2+ Vision

NOT BUILT AT v0.1. Documented for the landing page Vision section + v0.2 roadmap.

---

## The idea

Namespaces are already Sui objects with `NamespaceCapability<KIND>` access caps. Make them tradeable:
- Owner mints a tradeable cap (Sui object with `store` ability)
- Lists on a Sui marketplace (Kiosk pattern, Cetus, etc)
- Buyer purchases → cap transfers → buyer reads memory

Use cases:
- Researcher sells access to a curated memory namespace ("Top 100 papers on prediction markets, with summaries")
- Trader sells access to an alpha-feed namespace (autonomous trading agent's memory)
- DAO sells tiered access to a community knowledge base
- Personal AI sells your "preference signature" namespace for use by other agents working on your behalf

---

## Move primitives we'd add

```move
// v0.2 — extend MemoryNamespace with marketplace metadata
public struct MarketplaceListing has key {
    id: UID,
    namespace_id: ID,
    cap_kind: u8,                  // ReadOnly typically
    price_in_sui: u64,
    seller: address,
    is_active: bool,
}

// User lists a namespace by minting a tradeable cap + putting it in Kiosk
public entry fun list_namespace_access(
    ns: &MemoryNamespace,
    admin_cap: &NamespaceCapability<Admin>,
    cap_kind: u8,
    price_in_sui: u64,
    kiosk: &mut Kiosk,
    ctx: &mut TxContext,
) { /* ... */ }
```

Composes with Sui's existing Kiosk + Marketplace infrastructure.

---

## Why v0.2

- Requires marketplace infrastructure design (pricing, escrow, royalties)
- Not blocking for the v0.1 verifiability story
- Best paired with reputation (sellers w/ track record vs anonymous)

---

## Landing page mention

Vision bullet: "Memory marketplaces — namespaces become tradeable on Sui."

That's it for v0.1.

---

## Cross-references

- `README.md`
- `agent-reputation-graphs.md` — natural pair (rep + marketplace)
- `../01-protocol/access-control-and-sharing.md` — capability mechanics
- `../../02-inspirations/other-memory-systems/recall.md` — Recall Network's vision parallels
