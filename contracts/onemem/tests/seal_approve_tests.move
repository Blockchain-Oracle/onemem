// Tests for onemem::seal_policy::seal_approve (Epic 5 Story 5.1).
// Per docs/05-our-architecture/01-protocol/access-control-and-sharing.md
// + docs/01-sui-ecosystem/seal.md.
//
// Scope:
//   - Any cap KIND (RO / RW / Admin) bound to the namespace succeeds (no abort)
//   - Cap bound to a DIFFERENT namespace → aborts EUnauthorized
//   - Deactivated namespace → aborts ENamespaceInactive
//
// Story 5.2 (Walrus blob commitment binding) is deferred to Pillar 2 SDK
// integration tests — it requires a real Walrus blob round-trip and is
// out of scope for Move-only tests.

#[test_only]
module onemem::seal_approve_tests;

use std::string;
use sui::clock;
use sui::object;
use sui::test_scenario as ts;
use onemem::namespace::{Self, MemoryNamespace, NamespaceCapability, Admin, ReadOnly, ReadWrite};
use onemem::registry::{Self, OneMemRegistry};
use onemem::seal_policy;

const ALICE: address = @0xA11CE;
const BOB: address = @0xB0B;
const KIND_USER: u8 = 0;

fun fresh_seal_pkg_id(): ID { object::id_from_address(@0xFEE7) }

/// Bootstrap: registry initialized, Alice creates a namespace + holds Admin cap.
/// Caller takes the shared namespace + cap in the next tx.
fun bootstrap_alice_ns(scenario: &mut ts::Scenario, name_bytes: vector<u8>) {
    registry::init_for_testing(scenario.ctx());
    scenario.next_tx(ALICE);
    let mut reg = ts::take_shared<OneMemRegistry>(scenario);
    let clk = clock::create_for_testing(scenario.ctx());
    namespace::create(
        &mut reg,
        string::utf8(name_bytes),
        KIND_USER,
        fresh_seal_pkg_id(),
        &clk,
        scenario.ctx(),
    );
    clock::destroy_for_testing(clk);
    ts::return_shared(reg);
}

// === Tests ===

#[test]
fun seal_approve_with_admin_cap_succeeds() {
    let mut scenario = ts::begin(ALICE);
    bootstrap_alice_ns(&mut scenario, b"ns");

    scenario.next_tx(ALICE);
    let ns = ts::take_shared<MemoryNamespace>(&scenario);
    let admin = ts::take_from_address<NamespaceCapability<Admin>>(&scenario, ALICE);

    seal_policy::seal_approve(
        vector[0u8, 1, 2],  // opaque Seal blob id (unused at v0.1)
        &ns,
        &admin,
        scenario.ctx(),
    );

    ts::return_shared(ns);
    ts::return_to_address(ALICE, admin);
    scenario.end();
}

#[test]
fun seal_approve_with_ro_cap_succeeds() {
    let mut scenario = ts::begin(ALICE);
    bootstrap_alice_ns(&mut scenario, b"ns");

    scenario.next_tx(ALICE);
    let ns = ts::take_shared<MemoryNamespace>(&scenario);
    let admin = ts::take_from_address<NamespaceCapability<Admin>>(&scenario, ALICE);
    namespace::mint_capability_readonly(&ns, &admin, BOB, scenario.ctx());

    scenario.next_tx(BOB);
    let ro = ts::take_from_address<NamespaceCapability<ReadOnly>>(&scenario, BOB);
    seal_policy::seal_approve(vector[0u8], &ns, &ro, scenario.ctx());

    ts::return_to_address(BOB, ro);
    ts::return_to_address(ALICE, admin);
    ts::return_shared(ns);
    scenario.end();
}

#[test]
fun seal_approve_with_rw_cap_succeeds() {
    let mut scenario = ts::begin(ALICE);
    bootstrap_alice_ns(&mut scenario, b"ns");

    scenario.next_tx(ALICE);
    let ns = ts::take_shared<MemoryNamespace>(&scenario);
    let admin = ts::take_from_address<NamespaceCapability<Admin>>(&scenario, ALICE);
    namespace::mint_capability_readwrite(&ns, &admin, BOB, scenario.ctx());

    scenario.next_tx(BOB);
    let rw = ts::take_from_address<NamespaceCapability<ReadWrite>>(&scenario, BOB);
    seal_policy::seal_approve(vector[0u8], &ns, &rw, scenario.ctx());

    ts::return_to_address(BOB, rw);
    ts::return_to_address(ALICE, admin);
    ts::return_shared(ns);
    scenario.end();
}

#[test, expected_failure(abort_code = onemem::seal_policy::EUnauthorized)]
fun seal_approve_aborts_when_cap_is_for_wrong_namespace() {
    let mut scenario = ts::begin(ALICE);
    registry::init_for_testing(scenario.ctx());

    scenario.next_tx(ALICE);
    let mut reg = ts::take_shared<OneMemRegistry>(&scenario);
    let clk = clock::create_for_testing(scenario.ctx());

    namespace::create(&mut reg, string::utf8(b"ns-one"), KIND_USER, fresh_seal_pkg_id(), &clk, scenario.ctx());
    scenario.next_tx(ALICE);
    let admin_one = ts::take_from_address<NamespaceCapability<Admin>>(&scenario, ALICE);

    namespace::create(&mut reg, string::utf8(b"ns-two"), KIND_USER, fresh_seal_pkg_id(), &clk, scenario.ctx());
    scenario.next_tx(ALICE);
    let ns_two = ts::take_shared<MemoryNamespace>(&scenario);

    // Approval against ns_two using ns_one's cap → abort EUnauthorized.
    seal_policy::seal_approve(vector[0u8], &ns_two, &admin_one, scenario.ctx());

    abort 0
}

#[test, expected_failure(abort_code = onemem::seal_policy::ENamespaceInactive)]
fun seal_approve_aborts_when_namespace_inactive() {
    let mut scenario = ts::begin(ALICE);
    bootstrap_alice_ns(&mut scenario, b"ns");

    scenario.next_tx(ALICE);
    let mut ns = ts::take_shared<MemoryNamespace>(&scenario);
    let admin = ts::take_from_address<NamespaceCapability<Admin>>(&scenario, ALICE);

    namespace::deactivate(&mut ns, &admin);
    seal_policy::seal_approve(vector[0u8], &ns, &admin, scenario.ctx());

    abort 0
}
