/// MemoryNamespace + phantom-typed NamespaceCapability<KIND>.
///
/// Per docs/05-our-architecture/01-protocol/data-model.md (MemoryNamespace section)
/// and access-control-and-sharing.md (capability pattern). The namespace is the
/// unit of memory grouping + sharing: every TraceSession and ActionCall belongs
/// to exactly one MemoryNamespace, and `NamespaceCapability<KIND>` is the
/// transferable access primitive (RO/RW/Admin) that every downstream layer
/// (trace.move, seal_policy.move, the SDK) gates on.
///
/// Phantom types over magic enums: passing a `<ReadOnly>` cap to a function
/// expecting `<ReadWrite>` is rejected at compile time, zero runtime cost.
/// This is the structural reason "permission" lives at the type level.
module onemem::namespace;

// === Imports ===

use std::string::String;
use sui::clock::Clock;
use sui::event;
use onemem::registry::{Self, OneMemRegistry};
use onemem::version;

// === Errors ===

const EWrongNamespace: u64 = 0;
const ENamespaceInactive: u64 = 1;
const EBadNamespaceKind: u64 = 2;

// === Constants ===

const VERSION: u64 = 1;

// Namespace kinds (Mem0-style 5-tuple scoping per data-model.md).
const KIND_USER: u8 = 0;
const KIND_AGENT: u8 = 1;
const KIND_ORG: u8 = 2;
const KIND_SESSION: u8 = 3;
const KIND_SHARED: u8 = 4;
const KIND_MAX: u8 = KIND_SHARED;

// Event kind tags (Move events can't be parametric on phantom KIND, so we
// emit a u8 tag instead: 0=ReadOnly, 1=ReadWrite, 2=Admin).
const CAP_TAG_RO: u8 = 0;
const CAP_TAG_RW: u8 = 1;
const CAP_TAG_ADMIN: u8 = 2;

// === Capability Witness Types ===

/// Permission witnesses for `NamespaceCapability<KIND>`. `has drop` because
/// they're zero-sized phantom markers and never stored as struct values —
/// only referenced via the `<KIND>` phantom slot.
public struct ReadOnly has drop {}
public struct ReadWrite has drop {}
public struct Admin has drop {}

// === Structs ===

/// Transferable access capability. Phantom-typed by KIND — the type system
/// rejects passing `<ReadOnly>` where `<ReadWrite>` is required, at compile
/// time. The Sui object model lets the owner of a cap transfer it to anyone
/// (delegation) or burn it (revocation).
public struct NamespaceCapability<phantom KIND> has key, store {
    id: UID,
    /// FK to the MemoryNamespace this cap authorizes.
    namespace_id: ID,
}

/// The unit of memory grouping. Shared object — multi-writer (agents write,
/// dashboards read). Field shape lifted from data-model.md; `version` lives
/// as a dynamic field via `onemem::version`, NOT as a struct field, so v2+
/// schema additions don't break v1 namespaces.
public struct MemoryNamespace has key {
    id: UID,
    owner: address,
    name: String,
    /// 0=USER, 1=AGENT, 2=ORG, 3=SESSION, 4=SHARED. Mem0-style scoping.
    namespace_kind: u8,
    /// Package implementing `seal_approve` for this namespace's blobs.
    seal_package_id: ID,
    /// Running count (informational; not load-bearing).
    walrus_blob_count: u64,
    /// Tail of the Merkle chain. None when no calls yet.
    last_action_call_id: Option<ID>,
    /// Running chain root. Empty vector when no calls yet.
    merkle_root: vector<u8>,
    created_at: u64,
    /// Soft-delete flag. false = no new writes; existing writes still
    /// queryable + verifiable.
    active: bool,
}

// === Events ===

public struct NamespaceCreatedEvent has copy, drop {
    namespace_id: ID,
    owner: address,
    name: String,
    namespace_kind: u8,
    created_at: u64,
}

public struct NamespaceCapabilityMintedEvent has copy, drop {
    namespace_id: ID,
    cap_id: ID,
    /// 0=ReadOnly, 1=ReadWrite, 2=Admin.
    kind_tag: u8,
    recipient: address,
}

public struct NamespaceCapabilityRevokedEvent has copy, drop {
    namespace_id: ID,
    cap_id: ID,
}

public struct NamespaceDeactivatedEvent has copy, drop {
    namespace_id: ID,
}

public struct NamespaceReactivatedEvent has copy, drop {
    namespace_id: ID,
}

// === Public Functions ===

/// Mint a new MemoryNamespace + an Admin cap for the creator. Anyone can
/// call. The namespace is shared (multi-writer model); the Admin cap is
/// transferred to the sender, who can subsequently mint RO/RW caps for
/// other addresses.
///
/// Registers `(owner, name)` in the global `OneMemRegistry` for dedup.
/// Aborts `EBadNamespaceKind` if `kind > KIND_MAX`.
#[allow(lint(self_transfer))]
public fun create(
    registry: &mut OneMemRegistry,
    name: String,
    kind: u8,
    seal_package_id: ID,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(kind <= KIND_MAX, EBadNamespaceKind);

    let owner = ctx.sender();
    let mut ns = MemoryNamespace {
        id: object::new(ctx),
        owner,
        name,
        namespace_kind: kind,
        seal_package_id,
        walrus_blob_count: 0,
        last_action_call_id: option::none(),
        merkle_root: vector[],
        created_at: clock.timestamp_ms(),
        active: true,
    };
    version::add_initial_version(&mut ns.id, VERSION);
    let namespace_id = object::id(&ns);

    let admin_cap = mint_cap_internal<Admin>(namespace_id, ctx);
    let admin_cap_id = object::id(&admin_cap);

    registry::register(registry, owner, name, namespace_id);

    event::emit(NamespaceCreatedEvent {
        namespace_id,
        owner,
        name,
        namespace_kind: kind,
        created_at: ns.created_at,
    });
    event::emit(NamespaceCapabilityMintedEvent {
        namespace_id,
        cap_id: admin_cap_id,
        kind_tag: CAP_TAG_ADMIN,
        recipient: owner,
    });

    transfer::share_object(ns);
    transfer::public_transfer(admin_cap, owner);
}

