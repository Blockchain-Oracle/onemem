# Move Package Layout — OneMem

Package name: `onemem` (Move package + namespace prefix for module addresses).

Builds on `data-model.md` — all struct definitions are there. This doc covers package layout + module breakdown + entry functions + Move.toml.

---

## Package layout

```
onemem-contracts/
├── Move.toml
├── sources/
│   ├── registry.move           # OneMemRegistry (shared dedup index)
│   ├── namespace.move          # MemoryNamespace + NamespaceCapability + admin ops
│   ├── trace.move              # TraceSession + ActionCall + Merkle append/close
│   ├── events.move             # All event structs + authenticated emit helpers
│   ├── seal_policy.move        # seal_approve function for OneMem-managed namespaces
│   └── version.move            # Dynamic-field versioning utilities (shared helpers)
├── tests/
│   ├── namespace_tests.move
│   ├── trace_tests.move
│   ├── capability_transfer_tests.move
│   ├── seal_approve_tests.move
│   └── merkle_chain_tests.move
└── examples/
    ├── mint_namespace.ts       # Full flow: register account → mint namespace → mint cap → transfer
    ├── start_trace_session.ts  # Start session → append calls → close session
    └── verify_chain.ts         # Walk chain → verify against on-chain merkle_root
```

---

## Move.toml

```toml
[package]
name = "onemem"
version = "0.1.0"
edition = "2024.beta"
authors = ["OneMem contributors"]
license = "Apache-2.0"

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "mainnet" }

[addresses]
onemem = "0x0"  # filled in by `sui client publish`

[dev-addresses]
onemem = "0xCAFE"
```

