---
source_repo: https://github.com/MystenLabs/sui
docs_subtree: docs/content/
docs_site: https://docs.sui.io (1:1 mirror)
clone_used: git clone --depth 1 --filter=blob:none --sparse https://github.com/MystenLabs/sui /tmp/sui-repo + sparse-checkout set docs/content examples dapps
verified: 2026-05-23
purpose: Pre-architecture doc map for OneMem (Move + Walrus + Seal + MemWal + Nautilus + Enoki + Sui Stack Messaging).
---

# Sui Doc Tree — OneMem Architecture Reference

This is the canonical map of `MystenLabs/sui/docs/content/` as it sits on `main`. The site at docs.sui.io is built 1:1 from this tree, so URLs translate directly: `docs/content/<path>.mdx` → `https://docs.sui.io/<path>`.

## Top-level layout

```
docs/content/
├── getting-started/      # Onboarding, install, hello-world, sui-for-{ethereum,solana}, example apps catalog
├── develop/              # Builder-facing docs: Move, objects, transactions, PTBs, gas, events, crypto, security
├── sui-stack/            # Mysten higher-order stack: Walrus, Seal, Nautilus, Enoki, zkLogin, SuiNS, on-chain primitives
├── onchain-finance/      # DeepBook (v3, margin, predict), Kiosk, closed-loop tokens, asset custody, wallets — SKIP for OneMem
├── operators/            # Validators, full-nodes, data-management — SKIP for dApp builders
├── references/           # CLI, framework, SDK, GraphQL, gRPC, IDE, package manager, glossary
└── snippets/             # Shared mdx fragments used by ImportContent across the site
```

For OneMem, the load-bearing subtrees are **`develop/`**, **`sui-stack/`**, and selected files in **`references/`** + **`getting-started/examples/`**. Skip `onchain-finance/` (DeepBook), `operators/`, and CLI/RPC-reference pages — out of scope for this build.

---

## Per-subtree summary

### `getting-started/` — onboarding + flagship examples

Install, configure, hello-world, network selection, `sui-for-ethereum`, `sui-for-solana`, `dev-cheat-sheet`, `agent-skills`. The `examples/` sub-folder is the **catalog of Mysten reference apps** (capability pattern, dapp-kit frontend, derived objects, event indexer, NFT app, Plinko, scenario testing, three CTFs: lootbox / merchant / staking). Each example MDX is a self-contained walkthrough with mermaid diagrams, key code highlights, and troubleshooting.

Load-bearing for OneMem:
- `getting-started/examples/capability-pattern.mdx` — the canonical AdminCap delegation pattern OneMem will mirror for `AnchorAdminCap`.
- `getting-started/examples/event-indexer.mdx` — custom indexer for the audit ledger viewer.
- `getting-started/examples/dapp-kit-frontend.mdx` — dashboard scaffolding.

URLs:
- https://docs.sui.io/getting-started/examples/capability-pattern
- https://docs.sui.io/getting-started/examples/event-indexer
- https://docs.sui.io/getting-started/examples/dapp-kit-frontend
- https://docs.sui.io/getting-started/examples/derived-objects

### `develop/` — core builder reference (THIS IS WHERE ONEMEM LIVES)

