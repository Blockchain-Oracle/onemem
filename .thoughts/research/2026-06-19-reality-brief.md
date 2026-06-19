# CONSOLIDATED REALITY BRIEF — OneMem Reset

## Scope

Single merged facts-only brief reconciling six reality briefs (walrus, seal, memwal-sui, repo-inventory, thoughts-audit, mem0-ui-docs, handbook-resources) against three adversarial verifications (decentralization-seam, deletion-safety, handbook-accuracy). Reality only — current state of the OneMem monorepo at `/Users/abu/dev/hackathon/sui-overflow/onemem`, the decentralization stack it builds on, its `.thoughts` artifact tree, reference UX/docs, and the Sui Overflow 2026 Walrus track requirements. Conflicts resolved in favor of CONFIRMED verification facts; REFUTED/UNVERIFIABLE claims demoted to Unknowns. No solutions, architecture, or recommendations.

---

## 1) Decentralization Stack — Walrus / Seal / MemWal + Sui, and how OneMem uses them

### 1.1 Walrus (decentralized blob storage)

- Walrus = decentralized blob store using **Sui for coordination/governance**: blob metadata/availability tracked on Sui; blob bytes erasure-coded (scheme "RedStuff", encoding type `RS2`) across storage nodes (`/mystenlabs/walrus` docs; OneMem `packages/sdk-ts/src/walrus.ts:1-4`).
- Three storage interfaces exist: (1) Publisher/Aggregator HTTP API (`PUT /v1/blobs`, `GET /v1/blobs/{blobId}`), (2) `walrus` CLI, (3) `@mysten/walrus` TS SDK. **OneMem uses only the TS SDK** — no HTTP aggregator/publisher hosts and no `walrus` CLI invocations appear anywhere in OneMem source (grep-confirmed; only upload-relay hosts at `walrus.ts:21-22`).
- Blob ID = content-derived base64url string (e.g. `M4hsZGQ1oCktdzegB6HnI6Mi28S2nqOPHxK-W7_4BUk`), distinct from the Sui blob object id (`0x…`).
- Epoch/cost model (docs): Mainnet epoch = 14 days; Testnet = 1 day; max storage = 53 epochs; both networks 1000 shards; writes priced in WAL (1 WAL = 1e9 FROST), paid **separately from SUI gas**. Expired blobs require re-upload.
- **SDK API (CONFIRMED against installed `@mysten/walrus@1.1.7` `.d.mts`, not just docs):**
  - `suiClient.$extend(walrus({ uploadRelay: { host, sendTip: { max } } }))` → `client.walrus` (`client.d.mts:12`; `types.d.mts:53`).
  - `client.walrus.writeBlob({ blob, deletable, epochs, signer, signal, ... }) → { blobId, blobObject }` (`client.d.mts:727`). Param is `blob` — the `bl:` field in one official doc snippet is **confirmed a doc typo**; installed types name it `blob`.
  - `client.walrus.readBlob({ blobId, signal }) → Uint8Array` (`client.d.mts:135`).
  - `RetryableWalrusClientError` is an exported class (`error.d.mts:3,23`).

### 1.2 Seal (decentralized threshold encryption / secrets management)

- Seal = identity-based encryption (IBE) + threshold key servers + Move-enforced on-chain access policies on Sui. Key servers never see plaintext; all encrypt/decrypt is client-side (`docs/01-sui-ecosystem/seal-deep-dive.md:14-18`; GitHub README).
- Model: on-chain `seal_approve*` Move functions that key servers `dry_run` (abort = deny, return = grant); off-chain key servers returning t-of-n key shares; client-side encrypt/decrypt. `seal_approve` first param is `id: vector<u8>`; Seal prepends packageId to form the identity; same `id` at encrypt must be replayed in the decrypt PTB.
- SessionKey = short-lived credential (signed once per package) authorizing key-share fetches without per-request wallet popups; scoped to packageId + TTL.
- **SDK API (CONFIRMED against installed `@mysten/seal@1.1.3` `.d.mts`):**
  - `new SealClient({ suiClient, serverConfigs: [{ objectId, weight, apiKeyName?, aggregatorUrl? }], verifyKeyServers })` (`client.d.mts:6`; `types.d.mts:19-24`).
  - `client.encrypt({ threshold, packageId, id, data, ... }) → { encryptedObject, key }` (`client.d.mts:22`).
  - `client.decrypt({ data, sessionKey, txBytes, checkShareConsistency?, ... }) → Uint8Array` (`client.d.mts:52-56`). `checkShareConsistency` IS present in 1.1.3 (resolves a prior "unverified"); OneMem does not pass it.
  - `SessionKey.create({ address, packageId, ttlMin, suiClient })`, `.getPersonalMessage()`, `.setPersonalMessageSignature()`, `.isExpired()` (`session-key.d.mts:36,51,55-56`).
