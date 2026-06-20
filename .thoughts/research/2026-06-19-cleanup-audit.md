# OneMem Cleanup Audit — Trace/Verify + Move-Contract Removal (READ-ONLY MAPPING)

Refocus: "claude-mem + Mem0, but decentralized" — MEMORY only, built on MemWal (Walrus+Seal). The agent action-TRACE + VERIFY layer and the custom Move contract `contracts/onemem` are removed entirely. This file is a mapping only; no edits performed.

Legend: DELETE = remove file/dir. STRIP = remove trace parts, keep memory parts. KEEP = survives. REWORK = needs redesign for memory.

---

## 1. PACKAGES / APPS / SERVICES / DEMOS — DELETE

### Definitely delete (zero inbound, or trace-only)
- `services/nautilus-relayer/` — DELETE. Rust stub, `Cargo.toml` `[dependencies]` empty ("Pillar 12 stretch / skeleton only"). Zero inbound refs of any kind (not pnpm/uv member, no CI, no import). Strongest isolation signal.
- `contracts/onemem/` — DELETE entire dir. Custom OneMem Move package (registry/namespace/trace/events/seal_policy/version + 10 test modules + build/ + Published.toml + examples/ + CLAUDE.md). This IS the trace/verify on-chain layer. Memory builds on MemWal's contract, not this.
- All 4 `demos/*` — DELETE (or rebuild as memory demos). Each is a pure trace demo:
  - `agent-sends-money` — `src/mock-payment-trace.ts`: traces.startSession→appendCall→closeCall→verifySession; routes `/trace/`,`/verify/`.
  - `multi-agent-coordination` — `src/mock-multi-agent-trace.ts`: cross-linked TraceSessions.
  - `switch-laptops` — `src/mock-switch-trace.ts`: trace + MEMORY_BLOB_ID refs (hybrid, still trace-led).
  - `verifiable-research-agent` — `src/mock-research-trace.ts`: trace + memory-blob refs (hybrid).

### Reconsider scope (two-product focus = claude-mem-shaped local + Mem0-shaped SDK/MCP)
- `provider-openai-agents` (`@onemem/openai-agents`) — trace-only provider, zero code/dep inbound (docs + structure test + preflight + install-string only). Wraps a model into a trace recorder. DELETE unless rebuilt as a memory provider.
- `provider-vercel-ai`, `provider-crewai`, `provider-livekit`, `provider-elevenlabs`, `plugin-hermes` — all are trace shims (`_DEFAULT_TRACE_CMD = npx … onemem-trace`; Python shells `onemem-trace`). They emit traces, not memories. DELETE or REWORK to memory (`onemem-memory` bin already exists). The 5 Python ones are CI-pinned (`ci.yml:84`) + uv members + structure-test enumerated — deleting requires editing those too.
- `cli-python` (`onemem-cli`) — "read-only mirror of TS CLI"; its verify/trace mirror dies. DELETE or shrink to memory mirror. CI-pinned + uv member + structure test.
- `plugin-codex`, `plugin-openclaw`, `plugin-claude-code` — KEEP the packages but REWORK (see §4 + plugins below). Today they capture tool-call TRACES; for a memory product they must capture/inject MEMORIES.

### KEEP (memory core / shared / infra)
- `sdk-ts` — KEEP, STRIP trace (see §2).
- `mcp-server` (`@onemem/mcp`) — KEEP, STRIP 4 trace tools (see §2/§4).
- `cli-ts` (`@onemem/cli`) — KEEP, STRIP trace/verify commands (see §4).
- `worker` — KEEP, STRIP anchor/reconciler (see §2). Local SQLite + SSE survives 100%.
- `dashboard` — KEEP, STRIP trace/sessions/verify routes (see §2).
- `brand` — KEEP (shared assets).
- `sdk-python` — KEEP if Python memory kept; STRIP its verifier (read-only verify of trace chain).
- `apps/hosted-dashboard` — KEEP, STRIP `/verify`, `/n`, trace onboarding (see §4).
- `apps/landing` — KEEP, REWRITE copy (trace-led → memory-led).
- `apps/docs` — KEEP, STRIP trace/verify pages (see §2/§5).

