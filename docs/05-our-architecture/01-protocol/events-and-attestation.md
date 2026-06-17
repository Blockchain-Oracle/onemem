# Events + Attestation — OneMem

Every state transition on chain emits an authenticated event. The chain of events IS the verifiable audit trail. Light clients (browser dashboard, CLI `verify` command) re-construct the trace state from these events without reading full Move object state.

This is the file that makes the verifiability story actually credible.

---

## The keystone: `event::emit_authenticated`

`event::emit_authenticated` is a Sui primitive (per `../../01-sui-ecosystem/SUI_DOC_TREE.md`) that emits an event with an associated authentication payload. The validators sign the checkpoint that includes this event; clients can verify the event's authenticity using checkpoint signatures via a light client.

**The first-mover signal:** no Mysten reference app uses this primitive yet. OneMem is among the first production users. Worth calling out explicitly in the demo + pitch.

**Cost trade-off:** authenticated events cost slightly more gas than regular events. Per-`ActionCall` emit is what we want for verifiability; this is the right place to spend gas.

---

## Event types (canonical list)

All defined in `module onemem::events`:

### 1. `NamespaceCreatedEvent`

```move
public struct NamespaceCreatedEvent has copy, drop {
    namespace_id: ID,
    owner: address,
    name: String,
    namespace_kind: u8,
    seal_package_id: ID,
    created_at: u64,
}
```

Emitted by `namespace::create`. Authenticated.

### 2. `NamespaceCapabilityMintedEvent` (capability minted + transferred)

```move
public struct NamespaceCapabilityMintedEvent has copy, drop {
    namespace_id: ID,
    cap_id: ID,
    kind_tag: u8,  // 0 = ReadOnly, 1 = ReadWrite, 2 = Admin
    recipient: address,
}
```

Emitted by `namespace::create` for the initial Admin cap and by
`namespace::mint_capability_*` for recipient caps. The event does not store
`granted_by` or a contract timestamp; indexers use Sui event metadata
(`timestampMs`, tx digest, event sequence) for history timing/evidence.

### 3. `NamespaceCapabilityRevokedEvent` (capability burned)

```move
public struct NamespaceCapabilityRevokedEvent has copy, drop {
    namespace_id: ID,
    cap_id: ID,
}
```

Emitted by `namespace::revoke_capability`. The revoke event only identifies the
namespace and cap. Readers join it against the minted event by `cap_id` to
recover kind/recipient and use Sui event metadata for revoke timing/evidence.

### 4. `NamespaceDeactivatedEvent` / `NamespaceReactivatedEvent`

```move
public struct NamespaceDeactivatedEvent has copy, drop {
    namespace_id: ID,
}

public struct NamespaceReactivatedEvent has copy, drop {
    namespace_id: ID,
}
```

Authenticated.

### 5. `TraceSessionStarted`

```move
public struct TraceSessionStarted has copy, drop {
    session_id: ID,
    namespace_id: ID,
    agent_id: String,
    environment: String,
    sdk_version: String,
    captured_by_address: address,
    started_at: u64,
    initial_merkle_root: vector<u8>,  // [0u8; 32] for first session in namespace
}
```

Emitted by `trace::start_session`. Authenticated.

### 6. `ActionCallEmitted` (the load-bearing event)

```move
public struct ActionCallEmitted has copy, drop {
    session_id: ID,
    namespace_id: ID,
    call_id: ID,
    parent_call_id: Option<ID>,
    tool_name: String,
    tool_namespace: String,
    walrus_input_blob: String,
    input_hash: vector<u8>,
    content_hash: vector<u8>,
    prev_hash: vector<u8>,
    new_session_merkle_root: vector<u8>,
    new_namespace_merkle_root: vector<u8>,
    captured_by_address: address,
    captured_at: u64,
    label: Option<String>,
}
```

Emitted by `trace::append_call`. Authenticated.

This is the event clients use to walk + verify the Merkle chain. Indexers (memwal-style + our own) subscribe to this event type to build the live trace tree without reading every `ActionCall` object.

### 7. `ActionCallClosed`

```move
public struct ActionCallClosed has copy, drop {
    session_id: ID,
    call_id: ID,
    walrus_output_blob: Option<String>,
    output_hash: Option<vector<u8>>,
    status: u8,
    level: u8,
    events: vector<TraceEvent>,
    final_content_hash: vector<u8>,  // recomputed including output
    new_session_merkle_root: vector<u8>,
    ended_at: u64,
}
```

Authenticated. Indexers update the call status + final hash on this event.

### 8. `TraceSessionEnded`

```move
public struct TraceSessionEnded has copy, drop {
    session_id: ID,
    namespace_id: ID,
    final_status: u8,
    total_calls: u64,
    final_merkle_root: vector<u8>,
    ended_at: u64,
}
```

Authenticated.

### 9. `MemoryWritten` (semantic event; emitted at ActionCallEmitted-time for memory ops)

```move
public struct MemoryWritten has copy, drop {
    session_id: ID,
    call_id: ID,
    namespace_id: ID,
    memory_class: u8,  // 0 = semantic, 1 = episodic, 2 = procedural (LangMem taxonomy)
    context_tier: u8,  // 0 = L0 hot, 1 = L1 warm, 2 = L2 cold (OpenViking taxonomy)
    walrus_blob_id: String,
    content_hash: vector<u8>,
    written_at: u64,
}
```

