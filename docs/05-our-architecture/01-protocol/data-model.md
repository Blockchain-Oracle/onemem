# Move Data Model — OneMem

**Load-bearing file.** The canonical Move struct schemas for OneMem's on-chain layer. Every other file in `01-protocol/` (and downstream SDKs/dashboard) references the definitions here.

Synthesized from:
- `../../../TRACE_AND_PROVIDERS.md` §4 — initial draft of `ActionCall` + `TraceSession`
- `../../02-inspirations/memwal-incubation/README.md` — MemWal `account.move` patterns to lift
- `../../02-inspirations/langsmith-langfuse/TRACE_VIEWERS_COMPARISON.md` — fields recommended (level, environment, version, events)
- `../../02-inspirations/MEMORY_SYSTEMS_COMPARISON.md` — taxonomies to adopt (LangMem semantic/episodic/procedural + OpenViking L0/L1/L2)

---

## The 5-type taxonomy (one-line view)

| Type | Kind | Purpose |
|---|---|---|
| `OneMemRegistry` | Shared | Dedup index of all `MemoryNamespace`s by `(owner, name)` |
| `MemoryNamespace` | Shared | Memory grouping + namespace policy; sharable via capability transfer |
| `NamespaceCapability<KIND>` | Owned | Transferable cap that grants read/write/admin access to a namespace |
| `TraceSession` | Shared | Per-agent session; root of an action-call tree; carries Merkle root |
| `ActionCall` | Shared (dynamic-field child of TraceSession) | Per-tool-call attestation; Merkle-chained `(content_hash, prev_hash)` |

Plus event types (see `events-and-attestation.md`):
- `MemoryWritten`, `ActionCallEmitted`, `TraceSessionStarted`, `TraceSessionEnded`, `NamespaceCapabilityMintedEvent`, `NamespaceCapabilityRevokedEvent`, `NamespaceCreatedEvent`, `NamespaceDeactivatedEvent`

---

## `OneMemRegistry` — shared dedup index

```move
public struct OneMemRegistry has key {
    id: UID,
    // (owner_address, name) → MemoryNamespace ID
    namespace_index: Table<NamespaceKey, ID>,
    version: u64,
}

public struct NamespaceKey has copy, drop, store {
    owner: address,
    name: String,
}
```

**Why shared:** Multiple users mint namespaces; dedup needs a single source of truth.

**Lifecycle:** Created once at package publish via `init`. Never destroyed.

**Lifted from:** MemWal's `AccountRegistry` pattern.

---

## `MemoryNamespace` — the unit of memory grouping + sharing

```move
public struct MemoryNamespace has key {
    id: UID,
    owner: address,
    name: String,                      // human-readable; unique per owner
    namespace_kind: u8,                // 0 = USER, 1 = AGENT, 2 = ORG, 3 = SESSION, 4 = SHARED
    seal_package_id: ID,               // package implementing seal_approve for this ns
    walrus_blob_count: u64,            // running count (informational; not load-bearing)
    last_action_call_id: Option<ID>,   // tail of Merkle chain for traces in this ns
    merkle_root: vector<u8>,           // running root, updated on each ActionCall
    created_at: u64,
    active: bool,                      // false = deactivated; new writes rejected
    // version stored as dynamic field via `df::add(&mut id, b"version", VERSION)`
}
```

**Why shared:** Multi-writer (agents writing memories, dashboard reading state). Serialization via consensus is the trade-off; for memory ops this is fine.

**Field rationale:**
- `namespace_kind` — adopts Mem0's 5-tuple scoping at the namespace level. USER/AGENT/ORG/SESSION/SHARED maps to Mem0's `user_id`/`agent_id`/`org_id`/`run_id`/cross-team. Lets dashboards filter naturally.
- `seal_package_id` — the package whose `seal_approve` function gates decryption for this namespace's blobs. Allows different namespaces to have different access policies (e.g., personal vs team).
- `last_action_call_id` + `merkle_root` — the chain head. Every new `ActionCall` updates these atomically.
- `active` — soft delete. Existing writes still verifiable; new writes blocked.

**Lifecycle:**
- Created via `onemem::namespace::create(owner, name, kind, seal_pkg, ctx)`
- Deactivated via `onemem::namespace::deactivate(ns, cap, ctx)` — requires admin capability
- Reactivated via `onemem::namespace::reactivate(ns, cap, ctx)`
- Never destroyed (auditability)

---

## `NamespaceCapability<KIND>` — transferable access

```move
public struct NamespaceCapability<phantom KIND> has key, store {
    id: UID,
    namespace_id: ID,
    // KIND is one of: ReadOnly, ReadWrite, Admin (phantom type params)
}

public struct ReadOnly has drop {}
public struct ReadWrite has drop {}
public struct Admin has drop {}
```

**Why owned + has store:** Owned objects parallelize. `has store` enables wrapping in collections / transferring through PTBs.

**Phantom type pattern:** No runtime cost. Type system enforces that an entry function requiring `&NamespaceCapability<Admin>` will not accept `&NamespaceCapability<ReadOnly>`.

