# OneMem — Target Architecture (Single Source of Truth)

**Date:** 2026-06-19
**Author:** synthesis thread (consolidates the 6 design threads 01–06, all grounded in source + the grounding synthesis)
**Status:** AUTHORITATIVE. This is the end-state we build from. Where a thread disagrees with this file, this file wins; where this file is silent, the thread doc (`01`–`06` in this folder) is the detail.
**The one lens (never relitigate):** *EXECUTION LOCATION determines PRODUCT SURFACE.* Where code runs decides where it can honestly appear. Conflating the three locations is the entire disease; separating them is the entire cure.

**Tag legend (used everywhere):**
- **SHIPPED** — exists today, cited `file:line`. Reuse as-is.
- **BUILDABLE** — does not exist but provably constructible from confirmed primitives (the primitive is named).
- **RISKY** — feasibility NOT confirmed; the exact check to clear it is named.

---

## 1. OneMem in one paragraph + the system in words

**OneMem is the verifiable record of what your agent DID — the trace — plus memory you actually OWN.** Every agent action (tool call, MCP invocation, skill run, model call) is captured as a Merkle-chained `ActionCall` object on Sui, and every memory write is a Seal-encrypted Walrus blob your agent can recall anywhere — both anchored under an on-chain `MemoryNamespace` whose capability *you* hold. The headline is **trace-led**: "see + verify exactly what your agent did," and **anyone can independently re-verify it from chain with no login and no trust in OneMem, the vendor, or the model provider.** Memory is the substrate beneath the trace; cross-runtime breadth is a mechanism, not the pitch. Mem0 is the inspiration for the "memory everywhere, one-line" ergonomic (never a competitor); claude-mem is the inspiration for the alive-local-worker feel.

### The system diagram in words (the execution-location boundary is the whole architecture)

There are **three execution locations**, and each maps to exactly one product surface:

**(A) Laptop runtime → LOCAL surface.** Claude Code and Codex run on the *user's own machine*. Their hooks (`PostToolUse`) post each tool call to a **local worker daemon** (`127.0.0.1:4041`), which (i) writes it to local SQLite synchronously and SSE-pushes it so the **local dashboard** (`127.0.0.1:4040`) shows it *live, mid-session*, and (ii) anchors the Seal-encrypted, Merkle-chained `ActionCall`/`TraceSession` on Sui **asynchronously off the hot path** as a per-row `proof_status` (`local → queued → anchored → verified`). The local dashboard is a **no-login inspector of THIS machine only**. Cursor and Windsurf are no longer classified as MCP-only because claude-mem proves hook installers exist; in OneMem they are **hook-port-pending** local runtimes until those installers are ported and proved. Cline/OpenCode-style clients remain **MCP tools only** until equivalent native hooks are proven.

**(B) Deployed-app framework → HOSTED surface.** Vercel AI (the one featured adapter), and the catalog of OpenAI Agents / CrewAI / LiveKit / ElevenLabs, run on a *server inside an app the developer ships to their users*. They never touch the laptop. The deployed app holds a **delegate Sui keypair + ReadWrite capability** (minted during hosted onboarding, set as env vars), stamps `environment="vercel-ai"`, and writes traces directly to chain under the user's namespace. The developer watches those traces on the **hosted dashboard's namespace-scoped view** (`app.onemem.xyz`), queried purely by `namespace + environment` from on-chain events — *there is no "connected local app" concept anywhere*.

**(C) Public verify → no-login hosted page.** `app.onemem.xyz/verify/<sessionId>` re-walks the Merkle chain of `ActionCall` objects with no account, no signer, no Seal/Walrus access — it proves *sequence integrity*, not content. This is the asset that makes verifiability worth anything: a NON-owner can verify.

**The single read path that unifies A and B:** a Claude Code trace and a Vercel trace are read by the *identical* code — `queryEvents` on `TraceSessionOpenedEvent`, bucketed by `session.environment` (`dashboard/lib/trace.ts:197-217` SHIPPED). Reads unify; **controls do not** (only location-A runtimes read `~/.onemem/runtime-controls.json` — `plugin-claude-code/scripts/onemem-lib.mjs:152-159` SHIPPED). That asymmetry — reads unify, controls cannot — is why frameworks are removed from local chrome but their traces still appear everywhere.

---

## 2. Surface-by-surface target

### 2.1 Local dashboard (`packages/dashboard`, local mode @ `127.0.0.1:4040`) — thread 01

