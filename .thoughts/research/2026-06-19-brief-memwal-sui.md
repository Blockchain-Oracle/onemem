The on-chain reality is confirmed: the package is published (Immutable) and the registry is a shared object whose type is prefixed with the `originalPackageId` (`0x64c1...`), not the upgraded `packageId` (`0xc2e8...`). This confirms the type-vs-policy distinction empirically. I have everything needed.

## Scope

What MemWal is (Sui Overflow 2026 sanctioned memory tool, account + delegate key model, SDK/role) and the OneMem on-chain layer AS IMPLEMENTED: the Move package location, its objects/functions (namespace, capabilities, `TraceSession`, `ActionCall`, `memwal_write`), how `sdk-ts`/`cli-ts` call them, the generated `addresses.ts`, the `originalPackageId` vs `packageId` distinction, `traces.ts`, `memory.ts`, and the deployed package id(s) + network. Reality only; no recommendations.

## Sources Checked

- `config/networks.json` (deployment manifest)
- `packages/sdk-ts/src/generated/addresses.ts` (codegen output)
- Move sources: `contracts/onemem/sources/{trace,namespace,events,registry,seal_policy}.move`, `contracts/onemem/Move.toml`
- SDK: `packages/sdk-ts/src/{client,traces,memory}.ts`, `packages/sdk-ts/src/fetchers/trace.ts`, `packages/sdk-ts/package.json`
- CLI: `packages/cli-ts/src/commands/trace.ts`, `packages/cli-ts/src/util/sui.ts`, `packages/cli-ts/src/util/memory-config.ts`
- Setup: `scripts/setup-memwal.mts`
- Docs: `docs/01-sui-ecosystem/memwal-deep-dive.md`; package CLAUDE.md files (`contracts/onemem/CLAUDE.md`, `packages/sdk-ts/CLAUDE.md`)
- Handbook memory: `reference_sui_overflow_2026_handbook.md`
- Live testnet RPC `sui_getObject` on the package id and registry id (verified existence on-chain)

## Verified Facts

### MemWal — what it is and its role

- MemWal (a.k.a. "Walrus Memory") is a Mysten "privacy-first AI memory primitive," sanctioned in the Sui Overflow 2026 Walrus track. The handbook memory states it "Has a **Playground to create an account + a delegate key for your agent**" — that is where the MemWal account id + delegate key come from (`reference_sui_overflow_2026_handbook.md`).
- MemWal's Move contract is `memwal::account` (a single ~660-line module, edition 2024, no external deps). Key types: `AccountRegistry` (shared, dedup table `accounts: Table<address, ID>`), `MemWalAccount` (owner + `vector<DelegateKey>` max 20 + `active` + `created_at`), `DelegateKey` (32-byte Ed25519 pubkey + derived Sui address + label + created_at). Both registry + account carry a `version: u64` dynamic field; current MemWal `VERSION = 2` (`docs/01-sui-ecosystem/memwal-deep-dive.md:40-77`).
- MemWal `seal_approve(id, account, ctx)` grants decryption only to the account owner or a registered delegate; helper `seal_key_id(owner) = bcs::to_bytes(owner)` (account-wide ACL, not per-blob) (`memwal-deep-dive.md:54-71`).
- Documented "critical gap" that OneMem targets: MemWal emits NO `MemoryWritten`/`ObservationCommitted`/`AgentActionAttested` event, no per-blob ACL, no audit-log object, no agent-id binding on individual memories. Memory writes/recalls/extractions live on the relayer's Postgres + Walrus blobs, not on Sui events (`memwal-deep-dive.md:79-87`).
- MemWal SDK npm package is `@mysten-incubation/memwal`. API includes `remember`, `recall`, `analyze`, `restore`, `health`, `embed`, plus the manual variants `rememberManual` / `recallManual` (`memwal-deep-dive.md:121-127`). OneMem declares it as a **required peer dependency** at `^0.0.5` (`packages/sdk-ts/package.json`, `peerDependencies` + `peerDependenciesMeta.optional: false`).
- Relayer endpoints documented: `relayer.memwal.ai` (mainnet), `relayer.staging.memwal.ai` (testnet), `relayer.dev.memwal.ai` (dev) (`memwal-deep-dive.md:148`).
- The two package CLAUDE.md files explicitly position OneMem on top of MemWal: sdk-ts is a "THIN wrapper over `@mysten-incubation/memwal`. We add verifiable-trace primitives on top of MemWal's account/capability model — we do NOT reimplement MemWal's primitives" (`packages/sdk-ts/CLAUDE.md`); the contract CLAUDE.md says "we sit on top of MemWal — its account.move + version pattern is what we lift" (`contracts/onemem/CLAUDE.md`).