Note: `@onemem/mcp`, `@onemem/oc-onemem`, `@onemem/vercel-ai-provider` are referenced by published-name/install-string, not dep edges — pure dep-graph "unused" is misleading for them.

---

## 2. DEAD-CODE SURFACE (trace / verify / attestation / Move)

### sdk-ts (packages/sdk-ts/src/)
DELETE: `traces.ts` (TracesAPI, verifyTraceChain, startSession/appendCall/closeCall/endSession/verifySession), `fetchers/trace.ts`, `types/move.ts` (Move type bindings, hand-written), `generated/addresses.ts` (AUTOGEN from contract), `version.ts` is shared KEEP.
- `seal.ts` — DELETE. SealStore encrypts trace payloads with `packageId = OneMem package`, decryption gated by `onemem::seal_policy::seal_approve` (seal.ts:4-14,177,191-200). MemWal memory does its OWN Seal internally (`@mysten-incubation/memwal/manual`) — this OneMem-contract-gated Seal is trace-only.
- `walrus.ts` — DELETE. "Walrus blob storage for OneMem trace content" (walrus.ts:1,146). Memory's Walrus writes happen inside MemWal. The OneMem-direct Walrus store is trace-only.
- `namespaces.ts`, `namespace-capabilities.ts`, `namespace-history.ts` — DELETE. OneMem on-chain MemoryNamespace + NamespaceCapability are contract objects; gone with the contract. (Memory sharing must move to MemWal delegate/account model.)
- `client.ts` — STRIP. Remove `walrus`/`seal`/`namespaces`/`traces` wiring (lines 35-44,92-97,117-118,131-153,202-216), the `typePackageId`/`policyPackageId` logic, `addressesFor`. KEEP: signer, network, `memory` wiring (memory.ts), `execute`/`requireMemory`. Note: MemWal manual needs a Sui client + private key, NOT the OneMem package addresses.
- `runtime.ts` — STRIP. DELETE `ensureNamespace` (provisions OneMem ns+cap, lines 171-208), `recordSession` (lines 221-288), `createTraceRecorder`/`TraceRecorder` (lines 318-399), trace re-exports. KEEP `resolveSigner`, `resolveNetwork`, `ensureGas`, faucet, and the memory re-exports (runtime-memory, credentials, runtime-controls).
- `runtime-memory.ts` — KEEP (createMemoryRecorder/recall/capture/injectMemories). Imports `resolveNetwork`,`resolveSigner` from runtime.ts (keep those).
- `memory.ts` — STRIP. KEEP add/search/getMemWal/dispose. Remove the on-chain ActionCall attestation: `AddMemoryArgs.{sessionId,onememNamespaceId,rwCapId}` (lines 44-49), the appendCall block (lines 180-200), `MemoryAttestationError` (lines 118-130), and `getAll()` (lines 244-288, derives memory list from `memwal_write` ActionCallEmittedEvent — that event vanishes with the contract). Memory list needs a new source (MemWal has no list in 0.0.5).
- `credentials.ts` — KEEP (delegate key / accountId / embeddingApiKey / relayerUrl resolution = pure memory).
- `runtime-controls.ts` — STRIP/REWORK. Today gates trace capture (`shouldTraceRuntime`). Reframe as memory-capture controls or delete.
- `index.ts` — STRIP all trace/namespace/seal/walrus re-exports (lines 67-134 mostly); keep memory + signer/network + VERSION.
- bins: `bin/onemem-trace.mjs` DELETE; `bin/onemem-memory.mjs` KEEP.