/// Mint a ReadWrite cap for `recipient`. Admin-only. The recipient receives
/// the cap atomically as part of this tx; they can then call `trace::emit_*`
/// against this namespace.
public fun mint_capability_readwrite(
    ns: &MemoryNamespace,
    admin: &NamespaceCapability<Admin>,
    recipient: address,
    ctx: &mut TxContext,
) {
    version::assert_version_matches(&ns.id, VERSION);
    assert_cap_for_namespace(admin, ns);
    let cap = mint_cap_internal<ReadWrite>(object::id(ns), ctx);
    event::emit(NamespaceCapabilityMintedEvent {
        namespace_id: object::id(ns),
        cap_id: object::id(&cap),
        kind_tag: CAP_TAG_RW,
        recipient,
    });
    transfer::public_transfer(cap, recipient);
}

/// Mint a ReadOnly cap for `recipient`. Admin-only. The recipient can pass
/// the cap to `seal_approve` to decrypt this namespace's blobs but cannot
/// write new trace calls.
public fun mint_capability_readonly(
    ns: &MemoryNamespace,
    admin: &NamespaceCapability<Admin>,
    recipient: address,
    ctx: &mut TxContext,
) {
    version::assert_version_matches(&ns.id, VERSION);
    assert_cap_for_namespace(admin, ns);
    let cap = mint_cap_internal<ReadOnly>(object::id(ns), ctx);
    event::emit(NamespaceCapabilityMintedEvent {
        namespace_id: object::id(ns),
        cap_id: object::id(&cap),
        kind_tag: CAP_TAG_RO,
        recipient,
    });
    transfer::public_transfer(cap, recipient);
}

/// Burn (self-revoke) a capability. Consumes the cap. On Sui you can only
/// delete objects you own, so this is the cap holder voluntarily renouncing
/// access. Admin-driven revocation of others' caps is a v0.2 design
/// (requires either a wrapping container or a namespace version bump).
public fun revoke_capability<KIND>(cap: NamespaceCapability<KIND>) {
    let NamespaceCapability { id, namespace_id } = cap;
    event::emit(NamespaceCapabilityRevokedEvent {
        namespace_id,
        cap_id: id.uid_to_inner(),
    });
    id.delete();
}

// === Admin Functions ===

/// Soft-delete a namespace. New writes (via trace.move) will abort
/// `ENamespaceInactive`; existing writes remain queryable + verifiable.
public fun deactivate(ns: &mut MemoryNamespace, admin: &NamespaceCapability<Admin>) {
    version::assert_version_matches(&ns.id, VERSION);
    assert_cap_for_namespace(admin, ns);
    ns.active = false;
    event::emit(NamespaceDeactivatedEvent { namespace_id: object::id(ns) });
}

/// Re-enable a deactivated namespace.
public fun reactivate(ns: &mut MemoryNamespace, admin: &NamespaceCapability<Admin>) {
    version::assert_version_matches(&ns.id, VERSION);
    assert_cap_for_namespace(admin, ns);
    ns.active = true;
    event::emit(NamespaceReactivatedEvent { namespace_id: object::id(ns) });
}

// === Accessors + Assertion Helpers ===

public fun owner(ns: &MemoryNamespace): address { ns.owner }
public fun name(ns: &MemoryNamespace): &String { &ns.name }
public fun namespace_kind(ns: &MemoryNamespace): u8 { ns.namespace_kind }
public fun is_active(ns: &MemoryNamespace): bool { ns.active }
public fun seal_package_id(ns: &MemoryNamespace): ID { ns.seal_package_id }
public fun last_action_call_id(ns: &MemoryNamespace): &Option<ID> { &ns.last_action_call_id }
public fun merkle_root(ns: &MemoryNamespace): &vector<u8> { &ns.merkle_root }
public fun walrus_blob_count(ns: &MemoryNamespace): u64 { ns.walrus_blob_count }

/// Return the namespace_id this cap authorizes. Used by seal_policy.move
/// to verify a presented cap belongs to the namespace being decrypted.
public fun cap_for_namespace<KIND>(cap: &NamespaceCapability<KIND>): ID {
    cap.namespace_id
}

/// Abort `EWrongNamespace` if the cap is for a different namespace. Call
/// at the top of every entry function that takes both a cap and a namespace.
public fun assert_cap_for_namespace<KIND>(
    cap: &NamespaceCapability<KIND>,
    ns: &MemoryNamespace,
) {
    assert!(cap.namespace_id == object::id(ns), EWrongNamespace);
}

/// Abort `ENamespaceInactive` if the namespace has been soft-deleted.
/// Called by trace.move at the start of every state-mutating call so
/// deactivated namespaces stop accepting new writes.
public fun assert_active(ns: &MemoryNamespace) {
    assert!(ns.active, ENamespaceInactive);
}

// === Internal ===

fun mint_cap_internal<KIND>(namespace_id: ID, ctx: &mut TxContext): NamespaceCapability<KIND> {
    NamespaceCapability { id: object::new(ctx), namespace_id }
}
