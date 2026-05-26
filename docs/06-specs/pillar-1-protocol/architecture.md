# Pillar 1 Architecture Summary

This is a **summary + pointer doc**. Canonical design lives at `docs/05-our-architecture/01-protocol/*`. Do not duplicate decisions here — link instead.

## The 6 modules

| Module | Owns | Canonical source |
|---|---|---|
| `version.move` | `CURRENT_VERSION` constant; `current_version()` accessor; helper utilities for the version-as-dynamic-field upgrade pattern | `docs/05-our-architecture/01-protocol/upgrade-strategy.md` |
| `registry.move` | Global registry object pointing at the active package version + admin cap to upgrade it | `docs/05-our-architecture/01-protocol/move-contract.md` (registry section) |
| `namespace.move` | `MemoryNamespace` struct (UID, owner, walrus_root_hash, version dynamic field); `NamespaceCapability<phantom KIND>` (ReadOnly/ReadWrite/Admin); mint/transfer/revoke entry functions | `docs/05-our-architecture/01-protocol/data-model.md` + `access-control-and-sharing.md` |
| `trace.move` | `TraceSession` struct (UID, namespace_id, agent_id, environment, started_at, merkle_root, status); `ActionCall` struct (call_id, parent_call_id, content_hash, prev_hash, walrus_blob_id, kind, started_at, ended_at); open_session / emit_call / close_session entry functions; Merkle chain helpers (compute_content_hash + chain_prev_hash) | `docs/05-our-architecture/01-protocol/data-model.md` + `events-and-attestation.md` |
| `events.move` | Authenticated event wrappers: `ActionCallEmitted`, `ActionCallClosed`, `TraceSessionOpened`, `TraceSessionClosed` — emitted via `event::emit_authenticated` | `docs/05-our-architecture/01-protocol/events-and-attestation.md` |
| `seal_policy.move` | `seal_approve` entry function gating Walrus blob decryption to holders of a valid `NamespaceCapability<ReadOnly>` or higher | `docs/05-our-architecture/01-protocol/move-contract.md` (seal_policy section) + `docs/01-sui-ecosystem/seal.md` |

## Key invariants

These MUST hold after every state-changing call — every Move test asserts at least one.

1. **Cap-scoped writes only.** `emit_call` aborts unless the caller holds `NamespaceCapability<ReadWrite>` or `NamespaceCapability<Admin>` for `session.namespace_id`.
2. **Cap-scoped Seal decryption only.** `seal_approve` returns true iff caller holds any `NamespaceCapability` (RO/RW/Admin) for the namespace bound to the requested Walrus blob.
3. **Merkle chain integrity.** Every `emit_call(session, ...)` after the first sets `new_call.prev_hash = session.last_call.content_hash`. `close_session` writes `session.merkle_root = chain_walk(...)`. Verification = walk the chain off-chain and assert equality.
4. **Authenticated events.** Every state-changing entry function emits via `event::emit_authenticated`, never via plain `event::emit`. (First-mover use on Sui mainnet — load-bearing narrative.)
5. **Version-correctness.** Long-lived object (`MemoryNamespace`, `TraceSession`) entry functions assert `object.version == version::current_version()`. If versions mismatch → abort with explicit error code → caller must migrate via the appropriate `migrate_*` entry function.
6. **Owner-only admin.** Admin operations (mint Admin cap, upgrade version dynamic field, revoke caps) require holding `NamespaceCapability<Admin>`.
7. **Capability transfer is one-way.** Admin caps can be transferred via `transfer::public_transfer`. Revocation = burning the cap object on chain.
8. **Cross-runtime composition is identifier-based.** Two `ActionCall`s in different `TraceSession`s referencing the same `parent_call_id` are part of the same logical operation. No on-chain coupling required.

## Move.toml + Sui framework pin

```toml
[package]
name = "onemem"
edition = "2024.beta"
version = "0.1.0"
license = "Apache-2.0"

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/mainnet" }

[addresses]
onemem = "0x0"

[dev-addresses]
onemem = "0xCAFE"
```

**Audit note from bootstrap (`sui move build` output, 2026-05-26):**
> `[NOTE] Dependencies on Sui, MoveStdlib, Bridge, DeepBook, and SuiSystem are automatically added, but this feature is disabled for your package because you have explicitly included dependencies on Sui. Consider removing these dependencies from Move.toml.`

Action in Story 1.1: remove the explicit `Sui = { ... }` line; sui CLI auto-adds it. Verify build still works.

## Cross-cutting decisions reused from architecture

| Decision | Where decided | What it means here |
|---|---|---|
| Phantom-typed capabilities | `access-control-and-sharing.md` | Use `NamespaceCapability<phantom KIND>` with KIND = `ReadOnly | ReadWrite | Admin`; type-check at PTB compile time |
| Walrus blob commitment | `events-and-attestation.md` | `ActionCall.walrus_blob_id` is the on-chain pointer; the blob content is Seal-encrypted off-chain; the contract never sees plaintext |
| `event::emit_authenticated` over plain emit | `events-and-attestation.md` | Signature verification at consensus time = provenance every dashboard/verifier can trust |
| Version-as-dynamic-field upgrade pattern | `upgrade-strategy.md` (lifted from MemWal's `account.move`) | Long-lived objects carry their own version; entry functions assert; migrations swap atomically |
| Cross-runtime composition via env vars | `docs/05-our-architecture/03-runtimes/cross-runtime-composition.md` | Off-chain runtimes propagate `ONEMEM_NAMESPACE_ID`, `ONEMEM_PARENT_TRACE_SESSION_ID`, `ONEMEM_PARENT_CALL_ID`; on-chain just stores `parent_call_id` field |

## What's NEW vs the architecture docs

None. This spec adds NO new design decisions. If you find yourself wanting to add one while implementing:

1. Stop
2. Update the relevant `docs/05-our-architecture/01-protocol/*.md` first
3. Update this spec to reference the change
4. Then implement

This rule prevents architecture drift during execution.

## Reference implementations to lift from

| Concept | Source | What to copy |
|---|---|---|
| Version-as-dynamic-field upgrade flow | MemWal `account.move` (`docs/02-inspirations/memwal-incubation/`) | The entire pattern — entry function shape, error codes, dynamic-field key convention |
| `seal_approve` integration with Walrus | MemWal Seal usage (`docs/02-inspirations/memwal-incubation/`) + `docs/01-sui-ecosystem/seal.md` | The signature shape, the capability check inside seal_approve |
| `event::emit_authenticated` usage | Sui framework source + Sui release notes for the `authenticated_event` feature | Tx-author signature verification at consensus; structure of the emitted event payload |
| Capability/object transfer + burn idioms | DeepBook `deepbookv3` package (`docs/02-inspirations/...`) | `public_transfer`, `freeze_object`, `delete` patterns |
| Move test structure (table-driven) | Sui framework's own tests + the DeepBook tests | `#[test]` + `test_scenario::begin/end_with_ctx`; multi-tx scenarios |
