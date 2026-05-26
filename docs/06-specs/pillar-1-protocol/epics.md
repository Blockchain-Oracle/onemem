# Pillar 1 Epics — Move Contract Work Plan

22 stories across 8 epics. Each story is one TDD cycle (failing test → implementation → refactor → security-reviewer pass). Order matters — later stories depend on earlier ones unless noted.

For each story:
- **AC** = acceptance criteria (Move tests assert these)
- **Files** = files to touch
- **Reference** = architecture doc to read first

Stories without explicit "Reference" inherit Pillar 1's [`architecture.md`](./architecture.md) reading list.

---

## Epic 1 — Foundation (Move.toml + version + registry)

Goal: get the package skeleton truly buildable + ready for the rest of the modules to land.

### Story 1.1 — Slim Move.toml + verify build

**AC:** `Move.toml` no longer has the explicit `Sui = { ... }` dependency (per the build NOTE from bootstrap); `sui move build` succeeds with no NOTEs; `sui move test` runs (vacuous — no real tests yet).
**Files:** `contracts/onemem/Move.toml`.

### Story 1.2 — `version.move` with the version-as-dynamic-field helpers

**AC:** `CURRENT_VERSION: u64 = 1`; `current_version()` accessor; `assert_version(obj_version)` aborts with explicit error code on mismatch; helper `set_version_dynamic_field<T: key>(obj, version)` for use by migration entry functions. Tests: version helper round-trips; assert_version aborts on mismatch.
**Files:** `contracts/onemem/sources/version.move`, `contracts/onemem/tests/version_tests.move` (new test file — add to `EXPECTED_TESTS` list in tests/structure.test.ts if applicable).
**Reference:** `docs/05-our-architecture/01-protocol/upgrade-strategy.md`.

### Story 1.3 — `registry.move` global registry object

**AC:** `OneMemRegistry` shared object created on first `init` with admin cap; tracks `package_version: u64`; admin entry function `bump_package_version(registry, new_version, admin_cap)` aborts without admin cap, succeeds with it. Tests: init creates object + admin cap; non-admin bump aborts; admin bump succeeds + emits event.
**Files:** `contracts/onemem/sources/registry.move`, `contracts/onemem/tests/registry_tests.move` (new).
**Reference:** `docs/05-our-architecture/01-protocol/move-contract.md` (registry section).

---

## Epic 2 — Namespaces + capabilities

Goal: ship the access-control primitive every downstream layer composes against.

### Story 2.1 — `MemoryNamespace` struct + `create_namespace` entry

**AC:** `MemoryNamespace` has UID, owner: address, created_at: u64, walrus_root_hash: Option<vector<u8>>, version: dynamic_field; `create_namespace(ctx)` mints + returns `(MemoryNamespace, NamespaceCapability<Admin>)`; namespace shared, Admin cap transferred to creator. Tests: namespace is shared object; admin cap is owned by creator; created_at = tx_context::epoch_timestamp_ms.
**Files:** `contracts/onemem/sources/namespace.move`, `contracts/onemem/tests/namespace_tests.move`.
**Reference:** `docs/05-our-architecture/01-protocol/data-model.md` (MemoryNamespace section).

### Story 2.2 — `NamespaceCapability<phantom KIND>` phantom typing (RO/RW/Admin)

**AC:** Define `ReadOnly`, `ReadWrite`, `Admin` phantom-witness types; `NamespaceCapability<phantom KIND>` struct with namespace_id field; `assert_can_read(cap, namespace)` / `assert_can_write(cap, namespace)` / `assert_admin(cap, namespace)` helpers. Tests: phantom typing compile-time-rejects wrong-kind usage (test via PTB pattern); ID mismatch aborts.
**Files:** `contracts/onemem/sources/namespace.move`, `contracts/onemem/tests/namespace_tests.move`.
**Reference:** `docs/05-our-architecture/01-protocol/access-control-and-sharing.md`.

### Story 2.3 — `mint_capability` / `transfer_capability` / `revoke_capability` entry functions

