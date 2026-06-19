# Target Architecture — Thread 05: Vercel AI Flagship Hosted Demo

**Date:** 2026-06-19
**Thread:** vercel-ai-demo
**Surface:** the ONE deployed-app adapter featured end-to-end in the hackathon demo (Vercel AI SDK + OneMem → verifiable traces + owned memory → hosted namespace view → public `/verify`).
**Governing principle (locked):** Vercel AI is execution-location **B** (deployed server). It NEVER appears in the local dashboard. Its traces surface on the **hosted** surface, queried by **namespace + environment** from on-chain events — there is no "connected local app."

This doc designs the honest end state. Every element is tagged **SHIPPED** (exists, file:line), **BUILDABLE** (constructible from confirmed primitives), or **RISKY** (must be verified).

---

## 0. The honest scope statement (read first)

The aspirational provider doc (`docs/05-our-architecture/04-frameworks/vercel-ai-provider.md:24-29,109-205`) describes a `withOneMem` that does `enableRecall` / `enableCapture` / `transformParams` auto-memory and per-call `appendCall`/`closeCall`. **That code is NOT shipped.** The shipped provider (`packages/provider-vercel-ai/src/index.ts`) does two separable things:

1. **`withOneMem(model)`** — trace-only. Records **one 1-call TraceSession per model call** (`model.generate` or `model.stream`) via the shared `createTraceRecorder` (`index.ts:44-94`). Fire-and-forget, zero-config, stamps `environment="vercel-ai"`.
2. **`createOneMemMemory()`** — an **explicit** memory helper: `recallInto(text)` (search → prepend context block) and `capture(text)` (store to MemWal). Memory is a manual wrapper the developer calls around `generateText`, NOT automatic middleware (`index.ts:96-122`).

**The demo is built on exactly these two shipped primitives.** We do NOT claim `provider:onemem` auto-memory. We demo trace-led (headline) + explicit owned memory (substrate). This is the design's central honesty constraint.

**One real gap we must decide on (carried from grounding §8a / BUG-3):** `createOneMemMemory().capture()` calls `createMemoryRecorder` → `client.requireMemory().add(text, { namespace })` passing **only the namespace** (`runtime-memory.ts:105`). The SDK only emits an on-chain `memwal_write` ActionCall when `sessionId + onememNamespaceId + rwCapId` are ALL supplied (`memory.ts:182-194`). So **memory captured via the Vercel helper today is stored Seal-encrypted on Walrus but produces NO trace node / NO Merkle attestation.** See §6 for the decision.

---

## 1. Target in one paragraph

A minimal **deployed Next.js chat app** (`apps/demo-vercel/`, deployed to Vercel) uses `withOneMem(openai(...))` so every model call is recorded as a verifiable on-chain TraceSession under `environment="vercel-ai"` in **the user's own namespace**, writing with the **delegate key + RW cap minted during hosted onboarding** (passed as Vercel env vars). The app also uses `createOneMemMemory()` for **owned recall/capture** — the user's facts live in their MemWal namespace, recalled into the prompt and captured after. In the hosted dashboard, a new **namespace-scoped trace view** (`app.onemem.xyz/n/<namespaceId>?env=vercel-ai`) lists those sessions (reusing the same `fetchRecentSessions`/event-read path the local dashboard uses), and the existing **public `/verify/<sessionId>`** page (already shipped, accountless) walks the Merkle chain of on-chain ActionCalls and turns green. The pitch: *"This is a real deployed app. I never trusted it. Here is the on-chain proof of every model call it made — anyone can re-verify it with no login."*

---

## 2. Components (routes / endpoints / schema)

### 2a. The deployed demo app — `apps/demo-vercel/` — **BUILDABLE** (small)

A new workspace app. Minimal Next.js (App Router) chat:

| Path | Type | Purpose | Status |
|---|---|---|---|
| `app/page.tsx` | client | One-input chat box; streams the assistant reply; shows a "Trace recorded →" link per turn when `onTrace` fires | BUILDABLE |
| `app/api/chat/route.ts` | server (edge or node) | Calls `streamText({ model: tracedModel, ... })`; this is where `withOneMem` + `createOneMemMemory` live | BUILDABLE |
| `lib/onemem.ts` | server | Constructs the traced model + memory once from env | BUILDABLE |