- Testnet key server objectId used by OneMem: `0xb012378c9f3799fb5b1a7083da74a4069e3c3f1c93de0b27212a5799ce1e1e98`, aggregator `https://seal-aggregator-testnet.mystenlabs.com` (`seal.ts:34-35`).

### 1.3 MemWal (Walrus Memory)

- MemWal = Mysten "privacy-first AI memory primitive," sanctioned in the Walrus track. Move contract `memwal::account` (~660 lines): `AccountRegistry` (shared, dedup `Table<address, ID>`), `MemWalAccount` (owner + ≤20 `DelegateKey` + active), `DelegateKey` (Ed25519 pubkey + derived Sui addr + label). MemWal `VERSION = 2`. `seal_approve(id, account, ctx)` grants decryption to account owner or registered delegate (account-wide ACL, not per-blob) (`docs/01-sui-ecosystem/memwal-deep-dive.md:40-77`).
- Documented gap OneMem targets: MemWal emits **no** `MemoryWritten`/attestation event, no per-blob ACL, no audit-log object, no agent-id binding; memory state lives on the relayer's Postgres + Walrus, not on Sui events (`memwal-deep-dive.md:79-87`).
- SDK package `@mysten-incubation/memwal`; API includes `remember`/`recall`/`analyze`/`restore`/`health`/`embed` + manual variants `rememberManual`/`recallManual`. Declared as a **required (non-optional) peer dependency** `^0.0.5`. **Lockfile resolves BOTH `memwal@0.0.5` AND `@0.0.7`** (plus `@mysten-incubation/oc-memwal@0.0.4` pulling `memwal@0.0.7`) — multiple coexisting versions, not a single 0.0.5 (`pnpm-lock.yaml:431,22,360`).
- Relayer endpoints (docs): `relayer.memwal.ai` (mainnet), `relayer.staging.memwal.ai` (testnet), `relayer.dev.memwal.ai` (dev).

### 1.4 OneMem on-chain Move package (`contracts/onemem/`)

- `Move.toml`: package `onemem`, edition `2024.beta`, version `0.1.0`, addr `0x0`. Modules: `registry.move`, `namespace.move`, `trace.move`, `events.move`, `seal_policy.move`, `version.move`.
- **`namespace.move`** (`onemem::namespace`): `MemoryNamespace` (shared) fields `owner, name, namespace_kind:u8, seal_package_id:ID, walrus_blob_count, last_action_call_id, merkle_root, created_at, active`; version held as dynamic field. `NamespaceCapability<phantom KIND>` with phantom witnesses `ReadOnly`/`ReadWrite`/`Admin`. Kinds `USER=0,AGENT=1,ORG=2,SESSION=3,SHARED=4`. Functions: `create` (mints shared namespace + Admin cap + registry register), `mint_capability_readwrite/readonly` (Admin-gated), `revoke_capability`, `admin_revoke_capability` (records dynamic-field marker, doesn't delete holder's cap), `deactivate`/`reactivate`.
- **`trace.move`** (`VERSION=1`): `TraceSession` (shared) + `ActionCall` (stored as dynamic field on session, keyed by call ID). `open_session(ns, &NamespaceCapability<ReadWrite>, ...)`; `emit_call(..., &NamespaceCapability<ReadWrite>, ...)` computes `content_hash = sha2_256(tool_name||tool_namespace||input_hash||parent_tag[||parent_id])`, advances `merkle_root' = sha2_256(running_root||content_hash)`, returns call ID; `close_call_with_namespace`/`close_session_with_namespace`. Deprecated `close_call`/`close_session` both `abort ENamespaceRequiredForClose`. ZERO_HASH = 32 zero bytes.
- **`events.move`**: four events emitted via `event::emit_authenticated`. `ActionCallEmittedEvent` carries `tool_name, walrus_input_blob, content_hash, prev_hash, new_session_merkle_root, captured_by_address, captured_at, namespace_id, call_id, parent_call_id, label`.
- **`seal_policy.move`** (`onemem::seal_policy`): `seal_approve<KIND>(id, ns:&MemoryNamespace, cap:&NamespaceCapability<KIND>, ctx)` — any cap kind authorizes decryption at v0.1; aborts `ENamespaceInactive`/`EUnauthorized`; treats `id` as opaque. **Deployed reality CONFIRMED via RPC: `visibility=Public, isEntry=false`** — i.e. `public fun`, NOT the `entry fun` the deep-dive doc claims; testnet key servers accept it. (Demotes the prior `entry fun` convention claim.)