### How OneMem consumes MemWal (the memory layer, `memory.ts`)

- `MemoryAPI` (`packages/sdk-ts/src/memory.ts`) wraps MemWal's `/manual` flow via `MemWalManual` imported from `@mysten-incubation/memwal/manual` (lazily, `memory.ts:16,146-163`).
- `MemoryConfig` fields consumed: `delegateKey` (Ed25519 delegate private key hex), `accountId` (MemWalAccount Sui object id), `embeddingApiKey`, `memwalPackageId`, `relayerUrl`, optional `suiPrivateKey`, optional `namespace` (`memory.ts:21-37`).
- `MemWalManual.create({...})` is passed: `key: delegateKey`, `suiPrivateKey`, `embeddingApiKey`, `packageId: memwalPackageId`, `accountId`, `serverUrl: relayerUrl`, `suiNetwork`, `suiClient` (the shared OneMem Sui client), `namespace` (`memory.ts:149-160`).
- `add(text)` calls `memwal.rememberManual(text, namespace)`; computes `inputHash = sha256(text)`; and **if** `sessionId` + `onememNamespaceId` + `rwCapId` are all supplied, it additionally emits a OneMem `ActionCall` via `this.client.traces.appendCall({ ..., toolName: "memwal_write", toolNamespace: "@onemem/sdk-ts", input: { walrusBlob: remembered.blob_id, hash: inputHash }, label: "memory" })` (`memory.ts:170-200`). This is the OneMem-specific differentiator — the on-chain attestation MemWal doesn't ship (`memory.ts:1-7`).
- `search(query)` calls `memwal.recallManual(query, topK, namespace)`; maps hits to `{ text, walrusBlobId, relevance: max(0, 1-distance) }`, dropping vector-only hits without decrypted `text` (`memory.ts:218-236`).
- `getAll()` derives a memory inventory **from chain**, not from MemWal: it queries `ActionCallEmittedEvent` and keeps only events where `tool_name === "memwal_write"` (`memory.ts:244-288`). Comment notes MemWal 0.0.5 has no list endpoint.
- `scripts/setup-memwal.mts` programmatically provisions a **testnet** MemWalAccount + registers a delegate key, using `createAccount` and `addDelegateKey` from `@mysten-incubation/memwal/account`. It documents that the Walrus Memory Playground (`memory.walrus.xyz`) creates MAINNET accounts, so for a consistent testnet build OneMem creates the account itself. Reads env `MEMWAL_PACKAGE_ID`, `MEMWAL_REGISTRY_ID`, `ONEMEM_DELEGATE_PUBKEY`; owner = first key in `~/.sui/sui_config/sui.keystore`; the contract allows one account per address (`scripts/setup-memwal.mts:1-90`).
- CLI builds `MemoryConfig` from env + `~/.onemem/credentials.json` (env wins per-field); `MEMWAL_PACKAGE_ID` is a required field surfaced in the missing-config error; users run `onemem login` for delegate/account credentials (`packages/cli-ts/src/util/memory-config.ts:48-67`).

### The OneMem Move package — location and structure

- Package root: `/Users/abu/dev/hackathon/sui-overflow/onemem/contracts/onemem/`. Manifest `Move.toml`: package name `onemem`, edition `2024.beta`, version `0.1.0`, named address `onemem = "0x0"`, dev-address `0xCAFE`. No explicit `Sui` dep (auto-injected by CLI 1.72+) (`contracts/onemem/Move.toml`).
- Source modules in `contracts/onemem/sources/`: `registry.move`, `namespace.move`, `trace.move`, `events.move`, `seal_policy.move`, `version.move`. (`build/` is a compiled mirror, including framework dependency `.move` files.)
- Tests in `contracts/onemem/tests/`: `seal_approve_tests`, `registry_tests`, `trace_tests`, `merkle_chain_tests`, `integration_tests`, `namespace_tests`, `version_tests`, `capability_transfer_tests`, `trace_compat_tests`, `admin_revoke_tests`.

