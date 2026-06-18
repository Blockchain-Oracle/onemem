// Tests for Admin-gated namespace capability revocation.
//
// Admin revoke marks a cap ID under the namespace; it does not delete the
// holder-owned capability object. Authorization gates must reject the cap after
// that marker exists.

#[test_only]
module onemem::admin_revoke_tests;

use std::string;
use sui::clock;
use sui::object;
use sui::test_scenario as ts;
use onemem::namespace::{Self, MemoryNamespace, NamespaceCapability, Admin, ReadOnly, ReadWrite};
use onemem::registry::{Self, OneMemRegistry};
use onemem::seal_policy;
use onemem::trace::{Self, TraceSession};

const ALICE: address = @0xA11CE;
const BOB: address = @0xB0B;
const KIND_USER: u8 = 0;

fun fresh_seal_pkg_id(): ID { object::id_from_address(@0xFEE7) }

fun bootstrap(scenario: &mut ts::Scenario) {
    registry::init_for_testing(scenario.ctx());
    scenario.next_tx(ALICE);
    let mut reg = ts::take_shared<OneMemRegistry>(scenario);
    let clk = clock::create_for_testing(scenario.ctx());
    namespace::create(
        &mut reg,
        string::utf8(b"admin-revoke-ns"),
        KIND_USER,
        fresh_seal_pkg_id(),
        &clk,
        scenario.ctx(),
    );
    clock::destroy_for_testing(clk);
    ts::return_shared(reg);
}

fun mint_rw_to_bob(scenario: &mut ts::Scenario): ID {
    scenario.next_tx(ALICE);
    let ns = ts::take_shared<MemoryNamespace>(scenario);
    let admin = ts::take_from_address<NamespaceCapability<Admin>>(scenario, ALICE);
    namespace::mint_capability_readwrite(&ns, &admin, BOB, scenario.ctx());
    ts::return_to_address(ALICE, admin);
    ts::return_shared(ns);

    scenario.next_tx(BOB);
    let cap = ts::take_from_address<NamespaceCapability<ReadWrite>>(scenario, BOB);
    let cap_id = object::id(&cap);
    ts::return_to_address(BOB, cap);
    cap_id
}

fun mint_ro_to_bob(scenario: &mut ts::Scenario): ID {
    scenario.next_tx(ALICE);
    let ns = ts::take_shared<MemoryNamespace>(scenario);
    let admin = ts::take_from_address<NamespaceCapability<Admin>>(scenario, ALICE);
    namespace::mint_capability_readonly(&ns, &admin, BOB, scenario.ctx());
    ts::return_to_address(ALICE, admin);
    ts::return_shared(ns);

    scenario.next_tx(BOB);
    let cap = ts::take_from_address<NamespaceCapability<ReadOnly>>(scenario, BOB);
    let cap_id = object::id(&cap);
    ts::return_to_address(BOB, cap);
    cap_id
}

fun admin_revoke(scenario: &mut ts::Scenario, cap_id: ID) {
    scenario.next_tx(ALICE);
    let mut ns = ts::take_shared<MemoryNamespace>(scenario);
    let admin = ts::take_from_address<NamespaceCapability<Admin>>(scenario, ALICE);
    namespace::admin_revoke_capability(&mut ns, &admin, cap_id);
    ts::return_to_address(ALICE, admin);
    ts::return_shared(ns);
}

#[test]
fun admin_revoke_marks_cap_without_taking_holder_object() {
    let mut scenario = ts::begin(ALICE);
    bootstrap(&mut scenario);
    let cap_id = mint_rw_to_bob(&mut scenario);
    admin_revoke(&mut scenario, cap_id);

    scenario.next_tx(BOB);
    let ns = ts::take_shared<MemoryNamespace>(&scenario);
    let cap = ts::take_from_address<NamespaceCapability<ReadWrite>>(&scenario, BOB);
    assert!(object::id(&cap) == cap_id, 1);
    assert!(namespace::is_capability_revoked(&cap, &ns), 2);

    ts::return_to_address(BOB, cap);
    ts::return_shared(ns);
    scenario.end();
}

