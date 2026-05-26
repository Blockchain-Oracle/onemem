---
purpose: Move design patterns OneMem should follow for its audit-ledger contract.
source: docs.sui.io (develop/), MemWal account.move, OnlyFins posts.move, ticketing-poc move sources.
verified: 2026-05-23
---

# Move Patterns for OneMem

OneMem's onchain footprint is small but load-bearing: a registry, per-agent / per-namespace audit entries committed via authenticated events, a Seal-gated decryption policy for sensitive trace blobs, and an admin capability. This doc collects the Move patterns from the Sui doc tree + Mysten reference apps that map onto each piece.

---

## 1. Capability pattern (admin auth)

Reference: https://docs.sui.io/getting-started/examples/capability-pattern, https://docs.sui.io/develop/write-move/sui-move-concepts

```move
module onemem::admin;

public struct AnchorAdminCap has key, store { id: UID }

fun init(ctx: &mut TxContext) {
    transfer::transfer(
        AnchorAdminCap { id: object::new(ctx) },
        ctx.sender(),
    );
}

/// Delegate: existing admin mints a fresh cap for another address.
public fun new_admin(
    _: &AnchorAdminCap,                 // gate by reference, don't consume
    recipient: address,
    ctx: &mut TxContext,
) {
    transfer::transfer(
        AnchorAdminCap { id: object::new(ctx) },
        recipient,
    );
}
```

Gate every privileged OneMem function with `_: &AnchorAdminCap` (by reference, NOT by value — by-value would burn the cap on every call). The init function is the ONLY entry point through which the first cap enters circulation.

---

## 2. Shared registry (the audit ledger root)

Reference: https://docs.sui.io/develop/objects/object-ownership/shared, MemWal `AccountRegistry`.

```move
module onemem::registry;

use sui::table::{Self, Table};

public struct AuditRegistry has key {
    id: UID,
    /// owner address → AuditAccount object ID. Prevents duplicate accounts.
    accounts: Table<address, ID>,
    /// Bump on every schema change. See §6 Versioning.
    /// version is stored as a dynamic field on `id`, NOT here.
}

fun init(ctx: &mut TxContext) {
    transfer::share_object(AuditRegistry {
        id: object::new(ctx),
        accounts: table::new(ctx),
    });
}
```

`transfer::share_object` is what makes the registry shared. Shared objects sequence through consensus (slower path), which is fine for the registry since the throughput target is "1 commit per agent action" not "1 commit per Sui block."

---

## 3. Owned audit account (per principal)

```move
public struct AuditAccount has key, store {
    id: UID,
    owner: address,
    /// Authorized agent IDs (Ed25519 pubkeys with derived Sui addresses).
    /// Reuse MemWal's `DelegateKey` shape for compatibility.
    agents: vector<AgentKey>,
    created_at: u64,
    active: bool,
}

public struct AgentKey has store, copy, drop {
    public_key: vector<u8>,         // 32 bytes Ed25519
    sui_address: address,           // derived
    label: std::string::String,     // e.g. "claude-code-mbpro", "openclaw-server-1"
    created_at: u64,
}
```

Use `key, store` so the account can be:
- top-level owned by the user (the default after `transfer::transfer`),
- transferred,
- wrapped inside another object if OneMem ever needs to compose with a parent registry,
- stored as a dynamic field somewhere if needed.

---

## 4. Authenticated events (the audit ledger entries)

Reference: https://docs.sui.io/develop/accessing-data/authenticated-events

This is the keystone primitive for OneMem's verifiability story. Use `event::emit_authenticated` (NOT `event::emit`) for every entry that needs to be light-client-verifiable.

```move
public struct MemoryCommit has copy, drop {
    account_id: ID,
    agent_id: address,           // which agent wrote
    namespace: vector<u8>,       // bucket
    blob_id: vector<u8>,         // Walrus blob id (encrypted)
    blob_object_id: ID,          // Sui object id for the Walrus blob registration
    op: u8,                      // 0=remember, 1=analyze, 2=delete, 3=tool_call
    digest: vector<u8>,          // sha256 of plaintext (commit-reveal-friendly)
    timestamp_ms: u64,
}

public entry fun commit_memory(
    account: &mut AuditAccount,
    namespace: vector<u8>,
    blob_id: vector<u8>,
    blob_object_id: ID,
    op: u8,
    digest: vector<u8>,
    clock: &sui::clock::Clock,
    ctx: &mut TxContext,
) {
    // ... auth checks ...
    sui::event::emit_authenticated(MemoryCommit {
        account_id: object::id(account),
        agent_id: ctx.sender(),
        namespace,
        blob_id,
        blob_object_id,
        op,
        digest,
        timestamp_ms: sui::clock::timestamp_ms(clock),
    });
}
```

