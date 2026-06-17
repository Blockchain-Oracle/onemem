# `contracts/onemem/` — Coding Agent Context

Active repo routing lives in `AGENTS.md`; active Context Engineering artifacts
live under `.thoughts/`.

The Sui Move package. Load-bearing for the entire product — every other package depends on these primitives compiling, deploying, and behaving correctly on mainnet.

## Read before editing
- `docs/05-our-architecture/01-protocol/` (every doc — this is the canonical spec for the Move surface)
- `docs/01-sui-ecosystem/seal-deep-dive.md` (Seal `seal_approve` integration)
- `docs/01-sui-ecosystem/walrus-deep-dive.md` (Walrus blob storage integration)
- `docs/02-inspirations/memwal-incubation/` (we sit on top of MemWal — its account.move + version pattern is what we lift)
- `docs/05-our-architecture/01-protocol/upgrade-strategy.md` (version-as-dynamic-field upgrade flow — critical for safe mainnet upgrades)

## Non-negotiables
- **Capability pattern.** Access control is `NamespaceCapability<KIND>` with phantom types `ReadOnly | ReadWrite | Admin`. NEVER use address-based ACL — caps are the right Sui idiom for transferrable + revocable access.
- **Version-as-dynamic-field upgrade pattern.** Lifted from MemWal's `account.move`. Every long-lived object holds a `version` dynamic field; upgrade entry functions atomically swap it. Per `upgrade-strategy.md`.
- **`event::emit_authenticated`** for all trace events. First-mover use on Sui mainnet. Per `events-and-attestation.md`.
- **Merkle chain on `(content_hash, prev_hash)`.** Every `ActionCall` references its predecessor by hash. Session-level `merkle_root` is the chain head. Per `events-and-attestation.md`.
- **Seal `seal_approve`** gates Walrus blob decryption to cap holders. Server NEVER decrypts. Per `access-control-and-sharing.md`.
- **TDD per `superpowers:test-driven-development`.** Move tests via `sui move test` — write the failing test before writing the entry function.
- **`security-reviewer` on every diff.** This is the surface where bugs are catastrophic — every change goes through the security-reviewer subagent before merge.

## Build + test
```bash
sui move build           # from contracts/onemem/
sui move test            # all tests
sui move test --coverage # with coverage report
```

## Deploy
- Initial publish: `bash ../../scripts/deploy-contract.sh`
- Upgrade (after first publish): `bash ../../scripts/migrate-contract.sh` (handles version-dynamic-field migration calls per-object after the new package version is published)
- Per `deploy-contract.yml` GitHub workflow — manual approval gate on mainnet.

## Module layout
| Module | Purpose |
|---|---|
| `registry.move` | Global registry; tracks deployed package version |
| `namespace.move` | `MemoryNamespace` + `NamespaceCapability<KIND>` |
| `trace.move` | `TraceSession` + `ActionCall` + cross-runtime composition |
| `events.move` | Authenticated event emitters |
| `seal_policy.move` | `seal_approve` gates for Walrus decryption |
| `version.move` | Upgrade-pattern helpers |