#[test, expected_failure(abort_code = onemem::namespace::ECapabilityRevoked)]
fun revoked_rw_cap_cannot_open_session() {
    let mut scenario = ts::begin(ALICE);
    bootstrap(&mut scenario);
    let cap_id = mint_rw_to_bob(&mut scenario);
    admin_revoke(&mut scenario, cap_id);

    scenario.next_tx(BOB);
    let mut ns = ts::take_shared<MemoryNamespace>(&scenario);
    let cap = ts::take_from_address<NamespaceCapability<ReadWrite>>(&scenario, BOB);
    let clk = clock::create_for_testing(scenario.ctx());
    trace::open_session(
        &mut ns,
        &cap,
        string::utf8(b"agent"),
        string::utf8(b"test"),
        string::utf8(b"test-sdk"),
        &clk,
        scenario.ctx(),
    );

    abort 0
}

#[test, expected_failure(abort_code = onemem::namespace::ECapabilityRevoked)]
fun revoked_rw_cap_cannot_close_existing_call() {
    let mut scenario = ts::begin(ALICE);
    bootstrap(&mut scenario);
    let cap_id = mint_rw_to_bob(&mut scenario);

    scenario.next_tx(BOB);
    let mut ns = ts::take_shared<MemoryNamespace>(&scenario);
    let cap = ts::take_from_address<NamespaceCapability<ReadWrite>>(&scenario, BOB);
    let clk = clock::create_for_testing(scenario.ctx());
    trace::open_session(
        &mut ns,
        &cap,
        string::utf8(b"agent"),
        string::utf8(b"test"),
        string::utf8(b"test-sdk"),
        &clk,
        scenario.ctx(),
    );
    clock::destroy_for_testing(clk);
    ts::return_to_address(BOB, cap);
    ts::return_shared(ns);

    scenario.next_tx(BOB);
    let ns = ts::take_shared<MemoryNamespace>(&scenario);
    let mut session = ts::take_shared<TraceSession>(&scenario);
    let cap = ts::take_from_address<NamespaceCapability<ReadWrite>>(&scenario, BOB);
    let clk = clock::create_for_testing(scenario.ctx());
    let call_id = trace::emit_call(
        &mut session,
        &ns,
        &cap,
        option::none(),
        string::utf8(b"tool"),
        string::utf8(b"runtime"),
        string::utf8(b"walrus:in"),
        vector[1u8],
        option::none(),
        &clk,
        scenario.ctx(),
    );
    clock::destroy_for_testing(clk);
    ts::return_to_address(BOB, cap);
    ts::return_shared(session);
    ts::return_shared(ns);

    admin_revoke(&mut scenario, cap_id);

    scenario.next_tx(BOB);
    let ns = ts::take_shared<MemoryNamespace>(&scenario);
    let mut session = ts::take_shared<TraceSession>(&scenario);
    let cap = ts::take_from_address<NamespaceCapability<ReadWrite>>(&scenario, BOB);
    let clk = clock::create_for_testing(scenario.ctx());
    trace::close_call(
        &mut session,
        &ns,
        &cap,
        call_id,
        string::utf8(b"walrus:out"),
        vector[2u8],
        trace::call_status_success(),
        &clk,
        scenario.ctx(),
    );

    abort 0
}

#[test, expected_failure(abort_code = onemem::namespace::ECapabilityRevoked)]
fun revoked_ro_cap_cannot_approve_seal_decrypt() {
    let mut scenario = ts::begin(ALICE);
    bootstrap(&mut scenario);
    let cap_id = mint_ro_to_bob(&mut scenario);
    admin_revoke(&mut scenario, cap_id);

    scenario.next_tx(BOB);
    let ns = ts::take_shared<MemoryNamespace>(&scenario);
    let cap = ts::take_from_address<NamespaceCapability<ReadOnly>>(&scenario, BOB);
    seal_policy::seal_approve(vector[0u8], &ns, &cap, scenario.ctx());

    abort 0
}
