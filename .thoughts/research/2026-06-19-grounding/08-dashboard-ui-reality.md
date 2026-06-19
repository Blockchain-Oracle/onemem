# Thread 08 — Dashboard Current-UI Reality

**Date:** 2026-06-19
**Thread:** dashboard-current-ui-reality
**Posture:** READ-ONLY on product code. Every claim cited to file:line.
**Lens:** EXECUTION LOCATION determines PRODUCT SURFACE. (A) coding-agent runtimes on the user's laptop = local-dashboard content; (B) framework SDKs embedded in the developer's deployed app = hosted / queryable-namespace content, NOT local chrome; (C) MCP-only clients = explicit-tool-call surface, no auto-capture.

---

## 0. One-paragraph truth of this surface

The OneMem dashboard ships ONE Next.js codebase (`packages/dashboard/`) that is launched as a **localhost daily driver** (`bin/onemem-dashboard` binds `0.0.0.0:4040`, reads `~/.onemem/credentials.json`, no login) AND is meant to back the **hosted hub** (`apps/hosted-dashboard/`). On every screen it presents a SINGLE flattened list — `KNOWN_RUNTIMES` (`lib/runtimes.ts:24-90`) — that mixes location-A coding runtimes (Claude Code, Codex, OpenClaw, Hermes) with location-B framework adapters that run inside the developer's DEPLOYED app on a server (Vercel AI, OpenAI Agents, CrewAI, LiveKit, ElevenLabs). The local `/apps` page (`app/apps/AppsView.tsx`) then renders LOCAL POLICY CONTROLS — Pause toggle, Trace-capture toggle, "Enforced" coverage badge, copy-paste install command — for ALL nine, including the five that never run on the user's machine and whose pause toggle writes a local `runtime-controls.json` that those server-side adapters never read. That is the central dishonesty this whole grounding study exists to fix: the local dashboard claims local control over things that don't execute locally. Compounding it, the actual read model is "by namespace + by `environment` string emitted into on-chain events" (`lib/trace.ts:167`, `lib/memory.ts:72`) — i.e. reads are keyed on what the trace SAYS its environment is, NOT on any "connected local app." And the list queries are broken by a package-id bug (below) so today the most likely first-timer experience is an EMPTY dashboard with nine fake "Add runtime / Enforced" cards.

---

## 1. Per-screen walkthrough as a confused first-timer

### Launch (`bin/onemem-dashboard`)
- Spawns the standalone Next server with `HOSTNAME: "0.0.0.0"` (`bin/onemem-dashboard:26`). For a "local daily driver" that reads your private `~/.onemem/credentials.json`, binding to `0.0.0.0` exposes the dashboard to the whole LAN, not just `127.0.0.1`. Anyone on the coffee-shop wifi who hits `http://<your-ip>:4040` gets your memory/trace inventory and the Settings page (which renders delegate metadata, namespace ids, relayer url). **Should bind `127.0.0.1` for local mode.** This is a real correctness/privacy bug, not cosmetic.

### `/` Overview (`app/page.tsx`)
- Header copy: "Everything your agents did — encrypted, chained, and verifiable on `testnet`." Honest in spirit, but "Everything" overclaims given MCP-only clients and un-instrumented frameworks capture nothing.
- Four stat cards: Sessions (count), Runtimes ("distinct environments"), **Verifiable = `sessions.length`** (`app/page.tsx:74`), Network. The "Verifiable" card just re-prints the session count in chartreuse and asserts "Merkle-chained" — it does NOT actually verify anything; it's a styling lie that every session is verified. A confused founder reading this thinks the dashboard verified them; it didn't.
- "Recent sessions" panel: each row stamps a green `st-ok` check icon (`app/page.tsx:113-115`) on EVERY session unconditionally — again implying success/verified before any verification ran.
- "Connected runtimes" panel: derived from `session.environment` strings actually seen on chain (`app/page.tsx:28-33`). This is the ONE honest runtime view in the app — it shows only environments that really emitted sessions. But it sits next to `/apps` which shows nine hardcoded cards, so the two disagree.
- **First-timer reality:** with zero sessions (fresh install) every number is 0, the "Add runtime" button points at `/apps`, and `/apps` shows nine "Enforced" cards. The mismatch (Overview: "None seen yet" vs Apps: nine active-looking cards) is immediately confusing. **With the package-id bug, even AFTER recording sessions the Overview can read 0** (see §3).