### worker (packages/worker/src/)
- DELETE: `anchor.ts` (+ `anchor.test.ts`) — pushes tool-call traces on-chain via TraceWriter (= onemem.traces). `reconciler.ts` (+ `reconciler.test.ts`) — proof-status reconciliation loop.
- STRIP `index.ts`: remove anchor/reconciler imports+re-exports, `StartWorkerOptions.{anchor,reconcileIntervalMs}`, reconcile loop (lines ~54-71).
- STRIP `bin/onemem-worker`: remove OneMem/resolveSigner imports, `maybeAnchor()`, `ONEMEM_NAMESPACE_ID/RW_CAP_ID/PRIVATE_KEY/SUI_NETWORK/AGENT_ID/SDK_VERSION` reads. Keep DB/host/port.
- STRIP `store.ts`: `proof_status`,`call_id`,`tx_digest` columns + `setProofStatus()`/`pendingProof()` are trace-only (can leave columns unused or drop). KEEP observations/sessions schema + SSE.
- STRIP `server.ts`: remove `proof_update` broadcast. KEEP /health,/stream,/api/sessions*,/api/observations.
- `package.json`: drop `@onemem/sdk-ts` dep (only the bin used it for anchoring).
- Tests: DELETE anchor/reconciler tests; UPDATE store.test.ts (proof-status flow) + index.test.ts (anchor-loop test). KEEP server.test.ts.

### dashboard (packages/dashboard/)
DELETE routes: `app/sessions/`, `app/trace/[session_id]/`, `app/api/sessions/{verify,[id],export}`, `app/api/trace/[session_id]/export`, `app/api/stream` (polls recent sessions). REWORK `app/page.tsx` (Overview, session-led) → memory overview. `app/api/overview` (stats.ts session count) → memory-only.
DELETE lib: `trace.ts` (verifyTraceChain), `sessions.ts`, `session-export.ts`.
STRIP lib: `decrypt.ts` (decrypts OneMem-sealed trace blobs via seal.ts — dies with seal.ts), `memory-origin-verify.ts` (calls /api/sessions/verify), `stats.ts` (drop session count), `runtimes.ts` (drop fetchRecentSessions session stats, lines ~210), `memory.ts` (fetchMemories derives from `memwal_write` ActionCallEmittedEvent — re-source).
KEEP lib: `memory-view.ts`, `local-credentials.ts`, `local-worker.ts`, `namespaces.ts` (rework if namespaces removed), `vendor-logos.ts`.
NAV (`components/AppShell.tsx:15-21`): remove Sessions tab + any /trace links; keep Memories/Integrations/Share?/Settings.

### scripts/
DELETE: `codegen-move-types.ts`, `codegen-move-python.py`, `deploy-contract.sh`, `migrate-contract.sh`, `verify-mainnet.sh`, `sdk-smoke-testnet.ts` (smokes trace APIs).
KEEP: `get-wal.ts` (SUI→WAL for Walrus, external exchange), `setup-memwal.mts` (MemWal account+delegate = memory), `deploy-walrus-sites.sh`, `bootstrap-dev.sh` (update stale `sui move build` comment), `publish-all.sh`, `check-release-preflight.py` (update package list), `check-registry-status.py`, `install-lefthook-if-git.mjs`.

### tests/structure/ — heavily contract/trace coupled (helpers.ts)
- `MOVE_MODULES`, `MOVE_TESTS` (helpers.ts:65-84) — DELETE.
- `SCRIPTS` (86-97) — drop codegen/deploy/migrate/verify entries.
- `HOSTED_DASHBOARD_ROUTES` (55-63) — drop `verify/[session_id]`.
- `GH_WORKFLOWS` (123-128) — drop `deploy-contract.yml`.
- `TS_PACKAGES`/`PY_PACKAGES` (25-45) — drop deleted providers/plugins.
- `EXPECTED_CLAUDE_MD` (133-138) — drop `contracts/onemem/CLAUDE.md`.
- `ROOT_CONFIGS` — `config/networks.json`/`networks.schema.json` may go (contract manifest).
- Test files to DELETE/REWORK: `protocol.test.ts`, `deploy-scripts.test.ts`, `walrus-static-verifier.test.ts`, `architecture-status.test.ts`, `context-artifacts.test.ts`, parts of `packages.test.ts`/`docs-frameworks.test.ts`/`registry-docs.test.ts`.

### CI / workflows
- `.github/workflows/ci.yml`: DELETE Sui CLI install (lines 27-38), "Move build + test" step (71-76). Drop deleted Python packages from pytest line (84).
- `.github/workflows/deploy-contract.yml`: DELETE entire workflow.
- `.github/workflows/deploy-walrus-sites.yml`: KEEP (deploys static site, no contract).
- `.github/workflows/release.yml`: KEEP (publishes SDK/providers; update if providers deleted).

