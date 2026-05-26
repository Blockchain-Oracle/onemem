/// TraceSession + ActionCall — the Merkle-chained verifiable trace primitive.
/// Per docs/05-our-architecture/01-protocol/data-model.md + events-and-attestation.md.
///
/// A `TraceSession` is a shared object that an agent runtime opens at the
/// start of a logical operation and closes at the end. Each tool call /
/// memory write the agent performs becomes an `ActionCall` stored as a
/// dynamic field on the session (keyed by call_id).
///
/// The Merkle chain mechanic:
///   - `content_hash` of each ActionCall = sha256(tool_name || tool_namespace ||
///     input_hash || serialize(parent_call_id))
///   - `prev_hash` of each call = the previous call's content_hash
///     (or the session's initial zero merkle_root for the first call)
///   - Session-level `merkle_root` advances via chain_hash(running, content) =
///     sha256(running || content). Off-chain walkers re-compute and compare.
///
/// Cross-runtime composition: two sessions in two runtimes referencing the
/// same parent_call_id are part of the same logical operation. The contract
/// stores parent_call_id as an opaque ID; the runtime layer propagates it
/// via env vars (ONEMEM_PARENT_CALL_ID).
///
/// v0.1 scope notes:
///   - `events: vector<TraceEvent>` and `level` fields from the architecture
///     are deferred to v0.2 to fit the Day 6-8 time-box. The chain itself is
///     the load-bearing trust primitive; per-call event log is icing.
///   - Events here use `sui::event::emit` (not `event::emit_authenticated`);
///     Epic 4 will refactor to the authenticated variant. The Merkle chain +
///     consensus-signed tx still gives strong verifiability today.
module onemem::trace;

// === Imports ===

use std::hash;
use std::string::String;
use sui::clock::Clock;
use sui::dynamic_field as df;
use onemem::events;
use onemem::namespace::{Self, MemoryNamespace, NamespaceCapability, ReadWrite};
use onemem::version;

// === Errors ===

const ESessionClosed: u64 = 0;
const ECallNotFound: u64 = 1;
const ECallAlreadyClosed: u64 = 2;
const EBadStatus: u64 = 3;
const EWrongSessionNamespace: u64 = 4;

// === Constants ===

const VERSION: u64 = 1;

// Session status enum.
const SESSION_ACTIVE: u8 = 0;
const SESSION_COMPLETED: u8 = 1;
const SESSION_FAILED: u8 = 2;
const SESSION_ABORTED: u8 = 3;

// Call status enum.
const CALL_PENDING: u8 = 0;
const CALL_SUCCESS: u8 = 1;
const CALL_FAILURE: u8 = 2;
const CALL_TIMEOUT: u8 = 3;
const CALL_CANCELLED: u8 = 4;
const CALL_STATUS_MAX: u8 = CALL_CANCELLED;

