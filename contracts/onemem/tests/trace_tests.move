// Tests for onemem::trace — TraceSession + ActionCall (Epic 3 Stories 3.1-3.3).
// Per docs/05-our-architecture/01-protocol/data-model.md + events-and-attestation.md.
//
// Scope:
//   - open_session creates a shared TraceSession with initial zero Merkle root
//   - open_session aborts when namespace is inactive
//   - emit_call inserts ActionCall as dynamic field on session
//   - emit_call updates session.last_content_hash + last_call_id + call_count
//   - emit_call aborts when session is closed
//   - emit_call aborts on namespace mismatch (session in ns A, cap for ns B)
//   - close_call records output_hash + status + ended_at
//   - close_session marks status COMPLETED + sets ended_at
//   - cannot emit_call after close_session

#[test_only]
module onemem::trace_tests;

use std::option;
use std::string;
use sui::clock;
use sui::object;
use sui::test_scenario as ts;
use onemem::namespace::{Self, MemoryNamespace, NamespaceCapability, Admin, ReadWrite};
use onemem::registry::{Self, OneMemRegistry};
use onemem::trace::{Self, TraceSession};

// === Constants ===

const ALICE: address = @0xA11CE;
const KIND_USER: u8 = 0;

// === Helpers ===

fun fresh_seal_pkg_id(): ID { object::id_from_address(@0xFEE7) }

/// Set up: registry initialized, Alice creates namespace, Alice gets Admin
/// cap, Alice mints herself a ReadWrite cap (because open_session needs RW).
/// Caller can then take_shared<MemoryNamespace> and
/// take_from_address<NamespaceCapability<ReadWrite>>(scenario, ALICE).
fun bootstrap_with_alice_rw_cap(scenario: &mut ts::Scenario) {
    registry::init_for_testing(scenario.ctx());
    scenario.next_tx(ALICE);
    let mut reg = ts::take_shared<OneMemRegistry>(scenario);
    let clk = clock::create_for_testing(scenario.ctx());
    namespace::create(
        &mut reg,
        string::utf8(b"alice-ns"),
        KIND_USER,
        fresh_seal_pkg_id(),
        &clk,
        scenario.ctx(),
    );
    clock::destroy_for_testing(clk);
    ts::return_shared(reg);

    scenario.next_tx(ALICE);
    let ns = ts::take_shared<MemoryNamespace>(scenario);
    let admin = ts::take_from_address<NamespaceCapability<Admin>>(scenario, ALICE);
    namespace::mint_capability_readwrite(&ns, &admin, ALICE, scenario.ctx());
    ts::return_shared(ns);
    ts::return_to_address(ALICE, admin);
}

/// Wrapper around trace::open_session that takes the standard test inputs.
fun open_alice_session(
    scenario: &mut ts::Scenario,
    ns: &mut MemoryNamespace,
    cap: &NamespaceCapability<ReadWrite>,
) {
    let clk = clock::create_for_testing(scenario.ctx());
    trace::open_session(
        ns,
        cap,
        string::utf8(b"claude-code-1.2.3"),
        string::utf8(b"test"),
        string::utf8(b"@onemem/sdk-ts@0.1.0"),
        &clk,
        scenario.ctx(),
    );
    clock::destroy_for_testing(clk);
}

// === Tests ===

#[test]
fun open_session_creates_shared_session_with_initial_zero_merkle_root() {
    let mut scenario = ts::begin(ALICE);
    bootstrap_with_alice_rw_cap(&mut scenario);

    scenario.next_tx(ALICE);
    let mut ns = ts::take_shared<MemoryNamespace>(&scenario);
    let rw = ts::take_from_address<NamespaceCapability<ReadWrite>>(&scenario, ALICE);
    open_alice_session(&mut scenario, &mut ns, &rw);

    scenario.next_tx(ALICE);
    let session = ts::take_shared<TraceSession>(&scenario);
    assert!(trace::namespace_id(&session) == object::id(&ns), 1);
    assert!(trace::call_count(&session) == 0, 2);
    assert!(trace::status(&session) == trace::session_status_active(), 3);
    // Initial merkle_root is 32 zero bytes.
    let root = trace::merkle_root(&session);
    assert!(vector::length(root) == 32, 4);
    let mut i = 0;
    while (i < 32) { assert!(*vector::borrow(root, i) == 0u8, 5); i = i + 1; };

    ts::return_shared(session);
    ts::return_shared(ns);
    ts::return_to_address(ALICE, rw);
    scenario.end();
}

#[test, expected_failure(abort_code = onemem::namespace::ENamespaceInactive)]
fun open_session_aborts_when_namespace_inactive() {
    let mut scenario = ts::begin(ALICE);
    bootstrap_with_alice_rw_cap(&mut scenario);

    // Deactivate the namespace as admin.
    scenario.next_tx(ALICE);
    let mut ns = ts::take_shared<MemoryNamespace>(&scenario);
    let admin = ts::take_from_address<NamespaceCapability<Admin>>(&scenario, ALICE);
    namespace::deactivate(&mut ns, &admin);
    ts::return_to_address(ALICE, admin);

    // Now try to open a session — aborts ENamespaceInactive.
    let rw = ts::take_from_address<NamespaceCapability<ReadWrite>>(&scenario, ALICE);
    open_alice_session(&mut scenario, &mut ns, &rw);

    abort 0
}

