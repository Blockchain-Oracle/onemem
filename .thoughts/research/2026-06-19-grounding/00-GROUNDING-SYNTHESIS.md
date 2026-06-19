# OneMem — Grounding Synthesis

**Date:** 2026-06-19
**Author:** synthesis thread (consolidates 8 investigation threads, all grounded in source)
**Read this first.** It is written for one stressed founder to absorb in ten minutes and repeat from memory.
**The one lens that fixes everything:** *EXECUTION LOCATION determines PRODUCT SURFACE.* Where code runs decides where it can honestly appear in your product. Conflating the three locations is the entire disease.

The three locations:
- **(A) Laptop runtime** — Claude Code, Codex, OpenClaw, Hermes. Run on the USER'S OWN MACHINE. Natural content of a LOCAL dashboard.
- **(B) Deployed-app framework** — Vercel AI, OpenAI Agents, CrewAI, LiveKit, ElevenLabs. Run on a SERVER inside the app the developer ships to *their* users. Never on the laptop. Belong on a HOSTED surface or as queryable namespaces — never as local chrome.
- **(C) MCP-only client** — Cursor, Windsurf, Cline, OpenCode, Gemini/Antigravity. Run locally but can ONLY do explicit OneMem tool calls. No automatic capture.

---

## 1. What OneMem actually is (no hedging)

OneMem is the **verifiable action-trace + memory layer for AI agents**: every memory write is an encrypted Walrus blob, and every agent action — every tool call, MCP invocation, skill run — is captured as a Merkle-chained `ActionCall` object on Sui that **anyone can independently re-verify without trusting OneMem or any vendor** (`docs/00-goal/GOAL.md:13`, `:25-33`). The end-user headline is **Pillar 2: trace + replay** — "show me exactly what my agent did, step by step, and prove it" (`GOAL.md:26`, tagged "*This is the end-user-value headline feature.*"). Cross-runtime breadth (Pillar 3) and the dashboard (Pillar 4) are *how the traces get there and become legible* — they are mechanism, not the pitch. The thing is real and coherent. What is broken is the **presentation**, which flattens the three execution locations into one list and so makes honest features look dishonest.

---

## 2. The user's 60-second story (Pillar 2) — and the gap vs today

**The story the product should be built around** (uses ONLY location A + one public hosted page — needs ZERO framework adapters):

> "I told my agent on my laptop: *send 5 USDC to Maya.* It did. I open OneMem at `localhost:4040 → /trace/<id>` and see the whole tree: which wallet skill it called, which MCP server, the amount, the oracle price it read, parent→child order, timing. I click **Verify** — the page walks the Merkle chain of on-chain `ActionCall` objects and turns chartreuse: **Verified ✓**. I paste the session id into `app.onemem.xyz/verify/<id>` and send it to Maya's accountant — no login, no install — and they watch the same chain verify itself. Nobody trusted me, OneMem, or any vendor." (Grounded: `packages/dashboard/CLAUDE.md` "headline view"; `purpose-local-vs-hosted.md:83,153-207`; `GOAL.md:30-32`.)

**The gap vs what a user sees today — four hard truths from source:**

1. **There is no live, in-session feed.** The Claude Code / Codex hooks buffer each tool call to a throwaway JSONL file and do nothing visible until the `Stop` hook flushes everything on-chain in one batch (`plugin-claude-code/scripts/observe.js:23`, `summarize.js:42-73`). The dashboard's only "live" feed is a 5-second poll of the chain (`dashboard/app/api/stream/route.ts:12,28`). During a session there is **nothing to watch** — the opposite of the claude-mem "alive on localhost" feeling OneMem borrows the vocabulary of. A session row appears only AFTER the agent session ends.

2. **The dashboard is probably EMPTY right now** because of a package-id bug (see §5a). The list/overview/memories reads query the wrong package id post-upgrade and return zero, while a direct `/trace/[id]` page still verifies.

3. **The local `/apps` page shows five frameworks that can't run on the laptop**, each with a fake Pause toggle, fake "Tracing/active now" status, and an "Enforced" badge (`dashboard/lib/runtimes.ts:24-90`, `app/apps/AppsView.tsx:85-188`). Toggling Pause on the ElevenLabs card does nothing — that code runs on a server that never reads the local controls file. This is the exact dishonesty you smelled.

