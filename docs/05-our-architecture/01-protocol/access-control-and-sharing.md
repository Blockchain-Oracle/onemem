# Access Control + Sharing — OneMem

Three concerns, one design:

1. **Who can read a namespace's memory?** → Seal threshold encryption + on-chain `seal_approve` policy
2. **Who can write to a namespace?** → Capability ownership (`NamespaceCapability<ReadWrite>` or `<Admin>`)
3. **How do users grant/revoke access?** → Capability mint + transfer + burn (on-chain primitives, not API calls)

---

## The Seal policy convention

Per `../../01-sui-ecosystem/seal-deep-dive.md`, Seal threshold decryption is gated by an on-chain `seal_approve` function that returns `true` if the caller is authorized. OneMem ships its own `seal_approve` in `module onemem::seal_policy`.

```move
module onemem::seal_policy {
    use sui::object::{Self, ID};
    use sui::tx_context::{Self, TxContext};
    use onemem::namespace::{Self, MemoryNamespace, NamespaceCapability, ReadOnly, ReadWrite, Admin};

    /// Seal calls this. Returns true if the caller is authorized to decrypt blobs in this namespace.
    ///
    /// The `id` parameter is the encrypted-blob ID. We use it to look up which namespace the blob belongs to.
    /// (Convention: Seal blobs are prefixed with `b"onemem:" || namespace_id_bytes` so we can extract namespace_id from id.)
    public fun seal_approve(
        id: vector<u8>,                     // Seal-blob identifier
        ns: &MemoryNamespace,
        // Caller's capability must be presented in the calling tx context.
        // We use a "witness" pattern: caller passes &NamespaceCapability<KIND>, function verifies KIND ⊇ ReadOnly.
        readonly_cap: Option<&NamespaceCapability<ReadOnly>>,
        readwrite_cap: Option<&NamespaceCapability<ReadWrite>>,
        admin_cap: Option<&NamespaceCapability<Admin>>,
        ctx: &TxContext,
    ): bool {
        // 1. Extract namespace_id from id prefix
        let extracted_ns = extract_namespace_id(&id);
        if (extracted_ns != object::id(ns)) { return false };

        // 2. Namespace must be active
        if (!namespace::is_active(ns)) { return false };

        // 3. Any of the caps proves authorization
        if (readonly_cap.is_some()) {
            return namespace::cap_for_namespace(readonly_cap.borrow()) == object::id(ns)
        };
        if (readwrite_cap.is_some()) {
            return namespace::cap_for_namespace(readwrite_cap.borrow()) == object::id(ns)
        };
        if (admin_cap.is_some()) {
            return namespace::cap_for_namespace(admin_cap.borrow()) == object::id(ns)
        };

        // 4. Owner short-circuit: even without an explicit cap, the namespace owner can decrypt
        tx_context::sender(ctx) == namespace::owner(ns)
    }

    fun extract_namespace_id(id: &vector<u8>): ID { /* parse b"onemem:" prefix + 32-byte namespace_id */ }
}
```

**Why this pattern:**
- **Capability-presenting at call time** (not stored on-chain in an ACL): the encryption layer doesn't need an enumeration of who has access. It just checks "did you bring a valid cap to this PTB?"
- **Phantom type erasure for the policy**: `seal_approve` doesn't care WHICH kind of cap (RO/RW/Admin) — any of them grants read. Write/admin distinctions matter at the trace.move layer, not at decryption.
- **Owner short-circuit**: the namespace owner always decrypts even without an explicit cap. Convenience that doesn't reduce security.
- **Namespace-scoped IDs**: blob IDs encode the namespace they belong to, so the seal_approve function can verify "you have a cap for THIS namespace, not some other one."

---

## Capability mechanics (write/admin operations)

Per `data-model.md` + `move-contract.md`, write/admin operations check
capability ownership and admin revoke markers via
`namespace::assert_cap_for_namespace`:

```move
public fun assert_cap_for_namespace<KIND>(cap: &NamespaceCapability<KIND>, ns: &MemoryNamespace) {
    assert!(cap.namespace_id == object::id(ns), EWrongNamespace);
    assert!(!is_capability_revoked(cap, ns), ECapabilityRevoked);
}
```

**Entry functions that require a cap:**

| Function | Required cap |
|---|---|
| `trace::open_session` | `&NamespaceCapability<ReadWrite>` |
| `trace::emit_call` | `&NamespaceCapability<ReadWrite>` |
| `trace::close_call_with_namespace` | `&NamespaceCapability<ReadWrite>` + namespace revoke marker check |
| `trace::close_session_with_namespace` | `&NamespaceCapability<ReadWrite>` + namespace revoke marker check |
| `namespace::mint_capability_*` | `&NamespaceCapability<Admin>` |
| `namespace::revoke_capability` | owned `NamespaceCapability<KIND>` consumed by holder |
| `namespace::admin_revoke_capability` | `&NamespaceCapability<Admin>`; records cap ID revoked under namespace |
| `namespace::deactivate` / `::reactivate` | `&NamespaceCapability<Admin>` |
| `namespace::create` | None (anyone can create their own namespace; gets initial Admin cap) |

**The phantom type pattern:** Move's type system rejects passing `&NamespaceCapability<ReadOnly>` to a function expecting `&NamespaceCapability<ReadWrite>`. Compile-time enforcement, zero runtime cost. This is the structural reason "permission" lives at the type level.

---

## Sharing a namespace — the on-chain flow