**AC:** `mint_capability<KIND>(admin_cap, recipient, ctx)` creates cap + transfers to recipient (RW or RO; never Admin via this function); `revoke_capability(admin_cap, cap_id, ctx)` deletes the cap object (caller must own it OR caller is Admin via authenticated wrapper). Tests: 5 scenarios — Alice mints RO for Bob; Bob receives + holds; Alice mints RW for Carol; Alice revokes Bob's RO; mint without admin cap aborts.
**Files:** `contracts/onemem/sources/namespace.move`, `contracts/onemem/tests/capability_transfer_tests.move`.

---

## Epic 3 — Trace + ActionCall + Merkle chain

Goal: the verifiable-trace primitive. THE pillar load-bearing for the demo narrative.

### Story 3.1 — `TraceSession` struct + `open_session` entry function

**AC:** `TraceSession` has UID, namespace_id, agent_id: vector<u8>, environment: vector<u8>, started_at: u64, ended_at: Option<u64>, call_count: u64, last_content_hash: Option<vector<u8>>, merkle_root: Option<vector<u8>>, status: enum (Open/Closed), version: dynamic_field; `open_session(cap_RW, namespace_id, agent_id, env, ctx)` aborts without RW cap, succeeds otherwise + emits `TraceSessionOpened`. Tests: RW cap holder opens session; RO cap holder opens aborts; ID mismatch aborts.
**Files:** `contracts/onemem/sources/trace.move`, `contracts/onemem/tests/trace_tests.move`.
**Reference:** `docs/05-our-architecture/01-protocol/data-model.md` (TraceSession section).

### Story 3.2 — `ActionCall` struct + `emit_call` entry function + Merkle prev_hash linkage

**AC:** `ActionCall` has call_id: vector<u8>, parent_call_id: Option<vector<u8>>, kind: vector<u8> ("tool_call" / "memory_write" / etc.), input_hash: vector<u8> (Walrus blob commitment), output_hash: Option<vector<u8>>, content_hash: vector<u8> (Sha256 of structured payload — formula in `events-and-attestation.md`), prev_hash: Option<vector<u8>>, walrus_blob_id: Option<vector<u8>>, started_at: u64; `emit_call(session, cap_RW, fields, ctx)` aborts without RW cap, computes content_hash, sets prev_hash = session.last_content_hash, updates session.last_content_hash + session.call_count, emits `ActionCallEmitted`. Tests: first call has None prev_hash; second call has prev_hash = first.content_hash; RO cap caller aborts; cap from wrong namespace aborts.
**Files:** `contracts/onemem/sources/trace.move`, `contracts/onemem/tests/trace_tests.move`.
**Reference:** `docs/05-our-architecture/01-protocol/events-and-attestation.md` (chain mechanics).

### Story 3.3 — `close_call` entry function (writes output_hash + emits ActionCallClosed)

**AC:** `close_call(session, call_id, output_hash, cap_RW, ctx)` updates the call's output_hash + emits `ActionCallClosed`; aborts if call_id doesn't exist in session, RW cap missing. Tests: emit then close round-trip; close-without-emit aborts; double-close aborts.
**Files:** `contracts/onemem/sources/trace.move`, `contracts/onemem/tests/trace_tests.move`.

### Story 3.4 — `close_session` entry function + final merkle_root derivation

**AC:** `close_session(session, cap_RW, ctx)` derives `merkle_root` = chain_walk of (content_hash, prev_hash) pairs from emitted events (formula in events-and-attestation.md), writes it to session.merkle_root, sets status = Closed, sets ended_at = epoch_ms, emits `TraceSessionClosed`. Aborts if status already Closed. Tests: open → emit 3 calls → close → assert merkle_root matches off-chain re-computation; double-close aborts; close without RW aborts.
**Files:** `contracts/onemem/sources/trace.move`, `contracts/onemem/tests/merkle_chain_tests.move`.

---

## Epic 4 — Authenticated events

Goal: every state-changing call goes through `event::emit_authenticated` (Walrus track narrative load-bearer).

### Story 4.1 — `events.move` authenticated wrappers

**AC:** Four event types — `ActionCallEmitted { session_id, call_id, parent_call_id, kind, content_hash, prev_hash, walrus_blob_id, started_at }`, `ActionCallClosed { session_id, call_id, output_hash, ended_at }`, `TraceSessionOpened { session_id, namespace_id, agent_id, environment, started_at }`, `TraceSessionClosed { session_id, merkle_root, call_count, ended_at }`. Wrappers `emit_action_call_emitted(...)` etc. call `event::emit_authenticated`. Tests: events are emitted on respective entry functions (test via tx_context); event payloads structurally match expected fields.
**Files:** `contracts/onemem/sources/events.move`, `contracts/onemem/tests/events_tests.move` (new).
**Reference:** `docs/05-our-architecture/01-protocol/events-and-attestation.md` + Sui framework `event::emit_authenticated` docs (resolve via `context7` MCP for the live signature).