`lib/onemem.ts` (the load-bearing wiring — built ONLY from shipped primitives):

```ts
import { withOneMem, createOneMemMemory } from "@onemem/vercel-ai-provider";
import { openai } from "@ai-sdk/openai";

// Credential = delegate key + namespace + RW cap from hosted onboarding (§3).
// Trace recorder reads target from ONEMEM_NAMESPACE_ID/ONEMEM_RW_CAP_ID (runtime.ts:356-358);
// signer key must be passed explicitly (resolveSigner only reads opts.privateKey, runtime.ts:113-114).
export const tracedModel = withOneMem(openai("gpt-4o-mini"), {
  privateKey: process.env.ONEMEM_DELEGATE_KEY!,   // delegate signer
  environment: "vercel-ai",                        // stamped on every session (traces.ts:127)
  agentId: "onemem-demo",
  onTrace: (sessionId) => { /* surfaced to client per turn */ },
});

export const memory = createOneMemMemory(); // reads MemWal creds from env (runtime-memory.ts:72)
```

`app/api/chat/route.ts` (explicit memory wrap — matches shipped README usage, `README.md:27-31`):

```ts
const recalled = await memory.recallInto(userText);          // search → prepend context
const result = await streamText({ model: tracedModel, prompt: recalled });
// after stream completes:
await memory.capture(`User: ${userText}\nAssistant: ${full}`); // owned memory
```

> **Key honesty note:** the trace and the memory are TWO independent on-chain/Walrus writes. The trace (model call) IS attested on-chain today. The memory capture is NOT attested today (§0, §6). We demo what is true.

**Env the deployed app needs** (set in Vercel project settings):
- `ONEMEM_DELEGATE_KEY` — Sui delegate private key (signer) — from onboarding
- `ONEMEM_NAMESPACE_ID`, `ONEMEM_RW_CAP_ID` — trace target — from onboarding (`runtime.ts:356-358`) — **SHIPPED read path**
- `ONEMEM_ACCOUNT_ID`, `ONEMEM_EMBEDDING_API_KEY`, `SUI_NETWORK=testnet` — for memory (`credentials.ts:122-135`)
- `OPENAI_API_KEY` — model provider

### 2b. Hosted namespace-scoped trace view — `app.onemem.xyz/n/<namespaceId>` — **BUILDABLE**

The hosted dashboard today has onboarding, share, and **public single-session verify** — but **no list view** of a namespace's traces (confirmed: only `public-verify.ts` reads events; no `fetchRecentSessions` in `apps/hosted-dashboard`). Build it:

| Path | Purpose | Status |
|---|---|---|
| `app/n/[namespace_id]/page.tsx` | Server component. Lists recent `TraceSessionOpenedEvent`s **filtered to this namespace + optional `?env=` filter**. Each row links to `/verify/<sessionId>`. | BUILDABLE |
| `lib/namespace-sessions.ts` | Port of `dashboard/lib/trace.ts:197-217` `fetchRecentSessions`, **filtered by `namespace_id` and `environment`**, using the `eventPackageId` fix (`originalPackageId || packageId`) so the list is not empty (BUG-1). | BUILDABLE |

Read shape (already proven, `dashboard/lib/trace.ts:197-217`): query `MoveEventType = <pkg>::events::TraceSessionOpenedEvent`, map `parsedJson` → `{ sessionId, agentId, environment, namespaceId, startedAtMs }`. Filter `environment === "vercel-ai"` and `namespaceId === <param>`. **A Vercel trace and a Claude Code trace are read by the identical code path** — the adapter just sets the environment string (grounding §4).

Account-gating: the namespace view can be **public-but-unlisted** (anyone with the namespaceId URL sees the session list; payloads stay Seal-encrypted) OR gated to the connected wallet that owns the namespace. **Recommend public-but-unlisted for the demo** (simpler, and verifiability is the whole point — see §7 dependency on hosted-dashboard thread for the final gating call).

