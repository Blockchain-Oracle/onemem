/// Version-as-dynamic-field upgrade pattern helpers — lifted from MemWal's
/// `account.move`. Per docs/05-our-architecture/01-protocol/upgrade-strategy.md.
///
/// Each long-lived object (MemoryNamespace, TraceSession, …) stores its current
/// schema version as a dynamic field on its UID, NOT as a struct field. This
/// lets future package versions add new dynamic fields without forcing old
/// objects to be rebuilt. Per-module `const VERSION: u64 = N;` declares the
/// CURRENT expected version; every state-mutating entry function calls
/// `assert_version_matches(&obj.id, VERSION)` at the top to gate stale objects
/// out (they must call the matching `migrate_*_v<N>` to opt into the new
/// schema). Migrations swap the version field via `bump_version`.
module onemem::version;

// === Imports ===

use sui::dynamic_field as df;

// === Errors ===

/// Aborts when the object's stored version does not match the caller's
/// expected version. The object must be migrated before the entry function
/// can succeed.
const EVersionMismatch: u64 = 0;

// === Constants ===

/// Dynamic-field key the version u64 is stored under. Bytes (not a string
/// literal) to match the storage format MemWal `account.move` uses.
const VERSION_KEY: vector<u8> = b"version";

// === Public Functions ===

/// Add the version dynamic field on a newly created object. Call this
/// exactly once, from the entry function that mints the object.
public fun add_initial_version(id: &mut UID, version: u64) {
    df::add(id, VERSION_KEY, version);
}

/// Read the version stored in the dynamic field. Does not abort — use
/// `assert_version_matches` when you want the gate behavior.
public fun current_version(id: &UID): u64 {
    *df::borrow<vector<u8>, u64>(id, VERSION_KEY)
}

/// Abort with `EVersionMismatch` if the object's stored version does not
/// match `expected`. Call at the top of every state-mutating entry function.
public fun assert_version_matches(id: &UID, expected: u64) {
    assert!(current_version(id) == expected, EVersionMismatch);
}

/// Atomically swap the version dynamic field during a `migrate_*_v<N>` flow.
/// Caller must have already added any new schema dynamic fields BEFORE
/// calling this, so a reader interleaved with the migration never sees a
/// "version says v2 but v2 fields missing" state.
public fun bump_version(id: &mut UID, new_version: u64) {
    let v: &mut u64 = df::borrow_mut(id, VERSION_KEY);
    *v = new_version;
}
