/// Global dedup index for OneMem namespaces + the package admin cap.
/// Per docs/05-our-architecture/01-protocol/move-contract.md (registry section).
///
/// Lifted from MemWal's `AccountRegistry` pattern. The registry is a shared
/// object initialized once at package publish via `init`. It maps
/// `(owner_address, name)` to the on-chain ID of the corresponding
/// `MemoryNamespace`, so duplicate-name attempts can be rejected at mint time.
/// Carries a `version` dynamic field (per `onemem::version`) for the
/// upgrade pattern.
///
/// `RegistryAdminCap` is transferred to the deployer at publish time. It
/// gates package-level admin operations (currently just `bump_package_version`).
module onemem::registry;

// === Imports ===

use std::string::String;
use sui::event;
use sui::table::{Self, Table};
use onemem::version;

// === Errors ===

/// Caller tried to `register` a (owner, name) pair that's already in the index.
const EAlreadyRegistered: u64 = 0;

// === Constants ===

/// Module-level version constant. Bumped on schema-breaking upgrades; each
/// state-mutating entry function calls `version::assert_version_matches`
/// against this. Per upgrade-strategy.md.
const VERSION: u64 = 1;

// === Structs ===

/// The singleton dedup index. Created at package publish via `init`, shared
/// thereafter. Never destroyed.
public struct OneMemRegistry has key {
    id: UID,
    /// (owner, name) → MemoryNamespace ID.
    namespace_index: Table<NamespaceKey, ID>,
}

/// Composite key for the dedup table. `copy + drop + store` because Sui's
/// `Table` requires its key type to be storable.
public struct NamespaceKey has copy, drop, store {
    owner: address,
    name: String,
}

/// Package admin capability. Transferred to the deployer at publish time.
/// Gates `bump_package_version` and any future package-level admin entry
/// functions.
public struct RegistryAdminCap has key, store {
    id: UID,
}

// === Events ===

/// Emitted exactly once, at package publish.
public struct RegistryInitialized has copy, drop {
    registry_id: ID,
    initialized_by: address,
}

/// Emitted whenever `register` adds a new (owner, name) → namespace_id entry.
public struct NamespaceRegisteredEvent has copy, drop {
    registry_id: ID,
    owner: address,
    name: String,
    namespace_id: ID,
}

// === Init ===

/// Called automatically by the Sui runtime at package publish. Splits the
/// real logic into `init_impl` so tests can exercise the same path via
/// `init_for_testing`.
fun init(ctx: &mut TxContext) {
    init_impl(ctx);
}

// Admin cap intentionally goes to the deploying address — standard Sui
// init-cap pattern lifted from MemWal `account.move`. The Sui linter's
// `self_transfer` warning here is a false positive for cap-mint init.
#[allow(lint(self_transfer))]
fun init_impl(ctx: &mut TxContext) {
    let mut registry = OneMemRegistry {
        id: object::new(ctx),
        namespace_index: table::new(ctx),
    };
    version::add_initial_version(&mut registry.id, VERSION);

    let admin_cap = RegistryAdminCap { id: object::new(ctx) };

    event::emit(RegistryInitialized {
        registry_id: object::id(&registry),
        initialized_by: ctx.sender(),
    });

    transfer::share_object(registry);
    transfer::public_transfer(admin_cap, ctx.sender());
}

// === Public Functions ===

/// Look up the namespace ID for a (owner, name) pair. Returns `None` if not
/// registered. Non-aborting — caller decides what to do on a miss.
public fun lookup(reg: &OneMemRegistry, owner: address, name: String): Option<ID> {
    let key = NamespaceKey { owner, name };
    if (reg.namespace_index.contains(key)) {
        option::some(*reg.namespace_index.borrow(key))
    } else {
        option::none()
    }
}

/// Add a (owner, name) → namespace_id mapping. Aborts `EAlreadyRegistered`
/// on duplicate. Called by `onemem::namespace::create` after the namespace
/// is minted but before it's shared.
///
/// Version-gated: aborts `EVersionMismatch` if `reg` is on an older schema.
public fun register(
    reg: &mut OneMemRegistry,
    owner: address,
    name: String,
    namespace_id: ID,
) {
    version::assert_version_matches(&reg.id, VERSION);

    let key = NamespaceKey { owner, name };
    assert!(!reg.namespace_index.contains(key), EAlreadyRegistered);
    reg.namespace_index.add(key, namespace_id);

    event::emit(NamespaceRegisteredEvent {
        registry_id: object::id(reg),
        owner,
        name,
        namespace_id,
    });
}

// === Admin Functions ===

/// Bump the registry's version dynamic field. Used during a package upgrade
/// after the new package version is published + after any new dynamic fields
/// are added. Gated by holding `&RegistryAdminCap` (only the deployer or a
/// later transferee can call). `public` (not `entry`) so tests can call too;
/// in Move 2024 `public` is callable from PTBs without needing the `entry`
/// keyword. (Sui linter explicitly warns against `public entry`.)
public fun bump_package_version(
    reg: &mut OneMemRegistry,
    _admin: &RegistryAdminCap,
    new_version: u64,
) {
    version::bump_version(&mut reg.id, new_version);
}

// === Test-Only Functions ===

#[test_only]
/// Test entry-point mirror of `init`. Sui's `init` cannot be called from
/// tests directly, so tests exercise the same logic via this wrapper.
public fun init_for_testing(ctx: &mut TxContext) {
    init_impl(ctx);
}

#[test_only]
/// Test-only accessor that returns the registry's UID so tests can read the
/// version dynamic field via `onemem::version` helpers. Not exposed at
/// runtime because no production caller has any business reaching past the
/// shared object's API boundary.
public fun id_for_testing(reg: &OneMemRegistry): &UID {
    &reg.id
}