**Target:** a trace-led inspector for agents that physically run on this laptop. Headline `/trace/[id]` is promoted to a top-level **Trace** nav entry; Overview leads with the trace-and-verify story; `/apps` becomes **Runtimes** split into three honest sections; the five framework adapters are deleted from local; the live feed consumes the local-worker SSE with a chain-poll fallback.

**Routes (local mode):**

| Route | Purpose | Status |
|---|---|---|
| `/` | Overview — trace-led hero + recent sessions + "Environments in this namespace" | SHIPPED, re-hero |
| `/sessions` | **Trace** list (day-grouped TraceSessions) — now a rail entry | SHIPPED |
| `/trace/[session_id]` | THE demo moment: tree + gantt + Verify drawer (page turns chartreuse) | SHIPPED |
| `/memories` | Owned-memory inventory (on-chain `memwal_write` refs) | SHIPPED |
| `/apps` → **Runtimes** | Local runtimes (real controls) + MCP clients (controls-free) + Other environments seen (read-only) | REBUILD — BUILDABLE |
| `/settings` | Local config; delete dishonest static copy | SHIPPED, trim |
| `/share` | Hosted-only; hidden in local mode via `LOCAL_MODE` gate | BUILDABLE gate |

**Nav (`components/AppShell.tsx:15-21`):** insert `{key:"trace",label:"Trace",href:"/sessions",icon:"trace"}` after Overview; rename Apps→Runtimes; add `/trace` to the trace entry's active-match predicate (`AppShell.tsx:56-58`). **BUILDABLE.**

**`/apps` → Runtimes rebuild (`lib/runtimes.ts`, `app/apps/AppsView.tsx`):** replace the flat 9-item `KNOWN_RUNTIMES` + single `coverage:"enforced"` enum with a typed `RuntimeTier` (`native-hooks` | `trusted-hooks-required` | `runtime-provider` | `hook-port-pending` | `mcp-tools-only` | `deployed-adapter`) + `controllable: boolean` + `section`. **Local runtimes** = Claude Code (`native-hooks`), Codex (`trusted-hooks-required`, badge "requires one-time `/hooks` trust; `codex exec` does not capture"), OpenClaw/Hermes (`runtime-provider`), and Cursor/Windsurf (`hook-port-pending`, no controls until OneMem ports claude-mem's installers). Only controllable rows render real pause/trace toggles wired to the controls file (write path `runtimes.ts:199-207` → `/api/runtimes/[id]` → plugin reads `onemem-lib.mjs:152-159`, gated by `controllable`). **MCP clients** = Cline/OpenCode-style clients — static catalog, no toggles, fixed badge "explicit tools only." **Other environments seen** = unknown on-chain environments (a Vercel/CrewAI trace shows here read-only without pretending it's local). **DELETE** `vercel-ai, openai-agents, crewai, livekit, elevenlabs` from `KNOWN_RUNTIMES` (`runtimes.ts:55-89`) — zero read capability lost (environment-agnostic read path SHIPPED). **BUILDABLE.**

**Copy deletes:** the fake "Verifiable" stat card (`app/page.tsx:68-77`), unconditional per-row green checks (`:113-115`), "Connected runtimes"→"Environments in this namespace" (`:128-131`), static "Auto-capture on/Auto-trace on" (`SettingsView.tsx:226-227`). Chartreuse `#D4FF5E` reserved for Verify only. **BUILDABLE.**

**Live feed:** consume worker SSE `EventSource(127.0.0.1:4041/stream)` with `proof_status` badge per row; **fall back to the existing 5s chain-poll** (`api/stream/route.ts` SHIPPED) if the worker is absent. **BUILDABLE on top of worker.**

**RISKY:** OpenClaw/Hermes controllability (no confirmed local controls reader — omit controllable cards, flag to Abu); exact MCP-client config strings; `verifyTraceChain` package-id argument (low).

### 2.2 Local worker daemon (`@onemem/worker` @ `127.0.0.1:4041`) — thread 04

**Target:** a long-running localhost daemon that owns BOTH the hook write-path and the dashboard read-path. Every `PostToolUse` posts an observation; the worker writes it to local SQLite synchronously (<100ms) and SSE-pushes it instantly, while Seal+Walrus+Sui anchoring runs asynchronously as a per-row `proof_status`. **This kills the 82-tx blocking flush at Stop and makes mid-session liveness real. The on-chain Merkle-chained TraceSession is preserved byte-for-byte** — it moves from "blocking batch at Stop" to "background reconciliation per row."