Subtrees:
- `develop/sui-architecture/` — object model, epochs, networks, consensus, checkpoint verification, security, storage. Read `object-model.mdx` first.
- `develop/write-move/` — Move fundamentals, sui-move-concepts (entry vs public, init, object-centric storage), best-practices, package-overview.
- `develop/objects/` — ownership (`address-owned`, `shared`, `immutable`, `wrapped`, `party`), `dynamic-fields.mdx`, `derived-objects.mdx`, `versioning.mdx`, `display/`, `transfers/` (including `transfer-policies.mdx`, `transfer-to-object.mdx`).
- `develop/transactions/` — `transaction-lifecycle.mdx`, `txn-overview.mdx`, `ptbs/` (4 files), `transaction-auth/` (intent-signing, multisig, offline-signing, auth-overview, address-aliases).
- `develop/transaction-payment/` — `gas-in-sui.mdx`, `gas-smashing.mdx`, `gasless-stablecoin-transfers.mdx`, `local-fee-markets.mdx`, **`sponsor-txn.mdx`** (load-bearing for Enoki integration).
- `develop/accessing-data/` — `using-events.mdx`, **`authenticated-events.mdx`** (Merkle Mountain Range light-client-verifiable events — load-bearing for OneMem's audit-ledger trust story), `data-serving.mdx`, `graphql/`, `grpc/`, `custom-indexer/` (`build.mdx`, `bring-your-own-store.mdx`, `pipeline-architecture.mdx`, `indexer-runtime-perf.mdx`).
- `develop/cryptography/` — `signing.mdx`, `passkeys.mdx`, `hashing.mdx`, `groth16.mdx`, `ecvrf.mdx`.
- `develop/publish-upgrade-packages/` — `deploy.mdx`, `upgrade.mdx`, `versioning.mdx`, `custom-policies.mdx`.
- `develop/manage-packages/` — `move-package-management.mdx`, `automated-address-management.mdx`.
- `develop/security/` — `best-practices.mdx` (covers Seal + Nautilus security guidance).
- `develop/testing-debugging/` — `testing.mdx`, `common-errors.mdx`.

OneMem will live in this subtree more than any other.

### `sui-stack/` — Mysten higher-order primitives (Walrus, Seal, Nautilus, Enoki, zkLogin)

Subtrees:
- `sui-stack/walrus/` — `index.mdx`, `sui-stack-walrus.mdx` (canonical Walrus tutorial, walked through OnlyFins), `sui-stack-walrus-sites.mdx`, `only-fins.mdx` (reference app overview), `indexer-walrus.mdx`.
- `sui-stack/seal/` — `index.mdx`, `sui-stack-seal.mdx` (canonical Seal tutorial, walked through OnlyFins — covers `seal_approve` convention, SessionKey, decryption flow), `sui-chat-app.mdx` (Sui Stack Messaging chat example — envelope encryption + key rotation patterns).
- `sui-stack/nautilus/` — `index.mdx`, `nautilus-overview.mdx`, `nautilus-design.mdx`, `using-nautilus.mdx`, `customize-nautilus.mdx`, `nautilus-weather-oracle.mdx`, `seal.mdx` (Nautilus+Seal combo), `community-dev-tools.mdx`.
- `sui-stack/enoki/` — `solitaire.mdx` (game reference), `ticketing-poc.mdx` (Ed25519 permit + sponsored tx + zkLogin combo — DIRECT relevance for OneMem signed-event pattern).
- `sui-stack/zklogin-integration/` — `index.mdx`, `zklogin.mdx` (deep theory), `zklogin-example.mdx`, `zklogin-demo.mdx`, `developer-account.mdx`.
- `sui-stack/on-chain-primitives/` — `index.mdx`, `access-time.mdx` (the `Clock` shared object at `0x6`), `randomness-onchain.mdx`.
- `sui-stack/suins/` — name service docs (use for resolving addresses in OneMem viewer UI).
- `sui-stack/suiplay0x1/` — gaming console (skip).

For OneMem, sui-stack docs are the single most concentrated source of architecture guidance.

### `references/` — CLI, framework, SDK indexes

`framework.mdx`, `sui-framework-reference.mdx`, `sui-move.mdx`, `sui-sdks.mdx`, `rust-sdk.mdx`, `sui-graphql.mdx`, `sui-api.mdx`, `release-notes.mdx`, `research-papers.mdx`, `sui-glossary.mdx`, **`package-managers/manifest-reference.mdx`** + `package-manager-migration.mdx` (load-bearing — Move.toml format OneMem must follow), `cli/` (10 commands — keytool, client, move, ptb, replay, trace-analysis, validator, external-signers, cheatsheet), `ide/`, `contribute/`.

For OneMem, the only load-bearing files here are `manifest-reference.mdx`, `framework.mdx`, and `sui-framework-reference.mdx` for typed signatures.

### `onchain-finance/`, `operators/` — SKIP

DeepBook + validator/full-node docs. Out of scope per spec.

### `snippets/` — fragment library

Reusable mdx pulled in via `<ImportContent />` across the site. Nothing to read directly; this is the build-system layer.

---

## Must-read for OneMem architecture (cherry-picks)

1. **https://docs.sui.io/sui-stack/walrus/sui-stack-walrus** — canonical Walrus tutorial walked through OnlyFins. Shows TS SDK upload patterns (`writeBlob`, `writeFiles`, `writeFilesFlow` 5-step), aggregator/publisher/upload-relay architecture, attribute APIs, delete/extend flows.
2. **https://docs.sui.io/sui-stack/seal/sui-stack-seal** — canonical Seal tutorial. `seal_approve` Move convention, SessionKey TTL flow, three reference policies (owner-only, time-lock, allowlist), encryption-decryption sequence diagram, failure-mode table.
3. **https://docs.sui.io/develop/accessing-data/authenticated-events** — Authenticated Events (Merkle Mountain Range). The exact primitive OneMem needs to make its audit-ledger entries light-client-verifiable. `event::emit_authenticated(MyEvent { ... })` is the one-line upgrade from regular events.
4. **https://docs.sui.io/develop/publish-upgrade-packages/upgrade** — package upgrade rules + the versioned-shared-object pattern (lines 95+). OneMem will use this pattern for its registry.
5. **https://docs.sui.io/sui-stack/walrus/only-fins** — flagship Walrus + Seal + Enoki + zkLogin + sponsored-tx reference app overview.
6. **https://docs.sui.io/sui-stack/enoki/ticketing-poc** — Ed25519 permit + nonce replay protection + Enoki sponsored tx + zkLogin Google OAuth. The closest existing Mysten reference for OneMem's signed-attestation-then-mint pattern.
7. **https://docs.sui.io/develop/transaction-payment/sponsor-txn** — full sponsored transaction protocol (roles, data structures, dual-signing flow, GasData semantics, censorship considerations).
8. **https://docs.sui.io/develop/objects/object-ownership/shared** — shared-object semantics + `transfer::share_object` (OneMem's `AuditRegistry` will be shared).
9. **https://docs.sui.io/develop/objects/dynamic-fields** — heterogeneous storage + the dynamic_field / dynamic_object_field split. Used by MemWal's version dynamic field on UID.
10. **https://docs.sui.io/sui-stack/nautilus/nautilus-overview** — TEE-backed verifiable offchain compute. The Day 23-29 relayer story (verifiable enclave + onchain attestation).

---

## Examples + reference apps

The Mysten reference apps OneMem should clone, study, or lift from:

| Repo | What it demonstrates | Relevance |
|---|---|---|
| `MystenLabs/onlyfins-example-app` | Walrus + Seal + Enoki + zkLogin + sponsored-tx full stack. `ViewerToken` capability + `seal_approve_access`. | **Closest clone target** for OneMem frontend + Move scaffolding. |
| `MystenLabs/ticketing-poc` | Ed25519 permit minting, nonce replay protection (`KeyRegistry`), Enoki sponsored tx, Google OAuth via zkLogin, stage-marker phantom types. | Signed-attestation Move pattern OneMem adapts for cross-runtime memory writes. |
| `MystenLabs/sui-stack-messaging` (subdir `chat-app/`) | E2EE messaging with envelope encryption, per-group permissioned shared object, key rotation, relayer pattern, Walrus archival. | Architecture reference for cross-agent encrypted channels. |
| `MystenLabs/sui` → `examples/move/` | 23 mini Move packages: basics, capability, coin, dynamic_fields, entry_functions, flash_lender, hero, locked_stake, nft, nft-rental, nft-soulbound, object_balance, object_bound, profiles, random, reviews_rating, simple_warrior, token, transfer-to-object, trusted_swap, usdc_usage. | First place to look for any single Move concept. |
| `MystenLabs/sui` → `examples/custom-indexer/` | Reference custom indexer (Rust). | Audit-ledger viewer indexer. |
| `MystenLabs/sui` → `examples/usdc-transfer-app/` | USDC TS example. | Payment leg if monetization. |
| `MystenLabs/sui` → `dapps/sponsored-transactions/` | Vite + TS sponsored-tx UI. | Sponsored-tx UI scaffold. |
| `MystenLabs/MemWal` → `apps/researcher`, `apps/chatbot`, `apps/noter`, `apps/app` | Four Mysten-shipped MemWal apps. | The competitive landscape OneMem plays around. See `memwal-deep-dive.md`. |
| `MystenLabs/sui-move-bootcamp` → `K5/seal-demo/` | Three minimal seal_approve policies (private / timelock / allowlist) + standalone Node decrypt script. | The cleanest Seal Move policy reference. |
| `MystenLabs/walrus-pocs` | Focused Walrus SDK examples in Node.js + React. | Lift `writeBlob`, `readBlob`, `delete`, `useSealEncrypt`, `useSealSession`, `useSealDecrypt` hooks. |
| `MystenLabs/Walrus-Onboarding` | Module-by-module Walrus tutorials referenced from the canonical Walrus tutorial. | Reference for upload-relay vs direct upload patterns. |

---

## Move package conventions OneMem should follow

### `Move.toml` (current 1.63+ system — read `references/package-managers/manifest-reference.mdx`)

Minimum:

```toml
[package]
name = "onemem"
edition = "2024"          # use 2024 (current). MemWal uses "2024".
authors = ["OneMem"]

[dependencies]
# mvr-style is preferred for ecosystem packages:
# ascii = { r.mvr = "@potatoes/ascii" }

# Git dependencies for non-mvr packages — pin to a tag/rev, not a branch
# seal = { git = "https://github.com/MystenLabs/seal.git", subdir = "move/seal", rev = "main" }

[environments]
testnet = { chain-id = "4c78adac" }
mainnet = { chain-id = "35834a8a" }

[addresses]
onemem = "0x0"

[dep-replacements.testnet]
# Optionally override deps per env.
```

The package system pins everything in `Move.lock` (commit to source control). `Published.toml` records publication metadata (commit it). `Pub.<env-name>.toml` is for ephemeral test-publishes (do NOT commit).

### Versioning + upgrade-safe patterns (read `develop/publish-upgrade-packages/upgrade.mdx` + the MemWal `account.move` example)

- Pick a `VERSION: u64` constant in the contract; **store the per-object version as a dynamic field on `UID`** (not a struct field — you cannot add struct fields after publish in Sui Move). MemWal does this on both `AccountRegistry` and `MemWalAccount`. See `move-patterns-for-onemem.md` §Versioning.
- Gate every mutating entry fn with `assert_object_version(&obj.id)`.
- Provide migration paths: `migrate_account` (owner-side), `admin_migrate_account` (UpgradeCap-holder-side). MemWal ships both.
- Honor upgrade compatibility rules:
  - Existing `public` function signatures must stay identical.
  - Existing struct layouts (and abilities) must stay identical.
  - You can add new structs + new functions freely.
  - You can change non-public function signatures and bodies.

### Framework dependencies

OneMem must depend on (transitively included by default via system deps):
- `sui::object`, `sui::transfer`, `sui::event`, `sui::clock`, `sui::tx_context`, `sui::dynamic_field`, `sui::package` (for `UpgradeCap`), `sui::bcs`.

For Seal: depend on the Seal Move sources (or just write `seal_approve*` entry funs against the convention — no Move dep needed; the convention is what matters).

For Walrus: no Move dep needed unless wrapping `Blob` objects (Walrus blobs are Sui objects of type `walrus::blob::Blob` — to query by owner, filter on that StructType).

### `init` function rules

- `init` runs exactly once at publish. **Never re-runs on upgrade.** All shared-object creation, `Publisher` claim, and singleton bootstrap belongs here.
- Signature: `fun init(ctx: &mut TxContext)` or `fun init(witness: ONE_TIME_WITNESS, ctx: &mut TxContext)` if using a one-time witness.

### `entry` vs `public` (read `develop/write-move/sui-move-concepts.mdx`)

- `public fun` — callable from other Move packages AND from PTBs.
- `entry fun` (no `public`) — callable from PTBs only, not from other Move modules. **Use for Seal `seal_approve*`** (the convention requires it).
- `public(package) fun` — callable from same-package modules only.

### Capability pattern (read `getting-started/examples/capability-pattern.mdx`)

Use address-owned `key` structs as authorization tokens. OneMem will mint `AnchorAdminCap` in `init`, transfer to deployer, and delegate by minting + transferring more. References to `&AnchorAdminCap` (not by-value) gate functions that should NOT consume the cap.

### Authenticated Events (read `develop/accessing-data/authenticated-events.mdx`)

For any event OneMem wants to be light-client-verifiable (the entire audit ledger), use `event::emit_authenticated(MyEvent { ... })` instead of `event::emit(...)`. Backwards-compatible with existing indexers. Requires the package to be the emitter (events are bound to the package that defines the event type).

---

## What's NOT in `docs/content/` but matters for OneMem

- **TypeScript SDK reference docs** — live at https://sdk.mystenlabs.com (separate site, not in the Sui repo `docs/`). The Sui doc tree links to them.
- **Walrus protocol docs** — https://docs.wal.app and https://sdk.mystenlabs.com/walrus.
- **Seal protocol docs** — https://seal-docs.wal.app.
- **Enoki product docs** — https://docs.enoki.mystenlabs.com.
- **MemWal docs** — https://docs.memwal.ai (and the `docs/` folder in `MystenLabs/MemWal`).
- **Move book** — https://move-book.com (linked heavily from sui-stack and develop pages).
- **DeepBook docs** — `docs/content/onchain-finance/deepbookv3*` — out of scope but the most polished cross-reference for Move + TS SDK + custom indexer + production-grade README patterns if OneMem wants a North Star for documentation craft.