**Lifecycle:**
- Minted via `onemem::namespace::mint_capability<KIND>(ns, cap, recipient, ctx)` — requires existing `&NamespaceCapability<Admin>`
- Transferred via standard `transfer::public_transfer` (any address, gasless via Enoki sponsored-tx for the demo)
- Revoked via `onemem::namespace::revoke_capability<KIND>(cap)` — burns the holder-owned cap object on-chain

Capability grant/revoke timing is event metadata, not object fields:
`NamespaceCapabilityMintedEvent` carries `namespace_id`, `cap_id`, `kind_tag`,
and `recipient`; `NamespaceCapabilityRevokedEvent` carries `namespace_id` and
`cap_id`.

**Surprise dimension:** sharing memory = capability transfer. Revocation = on-chain tx. Mem0 has team accounts (vendor-trusted); we have Sui caps (chain-enforced).

**Lifted from:** `onlyfins-example-app`'s `ViewerToken` pattern + ticketing-poc's stage capability.

---

## `TraceSession` — per-agent session root

```move
public struct TraceSession has key {
    id: UID,
    namespace_id: ID,                  // FK to MemoryNamespace
    agent_id: String,                  // e.g., "claude-code-1.2.3" / "hermes/0.14" / "openclaw/2026.5.11"
    environment: String,               // e.g., "production" / "dev" / "demo"
    sdk_version: String,               // OneMem SDK version that emitted this session
    started_at: u64,
    ended_at: Option<u64>,
    root_call_id: Option<ID>,          // first ActionCall in this session
    last_call_id: Option<ID>,          // tail (for fast appending)
    call_count: u64,
    merkle_root: vector<u8>,           // session-scoped Merkle root (updated per ActionCall)
    status: u8,                        // 0 = ACTIVE, 1 = COMPLETED, 2 = FAILED, 3 = ABORTED
    // dynamic fields hold ActionCalls keyed by ID (saves on object count)
}
```

**Why shared:** Multi-writer during the session (agent appending calls, dashboard reading live via SSE).

**Field rationale:**
- `agent_id` — uses Mysten's preferred terminology (matches their `feature/rename-delegate-to-agent-id` branch direction). Free-form string so we can identify any runtime.
- `environment` + `sdk_version` — Langfuse pattern; lets us filter dashboard views by env and detect breakage on version changes.
- `merkle_root` — session-scoped root. Verifying the session = walking the chain end-to-end and matching this root.
- `status` — enum surface for the dashboard's filter chips.

**Dynamic-field pattern for ActionCalls:** Instead of `vector<ID>` (capped at PTB output size), we store `ActionCall`s as dynamic fields keyed by their ID. Walrus Sites uses the same pattern for unbounded child objects.

**Lifecycle:**
- Created via `onemem::trace::open_session(namespace, rw_cap, agent_id, env, sdk_ver, clock, ctx)` — requires `&NamespaceCapability<ReadWrite>`
- Each `ActionCall` is appended via `onemem::trace::emit_call(session, namespace, rw_cap, ...)`
- Closed via `onemem::trace::close_session(session, namespace, rw_cap, status, clock, ctx)`

---

## `ActionCall` — per-tool-call attestation (the keystone)

```move
public struct ActionCall has key, store {
    id: UID,
    session_id: ID,                    // FK to TraceSession
    parent_call_id: Option<ID>,        // FK to parent ActionCall (tree structure)
    
    // Identity
    tool_name: String,                 // e.g., "Read" / "Bash" / "deepbook_predict::mint"
    tool_namespace: String,            // e.g., "claude-code-builtin" / "mcp:filesystem" / "@onemem/mcp"
    
    // Payload commits (data on Walrus; only hashes on chain)
    walrus_input_blob: String,         // Walrus blob ID for encrypted input
    walrus_output_blob: Option<String>, // Walrus blob ID for encrypted output (None if call in-flight)
    input_hash: vector<u8>,            // SHA-256 of input plaintext (pre-Seal encryption)
    output_hash: Option<vector<u8>>,   // SHA-256 of output plaintext
    
    // Chain integrity
    content_hash: vector<u8>,          // SHA-256 of (tool_name + input_hash + output_hash + parent_call_id)
    prev_hash: vector<u8>,             // content_hash of the previous ActionCall in the session
    
    // Timing
    started_at: u64,
    ended_at: Option<u64>,
    
    // Status / metadata (Langfuse-inspired)
    level: u8,                         // 0 = DEBUG, 1 = DEFAULT, 2 = WARNING, 3 = ERROR
    status: u8,                        // 0 = PENDING, 1 = SUCCESS, 2 = FAILURE, 3 = TIMEOUT, 4 = CANCELLED
    events: vector<TraceEvent>,        // Phoenix-inspired event log (exceptions, warnings, etc.)
    
    // Provenance
    captured_by_address: address,      // Sui address of the delegate key that signed this call
    
    // Optional human-readable annotations
    label: Option<String>,             // optional UI display label
}

public struct TraceEvent has copy, drop, store {
    timestamp: u64,
    kind: u8,                          // 0 = EXCEPTION, 1 = WARNING, 2 = INFO, 3 = METRIC, 4 = MEMORY_WRITE, 5 = MEMORY_READ
    message: String,
    payload_hash: Option<vector<u8>>,  // optional SHA-256 of detailed event payload (if blob attached)
    payload_blob: Option<String>,      // optional Walrus blob ID for detailed payload
}
```