**Dep choice:** Sui framework only at v0.1. We DO NOT pull in OpenZeppelin contracts-sui or any DeFi deps — keeps the package surface small and auditable. (OZ DeFi Math is overkill for what's essentially a memory + trace contract.)

---

## Module breakdown

### `module onemem::registry`

```move
module onemem::registry {
    use sui::object::{Self, ID, UID};
    use sui::table::{Self, Table};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    const VERSION: u64 = 1;

    public struct OneMemRegistry has key { /* see data-model.md */ }
    public struct NamespaceKey has copy, drop, store { /* ... */ }

    /// Initialize the singleton registry. Called once at package publish.
    fun init(ctx: &mut TxContext) {
        let registry = OneMemRegistry {
            id: object::new(ctx),
            namespace_index: table::new(ctx),
            version: VERSION,
        };
        transfer::share_object(registry);
    }

    /// Lookup namespace ID by (owner, name).
    public fun lookup(reg: &OneMemRegistry, owner: address, name: String): Option<ID> { /* ... */ }

    /// Internal: register a namespace. Called by namespace::create.
    public(package) fun register(
        reg: &mut OneMemRegistry,
        owner: address,
        name: String,
        ns_id: ID,
    ) { /* ... */ }
}
```

### `module onemem::namespace`

```move
module onemem::namespace {
    use sui::object::{Self, ID, UID};
    use sui::dynamic_field as df;
    use sui::clock::Clock;
    use std::string::String;
    use onemem::registry::{Self, OneMemRegistry};
    use onemem::version;
    use onemem::events;

    const VERSION: u64 = 1;
    const NAMESPACE_KIND_USER: u8 = 0;
    const NAMESPACE_KIND_AGENT: u8 = 1;
    const NAMESPACE_KIND_ORG: u8 = 2;
    const NAMESPACE_KIND_SESSION: u8 = 3;
    const NAMESPACE_KIND_SHARED: u8 = 4;

    public struct MemoryNamespace has key { /* see data-model.md */ }
    public struct NamespaceCapability<phantom KIND> has key, store { /* see data-model.md */ }

    public struct ReadOnly has drop {}
    public struct ReadWrite has drop {}
    public struct Admin has drop {}

    /// Entry: create a namespace.
    public entry fun create(
        registry: &mut OneMemRegistry,
        name: String,
        kind: u8,
        seal_package_id: ID,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let owner = tx_context::sender(ctx);
        // dedup check via registry
        // mint MemoryNamespace + initial Admin capability
        // share namespace, transfer cap to owner
        // emit NamespaceCreated event
    }

    /// Entry: mint a capability and transfer to recipient.
    /// Requires &NamespaceCapability<Admin>.
    public entry fun mint_capability_readonly(
        ns: &MemoryNamespace,
        admin: &NamespaceCapability<Admin>,
        recipient: address,
        clock: &Clock,
        ctx: &mut TxContext,
    ) { /* ... */ }

    public entry fun mint_capability_readwrite(
        ns: &MemoryNamespace,
        admin: &NamespaceCapability<Admin>,
        recipient: address,
        clock: &Clock,
        ctx: &mut TxContext,
    ) { /* ... */ }

    public entry fun mint_capability_admin(
        ns: &MemoryNamespace,
        admin: &NamespaceCapability<Admin>,
        recipient: address,
        clock: &Clock,
        ctx: &mut TxContext,
    ) { /* ... */ }

    /// Revoke a capability by burning the holder-owned object.
    /// This is holder self-revoke.
    public entry fun revoke_capability<KIND>(
        cap: NamespaceCapability<KIND>,
    ) { /* burns cap + emits NamespaceCapabilityRevokedEvent */ }

    /// Admin marker-revoke. The holder-owned object remains, but namespace,
    /// trace, and Seal gates reject the marked cap ID.
    public entry fun admin_revoke_capability(
        ns: &mut MemoryNamespace,
        admin: &NamespaceCapability<Admin>,
        cap_id: ID,
    ) { /* records marker + emits NamespaceCapabilityRevokedEvent */ }

    /// Entry: deactivate namespace (soft delete; new writes rejected).
    public entry fun deactivate(
        ns: &mut MemoryNamespace,
        admin: &NamespaceCapability<Admin>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) { /* ... */ }

    public entry fun reactivate(
        ns: &mut MemoryNamespace,
        admin: &NamespaceCapability<Admin>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) { /* ... */ }

    // Read accessors (public, no caps required)
    public fun owner(ns: &MemoryNamespace): address { ns.owner }
    public fun name(ns: &MemoryNamespace): &String { &ns.name }
    public fun is_active(ns: &MemoryNamespace): bool { ns.active }
    public fun seal_package_id(ns: &MemoryNamespace): ID { ns.seal_package_id }
    public fun merkle_root(ns: &MemoryNamespace): vector<u8> { ns.merkle_root }

    // Internal accessors for trace.move
    public(package) fun update_merkle_state(
        ns: &mut MemoryNamespace,
        new_last_call: ID,
        new_root: vector<u8>,
    ) { /* ... */ }

    // Phantom type validators (used by entry functions in trace.move)
    public fun cap_for_namespace<KIND>(cap: &NamespaceCapability<KIND>): ID { cap.namespace_id }
    public fun assert_writes_to<KIND>(cap: &NamespaceCapability<KIND>, ns: &MemoryNamespace) { /* enforces cap.namespace_id == object::id(ns) */ }
}
```

### `module onemem::trace`

```move
module onemem::trace {
    use sui::object::{Self, ID, UID};
    use sui::dynamic_field as df;
    use sui::clock::Clock;
    use std::string::String;
    use std::option::Option;
    use onemem::namespace::{Self, MemoryNamespace, NamespaceCapability, ReadWrite, Admin};
    use onemem::events;
    use onemem::version;

    const VERSION: u64 = 1;
    const STATUS_ACTIVE: u8 = 0;
    const STATUS_COMPLETED: u8 = 1;
    const STATUS_FAILED: u8 = 2;
    const STATUS_ABORTED: u8 = 3;

    const LEVEL_DEBUG: u8 = 0;
    const LEVEL_DEFAULT: u8 = 1;
    const LEVEL_WARNING: u8 = 2;
    const LEVEL_ERROR: u8 = 3;

    const CALL_STATUS_PENDING: u8 = 0;
    const CALL_STATUS_SUCCESS: u8 = 1;
    const CALL_STATUS_FAILURE: u8 = 2;
    const CALL_STATUS_TIMEOUT: u8 = 3;
    const CALL_STATUS_CANCELLED: u8 = 4;

    public struct TraceSession has key { /* see data-model.md */ }
    public struct ActionCall has key, store { /* see data-model.md */ }
    public struct TraceEvent has copy, drop, store { /* see data-model.md */ }

    /// Entry: start a new trace session.
    /// Requires &NamespaceCapability<ReadWrite> (or Admin).
    public entry fun start_session(
        ns: &MemoryNamespace,
        cap: &NamespaceCapability<ReadWrite>,
        agent_id: String,
        environment: String,
        sdk_version: String,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        namespace::assert_writes_to(cap, ns);
        // assert ns.active
        // create TraceSession with initial merkle_root = [0u8; 32]
        // share_object the session
        // emit TraceSessionStarted authenticated event
    }

    /// Entry: append an ActionCall to a session.
    /// Atomically updates session's merkle_root.
    public entry fun append_call(
        session: &mut TraceSession,
        ns: &mut MemoryNamespace,
        cap: &NamespaceCapability<ReadWrite>,
        parent_call_id: Option<ID>,
        tool_name: String,
        tool_namespace: String,
        walrus_input_blob: String,
        input_hash: vector<u8>,
        label: Option<String>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        namespace::assert_writes_to(cap, ns);
        // construct ActionCall with PENDING status
        // prev_hash = session.merkle_root
        // content_hash = sha256(tool_name + input_hash + parent_call_id_bytes)  // output_hash filled at close_call
        // append as dynamic field of session
        // update session.last_call_id, session.merkle_root, session.call_count
        // update ns.merkle_root, ns.last_action_call_id
        // emit ActionCallEmitted authenticated event
    }

    /// Entry: close a previously-appended call with its output.
    /// Recomputes content_hash to include output; updates session merkle_root accordingly.
    public entry fun close_call(
        session: &mut TraceSession,
        ns: &mut MemoryNamespace,
        cap: &NamespaceCapability<ReadWrite>,
        call_id: ID,
        walrus_output_blob: Option<String>,
        output_hash: Option<vector<u8>>,
        status: u8,
        level: u8,
        events: vector<TraceEvent>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        namespace::assert_writes_to(cap, ns);
        // load ActionCall via dynamic field
        // update output_hash, walrus_output_blob, status, level, events, ended_at
        // recompute content_hash to include output
        // update session.merkle_root accordingly (this is the chain-finalization step)
        // emit authenticated event
    }

    /// Entry: end the session.
    public entry fun end_session(
        session: &mut TraceSession,
        cap: &NamespaceCapability<ReadWrite>,
        status: u8,
        clock: &Clock,
        ctx: &mut TxContext,
    ) { /* ... */ }

    // Read accessors
    public fun merkle_root(session: &TraceSession): vector<u8> { session.merkle_root }
    public fun call_count(session: &TraceSession): u64 { session.call_count }
    public fun is_active(session: &TraceSession): bool { session.status == STATUS_ACTIVE }
}
```

### `module onemem::events`

All event structs + helper functions that wrap `event::emit_authenticated`. See `events-and-attestation.md` for detail.

### `module onemem::seal_policy`

The `seal_approve` function that gates Seal threshold decryption for OneMem-managed namespaces. See `access-control-and-sharing.md` for detail.

### `module onemem::version`

Shared helpers for the version-as-dynamic-field pattern. See `upgrade-strategy.md` for detail.

---

## Public API surface (what SDKs call via PTBs)

| Entry function | Caller capability | Purpose |
|---|---|---|
| `registry::lookup` | None (read-only) | Find a namespace ID by `(owner, name)` |
| `namespace::create` | None | Create a new namespace + mint owner's initial Admin cap |
| `namespace::mint_capability_readonly` | `&Admin` | Mint + transfer a ReadOnly cap to another address |
| `namespace::mint_capability_readwrite` | `&Admin` | Mint + transfer a ReadWrite cap |
| `namespace::mint_capability_admin` | `&Admin` | Mint + transfer an Admin cap (rare; only delegation) |
| `namespace::revoke_capability` | owned cap object | Holder self-revoke by burning a previously-minted cap |
| `namespace::deactivate` | `&Admin` | Soft-delete; new writes rejected |
| `namespace::reactivate` | `&Admin` | Re-enable writes |
| `namespace::admin_revoke_capability` | `&Admin` | Mark a capability ID revoked under the namespace; object remains but gates reject it |
| `trace::open_session` | `&ReadWrite` | Begin a trace session |
| `trace::emit_call` | `&ReadWrite` | Append an ActionCall (PENDING) — updates session + namespace Merkle |
| `trace::close_call` | `&ReadWrite` + namespace marker check | Close call with output (SUCCESS/FAILURE/etc) — finalizes content_hash |
| `trace::close_session` | `&ReadWrite` + namespace marker check | Mark session COMPLETED/FAILED/ABORTED |

---

## Why this layout (design rationale)

- **Module-per-concept** (registry / namespace / trace / events / seal_policy / version) — small, focused, testable. Mirrors MemWal's structure.
- **Capability types as phantom params** — Sui idiomatic. Zero runtime cost, full type-system enforcement.
- **Dynamic fields for ActionCalls** — unbounded children on TraceSession. Same pattern as Walrus Sites.
- **Authenticated events for the chain** — clients verify Merkle chain via light-client-verifiable events, not by reading full state.
- **`public(package)` for cross-module internals** (registry::register called by namespace::create) — keeps the public surface tight.
- **No raw Move admin functions** — everything is capability-gated. Even `init` only seeds the registry; no superuser.

---

## Cross-references

- `data-model.md` — full struct field definitions
- `events-and-attestation.md` — `event::emit_authenticated` mechanics
- `access-control-and-sharing.md` — Seal `seal_approve` design + capability mechanics
- `upgrade-strategy.md` — version dynamic-field pattern
- `../../01-sui-ecosystem/move-patterns-for-onemem.md` — pattern reference
- `../../01-sui-ecosystem/memwal-deep-dive.md` — MemWal `account.move` shape to mirror