### Move objects, capabilities, and functions (as implemented)

**`namespace.move`** (`onemem::namespace`):
- `MemoryNamespace has key` (shared object): fields `owner`, `name`, `namespace_kind: u8`, `seal_package_id: ID`, `walrus_blob_count: u64`, `last_action_call_id: Option<ID>`, `merkle_root: vector<u8>`, `created_at`, `active: bool`. Version stored as dynamic field (not a struct field) via `onemem::version` (`namespace.move:82-100`).
- `NamespaceCapability<phantom KIND> has key, store` with field `namespace_id: ID`. Phantom witness types: `ReadOnly`, `ReadWrite`, `Admin` (each `has drop`) (`namespace.move:62-76`).
- Namespace kinds: `KIND_USER=0, AGENT=1, ORG=2, SESSION=3, SHARED=4` (`namespace.move:39-49`).
- Functions: `create(registry, name, kind, seal_package_id, clock, ctx)` mints a shared `MemoryNamespace` + an Admin cap transferred to sender, and calls `registry::register` for `(owner, name)` dedup (`namespace.move:143-190`). `mint_capability_readwrite` / `mint_capability_readonly` (Admin-gated, transfer cap to recipient) (`namespace.move:195-232`). `revoke_capability<KIND>` (burns a held cap) (`namespace.move:237-244`). `admin_revoke_capability(ns, admin, cap_id)` records a namespace-level revoke marker as a dynamic field (does not delete the holder's cap) (`namespace.move:251-265`). `deactivate` / `reactivate` (soft-delete) (`namespace.move:269-282`). Gate helpers `assert_cap_for_namespace` (checks `namespace_id` match + not revoked) and `assert_active` (`namespace.move:316-329`).

**`trace.move`** (`onemem::trace`), `VERSION = 1`:
- `TraceSession has key` (shared object): `namespace_id: ID`, `agent_id`, `environment`, `sdk_version`, `started_at`, `ended_at: Option<u64>`, `root_call_id`, `last_call_id`, `call_count`, `last_content_hash: vector<u8>`, `merkle_root: vector<u8>`, `status: u8`, `captured_by_address` (`trace.move:52-72`).
- `ActionCall has key, store` (stored as a dynamic field on `TraceSession.id`, keyed by the call's own `ID`): `session_id`, `parent_call_id: Option<ID>`, `tool_name`, `tool_namespace`, `walrus_input_blob: String`, `walrus_output_blob: Option<String>`, `input_hash`, `output_hash: Option<vector<u8>>`, `content_hash`, `prev_hash`, `started_at`, `ended_at`, `status: u8`, `captured_by_address`, `label: Option<String>` (`trace.move:76-93`).
- `open_session(ns, cap: &NamespaceCapability<ReadWrite>, agent_id, environment, sdk_version, clock, ctx)` — requires an RW cap, asserts namespace active + cap-for-namespace, initializes `merkle_root`/`last_content_hash` to 32 zero bytes (`ZERO_HASH`), emits `TraceSessionOpenedEvent`, shares the session (`trace.move:103-144`).
- `emit_call(session, ns, cap: &NamespaceCapability<ReadWrite>, parent_call_id, tool_name, tool_namespace, walrus_input_blob, input_hash, label, clock, ctx): ID` — version-gated, requires ACTIVE session and matching namespace; computes `content_hash = sha2_256(tool_name || tool_namespace || input_hash || parent_tag[|| parent_id_bytes])`; advances `merkle_root' = sha2_256(running_root || content_hash)`; adds the `ActionCall` as a dynamic field; emits `ActionCallEmittedEvent`; returns the new call ID (`trace.move:151-214,334-362`).
- `close_call_with_namespace(session, ns, cap, call_id, walrus_output_blob, output_hash, status, clock, ctx)` — sets output fields + status; emits `ActionCallClosedEvent`. Valid statuses exclude `CALL_PENDING` (`trace.move:231-260`).
- `close_session_with_namespace(session, ns, cap, final_status, clock, ctx)` — final status must be COMPLETED(1)/FAILED(2)/ABORTED(3); emits `TraceSessionClosedEvent` (`trace.move:273-300`).
- Deprecated wrappers `close_call` and `close_session` both `abort ENamespaceRequiredForClose` (old ABI that can't check namespace-scoped revoke markers) (`trace.move:218-271`).
- Status enums: session `ACTIVE=0, COMPLETED=1, FAILED=2, ABORTED=3`; call `PENDING=0, SUCCESS=1, FAILURE=2, TIMEOUT=3, CANCELLED=4` (`trace.move:30-41`).

**`events.move`** (`onemem::events`): defines `TraceSessionOpenedEvent`, `TraceSessionClosedEvent`, `ActionCallEmittedEvent`, `ActionCallClosedEvent` and emits all four via `event::emit_authenticated(...)` (`events.move:30-146`). `emit_authenticated` is confirmed present in the pinned Sui framework (`build/.../dependencies/Sui/event.move:49`). `ActionCallEmittedEvent` carries `tool_name`, `walrus_input_blob`, `content_hash`, `prev_hash`, `new_session_merkle_root`, `captured_by_address`, `captured_at`, `namespace_id`, `call_id`, `parent_call_id`, `label` (`events.move:52-67`).

**`registry.move`** (`onemem::registry`), `VERSION = 1`: `OneMemRegistry has key` (shared, `namespace_index: Table<NamespaceKey, ID>`), `RegistryAdminCap`. `init` shares the registry + transfers `RegistryAdminCap` to deployer, emits `RegistryInitialized`. `register(owner, name, namespace_id)` aborts `EAlreadyRegistered` on dup, emits `NamespaceRegisteredEvent`. `bump_package_version` gated by `&RegistryAdminCap` (`registry.move:38-157`). Pattern lifted from MemWal's `AccountRegistry`.

**`seal_policy.move`** (`onemem::seal_policy`): `seal_approve<KIND>(id, ns: &MemoryNamespace, cap: &NamespaceCapability<KIND>, ctx)` — generic over cap kind (any kind authorizes decryption at v0.1); aborts `ENamespaceInactive` if namespace inactive, `EUnauthorized` if cap not for `ns`; treats `id` as opaque at v0.1 (`seal_policy.move:38-52`).

### Deployed package id(s) + network

From `config/networks.json` (and mirrored verbatim in the codegen-emitted `addresses.ts`):
- `active` network = **testnet**. Only testnet is populated; mainnet/devnet/local blocks are empty strings.
- testnet:
  - `package_id` (current/upgraded, used as Move call target): `0xc2e839c719e1c61222440f5661199e68de5413d8cfb49dd8bae3223e92fcf138`
  - `original_package_id` (used for type identifiers/event types): `0x64c14fc069fe3d3584b8474b4e9b58beb55373767edecedf6e4c53732d4ceafc`
  - `registry_id`: `0x3c78a19edad83c6e7d62b4ccd2941531b7b0551f499b961e89ca8355c7ae16e0`
  - `registry_admin_cap_id`: `0x37cc50ed36d5da9ba043e599683f0b961f1b655c42e7dba0f832aa35d52f3d68`
  - `upgrade_cap_id`: `0x2834843d375d7c74d2eba35b8a1919dcd686c11e62e0993fa39577f1bb8151a9`
  - `deployer_address`: `0x633dbf84ab127de37c212dfe4ceb75ee254ae26ad78a68e6b8289c7be60c235a`
  - `tx_digest`: `6aARmWJadHzwCf6iF3PooZKVSypHTL7jREsWUZEwqrhP`; `deployed_at`: `2026-06-18T12:01:45Z`
  - `rpc_url`: `https://fullnode.testnet.sui.io:443`; `suiscan_base`: `https://suiscan.xyz/testnet`
- **Live RPC confirmation (testnet, run during this research):** object `0xc2e8…f138` is a `package` owned `Immutable`; object `0x3c78…16e0` is type `0x64c14fc0…eafc::registry::OneMemRegistry`, a `Shared` object (`initial_shared_version: 349181680`). The registry's type prefix is the `original_package_id`, empirically confirming the type-vs-policy split below.
- The package id distinction between `c2e8…` and `64c1…` means the testnet package was **upgraded at least once** (original ≠ current). MemWal package id is separate and supplied via config/env (`memwalPackageId` / `MEMWAL_PACKAGE_ID`), not in `networks.json`.

### `originalPackageId` vs `packageId` distinction (as implemented)

The codebase consistently uses two distinct ids:
- `packageId` = the **current/upgraded** package, used as the **call target** for new transactions. All `tx.moveCall({ target: \`${packageId}::trace::...\` })` use it (`traces.ts:122,172,222,242`).
- `originalPackageId` = the id where types were **first defined**; used for **type identifiers and event-type filters** because struct/event types keep their original package address across upgrades. Pattern `const typePackageId = originalPackageId || packageId`:
  - `startSession` matches the created object against `${typePackageId}::trace::TraceSession` (`traces.ts:118-119,138`).
  - `appendCall` finds `${typePackageId}::events::ActionCallEmittedEvent` (`traces.ts:160-161,194`).
  - `listSessions` and `memory.getAll()` query events using `originalPackageId || packageId` (`traces.ts:285-289`, `memory.ts:253,266`).
  - `client.ts` sets Seal's `sealPackageId`/`typePackageId` to `originalPackageId || packageId` while `policyPackageId` = `packageId` (`client.ts:140-153`).
  - CLI mirrors this: `readContext` returns `packageId` and `eventPackageId = originalPackageId || packageId` (`util/sui.ts:23`); `traceList` queries events by `eventPackageId` (`commands/trace.ts:75-79`).
  - `fetchers/trace.ts` additionally derives the package id at read time by parsing the object's own type string prefix before `::trace::TraceSession`, and uses `session.packageId || packageId` for event queries (`fetchers/trace.ts:41,62-69,314`).

### Off-chain verification (re-implements the on-chain hashing)

- `verifyTraceChain(client, packageId, sessionId)` reads the session + its `ActionCallEmittedEvent`s, sorts ascending by `timestampMs`, walks the chain checking each `prev_hash` equals the predecessor's `content_hash` AND folding `runningMerkle = sha256(runningMerkle || contentHash)` to compare against on-chain `session.merkle_root`. Starts from `ZERO_HASH = new Uint8Array(32)`. Returns `{ ok, brokenAt, rootMatches, countMatches, ... }`. Needs no signer/Walrus/Seal — runs from a read-only RPC client (`traces.ts:267-269,329-389`). This mirrors `chain_hash` in `trace.move:358-362` and powers the dashboard `/verify/[session_id]` page (per file header comments).

## Inferences

- The current/original testnet package id mismatch (`c2e8…` ≠ `64c1…`) means the package was upgraded at least once since first publish; `networks.json` does not record how many upgrades, only the two endpoints (inference from the two distinct ids + the registry type carrying the original id).
- The Move `seal_package_id` field on `MemoryNamespace` and OneMem's own `seal_approve` are OneMem's per-namespace decryption policy, distinct from MemWal's account-wide `seal_approve`; the `memory.ts` MemWal blobs are gated by MemWal's policy, while native OneMem trace payloads (the `traces.ts` content path) are gated by OneMem's `seal_policy::seal_approve`. The two Seal policies coexist but are separate surfaces (inference from reading both `seal_policy.move` and `memory.ts`; not stated as a single explicit cross-reference in code).

## Unknowns And Questions

- Exact MemWal testnet `MEMWAL_PACKAGE_ID` / `MEMWAL_REGISTRY_ID` / relayer URL values actually used: not in any committed file inspected; they live in `.env` / `~/.onemem/credentials.json` (referenced by `setup-memwal.mts` and `memory-config.ts`) which were not read.
- Whether a MemWal account/delegate key has actually been provisioned and whether any real `memwal_write` ActionCall exists on testnet: not verified on-chain in this pass (would require querying `ActionCallEmittedEvent` for `tool_name == "memwal_write"`).
- The `version.move` contents were not opened in full this pass (its API is used: `add_initial_version`, `assert_version_matches`, `bump_version`); exact internals/`VERSION_DF_KEY` not directly read from the OneMem source (the `b"version"` key detail comes from the MemWal deep-dive doc describing MemWal, not OneMem's `version.move`).
- Whether MemWal SDK version actually resolved in the lockfile matches the declared peer range `^0.0.5`: not checked (lockfile not inspected).