---

## Epic 5 — Seal policy

Goal: gate Walrus blob decryption to cap holders.

### Story 5.1 — `seal_policy.move` with `seal_approve` entry function

**AC:** `seal_approve(id: vector<u8>, namespace_id: ID, cap: &NamespaceCapability<KIND>)` returns true iff cap.namespace_id == namespace_id AND KIND is any of ReadOnly/ReadWrite/Admin. The function signature must match Seal SDK's expectations (resolve actual signature via `context7` for `@mysten/seal` docs at implementation time — do not hardcode from memory per non-negotiable #5). Tests: cap holder approved; non-cap-holder aborted; mismatched namespace_id aborted.
**Files:** `contracts/onemem/sources/seal_policy.move`, `contracts/onemem/tests/seal_approve_tests.move`.
**Reference:** `docs/01-sui-ecosystem/seal.md` + `docs/02-inspirations/memwal-incubation/` (their Seal pattern).

### Story 5.2 — Walrus blob commitment binding test

**AC:** Integration test: SDK uploads blob to Walrus → captures blob_id → calls `emit_call` with that blob_id → `seal_approve` for that blob_id succeeds for RW cap holder, fails for non-holder. This test gates Pillar 2 (SDK) starting — SDK code can assume the contract honors the cap.
**Files:** `contracts/onemem/tests/walrus_seal_integration_tests.move` (new) — may need to be partially mocked for `sui move test` (full Walrus integration is in Pillar 2 SDK tests).

---

## Epic 6 — Integration tests (end-to-end Move-level scenarios)

Goal: prove the modules compose correctly. These tests are the spec of "what works."

### Story 6.1 — Happy path: open → 3 calls → close → verify Merkle

**AC:** `test_scenario` with Alice as user; mint namespace; open session; emit 3 calls with varying inputs; close session; assert final merkle_root matches off-chain chain_walk (recomputed in Move using the same helpers).
**Files:** `contracts/onemem/tests/integration_happy_path_tests.move` (new).

### Story 6.2 — Capability transfer: Alice → Bob RO + write attempt aborts

**AC:** Alice mints namespace + Admin cap; Alice mints RO cap for Bob via `mint_capability<ReadOnly>`; Bob receives; Bob attempts `emit_call` with RO cap → aborts with explicit error; Bob's `seal_approve` succeeds (read is allowed).
**Files:** `contracts/onemem/tests/integration_cap_transfer_tests.move` (new).

### Story 6.3 — Cross-runtime composition: parent_call_id stitches two sessions

**AC:** Alice opens session A in namespace N; emits call A1; opens session B in namespace N with the same Admin cap; emits call B1 with parent_call_id = A1.call_id. Test: off-chain walker reading both sessions' events finds call B1 references call A1; verify chain integrity holds in BOTH sessions independently.
**Files:** `contracts/onemem/tests/integration_cross_runtime_tests.move` (new).

### Story 6.4 — Tamper detection: forge a call → off-chain re-computation catches it

**AC:** Build a session with 3 calls; manually compute the would-be merkle_root with a forged middle call; assert the on-chain `merkle_root` differs; off-chain walker returns "BROKEN at call N" pointing at the forged one. This is the math behind the `/verify/[session_id]` page.
**Files:** `contracts/onemem/tests/integration_tamper_tests.move` (new).

---

## Epic 7 — Deploy scripts + testnet + mainnet

Goal: ship to mainnet via a process that's repeatable + reviewable.

### Story 7.1 — `scripts/deploy-contract.sh` initial publish + package ID capture

**AC:** `bash scripts/deploy-contract.sh [testnet|mainnet]` runs `sui client publish` for `contracts/onemem`, captures the new package ID + admin cap object ID + upgrade cap object ID, writes them to `docs/05-our-architecture/01-protocol/MAINNET_DEPLOY.md` (testnet block + mainnet block). Idempotent (no-op if package already deployed at that rev). Outputs a one-line summary.
**Files:** `scripts/deploy-contract.sh`, `docs/05-our-architecture/01-protocol/MAINNET_DEPLOY.md` (new).

