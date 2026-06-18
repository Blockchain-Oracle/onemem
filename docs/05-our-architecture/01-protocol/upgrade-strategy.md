# Upgrade Strategy — OneMem Move Package

Move on Sui has a strict rule: **you cannot add fields to a struct after publish.** This forces every long-lived contract to plan for upgrades from Day 1.

OneMem adopts MemWal's pattern (per `../../02-inspirations/memwal-incubation/README.md`): **version-as-dynamic-field**. Each struct has a separate `version` value stored as a dynamic field on its UID, NOT as a struct field. Future versions can ship new dynamic fields with new data without invalidating existing objects.

---

## The pattern (with example)

### Module-level VERSION constant

Each module declares a current package version:

```move
module onemem::namespace {
    const VERSION: u64 = 1;  // bump on upgrade
    // ...
}

module onemem::trace {
    const VERSION: u64 = 1;
    // ...
}
```

### Struct creation always writes the version

```move
public entry fun create(
    registry: &mut OneMemRegistry,
    name: String,
    kind: u8,
    seal_package_id: ID,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let mut ns = MemoryNamespace { /* ... fields per data-model.md ... */ };

    // Version as dynamic field, NOT as a struct field
    df::add(&mut ns.id, b"version", VERSION);

    // Register + share
    registry::register(registry, tx_context::sender(ctx), name, object::id(&ns));
    transfer::share_object(ns);
    // ...
}
```

### Every state-mutating entry function gates on version

```move
public entry fun append_call(
    session: &mut TraceSession,
    ns: &mut MemoryNamespace,
    cap: &NamespaceCapability<ReadWrite>,
    /* ... */
) {
    assert_version_matches(&ns.id, VERSION);  // abort if ns version != current
    assert_version_matches(&session.id, VERSION);
    // ... rest of function
}

fun assert_version_matches(id: &UID, expected: u64) {
    let actual = *df::borrow<vector<u8>, u64>(id, b"version");
    assert!(actual == expected, EVersionMismatch);
}
```

### Upgrade migration (v1 → v2 example)

When we bump `VERSION = 2` to add (hypothetical) `tags: vector<String>` to `MemoryNamespace`:

1. Bump `const VERSION: u64 = 2;`
2. Ship a migration entry function:
   ```move
   public entry fun migrate_namespace_v2(
       ns: &mut MemoryNamespace,
       admin: &NamespaceCapability<Admin>,
       initial_tags: vector<String>,
       ctx: &mut TxContext,
   ) {
       // Verify current version is 1
       let current_version: &mut u64 = df::borrow_mut(&mut ns.id, b"version");
       assert!(*current_version == 1, EBadMigrationSource);

       // Add the new field as a dynamic field
       df::add(&mut ns.id, b"tags", initial_tags);

       // Bump version
       *current_version = 2;
   }
   ```
3. Existing v1 namespaces stay readable + writable (v1 entry functions still work because version gate matches).
4. Owners can opt in to v2 by calling `migrate_namespace_v2`.

### Hard-cutover upgrade (v1 obsolete)

If we need to FORCE everyone to v2:
- v2 ships with `const VERSION: u64 = 2;`
- v1's `assert_version_matches(&ns.id, VERSION)` now fails because `df` value is still `1`
- Owners MUST call `migrate_namespace_v2` to keep using the namespace
- Old, un-migrated namespaces become read-only (entry fns abort) but data + Merkle chain remain queryable

This is the "soft pressure" upgrade pattern. Users see "this namespace is on v1 — migrate to v2 to continue writing" in the dashboard.

---

## What lives where (Move struct field vs dynamic field)

**Struct fields:** anything that's load-bearing at creation time + never changes shape.
- `owner`, `name`, `seal_package_id`, `created_at` — set once, identity-defining

**Mutable struct fields:** anything that updates but doesn't change SHAPE (still part of the same field definition).
- `active`, `merkle_root`, `last_action_call_id`, `walrus_blob_count` — values change; types fixed

**Dynamic fields:** anything that might be ADDED in a future version, OR that's an unbounded child.
- `version` — every struct
- `tags`, `description`, future `extras` — added in v2+
- `ActionCall`s under `TraceSession` — unbounded children (keyed by call ID)

---

## Why this pattern (vs alternatives)

| Pattern | Pros | Cons | Verdict |
|---|---|---|---|
| **Version-as-dynamic-field (chosen)** | Survives struct field additions; gradual migration; objects-stay-valid | Slightly more complex than no versioning | Pick this |
| Version-as-struct-field | Simpler at v1 | Can't add new fields in v2 without forcing all objects to be rebuilt | Reject |
| Always recreate objects | Always-fresh schema | Loses object IDs; breaks every downstream cap | Reject |
| Multiple modules per version (`onemem::v1::namespace`, `onemem::v2::namespace`) | Clean separation | Doubles maintenance; old + new modules forever | Reject |