### `/memories` (`app/memories/MemoriesView.tsx` + `lib/memory.ts`)
- Honest framing: panel sub-label says "metadata-only · derived from on-chain memwal_write" (`MemoriesView.tsx:88`) and `lib/memory.ts:1-6` documents that MemWal 0.0.5 has no list endpoint so the inventory is derived from `tool_name="memwal_write"` ActionCalls. Good — this screen is the most honest in the app.
- Empty state copy is decent: "Record one with `onemem add` or an instrumented SDK runtime" (`MemoriesView.tsx:104-106`).
- BUT: the read keys on `addr.packageId` (`lib/memory.ts:64`) → same package-id bug → memories list can be empty even when memories exist on chain. The empty state then LIES by omission ("No memory events yet") when the truth is "query used the wrong package id."
- "Origin" column shows `m.toolNamespace` as a pill — for a first-timer this is opaque; there is no "which runtime/app wrote this" provenance label that GOAL Pillar-4 promises ("which runtime wrote it"). The closest is `toolNamespace`/`sessionId`, not a human runtime name.

### `/apps` (`app/apps/AppsView.tsx` + `lib/runtimes.ts`) — THE BROKEN SCREEN
- Title "Apps", sub: "Runtime trace policy and verifiable activity from your local OneMem setup" (`AppsView.tsx:89-92`). The words "your local OneMem setup" are applied to a grid that includes Vercel AI, OpenAI Agents, CrewAI, LiveKit, ElevenLabs — none of which are part of a *local* setup.
- The grid is seeded from `KNOWN_RUNTIMES` (`lib/runtimes.ts:24-90`): nine entries, **every one hardcoded `coverage: "enforced"`** (lines 32, 39, 46, 53, 60, 67, 74, 81, 88). Location-A and location-B are indistinguishable.
- Per card (`AppsView.tsx:113-189`): a **Pause** toggle and a **Trace capture** toggle that PATCH `/api/runtimes/:id` → `setRuntimeControl` (writes local `runtime-controls.json`, surfaced as `controlsFile` at `AppsView.tsx:103-105`). For Claude Code / Codex (location A, hooks read that file) this is meaningful. For ElevenLabs/LiveKit/Vercel (location B, code running on a server) **pausing here does NOTHING** — the deployed app never reads the user's local controls file. The toggle is a no-op dressed as enforcement.
- Coverage badge renders "Enforced" for all nine (`coverageLabel`, `AppsView.tsx:12-14`). Claiming "Enforced" for a framework adapter that "records only when app code wraps/attaches OneMem" is exactly the false claim the taxonomy-reset doc flags.
- Each card prints an install command (`pip install onemem-livekit`, etc., `lib/runtimes.ts:59-89`). Putting a `pip install` for a SERVER voice-agent library in a localhost "Apps / runtimes" policy panel is the location confusion in one screenshot.
- **MCP-only clients (location C) are entirely ABSENT** from this list — no Cursor/Windsurf/Cline/OpenCode rows. So the screen simultaneously over-includes location-B frameworks and omits location-C clients.
- **First-timer reality:** "I installed OneMem and it already shows ElevenLabs and CrewAI as Enforced/active runtimes on my machine? I never set those up." Then they toggle Pause on ElevenLabs and nothing changes anywhere. Trust gone.

### `/settings` (`app/settings/SettingsView.tsx`)
- Tabs: Account, Delegate keys, Runtimes, Providers, Advanced (`SettingsView.tsx:7`).
- **Account / Delegate keys:** genuinely useful + honest local data (signer, namespace, credentials file, delegate lifecycle). This is correct local-surface content.
- **Providers tab** (`SettingsView.tsx:209-222`) lists Vercel AI SDK, OpenAI Agents, CrewAI, LiveKit, ElevenLabs, Hermes with install commands. A read-only "here are the adapter packages" catalog is the LEAST harmful place for framework adapters — but it duplicates `/apps` and offers no namespace/API-key setup, so it's just a second copy of the confusion.
- **Advanced tab — the headline dishonesty:** renders `Row k="Auto-capture" v="on (plugins record automatically)"` and `Row k="Auto-trace" v="on"` (`SettingsView.tsx:226-227`). These are static hardcoded strings, not read from any config. They flatly assert auto-capture is ON globally, which contradicts the per-runtime trace toggles on `/apps`, contradicts MCP-only clients (no auto-capture possible), and contradicts framework adapters (record only when wrapped). This is the literal "Auto-capture on" lie the owner called out.