`emit_authenticated` events are committed into a Merkle Mountain Range tied to checkpoint signatures, so a browser-side light client can verify inclusion + completeness without trusting any RPC. The package that defines the event type is the only package that can emit to its stream — OneMem's package effectively owns its event namespace.

Backwards-compatible: existing indexers (Sui Indexer Alt, custom indexers, GraphQL queries) keep working unchanged.

---

## 5. Seal access-control policy (`seal_approve*`)

Reference: https://docs.sui.io/sui-stack/seal/sui-stack-seal, MemWal `account.move` lines 525-560, OnlyFins `posts::seal_approve_access`.

The `seal_approve` convention:
- **Must be `entry fun`**, not `public`.
- First parameter is **`id: vector<u8>`** — the Seal inner identity. Seal prepends the package ID automatically to form the full namespaced identity.
- Aborts on denial; returns successfully on grant.
- Never called from other PTB commands during Seal evaluation — Seal key servers invoke it standalone via `dry_run_transaction_block`.

OneMem's adapted-from-MemWal version:

```move
entry fun seal_approve(
    id: vector<u8>,
    account: &AuditAccount,
    ctx: &TxContext,
) {
    assert_object_version(&account.id);
    assert!(account.active, EAccountDeactivated);

    let caller = ctx.sender();

    let owner_bytes = sui::bcs::to_bytes(&account.owner);
    let is_owner    = (caller == account.owner) && has_suffix(&id, &owner_bytes);
    let is_agent    = is_agent_address(account, caller);

    assert!(is_owner || is_agent, ENoAccess);
}

/// Helper for clients. seal_key_id(owner) → bcs::to_bytes(owner).
/// SEAL SDK prepends packageId.
public fun seal_key_id(owner: address): vector<u8> {
    sui::bcs::to_bytes(&owner)
}
```

For richer policies (per-namespace access, time-locked unlock, agent-specific gating), look at the three minimal reference policies in `MystenLabs/sui-move-bootcamp/K5/seal-demo/move/sources/`:
- `private_seal.move` — owner-only
- `timelock_seal.move` — release after timestamp (uses `Clock` at `0x6`)
- `allowlist_seal.move` — shared allowlist of addresses

---

## 6. Versioning (upgrade-safe)

Reference: https://docs.sui.io/develop/publish-upgrade-packages/upgrade, MemWal account.move lines 565-595.

You CANNOT add fields to a struct after publish in Sui Move. To version objects across upgrades, store the version as a **dynamic field on the object's `UID`**:

```move
use sui::dynamic_field as df;
use sui::package::{Self, UpgradeCap};

const VERSION: u64 = 1;
const VERSION_DF_KEY: vector<u8> = b"version";

fun get_version(id: &UID): u64 {
    if (df::exists_with_type<vector<u8>, u64>(id, VERSION_DF_KEY)) {
        *df::borrow<vector<u8>, u64>(id, VERSION_DF_KEY)
    } else {
        1  // pre-versioning default
    }
}

fun set_version(id: &mut UID, v: u64) {
    if (df::exists_with_type<vector<u8>, u64>(id, VERSION_DF_KEY)) {
        let r = df::borrow_mut<vector<u8>, u64>(id, VERSION_DF_KEY);
        *r = v;
    } else {
        df::add(id, VERSION_DF_KEY, v);
    }
}

fun assert_object_version(id: &UID) {
    assert!(get_version(id) == VERSION, EWrongVersion);
}
```

Then gate **every mutating entry fn** with `assert_object_version(&obj.id)`. Ship two migrators:
- `migrate_account` — owner-side, opt-in.
- `admin_migrate_account` — UpgradeCap-holder-side, batch migration.

This pattern is what MemWal ships today (`VERSION = 2`).

---

## 7. Dynamic fields vs derived objects

Reference: https://docs.sui.io/develop/objects/dynamic-fields, https://docs.sui.io/develop/objects/derived-objects.