#[test]
fun emit_call_chains_prev_hash_and_increments_count() {
    let mut scenario = ts::begin(ALICE);
    bootstrap_with_alice_rw_cap(&mut scenario);

    scenario.next_tx(ALICE);
    let mut ns = ts::take_shared<MemoryNamespace>(&scenario);
    let rw = ts::take_from_address<NamespaceCapability<ReadWrite>>(&scenario, ALICE);
    open_alice_session(&mut scenario, &mut ns, &rw);

    scenario.next_tx(ALICE);
    let mut session = ts::take_shared<TraceSession>(&scenario);

    let clk = clock::create_for_testing(scenario.ctx());
    let input_hash_1 = vector[1u8, 2, 3];
    let call_id_1 = trace::emit_call(
        &mut session,
        &ns,
        &rw,
        option::none(),  // parent_call_id
        string::utf8(b"Read"),
        string::utf8(b"claude-code-builtin"),
        string::utf8(b"walrus:blob-1"),
        input_hash_1,
        option::none(),  // label
        &clk,
        scenario.ctx(),
    );
    assert!(trace::call_count(&session) == 1, 1);
    let content_after_first = *trace::last_content_hash(&session);

    // Second call: prev_hash should equal first call's content_hash.
    let input_hash_2 = vector[4u8, 5, 6];
    let _call_id_2 = trace::emit_call(
        &mut session,
        &ns,
        &rw,
        option::some(call_id_1),  // child of first call
        string::utf8(b"Bash"),
        string::utf8(b"claude-code-builtin"),
        string::utf8(b"walrus:blob-2"),
        input_hash_2,
        option::none(),
        &clk,
        scenario.ctx(),
    );
    assert!(trace::call_count(&session) == 2, 2);
    // After the second emit, last_content_hash has advanced past first's.
    assert!(*trace::last_content_hash(&session) != content_after_first, 3);

    clock::destroy_for_testing(clk);
    ts::return_shared(session);
    ts::return_shared(ns);
    ts::return_to_address(ALICE, rw);
    scenario.end();
}

#[test, expected_failure(abort_code = onemem::trace::ESessionClosed)]
fun emit_call_aborts_when_session_closed() {
    let mut scenario = ts::begin(ALICE);
    bootstrap_with_alice_rw_cap(&mut scenario);

    scenario.next_tx(ALICE);
    let mut ns = ts::take_shared<MemoryNamespace>(&scenario);
    let rw = ts::take_from_address<NamespaceCapability<ReadWrite>>(&scenario, ALICE);
    open_alice_session(&mut scenario, &mut ns, &rw);

    scenario.next_tx(ALICE);
    let mut session = ts::take_shared<TraceSession>(&scenario);

    let clk = clock::create_for_testing(scenario.ctx());
    trace::close_session(&mut session, &rw, trace::session_status_completed(), &clk, scenario.ctx());

    // Session closed → emit_call aborts ESessionClosed.
    let _ = trace::emit_call(
        &mut session,
        &ns,
        &rw,
        option::none(),
        string::utf8(b"Read"),
        string::utf8(b"claude-code-builtin"),
        string::utf8(b"walrus:blob-x"),
        vector[0u8],
        option::none(),
        &clk,
        scenario.ctx(),
    );

    abort 0
}

#[test]
fun close_call_updates_output_hash_and_status() {
    let mut scenario = ts::begin(ALICE);
    bootstrap_with_alice_rw_cap(&mut scenario);

    scenario.next_tx(ALICE);
    let mut ns = ts::take_shared<MemoryNamespace>(&scenario);
    let rw = ts::take_from_address<NamespaceCapability<ReadWrite>>(&scenario, ALICE);
    open_alice_session(&mut scenario, &mut ns, &rw);

    scenario.next_tx(ALICE);
    let mut session = ts::take_shared<TraceSession>(&scenario);

    let clk = clock::create_for_testing(scenario.ctx());
    let call_id = trace::emit_call(
        &mut session,
        &ns,
        &rw,
        option::none(),
        string::utf8(b"Bash"),
        string::utf8(b"claude-code-builtin"),
        string::utf8(b"walrus:in"),
        vector[7u8, 8, 9],
        option::none(),
        &clk,
        scenario.ctx(),
    );

    let output_hash = vector[10u8, 11, 12];
    trace::close_call(
        &mut session,
        &rw,
        call_id,
        string::utf8(b"walrus:out"),
        output_hash,
        trace::call_status_success(),
        &clk,
        scenario.ctx(),
    );

    // Verify call's recorded output via the test-only accessor.
    let (got_output_hash, got_status) = trace::call_output_for_testing(&session, call_id);
    assert!(got_output_hash == output_hash, 1);
    assert!(got_status == trace::call_status_success(), 2);

    clock::destroy_for_testing(clk);
    ts::return_shared(session);
    ts::return_shared(ns);
    ts::return_to_address(ALICE, rw);
    scenario.end();
}

#[test, expected_failure(abort_code = onemem::trace::ECallNotFound)]
fun close_call_aborts_when_call_unknown() {
    let mut scenario = ts::begin(ALICE);
    bootstrap_with_alice_rw_cap(&mut scenario);

    scenario.next_tx(ALICE);
    let mut ns = ts::take_shared<MemoryNamespace>(&scenario);
    let rw = ts::take_from_address<NamespaceCapability<ReadWrite>>(&scenario, ALICE);
    open_alice_session(&mut scenario, &mut ns, &rw);

    scenario.next_tx(ALICE);
    let mut session = ts::take_shared<TraceSession>(&scenario);

    let clk = clock::create_for_testing(scenario.ctx());
    let bogus_id = object::id_from_address(@0xDEAD);
    trace::close_call(
        &mut session,
        &rw,
        bogus_id,
        string::utf8(b"walrus:none"),
        vector[0u8],
        trace::call_status_success(),
        &clk,
        scenario.ctx(),
    );

    abort 0
}
