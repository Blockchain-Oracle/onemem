/// Seal access policy. The Seal SDK calls `seal_approve` during the manual
/// decryption flow; aborting denies decryption, returning normally grants it.
///
/// Per docs/05-our-architecture/01-protocol/access-control-and-sharing.md
/// + docs/01-sui-ecosystem/seal.md.
///
/// v0.1 design:
///   - Generic over the cap KIND. Any `NamespaceCapability<KIND>` (ReadOnly,
///     ReadWrite, or Admin) authorizes decryption — write privileges are
///     enforced separately in trace.move via the cap kind.
///   - `id` is the Seal blob identifier. v0.1 treats it as opaque (the
///     binding (id, ns) is trusted from the SDK side); v0.2 may parse a
///     `b"onemem:" || namespace_id_bytes` prefix from `id` for additional
///     integrity (per architecture).
///   - Aborts `ENamespaceInactive` if the namespace was soft-deleted —
///     deactivated namespaces stop accepting decryption + write.
///   - Aborts `EUnauthorized` if the presented cap is for a different
///     namespace than `ns`.
module onemem::seal_policy;

// === Imports ===

use onemem::namespace::{Self, MemoryNamespace, NamespaceCapability};

// === Errors ===

const EUnauthorized: u64 = 0;
const ENamespaceInactive: u64 = 1;

// === Public Functions ===

/// Seal access policy. Generic over the capability KIND.
///
/// Called by the Seal SDK during decryption. Aborts on denial; no-op on
/// success. The caller (Seal SDK) builds a PTB that includes this function
/// call alongside the decryption request; if this aborts, decryption is
/// rejected by the validators.
public fun seal_approve<KIND>(
    id: vector<u8>,
    ns: &MemoryNamespace,
    cap: &NamespaceCapability<KIND>,
    _ctx: &TxContext,
) {
    // id is opaque to us at v0.1 — the SDK is trusted to pass a matching
    // (id, ns) pair. v0.2 may parse a namespace-id prefix here for extra
    // integrity.
    let _id = id;

    assert!(namespace::is_active(ns), ENamespaceInactive);
    assert!(namespace::cap_for_namespace(cap) == object::id(ns), EUnauthorized);
    namespace::assert_cap_for_namespace(cap, ns);
}
