// Compatibility tests for legacy trace close ABI.

#[test_only]
module onemem::trace_compat_tests;

use std::string;
use sui::clock;
use sui::object;
use sui::test_scenario as ts;
use onemem::namespace::{Self, MemoryNamespace, NamespaceCapability, Admin, ReadWrite};
use onemem::registry::{Self, OneMemRegistry};
use onemem::trace::{Self, TraceSession};

const ALICE: address = @0xA11CE;
const KIND_USER: u8 = 0;

fun setup(scenario: &mut ts::Scenario) {
    registry::init_for_testing(scenario.ctx());
    scenario.next_tx(ALICE);
    let mut reg = ts::take_shared<OneMemRegistry>(scenario);
    let clk = clock::create_for_testing(scenario.ctx());
    namespace::create(&mut reg, string::utf8(b"compat-ns"), KIND_USER, object::id_from_address(@0xFEE7), &clk, scenario.ctx());
    clock::destroy_for_testing(clk);
    ts::return_shared(reg);

    scenario.next_tx(ALICE);
    let ns = ts::take_shared<MemoryNamespace>(scenario);
    let admin = ts::take_from_address<NamespaceCapability<Admin>>(scenario, ALICE);
    namespace::mint_capability_readwrite(&ns, &admin, ALICE, scenario.ctx());
    ts::return_to_address(ALICE, admin);
    ts::return_shared(ns);

    scenario.next_tx(ALICE);
    let mut ns = ts::take_shared<MemoryNamespace>(scenario);
    let rw = ts::take_from_address<NamespaceCapability<ReadWrite>>(scenario, ALICE);
    let clk2 = clock::create_for_testing(scenario.ctx());
    trace::open_session(&mut ns, &rw, string::utf8(b"agent"), string::utf8(b"test"), string::utf8(b"test-sdk"), &clk2, scenario.ctx());
    clock::destroy_for_testing(clk2);
    ts::return_to_address(ALICE, rw);
    ts::return_shared(ns);
}

#[test, expected_failure(abort_code = onemem::trace::ENamespaceRequiredForClose)]
fun legacy_close_call_requires_namespace_aware_function() {
    let mut scenario = ts::begin(ALICE);
    setup(&mut scenario);
    scenario.next_tx(ALICE);
    let mut session = ts::take_shared<TraceSession>(&scenario);
    let rw = ts::take_from_address<NamespaceCapability<ReadWrite>>(&scenario, ALICE);
    let clk = clock::create_for_testing(scenario.ctx());
    trace::close_call(
        &mut session,
        &rw,
        object::id_from_address(@0xCA11),
        string::utf8(b"walrus:out"),
        vector[1u8],
        trace::call_status_success(),
        &clk,
        scenario.ctx(),
    );
    abort 0
}

#[test, expected_failure(abort_code = onemem::trace::ENamespaceRequiredForClose)]
fun legacy_close_session_requires_namespace_aware_function() {
    let mut scenario = ts::begin(ALICE);
    setup(&mut scenario);
    scenario.next_tx(ALICE);
    let mut session = ts::take_shared<TraceSession>(&scenario);
    let rw = ts::take_from_address<NamespaceCapability<ReadWrite>>(&scenario, ALICE);
    let clk = clock::create_for_testing(scenario.ctx());
    trace::close_session(&mut session, &rw, trace::session_status_completed(), &clk, scenario.ctx());
    abort 0
}
