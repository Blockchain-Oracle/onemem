// Integration tests that span multiple modules (Epic 6).
//
// Story 6.3 specifically: cross-runtime trace composition.
// Two TraceSessions in the SAME namespace, where the second session's first
// ActionCall references the first session's last ActionCall via parent_call_id.
// Off-chain walkers (the dashboard `/verify/[session_id]` page + the SDK's
// `traces.list` API) can stitch the two sessions into one logical operation.
//
// Other integration scenarios from epics.md (6.1 happy path, 6.2 cap
// transfer, 6.4 tamper detection) are covered by the per-module tests:
//   - 6.1 → merkle_chain_tests::full_session_merkle_root_matches_offchain_walk
//   - 6.2 → capability_transfer_tests + namespace_tests (and Move's phantom
//     type system COMPILE-TIME-rejects passing a ReadOnly cap where
//     ReadWrite is required — there's no runtime test to write for that)
//   - 6.4 → merkle_chain_tests::tampering_input_hash_breaks_offchain_reconstruction

#[test_only]
module onemem::integration_tests;

use std::option;
use std::string;
use sui::clock;
use sui::object;
use sui::test_scenario as ts;
use onemem::namespace::{Self, MemoryNamespace, NamespaceCapability, Admin, ReadWrite};
use onemem::registry::{Self, OneMemRegistry};
use onemem::trace::{Self, TraceSession};

const ALICE: address = @0xA11CE;
const KIND_USER: u8 = 0;

fun fresh_seal_pkg_id(): ID { object::id_from_address(@0xFEE7) }

#[test]
fun two_sessions_in_same_namespace_stitch_via_parent_call_id() {
    let mut scenario = ts::begin(ALICE);

    // Bootstrap: registry + namespace + RW cap for Alice.
    registry::init_for_testing(scenario.ctx());
    scenario.next_tx(ALICE);
    let mut reg = ts::take_shared<OneMemRegistry>(&scenario);
    let clk = clock::create_for_testing(scenario.ctx());
    namespace::create(&mut reg, string::utf8(b"shared-ns"), KIND_USER, fresh_seal_pkg_id(), &clk, scenario.ctx());
    ts::return_shared(reg);

    scenario.next_tx(ALICE);
    let mut ns = ts::take_shared<MemoryNamespace>(&scenario);
    let admin = ts::take_from_address<NamespaceCapability<Admin>>(&scenario, ALICE);
    namespace::mint_capability_readwrite(&ns, &admin, ALICE, scenario.ctx());

    scenario.next_tx(ALICE);
    let rw = ts::take_from_address<NamespaceCapability<ReadWrite>>(&scenario, ALICE);

    // === Session A (e.g., Claude Code agent) ===
    trace::open_session(
        &mut ns, &rw,
        string::utf8(b"claude-code-1.2.3"),
        string::utf8(b"test"),
        string::utf8(b"@onemem/sdk-ts@0.1.0"),
        &clk, scenario.ctx(),
    );

    scenario.next_tx(ALICE);
    let mut session_a = ts::take_shared<TraceSession>(&scenario);
    let call_a1 = trace::emit_call(
        &mut session_a, &ns, &rw, option::none(),
        string::utf8(b"plan"), string::utf8(b"hermes"),
        string::utf8(b"blob:A1"), vector[1u8],
        option::none(), &clk, scenario.ctx(),
    );

    // === Session B (e.g., Hermes runtime spawned by Claude Code) ===
    // Same namespace, different agent_id. First call references A1 as parent.
    trace::open_session(
        &mut ns, &rw,
        string::utf8(b"hermes-0.14"),
        string::utf8(b"test"),
        string::utf8(b"@onemem/sdk-py@0.1.0"),
        &clk, scenario.ctx(),
    );

    scenario.next_tx(ALICE);
    // We now have two shared TraceSessions in the inventory. test_scenario
    // returns them in LIFO/age order; session_a is already taken so the
    // next take_shared returns session_b.
    let mut session_b = ts::take_shared<TraceSession>(&scenario);
    assert!(trace::namespace_id(&session_b) == object::id(&ns), 1);
    assert!(object::id(&session_b) != object::id(&session_a), 2);

    let _call_b1 = trace::emit_call(
        &mut session_b, &ns, &rw, option::some(call_a1),  // ← parent in session A!
        string::utf8(b"execute"), string::utf8(b"hermes-builtin"),
        string::utf8(b"blob:B1"), vector[2u8],
        option::none(), &clk, scenario.ctx(),
    );

    // Both sessions are independently chainable AND both reference the same
    // namespace_id — off-chain walkers stitch via parent_call_id.
    assert!(trace::call_count(&session_a) == 1, 3);
    assert!(trace::call_count(&session_b) == 1, 4);
    assert!(trace::namespace_id(&session_a) == trace::namespace_id(&session_b), 5);

    clock::destroy_for_testing(clk);
    ts::return_to_address(ALICE, rw);
    ts::return_to_address(ALICE, admin);
    ts::return_shared(session_a);
    ts::return_shared(session_b);
    ts::return_shared(ns);
    scenario.end();
}
