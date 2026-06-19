# OneMem Grounding — Thread 07: Dashboard, the User's Point of View

**Date:** 2026-06-19
**Thread:** dashboard-user-pov
**Posture:** READ-ONLY. Every claim below is grounded in source I actually read, cited file:line.
**Question I'm answering:** When a real human opens the OneMem dashboard / landing page, what do they SEE, what do they BELIEVE, and how does that diverge from what is TRUE?

---

## 0. The one-paragraph truth of this surface

The dashboard is real, well-built, and mostly honest about the headline (trace + verify) — but it ships **one correctness bug that can make the whole thing look empty**, and **two specific dishonesty spots** that a careful judge will catch. The bug: every list/overview/stream screen (`/`, `/apps`, `/sessions`, `/memories`, the live SSE feed) queries Sui events using the **upgraded** package ID, while the entire rest of the codebase (SDK, CLI, Python, hosted dashboard, Walrus static verifier) correctly uses the **original** package ID for event types after the on-chain package upgrade. Because the deployed package WAS upgraded (`0xc2e8…` current ≠ `0x64c1…` original), the dashboard can show "0 sessions / 0 memories" while `onemem verify` on the very same session works perfectly. The dishonesty: Settings → Advanced hardcodes "Auto-capture **on**" and "Auto-trace **on**" as if they were live facts (they're static strings), and the `/apps` page presents all nine integrations — including framework libraries like Vercel AI SDK, LiveKit, ElevenLabs, CrewAI — as locally-connected "Apps" with an "Enforced" coverage badge and pause/trace toggles, which misrepresents libraries-embedded-in-your-own-code as managed local runtimes. The landing page's "one memory layer for **every** agent runtime" plus an "8+ runtimes" stat compounds the same over-claim.

---

## 1. The two-dashboard reality (local vs hosted)

There are genuinely TWO Next.js apps:

- **Local** — `packages/dashboard/` — daily driver, `localhost:4040`, no login, reads `~/.onemem/credentials.json`. Launched by `bin/onemem-dashboard` which spawns the `.next/standalone` server (`bin/onemem-dashboard:13-24`). This owns the SHARED routes: `/`, `/memories`, `/apps`, `/sessions`, `/share`, `/trace/[session_id]`, `/settings`.
- **Hosted** — `apps/hosted-dashboard/` — the entry/hub: `/login`, `/cli-login`, `/onboarding`, `/share`, `/share/[capability_id]`, `/verify/[session_id]`, `/dashboard`. Enoki/zkLogin + dApp Kit.

The split is **documented coherently** in `docs/05-our-architecture/06-dashboard/purpose-local-vs-hosted.md`. That doc is honest and self-correcting (e.g. lines 145-149 explicitly retract the older "wrap every local route under `/dashboard/*`" plan). This is NOT confusing duplication at the architecture level — it's two deploys of mostly-shared intent. **The confusion for a user is lighter than the GOAL doc implies.**

**BUT** — one nav mismatch a user WILL notice: `purpose-local-vs-hosted.md:32` and the GOAL (`GOAL.md:60`) promise a `/memories` route "with per-app provenance column (which runtime wrote it)". The local nav (`components/AppShell.tsx:15-21`) is: Overview, Memories, Apps, Sessions, Share + Settings. The GOAL's route list (`GOAL.md:57-64`) instead names `/trace/[session_id]` and `/apps`. The shipped nav adds a `/sessions` route the GOAL never mentions and **the GOAL's headline `/trace/[session_id]` is reachable only by clicking a session, never from the sidebar.** A first-time user landing on `/` sees no "Trace" or "Verify" nav item — the single most important screen (per the GOAL, the "headline view") has no top-level entry point. They have to know to click a session row.

---

## 2. Per-screen walkthrough as a confused first-time user

### `/` Overview — `app/page.tsx`
What they see: four stat cards (Sessions / Runtimes / Verifiable / Network), a "Recent sessions" live panel, a "Connected runtimes" panel, and an "Add runtime" button.

- **Honest framing:** "distinct environments" sub-label (`page.tsx:66`) and the runtime breakdown are computed from REAL on-chain sessions (`page.tsx:28-33`). Good.
- **Subtle over-claim:** The "Verifiable" stat (`page.tsx:68-77`) renders `sessions.length` again — it asserts every session is "Merkle-chained" verifiable WITHOUT actually verifying any of them on this page. It's an assumption dressed as a count. A session whose chain is broken would still be counted here as "Verifiable".
- **The empty-state trap:** If the packageId bug bites (see §3), `fetchRecentSessions(50)` returns `[]`, so every stat reads `0` and the panel says "No sessions yet." (`page.tsx:104-107`). The user believes they have nothing — when in fact `onemem verify` would prove they do. **This is the worst user-trust failure in the product: the dashboard silently disagrees with the CLI.**

### `/memories` — `app/memories/MemoriesView.tsx`
What they see: a search box, filter chips (All / With blob / No blob / Recent / Active namespace), and a table of "memory events" with Origin / Namespace / Proof columns, each row badged "anchored".

- **Honest:** The panel sub-label says "metadata-only · derived from on-chain memwal_write" (`MemoriesView.tsx:88`) and the empty state correctly tells the user to run `onemem add` (`MemoriesView.tsx:104-107`). The data source comment in `lib/memory.ts:1-6` is admirably candid about MemWal 0.0.5 having no list endpoint.
- **The honest-but-confusing trap:** Memories ONLY appear if a `memwal_write` ActionCall was emitted (`lib/memory.ts:13,71`). A trace-only proof session (hook flush at Stop) creates trace calls but no `memwal_write`, so this page is legitimately empty even when traces exist. The Codex taxonomy artifact flags this (Key Finding #3). The empty state does NOT explain "you have traces but no memory writes" — the user just sees "No memory events yet" and may conclude OneMem is broken.
- **Same packageId bug:** `fetchMemories` queries `${addr.packageId}::events::ActionCallEmittedEvent` (`lib/memory.ts:64`) with the upgraded ID → empty after upgrade.

### `/apps` — `app/apps/AppsView.tsx` + `lib/runtimes.ts`
What they see: a grid of runtime cards. Nine are hardcoded (`lib/runtimes.ts:24-90`): Claude Code, Codex, OpenClaw, Hermes, CrewAI, LiveKit, ElevenLabs, Vercel AI, OpenAI Agents. Each card has a **Pause toggle**, a **Trace capture toggle**, a status dot, a session count, an install command, and a coverage badge labelled "**Enforced**".

This is the **biggest taxonomy dishonesty**:
- All nine are hardcoded `coverage: "enforced"` (`lib/runtimes.ts:36,46,52,59,66,73,80,88`). The badge renders "Enforced" (`AppsView.tsx:12-14`). But Vercel AI SDK, OpenAI Agents, CrewAI, LiveKit, ElevenLabs are **framework libraries that run inside the user's own application code** — there is no local process to "pause" or to "enforce trace policy" on. Toggling "Pause" on ElevenLabs writes a control file the framework adapter may never even read.
- The page title literally says "**Apps**" and the sub-copy says "Runtime trace policy and verifiable activity from your local OneMem setup" (`AppsView.tsx:89-92`). Calling an embeddable npm/pip library a connected local "App" with enforceable policy is the precise mislabel the Codex taxonomy artifact (Key Finding #1, #4) calls out.
- A user reads this as: "I have 9 apps connected, OneMem is enforcing trace capture on all of them." Truth: 3 are native host plugins (Claude Code / Codex / OpenClaw), 1 is a runtime provider (Hermes), and 5 are libraries you must wire into your own code before anything is captured.

The pause/trace TOGGLES themselves are real and wired (`AppsView.tsx:37-83` → `PATCH /api/runtimes/[id]` → `lib/runtimes.ts:199-207` → SDK `setRuntimeControl`). So the controls function; it's the SCOPE claim ("Enforced", "Apps", "your local setup") that overreaches for the library rows.

### `/sessions` — `app/sessions/SessionsView.tsx` (+ `lib/sessions.ts`)
Groups recent sessions by day into runtime "lanes" with a verify-all drawer. Powered by `fetchRecentSessions` → **inherits the packageId bug**. Note `lib/sessions.ts:163-168` `runtimeClass()` only knows hermes/mcp/cursor/claude — every other runtime falls through to `"rt-claude"` styling, so a CrewAI or LiveKit session is visually painted as Claude. Cosmetic, but reinforces the flattening.

### `/trace/[session_id]` — THE headline (`app/trace/[session_id]/`)
This is the GOAL's signature moment. It uses `fetchSession` (`lib/trace.ts:77-109`), which is **self-correcting** for the per-session view: it derives the package ID from the session OBJECT's type string (`lib/trace.ts:94` → `traceSessionPackageId`), and that object type carries the ORIGINAL package ID after upgrade. So `fetchCalls` gets `meta.packageId || packageId` (`lib/trace.ts:102`) = correct original ID. **The headline trace view works even with the bug.** The verify path passes the bare upgraded `packageId` to `verifyTraceChain` (`lib/trace.ts:103`), but the verifier ALSO re-derives from the object type (`sdk-ts/src/traces.ts:336` `session.packageId || packageId`), so it self-corrects too. Net: the demo trace+verify is safe; only the LIST surfaces that funnel through `fetchRecentSessions`/`fetchMemories` are broken.

### `/settings` — `app/settings/SettingsView.tsx`
Tabs: Account / Delegate keys / Runtimes / Providers / Advanced.

- Account, Delegate keys: honest, file-backed, real credential summary (`SettingsView.tsx:127-197`).
- **Advanced tab — the clearest dishonesty:**
  ```
  Row k="Auto-capture" v="on (plugins record automatically)"   (SettingsView.tsx:226)
  Row k="Auto-trace"   v="on"                                  (SettingsView.tsx:227)
  ```
  These are **hardcoded literal strings**, not derived from any runtime state. They assert "plugins record automatically" as a universal fact. For MCP-only clients and un-wired framework adapters this is FALSE — nothing records automatically until hooks are trusted / code is wired. The disclaimer below ("These reflect the SDK defaults"; `SettingsView.tsx:229-236`) softens it slightly but a user reads the bold "on" first. This is exactly the "auto-capture on" claim the project owner flagged as possibly unbacked.

### `/share` — exists locally (`app/share/ShareView.tsx`). Satisfies `GOAL.md:62`. Not deeply audited in this thread (out of focus), noted present.

---

## 3. THE BUG — confirmed with line numbers

**Claim under test (Codex):** "The dashboard uses `addr.packageId` while CLI/SDK use `originalPackageId || packageId` for event queries."

**VERDICT: CONFIRMED.**

### Evidence — dashboard uses the WRONG (upgraded) id for event queries:
- `packages/dashboard/lib/trace.ts:33` — `packageId: addr.packageId` (the `client()` helper).
- `packages/dashboard/lib/trace.ts:199-202` — `fetchRecentSessions` queries `${packageId}::events::TraceSessionOpenedEvent` with that bare upgraded id.
- `packages/dashboard/lib/memory.ts:64` — `fetchMemories` queries `${addr.packageId}::events::ActionCallEmittedEvent`.
- Grep of dashboard SOURCE (`lib/` + `app/`) for `originalPackageId` returns **nothing** — the dashboard source never references it. (It appears only in stale `.next/` build output, which is irrelevant.)

### Evidence — everyone else uses `originalPackageId || packageId` for event/object types:
- CLI: `packages/cli-ts/src/util/sui.ts:23` — `eventPackageId: addresses.originalPackageId || addresses.packageId`, and that `eventPackageId` is what's passed into the event query at `packages/cli-ts/src/commands/trace.ts:75-77`.
- SDK traces: `packages/sdk-ts/src/traces.ts:119`, `:161`, `:287` — all `originalPackageId || packageId` for `TraceSession` type, `ActionCallEmittedEvent` type, and `listSessions`.
- SDK memory: `packages/sdk-ts/src/memory.ts:253` — `const packageId = this.client.addresses.originalPackageId || this.client.addresses.packageId;` then queries `ActionCallEmittedEvent` (`:266`).
- SDK namespaces: `packages/sdk-ts/src/namespaces.ts` — `originalPackageId || packageId` at lines 66, 159, 244, 286, 326.
- SDK client: `packages/sdk-ts/src/client.ts:140` — same pattern for type package id.

### Why it actually breaks (root cause):
The deployed package WAS upgraded. `packages/sdk-ts/src/generated/addresses.ts:31-32`:
```
packageId:         0xc2e839c719e1c61222440f5661199e68de5413d8cfb49dd8bae3223e92fcf138  (current)
originalPackageId: 0x64c14fc069fe3d3584b8474b4e9b58beb55373767edecedf6e4c53732d4ceafc  (original)
```
On Sui, **events and objects retain the ORIGINAL package ID in their type** after an upgrade. The independent verification audit `.thoughts/verification/2026-06-18-hosted-sui-upgrade-type-parser.md:108-113` confirms this with on-chain evidence: querying the upgraded package's event type "returned no current-package `NamespaceCreatedEvent` records," while events exist under `0x64c14f…`. The Codex taxonomy artifact `.thoughts/research/2026-06-19-integration-taxonomy-reset.md:77-84` (Key Finding #2) states it plainly: *"After upgrades, the dashboard can show zero sessions while direct trace verification still works."*

### Blast radius (what goes blank):
`fetchRecentSessions` and `fetchMemories` are the only two raw event readers in the dashboard. They feed:
- `/` overview stats + recent panel (`app/page.tsx:22`, `lib/stats.ts:23-25`)
- `/apps` runtime inventory session counts + status (`lib/runtimes.ts:166`)
- `/sessions` grouped view (`lib/sessions.ts:55-56`)
- `/memories` table (`lib/memory.ts`)
- The live SSE feed (`app/api/stream/route.ts:28`)

So after the upgrade, a user sees an **empty dashboard everywhere except the per-session `/trace/[id]` deep link** — which self-heals via the object-type-derived package id. The dashboard contradicts itself and the CLI.

### The fix (one helper):
Add an `eventPackageId` accessor in the dashboard mirroring `cli-ts/src/util/sui.ts:22-23` and use it in `lib/trace.ts:33` and `lib/memory.ts:64`. Codex's recommended fix (`integration-taxonomy-reset.md:84`, Implementation Order #1) matches. Low risk, high impact.

---

## 4. The "every runtime/framework" / claim-honesty audit

- **Landing hero** (`apps/landing/app/page.tsx:34-37`): *"One memory layer for every agent runtime."* — the literal "every" over-claim.
- **Landing hero meta** (`apps/landing/app/page.tsx:63-66`): "**8+** runtimes" stat. There are exactly 9 hardcoded; "8+" implies an open-ended, growing, fully-supported set.
- **Landing pillar 3** (`apps/landing/app/landing-content.ts:55-57`): *"The same memory namespace and trace format across **every runtime and framework.**"*
- **Landing INTEGRATIONS** (`landing-content.ts:61-71`): lists Claude Code, Hermes, **Cursor**, OpenClaw, Vercel AI SDK, OpenAI Agents, CrewAI, LiveKit, ElevenLabs. **Cursor is listed but has NO package in `packages/`** (confirmed: the package dirs are claude-code, codex, hermes, openclaw, crewai, elevenlabs, livekit, openai-agents, vercel-ai). Cursor is MCP-client-only at best; listing it flat next to native plugins is the over-claim the Codex artifact warns against (`integration-taxonomy-reset.md:180`, "Do not claim Cursor/Windsurf… automatic trace capture").
- **Landing STEP 2** (`landing-content.ts:27-31`) is actually the MOST honest copy in the whole product: *"Trace-capable plugins and providers record after install, configuration, and runtime trust. MCP tools work without hook trust."* This is the scoping language the rest of the UI should adopt. The hero "every runtime" headline contradicts the product's own honest step-2 caveat.

**Reality check:** all 9 integration packages physically exist as scaffolded packages (3 native plugins + Hermes provider + 5 framework providers), plus mcp-server, cli-ts, cli-python, both SDKs. So OneMem is NOT vaporware — the breadth is real as code. The dishonesty is in **flattening capability tiers**: presenting an embeddable library and a native lifecycle-hook plugin as the same kind of "connected, enforced, auto-capturing App."

---

## 5. The taxonomy fix (Apps → Integrations with capability tiers)

This is the single structural correction that makes the user-facing claims honest. Grounded in the Codex taxonomy artifact but stated as my own recommendation:

**Rename the screen `Apps` → `Integrations`** (`AppShell.tsx:18` label; route can stay `/apps`). Group cards into sections instead of one flat grid:

1. **Native runtimes** (lifecycle-hook capture) — Claude Code, OpenClaw, (Codex w/ trusted hooks).
2. **MCP clients** (tools only, NOT auto-capture) — Cursor, Windsurf, Codex baseline. Show "MCP tools only — host actions are not auto-captured."
3. **Runtime providers** — Hermes.
4. **Framework adapters** (record only when wired into your code) — Vercel AI SDK, OpenAI Agents, CrewAI, LiveKit, ElevenLabs. Label "Available adapter — records after `environment=…` traces exist." Move these OUT of pausable local-policy controls.
5. **Protocol surface** — MCP server.

**Replace the binary `enforced`/`stored` badge** (`lib/runtimes.ts:14`, `AppsView.tsx:12`) with a capability tier per row: `native-hooks` / `trusted-hooks-required` / `mcp-tools-only` / `framework-adapter` / `runtime-provider`, plus a live `chain-observed` flag derived from whether the dashboard has actually seen sessions for that `environment`. (Codex's label set, `integration-taxonomy-reset.md:138-149`, is a good starting vocabulary.)

**Fix Settings → Advanced:** either derive "Auto-capture / Auto-trace" from real per-runtime control state, or relabel to "SDK default: traces capture when a trace-capable plugin is installed AND its hooks are trusted." Stop printing a bare "on."

**Fix the empty states** to distinguish "no data on chain" from "query found nothing": the Memories empty state should say "No memory writes found. Trace-only sessions don't create memory rows — check Sessions." And ALL list screens need the packageId fix first, or every empty state is a lie.

---

## 6. Confirmed bug & problem list (tight)

1. **[CONFIRMED, high]** packageId event-query bug — `lib/trace.ts:33,199-202` + `lib/memory.ts:64` use upgraded id; everyone else uses `originalPackageId||packageId`. Empties `/`, `/apps`, `/sessions`, `/memories`, SSE after a package upgrade (which has already happened). Trace deep-link self-heals.
2. **[Dishonesty, medium]** Settings → Advanced hardcodes "Auto-capture on / Auto-trace on" (`SettingsView.tsx:226-227`) — static strings, not state; false for MCP-only / un-wired adapters.
3. **[Dishonesty, medium]** `/apps` flattens 9 integrations as "Enforced" connected "Apps" with pause/trace toggles (`lib/runtimes.ts:24-90`, `AppsView.tsx:12,89-92`); 5 are libraries with no local process to enforce.
4. **[Over-claim, medium]** Landing "every agent runtime / every runtime and framework" + "8+ runtimes" + Cursor listed without a package (`landing page.tsx:34-37,63-66`; `landing-content.ts:55-57,61-71`).
5. **[IA gap, low]** GOAL's headline `/trace/[id]` has no sidebar entry (`AppShell.tsx:15-21`); user can't reach the signature screen without clicking a session.
6. **[Honesty gap, low]** `/` "Verifiable" stat re-prints session count without verifying (`page.tsx:68-77`).

---

## 7. Codex claim verdicts (my own evidence)

- **Codex (taxonomy artifact, Finding #2): dashboard event reads use `addr.packageId`, CLI/SDK use `originalPackageId||packageId`, can show zero sessions while verify works** → **CONFIRMED.** Evidence: `lib/trace.ts:33,199-202`, `lib/memory.ts:64` vs `cli-ts/src/util/sui.ts:23`, `sdk-ts/src/traces.ts:119,161,287`, `sdk-ts/src/memory.ts:253`. Upgrade reality: `generated/addresses.ts:31-32`. On-chain proof of original-id events: `2026-06-18-hosted-sui-upgrade-type-parser.md:108-113`.
- **Codex (Finding #1/#4): `/apps` over-flattens; framework libraries look like local connected apps; rename Apps→Integrations, add capability tiers** → **CONFIRMED.** Evidence: `lib/runtimes.ts:24-90` (flat list, all `coverage:"enforced"`), `AppsView.tsx:89-92` ("your local OneMem setup").
- **Codex (Finding #3): empty Memories after a trace proof is not necessarily a bug — trace-only sessions create no `memwal_write`** → **CONFIRMED.** Evidence: `lib/memory.ts:1-6,13,71` (memory list derives solely from `memwal_write` ActionCalls).
- **Codex (Finding #6): hosted ≠ local replacement** → **CONFIRMED** as already-honest in docs (`purpose-local-vs-hosted.md:99-110,145-149`); the doc itself does not over-claim. The risk is only if marketing copy elsewhere blurs it.
- **Codex (taxonomy "Claims To Stop Making": no Cursor auto-capture; no 'every runtime/framework' unscoped)** → **CONFIRMED** as still-violated in shipped copy: `landing-content.ts:61-71` lists Cursor; `landing page.tsx:34-37` says "every agent runtime."

No Codex claim in my area was REFUTED. One nuance Codex UNDER-stated: it implies the dashboard is broadly broken by the packageId bug, but the **headline `/trace/[id]` view is self-correcting** (object-type-derived package id, `lib/trace.ts:94,102`; `sdk-ts/traces.ts:336`) — so the demo survives; only the list/overview surfaces go dark. That distinction matters for triage.

---

## 8. The single most important correction

**Fix the packageId event-query bug in `lib/trace.ts` and `lib/memory.ts` (use `originalPackageId || packageId`, mirroring `cli-ts/src/util/sui.ts:23`).** Everything else here is a copy/labeling honesty fix that a judge might dock you for — but THIS one makes the dashboard silently contradict the CLI and show a user an empty, broken-looking product when their data is provably on-chain. It's a ~3-line change with the highest trust payoff in the whole surface, and the rest of the codebase already proves the correct pattern.