### 2c. Public verifier — `app.onemem.xyz/verify/<sessionId>` — **SHIPPED**

Already exists and works: `apps/hosted-dashboard/app/verify/[session_id]/page.tsx` + `lib/public-verify.ts`. It:
- Loads the TraceSession object, derives `eventPackageId` from the object **type string** (`public-verify.ts:98-102,159`) — so it **survives the package-id upgrade bug** (BUG-1) without any fix.
- Runs `verifyTraceChain` (from `@onemem/sdk-ts`) + lists the ActionCalls, compares `expectedRoot` vs `computedRoot`, asserts `callEvidenceMatchesVerifier` (`public-verify.ts:160-176`).
- Renders a clear PROVEN / NOT-PROVEN list (`verify/[session_id]/page.tsx:7-19`) — exactly the honest framing judges respect.

**No build needed for the verifier.** A Vercel-recorded session id pasted here verifies with zero changes, because the verifier is environment-agnostic.

### 2d. On-chain / data schema (no change — **SHIPPED**)

The Vercel adapter emits the **same** Move objects/events as every other runtime:
- `TraceSessionOpenedEvent { session_id, agent_id, environment, namespace_id, sdk_version, ... }` (`traces.ts:117-127`, `environment` stamped at `:127`).
- `ActionCallEmittedEvent { session_id, call_id, tool_namespace, tool_name, ... }` Merkle-chained (`public-verify.ts:109-135`).
- Content (input/output) → Walrus blob, Seal-encrypted (`runtime.ts:256-264` `encrypt: true`).

`environment = "vercel-ai"` is the entire "which adapter" signal. No new schema.

---

## 3. The credential handoff (coordinate w/ hosted-dashboard thread)

**SHIPPED:** Hosted onboarding (`apps/hosted-dashboard/app/onboarding/`, `lib/sponsored-provisioning*`) mints, via Enoki-sponsored txns, a **namespace + ReadWrite cap** and persists `{ namespaceId, adminCapId, rwCapId, network }` to hosted state (`hosted-state.ts:1-10`). This is the *exact* credential the Vercel trace recorder consumes (`runtime.ts:356-358` reads `ONEMEM_NAMESPACE_ID` + `ONEMEM_RW_CAP_ID`).

**BUILDABLE — the missing "export to deployed app" step:** onboarding currently stores the cap in browser localStorage for the *connected wallet*. For a deployed app we need a **delegate signer key** the server can hold, authorized to write to that namespace. Two honest options:

- **(A) Delegate keypair, RW cap shared to it (recommended).** Onboarding (or a small "Connect a deployed app" panel) generates an Ed25519 delegate keypair, uses the existing `rw-cap-share` sponsored action (`sponsored-provisioning-shared.ts:8,195` — already supports sharing a RW cap to a recipient address) to share the RW cap to the delegate's address, and shows the developer a **copy-paste env block**: `ONEMEM_DELEGATE_KEY`, `ONEMEM_NAMESPACE_ID`, `ONEMEM_RW_CAP_ID`. This is fully buildable from shipped sponsored actions.
- **(B) Reuse the wallet key** — not viable; a deployed server can't hold the user's Enoki/wallet key.

**Design decision:** go with (A). The "credential" is a **Sui delegate key + namespace + RW cap**, never an opaque API key (grounding §4). The new onboarding panel that emits the env block is a **hosted-dashboard-thread deliverable**; this thread CONSUMES it. (See §7.)

**RISKY to verify:** that the RW cap, once shared to the delegate address, lets that delegate's `startSession`/`appendCall` succeed end-to-end on testnet from a server process. The `rw-cap-share` action exists (`sponsored-provisioning-shared.ts:195`) and `recordSession` uses `rwCapId` on every call (`runtime.ts:234-265`), so the pieces line up — but a live testnet run from the deployed app must confirm it before demo day (see §6 build steps).

---

## 4. The EXACT 60–90s demo script

**Pre-staged (done before the slot):** demo app deployed to Vercel with the env block from onboarding; one or two memories already captured ("I prefer Move over Solidity"); one prior trace exists so the namespace list isn't empty. Three browser tabs open: (1) the deployed demo app, (2) `app.onemem.xyz/n/<namespaceId>?env=vercel-ai`, (3) `app.onemem.xyz/verify/<knownSessionId>` ready.