### generated / config
- `packages/sdk-ts/src/generated/addresses.ts` — DELETE (AUTOGEN from contract).
- `packages/sdk-python/onemem/generated/addresses.py` — DELETE.
- `config/networks.json` + `config/networks.schema.json` — DELETE (OneMem contract deploy manifest). Memory needs MemWal package/registry/relayer config instead (today in .env).

---

## 3. ENVIRONMENT VARIABLES — full inventory

Only ONE env file exists: root `.env` (gitignored, no committed `.env.example`). Contains LIVE secrets (OpenAI key, Enoki keys, npm/PyPI tokens) — should be rotated regardless.

| Var | Where read | Verdict |
|---|---|---|
| ONEMEM_ACCOUNT_ID | credentials.ts:125; mcp/index.ts:9; dashboard/local-credentials.ts:119-120 | KEEP (MemWal account = memory) |
| ONEMEM_DELEGATE_KEY | credentials.ts:123; mcp/index.ts:10; sdk-ts/bin/onemem-memory.mjs | KEEP (memory write auth) |
| ONEMEM_DELEGATE_PUBKEY | .env only | KEEP (memory) |
| ONEMEM_EMBEDDING_API_KEY | credentials.ts:127; mcp/index.ts:11 | KEEP (embeddings) |
| MEMWAL_PACKAGE_ID | credentials.ts:151; turbo.json:10 | KEEP (memory) |
| MEMWAL_REGISTRY_ID | .env:11; turbo.json:11 | KEEP (memory) |
| MEMWAL_RELAYER_URL | credentials.ts:155; turbo.json:12 | KEEP (memory) |
| ONEMEM_MEMWAL_NAMESPACE | credentials.ts:159 | KEEP (memory isolation) |
| SUI_NETWORK | mcp/index.ts:349; runtime.ts:295; turbo.json:19 | KEEP (network select) |
| ONEMEM_PRIVATE_KEY / SUI_PRIVATE_KEY | mcp/signer.ts:45; runtime.ts; plugins; worker bin | KEEP (Sui signer for Seal/Walrus) |
| ONEMEM_EMBEDDING / OPENAI_API_KEY | memory paths | KEEP |
| ENOKI_PRIVATE_KEY / NEXT_PUBLIC_ENOKI_* / NEXT_PUBLIC_GOOGLE_CLIENT_ID | hosted-dashboard auth; turbo.json:8,13-15 | KEEP (login) |
| NPM_TOKEN / NODE_AUTH_TOKEN / UV_PUBLISH_TOKEN / PYPI_TOKEN | publish | KEEP (release) |
| ONEMEM_DASHBOARD_URL / ONEMEM_DASHBOARD_BIN / ONEMEM_WORKER_URL / ONEMEM_WORKER_COMMAND / ONEMEM_WORKER_AUTOSTART | cli/dashboard/plugins/worker | KEEP (local dashboard/worker) |
| ONEMEM_CREDENTIALS_PATH / ONEMEM_RUNTIME_CONTROLS_PATH | credentials/runtime-controls | KEEP (controls reworked) |
| **ONEMEM_NAMESPACE_ID** | runtime.ts:356; mcp/index.ts:339; worker bin; init.ts:39; dashboard layout/memories/settings/share; hosted /n; plugins | **REMOVE** (OneMem on-chain namespace = trace) |
| **ONEMEM_RW_CAP_ID** | runtime.ts:357; mcp/index.ts:340; worker bin; init.ts:40; plugins; hosted /n | **REMOVE** (trace write cap) |
| **ONEMEM_ADMIN_CAP_ID** | namespace.ts:36; init.ts:41; index.ts:66,76; dashboard/share | **REMOVE** (namespace admin = trace) |
| **ONEMEM_PARENT_CALL_ID** | sdk-ts/bin/onemem-trace.mjs:85; python providers | **REMOVE** (cross-runtime trace stitch) |
| **ONEMEM_TRACE_CMD / ONEMEM_TRACE_CLI** | python providers/plugin-hermes | **REMOVE** (trace shellout) |
| **ONEMEM_RPC_URL / ONEMEM_NETWORK** | trace context | review (likely keep ONEMEM_NETWORK) |
| **MEMWAL_DELEGATE_KEY** | only in dist/ (stale build), not src | n/a |
| ONEMEM_*_SMOKE_* / ONEMEM_DASHBOARD_TRACE_SMOKE_SESSION / ONEMEM_HOSTED_VERIFY_SMOKE_SESSION | smoke tests | REMOVE trace-smoke ones |
| ONEMEM_INTEGRATION | integration gate | KEEP |

