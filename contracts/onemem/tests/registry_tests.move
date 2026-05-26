// Tests for onemem::registry — the global dedup index + package admin cap.
// Per docs/05-our-architecture/01-protocol/move-contract.md (registry section).
//
// What we assert:
//   - init_for_testing creates a shared OneMemRegistry + transfers RegistryAdminCap
//   - lookup returns None for unregistered (owner, name)
//   - register then lookup round-trips
//   - duplicate register aborts EAlreadyRegistered
//   - bump_package_version updates the version dynamic field (admin-gated by cap-in-args)

#[test_only]
module onemem::registry_tests;

use std::option;
use std::string;
use sui::object;
use sui::test_scenario as ts;
use onemem::registry::{Self, OneMemRegistry, RegistryAdminCap};
use onemem::version;

const DEPLOYER: address = @0xCAFE;
const ALICE: address = @0xA11CE;
const BOB: address = @0xB0B;

#[test]
fun init_for_testing_creates_shared_registry_and_admin_cap() {
    let mut scenario = ts::begin(DEPLOYER);
    registry::init_for_testing(scenario.ctx());

    scenario.next_tx(DEPLOYER);
    let reg = ts::take_shared<OneMemRegistry>(&scenario);
    let admin = ts::take_from_address<RegistryAdminCap>(&scenario, DEPLOYER);

    // Initial version dynamic field should be 1 (the module VERSION).
    let v = version::current_version(registry::id_for_testing(&reg));
    assert!(v == 1, 99);

    ts::return_shared(reg);
    ts::return_to_address(DEPLOYER, admin);
    scenario.end();
}

#[test]
fun lookup_returns_none_when_unregistered() {
    let mut scenario = ts::begin(DEPLOYER);
    registry::init_for_testing(scenario.ctx());

    scenario.next_tx(DEPLOYER);
    let reg = ts::take_shared<OneMemRegistry>(&scenario);

    let result = registry::lookup(&reg, ALICE, string::utf8(b"never-created"));
    assert!(option::is_none(&result), 99);

    ts::return_shared(reg);
    scenario.end();
}

#[test]
fun register_then_lookup_round_trips() {
    let mut scenario = ts::begin(DEPLOYER);
    registry::init_for_testing(scenario.ctx());

    scenario.next_tx(ALICE);
    let mut reg = ts::take_shared<OneMemRegistry>(&scenario);

    let ns_id = object::id_from_address(@0xDEAD);
    registry::register(&mut reg, ALICE, string::utf8(b"my-ns"), ns_id);

    let result = registry::lookup(&reg, ALICE, string::utf8(b"my-ns"));
    assert!(option::is_some(&result), 99);
    assert!(*option::borrow(&result) == ns_id, 99);

    ts::return_shared(reg);
    scenario.end();
}

#[test, expected_failure(abort_code = onemem::registry::EAlreadyRegistered)]
fun register_aborts_on_duplicate() {
    let mut scenario = ts::begin(DEPLOYER);
    registry::init_for_testing(scenario.ctx());

    scenario.next_tx(ALICE);
    let mut reg = ts::take_shared<OneMemRegistry>(&scenario);

    let ns_id = object::id_from_address(@0xDEAD);
    registry::register(&mut reg, ALICE, string::utf8(b"my-ns"), ns_id);

    // Second register with same (owner, name) → abort.
    let ns_id_2 = object::id_from_address(@0xBEEF);
    registry::register(&mut reg, ALICE, string::utf8(b"my-ns"), ns_id_2);

    abort 0
}

#[test]
fun register_isolates_by_owner() {
    // Same `name` under different `owner` is allowed — keys are (owner, name).
    let mut scenario = ts::begin(DEPLOYER);
    registry::init_for_testing(scenario.ctx());

    scenario.next_tx(ALICE);
    let mut reg = ts::take_shared<OneMemRegistry>(&scenario);

    let alice_ns = object::id_from_address(@0xA1);
    let bob_ns = object::id_from_address(@0xB1);
    registry::register(&mut reg, ALICE, string::utf8(b"shared-name"), alice_ns);
    registry::register(&mut reg, BOB, string::utf8(b"shared-name"), bob_ns);

    let alice_lookup = registry::lookup(&reg, ALICE, string::utf8(b"shared-name"));
    let bob_lookup = registry::lookup(&reg, BOB, string::utf8(b"shared-name"));
    assert!(*option::borrow(&alice_lookup) == alice_ns, 99);
    assert!(*option::borrow(&bob_lookup) == bob_ns, 99);

    ts::return_shared(reg);
    scenario.end();
}

#[test]
fun bump_package_version_updates_dynamic_field() {
    let mut scenario = ts::begin(DEPLOYER);
    registry::init_for_testing(scenario.ctx());

    scenario.next_tx(DEPLOYER);
    let mut reg = ts::take_shared<OneMemRegistry>(&scenario);
    let admin = ts::take_from_address<RegistryAdminCap>(&scenario, DEPLOYER);

    assert!(version::current_version(registry::id_for_testing(&reg)) == 1, 99);
    registry::bump_package_version(&mut reg, &admin, 2);
    assert!(version::current_version(registry::id_for_testing(&reg)) == 2, 99);

    ts::return_shared(reg);
    ts::return_to_address(DEPLOYER, admin);
    scenario.end();
}
