# Pillar 1 — Move Protocol (OneMem)

> Current note, 2026-06-17: this is a historical design document. Verify current
> implementation status against `contracts/onemem/`, tests, and
> `.thoughts/` before treating status tables as live.

The on-chain layer. Sui Move package deployed to mainnet by Day 8 of the build window. Everything else (SDKs, plugins, dashboard) consumes the package IDs + type definitions from this layer.

---

## Read order

| File | Purpose |
|---|---|
| `README.md` | This file — nav + design principles |
| `data-model.md` | **Load-bearing.** Canonical Move struct schemas. Read first. |
| `move-contract.md` | Package layout + module breakdown + entry functions |
| `events-and-attestation.md` | `event::emit_authenticated` usage + Merkle chain mechanics |
| `access-control-and-sharing.md` | Seal `seal_approve` policy + capability transfer for namespace sharing |
| `upgrade-strategy.md` | Version-as-dynamic-field pattern (lifted from MemWal `account.move`) |

---

## What the Move protocol exists to do

1. **Record memory provenance.** Every memory write on Walrus gets a verifiable on-chain commitment (`MemoryNamespace`-scoped, agent-attributed, timestamped).
2. **Record agent action provenance.** Every tool/skill/MCP call made by an agent becomes an `ActionCall` Move object linked in a Merkle chain — anyone can independently verify the chain integrity.
3. **Make memory shareable as a capability.** Namespaces become Sui objects with transferable `NamespaceCapability` types — sharing memory = capability transfer; revocation = on-chain tx.
4. **Gate decryption via Seal.** The `seal_approve` policy checks capability ownership before allowing Seal threshold decryption of the underlying Walrus blob.
5. **Survive upgrades.** Version-as-dynamic-field pattern means we can ship v0.1 confidently knowing v0.2 schema additions won't brick existing deployments.

---

## Design principles

1. **Owned objects where possible, shared only when required.** Owned objects parallelize on Sui; shared objects serialize through consensus. We use shared objects only for `Registry` (dedup index) and `MemoryNamespace` (multi-writer when shared). `ActionCall` and `NamespaceCapability` are owned.
2. **Capability over permission.** No address check in entry functions. Hold a `NamespaceCapability<...>` or you can't call the function. Type-system-enforced access.
3. **Event-driven, not state-bloating.** Don't store full memory content on chain — only the Walrus blob ID + content hash. The chain holds proofs; Walrus holds bytes.
4. **`event::emit_authenticated` for verifiability.** The keystone primitive. Lets browsers verify the Merkle chain against checkpoint signatures via a light client.
5. **Move 2024.beta.** Same edition as MemWal `account.move`.
6. **Upgrade-safe from Day 1.** Every struct has a version dynamic field; entry functions check it.
7. **Reference, don't reinvent.** Borrow patterns from MemWal `account.move` (versioning), `onlyfins-example-app` (Seal + capability), ticketing-poc (Ed25519 permits).
8. **Apache-2.0 (or MIT) — permissive.** OneMem ships as OSS for credibility + adoption.

---

## What we satisfy + what surprises (lens check)

| Walrus must-have | How this pillar satisfies |
|---|---|
| Long-term memory using persistent verifiable memory | `MemoryNamespace` + `ActionCall` Merkle chain + Walrus blob commits |
| Multi-agent coordination | Cross-agent traces composed via shared `namespace_id` + `parent_call_id` |
| Artifact-driven workflows | Every observation IS a Walrus artifact with an on-chain commit |
| Interfaces to inspect, debug, manage agent memory | Pillar 7 dashboard reads from these structs |

| The surprise this pillar contributes | Why judges recognize it as right |
|---|---|
| **Tamper-proof Merkle-chained action ledger** | They didn't ask for "verifiable AGENT ACTIONS" (just verifiable MEMORY); we extend the concept naturally and uniquely on Sui |
| **`event::emit_authenticated` first-mover** | Mysten just shipped this primitive; no reference app uses it. We do — light-client-verifiable from browser |
| **Capability-as-sharing primitive** | Sharing memory = capability transfer (not API permission). On-chain revoke. Sui-native; nothing else can do this |
| **Replay-from-chain** | Walk the Merkle chain, fetch Walrus blobs, decrypt via Seal, reconstruct full session — the demo flow nobody else has |

---

## Inspiration sources

Per the design-rules in the parent README:

- `../../01-sui-ecosystem/move-patterns-for-onemem.md` — 12 Move patterns (capability, shared registry, authenticated events, Seal `seal_approve`, dynamic-field versioning, etc.)
- `../../01-sui-ecosystem/memwal-deep-dive.md` — MemWal's `account.move` structure to lift verbatim (`AccountRegistry`, `MemWalAccount`, `DelegateKey`, `seal_approve` shape, upgrade pattern)
- `../../01-sui-ecosystem/REFERENCE_APPS.md` — `onlyfins-example-app` (Walrus+Seal+Enoki+zkLogin reference for the full stack) + ticketing-poc (Ed25519 permit pattern)
- `../../01-sui-ecosystem/walrus-deep-dive.md` — Walrus blob model (deletable vs permanent, quilts, public publishers/aggregators)
- `../../01-sui-ecosystem/seal-deep-dive.md` — Seal `seal_approve` policy convention, SessionKey flow, server-handled vs manual encryption
- `../../01-sui-ecosystem/SUI_DOC_TREE.md` — full Sui ecosystem docs map for any specific lookup
- `../../../TRACE_AND_PROVIDERS.md` §4 — the data model draft we're formalizing here

---

## Implementation status

Use this table as a scoped current orientation. For exact deployment addresses,
check `config/networks.json`, `contracts/onemem/Published.toml`, and generated
SDK address artifacts. For proof, run `sui move test` and
`bash scripts/verify-mainnet.sh testnet` with the current testnet Sui CLI.

| Component | Status |
|---|---|
| Move package skeleton | Built in `contracts/onemem` with six source modules and 40 Move tests. |
| `MemoryNamespace` struct | Built in `namespace.move`; covered by namespace, capability, Seal, and integration tests. |
| `TraceSession` struct | Built in `trace.move`; covered by trace lifecycle, compatibility, integration, and Merkle tests. |
| `ActionCall` struct + Merkle chain | Built in `trace.move`; `merkle_chain_tests.move` proves off-chain reconstruction catches tampering. |
| `NamespaceCapability` + transfer | Built in `namespace.move`; ReadOnly/ReadWrite/Admin capability mint, transfer, revoke, and admin revoke paths are tested. |
| `seal_approve` policy | Built in `seal_policy.move`; capability and inactive-namespace checks are tested. |
| `event::emit_authenticated` events | Built in `events.move`; SDK/dashboard verifiers consume emitted trace and action events. |
| Upgrade dynamic field | Built in `version.move`; package upgrade dry-run and live testnet package v2 are verified. |
| Testnet deployment | Live package v2: `0xc2e839c719e1c61222440f5661199e68de5413d8cfb49dd8bae3223e92fcf138`. Registry object remains stable. |
| Mainnet deployment | ⏳ pending; no mainnet package ID is recorded in `config/networks.json`. |