### `/sessions` and `/share`
- Present in nav (`components/AppShell.tsx:15-21`) but out of this thread's file set. Nav label "Apps" (`AppShell.tsx:18`) is the same mislabel the taxonomy-reset recommends renaming to "Integrations".

### `/api/stream` (`app/api/stream/route.ts`)
- SSE that polls `fetchRecentSessions(10)` every 5s and emits on top-session change (`route.ts:26-41`). Inherits the package-id bug: if `fetchRecentSessions` returns `[]` due to wrong package id, the live feed silently never fires "sessions" events — the dashboard looks dead even while the CLI sees new sessions.

### Landing (`apps/landing/app/landing-content.ts`)
- `PILLARS[2]`: "Cross-runtime … across **every runtime and framework**. One dashboard for all of them." (`landing-content.ts:55-58`) — the "every runtime/framework" overclaim verbatim.
- `INTEGRATIONS` (`landing-content.ts:61-71`) lists Claude Code, Hermes, **Cursor**, OpenClaw, Vercel AI SDK, OpenAI Agents, CrewAI, LiveKit, ElevenLabs in ONE flat row — location A + B + C mixed with no capability distinction, identical sin to `/apps`. (Note Cursor appears on landing but NOT in the dashboard `KNOWN_RUNTIMES` — inconsistent even with itself.)
- `STEPS[1]` (`landing-content.ts:27-31`) is actually CAREFUL and honest: "Trace-capable plugins and providers record after install, configuration, and runtime trust. MCP tools work without hook trust." Someone already fixed the landing STEPS to be honest but left PILLARS and INTEGRATIONS overclaiming. Inconsistent honesty.

---

## 2. Owner's open questions — answered

**Q1. What is the LOCAL dashboard FOR vs the HOSTED dashboard FOR? Why both?**

The repo already has a crisp, correct answer doc (`docs/05-our-architecture/06-dashboard/purpose-local-vs-hosted.md`) — the PROBLEM is the CODE doesn't honor it. Stated for a confused founder:

- **LOCAL dashboard (`localhost:4040`):** "Inspect the memory and action-traces produced by the agents running on THIS machine (Claude Code, Codex, OpenClaw, Hermes), plus verify/replay/manage them — no login, reads my local credentials file." (`purpose-local-vs-hosted.md:24-37`)
- **HOSTED hub (`app.onemem.xyz`):** "The entry point for people WITHOUT the CLI — onboarding/sign-up, the CLI-login callback, viewing my namespaces from another device, accessing a namespace someone shared with me, and the PUBLIC `/verify/[session_id]` page anyone can hit to confirm a trace's Merkle chain." (`purpose-local-vs-hosted.md:61-83`)
- **Why both:** verifiable/cross-device/shareable each have a non-owner audience that can't live on one machine (`purpose-local-vs-hosted.md:87-93`); and the CLI-login browser callback structurally needs a hosted URL (`purpose-local-vs-hosted.md:229-231`).

**The fix is not writing a new purpose — it's making `/apps`, Overview, and Settings STOP contradicting the doc that already exists.**

**Q2. Do framework adapters belong in the LOCAL dashboard?**