4. **The headline is buried.** The landing H1 leads with "One memory layer for every runtime" and orders trace+replay as pillar "02" (`apps/landing/app/page.tsx:34-37`, `landing-content.ts:40-58`). Settings hardcodes "Auto-capture on / Auto-trace on" (`SettingsView.tsx:226-227`); Overview re-prints the session count as "Verifiable" in green with unconditional check marks before anything is verified (`app/page.tsx:74,113-115`).

---

## 3. Dashboard purpose — SETTLED (repeat these from memory)

- **LOCAL (`localhost:4040`) is for:** *inspecting, verifying, and replaying the agents running on THIS machine — my Claude Code / Codex / OpenClaw — with no login.* (Your daily driver, location A only.)
- **HOSTED (`app.onemem.xyz`) is for:** *the jobs that can't live on one laptop — onboarding a new account, pairing my CLI, sharing a namespace, watching my DEPLOYED app's traces from anywhere, and the public `/verify/<id>` page anyone can hit with no login.*
- **Why both exist (one line):** *verifiability is worthless unless a NON-owner can verify, and sharing/cross-device/deployed-app traces are inherently multi-machine — so they need a hosted URL; local exists for the opposite reason: private, offline, no-login inspection of my own machine.*

This split is already written correctly in `docs/05-our-architecture/06-dashboard/purpose-local-vs-hosted.md:11-19,87-93`. **The boundary is right. The code violates it.** This is not a docs problem.

---

## 4. The integration → surface placement matrix

**Your three literal questions, answered up front:**
- *"Do we remove Vercel etc. from local?"* — **YES. Delete all five framework adapters from the local dashboard.** They run on servers; their local Pause/Trace toggles are provable no-ops (`runtimes.ts:199-207` writes `~/.onemem/runtime-controls.json`, which ONLY local hooks read — `plugin-claude-code/scripts/onemem-lib.mjs:152-166`).
- *"How do we query an adapter's traces?"* — **By namespace + `environment` string, from on-chain events. There is NO "connected local app" concept anywhere.** Confirmed in every thread: `fetchRecentSessions` queries `TraceSessionOpenedEvent` globally with no owner/connection filter and buckets by `session.environment` (`dashboard/lib/trace.ts:197-217`, `lib/runtimes.ts:166-173`). A Vercel trace and a Claude Code trace are read by the *identical* code path. The adapter just sets `environment: "vercel-ai"` (`sdk-ts/src/runtime.ts:333`, `traces.ts:127`). You query the namespace; you filter by environment.
- *"What is local for vs hosted for?"* — §3.

| Integration | Exec location | Correct home | Honest one-line claim |
|---|---|---|---|
| **Claude Code** | A — laptop | **LOCAL** (native runtime card, real Pause/Trace toggles) | Native hooks capture this machine's tool calls; batched on-chain at Stop. |
| **Codex** | A — laptop | **LOCAL** (native runtime card) | Same pipeline as Claude Code **after a one-time `/hooks` trust**; `codex exec` does not capture. Label `trusted-hooks-required`, not `enforced`. |
| **OpenClaw** | A (local) or B (server) | **LOCAL** if local; **queryable namespace** if a cloud deploy | Native plugin captures turns; a server OpenClaw is a namespace you query, not a local app. |
| **Hermes** | A/B — runtime process | **LOCAL** if local; else **namespace-only** | Provider; appears only after it emits traces. |
| **Cursor / Windsurf / Cline / OpenCode / Gemini** | C — local, MCP-only | **LOCAL**, controls-FREE "MCP clients" section | Explicit OneMem tool calls only — no automatic capture or recall. (Currently absent from the dashboard entirely.) |
| **Vercel AI SDK** | B — deployed | **HOSTED** namespace-scoped trace view. Local: **REMOVE** | Records `environment=vercel-ai` traces from your deployed app once wired. |
| **OpenAI Agents SDK** | B — deployed | **HOSTED** namespace view. Local: **REMOVE** | Records traces from your app process; query by namespace. |
| **CrewAI** | B — Python app | **HOSTED** namespace view / **CUT from demo**. Local: **REMOVE** | Explicit tracer wrapper today, not native `provider:onemem`. |
| **LiveKit** | B — deployed voice | **HOSTED** namespace view / **CUT from demo**. Local: **REMOVE** | Explicit tracer; voice agent undemoable in a slot. |
| **ElevenLabs** | B — deployed voice | **HOSTED** namespace view / **CUT from demo**. Local: **REMOVE** | Explicit tracer; not a native memory adapter. |

