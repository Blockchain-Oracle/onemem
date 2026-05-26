// Tests for onemem::namespace — MemoryNamespace + NamespaceCapability<KIND>.
// Per docs/05-our-architecture/01-protocol/data-model.md (MemoryNamespace section)
// + access-control-and-sharing.md (capability pattern).
//
// Scope (Epic 2 Stories 2.1 + 2.2):
//   - create mints a shared MemoryNamespace + transfers Admin cap to creator
//   - struct fields populated correctly (owner, name, kind, active, version)
//   - mint_capability_readwrite + mint_capability_readonly require Admin cap
//   - deactivate / reactivate round-trip
//   - assert_cap_for_namespace aborts on cap-namespace mismatch
//   - create aborts on invalid namespace_kind
//
// Capability transfer/revoke flows are in capability_transfer_tests.move (Story 2.3).

#[test_only]
module onemem::namespace_tests;

use std::string;
use sui::clock;
use sui::object;
use sui::test_scenario as ts;
use onemem::namespace::{Self, MemoryNamespace, NamespaceCapability, Admin, ReadWrite, ReadOnly};
use onemem::registry::{Self, OneMemRegistry};

// === Constants ===

const DEPLOYER: address = @0xCAFE;
const ALICE: address = @0xA11CE;
const BOB: address = @0xB0B;

const KIND_USER: u8 = 0;
const INVALID_KIND: u8 = 99;

// === Helpers ===

fun fresh_seal_pkg_id(): ID {
    object::id_from_address(@0xFEE7)
}

/// Boilerplate: initialize registry, create a namespace owned by ALICE.
/// After this returns, the next tx can `take_shared<MemoryNamespace>` +
/// `take_from_address<NamespaceCapability<Admin>>(scenario, ALICE)`.
fun bootstrap_with_alice_namespace(scenario: &mut ts::Scenario, name_bytes: vector<u8>) {
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
fun create_namespace_mints_shared_namespace_and_admin_cap_for_creator() {
    let mut scenario = ts::begin(DEPLOYER);
    bootstrap_with_alice_namespace(&mut scenario, b"alices-memory");

    scenario.next_tx(ALICE);
    let ns = ts::take_shared<MemoryNamespace>(&scenario);
    let admin_cap = ts::take_from_address<NamespaceCapability<Admin>>(&scenario, ALICE);

    assert!(namespace::owner(&ns) == ALICE, 1);
    assert!(*namespace::name(&ns) == string::utf8(b"alices-memory"), 2);
    assert!(namespace::namespace_kind(&ns) == KIND_USER, 3);
    assert!(namespace::is_active(&ns), 4);
    assert!(namespace::cap_for_namespace(&admin_cap) == object::id(&ns), 5);

    ts::return_shared(ns);
    ts::return_to_address(ALICE, admin_cap);
    scenario.end();
}

#[test]
fun admin_can_mint_rw_cap_for_another_address() {
    let mut scenario = ts::begin(DEPLOYER);
    bootstrap_with_alice_namespace(&mut scenario, b"team-ns");

    scenario.next_tx(ALICE);
    let ns = ts::take_shared<MemoryNamespace>(&scenario);
    let admin = ts::take_from_address<NamespaceCapability<Admin>>(&scenario, ALICE);

    namespace::mint_capability_readwrite(&ns, &admin, BOB, scenario.ctx());

    scenario.next_tx(BOB);
    let bob_cap = ts::take_from_address<NamespaceCapability<ReadWrite>>(&scenario, BOB);
    assert!(namespace::cap_for_namespace(&bob_cap) == object::id(&ns), 1);

    ts::return_to_address(BOB, bob_cap);
    ts::return_to_address(ALICE, admin);
    ts::return_shared(ns);
    scenario.end();
}

#[test]
fun admin_can_mint_ro_cap_for_another_address() {
    let mut scenario = ts::begin(DEPLOYER);
    bootstrap_with_alice_namespace(&mut scenario, b"team-ns");

    scenario.next_tx(ALICE);
    let ns = ts::take_shared<MemoryNamespace>(&scenario);
    let admin = ts::take_from_address<NamespaceCapability<Admin>>(&scenario, ALICE);

    namespace::mint_capability_readonly(&ns, &admin, BOB, scenario.ctx());

    scenario.next_tx(BOB);
    let bob_cap = ts::take_from_address<NamespaceCapability<ReadOnly>>(&scenario, BOB);
    assert!(namespace::cap_for_namespace(&bob_cap) == object::id(&ns), 1);

    ts::return_to_address(BOB, bob_cap);
    ts::return_to_address(ALICE, admin);
    ts::return_shared(ns);
    scenario.end();
}

#[test]
fun deactivate_then_reactivate_round_trips() {
    let mut scenario = ts::begin(DEPLOYER);
    bootstrap_with_alice_namespace(&mut scenario, b"toggle-ns");

    scenario.next_tx(ALICE);
    let mut ns = ts::take_shared<MemoryNamespace>(&scenario);
    let admin = ts::take_from_address<NamespaceCapability<Admin>>(&scenario, ALICE);

    assert!(namespace::is_active(&ns), 1);

    namespace::deactivate(&mut ns, &admin);
    assert!(!namespace::is_active(&ns), 2);

    namespace::reactivate(&mut ns, &admin);
    assert!(namespace::is_active(&ns), 3);

    ts::return_to_address(ALICE, admin);
    ts::return_shared(ns);
    scenario.end();
}

#[test, expected_failure(abort_code = onemem::namespace::EWrongNamespace)]
fun assert_cap_for_namespace_aborts_when_cap_is_for_different_namespace() {
    let mut scenario = ts::begin(DEPLOYER);
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

    // Cross-namespace cap use → abort EWrongNamespace.
    namespace::mint_capability_readwrite(&ns_two, &admin_one, BOB, scenario.ctx());

    abort 0
}

#[test, expected_failure(abort_code = onemem::namespace::EBadNamespaceKind)]
fun create_aborts_on_invalid_kind() {
    let mut scenario = ts::begin(DEPLOYER);
    registry::init_for_testing(scenario.ctx());

    scenario.next_tx(ALICE);
    let mut reg = ts::take_shared<OneMemRegistry>(&scenario);
    let clk = clock::create_for_testing(scenario.ctx());

    namespace::create(
        &mut reg,
        string::utf8(b"bad-kind"),
        INVALID_KIND,
        fresh_seal_pkg_id(),
        &clk,
        scenario.ctx(),
    );

    abort 0
}