Emitted by `trace::append_call` when `tool_name == "memwal_write"`. Non-authenticated (memory event is informational; the underlying `ActionCallEmitted` is the authenticated record).

---

## The Merkle chain mechanic (explicit)

### Initial state (per namespace)

When a `MemoryNamespace` is created:
- `ns.merkle_root = [0u8; 32]`
- `ns.last_action_call_id = None`

When a `TraceSession` starts:
- `session.merkle_root = ns.merkle_root` (inherits namespace's current head)
- `session.last_call_id = None`
- `session.root_call_id = None`

### On `trace::append_call`

```
let content_hash_pending = sha256(
    tool_name_bytes ||
    tool_namespace_bytes ||
    input_hash ||
    parent_call_id.unwrap_or([0u8; 32]) ||
    captured_at_bytes
);

let prev_hash = session.merkle_root;  // before this call

let new_session_merkle_root = sha256(
    session.merkle_root ||
    content_hash_pending
);

session.merkle_root = new_session_merkle_root;
session.last_call_id = Some(call_id);
if session.root_call_id.is_none() { session.root_call_id = Some(call_id); }
session.call_count += 1;

ns.merkle_root = sha256(ns.merkle_root || content_hash_pending);
ns.last_action_call_id = Some(call_id);

// Emit ActionCallEmitted with all the relevant hashes
```

### On `trace::close_call`

When the output is filled in, we recompute `content_hash` to include output. This means `session.merkle_root` AT FINALIZATION TIME differs from `merkle_root` AT APPEND TIME.

**Resolution:** the chain stores BOTH:
- `prev_hash` on the call object = predecessor's content_hash AT FINALIZATION time
- `content_hash` on the call object = this call's final content_hash (with output)

`session.merkle_root` is updated on close_call to reflect the finalized chain. Until all calls in a session are closed, the merkle root is "in flight" — clients see "session pending close" status.

For sessions where calls are written synchronously (most cases), append+close happen in the same PTB, so this isn't visible. Async cases (long-running calls) see the in-flight state.

### Verification (client-side, replayable)

To verify a session is intact:

1. Subscribe to all `ActionCallEmitted` + `ActionCallClosed` events for `session_id`
2. For each call in order, recompute `content_hash` from event fields + asserted plaintext (fetched + decrypted from Walrus blobs)
3. Assert each `call.prev_hash == predecessor.content_hash`
4. Re-derive `session.merkle_root` by chaining hashes
5. Assert derived root matches the on-chain `session.merkle_root`

If any step fails: chain is broken; surface "verification failed" in the dashboard's Verify drawer.

---

## Why authenticated events vs regular events

| Option | Trade-off |
|---|---|
| Regular `event::emit` | Cheaper; trusts the indexer's view; cannot light-client-verify |
| `event::emit_authenticated` | Slightly more gas; checkpoint-signature-verifiable; lets browsers verify without trusting a full node |

For OneMem's verifiability story, authenticated events are non-negotiable on `ActionCallEmitted`, `ActionCallClosed`, `TraceSessionStarted`, `TraceSessionEnded`. The chain story collapses without them.

For namespace lifecycle events (`Created`, `Shared`, `Revoked`, `Deactivated`), authenticated is preferred for symmetry but could be regular events if gas budget becomes tight. Plan: authenticated on all at v0.1; downgrade only if gas profiling shows a problem.

---

## Event filtering (for indexer + dashboard subscriptions)

Per `../../02-inspirations/claude-mem/HOOKS_AND_VIEWER_REFERENCE.md`, the dashboard subscribes via SSE. The SSE server filters Sui events by:
- `package_id == ONEMEM_PACKAGE_ID`
- `event_type IN (ActionCallEmitted, ActionCallClosed, TraceSessionStarted, TraceSessionEnded, NamespaceCreatedEvent, NamespaceCapabilityMintedEvent, NamespaceCapabilityRevokedEvent, MemoryWritten)`

Per-user filtering: SSE server applies `event.namespace_id IN (user's owned + shared namespaces)`.

Dashboard re-renders the trace tree on every `ActionCallEmitted` / `ActionCallClosed`. Verify drawer re-checks the merkle root on every state change.

---

## Verification flow surfaces (where verification shows up)

| Surface | When | What |
|---|---|---|
| Pillar 5 CLI: `onemem verify <session-id>` | User-invoked | Walks chain, prints PASS/FAIL + which call failed |
| Pillar 6 MCP: `verify_trace(session_id)` | Agent-invoked | Returns structured `{verified: bool, broken_at: Option<call_id>}` |
| Pillar 7 Dashboard: `/trace/[id]` Verify drawer | On page load + on each SSE event | Live "Verified ✓" badge in chartreuse |
| Pillar 11 Demos: "agent sends money" demo | Live during pitch | Show the green checkmark light up in real time |

---

## Cross-references

- `data-model.md` — struct definitions referenced here
- `move-contract.md` — entry functions that emit these events
- `access-control-and-sharing.md` — the Seal + capability layer that gates decryption
- `../../01-sui-ecosystem/SUI_DOC_TREE.md` — `event::emit_authenticated` reference + light-client docs
- `../../02-inspirations/claude-mem/HOOKS_AND_VIEWER_REFERENCE.md` — SSE pattern to mirror in dashboard