**The call on framework adapters:** they **leave the local dashboard entirely**. They go to a **hosted, account-scoped trace view** ("set up a namespace → watch your deployed app's traces from anywhere"). Note the refinement on your "API key" instinct: OneMem's credential is a **Sui delegate key + namespace capability**, not an opaque API key — the docs deliberately reject API-key management (`purpose-local-vs-hosted.md:103`). The shape of your idea is exactly right; the primitive is "namespace + delegate key," and the read path (`fetchRecentSessions`/`fetchSession`) already supports it.

**Keep the adapter PACKAGES shipping** (they emit real traces; cutting them would be a silent scope cut of a track-critical Pillar-3 signal). **For the hackathon demo, feature ONE end-to-end** — Vercel AI (flagship JS) or OpenAI Agents (richest trace). **CUT CrewAI / LiveKit / ElevenLabs from the demo dashboard** (Python→Node-CLI bridge friction; voice undemoable in a pitch slot) — leave them as "available adapters (emit-and-query)" catalog rows with no chrome.

---

## 5. What's actually broken (ranked, with file:line)

### (a) Correctness bugs — fix first or the dashboard is empty
- **BUG-1 — package-id event-read bug (CONFIRMED, critical).** Testnet was upgraded, so `packageId (0xc2e8…) ≠ originalPackageId (0x64c1…)` (`sdk-ts/src/generated/addresses.ts:31-32`). Move events live under the ORIGINAL id, but the dashboard queries the upgraded id: `lib/trace.ts:33,200` and `lib/memory.ts:64` use `addr.packageId`, while the CLI/SDK correctly use `originalPackageId || packageId` (`cli-ts/src/util/sui.ts:23`, `sdk-ts/src/traces.ts:287`). **Symptom reproduced from source:** Overview, `/apps`, `/memories`, and the SSE feed all read 0, while a single `/trace/[id]` still verifies (it re-derives the id from the object type, `lib/trace.ts:94`). **Fix:** one `eventPackageId` helper used in `lib/trace.ts` + `lib/memory.ts`.
- **BUG-2 — local dashboard binds `0.0.0.0` (privacy).** `bin/onemem-dashboard:26` exposes your private credentials/memory inventory to the whole LAN. Should bind `127.0.0.1` for local mode.

### (b) The missing local-worker "alive dashboard" gap
- claude-mem feels alive because a localhost worker daemon writes each tool call to local SQLite *synchronously inside the request* and pushes it over SSE — durable and visible the instant the call finishes. OneMem has **none of this**: no worker, no durable local store, no per-tool-call feed. The buffer is a transient JSONL deleted at Stop (`summarize.js:72`); the only "live" surface polls the chain every 5s (`app/api/stream/route.ts:12,28`). **OneMem has a PROOF layer but no LOCAL-WORKER truth** — so it cannot feel alive and it conflates "observed locally" with "anchored on chain." Note: neither Claude Code nor Codex has this yet, so the parity bar you're matching is itself not yet claude-mem-grade.

### (c) Local/hosted confusion + frameworks-in-local nonsense (the root disease)
- `dashboard/lib/runtimes.ts:24-90` hardcodes nine runtimes in ONE flat `KNOWN_RUNTIMES` list, five of them location-B frameworks, all tagged `coverage: "enforced"`.
- `app/apps/AppsView.tsx:85-188` renders all nine with Pause toggle, Trace-capture toggle, "Enforced" badge, live status dot, and a `pip install` command — under the subtitle "from your **local** OneMem setup" (`AppsView.tsx:91`). So a localhost page offers to "pause auto-capture" for ElevenLabs/Vercel code that physically cannot run there. The toggles write a local file no deployed app reads. **Enforcement theater.**
- Location-C MCP clients (Cursor/Windsurf/etc.) are simultaneously **absent** from the dashboard while present on the landing strip (`landing-content.ts:64`) — the list over-includes B and omits C.