Edits needed: `.env` (drop trace vars + rotate secrets); `turbo.json` build `env` array (drop ONEMEM_NETWORK if unused, keep MemWal/Enoki). No committed `.env.example` to edit — recommend ADDING one (memory-only).

---

## 4. LOGIN + CLI + PROVISIONING

### Current `onemem login` flow (precisely)
CLI (`cli-ts/src/commands/login.ts`): mints nonce, starts localhost callback server, opens `<dashboard>/cli-login?nonce&port`, waits, validates payload (`login-validation.ts`), writes `~/.onemem/credentials.json` (chmod 600).
Hosted page (`apps/hosted-dashboard/app/cli-login/page.tsx`): user connects wallet/Enoki → backend `fetchMemWalAccount(account.address)` looks up the wallet's MemWal account → if none, "Create MemWal account" button calls `${memwalPkg}::account::create_account` → user generates a delegate keypair CLIENT-SIDE (`generateDelegateKey()` from `@mysten-incubation/memwal/account`, NOT Enoki) → registers it via `${memwalPkg}::account::add_delegate_key(account, pubkey, addr, label, clock)` → signs the nonce with the delegate key → POSTs back {delegateKey(private), delegatePublicKey, delegateSuiAddress, accountId, suiAddress, memwalPackageId, relayerUrl, network, signature, delegateRegistrationDigest, activeNamespaceId, agentId, ttl...}.
`login-validation.ts` re-fetches the `add_delegate_key` tx on-chain and verifies sender/account/pubkey/address match before persisting.

### Assessment vs "user brings their OWN delegate key + account id"
- The login is ALREADY MemWal-aligned, NOT trace-coupled. It mints a MemWal delegate against a MemWal account/contract — exactly the memory primitive. The deleted-contract change does NOT break login.
- Delegate key: user-controlled (client-side keygen). FITS.
- Account id: derived from the CONNECTED wallet's MemWal account (auto-lookup, or create). It already uses the user's own account IF they connect the owning wallet. GAP: no UI to paste an arbitrary/pre-provisioned account id or a delegate from elsewhere.
- REWORK for the stated goal: (a) add a "use my own account id / delegate key" manual-entry path that skips the wallet-lookup + hosted minting, OR (b) document the env path — set `ONEMEM_ACCOUNT_ID` + `ONEMEM_DELEGATE_KEY` + `ONEMEM_EMBEDDING_API_KEY` directly (credentials.ts already prefers env over credentials.json). The hosted mint becomes one convenience option, not the only path. The whole hosted login could even be optional for a BYO-key user.
- `activeNamespaceId`/`agentId`/trace fields in the callback payload become vestigial — drop.

### CLI command set (`cli-ts/src/index.ts`)
- KEEP: `init`? — REWORK (today provisions OneMem namespace+cap via `ensureNamespace`; for memory it should ensure a MemWal account+delegate instead). `add`, `search` (memory). `login` (rework per above). `dashboard`. `health` — REWORK (checks OneMem package deploy; should check MemWal/relayer).
- DELETE: `verify <session-id>` (verify.ts), `trace list/get/events` (trace.ts + util/trace.ts), `namespace share/revoke/admin-revoke/capabilities` (namespace.ts — OneMem on-chain caps). `util/sui.ts readContext` (reads OneMem packageId).

