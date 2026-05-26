/// Authenticated event types for OneMem.
/// Per docs/05-our-architecture/01-protocol/events-and-attestation.md.
///
/// **`event::emit_authenticated`** is used for every event. Sui validators
/// sign checkpoints that include the authentication payload, so light
/// clients (dashboard `/verify/[session_id]`, the verify-mainnet.sh smoke
/// test) can verify event provenance without trusting a relayer.
///
/// First-mover note: no Mysten reference app uses this primitive yet as of
/// the rev pinned in Move.toml. OneMem is among the first production users
/// of authenticated events on Sui mainnet — worth calling out in the demo
/// and pitch.
///
/// Owning modules:
///   - registry.move    → RegistryInitialized, NamespaceRegistered
///   - namespace.move   → NamespaceCreated, NamespaceCapabilityMinted,
///                        NamespaceCapabilityRevoked, NamespaceDeactivated,
///                        NamespaceReactivated  (currently inline; will move
///                        here in Epic 4)
///   - trace.move       → TraceSessionOpened, TraceSessionClosed,
///                        ActionCallEmitted, ActionCallClosed (defined here
///                        now; trace.move emits them)
module onemem::events;

use std::string::String;
use sui::event;

// === TraceSession lifecycle ===

public struct TraceSessionOpenedEvent has copy, drop {
    session_id: ID,
    namespace_id: ID,
    agent_id: String,
    environment: String,
    sdk_version: String,
    captured_by_address: address,
    started_at: u64,
    initial_merkle_root: vector<u8>,
}

public struct TraceSessionClosedEvent has copy, drop {
    session_id: ID,
    namespace_id: ID,
    final_merkle_root: vector<u8>,
    call_count: u64,
    status: u8,
    ended_at: u64,
}

// === ActionCall lifecycle ===

public struct ActionCallEmittedEvent has copy, drop {
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
    captured_by_address: address,
    captured_at: u64,
    label: Option<String>,
}

public struct ActionCallClosedEvent has copy, drop {
    session_id: ID,
    call_id: ID,
    walrus_output_blob: String,
    output_hash: vector<u8>,
    status: u8,
    ended_at: u64,
}

// === Emit functions (Sui requires event::emit to live in the same module as
// the struct, so each event type's emitter is here. Owning modules call these
// instead of building structs + emitting inline.) ===

public fun emit_trace_session_opened(
    session_id: ID,
    namespace_id: ID,
    agent_id: String,
    environment: String,
    sdk_version: String,
    captured_by_address: address,
    started_at: u64,
    initial_merkle_root: vector<u8>,
) {
    event::emit_authenticated(TraceSessionOpenedEvent {
        session_id, namespace_id, agent_id, environment, sdk_version,
        captured_by_address, started_at, initial_merkle_root,
    });
}

public fun emit_trace_session_closed(
    session_id: ID,
    namespace_id: ID,
    final_merkle_root: vector<u8>,
    call_count: u64,
    status: u8,
    ended_at: u64,
) {
    event::emit_authenticated(TraceSessionClosedEvent {
        session_id, namespace_id, final_merkle_root, call_count, status, ended_at,
    });
}

public fun emit_action_call_emitted(
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
    captured_by_address: address,
    captured_at: u64,
    label: Option<String>,
) {
    event::emit_authenticated(ActionCallEmittedEvent {
        session_id, namespace_id, call_id, parent_call_id,
        tool_name, tool_namespace, walrus_input_blob, input_hash,
        content_hash, prev_hash, new_session_merkle_root,
        captured_by_address, captured_at, label,
    });
}

public fun emit_action_call_closed(
    session_id: ID,
    call_id: ID,
    walrus_output_blob: String,
    output_hash: vector<u8>,
    status: u8,
    ended_at: u64,
) {
    event::emit_authenticated(ActionCallClosedEvent {
        session_id, call_id, walrus_output_blob, output_hash, status, ended_at,
    });
}