### (d) Dishonest copy to DELETE
- `SettingsView.tsx:226-227` — static hardcoded "Auto-capture on / Auto-trace on". Contradicts per-runtime toggles, MCP-only clients, and un-wrapped frameworks.
- `app/page.tsx:74,113-115` — "Verifiable" card re-prints session count in verify-chartreuse + unconditional green checks on every row. Implies verified-before-verification.
- `landing-content.ts:55-58,61-71` — "every runtime AND framework, one dashboard for all" + the flat A+B+C integration strip. The impossible promise (reads can be unified; *controls* cannot) and the category-erasing list.
- `coverage: "enforced"` on every row — replace with honest per-capability tiers.

---

## 6. Independent verdict on the Codex audit

The dedicated cloud/framework-adapters audit file at the briefed path (`~/Documents/Codex/2026-06-19/onemem-cloud-framework-adapters-audit/...`) **does not exist / is permission-blocked on disk** — multiple threads verified this. Verdicts are against the consolidated `.thoughts/research/2026-06-19-integration-taxonomy-reset.md`, which folds it in.

**RIGHT (CONFIRMED):**
- `KNOWN_RUNTIMES` over-flattens hosts + framework libs into one list with blanket `enforced`. (`runtimes.ts:24-90`)
- Reads are by `environment`/namespace, "activity only after `environment=<x>` traces exist." (`trace.ts:197-217`, `runtimes.ts:166-173`)
- The package-id event-read bug (`addr.packageId` vs `originalPackageId||packageId`). CONFIRMED with hard evidence (`addresses.ts:31-32`).
- Framework adapter docs are ahead of implementations — they're explicit tracers, not native `provider:onemem`. (Also contradicts `GOAL.md:46-49`.)
- claude-mem parity needs a local worker, not just a Next dashboard. CONFIRMED.
- Hosted = a "Hosted Hub" for onboarding/sharing/verify, not a full local-dashboard replacement.

**OVERREACHED / UNDER-SHOT (the miss you flagged, CONFIRMED):**
- **Codex's remedy keeps the five framework adapters INSIDE the local dashboard**, merely re-sectioned as "Integrations → Available adapters" and the tab renamed `Apps → Integrations` (`taxonomy-reset:98-111,159-160`). **This is the exact miss:** it treats the problem as labeling/IA when it is execution-location/product-surface. A relabeled section in a *localhost* dashboard still implies you manage these locally, and it leaves the no-op Pause/Trace toggles in place. The correct call — which Codex never makes — is that location-B adapters **do not belong in local chrome at all** and must be rehomed to hosted. Your instinct beats the prior audit here.

No Codex claim was outright REFUTED; the one Codex-specific overreach risk ("all reads broken") is nuanced — per-session `/trace/[id]` survives the package-id bug; only the LIST paths break.

---

## 7. The corrected product model + recommended sequence

Direction only, no code. Make these changes in this order:

1. **FIX BUG-1 (package-id) first.** Add an `eventPackageId` helper (mirror `cli-ts/src/util/sui.ts:23`) and use it in `dashboard/lib/trace.ts` + `lib/memory.ts`. Without this the dashboard is empty and every other fix is invisible. Bind `127.0.0.1` (BUG-2) in the same pass.

2. **REMOVE the five framework adapters from local.** Delete `vercel-ai`, `openai-agents`, `crewai`, `livekit`, `elevenlabs` from `KNOWN_RUNTIMES` (`dashboard/lib/runtimes.ts:55-89`). Make the local runtime list **derived-only** — render a runtime card only for location-A runtimes that actually read the local controls file. Their traces still surface automatically in `/sessions` and `/trace/[id]` by environment, so **zero capability is lost.**

3. **ADD a controls-free "MCP clients" section** to local `/apps` for Cursor/Windsurf/Cline/OpenCode — no capture/pause toggle, fixed badge: "Explicit tools only — no automatic capture or recall."

4. **Replace `coverage: "enforced"` with honest capability tiers:** `native-hooks` (Claude Code), `trusted-hooks-required` (Codex — badge: "requires a one-time `/hooks` trust; `codex exec` does not capture"), `mcp-tools-only`, `framework-adapter`, `planned`.

