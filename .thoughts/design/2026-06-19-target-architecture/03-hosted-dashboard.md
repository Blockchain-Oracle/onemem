# Target Architecture — Hosted Dashboard (`apps/hosted-dashboard`)

**Thread:** hosted-dashboard
**Date:** 2026-06-19
**Status:** TARGET design (not audit). Grounded in source; external primitives confirmed.
**Governing principle:** *Execution location determines product surface.* Hosted owns the jobs that cannot live on one laptop: onboarding, CLI pairing, sharing, public verify, and the NEW namespace-scoped "watch my deployed app" view. The local dashboard owns location-A inspection. This doc defines exactly what the hosted surface IS and the precise hosted/local boundary.

---

## 0. One-paragraph target

`app.onemem.xyz` is OneMem's **account hub + public verifier**. It does five jobs, all of which are inherently multi-machine: (1) **auth** — Enoki zkLogin (Google) or wallet-connect, no separate OneMem identity; (2) **onboarding** — mint the user's `MemoryNamespace` + `Admin` cap + `ReadWrite` cap via Enoki **sponsored** transactions (already shipped), then mint the **MemWal account + delegate key** that a *deployed* app uses as its write credential; (3) **CLI pairing** — `onemem login` opens `/cli-login`, the browser mints a MemWal delegate key and posts it to the local CLI callback (already shipped); (4) **share** — mint a `ReadOnly`/`ReadWrite` capability to a recipient wallet, plus copyable `/verify/<id>` links (already shipped); (5) **public `/verify/<id>`** — no login, anyone re-walks the Merkle chain (already shipped). The **NEW surface** is `/dashboard` upgraded from a static route-index into a **namespace-scoped trace + memory view**: account-gated, it calls the SDK's `fetchRecentSessions`/`fetchSession` filtered to the signed-in namespace and optional `environment`, so a developer can "watch my deployed Vercel app's traces from anywhere." The single hard primitive to de-risk is the **delegate-key WRITE path for traces** (§7).

---

## 1. Auth model + account model