**Lifecycle:** lazy `ensureWorker()` in SessionStart; `~/.onemem/worker.pid = {pid,port,startedAt,version}`; `process.kill(pid,0)` liveness; detached-spawn + `unref`; 10s readiness poll on `GET /api/readiness`. Bind `127.0.0.1` only (also closes BUG-2 for the local surface). **BUILDABLE** (all Node stdlib).

**Store:** `~/.onemem/worker.db` (`better-sqlite3`, fallback `node:sqlite` on Node 22+). Tables: `sessions`, `observations` (carries the OneMem-specific `proof_status` column + `input_raw/output_raw` plaintext until anchored, then nulled — same transient exposure as today's `.buffer.jsonl`, no worse), `prompts`, `proof_jobs` (durable async queue with `claimed_at_epoch` lease for crash recovery). **BUILDABLE.**

**Hook rewrite:** hooks become thin HTTP clients. `POST /api/sessions/{init,observations,summarize}`. Hot path = `fetch → SQLite insert → SSE push → return 202`; the chain is never on it. Worker calls the **exact SHIPPED SDK methods** the Stop hook calls today: `startSession`/`appendCall`/`closeCall`/`endSession`/`verifySession` (`traces.ts:117/159/211/239/267`). Keep exit-0 discipline; classify worker-unavailable errors (`ECONNREFUSED|...|5xx|429`) → exit 0; log real bugs to stderr (improvement over today's blanket swallow). **BUILDABLE.**

**Reconciler:** single in-process loop drains `proof_jobs` in `seq` order per session (Merkle chain forces strict parent→child ordering), flipping `local → queued → anchored → verified`; `verified` computed via `verifySession`; `failed` on max attempts (honest red, never fake green). **BUILDABLE.**

**SSE `/stream`:** real push (`text/event-stream`), event types `connected | initial_load | new_session | new_observation | new_prompt | proof_status | session_ended | processing_status`. ~9 HTTP endpoints (subset of claude-mem's 62). **BUILDABLE.**

**RISKY (highest in the whole architecture for the "alive" feel):** sequential Merkle anchoring throughput on testnet — anchoring is inherently serial (each call needs the prior `call_id` as `parentCallId`), so for long sessions the on-chain tail drains *after* Stop. **Mitigation (baked in):** show the local row "locally recorded, anchoring…" immediately (we hold plaintext + compute the hash locally); only the on-chain badge lags — which is the honest claim. Also RISKY: `better-sqlite3` native build (fallback noted), two-port localhost CORS, Codex hook stdin parity.

**Sequencing:** LAST. It is the only *feature* (not fix) here, and the honesty wins (§2.1, §2.6) land without it. The trace-led story works on the chain-poll path the moment BUG-1 lands.

### 2.3 MCP server (`@onemem/mcp`, stdio) — thread 02

**Target:** the universal stdio surface for **location-C MCP-only clients** (Cline/OpenCode/Copilot-style clients and Antigravity until native hooks are stable) and a slash-tool surface inside Claude Code/Codex. Cursor and Windsurf still consume MCP too, but claude-mem proves separate hook installers exist, so their OneMem-native classification is **hook-port-pending**, not MCP-only. Honest MCP contract: **explicit `onemem_*` tool calls only — no auto-capture, no auto-recall** — but every memory written through it becomes a real, on-chain-attested, independently verifiable trace node.

**The one decision — WIRE BUG-3, don't drop the claim.** Today `onemem_add_memory` → `add(text, {namespace})` (`index.ts:82`) passes only the MemWal namespace, so the SDK's attestation branch (`memory.ts:182-194`, fires only when `sessionId+onememNamespaceId+rwCapId` all supplied) never runs — the memory is stored but produces no trace node. A memory-write tool with no verifiable record contradicts OneMem's identity and forfeits the only location-C differentiator, and the fix is cheap. **Wire it.**

**Tools:** 7 SHIPPED (`add_memory, search_memory, verify_trace, trace_session, replay_session, share_namespace, revoke_namespace_capability`) + 1 NEW read-only `onemem_session_status` (returns network/address/`memoryEnabled`/`traceTarget.namespaceId`/`activeSessionId`/environment). Explicitly NOT added: `get/update/delete_memory` (MemWal has no such primitive — keep out).

**The fix (BUILDABLE):** in `main()` call the SHIPPED `ensureNamespace(onemem, {label:"onemem-mcp"})` (`runtime.ts:170`) once to provision+persist `{namespaceId, rwCapId}`. On first `add_memory` (lazy) `startSession` ONE ambient attesting session (`environment:"mcp:<client>"`), chain each write off the prior `callId`, `endSession` on transport close. New return shape `{memoryId, walrusBlobId, attested, callId, suiTxDigest, sessionId, verifyHint}`; partial failure surfaces via the SHIPPED `MemoryAttestationError` as `{...,attested:false,reason}`. Zero-config testnet: signer auto-falls-back to keystore/generated wallet (`signer.ts:44`), `ensureNamespace` auto-funds via faucet. **BUILDABLE — every primitive exists; only `index.ts:82` wiring is missing.**

**RISKY:** MemWal get/update/delete absence is repo-asserted, not context7-confirmable (keep tools out); first-call faucet latency/reliability (15s timeout inside a tool call — degrade to a clear "fund `<address>`" message, don't hang); un-closed session on abnormal stdio exit (best-effort close on `transport.onclose`).

### 2.4 Hosted dashboard (`apps/hosted-dashboard` @ `app.onemem.xyz`) — thread 03

**Target:** OneMem's account hub + public verifier, owning the five inherently multi-machine jobs, plus the NEW namespace-scoped trace view.

**Routes:** `/login`, `/onboarding`, `/cli-login`, `/share`, `/share/[capability_id]`, `/verify/[session_id]`, `/dashboard` (or `/n/[namespace_id]` — see §6 naming note).

| Job | Status |
|---|---|
| **Auth** — Enoki zkLogin (Google) / wallet-connect; no separate OneMem identity (`HostedProviders.tsx:60-66`) | SHIPPED |
| **Sponsored tx** — Enoki app pays gas, user only signs (`lib/sponsored-provisioning.ts:220-266`) | SHIPPED |
| **Onboarding** — mint `MemoryNamespace` + Admin cap + RW cap (`SponsoredProvisioning.tsx:122-187`) | SHIPPED |
| **Onboarding ext** — also mint MemWal account + `deploy:` delegate key; print the `.env` block (lift from `/cli-login:121-187`) | BUILDABLE |
| **CLI pairing** — `/cli-login` mints delegate + POSTs to localhost callback (`cli-login/page.tsx:121-233`) | SHIPPED |
| **Share** — mint ReadOnly/ReadWrite cap to recipient + `/verify` links + recipient landing | SHIPPED |
| **Owner revoke button** — reuse `cap-self-revoke` (`shared.ts:184-194`) | BUILDABLE |
| **Public `/verify/[id]`** — accountless Merkle re-walk; already package-id-bug-immune (`public-verify.ts:159`) | SHIPPED |
| **NEW namespace-scoped trace view** — list a namespace's sessions filtered by `environment`; env tabs derived from distinct environment strings; rows link to `/verify/[id]` | BUILDABLE |

**New endpoint:** `GET /api/namespace/sessions?ns=&env=&limit=` — read-only, no signer, thin wrapper over `traces.listSessions` → `fetchOpenedSessions(client, originalPackageId||packageId)` (`traces.ts:284-291`, **NOT subject to BUG-1**). Mirrors the public-verify server pattern. **BUILDABLE.**

**Deployed-app credential = env block:** `ONEMEM_NAMESPACE_ID`, `ONEMEM_RW_CAP_ID`, `ONEMEM_ACCOUNT_ID`, `ONEMEM_DELEGATE_KEY`, `ONEMEM_SUI_PRIVATE_KEY`, `MEMWAL_RELAYER_URL`, `ONEMEM_EMBEDDING_API_KEY`. These map 1:1 to SDK reads (traces `runtime.ts:362-363`; memory `credentials.ts:122-156`). **The `ONEMEM_SUI_PRIVATE_KEY` line is the keystone — see §3.**

**RISKY:** the trace write path (§3); owner→namespaces chain discovery (verify the OneMem namespace registry has an owner index by reading `contracts/onemem` Move source; else fall back to events or paste-id); Enoki prod config (self-diagnosed by `/api/enoki/status`); Walrus-Site verifier mirror deploy.

### 2.5 Vercel-AI demo (`apps/demo-vercel/`, deployed) — thread 05

**Target:** the ONE deployed adapter featured end-to-end. A minimal deployed Next.js chat app wraps the model with the SHIPPED trace-only `withOneMem(openai(...))` (`provider-vercel-ai/src/index.ts:44-94`) so every model call is a verifiable `environment="vercel-ai"` TraceSession in the user's own namespace, signed by the delegate key + RW cap from hosted onboarding (Vercel env vars). It uses the SHIPPED explicit `createOneMemMemory()` (`:96-122`) for owned recall/capture. The hosted namespace view (§2.4) lists those sessions; the SHIPPED accountless `/verify/<id>` turns them green.

**Components:** `app/page.tsx`, `app/api/chat/route.ts`, `lib/onemem.ts` (BUILDABLE, small); the namespace trace list (BUILDABLE, port of `dashboard/lib/trace.ts:197-217` filtered by namespace+env); the verifier (SHIPPED). Schema unchanged — `environment` is the only adapter signal (`traces.ts:127`).

**Honest scope:** the aspirational `withOneMem` auto-memory middleware in the provider doc is NOT shipped — we do NOT claim `provider:onemem` auto-memory. Trace = attested (true). Memory = owned + Seal-encrypted on Walrus (true). **Memory `capture()` is NOT on-chain-attested today** (`runtime-memory.ts:105` passes only `{namespace}`) — see §3/§6.

**RISKY:** the server-held delegate writing through a *shared* RW cap actually landing a `vercel-ai` session on testnet (the entire visible demo is downstream of that one write — read/verify is proven, write-from-shared-cap is not); memory-attestation requires a small SDK fix to make true. **Mitigation:** make a live testnet write+verify the FIRST thing built; fallback to a co-located cap-owning signer.

### 2.6 Narrative / repositioning (`apps/landing/*`) — thread 06

**Target:** reposition memory-led → **trace-led**. H1 = "See + verify exactly what your agent did"; memory = named substrate; cross-runtime = mechanism. Replace the flat 9-item integration strip (the seed of the dishonesty) with three explicitly-labeled, capability-honest tiers.

**Edits (all BUILDABLE — copy/array/IA only):** hero kicker/H1/subhead/CTAs/stats + `<head>` metadata trace-led (`page.tsx:30-67`, `layout.tsx:6-10`); `PROBLEMS` reorder to lead with the trace gap (`landing-content.ts:1-17`); `PILLARS` reorder (trace 01 / memory-substrate 02 / breadth-mechanism 03) and **DELETE the seeded lie** "every runtime and framework. One dashboard for all of them." (`landing-content.ts:57`); `INTEGRATIONS` → grouped `INTEGRATION_TIERS` (Local runtimes / MCP clients / Deployed-app adapters) each `{id,label,capability,items[]}`. Vercel AI = the one "Featured" adapter; CrewAI/LiveKit/ElevenLabs = plain catalog logos, NO live dot, NO control affordance. Honesty caption on the `VerifyDemo` scripted mock ("Illustration — run the real one in the dashboard").

**Per-tier honest labels:** Local = "Native hooks capture this machine's tool calls; watch them in the local dashboard" (Codex gets the `/hooks`-trust sub-badge). MCP = "Explicit OneMem tool calls only — no automatic capture or recall" (honest TODAY even with BUG-3 unfixed *because it says "tool calls," not "verifiable traces"*). Deployed = "Emit verifiable traces from your deployed app; watch them by namespace from the hosted hub."

**The canonical 60s judge demo (4 beats + 1 flourish):** (1) the act — "send 5 USDC to Maya," it did; (2) see it — `localhost:4040/trace/<id>`, expand the tree; (3) verify — click Verify, page turns chartreuse, Merkle chain re-walks from Sui; (4) share — paste into `app.onemem.xyz/verify/<id>` in incognito, verifies with no login; **(5, flourish, [→VERCEL])** — hosted namespace view shows the same proof from a deployed Vercel app. **Beats 1–4 need ZERO adapters** — the demo survives ending at beat 4. Beat 5 is RISKY (depends on a real deployed Vercel trace + stable public hosted URL) and degrades gracefully.

**RISKY:** the "Featured → live hosted Vercel trace" deep-link (beat 5) and the MCP-tier label (honest only while BUG-3 stays unfixed — do not preemptively upgrade); beats 2–3 require BUG-1 fixed first.

---

## 3. The credential & data-flow spine (the keystone)

**Question:** how does a deployed app write traces AND memory under a user's namespace, headless, with no human to sign?

**Split it — and the split is the whole answer:**

### 3a. MEMORY writes — SHIPPED, real, no gap
A deployed app writes memory blobs through the **MemWal relayer authenticated by an Ed25519 delegate key**. `MemoryAPI.getMemWal()` → `MemWalManual.create({key:delegateKey, accountId, serverUrl:relayerUrl})` (`memory.ts:147-156`); relayer auths via signed headers (`x-public-key`/`x-signature`). The delegate key is minted by onboarding/cli-login via `generateDelegateKey()` + on-chain `account::add_delegate_key`. Credential = `ONEMEM_DELEGATE_KEY` + `ONEMEM_ACCOUNT_ID` + `ONEMEM_EMBEDDING_API_KEY` (`credentials.ts:122-156`). **CONFIRMED SHIPPED.**

### 3b. TRACE writes — the GAP (the one keystone to de-risk)
Trace `ActionCall`/`TraceSession` writes are **on-chain Sui transactions**, NOT relayer calls. They need **(i) a gas-funded `@mysten/sui` Signer** and **(ii) a `ReadWrite` capability that signer HOLDS** (`appendCall`/`closeSession` take `namespaceId`+`rwCapId`, `traces.ts:240-252`, resolved from `ONEMEM_NAMESPACE_ID`/`ONEMEM_RW_CAP_ID`). **The MemWal delegate key ≠ the trace Sui signer** — the delegate auths the relayer (memory), not Sui (traces). Onboarding today mints the rwCap to the *owner's* zkLogin address, which a headless deployed app does not hold.

**RESOLUTION (chosen, BUILDABLE, additive — no new contract):** mint the RW cap to a **generated deployment keypair** via the existing **`rw-cap-share`** sponsored action (`sponsored-provisioning-shared.ts:195`, which already accepts an arbitrary recipient — vs `rw-cap-mint` which hardcodes `recipient=sender` at `shared.ts:148-161` and must NOT be used here), **faucet-fund it once** (`runtime.ts:135` has best-effort faucet), and emit `ONEMEM_SUI_PRIVATE_KEY` + `ONEMEM_RW_CAP_ID` in the env block. The delegate key (memory) and this Sui key (traces) coexist. Sponsored per-call trace writes (option 2) and the v0.2 Nautilus TEE relayer (option 3) are **deferred/NOT-SHIPPED** — do not depend on them.

**THIS MUST BE VERIFIED BEFORE BUILDING THE VERCEL DEMO UI — exact checks (run as a /tmp spike, FIRST):**
1. Mint RW cap to a *non-owner* generated keypair via `rw-cap-share`; confirm the cap object lands at that address.
2. From that funded keypair, run `withOneMem(model)` with `ONEMEM_NAMESPACE_ID`/`ONEMEM_RW_CAP_ID`/`ONEMEM_SUI_PRIVATE_KEY`; confirm a `TraceSession environment="vercel-ai"` is created AND `/verify/<id>` turns green.
3. Confirm that same session appears in `traces.listSessions({namespaceId})` (the §2.4 read path).

**If the spike fails:** fall back to a **co-located signer that OWNS the cap** (mint the RW cap directly to the deployment keypair via a relaxed `rw-cap-mint`, or co-locate). Still honest, slightly less "delegate" elegant. Discover this in the spike, **never during the pitch.**

### 3c. Why this is the keystone
Three threads (03 hosted, 05 vercel, 06 narrative beat 5) all hang on this single write succeeding. The read/verify half is fully SHIPPED and proven. The write-from-a-server-held-cap is the one unproven link in the entire B→hosted→public-verify chain. De-risk it before any downstream UI.

---

## 4. Adversarial slop / feasibility sweep (ranked by risk)

Everything in the merged design that is NOT confirmed buildable on shipped Sui/Walrus/Seal/MemWal/Enoki/Vercel-AI primitives, worst first. The enemy is shipping slop to judges.

| # | Risk | Why it's not yet cleared | Exact check to clear it | Blast radius |
|---|---|---|---|---|
| **R1** | **Deployed-app TRACE write from a shared/delegated RW cap on testnet** (§3b) | Read/verify proven; the server-held-cap *write* is unproven end-to-end | The §3b 3-step /tmp spike: `rw-cap-share`→fund→`withOneMem` write→`/verify` green→appears in `listSessions` | Kills demo beat 5, hosted namespace view value, the whole Vercel story |
| **R2** | **Local worker as a real-time "alive" feed by demo day** | Daemon, SQLite store, hook rewrite, reconciler, SSE consumer are ALL new build; largest lift | Build it last; until then the chain-poll fallback + chartreuse Verify carry the headline | Liveness/Pillar-2-"watch live" claim. NOT the headline (mitigated) |
| **R3** | **Sequential Merkle anchoring throughput** (worker reconciler) | Anchoring is inherently serial (parentCallId chain); long-session tail drains after Stop | Measure testnet tx latency under sustained per-call load; confirm UI shows "N anchoring" honestly | Honesty of the live "verified" badge on long sessions |
| **R4** | **MemWal account/delegate primitives + relayer** behave as repo asserts | MemWal incubation pkg not independently confirmable via context7 | Re-confirm against installed `@mysten-incubation/memwal` surface; keep get/update/delete tools OUT | Memory write path (3a), MCP, onboarding delegate mint |
| **R5** | **Owner → namespaces chain discovery** for cross-device namespace view (§2.4) | localStorage-only today; unknown if OneMem namespace registry has an owner index | Read `contracts/onemem` namespace+registry Move source; else fall back to `NamespaceCreated` events or paste-id | Cross-device hosted view convenience (paste-id always works) |
| **R6** | **MCP `add_memory` ambient-session faucet latency** on first call | `ensureNamespace` faucet + mint inside a tool call (15s timeout) | Measure first-call latency in a live MCP client; graceful "fund `<address>`" on faucet failure | First-run UX of MCP attestation |
| **R7** | **Memory `capture()` on-chain attestation** (Vercel + MCP) | `runtime-memory.ts:105` passes only `{namespace}`; needs `sessionId+nsId+rwCapId` | Small SDK change in `createMemoryRecorder` to pass the trace target; verify a `memwal_write` ActionCall verifies on `/verify` | "memory you can PROVE you wrote" claim (fallback: own+encrypted, not attested) |
| **R8** | **Enoki production readiness** (Google provider + allowed origins + sponsorship policy/rate limits) | Deploy-config, not yet green on live | `/api/enoki/status` green on live deploy; confirm sponsorship rate limits tolerate onboarding | Onboarding + all sponsored txs on the live hosted app |
| **R9** | **`verifyTraceChain` / dashboard package-id argument** post-BUG-1 | SDK uses original id; dashboard list reads use upgraded id | Confirm `verifyTraceChain` walks under original id; route all `queryEvents` through `eventPackageId` | Dashboard emptiness (this is BUG-1; the §5 first task) |
| **R10** | **`better-sqlite3` native build** on demo/CI machine | Native module; may fail to compile | Confirm Node version; fallback `node:sqlite` (Node 22+) | Worker only (R2 already gates it) |
| **R11** | **Walrus-Site verifier mirror deploy** | Scaffold exists (`walrus-sites/verifier/`); deploy unverified | Deploy + hit the static verifier once | Nice-to-have censorship-resistance; not demo-critical |

**Confirmed-NOT-slop (positively cleared):** the public `/verify` verifier (accountless, env-agnostic, BUG-1-immune — `public-verify.ts:98-179`); the trace-only `withOneMem` + Vercel middleware v3 API (ctx7-confirmed); the full SDK session lifecycle + `verifySession`; Seal client-decrypt; Enoki sponsored-tx machinery; the environment-agnostic read path. These are real shipped primitives.

---

## 5. Build sequence (dependency-aware, mapped to synthesis §7)

Effort: **S** ≤ half-day · **M** ~1 day · **L** multi-day. **Demo-critical** = the 60s headline breaks without it.

| # | Item | Effort | Demo-critical | Depends on | Maps to synthesis |
|---|---|---|---|---|---|
| **1** | **Fix BUG-1** — `eventPackageId = originalPackageId\|\|packageId` helper in `dashboard/lib/trace.ts` + `lib/memory.ts`; **BUG-2** loopback bind in `bin/onemem-dashboard:26`. *Without this the dashboard is empty and every other fix is invisible.* | S | **YES** | — | §7.1 |
| **2** | **Remove 5 framework adapters from local** `runtimes.ts:55-89`; rebuild `/apps`→Runtimes (tiered model, 3 sections); add MCP-clients section. Kills the fake Pause toggles / "Enforced" theater. | M | YES | 1 | §7.2–7.4 |
| **3** | **Delete dishonest copy** — dashboard (Verifiable card, green checks, "Connected runtimes", static auto-capture) + landing reposition (trace-led H1/kicker/subhead/stats, pillars reorder, **delete the seeded lie**, tiered integration strip, `<head>`, VerifyDemo caption). | M | YES (landing copy) | 1, 2 | §7.5–7.6 |
| **4** | **Spike R1** — the §3b /tmp end-to-end: `rw-cap-share`→fund→`withOneMem` write→`/verify` green→`listSessions`. *Gate before any Vercel/hosted-view UI.* | S–M | YES (beat 5) | — | §7.7 prep |
| **5** | **MCP attestation (BUG-3)** — wire `add_memory` to `ensureNamespace` + ambient session; new return shape + `onemem_session_status`; updated integration test. | M | No (honesty) | R4 check | §8a |
| **6** | **Hosted namespace-scoped trace view** + `GET /api/namespace/sessions` + onboarding env-block export (`rw-cap-share` delegate). | M | YES (beat 5) | 1, 4 | §7.7 |
| **7** | **Vercel-AI demo app** `apps/demo-vercel/` + deploy + live testnet write/verify; optional memory-attestation (R7). | M | YES (beat 5) | 4, 6 | §7.7, §4 |
| **8** | **Local worker daemon** — daemon + SQLite + hook rewrite + reconciler + SSE + dashboard `EventSource` consumer + `proof_status` badge. *Last; honesty wins land without it; chain-poll fallback carries beats 1–4.* | L | No (enhancement) | 1; R3, R10 | §7.8 |

**Critical path to the 60s headline (beats 1–4):** items **1 → 2 → 3**. That is the whole demo minus the breadth flourish. **Beat 5 path:** items **4 → 6 → 7**. Item 8 makes it *alive* but is never on the critical path.

---

## 6. What to CUT or de-risk (protect the Jun 21 build end — no silent scope cuts)

**CUT from the demo (keep the packages shipping):**
- **CrewAI, LiveKit, ElevenLabs as demo'd adapters.** WHY: Python→Node-CLI bridge friction and voice-undemoable-in-a-pitch-slot add confusion surface for zero headline value. They remain **catalog logos** in the Deployed-app tier and their packages keep emitting real traces. This is NOT cutting a headline feature — Pillar-3 breadth is a *mechanism*, and one featured adapter (Vercel) proves it end-to-end.

**DE-RISK / defer to enhancement (with explicit WHY so Abu stays oriented):**
- **Local worker (item 8) sequenced LAST.** WHY: it is the only *feature* not *fix* in the plan and the single largest lift; the trace-led headline (record → `/trace/[id]` → Verify → public verify) works on the chain-poll path the moment BUG-1 lands. The "watch it live" claim is the enhancement, not the headline — so deferring it protects the timeline without dropping the headline. If it slips entirely, the demo still lands beats 1–4 fully; we just don't claim mid-session liveness.
- **Beat 5 (Vercel hosted flourish) gated behind the R1 spike (item 4).** WHY: it is the ONE place a framework appears, and it depends on the unproven server-held-cap write. Build the spike first; if it fails, the demo ends at beat 4 (headline intact) and Vercel becomes a static "Featured" catalog logo. Make the fallback explicit so the demo is never blocked.
- **Memory on-chain attestation (R7) is OPTIONAL.** WHY: trace carries the verifiability headline; memory is the owned substrate. Demo memory as **owned + Seal-encrypted** (100% true today) and only claim "provable memory" if the small SDK fix lands and verifies. Do NOT ship language implying memory is attested unless it is.
- **Cross-device namespace discovery (R5) defaults to paste-id.** WHY: the owner-index may not exist on-chain; paste-id always works and is honest. Promise cross-device only after confirming the registry index.

**DO NOT cut (these ARE the product):** the public `/verify` page, the `/trace/[id]` tree + Verify-green moment, the trace-led landing reposition, BUG-1, and the framework removal from local. Cutting any of these forfeits either the headline or the honesty the headline depends on.

---

### Appendix — naming coordination note
Threads 03 and 05 use slightly different routes for the same surface (`/dashboard?ns=` vs `/n/[namespace_id]`). **Resolve to ONE before building item 6.** Recommendation: `/n/[namespace_id]?env=<environment>` (clean shareable URL, matches the public-unlisted intent), with `/dashboard` redirecting to the signed-in user's namespace. Final gating (public-unlisted vs wallet-gated) is the hosted-dashboard thread's call; recommendation is **public-unlisted** since verifiability for non-owners is the entire point and payloads stay Seal-encrypted regardless.