5. **DELETE the dishonest copy:** static "Auto-capture on / Auto-trace on" (`SettingsView.tsx:226-227`); the fake universal "Verifiable" card + unconditional green checks (`app/page.tsx:74,113-115`). Re-label Overview "Connected runtimes" → "Environments seen in this namespace" (it's namespace-derived, not machine-connected).

6. **RE-POINT the headline to Pillar 2.** Landing H1 leads with trace+replay+verify; demote "every runtime/framework" to mechanism; split the integration strip into labeled groups (Local runtimes / MCP clients / Deployed-app adapters).

7. **ADD the hosted namespace-scoped trace view** ("watch my deployed app's traces from anywhere"). Reuse `fetchRecentSessions`/`fetchSession`, account-gated, filtered to the signed-in namespace. Onboarding already mints the namespace + delegate key the deployed adapter uses to write. This is the new surface that closes your "API key → see your app's traces" loop — as namespace + delegate key.

8. **BUILD the local worker (`onemem worker`)** — localhost SQLite + `/stream` SSE that hooks write to on every `PostToolUse`, with on-chain proof as an async per-row `proof_status` badge that upgrades live (`local → anchored → verified`). This is the real "alive on localhost" build and the only item here that is a feature, not a fix. **Sequence it last** — it's the largest lift and the §5a/c fixes deliver the honesty win immediately without it.

**CUT from hackathon scope to shrink the confusion surface:** CrewAI, LiveKit, ElevenLabs as demo'd adapters (keep packages, drop from dashboard chrome — feature ONE adapter, Vercel AI or OpenAI Agents, end-to-end via hosted). Do **not** cut the adapter packages themselves.

**The single most important correction (one sentence):** *Delete the five framework adapters from `dashboard/lib/runtimes.ts:KNOWN_RUNTIMES` so local `/apps` lists only the agents that actually run on this machine — killing the fake Pause toggles and "Enforced" badges on code that runs in the cloud — and rehome those adapters to a hosted, namespace-scoped trace view; nothing is lost because adapter traces are already read by environment from chain, not by local connection.*

---

## 8. v1 cross-check addendum (folded in from the first investigation run)

The first investigation run (preserved at `./v1/*.md`) reached the same conclusions independently. Two findings from v1 are NOT yet captured above and are folded in here so this doc is the complete combined record:

### (a) BUG-3 — MCP memory writes emit NO on-chain attestation (CONFIRMED, honesty-critical)
In an MCP-only client (Cursor/Windsurf/etc.), `onemem_add_memory` calls `onemem.requireMemory().add(text, { namespace })` passing ONLY the MemWal namespace string (`packages/mcp-server/src/index.ts:82`). The SDK only emits the on-chain `memwal_write` `ActionCall` when `sessionId` + `onememNamespaceId` + `rwCapId` are ALL supplied (`packages/sdk-ts/src/memory.ts:182-194`) — which the MCP path never does. The integration test confirms it: it asserts only `walrusBlobId` is returned, never `callId`/`suiTxDigest` (`packages/mcp-server/tests/mcp.integration.test.ts:64-69`). **Consequence:** a memory written through MCP is stored encrypted on Walrus but produces **no trace node, no Merkle attestation** — so the claim "every memory write is an attested on-chain trace node" is FALSE for MCP clients today. **Decision needed:** either (1) wire `add_memory` to open/append a session so MCP writes DO attest, or (2) stop claiming on-chain attestation for the MCP memory path. This is a real correctness+honesty gap the v2 pass did not surface.

### (b) STRATEGIC FORK — trace-led vs memory-led headline (the one real positioning decision)
v1 thread 01 found a live contradiction the product is fighting internally: `GOAL.md:25-26` declares **trace+replay** the end-user headline, but (i) the shipped landing leads with "decentralized memory," and (ii) a PRIOR Codex product audit (`.thoughts/research/2026-06-18-onemem-product-code-audit.md:146`) explicitly recommended **demoting verification and leading with memory** ("Mem0-but-decentralized"). So two prior research passes disagree on the single most important framing question. This synthesis (and v1 thread 01) recommend **trace-led** — it is the differentiated, demoable, judge-legible asset nobody else ships, and it re-aligns to Abu's own frozen GOAL.md; "decentralized memory" reads as "Mem0 but blockchain," which GOAL.md:93 itself names as the losing frame. **This is Abu's call to confirm, because it drives landing copy, demo script, and positioning.**