| t | Tab | Action | Spoken line |
|---|---|---|---|
| 0–10s | (1) demo app | Type: *"What did we decide about the smart-contract language?"* Hit send; reply streams. | "This is a real app I deployed to Vercel. It uses OpenAI through OneMem." |
| 10–20s | (1) | Reply uses the recalled memory ("…you prefer Move…"). A "Trace recorded ✓ →" link appears under the message. | "It recalled a fact from **my** memory — that lives in my namespace on Walrus, encrypted, that I own. Not in some vendor's database." |
| 20–35s | (2) namespace view | Switch tab; the new session is at the top of the list, `environment=vercel-ai`, fresh timestamp. | "Every model call this deployed app made shows up here, in my namespace — queried straight from Sui by environment. I didn't 'connect' anything; the trace is just on-chain." |
| 35–55s | (3) verify | Click the new session → public `/verify/<id>`. Page loads, walks the Merkle chain, turns green: **Verified ✓**, root matches, N calls intact. | "Click verify — no login. It re-derives the Merkle root from the on-chain ActionCalls and matches what's anchored on Sui. I'm not asking you to trust me, OneMem, or OpenAI." |
| 55–75s | (3) | Point at the honest PROVEN / NOT-PROVEN panel. | "And it's honest about what proof means: the call sequence is intact and anchored — NOT that the contents are public or that the agent was *right*. The payload stays Seal-encrypted." |
| 75–90s | — | Paste the verify URL into chat / hand it to "the auditor." | "I send this link to anyone. They verify the same chain themselves. That's the whole product: see exactly what your agent did — and prove it." |

**What we deliberately do NOT say:** we never claim auto-memory middleware, never claim the memory write itself is on-chain-attested (unless §6 option-1 is built first), never show a fake Pause toggle. Trace = attested (true). Memory = owned + encrypted on Walrus (true).

---

## 5. SHIPPED vs BUILDABLE vs RISKY (summary table)

| Element | Status | Evidence / what's needed |
|---|---|---|
| `withOneMem(model)` trace-only middleware (`generate`+`stream`) | **SHIPPED** | `provider-vercel-ai/src/index.ts:44-94`; tests `tests/provider.test.ts:62-110` |
| `createOneMemMemory()` explicit recall/capture | **SHIPPED** | `index.ts:96-122`; `runtime-memory.ts:70-114`; tests `:113-127` |
| `environment="vercel-ai"` stamping | **SHIPPED** | `index.ts:48`; `traces.ts:127` |
| Vercel AI SDK middleware API (`wrapLanguageModel`, `wrapGenerate`/`wrapStream`, `specificationVersion:"v3"`) | **SHIPPED** (confirmed via ctx7) | ctx7 `/vercel/ai`: `LanguageModelV*Middleware` shape stable v3→v4; repo uses v3 against `@ai-sdk/provider` — current & correct |
| On-chain trace schema + Merkle chain | **SHIPPED** | `traces.ts:117-127`; `public-verify.ts:104-176` |
| Public `/verify/<sessionId>` (accountless, env-agnostic, survives BUG-1) | **SHIPPED** | `apps/hosted-dashboard/app/verify/[session_id]/page.tsx`; `lib/public-verify.ts:98-179` |
| Hosted onboarding mints namespace + RW cap (Enoki-sponsored) | **SHIPPED** | `app/onboarding/`; `sponsored-provisioning-shared.ts`; `hosted-state.ts` |
| `rw-cap-share` to a recipient address | **SHIPPED** | `sponsored-provisioning-shared.ts:8,195,202-213` |
| Deployed demo app `apps/demo-vercel/` (chat + traced model + memory wrap) | **BUILDABLE** | from the two shipped primitives + `streamText` |
| Hosted **namespace-scoped trace list** `/n/<id>?env=vercel-ai` | **BUILDABLE** | port `dashboard/lib/trace.ts:197-217` `fetchRecentSessions` + filter; apply BUG-1 `eventPackageId` fix |
| Onboarding "export env block for a deployed app" (delegate key + share RW cap) | **BUILDABLE** (hosted-dashboard thread owns) | composes existing `rw-cap-share` + new keypair-gen + copy-paste UI |
| Per-turn `onTrace` → "Trace recorded →" link in demo UI | **BUILDABLE** | `onTrace` callback shipped (`runtime.ts:313,388`); wire to client |
| Memory `capture()` emits an on-chain attestation (trace node) | **RISKY / NOT SHIPPED** | `runtime-memory.ts:105` passes only `{namespace}`; `memory.ts:182-194` needs `sessionId+nsId+rwCapId`. See §6. |
| Delegate RW-cap write succeeds from a deployed server on testnet | **RISKY** | pieces align but unproven end-to-end; must do a live testnet run pre-demo |