**Why `has store`:** `ActionCall` is stored as a dynamic field child of `TraceSession`. `has store` is required for dynamic-field storage.

**Field rationale:**
- `tool_namespace` — disambiguates `Read` (Claude Code builtin) from `read` (some MCP filesystem tool). Without this, tool names collide across runtimes.
- `walrus_input_blob` + `walrus_output_blob` — pointers; the chain doesn't store the bytes. Bytes are Seal-encrypted on Walrus.
- `input_hash` + `output_hash` — SHA-256 of plaintext. Anchors integrity even if Seal key rotates / Walrus blob is later deleted.
- `content_hash` — the chain link. Computed deterministically from `tool_name + input_hash + output_hash + parent_call_id` so anyone can re-compute and verify.
- `prev_hash` — points to predecessor `ActionCall`'s `content_hash`. The chain itself.
- `level` + `status` — separate axes per Langfuse. `level` is severity (logged but doesn't block); `status` is execution outcome.
- `events: vector<TraceEvent>` — Phoenix-inspired; captures exceptions, warnings, intermediate metrics inside a single call.

**The Merkle chain mechanic:**
- First `ActionCall` in a session: `prev_hash = TraceSession.merkle_root` (the session's initial root, set to all-zeros at start).
- Every subsequent `ActionCall`: `prev_hash = predecessor.content_hash`.
- After each append, `TraceSession.merkle_root = hash(merkle_root || new_call.content_hash)` (sequential Merkle accumulator).
- Verifying a session = walk the chain from the root; at each call, recompute `content_hash` and assert `prev_hash` matches predecessor's `content_hash`.

**`event::emit_authenticated` integration:** On every `append_call`, we emit an authenticated event carrying `(session_id, call_id, content_hash, prev_hash, merkle_root)`. Light clients can verify the chain from these events without reading the full Move state.

**Lifecycle:**
- Created via `onemem::trace::emit_call(session, namespace, rw_cap, parent_call_id, ...)` — held as dynamic field of `TraceSession`
- Updated via `onemem::trace::close_call(session, namespace, rw_cap, call_id, output_data, ctx)` (transitions PENDING → SUCCESS/FAILURE)
- Never destroyed (verifiability)

---

## Memory primitives (referenced; full design in MemWal SDK)

OneMem doesn't re-implement memory storage. We reuse MemWal:

- A memory write = `client.remember(text, namespace)` → MemWal's SDK encrypts (Seal `/manual`), uploads to Walrus, gets back a blob ID
- A memory read = `client.recall(query, namespace)` → MemWal's SDK does vector recall, returns blob IDs, decrypts via Seal
- We add: `MemoryWritten` event on Sui per write, with the Walrus blob ID + content hash + namespace_id

So at the Move layer, "memory" is just `ActionCall`s where `tool_name = "memwal_write"` and the `walrus_output_blob` field points to the memory blob. **A memory write IS an action call** — unification simplifies the model.

---

## Memory taxonomy enums (LangMem + OpenViking adoption)

These don't live in the contract directly — they're emitted as `TraceEvent.payload` metadata. But documenting here for SDK consistency:

```typescript
// Adopted from LangMem
type MemoryClass = "semantic" | "episodic" | "procedural";

// Adopted from OpenViking
type ContextTier = "L0" | "L1" | "L2";
// L0 = hot/working (current session)
// L1 = warm/recent (last N sessions)
// L2 = cold/archived (long-term)
```

SDKs annotate every memory write with `class` and `tier`. Dashboards filter on these.

---

## Cross-references to downstream pillars

Every downstream pillar references this data model:

| Downstream | What it consumes |
|---|---|
| Pillar 2 SDKs | Move types → SDK types (codegen-friendly) |
| Pillar 3 Runtimes | Plugins call SDK methods that emit `ActionCall`s |
| Pillar 4 Frameworks | Providers call SDK methods that emit `ActionCall`s |
| Pillar 5 CLI | `onemem verify <call-id>` walks the Merkle chain |
| Pillar 6 MCP server | `verify_trace`, `replay_session` tools operate on `TraceSession` + `ActionCall` |
| Pillar 7 Dashboard | `/trace/[id]` reads `TraceSession` + dynamic-field `ActionCall`s, renders tree |
| Pillar 11 Demos | All 4 demos exercise this exact data model |

---

## Open questions for `move-contract.md` to resolve

- Whether to split `Registry` and `MemoryNamespace` into separate modules vs one — likely separate
- Whether `ActionCall` events use `event::emit_authenticated` per-call or batched per-session-segment (cost trade-off)
- Capability transfer: do we accept any address, or require the recipient to have an existing `MemWalAccount`? (Likely any address; recipients can create their account on first read.)
- Storage cost: dynamic-field-per-call on a busy session is expensive. Do we batch writes at session-end? (Decision: no batching at v0.1 — real-time append is the dashboard story.)