| Need | Use |
|---|---|
| Per-account growing collection (e.g. agent keys) | A `vector<AgentKey>` field if bounded (MAX 20 like MemWal), else dynamic_field on UID |
| Heterogeneous attached data with arbitrary keys | `sui::dynamic_field` (wrap → not externally addressable) or `sui::dynamic_object_field` (object-typed values stay externally addressable) |
| Per-key uniqueness with parallel updates and TTO compatibility (e.g. one audit-anchor per (account, epoch)) | `derived_object::derive_address(parent_id, key)` |

For OneMem's epoch checkpoints (one per (account, epoch, namespace)) or one-per-agent audit anchors, **derived objects** are the right tool — they avoid the parent-bottleneck contention of dynamic fields and let you predict the address offchain via `derive_address` in the TS SDK before the object exists.

---

## 8. Module init pattern + one-time witness

Reference: https://docs.sui.io/develop/write-move/sui-move-concepts § Module initializers.

```move
public struct ONEMEM has drop {}   // ONE_TIME_WITNESS — name = uppercase module

fun init(witness: ONEMEM, ctx: &mut TxContext) {
    // Claim Publisher for Display capability
    let publisher = sui::package::claim(witness, ctx);

    // Mint first AnchorAdminCap
    transfer::transfer(
        AnchorAdminCap { id: object::new(ctx) },
        ctx.sender(),
    );

    // Share the AuditRegistry
    transfer::share_object(AuditRegistry {
        id: object::new(ctx),
        accounts: sui::table::new(ctx),
    });

    transfer::public_transfer(publisher, ctx.sender());
}
```

`init` runs **exactly once at publish**. Subsequent upgrades do not re-run it. The one-time witness pattern (capitalized struct named after the module, with `drop` only) lets you claim `Publisher` for the Display standard, mint a coin (`coin::create_currency`), or create any singleton.

---

## 9. Display standard (for wallets / explorers)

Reference: https://docs.sui.io/develop/objects/display/.

Set up `Display<AuditAccount>` in `init` (or in a separate admin function) so the Sui Explorer + wallets render OneMem objects with a name, description, image, link to the dashboard. Use templated fields like `{owner}`, `{created_at}`.

---

## 10. Hot-potato pattern (for atomic commit-then-finalize flows)

If OneMem needs to enforce "you cannot half-commit a memory write" — e.g. write must include both the Walrus blob registration AND the on-chain event in the same PTB — use the hot-potato pattern:

```move
public struct CommitTicket {   // no abilities — must be consumed in same tx
    account_id: ID,
    blob_id: vector<u8>,
}

public fun begin_commit(...): CommitTicket { ... }   // returns hot potato
public fun finalize_commit(ticket: CommitTicket, ...) { ... }  // consumes it
```

Pattern is from the OZ AMM / DeepBook flash-loan idiom. Useful if OneMem wants a two-step memory commit (e.g. quote → confirm) that cannot be split across PTBs.

---

## 11. Testing patterns

Reference: https://docs.sui.io/getting-started/examples/scenario-testing, https://docs.sui.io/develop/testing-debugging/testing.

- Use `sui::test_scenario` for multi-tx flows.
- For `Clock`-dependent code, use `sui::clock::{create_for_testing, increment_for_testing, set_for_testing, destroy_for_testing}`.
- For epoch-dependent code, use `test_scenario::later_epoch` to advance epochs.
- Always test the migrate functions on a stale-version object: use `test_strip_account_version(&mut obj)` to simulate a pre-upgrade object (MemWal ships exactly this helper at account.move L656-664).

---

## 12. Anti-patterns to avoid

- ❌ Storing the version as a struct field — you cannot add it later. Use a dynamic field on UID.
- ❌ Taking the AdminCap by value in entry functions — burns it on every call. Take `&AdminCap`.
- ❌ Calling `seal_approve` from other PTB commands — Seal key servers will reject; the convention only allows direct calls.
- ❌ Using `event::emit` for the audit ledger — switch to `event::emit_authenticated` so light clients can verify.
- ❌ Making the `init` function do anything that requires more gas than the publish budget — split heavy setup into a separate admin function gated by `&AdminCap`.
- ❌ Storing large blobs (>1KB) directly on-chain — store on Walrus, reference by blob ID + object ID (Walrus blobs are themselves Sui objects).
