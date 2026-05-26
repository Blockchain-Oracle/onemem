// Tests for capability mint / transfer / self-revoke flows.
// Per docs/05-our-architecture/01-protocol/access-control-and-sharing.md.
//
// Scope (Epic 2 Story 2.3):
//   - Alice (namespace owner + admin) mints RW cap for Bob; Bob receives + holds
//   - Alice mints RO cap for Carol; Carol receives + holds
//   - Bob self-revokes his own cap (burn — only the cap holder can delete it
//     on Sui, since you can only delete objects you own)
//   - Multiple kinds for different recipients in one session
//
// Cross-namespace cap-misuse abort lives in namespace_tests.move
// (assert_cap_for_namespace check).

#[test_only]
module onemem::capability_transfer_tests;

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
const CAROL: address = @0xCA40;

const KIND_USER: u8 = 0;

// === Helpers ===

fun fresh_seal_pkg_id(): ID {
    object::id_from_address(@0xFEE7)
}

fun bootstrap(scenario: &mut ts::Scenario) {
    registry::init_for_testing(scenario.ctx());
    scenario.next_tx(ALICE);
    let mut reg = ts::take_shared<OneMemRegistry>(scenario);
    let clk = clock::create_for_testing(scenario.ctx());
    namespace::create(
        &mut reg,
        string::utf8(b"shared-ns"),
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
fun alice_mints_rw_cap_then_bob_holds_it() {
    let mut scenario = ts::begin(DEPLOYER);
    bootstrap(&mut scenario);

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
fun alice_mints_ro_cap_then_carol_holds_it() {
    let mut scenario = ts::begin(DEPLOYER);
    bootstrap(&mut scenario);

    scenario.next_tx(ALICE);
    let ns = ts::take_shared<MemoryNamespace>(&scenario);
    let admin = ts::take_from_address<NamespaceCapability<Admin>>(&scenario, ALICE);

    namespace::mint_capability_readonly(&ns, &admin, CAROL, scenario.ctx());

    scenario.next_tx(CAROL);
    let carol_cap = ts::take_from_address<NamespaceCapability<ReadOnly>>(&scenario, CAROL);
    assert!(namespace::cap_for_namespace(&carol_cap) == object::id(&ns), 1);

    ts::return_to_address(CAROL, carol_cap);
    ts::return_to_address(ALICE, admin);
    ts::return_shared(ns);
    scenario.end();
}

#[test]
fun bob_self_revokes_his_rw_cap() {
    let mut scenario = ts::begin(DEPLOYER);
    bootstrap(&mut scenario);

    scenario.next_tx(ALICE);
    let ns = ts::take_shared<MemoryNamespace>(&scenario);
    let admin = ts::take_from_address<NamespaceCapability<Admin>>(&scenario, ALICE);
    namespace::mint_capability_readwrite(&ns, &admin, BOB, scenario.ctx());

    // Bob receives + voluntarily burns his cap.
    scenario.next_tx(BOB);
    let bob_cap = ts::take_from_address<NamespaceCapability<ReadWrite>>(&scenario, BOB);
    namespace::revoke_capability(bob_cap);

    // After revoke, Bob's address holds no NamespaceCapability<ReadWrite>.
    scenario.next_tx(BOB);
    assert!(!ts::has_most_recent_for_address<NamespaceCapability<ReadWrite>>(BOB), 1);

    ts::return_to_address(ALICE, admin);
    ts::return_shared(ns);
    scenario.end();
}

#[test]
fun alice_mints_multiple_kinds_for_different_recipients() {
    let mut scenario = ts::begin(DEPLOYER);
    bootstrap(&mut scenario);

    scenario.next_tx(ALICE);
    let ns = ts::take_shared<MemoryNamespace>(&scenario);
    let admin = ts::take_from_address<NamespaceCapability<Admin>>(&scenario, ALICE);

    namespace::mint_capability_readwrite(&ns, &admin, BOB, scenario.ctx());
    namespace::mint_capability_readonly(&ns, &admin, CAROL, scenario.ctx());

    scenario.next_tx(BOB);
    assert!(ts::has_most_recent_for_address<NamespaceCapability<ReadWrite>>(BOB), 1);
    scenario.next_tx(CAROL);
    assert!(ts::has_most_recent_for_address<NamespaceCapability<ReadOnly>>(CAROL), 2);

    ts::return_to_address(ALICE, admin);
    ts::return_shared(ns);
    scenario.end();
}