// Initial Merkle root = 32 zero bytes. Used by off-chain walkers as the
// starting "running hash" before the first call.
const ZERO_HASH: vector<u8> = vector[
    0u8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

// === Structs ===

public struct TraceSession has key {
    id: UID,
    namespace_id: ID,
    agent_id: String,
    environment: String,
    sdk_version: String,
    started_at: u64,
    ended_at: Option<u64>,
    /// First call in the session (None until first emit).
    root_call_id: Option<ID>,
    /// Most recently appended call (for fast tail access).
    last_call_id: Option<ID>,
    call_count: u64,
    /// content_hash of the most recently emitted call. Equals ZERO_HASH
    /// before any call. Becomes the `prev_hash` of the NEXT call.
    last_content_hash: vector<u8>,
    /// Running session Merkle root. Advances per emit via chain_hash.
    merkle_root: vector<u8>,
    status: u8,
    captured_by_address: address,
}

/// Stored as a dynamic field on TraceSession.id, keyed by `ID` (the call's
/// own object id). `has store` so it can live in a dynamic field.
public struct ActionCall has key, store {
    id: UID,
    session_id: ID,
    parent_call_id: Option<ID>,
    tool_name: String,
    tool_namespace: String,
    walrus_input_blob: String,
    walrus_output_blob: Option<String>,
    input_hash: vector<u8>,
    output_hash: Option<vector<u8>>,
    content_hash: vector<u8>,
    prev_hash: vector<u8>,
    started_at: u64,
    ended_at: Option<u64>,
    status: u8,
    captured_by_address: address,
    label: Option<String>,
}

// Event struct definitions live in `onemem::events` (per the architecture).
// trace.move emits via the constructor functions exported from there.

// === Public Functions ===

/// Open a new trace session. Requires a ReadWrite cap for the namespace
/// (Admin holders can mint themselves an RW cap first). Aborts if the
/// namespace is inactive or the cap is for a different namespace.
public fun open_session(
    ns: &mut MemoryNamespace,
    cap: &NamespaceCapability<ReadWrite>,
    agent_id: String,
    environment: String,
    sdk_version: String,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    namespace::assert_active(ns);
    namespace::assert_cap_for_namespace(cap, ns);

    let started_at = clock.timestamp_ms();
    let namespace_id = object::id(ns);
    let captured_by_address = ctx.sender();

    let mut session = TraceSession {
        id: object::new(ctx),
        namespace_id,
        agent_id,
        environment,
        sdk_version,
        started_at,
        ended_at: option::none(),
        root_call_id: option::none(),
        last_call_id: option::none(),
        call_count: 0,
        last_content_hash: ZERO_HASH,
        merkle_root: ZERO_HASH,
        status: SESSION_ACTIVE,
        captured_by_address,
    };
    version::add_initial_version(&mut session.id, VERSION);

    let session_id = object::id(&session);
    events::emit_trace_session_opened(
        session_id, namespace_id, agent_id, environment, sdk_version,
        captured_by_address, started_at, ZERO_HASH,
    );

    transfer::share_object(session);
}

/// Append a new ActionCall to the session's Merkle chain. Returns the
/// minted call's ID (caller passes it to `close_call` later). Aborts:
///   - ESessionClosed if status != ACTIVE
///   - EWrongSessionNamespace if `ns` is not the session's namespace
///   - via namespace::assert_active / assert_cap_for_namespace
public fun emit_call(
    session: &mut TraceSession,
    ns: &MemoryNamespace,
    cap: &NamespaceCapability<ReadWrite>,
    parent_call_id: Option<ID>,
    tool_name: String,
    tool_namespace: String,
    walrus_input_blob: String,
    input_hash: vector<u8>,
    label: Option<String>,
    clock: &Clock,
    ctx: &mut TxContext,
): ID {
    version::assert_version_matches(&session.id, VERSION);
    assert!(session.status == SESSION_ACTIVE, ESessionClosed);
    assert!(session.namespace_id == object::id(ns), EWrongSessionNamespace);
    namespace::assert_active(ns);
    namespace::assert_cap_for_namespace(cap, ns);

    let prev_hash = session.last_content_hash;
    let content_hash = compute_content_hash(&tool_name, &tool_namespace, &input_hash, &parent_call_id);
    let new_session_merkle_root = chain_hash(&session.merkle_root, &content_hash);
    let captured_at = clock.timestamp_ms();
    let captured_by_address = ctx.sender();

    let call = ActionCall {
        id: object::new(ctx),
        session_id: object::id(session),
        parent_call_id,
        tool_name,
        tool_namespace,
        walrus_input_blob,
        walrus_output_blob: option::none(),
        input_hash,
        output_hash: option::none(),
        content_hash,
        prev_hash,
        started_at: captured_at,
        ended_at: option::none(),
        status: CALL_PENDING,
        captured_by_address,
        label,
    };
    let call_id = object::id(&call);

    // Update session state.
    if (option::is_none(&session.root_call_id)) {
        session.root_call_id = option::some(call_id);
    };
    session.last_call_id = option::some(call_id);
    session.last_content_hash = content_hash;
    session.merkle_root = new_session_merkle_root;
    session.call_count = session.call_count + 1;

    events::emit_action_call_emitted(
        object::id(session), session.namespace_id, call_id, parent_call_id,
        tool_name, tool_namespace, walrus_input_blob, input_hash,
        content_hash, prev_hash, new_session_merkle_root,
        captured_by_address, captured_at, label,
    );

    df::add(&mut session.id, call_id, call);
    call_id
}

/// Record an output for a previously emitted call. Idempotent only in the
/// sense that a closed call cannot be re-closed (aborts ECallAlreadyClosed).
public fun close_call(
    session: &mut TraceSession,
    cap: &NamespaceCapability<ReadWrite>,
    call_id: ID,
    walrus_output_blob: String,
    output_hash: vector<u8>,
    status: u8,
    clock: &Clock,
    _ctx: &mut TxContext,
) {
    version::assert_version_matches(&session.id, VERSION);
    assert!(status <= CALL_STATUS_MAX && status != CALL_PENDING, EBadStatus);
    assert!(df::exists(&session.id, call_id), ECallNotFound);
    assert!(cap_for_session(cap, session), EWrongSessionNamespace);

    let call: &mut ActionCall = df::borrow_mut(&mut session.id, call_id);
    assert!(option::is_none(&call.output_hash), ECallAlreadyClosed);

    let ended_at = clock.timestamp_ms();
    call.walrus_output_blob = option::some(walrus_output_blob);
    call.output_hash = option::some(output_hash);
    call.ended_at = option::some(ended_at);
    call.status = status;

    events::emit_action_call_closed(
        object::id(session), call_id, walrus_output_blob, output_hash, status, ended_at,
    );
}

/// Close the session with a final status (COMPLETED / FAILED / ABORTED).
/// Locks merkle_root. Subsequent emit_call aborts ESessionClosed.
public fun close_session(
    session: &mut TraceSession,
    cap: &NamespaceCapability<ReadWrite>,
    final_status: u8,
    clock: &Clock,
    _ctx: &mut TxContext,
) {
    version::assert_version_matches(&session.id, VERSION);
    assert!(
        final_status == SESSION_COMPLETED ||
        final_status == SESSION_FAILED ||
        final_status == SESSION_ABORTED,
        EBadStatus,
    );
    assert!(session.status == SESSION_ACTIVE, ESessionClosed);
    assert!(cap_for_session(cap, session), EWrongSessionNamespace);

    let ended_at = clock.timestamp_ms();
    session.status = final_status;
    session.ended_at = option::some(ended_at);

    events::emit_trace_session_closed(
        object::id(session), session.namespace_id, session.merkle_root,
        session.call_count, final_status, ended_at,
    );
}

// === Accessors ===

public fun namespace_id(s: &TraceSession): ID { s.namespace_id }
public fun agent_id(s: &TraceSession): &String { &s.agent_id }
public fun environment(s: &TraceSession): &String { &s.environment }
public fun sdk_version(s: &TraceSession): &String { &s.sdk_version }
public fun started_at(s: &TraceSession): u64 { s.started_at }
public fun ended_at(s: &TraceSession): &Option<u64> { &s.ended_at }
public fun call_count(s: &TraceSession): u64 { s.call_count }
public fun status(s: &TraceSession): u8 { s.status }
public fun merkle_root(s: &TraceSession): &vector<u8> { &s.merkle_root }
public fun last_content_hash(s: &TraceSession): &vector<u8> { &s.last_content_hash }
public fun root_call_id(s: &TraceSession): &Option<ID> { &s.root_call_id }
public fun last_call_id(s: &TraceSession): &Option<ID> { &s.last_call_id }

// Status enum exports (so callers don't repeat magic numbers).
public fun session_status_active(): u8 { SESSION_ACTIVE }
public fun session_status_completed(): u8 { SESSION_COMPLETED }
public fun session_status_failed(): u8 { SESSION_FAILED }
public fun session_status_aborted(): u8 { SESSION_ABORTED }
public fun call_status_pending(): u8 { CALL_PENDING }
public fun call_status_success(): u8 { CALL_SUCCESS }
public fun call_status_failure(): u8 { CALL_FAILURE }
public fun call_status_timeout(): u8 { CALL_TIMEOUT }
public fun call_status_cancelled(): u8 { CALL_CANCELLED }

// === Internal: hash helpers ===

/// Deterministic content hash. Serialization layout (concatenated bytes):
///   tool_name_bytes || tool_namespace_bytes || input_hash || parent_tag || parent_id_bytes
/// where parent_tag is 0u8 if parent_call_id is None, else 1u8 followed by
/// the 32-byte address-form ID. Off-chain walkers MUST use the same layout.
fun compute_content_hash(
    tool_name: &String,
    tool_namespace: &String,
    input_hash: &vector<u8>,
    parent_call_id: &Option<ID>,
): vector<u8> {
    let mut buf = vector[];
    vector::append(&mut buf, *tool_name.as_bytes());
    vector::append(&mut buf, *tool_namespace.as_bytes());
    vector::append(&mut buf, *input_hash);
    if (option::is_some(parent_call_id)) {
        vector::push_back(&mut buf, 1u8);
        let parent_addr = option::borrow(parent_call_id).id_to_address();
        vector::append(&mut buf, sui::address::to_bytes(parent_addr));
    } else {
        vector::push_back(&mut buf, 0u8);
    };
    hash::sha2_256(buf)
}

/// Chain step: running_root' = sha256(running_root || content_hash).
/// Public-facing because off-chain verifiers (dashboard /verify/[id], the
/// verify-mainnet.sh script) must re-implement the same step; exporting
/// `chain_hash_for_testing` below keeps the on-chain + off-chain in lockstep.
fun chain_hash(running: &vector<u8>, content: &vector<u8>): vector<u8> {
    let mut buf = *running;
    vector::append(&mut buf, *content);
    hash::sha2_256(buf)
}

fun cap_for_session(cap: &NamespaceCapability<ReadWrite>, session: &TraceSession): bool {
    namespace::cap_for_namespace(cap) == session.namespace_id
}

// === Test-Only ===

#[test_only]
public fun zero_hash_for_testing(): vector<u8> { ZERO_HASH }

#[test_only]
/// Borrow a stored ActionCall's content_hash by ID. Used by Merkle-chain
/// tests to walk the chain off-chain.
public fun call_content_hash_for_testing(session: &TraceSession, call_id: ID): vector<u8> {
    let call: &ActionCall = df::borrow(&session.id, call_id);
    call.content_hash
}

#[test_only]
/// Borrow a stored ActionCall's (output_hash, status). Used by close_call
/// tests to verify state was recorded.
public fun call_output_for_testing(session: &TraceSession, call_id: ID): (vector<u8>, u8) {
    let call: &ActionCall = df::borrow(&session.id, call_id);
    (*option::borrow(&call.output_hash), call.status)
}