### 1.5 Deployed addresses (testnet) — `config/networks.json`, mirrored in `addresses.ts`

- `active = testnet`; mainnet/devnet/local blocks empty.
- `package_id` (current/upgraded, call target): `0xc2e839c719e1c61222440f5661199e68de5413d8cfb49dd8bae3223e92fcf138` — **RPC: version 2, Immutable**.
- `original_package_id` (type identifiers/event filters): `0x64c14fc069fe3d3584b8474b4e9b58beb55373767edecedf6e4c53732d4ceafc` — **RPC: version 1, Immutable**.
- `registry_id`: `0x3c78a19edad83c6e7d62b4ccd2941531b7b0551f499b961e89ca8355c7ae16e0` — **RPC: type `0x64c14fc0…::registry::OneMemRegistry`, Shared** (type prefix = original id, empirically proving the type-vs-policy split).
- `registry_admin_cap_id`: `0x37cc50ed36d5da9ba043e599683f0b961f1b655c42e7dba0f832aa35d52f3d68`; `upgrade_cap_id`: `0x2834843d375d7c74d2eba35b8a1919dcd686c11e62e0993fa39577f1bb8151a9`; `deployer_address`: `0x633dbf84ab127de37c212dfe4ceb75ee254ae26ad78a68e6b8289c7be60c235a`; `rpc_url`: `https://fullnode.testnet.sui.io:443`.
- **`tx_digest 6aARmWJadHzwCf6iF3PooZKVSypHTL7jREsWUZEwqrhP` (`deployed_at 2026-06-18`) is the v1→v2 UPGRADE tx** (commands `[MoveCall, Upgrade, MoveCall]`, published `0xc2e8` while mutating UpgradeCap `0x2834`), **NOT** the original publish of `0x64c1` (which is earlier and not recorded in the manifest). Package upgraded at least once: CONFIRMED. (Corrects the prior brief's "this tx is the deployment.")
- `originalPackageId || packageId` pattern is used throughout for type/event filters; `packageId` alone for moveCall targets; Seal `policyPackageId=packageId`, `sealPackageId=typePackageId=originalPackageId||packageId` (`client.ts:140-153`). RPC confirms current package's `seal_approve`/`emit_call` struct params all carry the original `0x64c1` address.

### 1.6 Verified end-to-end encrypted write paths — TWO DISTINCT PATHS

The two paths were previously conflated; the verification cleanly separates them.

**Path 1 — native OneMem trace payload (the true Seal→Walrus→on-chain path):**
1. `CallPayload {content, encrypt?}` → if `encrypt`, `requireSeal().encrypt(content, namespaceId)` (Seal IBE: `packageId=sealPackageId`, `id=namespaceId` — all blobs in a namespace share one Seal identity) (`traces.ts:102-115`, `seal.ts:187-202`).
2. `requireWalrus().uploadBlob(ciphertext)` → `client.walrus.writeBlob` (defaults `epochs=3`, `deletable=false`, `sendTipMax=1000` MIST, write retries=3 transient-only) → `blobId` (`walrus.ts:171-196`).
3. On-chain `trace::emit_call` stores the blobId; integrity hash = **sha256 of plaintext** (`traces.ts:107,178`).
4. **CONFIRMED requires session + namespace + ReadWrite cap** (`emit_call` takes `&NamespaceCapability<ReadWrite>`; encrypt requires `namespaceId`).

**Path 2 — MemWal memory write (REFUTED that OneMem itself does Seal/Walrus here):**
1. `memory.add(text)` → `memwal.rememberManual(text, namespace)` via `@mysten-incubation/memwal/manual`; **MemWal does the client-side Seal-encrypt + Walrus store** and returns `blob_id` (`memory.ts:170-205`).
2. OneMem **optionally** emits a OneMem `ActionCall` (`toolName="memwal_write"`, `input={walrusBlob: blob_id, hash: sha256(text)}`) — **only if `sessionId && onememNamespaceId && rwCapId` are all supplied**. Without them, the memory is still written to MemWal/Walrus but has **no on-chain attestation** (`memory.ts:186`).
3. `memory.getAll()` derives inventory from chain (`ActionCallEmittedEvent` filtered to `tool_name==="memwal_write"`), not from MemWal (no list endpoint in 0.0.5).

- Read path (both): `WalrusStore.readBlob` → `client.walrus.readBlob` (read retries=6, more generous than writes because fresh blobs propagate slowly, backoff cap 4000ms) (`walrus.ts:199-218`).
- Dashboard decrypt (`packages/dashboard/lib/decrypt.ts`): runs **server-side in the local Next.js Node runtime** (user's own machine; key in `~/.onemem`); `requireWalrus().readBlob` then `requireSeal().decrypt`. Decrypts only OneMem-sealed trace-call blobs; MemWal memory blobs use MemWal's own policy and are only retrievable via MemWal recall. The genuine browser-client-side SessionKey decrypt described in docs/settings is **aspirational, not implemented** (no client-side `@mysten/seal` import in the dashboard).
- Funding helper `scripts/get-wal.ts`: swaps testnet SUI→WAL (default 0.5 SUI) via exchange package `0x82593828…ef9f` / object `0xf4d164ea…9073` (`wal_exchange::exchange_all_for_wal`). No walrus CLI required.

### 1.7 Installed versions (lockfile)

`@mysten/walrus@1.1.7`, `@mysten/seal@1.1.3` (latest npm 1.2.1 — one minor behind), `@mysten/sui@2.17.0`, `@mysten/walrus-wasm@0.2.2`, `@mysten-incubation/memwal@0.0.5` AND `0.0.7`, `@mysten-incubation/oc-memwal@0.0.4`.

---

## 2) Current Repo Architecture

### 2.1 Workspace declaration

- pnpm workspaces: `packages/*`, `apps/*`, `demos/*`. Python uv workspace members: `sdk-python`, `cli-python`, `plugin-hermes`, `provider-crewai`, `provider-livekit`, `provider-elevenlabs`. `services/*` (Rust) and `contracts/*` (Move) are NOT workspace members.

### 2.2 Package/app map (TS)

- **`@onemem/sdk-ts`** (0.6.3) — core verifiable memory + trace SDK (Sui/Walrus/Seal/MemWal); bins `onemem-trace`, `onemem-memory`; exports `.` + `./runtime`. Imported by nearly everything. (shared core)
- **`@onemem/worker`** (0.1.0) — 127.0.0.1 daemon → local SQLite + SSE to dashboard + async on-chain reconciliation; bin `onemem-worker`. Dep of plugin-claude-code + plugin-codex; dashboard talks to it over HTTP at `127.0.0.1:4041`. (A)
- **`@onemem/mcp`** (0.6.3) — MCP server; bin `onemem-mcp`; referenced by both plugin `.mcp.json` via `npx -y @onemem/mcp@latest`. (B, serves A)
- **`@onemem/cli`** (0.6.3) — bin `onemem`; spawns `onemem-dashboard`. Leaf binary. (shared/B)
- **`@onemem/dashboard`** (0.1.4) — Next.js 15 viewer, localhost:4040; bin `onemem-dashboard`; consumed by hosted-dashboard. (A)
- **`@onemem/brand`** (0.1.2) — shared assets; consumed by dashboard, landing, hosted-dashboard. (shared)
- **`@onemem/claude-code-plugin`** (0.1.1) — Claude Code hooks plugin; source of root marketplace. (A)
- **`@onemem/codex-plugin`** (0.1.2) — Codex plugin; dep `@onemem/worker`. (A)
- **`@onemem/oc-onemem`** (0.2.5) — OpenClaw plugin; bin `oc-onemem`. (A)
- **`@onemem/vercel-ai-provider`** (0.1.4) — Vercel AI SDK provider. (B)
- **`@onemem/openai-agents`** (0.1.5) — OpenAI Agents provider. (B)

Python: **`onemem-sdk-python`** (0.2.0, read-only verifier core), **`onemem-cli`** (0.1.0, "read-only mirror of canonical TS CLI"), **`hermes-onemem`** (0.2.0, stdlib, shells `onemem-trace`), **`onemem-crewai`/`onemem-livekit`/`onemem-elevenlabs`** (0.1.1 each, stdlib, shell `onemem-trace`).

Apps: **`@onemem/hosted-dashboard`** (Enoki wrapper + public verify), **`@onemem/landing`**, **`apps/docs`** (Mintlify, no package.json — not a workspace member).

Demos (all private, dep sdk-ts): `agent-sends-money`, `multi-agent-coordination`, `switch-laptops`, `verifiable-research-agent`.

Services: **`services/nautilus-relayer`** (Rust, empty deps, "Pillar 12 stretch / skeleton only").

### 2.3 Internal dependency edges (verified)

- `@onemem/sdk-ts` ← cli-ts, mcp-server, worker, plugin-claude-code, plugin-codex(dev), plugin-openclaw, provider-vercel-ai, provider-openai-agents, dashboard, all 4 demos.
- `@onemem/worker` ← plugin-claude-code, plugin-codex.
- `@onemem/brand` ← dashboard, landing, hosted-dashboard.
- `@onemem/dashboard` ← hosted-dashboard.
- `onemem-sdk-python` ← cli-python, provider-crewai/livekit/elevenlabs.

### 2.4 Candidate-unused packages — deletion-safety verdicts

Verdicts reconciled with the deletion-safety verification (which checked CI, structure tests, uv/pnpm membership, install-strings, `.mcp.json`, `turbo.json`, workflows):

| Package | Verdict | Binding references found |
|---|---|---|
| `services/nautilus-relayer` | **SAFE-CANDIDATE (truly isolated)** | Zero inbound of any kind (no dep, no import, no CI, not a workspace member). Only prose in docs. Strongest isolation signal. |
| `provider-openai-agents` | **SAFE-CANDIDATE (no code/dep edge)** | Only docs prose, structure tests (`docs-frameworks.test.ts`), `check-release-preflight.py:83`, dashboard install-string. No import/dep. |
| `provider-vercel-ai` | **SAFE-CANDIDATE (no code/dep edge)** | Only install-string `SettingsView.tsx:11`, docs, preflight, structure tests. Confirmed NOT a dashboard import. |
| `plugin-openclaw` | **SAFE-CANDIDATE as consumed (leaf)** | Only install-string `runtimes.ts:84` + onboarding page. No dep edge. (Itself depends OUT on sdk-ts.) |
| `plugin-codex` | **SAFE-CANDIDATE as consumed (leaf)** | No package declares it as dep. (Itself consumes worker/mcp/sdk-ts.) |
| `cli-python` | **IN-USE (CI + uv workspace)** | `ci.yml:84` pytest target; uv member; structure tests. No internal *dep* edge. README: "read-only mirror." |
| `plugin-hermes` | **IN-USE (CI + uv workspace)** | `ci.yml:84`; uv member. `dependencies=[]`. |
| `provider-crewai` | **IN-USE (CI + uv workspace)** | `ci.yml:84`; uv member; depends OUT on sdk-python. |
| `provider-livekit` | **IN-USE (CI + uv workspace)** | `ci.yml:84`; uv member; depends OUT on sdk-python. |
| `provider-elevenlabs` | **IN-USE (CI + uv workspace)** | `ci.yml:84`; uv member; depends OUT on sdk-python. |
| All 4 `demos/*` | Leaf (expected) | No internal dependents; root `test:demo-matrix` filters `./demos/*`. |
| `apps/landing`, `apps/hosted-dashboard`, `apps/docs` | Terminal apps (expected) | No dependents. |

Notes (verification): "no internal dependents" is **expected, not evidence of unused** for leaf plugins, providers, CLIs, apps, demos. `@onemem/mcp`/`oc-onemem`/`vercel-ai-provider` are runtime/published-name or install-string coupled, not dep-graph coupled. `tsconfig.base.json` has no path aliases. `check-release-preflight.py` names every publishable package (incl. all candidates).

### 2.5 SDK-like / fidelity-split pairs (evidence)

- `@onemem/sdk-ts` (full write+read) vs `onemem-sdk-python` (read-only verifier subset).
- `@onemem/cli` (full provision/verify) vs `onemem-cli` (read-only mirror).
- All four Python framework providers share one pattern: stdlib tracer shelling out to TS `onemem-trace` (`_DEFAULT_TRACE_CMD = "npx -y -p @onemem/sdk-ts@latest onemem-trace"`).
- `@onemem/dashboard` (package) vs `apps/hosted-dashboard` (Enoki wrapper re-serving it via `transpilePackages`).

---

## 3) `.thoughts` Inventory + Salvage Candidates

- 357 files, 4.8 MB, 13 subdirs, dated Jun 17–19 2026. Structure: `design/` (8 + target-architecture/ with 7 md + 4 PNG ≈2.5MB), `goals/` (1), `handoffs/` (3), `plans/` (~70), `prototype-discovery/` (1), `quality/` (1), `raw/` (1), `research/` (~75 incl. `grounding/` + `grounding/v1/`), `specs/` (~53), `stories/` (~52), `verification/` (~74), `wiki/` (4).
- The `plans/research/specs/stories/verification` quintets = Context Engineering pipeline (one slug per feature per stage); bulk are reconstructable process narrative.

**Uniquely valuable, NON-reconstructable (only in `.thoughts`, not in code):**
- **Flagship `vercel-ai` TraceSession `0x2571e27b…44117a6`** (the keystone proof object) — `goals/2026-06-19-onemem-build-goal.md:24`, `plans/2026-06-19-build-roadmap.md:17`.
- **~30+ demo/smoke session, namespace, cap object IDs** each living in 1–2 files: live share/revoke namespace `0x362495a8…b254fd` + ReadOnly cap `0xcf95dbe4…24ef90b`; public-verify demo session `0x6ceaab0f…3ec080`; Codex hook session `0x0c883176…04e330`; MCP attestation session `0x00770b3a…23f3` + callId `0x6449943b…`; multi-agent/switch-laptops/research demo sessions. Chain still holds the objects; the human-readable mapping exists nowhere else.
- **Live deployment evidence**: domains `onemem.xyz` + `app.onemem.xyz` (HTTP 200 as of Jun 18); Vercel deployment IDs `dpl_7QVMXfRcGiH4nTus31KWUBCYNbHK` (onemem.xyz), `dpl_BtEdipDexSrxYPgYniqWiJ7ZGvU7` (app.onemem.xyz), `dpl_F4iKnanzYDEq968cbtq1Z3hHNwLb` (onemem-docs); public verify URL `app.onemem.xyz/verify/0x6ceaab0f…3ec080`.
- **Operational decisions with no code trace**: "execution location determines product surface" principle (remove framework cards from local dashboard, keep adapter packages shipping); demo scope "laptop runtimes + public /verify + ONE deployed adapter (Vercel AI)"; testnet faucet operational fact (CLI faucet dead → use `POST https://faucet.testnet.sui.io/v2/gas`); v1→v2 upgrade post-mortem (verifier switched from package-ID equality to `::registry::OneMemRegistry` suffix check).
- 4 PNG design screenshots (`landing-after.png` 1.67MB + 3 trace/namespace shots).
- Persistent deployed addresses (`0xc2e8…`, `0x64c1…`, registry, caps, deployer) are ALSO in `Published.toml`/`networks.json`/`addresses.ts` → reconstructable without `.thoughts`.
- Credentials: `.thoughts` references only FILE PATHS / env var NAMES (`~/.onemem/credentials.json`, `ENOKI_PRIVATE_KEY`, `OPENAI_API_KEY`, etc.) — **no secret material**. Real secrets live in `~/.onemem/*.json` (15 files) + `~/.onemem/worker.db`, outside the repo.

---

## 4) Reference UX/Docs Reality

### 4.1 Mem0 docs (`docs.mem0.ai`) — Mintlify

- Mintlify confirmed (`docs.json:2` `$schema: https://mintlify.com/docs.json`; mintcdn refs live). Theme `aspen`, primary `#8F74E0` (purple).
- IA: one anchor "Documentation" with **9 tabs** — Welcome, Mem0 Platform, OpenClaw, Open Source, Cookbooks, Integrations, Agent Plugins, API Reference, Release Notes. Dozens of groups (many nested), hundreds of pages, group icons. navbar CTA "Your Dashboard" → `app.mem0.ai`. PostHog + Intercom; contextual menu (copy/chatgpt/claude/perplexity/Try in Playground); ~260 redirect rules.

### 4.2 Mem0 OSS UI — two distinct apps

- **`server/dashboard`** (`mem0-dashboard`): Next.js App Router + Tailwind + shadcn + Redux; custom `mem*` design-token system (Fustat/DM Mono fonts). **Left sidebar** grouped ACTIVITY / CLOUD FEATURES (PRO-badged) / ACCOUNT. 10 dashboard pages: analytics, api-keys, categories, configuration, entities, export, memories, requests, settings, webhooks. Self-hosted gating components + empty-state art.
- **`openmemory/ui`** (OpenMemory): simpler, dark zinc shadcn defaults; **top nav** (Dashboard/Memories/Apps/Settings + Refresh + CreateMemory "+"). Routes `/`, `/memories`, `/memory/[id]`, `/apps`, `/apps/[appId]`, `/settings`. Home = `Install` (tabbed copyable MCP install snippets per client) + `Stats` + memory filters/section. Dedicated `skeleton/` loading states.

### 4.3 OneMem `apps/docs` — Mintlify

- Mintlify confirmed (`docs.json:2`). Theme `mint` (NOT Mem0's aspen). Primary `#4F46E5` indigo. Canonical `docs.onemem.xyz`. Footer: github only.
- IA: one tab "Documentation", **4 groups, 9 pages, no anchors/icons** — Get Started (introduction, quickstart), Concepts (memory, trace, verify), Integrations (runtimes, providers), Reference (cli, sdk).
- Content product-specific: positions OneMem as "decentralized persistent memory for AI agents" on Sui·Walrus·Seal·MemWal; uses `<CardGroup>`/`<Card>`/`<CodeGroup>`/`<Note>` with embedded dated publication stamps + live testnet tx digests.
- Deployment: **Mintlify static export deployed to Vercel** (`onemem-docs`, `dpl_F4iKnanz…`), not native Mintlify hosting. Local dev `npx mintlify dev`.
- **Route drift (verified fact about repo):** docs reference `app.onemem.xyz/verify/<session-id>` (`introduction.mdx:45`, `quickstart.mdx:86`, `concepts/verify.mdx`), but the dashboard package (`packages/dashboard/app/`) has **no `/verify` route** — routes present: `/`, `settings`, `sessions`, `apps`, `memories`, `share`, `trace/[session_id]`, `vendor-logo/[file]`, `api/*`. The public-share route present is `/share`. The docs' `/trace/[id]` reference matches the real `trace/[session_id]`.

### 4.4 claude-mem viewer (`src/ui/viewer`)

- Single-page React (not Mintlify/Next.js); plain CSS classes + CSS variables; real-time via SSE. Layout = `Header` + single vertical `Feed` of cards + floating buttons + modals.
- `Header`: spinning logomark + "claude-mem" wordmark, icon links (Docs/X/Discord), GitHubStarsButton, "All Projects" filter select, ThemeToggle, queue-bubble badge.
- `Feed`: merges observations/summaries/prompts, sorts by `created_at_epoch` desc, IntersectionObserver infinite scroll, ScrollToTop, empty state.
- `ObservationCard`: badge row (type/source/project/merged) + facts/narrative toggle + title + meta footer (#id·date, concept chips, read/modified file lists). `SummaryCard`: badge row + request title + up-to-four labeled sections (Investigated/Learned/Completed/Next Steps). `PromptCard` present.

---

## 5) Handbook Requirements / Resources (Sui Overflow 2026, Walrus track)

All Walrus-track sanctioned tools, hrefs, and framing quotes **CONFIRMED verbatim** against the live Notion page (Playwright, 2026-06-19); no REFUTED items in the core list.

### 5.1 Walrus track problem statement (verbatim framing)

- "This track challenges you to rethink how agentic systems are built by using Walrus as a **Verifiable Data Platform for AI**." Agents today are "stateless and fragmented," need durable memory across sessions, shared context, portable persistent data.
- "What you'll build": (1) long-term memory using **persistent, verifiable memory for agents** (links → `https://memwal.ai/`); (2) persistent data/file access via Walrus; (3) integrations/tooling to adopt Walrus or MemWal in agentic systems.
- Especially interested in: long-running stateful workflows (research/trading/monitoring agents); multi-agent coordination; artifact-driven workflows. "We're not just looking for demos — we're looking for working systems."

### 5.2 Sanctioned tools + exact links (CONFIRMED verbatim)

- Walrus docs `https://docs.wal.app/` (+ getting-started, `/docs/walrus-client` CLI, `/docs/http-api/storing-blobs`, `https://sdk.mystenlabs.com/walrus`, public aggregators/publishers).
- Walrus Sites `https://docs.wal.app/docs/sites` (+ site-builder install, publish).
- MemWal docs `https://docs.memwal.ai/`. **MemWal Playground link text = "create an account and a delegate key for your agent", but href resolves to `https://docs.memwal.ai/`** (no distinct playground URL exposed — CONFIRMED).
- MemWal GitHub `https://github.com/MystenLabs/MemWal`. Seal docs `https://seal-docs.wal.app/`. Sui Stack Messaging `https://github.com/MystenLabs/sui-stack-messaging`. Walrus Telegram `https://go.sui.io/ofw-walrus-tg`, Discord `https://discord.com/invite/walrusprotocol`. MemWal workshop video `https://youtu.be/GncjVUEJw9Y`.
- Office hours: **Abner (Walrus)** `https://calendar.app.google/bUkFydDYhHb2rQxAA` "Idea validation and project discussions relating to Walrus."

### 5.3 Prizes, judging, timeline, submission (CONFIRMED)

- **Walrus track prizes:** 1st **$35,000** / 2nd $15,000 / 3rd $7,500 / 4th $5,000 + $7,500 honorable mentions. University Award: 10×$2,500 (≥50% student). Post-hackathon $250,000+ value.
- **Judging weights:** Real-World Application 50% · Product & UX 20% · Technical Implementation 20% · Presentation & Vision 10%.
- **Award/mainnet rule:** 50% on winner announcement, 50% after successful mainnet deploy; **100% upfront if already on mainnet by August announcement**. Mainnet must meet sponsor-defined minimum functional requirements.
- **Timeline (Pacific):** May 7 launch · May 7–Jun 21 build · **Jun 21 6:00 PM PT submission deadline** · Jul 8 shortlist · **Jul 20 Demo Day = Agentic Web + Walrus** · Aug 27 winners. Demo Day virtual (Zoom links via email; YouTube livestream), 5 min + ≤2 min Q&A, strictly enforced.
- **Submission checklist:** Project Name, Description, Logo (1:1 JPG/PNG), Public GitHub repo (public during judging), Demo Video (YouTube ≤5 min), Website (optional), Deployment (testnet or mainnet), Package ID (if on-chain). Submit via DeepSurge.
- **Eligibility:** deployed to testnet or mainnet by shortlisting/demo day; new project or substantial new functionality built May 7–Jun 21; ≥1 member passes KYC if winning; no OFAC-sanctioned regions. One primary track per submission; subtracks are guides only; AI tools "allowed and expected."

---

## Unknowns And Questions

1. **Team-size contradiction (material, live, unresolved):** the live handbook FAQ states BOTH "Solo builders are absolutely welcome… submit on your own" AND "Teams must have at least 2 members." The locally captured copy (May 25) lacks the "≥2 members" line. Needs an organizer ruling before relying on either.
2. **MemWal Playground actual UI URL** is not exposed in the handbook (link resolves to `docs.memwal.ai/`). Confirm from the MemWal docs themselves where the account + delegate key are actually issued.
3. **Actual MemWal testnet config values** (`MEMWAL_PACKAGE_ID`, `MEMWAL_REGISTRY_ID`, relayer URL) live in `.env`/`~/.onemem/credentials.json` — not in any committed file; not read.
4. **Whether a MemWal account/delegate is provisioned and any real `memwal_write` ActionCall exists on testnet** — not queried on-chain in this pass.
5. **MemWal multi-version resolution (`0.0.5` + `0.0.7` coexisting)** — behavioral impact of the split tree vs the declared `^0.0.5` peer range not assessed.
6. **`/verify` vs `/share` route drift:** confirmed the dashboard package has no `/verify` route; whether the hosted app rewrites `/verify`→`/share` or aliases it (next.config / Vercel config) is unverified. Live state of `app.onemem.xyz/verify/…`, `onemem.xyz`, `docs.onemem.xyz`, and the recorded Vercel deployments was not re-checked today (last evidence Jun 18).
7. **`@mysten/walrus` / `@mysten/seal` latest-version delta:** seal is 1.1.3 installed vs 1.2.1 latest; walrus 1.1.7 installed — newest walrus release not queried.
8. **Mainnet Walrus/contract path untested:** `networks.json` mainnet block is empty (`package_id:""`); `upload-relay.mainnet.walrus.space` and the mainnet relayer never exercised in-repo. Walrus also effectively unavailable on devnet/local (relay hosts only for testnet/mainnet).
9. **`grounding/v1/` vs `grounding/` not diffed line-by-line** (inferred superseded from filenames/sizes/mtimes only); ~350 small pipeline files not individually opened.
10. **`version.move` internals** (`add_initial_version`, `assert_version_matches`, `bump_version`, version DF key) not read in OneMem source this pass.
11. **`turbo.json`, `deploy-walrus-sites.yml`, `release.yml`** not read in full; whether any indirect glob build includes a candidate package unverified (grep showed only `ci.yml:84` naming candidates).
12. **Submission-guide-specific quotes** ("we require your repository to be public"; "only choose ONE track per project") not re-verified live this session (separate Submission Guide page not re-fetched). The three other track problem statements + Code of Conduct not opened live.
13. **WAL cost per OneMem write** not computed (depends on live dynamic pricing + encoded blob size); `epochs=3`/`deletable=false` implies ~3 testnet-day persistence before re-upload, and OneMem has no re-upload/renewal logic.