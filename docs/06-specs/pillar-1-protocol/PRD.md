# Pillar 1 PRD — OneMem Move Protocol

## Summary

The Move contract is the **trust root** of OneMem. Every downstream pillar — SDKs, plugins, providers, CLI, dashboard, demos — sits on top of its primitives. If the contract works on mainnet with the right access model and event semantics, the product works. If it doesn't, nothing else can.

This pillar ships **one Move package** named `onemem`, deployed to Sui mainnet, that exposes:

1. `MemoryNamespace` — the unit of memory ownership + access control
2. `NamespaceCapability<KIND>` — phantom-typed (`ReadOnly | ReadWrite | Admin`) transferrable + revocable access caps
3. `TraceSession` + `ActionCall` — Merkle-chained verifiable trace primitives
4. `event::emit_authenticated` events — `ActionCallEmitted`, `ActionCallClosed`, `TraceSessionOpened`, `TraceSessionClosed`
5. `seal_approve` — gates Walrus blob decryption to cap holders
6. Version-as-dynamic-field upgrade pattern — safe in-place upgrades without breaking existing objects

## Why this exists

Three jobs the contract must do that nothing else can:

1. **Be the verifiable substrate.** "Verifiable AI memory" is the entire pitch. Without the contract on mainnet, OneMem is just another local store — Mem0 or MemWal already do that. Verifiability requires (a) authenticated events on a public chain, (b) Merkle linkage that makes tampering provable, (c) public inspectability.
2. **Be the access-control surface.** Every multi-user / cross-device / shared-namespace flow runs through `NamespaceCapability<KIND>`. The cap is the only mechanism the dashboard, SDK, and Seal policy all agree on.
3. **Be the cross-runtime composition layer.** Two agents in two runtimes (Claude Code + Hermes) writing to the **same** `namespace_id` with the **same** `parent_call_id` produce one stitched trace — this only works if the on-chain identifiers are canonical. The contract owns those identifiers.

## What it does NOT do (deliberately scoped out of v0.1)

- **Memory marketplaces** (v0.2 stretch per `docs/05-our-architecture/09-stretch/memory-marketplaces.md`)
- **Agent reputation graphs** (v0.2)
- **ERC-8004 bridge** (v0.2, cross-chain agent identity)
- **Nautilus TEE attestation** (v0.2 stretch — relays-without-trust)
- **Pricing / payment-on-write** flows
- **DAO-style multisig namespace ownership** (v0.2 if requested)

Per `docs/05-our-architecture/00-overview/BUILD_SEQUENCE.md` risk-adjusted floor: if Merkle chain complexity blows the budget, defer Merkle to v0.2 and ship just `MemoryNamespace` + `TraceSession` + simple events. We will NOT defer at planning time; we will only defer if the time-box (Days 6-8 in the original calendar; ~3 days regardless) forces it.

## Users + use cases

| User | Primary call | What they get |
|---|---|---|
| **Agent runtime plugin** (Claude Code, Hermes, OpenClaw) | `open_session` → many `emit_call` → `close_session` | A verifiable on-chain trace of every action the agent took |
| **SDK consumer** (any TS/Python app) | `mint_namespace` → `mint_capability<KIND>` → `transfer_capability(to_addr)` | A namespace they own + caps they can hand out for shared-namespace access |
| **Dashboard `/verify/[id]` viewer** (anyone, no auth) | Read TraceSession + walk Merkle chain from events | Mathematical proof the session sequence is intact |
| **Seal decryption gate** | `seal_approve` check | Allows decryption ONLY if caller holds a valid `NamespaceCapability` |
| **Cross-runtime orchestrator** (Hermes delegating to Claude Code) | `on_delegation` sets `parent_call_id` env vars; child runtime opens nested session | One stitched trace across both runtimes |

## Constraints

- **Sui mainnet.** Not testnet-only. Mainnet deploy is the exit gate.
- **`event::emit_authenticated`.** First-mover on mainnet per the Walrus track narrative.
- **Version-as-dynamic-field upgrade pattern** lifted from MemWal's `account.move`. Long-lived objects (MemoryNamespace, TraceSession) hold a `version` dynamic field; upgrade entry functions swap it atomically.
- **`security-reviewer` subagent on every diff.** This is the surface where bugs are catastrophic.
- **TDD non-negotiable.** Move tests fail first; module code makes them pass; refactor.
- **Apache-2.0 license.**

## Success metrics

| Metric | Target |
|---|---|
| Mainnet package deployed | ✓ before submission (2026-06-21) |
| `sui move test` coverage | All 5 test files green; no skipped tests |
| Gas budget per `emit_call` | < 0.001 SUI (sanity check for plugin viability) |
| Verify-chain time (off-chain walk of 50-call session) | < 3s p95 (per `docs/05-our-architecture/06-dashboard/route-verify-public.md`) |
| Security-reviewer findings | 0 critical, 0 high on final diff |
| Time-box | ≤ 3 days for spec + code + deploy (Days 6-8 in original calendar) |

## Risks + mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Merkle chain implementation complexity overshoots time-box | Medium | Time-box hard at end of Day 7; if not done, defer Merkle to v0.2 and ship simple events |
| Seal `/manual` flow integration with `seal_approve` is fiddly | Medium | Wire up earliest (Day 6); use MemWal's `account.move` Seal pattern as reference |
| `event::emit_authenticated` API surface drift (it's a relatively new primitive) | Low-Medium | Pin Sui framework to a known-good mainnet rev in Move.toml; track Sui release notes |
| Mainnet deploy gas + tx errors | Low | Smoke-test on testnet first; mainnet via approval-gated GH workflow with rollback plan (the version pattern means we can publish a fixed version + migrate) |
| Test on existing skeleton broken by real implementation | Low | Skeleton already compiles; TDD pattern means tests evolve alongside |

## Out-of-scope explicit reminders

- No new framework dependencies in `Move.toml` beyond Sui framework
- No DApp Kit integration here (that's Pillar 2 SDK + Pillar 6 dashboard)
- No off-chain index/database — events ARE the index
- No Walrus blob write/read here — that's SDK's job; we only commit the blob hash on-chain
- No client-side encryption here — Seal `/manual` flow lives in SDK; this contract only EXPOSES the `seal_approve` gate

## Done definition

See [`README.md`](./README.md) → "Pillar exit gate" (7 items). All must be green before flipping Phase 3 checkbox in `BUILD_SEQUENCE.md`.