### MCP server (`mcp-server/src/index.ts`)
- KEEP tools: `onemem_add_memory` (STRIP the attest/ActionCall branch + ambient session, lines 66-95,119-138), `onemem_search_memory`.
- DELETE tools: `onemem_verify_trace`, `onemem_trace_session`, `onemem_replay_session`, `onemem_share_namespace`, `onemem_revoke_namespace_capability` (OneMem caps), `onemem_session_status`. Remove `attestConfigFromEnv` + `ONEMEM_NAMESPACE_ID/RW_CAP_ID`.

### Plugins (claude-code / codex / openclaw) — REWORK, not delete
Today they are TRACE recorders: `plugin-claude-code/hooks/hooks.json` wires SessionStart→`inject.js` (opens `onemem.traces.startSession`), PostToolUse→`observe.js` (records each tool call as observation→on-chain ActionCall via worker anchor), Stop→`summarize.js` (closes session). All gated by `traceCaptureEnabled`. For a memory product these must become: recall memories into context on start, capture salient memories — NOT record every tool call as a verifiable trace. `onemem-lib.mjs` worker integration survives (local SQLite/SSE) but the on-chain anchor path dies.

---

## 5. MISC

- package.json (root): description still says "Verifiable cross-runtime AI agent memory + action trace layer" — rewrite. `test:demo-matrix` script dies if demos deleted. devDep both `@mysten-incubation/memwal@^0.0.7` (root) — see version split below.
- turbo.json: `deploy` task + the `env` array (drop ONEMEM_NETWORK if unused). No trace-specific pipeline beyond env.
- Demos: all reference trace/verify, NOT memory — delete/rebuild (§1).
- Docs route drift (CONFIRMED): docs reference `app.onemem.xyz/verify/<session-id>` (`introduction.mdx:43`-ish, `quickstart.mdx:86`, `concepts/verify.mdx:29`) but: (a) the dashboard package has NO `/verify` route (only `/share`, `/trace/[session_id]`); (b) hosted-dashboard HAS `/verify/[session_id]` which is being DELETED; (c) `next.config.mjs` has NO `/verify`→`/share` rewrite. So every `/verify` doc link will dangle. `/trace/[id]` references also die. `/share` is the surviving public route. Docs pages: DELETE `concepts/trace.mdx`, `concepts/verify.mdx`; REWRITE `introduction.mdx`, `quickstart.mdx`, `integrations/{runtimes,providers}.mdx`, `reference/{cli,sdk}.mdx`; KEEP `concepts/memory.mdx`; update `docs.json` nav. Root `docs/05-our-architecture/01-protocol/` + `docs/06-specs/pillar-1-protocol/` are trace/protocol — archive.
- MemWal version split (CONFIRMED in pnpm-lock.yaml): root pins `@mysten-incubation/memwal@^0.0.7` (package.json:29) but the lockfile resolves BOTH `memwal@0.0.5` (line 1462) AND `@0.0.7` (1478), plus `oc-memwal@0.0.4` (1494) which pulls 0.0.7 (pinned via the root pnpm override package.json:43-44). sdk-ts resolves against 0.0.7. The dual 0.0.5/0.0.7 tree should be consolidated to ONE version during cleanup (memory.ts uses `@mysten-incubation/memwal/manual`; confirm the chosen version's manual API). The `oc-onemem`/oc-memwal path only matters if plugin-openclaw is kept.
- AGENTS.md / CLAUDE.md / README.md: all describe a trace+verify product — rewrite to memory-only.
- Landing copy (`apps/landing/app/page.tsx`): "Merkle-chained node on Sui", "prove it", "Proof turns the page green", "Verify" — full rewrite to memory positioning.

---

## Open items / verify-before-acting
- Memory list source: `memory.getAll()` + dashboard `fetchMemories()` derive inventory from the `memwal_write` ActionCallEmittedEvent (the OneMem contract event). With the contract gone, memory listing needs a new source (MemWal 0.0.5 has no list endpoint) — design decision, not just deletion.
- Memory sharing: today via OneMem NamespaceCapability (on-chain, deleted). MemWal's delegate-key/account ACL is the replacement — `onemem_share_namespace` semantics must move to MemWal.
- Whether to keep Python side at all (sdk-python verifier is read-only trace verification — its reason to exist largely dies).