**No.** Vercel AI / OpenAI Agents / CrewAI / LiveKit / ElevenLabs are location-B: they execute in the developer's deployed app on a server. They must be REMOVED from `lib/runtimes.ts:KNOWN_RUNTIMES` and from the local `/apps` policy grid entirely (the Pause/Trace-capture/Enforced controls are no-ops for them). Recommendation:
- They belong on the **HOSTED** surface as a "set up a namespace + delegate/API credential → query your deployed app's traces by environment" flow (location-B's natural home), OR as nothing more than **queryable namespaces** with a read-only "Available adapters" catalog (install command only, no policy controls).
- For hackathon SCOPE: keep the *adapter packages shipping* (they're real Pillar-3 surface; don't scope them out), but in the DASHBOARD show them ONLY as a read-only catalog row (Settings "Providers" tab is acceptable) — never as local runtime cards with toggles. Cut the `/apps` framework cards from v0.1 local UI.
- MCP-only clients (location C: Cursor/Windsurf/Cline/OpenCode) should be a distinct local section labeled "MCP tools only — no automatic capture," NOT runtime cards with a trace-capture toggle.

**Q3. HOW do you query an adapter's traces? Is the read model "by namespace/environment"?**

**Confirmed from source: YES — reads are by namespace + by `environment` string, never by "connected local app."**
- `fetchRecentSessions` (`lib/trace.ts:197-217`) queries `TraceSessionOpenedEvent` globally and reads `j.environment` / `j.namespace_id` from each event. There is no "is this app connected locally" concept.
- `fetchRuntimeInventory` (`lib/runtimes.ts:160-197`) buckets sessions by `(session.environment || session.agentId || "unknown").toLowerCase()` (line 167) — the "runtime" of a row IS just the environment string the emitter wrote.
- `fetchMemories` (`lib/memory.ts:57-97`) filters on-chain `memwal_write` ActionCalls optionally by `namespace_id` (line 72).
So an adapter running on Vercel emits ActionCalls with `environment="vercel-ai"` (or whatever it sets) to a Sui namespace; you READ them by querying that namespace's events. The honest UI is therefore "traces grouped by environment, scoped to namespaces you can read" — exactly what Overview's "Connected runtimes" already does, and exactly what `/apps`' hardcoded cards FAKE. The hardcoded list should be deleted and the runtime view should be *derived from observed environments only*, with capability tiers attached as metadata.

---

## 3. CONFIRMED BUG LIST (with line numbers)

### BUG-1 (CRITICAL, Codex claim CONFIRMED): dashboard list reads use `packageId`, CLI/SDK use `originalPackageId || packageId`
- Testnet was UPGRADED: `packageId = 0xc2e839...` ≠ `originalPackageId = 0x64c14f...` (`packages/sdk-ts/src/generated/addresses.ts:31-32`, deployed `2026-06-18`). Move events are emitted under the ORIGINAL package's type, so event queries must use the original id.
- Dashboard uses the WRONG (upgraded) id:
  - `lib/trace.ts:33` `packageId: addr.packageId` → used by `fetchRecentSessions` (`lib/trace.ts:198-200`) for the `TraceSessionOpenedEvent` query.
  - `lib/memory.ts:64` `${addr.packageId}::${ACTION_CALL_EMITTED}` for the `memwal_write` query.
- CLI/SDK use the RIGHT id:
  - CLI `packages/cli-ts/src/util/sui.ts:23` exposes `eventPackageId: addresses.originalPackageId || addresses.packageId`; `packages/cli-ts/src/commands/trace.ts:75-77` queries `TraceSessionOpenedEvent` with `eventPackageId`.
  - SDK `packages/sdk-ts/src/traces.ts:287` lists sessions with `originalPackageId || packageId`; `traces.ts:119,161` build event types with the original id.
- **Symptom exactly matches Codex:** Overview, `/apps`, `/memories`, and the `/api/stream` feed (`app/api/stream/route.ts:28`) can all show ZERO after the upgrade, while a single `/trace/[id]` page STILL VERIFIES — because `fetchSession` re-derives the package id from the on-chain object type (`lib/trace.ts:94` `traceSessionPackageId(...)`, and `verifyTraceChain` uses `session.packageId` `traces.ts:336-340`). So "dashboard shows zero sessions while direct trace verification still works" is reproduced from source. **VERDICT: CONFIRMED.**
- Fix: a single `eventPackageId` helper (mirroring `cli-ts/util/sui.ts:23`) used in `lib/trace.ts:33/200` and `lib/memory.ts:64`.

### BUG-2 (privacy): local dashboard binds `0.0.0.0`
- `bin/onemem-dashboard:26` sets `HOSTNAME: "0.0.0.0"`. A credentials-reading local daily driver should bind `127.0.0.1`. LAN-exposes private memory/trace inventory + Settings metadata.

### BUG-3 (dishonest UI): static "Auto-capture on / Auto-trace on"
- `app/settings/SettingsView.tsx:226-227` hardcodes these strings; they reflect no real config and contradict per-runtime toggles, MCP-only clients, and un-wrapped frameworks.

### BUG-4 (dishonest UI): blanket "Enforced" coverage for framework adapters
- `lib/runtimes.ts` hardcodes `coverage: "enforced"` for all nine including Vercel/LiveKit/ElevenLabs/CrewAI/OpenAI Agents (lines 60,67,74,81,88). Their pause/trace toggles write a local file (`AppsView.tsx:41-45` → `setRuntimeControl`) that server-side adapters never read = enforcement theater.

### BUG-5 (misleading UI): fake universal "Verifiable" + green checks
- Overview "Verifiable" card just re-prints `sessions.length` in verify-chartreuse (`app/page.tsx:74`); every recent-session row gets an unconditional green `st-ok` check (`app/page.tsx:113-115`). Implies verified-before-verification.

### BUG-6 (mislabel / IA): location-A and location-B mixed; location-C missing
- `lib/runtimes.ts:24-90` + `app/apps/AppsView.tsx` flatten runtimes and frameworks; Cursor/Windsurf/Cline/OpenCode (MCP-only) absent from dashboard while present on landing (`landing-content.ts:64`). Landing PILLARS/INTEGRATIONS overclaim "every runtime and framework" (`landing-content.ts:57,61-71`).

---

## 4. Codex verdicts

- **"Dashboard event read path has a correctness bug (`addr.packageId` vs `originalPackageId||packageId`)"** (taxonomy-reset §"Key Finding 2") — **CONFIRMED.** Hard evidence: `lib/trace.ts:33/200` + `lib/memory.ts:64` vs `cli-ts/util/sui.ts:23` + `sdk-ts/traces.ts:287`, with `addresses.ts:31-32` proving the two ids actually differ post-upgrade.
- **"`KNOWN_RUNTIMES` hard-codes native hosts + framework libs into one list with broad `enforced` labels, making Vercel/LiveKit/ElevenLabs/CrewAI/OpenAI look like local connected apps"** (taxonomy-reset Summary + §4) — **CONFIRMED** verbatim against `lib/runtimes.ts:24-90` and `AppsView.tsx:89-92,134-138,184-188`.
- **"Memory rows ≠ trace rows; empty Memories after a trace proof is not necessarily a query bug"** (§3) — **CONFIRMED** as design (`lib/memory.ts:1-13`, `MemoriesView.tsx:88`), with the caveat that BUG-1 ALSO causes empty Memories — so the empty state is currently ambiguous between "no memwal_write" and "wrong package id." Both are real; the code comment only documents the first.
- **"Use 'Integrations' not 'Apps'"** (§4) — **CONFIRMED useful**; label lives at `AppShell.tsx:18` + `AppsView.tsx:89`. Renaming is necessary but INSUFFICIENT — relabeling a list that still shows no-op local toggles for server-side adapters does not fix the dishonesty. Codex slightly **OVERWEIGHTS the rename**; the real fix is REMOVING framework policy controls from local, not renaming the tab.
- **"ClaudeMem parity requires a local worker"** (§1) — out of this thread's direct file set; not refuted, noted as adjacent. The bind-`0.0.0.0` and empty-feed issues are consistent with the "no durable local feed, reads chain only" observation.
- **Prior Codex audit MISS (per task brief):** earlier Codex did NOT flag that framework adapters don't belong in local at all. **CONFIRMED MISS** — the taxonomy-reset doc only goes as far as "move framework libraries into an 'Available adapters' section" (Implementation Order step 4) and "rename Apps→Integrations," i.e. it still keeps them IN the local dashboard. The owner's stronger position — framework adapters are location-B and should not be local-dashboard chrome at all — is correct and goes beyond what Codex recommended.

---

## 5. The single most important correction (product/UI, not docs)

**Delete the framework adapters from the local dashboard's runtime model and make the local runtime list DERIVED-ONLY.**

Concretely:
1. In `lib/runtimes.ts`, REMOVE the five location-B entries (`vercel-ai`, `openai-agents`, `crewai`, `livekit`, `elevenlabs`) from `KNOWN_RUNTIMES`. Keep only location-A native hosts (Claude Code, Codex, OpenClaw, Hermes) as cards WITH Pause/Trace toggles (those toggles actually drive local hook behavior).
2. Add a separate, controls-FREE "MCP clients (tools only, no auto-capture)" section for Cursor/Windsurf/Cline/OpenCode.
3. Stop hardcoding `coverage: "enforced"`; tier per capability (`native-hooks`, `mcp-tools-only`, `framework-adapter`, `planned`) so no card claims enforcement it can't deliver.
4. Move framework adapters to the HOSTED surface (or a read-only "Available adapters" catalog) framed as "set up a namespace/credential → query your deployed app's traces by `environment`," matching how reads ACTUALLY work (by namespace + environment, §2-Q3).
5. While in this file, FIX BUG-1 (use an `eventPackageId` helper) so the derived list isn't empty, and FIX BUG-2/3/4/5 (bind `127.0.0.1`; delete the static "Auto-capture on" rows; stop the fake universal "Verifiable"/green-check).

This one change collapses the root disease: the local dashboard stops asserting local control over code that doesn't run locally, and the runtime list becomes a truthful reflection of what actually executed on this machine + what actually emitted traces to your namespaces.
