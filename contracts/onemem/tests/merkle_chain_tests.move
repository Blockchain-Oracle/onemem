// Tests for the Merkle chain (Epic 3 Story 3.4 + cross-pillar tamper-detection).
// Per docs/05-our-architecture/01-protocol/events-and-attestation.md (chain mechanics).
//
// Scope:
//   - Off-chain re-computation of session.merkle_root matches the on-chain value
//   - close_session locks merkle_root + sets status + emits final event
//   - Tamper detection: hand-computing the chain with a forged input hash
//     produces a DIFFERENT root, surfacing tampering

#[test_only]
module onemem::merkle_chain_tests;

use std::option;
use std::string;
use std::hash;
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

fun setup(scenario: &mut ts::Scenario) {
    registry::init_for_testing(scenario.ctx());
    scenario.next_tx(ALICE);
    let mut reg = ts::take_shared<OneMemRegistry>(scenario);
    let clk = clock::create_for_testing(scenario.ctx());
    namespace::create(&mut reg, string::utf8(b"ns"), KIND_USER, fresh_seal_pkg_id(), &clk, scenario.ctx());
    clock::destroy_for_testing(clk);
    ts::return_shared(reg);

    scenario.next_tx(ALICE);
    let ns = ts::take_shared<MemoryNamespace>(scenario);
    let admin = ts::take_from_address<NamespaceCapability<Admin>>(scenario, ALICE);
    namespace::mint_capability_readwrite(&ns, &admin, ALICE, scenario.ctx());
    ts::return_shared(ns);
    ts::return_to_address(ALICE, admin);

    scenario.next_tx(ALICE);
    let mut ns2 = ts::take_shared<MemoryNamespace>(scenario);
    let rw = ts::take_from_address<NamespaceCapability<ReadWrite>>(scenario, ALICE);
    let clk2 = clock::create_for_testing(scenario.ctx());
    trace::open_session(
        &mut ns2,
        &rw,
        string::utf8(b"agent"),
        string::utf8(b"test"),
        string::utf8(b"@onemem/sdk@0.1.0"),
        &clk2,
        scenario.ctx(),
    );
    clock::destroy_for_testing(clk2);
    ts::return_shared(ns2);
    ts::return_to_address(ALICE, rw);
}

/// Off-chain re-computation of `chain_hash(running, content)` = sha256(running || content).
/// Must match the on-chain implementation in trace.move.
fun chain_step(running: vector<u8>, content: vector<u8>): vector<u8> {
    let mut buf = running;
    vector::append(&mut buf, content);
    hash::sha2_256(buf)
}

// === Tests ===

#[test]
fun full_session_merkle_root_matches_offchain_walk() {
    let mut scenario = ts::begin(ALICE);
    setup(&mut scenario);

    scenario.next_tx(ALICE);
    let mut ns = ts::take_shared<MemoryNamespace>(&scenario);
    let rw = ts::take_from_address<NamespaceCapability<ReadWrite>>(&scenario, ALICE);
    let mut session = ts::take_shared<TraceSession>(&scenario);

    let clk = clock::create_for_testing(scenario.ctx());

    // Emit 3 calls; capture their content_hashes via the test-only accessor.
    let call_a = trace::emit_call(
        &mut session, &ns, &rw, option::none(),
        string::utf8(b"A"), string::utf8(b"x"),
        string::utf8(b"blob:A"), vector[1u8],
        option::none(), &clk, scenario.ctx(),
    );
    let hash_a = trace::call_content_hash_for_testing(&session, call_a);

    let call_b = trace::emit_call(
        &mut session, &ns, &rw, option::some(call_a),
        string::utf8(b"B"), string::utf8(b"x"),
        string::utf8(b"blob:B"), vector[2u8],
        option::none(), &clk, scenario.ctx(),
    );
    let hash_b = trace::call_content_hash_for_testing(&session, call_b);

    let call_c = trace::emit_call(
        &mut session, &ns, &rw, option::some(call_b),
        string::utf8(b"C"), string::utf8(b"x"),
        string::utf8(b"blob:C"), vector[3u8],
        option::none(), &clk, scenario.ctx(),
    );
    let hash_c = trace::call_content_hash_for_testing(&session, call_c);

    // Walk the chain off-chain starting from zero root.
    let zero_root = trace::zero_hash_for_testing();
    let after_a = chain_step(zero_root, hash_a);
    let after_b = chain_step(after_a, hash_b);
    let after_c = chain_step(after_b, hash_c);

    assert!(*trace::merkle_root(&session) == after_c, 1);
    assert!(trace::call_count(&session) == 3, 2);

    // Close + assert root locked
    trace::close_session(&mut session, &ns, &rw, trace::session_status_completed(), &clk, scenario.ctx());
    assert!(trace::status(&session) == trace::session_status_completed(), 3);
    assert!(*trace::merkle_root(&session) == after_c, 4);
    assert!(option::is_some(trace::ended_at(&session)), 5);

    clock::destroy_for_testing(clk);
    ts::return_shared(session);
    ts::return_shared(ns);
    ts::return_to_address(ALICE, rw);
    scenario.end();
}

#[test]
fun tampering_input_hash_breaks_offchain_reconstruction() {
    let mut scenario = ts::begin(ALICE);
    setup(&mut scenario);

    scenario.next_tx(ALICE);
    let mut ns = ts::take_shared<MemoryNamespace>(&scenario);
    let rw = ts::take_from_address<NamespaceCapability<ReadWrite>>(&scenario, ALICE);
    let mut session = ts::take_shared<TraceSession>(&scenario);

    let clk = clock::create_for_testing(scenario.ctx());

    let call_a = trace::emit_call(
        &mut session, &ns, &rw, option::none(),
        string::utf8(b"A"), string::utf8(b"x"),
        string::utf8(b"blob:A"), vector[1u8],
        option::none(), &clk, scenario.ctx(),
    );
    let hash_a = trace::call_content_hash_for_testing(&session, call_a);

    // Walk off-chain with a FORGED hash (replace hash_a with a different value).
    let zero_root = trace::zero_hash_for_testing();
    let forged_hash = vector[0xFFu8];
    let walked_with_real = chain_step(zero_root, hash_a);
    let walked_with_forged = chain_step(zero_root, forged_hash);

    assert!(walked_with_real != walked_with_forged, 1);
    assert!(*trace::merkle_root(&session) == walked_with_real, 2);
    assert!(*trace::merkle_root(&session) != walked_with_forged, 3);

    clock::destroy_for_testing(clk);
    ts::return_shared(session);
    ts::return_shared(ns);
    ts::return_to_address(ALICE, rw);
    scenario.end();
}