### What's SHIPPED
- **Enoki zkLogin + wallet-connect** via dApp Kit are wired. `HostedProviders.tsx:60-66` registers Enoki Google wallets when `NEXT_PUBLIC_ENOKI_API_KEY` + `NEXT_PUBLIC_ENOKI_GOOGLE_CLIENT_ID` are set, falling back to plain wallet-connect otherwise. `useCurrentAccount()` is the single identity source across every page (`login/page.tsx:12`, `onboarding/page.tsx:39`, `dashboard/page.tsx:47`, `cli-login/page.tsx:36`). **SHIPPED.**
- **Self-diagnosing Enoki readiness:** `/api/enoki/status/route.ts` reads the Enoki app config server-side (key never leaves server) and reports the exact missing piece (Google provider / allowed origins / public env). **SHIPPED.**
- **Sponsored transactions** (gas paid by OneMem's Enoki app, user only signs): `EnokiClient.createSponsoredTransaction` + `executeSponsoredTransaction` in `lib/sponsored-provisioning.ts:220-266`. The browser builds `onlyTransactionKind` bytes, Enoki sponsors, the user signs with their zkLogin/wallet key, the server executes. **SHIPPED + confirmed against `@mysten/enoki`.**

### Account model (TARGET — mostly already true)
- **One identity = one Sui address** (zkLogin-derived or wallet). There is NO separate OneMem account, password, or API key. This is the locked decision ("credential is a Sui delegate key + namespace capability, not an opaque API key").
- A signed-in address owns up to three on-chain credential sets:
  1. **`MemoryNamespace` + `Admin` cap + `ReadWrite` cap** (OneMem `contracts/onemem` namespace module) — for traces + on-chain memory attestation.
  2. **`MemWalAccount` + delegate keys** (`@mysten-incubation/memwal` `account` module) — for memory blob writes via the MemWal relayer.
  3. Capabilities **shared TO** the address by others (recipient of `/share`).
- **TARGET refinement:** today provisioning IDs are persisted only in `localStorage` (`lib/hosted-state.ts`, used by `onboarding`/`share`/`cli-login`/`dashboard`). For the namespace-scoped view to work cross-device, the signed-in account's namespace must be **discoverable from chain** (owner → namespaces), not only from this browser's localStorage. See §6 RISKY note.

---

## 2. Onboarding — mint namespace + Admin cap + ReadWrite cap + delegate key

### Current route: `/onboarding` (5 steps: Account → Runtime → Provision → Verify → Done)

### What's SHIPPED
- **Sponsored namespace + cap provisioning, end to end.** `SponsoredProvisioning.tsx:122-187` runs two sponsored txs: `namespace-create` (mints `MemoryNamespace` + `Admin` cap) then `rw-cap-mint` (mints a `ReadWrite` cap to the owner). Server prepares via `prepareSponsoredProvisioning` (`lib/sponsored-provisioning.ts:213`), browser signs, server executes + extracts created object ids by Move type (`findCreatedObject`, `:78-105`). Result `{ namespaceId, adminCapId, rwCapId, ...digests }` is persisted to localStorage (`onboarding/page.tsx:64-71`). **SHIPPED.**
- Move target is the real contract: `${packageId}::namespace::create` with `NamespaceKind.Shared` (`lib/sponsored-provisioning.ts:172-182`); cap mint via `mint_capability_readwrite` (`shared.ts:198`).

### What's MISSING from onboarding today (BUILDABLE)
The current `/onboarding` mints the **namespace stack** but does NOT mint the **MemWal account + delegate key** — that logic lives only in `/cli-login` (`cli-login/page.tsx:121-150` create account, `:152-233` mint delegate). For the locked "deployed-app credential" story, onboarding's **Provision** step must produce, in one flow, the full credential bundle a deployed app needs.

**TARGET onboarding step "Provision" mints, in order:**
1. `MemoryNamespace` + `Admin` cap (sponsored) — **SHIPPED**.
2. `ReadWrite` cap (sponsored, to owner) — **SHIPPED**.
3. `MemWalAccount` if none exists — **BUILDABLE**: lift `createMemWalAccount` from `cli-login/page.tsx:121-150` (`${memwalPackageId}::account::create_account`). Account lookup already exists: `/api/cli-login/memwal-account` → `lookupCliLoginMemWalAccount` (`lib/cli-login.ts:114`).
4. **A deployment delegate key** — **BUILDABLE**: lift `generateDelegateKey()` + `add_delegate_key` from `cli-login/page.tsx:158-187`. Label it `deploy:<app-name>` and surface a **download / copy `.env` block** instead of posting to a localhost callback.

### TARGET onboarding "Done" screen — the deployed-app credential block (BUILDABLE)
Render a copyable env block — this IS the "credential a deployed app uses":
```
ONEMEM_NAMESPACE_ID=0x...        # from step 1
ONEMEM_RW_CAP_ID=0x...           # from step 2  (TRACE write authority)
ONEMEM_ACCOUNT_ID=0x...          # MemWal account, step 3
ONEMEM_DELEGATE_KEY=0x...        # MemWal delegate priv key, step 4 (MEMORY write authority)
ONEMEM_SUI_PRIVATE_KEY=0x...     # gas-funded Sui signer for TRACE txs — see §7 (THE GAP)
MEMWAL_RELAYER_URL=...
ONEMEM_EMBEDDING_API_KEY=...     # user-supplied
```
These map 1:1 to what the SDK reads: traces via `ONEMEM_NAMESPACE_ID`/`ONEMEM_RW_CAP_ID` (`runtime.ts:362-363`) signed by `resolveSigner(privateKey)` (`runtime.ts:343`); memory via `ONEMEM_DELEGATE_KEY`/`ONEMEM_ACCOUNT_ID`/`ONEMEM_EMBEDDING_API_KEY` (`credentials.ts:122-156`). **The `ONEMEM_SUI_PRIVATE_KEY` line is the unsolved one — §7.**

---

## 3. CLI pairing — `/cli-login`

### What's SHIPPED (this is the most complete surface)
`onemem login` opens `/cli-login?nonce=&port=`. The page (`cli-login/page.tsx`):
1. Connects wallet/Enoki, looks up the owner's `MemWalAccount` (`fetchMemWalAccount` → `/api/cli-login/memwal-account`, `:91`).
2. Creates the account if missing (`createMemWalAccount`, `:121` → `account::create_account`).
3. On Approve: `generateDelegateKey()` (`:162`), registers it on-chain (`account::add_delegate_key`, `:168-177`), signs the device `nonce` with the delegate key (`:189-190`), and POSTs the delegate private key + namespace + relayer + account ids to `http://127.0.0.1:${port}/callback` (`:196-220`).
4. The hosted app explicitly **does not persist the delegate private key** (`:364`). **SHIPPED + correct security posture.**

### TARGET refinements (small)
- Pull `activeNamespaceId` from the **chain-discovered** namespace, not only localStorage `hostedState` (`:208-209`), so pairing works on a device that never ran onboarding. **BUILDABLE** (depends on §6 discovery).
- TTL on the delegate is already user-selectable (`model.ts` `TTL_OPTIONS`). Keep.

---

## 4. Share + recipient capability

### What's SHIPPED
- `/share` (`HostedShareView.tsx`): mints `ReadOnly` or `ReadWrite` capability to a recipient address via sponsored tx (`ro-cap-share`/`rw-cap-share`, `:113-155`; server `lib/sponsored-provisioning.ts` mints to `recipient`). Pre-fills namespace + Admin cap from stored state. Generates `/verify/<id>` links. Tracks share history (`/api/share/history`). **SHIPPED.**
- `/share/[capability_id]` (`page.tsx`): recipient landing — reads the capability object from chain (`loadShareCapability`, `lib/share-capability.ts:65`), shows owner/kind/namespace/active, an honest "Proven / Not proven" panel, and a holder self-revoke command. Honest about v0.1 limits (no separate claim tx; capability already owned). **SHIPPED.**

### TARGET refinements
- Add an **explicit revoke action** in `/share` for the owner (Admin-cap marker revoke) — currently CLI/MCP-only (`[capability_id]/page.tsx:149-153`). The sponsored action `cap-self-revoke` already exists in the prepare/execute pipeline (`shared.ts:184-194`). **BUILDABLE** — wire a button; do not invent new contract surface.

---

## 5. Public `/verify/[session_id]` — no login

### What's SHIPPED (do not regress)
- Server-rendered, accountless. `loadPublicVerifySession` (`lib/public-verify.ts:144`) fetches the `TraceSession`, runs `verifyTraceChain` (the SDK's standalone read-only verifier — no signer/Walrus/Seal, `traces.ts:322`), re-derives the Merkle root, lists `ActionCallEmittedEvent` rows. UI shows Verified/Broken, expected-vs-computed root, per-call evidence, an honest "what this proves / does not prove" panel, and a Suiscan link. **SHIPPED + this is the headline asset.**
- **Already correct on the package-id bug** that breaks the local dashboard: `public-verify.ts:159` re-derives `eventPackageId` from the session object's type string (`traceSessionPackageId`) rather than blindly using `addr.packageId`. So `/verify` survives the testnet upgrade. **SHIPPED.**

### TARGET refinements (small, honesty)
- One residual: `loadPublicVerifySession` passes `packageId = addr.packageId` to the verifier on line 161 while events use `eventPackageId`. The verifier internally re-derives from the session (`traces.ts:fetchTraceSession` uses `session.packageId`), so it works — but pass `eventPackageId` to the verifier too for belt-and-suspenders. **BUILDABLE.**
- Add a Walrus-Site static mirror of the verifier (already scaffolded: `walrus-sites/verifier/`) so the public verifier is itself censorship-resistant. **SHIPPED scaffold / verify-deploy = RISKY.**

---

## 6. THE NEW SURFACE — namespace-scoped "watch my deployed app" view

### Target
Upgrade `/dashboard` from a static route-index (`dashboard/page.tsx:15-41`) into an **account-gated trace + memory view scoped to the signed-in namespace**, with an optional `environment` filter. This closes the locked-decision loop: location-B deployed apps (Vercel AI) have NO local chrome; the developer watches their app's traces HERE.

### Concrete components
**Route:** `/dashboard` (account-gated; redirect to `/login` if no account). Sub-views via query: `/dashboard?ns=<id>&env=vercel-ai`.

**Data source — REUSE the SDK fetchers (no new read primitive):**
- `fetchRecentSessions` / `traces.listSessions({ namespaceId, agentId, limit })` → `fetchOpenedSessions(client, originalPackageId||packageId, opts)` (`traces.ts:284-291`). **Critically uses `originalPackageId||packageId`** — so it is NOT subject to the local dashboard's BUG-1. **SHIPPED.**
- `fetchSession` / `traces.getSession(id)` for the detail drill-down. **SHIPPED.**
- Memory inventory: the SDK memory read path (MemWal relayer search) — account-gated, requires the owner/delegate. Show count + recent blobs metadata. **BUILDABLE** (read-only listing; do not block the trace view on it).

**Server route (TARGET, BUILDABLE):** `GET /api/namespace/sessions?ns=<id>&env=<env>&limit=<n>` — thin wrapper over `traces.listSessions`, read-only `SuiJsonRpcClient`, NO signer. Filter `session.environment === env` when `env` present. Mirrors the existing `public-verify` server pattern exactly. Returns `{ sessions: [{ sessionId, agentId, environment, status, openedAtMs, callCount }] }`.

**Screen layout:**
- Header: signed-in address + active namespace (chain-discovered) + network.
- **Environment tabs** derived from the distinct `environment` strings seen in the namespace's sessions (`vercel-ai`, `claude-code`, `codex`, …). This is the honest version of the deleted local `/apps` list: **environments SEEN in this namespace**, never a hardcoded runtime catalog with fake toggles.
- Session list (newest first) → click → reuse the `/verify/[id]` trace component (or link to it). Each row: env badge, agent, status, call count, "Verify" link.
- A "Connect your deployed app" empty-state showing the §2 env block + the one-line `withOneMem(model)` wrap.

### Namespace discovery (the gating dependency — RISKY)
The view needs "given this signed-in address, which namespace(s) do they own?" Today that is **localStorage-only** (`hosted-state.ts`). For true cross-device, derive it from chain.
- **SHIPPED building block:** namespaces are created with `owner` set; `share-capability.ts:133-145` already parses a namespace's `owner`/`name`/`kind`/`active`. The namespace registry object exists (`registryId`).
- **RISKY/UNCONFIRMED:** whether the OneMem `namespace` registry exposes an efficient **owner → namespaces** index (table/dynamic-field) the way MemWal's account registry does (`cli-login.ts:96-111` reads a dynamic field by owner address). **MUST VERIFY** by reading `contracts/onemem` namespace + registry Move source. If no owner index exists, fall back to: query `NamespaceCreated`-type events filtered by owner (BUILDABLE but heavier), OR keep localStorage as the device-local convenience and let the user paste a namespace id (always works). **De-risk: confirm the registry index before promising cross-device.**

---

## 7. #1 TO DE-RISK — how a deployed app authenticates to WRITE traces + memory under the user's namespace

This is the biggest unknown and the locked-decision linchpin. Split it: **memory writes** are solved; **trace writes** have a real gap.

### 7a. MEMORY writes — SHIPPED, delegate-key path is real
A deployed app writes memory blobs through the **MemWal relayer authenticated by an Ed25519 delegate key** — confirmed shipped, not invented:
- SDK: `MemoryAPI.getMemWal()` → `MemWalManual.create({ key: delegateKey, accountId, serverUrl: relayerUrl, ... })` (`memory.ts:147-156`). The relayer auths via signed headers (`x-public-key`, `x-signature`, …) using the delegate key (`@mysten-incubation/memwal/manual.d.ts:138-145`).
- Credential resolution: `ONEMEM_DELEGATE_KEY` + `ONEMEM_ACCOUNT_ID` + `ONEMEM_EMBEDDING_API_KEY` (`credentials.ts:122-156`).
- The delegate key is minted by onboarding/cli-login via `generateDelegateKey()` + on-chain `account::add_delegate_key` (`@mysten-incubation/memwal/account.d.ts:54,82`). **CONFIRMED real.**

### 7b. TRACE writes — THE GAP (RISKY → must de-risk)
Trace `ActionCall` + `TraceSession` writes are **on-chain Sui transactions**, NOT relayer calls. They are signed by a `@mysten/sui` `Signer` and need:
- **(i) a gas-funded Sui keypair** — `OneMem.create({ signer: resolveSigner(opts.privateKey) })` (`runtime.ts:343`; `client.execute` signs+submits, `client.ts:184-194`), and
- **(ii) a `ReadWrite` capability** the signer holds — `appendCall`/`closeSession` take `namespaceId` + `rwCapId` (`traces.ts:240-252`), resolved from `ONEMEM_NAMESPACE_ID`/`ONEMEM_RW_CAP_ID` (`runtime.ts:362-363`).

**The mismatch:** the **MemWal delegate key ≠ the trace Sui signer.** The delegate key authenticates the *relayer* (memory). Traces need a *separate* gas-funded Sui signer that *owns the rwCap*. Onboarding mints the rwCap to the **owner's** zkLogin address — which a headless deployed app does not hold and cannot fund easily.

**Three candidate resolutions (pick + verify ONE before building the demo):**

1. **Dedicated deployment signer = a fresh Sui keypair that holds its own rwCap.** Onboarding step 2 mints the `ReadWrite` cap **directly to a generated deployment keypair's address** (not the owner), prints both `ONEMEM_SUI_PRIVATE_KEY` + `ONEMEM_RW_CAP_ID`, and **funds it once** (testnet faucet — `runtime.ts:135` already has best-effort faucet top-up). **BUILDABLE today**: `mint_capability_readwrite` already takes an arbitrary `recipient` (`shared.ts:150,197-204`); just target the deployment key. The delegate key (memory) and this Sui key (traces) coexist in the env block. **This is the recommended path** — purely additive, no new contract, no relayer dependency for traces.

2. **Sponsored trace writes from the deployment signer.** The deployment signer holds the rwCap but pays no gas; OneMem's Enoki app sponsors each trace tx (same `createSponsoredTransaction` machinery as §1). Removes the funding step. **RISKY/UNCONFIRMED:** the SDK trace write path uses `client.execute` (direct submit), not Enoki sponsorship; wiring sponsorship into per-call trace writes is non-trivial and Enoki rate/policy limits on high-frequency writes are unverified. **Defer past demo.**

3. **Relayer-mediated trace writes (v0.2 Nautilus TEE).** `traces.ts:265` explicitly references "the v0.2 Nautilus TEE relayer" as a future trace path. **NOT SHIPPED** — do not depend on it for the hackathon.

**De-risk checklist for path 1 (do this FIRST, in /tmp spike):**
- [ ] Mint `ReadWrite` cap to a *non-owner* generated keypair via the existing sponsored `rw-cap-mint` with `recipient = deployKey.address`; confirm the cap object lands at that address.
- [ ] From that keypair (funded via faucet), run `withOneMem(model)` with `ONEMEM_NAMESPACE_ID`/`ONEMEM_RW_CAP_ID`/`ONEMEM_SUI_PRIVATE_KEY` set; confirm a `TraceSession` with `environment=vercel-ai` is created + `/verify/<id>` turns green.
- [ ] Confirm the same `environment=vercel-ai` session appears in `traces.listSessions({ namespaceId })` (the §6 read path).
- [ ] Confirm `rw-cap-mint` recipient is honored (read `shared.ts:148-161`: for `rw-cap-mint`, `recipient = sender` is hardcoded — **this must be relaxed to accept an explicit recipient**, OR reuse `rw-cap-share` which already mints to an arbitrary recipient). **Smallest change: use `rw-cap-share` to the deployment key.**

---

## 8. Precise hosted vs local boundary

| Concern | HOSTED (`app.onemem.xyz`) | LOCAL (`localhost:4040`) |
|---|---|---|
| Auth | zkLogin/wallet (Enoki) — REQUIRED for account actions | None (no login) |
| Onboarding (mint namespace/caps/delegate) | **YES** (sponsored) | No |
| CLI pairing (`onemem login`) | **YES** (`/cli-login`) | Initiates only (`onemem login` opens hosted) |
| Share capability to recipient | **YES** (`/share`) | No |
| Public `/verify/<id>` (no login) | **YES** | Local `/trace/<id>` (own machine, no login) |
| Watch DEPLOYED app traces (location B) | **YES** (`/dashboard`, namespace-scoped) | **NO** (removed — the deleted fake `/apps` framework cards) |
| Inspect THIS machine's runtimes (location A) | No | **YES** (Claude Code/Codex native cards) |
| MCP-only clients (location C) | No | **YES** (controls-free section) |
| Memory blob writes | Credential MINTED here; writes happen in the app/runtime | Runtime writes via relayer |

**Rule of thumb:** hosted = *credential minting + multi-machine reads + public proof*. Local = *single-machine private inspection*. Deployed-app traces are read on hosted because they are inherently not-this-machine.

---

## 9. SHIPPED / BUILDABLE / RISKY ledger

**SHIPPED (cite):**
- Enoki zkLogin + wallet auth + sponsored tx (`HostedProviders.tsx:60-66`, `lib/sponsored-provisioning.ts:220-266`, `/api/enoki/status`).
- Onboarding namespace + Admin cap + RW cap mint (`SponsoredProvisioning.tsx:122-187`).
- CLI pairing incl. MemWal account create + delegate key mint + callback (`cli-login/page.tsx:121-233`).
- Share mint + recipient landing + history (`HostedShareView.tsx`, `share/[capability_id]/page.tsx`, `/api/share/*`).
- Public `/verify/<id>` with correct event-package-id derivation (`lib/public-verify.ts`).
- Memory delegate-key write path (`memory.ts:147-156`, `credentials.ts:122-156`).
- Namespace-scoped session reads (`traces.listSessions` → `fetchOpenedSessions` on `originalPackageId`).

**BUILDABLE (from confirmed primitives):**
- Onboarding extended to also mint MemWal account + a `deploy:` delegate key + print the env block (lift from `/cli-login`).
- `/dashboard` → namespace-scoped trace/memory view (`GET /api/namespace/sessions` wrapper + env tabs + reuse `/verify` component).
- Owner revoke button in `/share` (reuse `cap-self-revoke` sponsored action).
- Path-1 deployment-trace credential: mint RW cap to a generated deployment keypair via `rw-cap-share`, faucet-fund it, print `ONEMEM_SUI_PRIVATE_KEY`.

**RISKY / UNCONFIRMED (must verify):**
- **#1 — deployed-app TRACE write path** (§7b). Memory is solved; traces need a gas-funded Sui signer holding an rwCap. Verify path-1 spike end-to-end before featuring Vercel in the demo.
- **Owner → namespaces chain discovery** (§6). Verify the OneMem namespace registry exposes an owner index; else fall back to events or paste-id.
- Enoki production readiness (Google provider + allowed origins) is deploy-config, self-diagnosed by `/api/enoki/status` — confirm green on the live deploy.
- Walrus-Site verifier mirror deploy (scaffold exists; deploy unverified).

---

## 10. Dependencies on other threads
- **SDK/contracts thread:** owns the namespace registry owner-index question (§6) and the `rw-cap-mint` recipient relaxation vs `rw-cap-share` reuse (§7b checklist). Needs to confirm the trace recorder cleanly accepts an explicit `ONEMEM_SUI_PRIVATE_KEY` + `ONEMEM_RW_CAP_ID` held by a non-owner key.
- **Local-dashboard thread:** owns removing the five framework cards from local `/apps`; this thread assumes those location-B traces are read on hosted `/dashboard` instead. The read path (`fetchOpenedSessions`) is shared — coordinate on the `eventPackageId` fix so both surfaces use `originalPackageId||packageId`.
- **Vercel-adapter thread:** owns `withOneMem(model)` env-driven config (`provider-vercel-ai/src/index.ts:44-48`); must consume the exact env block onboarding prints (§2) and the §7b trace-signer resolution.
- **Landing/positioning thread:** hosted root copy (`app/page.tsx`) is already trace-led ("Verify any agent trace. No login required.") — keep aligned with the trace-led headline.