---

## 6. The one real product decision: memory attestation

Today the Vercel memory `capture()` path stores to Walrus but emits **no on-chain trace node** (§0). Two honest paths:

- **Option 1 (BUILDABLE, recommended if time allows): make memory writes attest.** Extend `createMemoryRecorder` so `capture()` opens/append-to a TraceSession and passes `sessionId + onememNamespaceId + rwCapId` into `memory.add(...)` (the SDK already supports this — `memory.ts:182-194`). Then a captured memory becomes a `memwal_write` ActionCall that **also verifies on `/verify`**. This makes the "memory you own AND can prove you wrote" story fully true and is the strongest demo. Requires the same delegate cap the trace recorder already has, so credential-wise it's free.
- **Option 2 (zero-build, fully honest): demo memory as owned + encrypted, NOT as attested.** Say exactly that. The *trace* (model call) carries the verifiability headline; memory is the owned substrate. This is the safe fallback and still 100% honest.

**Recommendation:** attempt Option 1 (it's a small SDK change against shipped primitives and makes the demo materially stronger), with Option 2 as the guaranteed fallback. Do NOT ship language implying memory is attested unless Option 1 lands and is verified on testnet.

**Build/verify order:** (1) scaffold `apps/demo-vercel`; (2) provision via onboarding, get the env block, deploy; (3) **live testnet run** — confirm a real `vercel-ai` session lands on-chain and `/verify` goes green (de-risks the two RISKY items); (4) build `/n/<id>` list; (5) optionally land Option-1 memory attestation; (6) rehearse the 90s script.

---

## 7. Dependencies on other threads

- **hosted-dashboard thread (hard dependency):** owns (a) the **credential-export onboarding step** that emits the `ONEMEM_DELEGATE_KEY/NAMESPACE_ID/RW_CAP_ID` env block via `rw-cap-share` to a delegate key, and (b) the final call on whether `/n/<namespaceId>` is public-unlisted vs wallet-gated. This thread builds the trace-list page but needs the dashboard's shared layout/auth + the credential shape locked.
- **sdk/runtime thread:** owns the BUG-1 `eventPackageId` fix (`originalPackageId || packageId`) used by the new list view, and Option-1 memory attestation in `createMemoryRecorder` if pursued. The provider itself needs no changes for the trace headline.
- **landing/positioning thread:** the demo's spoken framing ("see + prove what your deployed agent did") must match the trace-led headline; ensure landing doesn't promise auto-memory for frameworks.
- **No dependency on the local dashboard.** Vercel is removed from local entirely (locked); this surface is 100% hosted + the deployed app.

---

## 8. The single biggest design risk

**That the delegate-key RW-cap write path does not actually succeed from a deployed server on testnet** (RISKY, §3/§5). Everything visible in the demo — namespace list, public verify — is downstream of one real `vercel-ai` TraceSession landing on-chain, signed by a delegate key that only *shares* (not owns) the RW cap. The read/verify side is SHIPPED and proven; the *write from a shared cap held by a server-side delegate* is the unproven link. **Mitigation:** make step (3) of §6 — a live end-to-end testnet write+verify from the deployed app — the very first thing built, before any UI. If it fails, fall back to a co-located signer that *owns* the cap (still honest, slightly less "delegate" elegant) rather than discovering it during the pitch.