### Story 7.2 — `scripts/migrate-contract.sh` upgrade flow

**AC:** `bash scripts/migrate-contract.sh [testnet|mainnet]` runs `sui client publish --upgrade` using the upgrade cap stored in MAINNET_DEPLOY.md, captures the new package version, then iterates over known long-lived shared objects (MemoryNamespace, TraceSession) and calls their `migrate_*` entry functions to swap the version dynamic field. Logs per-object success.
**Files:** `scripts/migrate-contract.sh`.

### Story 7.3 — `scripts/verify-mainnet.sh` smoke test

**AC:** `bash scripts/verify-mainnet.sh [testnet|mainnet]` mints a tiny namespace, opens a session, emits one call, closes the session, off-chain re-derives merkle_root, asserts equality, prints `✓ VERIFIED` + Suiscan link.
**Files:** `scripts/verify-mainnet.sh`.

### Story 7.4 — Testnet deploy + smoke + GH workflow dry-run

**AC:** Manually run `bash scripts/deploy-contract.sh testnet` from a fresh shell; smoke test passes; trigger `gh workflow run deploy-contract.yml --field network=testnet --field mode=publish`; workflow succeeds + identical IDs captured. This proves the GH workflow path before mainnet.
**Files:** No code change; this is an EXECUTION story. Update MAINNET_DEPLOY.md testnet block with the deployed IDs.

### Story 7.5 — Mainnet deploy via approval-gated GH workflow

**AC:** Trigger `gh workflow run deploy-contract.yml --field network=mainnet --field mode=publish`; approval gate fires; Abu approves; deploy succeeds; mainnet IDs captured. Run smoke test from `scripts/verify-mainnet.sh mainnet` → green. **Phase 3 EXIT GATE.**
**Files:** No code change; update MAINNET_DEPLOY.md mainnet block.

---

## Epic 8 — Cross-language codegen (Move → TS / Python types)

Goal: SDK consumers don't hand-write the Move struct types.

### Story 8.1 — `scripts/codegen-move-types.ts` Move → TS

**AC:** `pnpm exec tsx scripts/codegen-move-types.ts` reads the deployed Move package's BCS schema (via `sui client object --json` for the published package), generates `packages/sdk-ts/src/types/move-types.ts` with one TS interface per Move struct. Idempotent — re-running produces byte-identical output. CI check: `pnpm turbo run codegen:check` confirms generated file is up to date.
**Files:** `scripts/codegen-move-types.ts`, `packages/sdk-ts/src/types/move-types.ts` (generated; committed).

### Story 8.2 — `scripts/codegen-move-python.py` Move → Python

**AC:** Same as 8.1 for Python. `uv run python scripts/codegen-move-python.py` writes `packages/sdk-python/onemem/move_types.py` with one Pydantic model per Move struct. Idempotent.
**Files:** `scripts/codegen-move-python.py`, `packages/sdk-python/onemem/move_types.py` (generated; committed).

---

## Story dependency order (rough TDD execution order)

```
1.1 → 1.2 → 1.3
        ↓
       2.1 → 2.2 → 2.3
              ↓
             3.1 → 3.2 → 3.3 → 3.4
              ↓     ↓     ↓     ↓
             4.1 (Authenticated events — touched by every 3.x)
              ↓
             5.1 → 5.2
              ↓
             6.1 → 6.2 → 6.3 → 6.4    ← integration tests; can be written in parallel
              ↓
             7.1 → 7.2 → 7.3 → 7.4 → 7.5    ← deploy chain; strictly sequential
              ↓
             8.1 ‖ 8.2    ← codegen; can be parallel
```

`‖` = can be parallel (independent). Otherwise sequential.

## Time-box

Day 6 = Epics 1+2+3 (foundation + namespace + trace core).
Day 7 = Epics 4+5+6 (events + Seal + integration tests).
Day 8 = Epics 7+8 (deploy chain + codegen + mainnet).

If Day 8 slips: Mitigations per PRD "Risks" — defer Merkle to v0.2, defer codegen, defer migrate-contract.sh polish.