The headline-worthy demo moment: "share memory with my teammate = one Sui tx, gasless via Enoki."

### Flow

1. **Owner mints a capability:**
   ```typescript
   const tx = new Transaction();
   tx.moveCall({
     target: `${PKG}::namespace::mint_capability_readwrite`,
     arguments: [
       tx.object(namespaceId),
       tx.object(adminCapId),
       tx.pure.address(recipientAddress),
       tx.object("0x6"),  // Clock
     ],
   });
   await dappKit.signAndExecuteTransaction({ transaction: tx });
   ```

2. **Capability lands in recipient's wallet** (transferred atomically as part of mint).

3. **Recipient uses the cap immediately** — any subsequent `trace::*` or read flow that requires this cap works.

4. **Holder self-revokes when they own the capability object:**
   ```typescript
   const tx = new Transaction();
   tx.moveCall({
     target: `${PKG}::namespace::revoke_capability`,
     typeArguments: [`${PKG}::namespace::ReadWrite`],
     arguments: [
       tx.object(capabilityIdToRevoke),  // must be owned by the signer
     ],
   });
   ```

   Holder self-revoke consumes the capability object, so only the holder can run
   this path.

5. **Admin marker-revoke:** namespace admins can run
   `namespace::admin_revoke_capability(ns, admin, cap_id)`. The holder-owned
   capability object remains, but future OneMem trace/write/decrypt gates reject
   it.

6. **Dashboard surfaces:** hosted `/share/[capability-id]` renders the Sui capability object view: kind, owner, namespace id, namespace summary when available, and Suiscan links. It does not render a hosted admin revoke transaction or a claim transaction in v0.1.

### Gasless via Enoki

Per `../../01-sui-ecosystem/enoki-zklogin.md`, Enoki provides sponsored-tx — the user signs the cap mint, but the gas is paid by an Enoki-managed sponsor account. Demo UX: "Click 'Share' → Google OAuth confirmation → cap landed in teammate's wallet. No SUI required."

This is the surprise moment for the demo: sharing memory is a Web3-native primitive, not a SaaS API call.

---

## Capability transfer vs Mem0 team accounts (the structural delta)

| Dimension | Mem0 (centralized) | OneMem (on-chain caps) |
|---|---|---|
| Who controls access? | Mem0 server-side ACL | Sui object ownership |
| Revocation | API call to Mem0; trust Mem0 to enforce | On-chain tx; verifiable forever |
| Audit trail of share/revoke | Mem0 internal log (not public) | Sui events (`NamespaceCapabilityMintedEvent` / `NamespaceCapabilityRevokedEvent`) — public, light-client-verifiable |
| Cross-vendor portability | Lock-in: can't take your team out of Mem0 | Caps are Sui objects; portable across apps that consume OneMem |
| Cost to share | $79+/mo subscription tier for team features | Gas only (~$0.001 sponsored via Enoki) |
| Revoke latency | API call; eventual consistency | Sui consensus (~1 second mainnet) |

The "Mem0 has team accounts, we have Sui caps" comparison goes on the marketing landing page.

---

## Threat model + mitigations

| Threat | Mitigation |
|---|---|
| Compromised delegate key writes garbage | Owner can deactivate the namespace globally; v0.1 holder self-revoke only burns caps already owned by the signer. Existing chain entries are integrity-preserved (Merkle chain shows compromised period) |
| Seal key servers collude → decrypt without authorization | Threshold scheme: requires `M-of-N` key servers; pick `N` from independent operators |
| Replay attack: recipient re-uses an old cap after revoke | Revocation burns the cap object; subsequent calls fail `assert_writes_to` |
| Owner deactivates namespace but leaks Walrus blob IDs | Blobs stay readable on Walrus until epoch expiry; only NEW writes are blocked. Owners can also explicitly delete blobs via `walrus delete` (Walrus v1.33+ default) |
| Frontrunning a `revoke_capability` to use the cap one last time | Sui PTBs are atomic; if revoke is in pending pool, attacker's call lands before or after — chain log shows both |
| Recipient leaks decrypted plaintext | Out of scope; no DRM at v0.1. Acceptable risk — same as Mem0 team accounts |

---

## What we don't ship at v0.1 (deferred to v0.2+)

- **Time-bounded caps** (`expires_at` field) — useful for "share for 24 hours" UX; design space-only at v0.1
- **Scope-restricted caps** (e.g., "read-only on this tool's calls but not others") — too granular for v0.1
- **Multi-sig caps** (require N-of-M signers) — for org accounts; v0.2
- **Capability marketplaces** (transferable caps as tradeable Sui objects) — v0.2+ vision

---

## Cross-references

- `data-model.md` — struct definitions (`MemoryNamespace`, `NamespaceCapability`)
- `move-contract.md` — entry functions (mint/revoke/deactivate)
- `events-and-attestation.md` — `NamespaceCapabilityMintedEvent` / `NamespaceCapabilityRevokedEvent` events
- `../../01-sui-ecosystem/seal-deep-dive.md` — Seal mechanics + `seal_approve` convention
- `../../01-sui-ecosystem/enoki-zklogin.md` — sponsored-tx mechanics for gasless sharing
- `../../02-inspirations/memwal-incubation/README.md` — MemWal's `seal_approve` (per-account, not per-namespace); we extend
- `../../02-inspirations/other-memory-systems/onlyfins/VISUAL_DESIGN.md` — `ViewerToken` capability pattern reference
