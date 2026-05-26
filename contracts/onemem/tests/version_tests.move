// Tests for onemem::version — the version-as-dynamic-field upgrade pattern helpers.
// Per docs/05-our-architecture/01-protocol/upgrade-strategy.md.
//
// What we assert:
//   - add_initial_version + current_version round-trip
//   - assert_version_matches succeeds when versions equal
//   - assert_version_matches aborts EVersionMismatch when versions differ
//   - bump_version updates the stored version atomically
//
// Pattern lifted from MemWal's account.move tests.

#[test_only]
module onemem::version_tests;

use sui::object;
use sui::test_scenario as ts;
use onemem::version;

// === Test helpers ===

public struct TestObj has key {
    id: UID,
}

const TEST_USER: address = @0xCAFE;

// === Tests ===

#[test]
fun add_and_read_initial_version_round_trips() {
    let mut scenario = ts::begin(TEST_USER);
    let ctx = scenario.ctx();
    let mut obj = TestObj { id: object::new(ctx) };

    version::add_initial_version(&mut obj.id, 1);
    assert!(version::current_version(&obj.id) == 1, 99);

    let TestObj { id } = obj;
    id.delete();
    scenario.end();
}

#[test]
fun assert_version_matches_succeeds_when_equal() {
    let mut scenario = ts::begin(TEST_USER);
    let ctx = scenario.ctx();
    let mut obj = TestObj { id: object::new(ctx) };

    version::add_initial_version(&mut obj.id, 1);
    version::assert_version_matches(&obj.id, 1);  // does not abort

    let TestObj { id } = obj;
    id.delete();
    scenario.end();
}

#[test, expected_failure(abort_code = onemem::version::EVersionMismatch)]
fun assert_version_matches_aborts_when_different() {
    let mut scenario = ts::begin(TEST_USER);
    let ctx = scenario.ctx();
    let mut obj = TestObj { id: object::new(ctx) };

    version::add_initial_version(&mut obj.id, 1);
    version::assert_version_matches(&obj.id, 2);  // expects 2, stored is 1 → abort

    abort 0  // unreachable
}

#[test]
fun bump_version_updates_field() {
    let mut scenario = ts::begin(TEST_USER);
    let ctx = scenario.ctx();
    let mut obj = TestObj { id: object::new(ctx) };

    version::add_initial_version(&mut obj.id, 1);
    version::bump_version(&mut obj.id, 2);
    assert!(version::current_version(&obj.id) == 2, 99);

    let TestObj { id } = obj;
    id.delete();
    scenario.end();
}