MemWal `account.move` uses this same pattern and is on `VERSION = 2` already — battle-tested.

---

## Package upgrade vs object upgrade

Two upgrade axes:

1. **Sui package upgrade** (Sui-level mechanic): `sui client upgrade` ships a new package version. Old object types still resolve. Use this when adding NEW modules or NEW entry functions.

2. **Object schema upgrade** (our problem): when an EXISTING struct needs new data. Our `version`-as-dynamic-field pattern handles this.

At v0.1 we publish ONCE (`sui client publish`). Any future upgrades use `sui client upgrade` for package-level changes + our migration entry functions for object schema changes.

**Upgrade cap policy:** the `UpgradeCap` from `sui client publish` is initially owned by the deployer (the OneMem team). At v0.2+ this could move to a multisig or DAO governance. At v0.1, deployer-owned is fine (single point of trust for hackathon scope).

After a package upgrade, long-lived shared objects keep the package ID from the
type that created them. For example, the testnet `OneMemRegistry` created by the
original package still has type `<original>::registry::OneMemRegistry` even when
`config/networks.json` points SDK calls at the latest package. Verification
scripts must therefore check the object type suffix, not pin the registry object
type to the latest package ID.

`sui client upgrade` can update `Published.toml` itself. The OneMem migration
script captures the pre-upgrade package version before invoking the live command
and rewrites `Published.toml` to exactly `previous + 1`, matching the package
object's `content.Package.version`.

### Operational dry-run

Before a live upgrade, rehearse the exact source with:

```bash
bash scripts/migrate-contract.sh testnet --dry-run
```

The script runs `sui client upgrade --dry-run --json`, prints the selected Sui
CLI binary/version, and exits before any manifest or generated-address update.
Successful dry-runs print `No chain state changed` and `No repo files were
updated`.

Sui testnet can move ahead of the Homebrew stable CLI. If Homebrew reports a
protocol-version panic, install the testnet-channel binary with `suiup` and put
that binary first in PATH for the rehearsal:

```bash
curl -sSfL https://raw.githubusercontent.com/MystenLabs/suiup/main/install.sh | sh
/Users/abu/.local/bin/suiup install sui@testnet
/Users/abu/.local/bin/suiup default set sui@testnet
PATH="/Users/abu/.local/bin:$PATH" bash scripts/migrate-contract.sh testnet --dry-run
```

On 2026-06-18, Homebrew `sui 1.73.0-homebrew` still supported protocol max 125
while testnet was on protocol 126. The `suiup` testnet binary
`sui 1.73.1-ff1fe0ec4551` completed the dry-run successfully.

---

## What entry functions in v2+ need to do

Every new entry function in v2+ must:
1. Read the current version from the object's dynamic field
2. Assert it matches the entry function's expected version
3. If old: emit a `NeedsMigration` event (so dashboard can prompt) and abort

Every new entry function added must do this consistently. The `assert_version_matches` helper in `module onemem::version` makes this a one-liner.

---

## Forward-compatible event types

Events are append-only (new event types don't break old indexers; old types stay valid). So:
- v1 emits `NamespaceCreatedV1`, `ActionCallEmittedV1`, etc.
- v2 can emit `NamespaceCreatedV2` (with new fields) AND keep `NamespaceCreatedV1` for any code path that needs v1 semantics

Or simpler: emit unversioned event types and add new fields by adding new event types (`NamespaceTagsUpdated` in v2 instead of changing `NamespaceCreated`).

**Decision for v0.1:** emit unversioned event types (`NamespaceCreated` not `NamespaceCreatedV1`). When v2 lands, we'll either add new event types or version the existing ones — both options stay open.

---

## What this pattern enables (the wedge angle)

The version pattern lets OneMem ship v0.1 with full confidence that we can:
- Add memory taxonomies (LangMem semantic/episodic/procedural) as dynamic fields later
- Add OpenViking L0/L1/L2 context tiers as dynamic fields later
- Add reputation scores on `ActionCall` (v0.2 vision pillar)
- Add marketplace primitives on `MemoryNamespace` (v0.2 vision pillar)
- Add ERC-8004 bridge fields (v0.2)

All without breaking any v0.1 namespace, session, or call. **No "we'll redeploy in v0.2" handwaving.**

---

## Cross-references

- `data-model.md` — struct definitions (every struct uses this version pattern)
- `move-contract.md` — entry functions (every one calls `assert_version_matches`)
- `../../02-inspirations/memwal-incubation/README.md` — MemWal's `account.move` is the proven reference (currently `VERSION = 2`)
- `../../01-sui-ecosystem/move-patterns-for-onemem.md` — version dynamic-field pattern detail
- `../../01-sui-ecosystem/SUI_DOC_TREE.md` — Sui package-upgrade docs
