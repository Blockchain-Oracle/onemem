# Grounding Thread 03 — Claude Code Runtime (Execution Location A)

**Date:** 2026-06-19
**Thread:** claude-code-runtime
**Surface under audit:** OneMem's Claude Code plugin (`packages/plugin-claude-code`) — a true Location A surface (coding-agent runtime on the USER'S OWN MACHINE), plus how (and whether) its traces actually reach a LOCAL dashboard.
**Posture:** read-only on product code; every claim cited to file:line from source I read.

---

## 0. TL;DR truth, through the execution-location lens

The Claude Code plugin is the ONE integration in OneMem that genuinely belongs to Location A: it runs on the user's laptop, hooks into the user's own coding agent, and captures the user's own work. It is the legitimate heart of any "alive on localhost" local-dashboard story. **But today the plugin does not feed any local dashboard.** It buffers tool calls to a JSON/JSONL file under `~/.onemem/cc-sessions/`, holds them entirely inert until the `Stop` hook, and only then writes everything on-chain in one batch. The local dashboard reads NOTHING from that local buffer — it reads exclusively from Sui (`queryEvents`). So during a session there is nothing live to see; after `Stop` there is an on-chain trace that the dashboard surfaces only after chain propagation. The plugin is a real Location-A capture mechanism wired to a "proof truth" read model, with the "local worker / live feed" truth that makes claude-mem feel alive **entirely absent**. The "Apps" page additionally lists Vercel/LiveKit/ElevenLabs/CrewAI next to Claude Code with identical `coverage: "enforced"` framing — which is the cross-location conflation the owner correctly smells.

---

## 1. SessionStart → PostToolUse → Stop: exactly what happens, where, when

### Hook wiring (`hooks/hooks.json:1-40`)
- `SessionStart` → `node scripts/inject.js` (timeout 30s)
- `PostToolUse` → `node scripts/observe.js` (timeout 10s)
- `Stop` → `node scripts/summarize.js` (timeout 120s)

Each hook is a short-lived `node` process. There is no persistent daemon. State between processes is shared only through files on disk (`onemem-lib.mjs:3-6`).

### SessionStart → `inject.js`
- Reads hook stdin, loads env config, checks `traceCaptureEnabled("claude-code")` (`inject.js:17-22`).
- Opens a OneMem `TraceSession` **on chain immediately** via `onemem.traces.startSession(...)` (`inject.js:27-33`), tagging `environment: "claude-code"` and `agentId: "claude-code"`.
- Persists the Claude↔OneMem session mapping to `~/.onemem/cc-sessions/<claudeSessionId>.json` via `writeSessionState` (`inject.js:34-38`; `onemem-lib.mjs:85-88`).
- **Naming is misleading:** the file is `inject.js` and README/SKILL.md call the hook `inject`, but it does **NOT inject any prior memory/context** into the session. It only opens a trace session. The claude-mem blueprint's `SessionStart` is a context-injection hook (`HOOKS_AND_VIEWER_REFERENCE.md` §1 mapping: "Pull recent ActionCall events... inject"). OneMem's does the opposite job (open an empty session) under the same name. This is a real capability gap dressed in a misleading name.

### PostToolUse → `observe.js`
- Guards: only proceeds if a session-state file exists (i.e. SessionStart opened a session) and trace capture is enabled (`observe.js:19-21`).
- Appends ONE line to `~/.onemem/cc-sessions/<claudeSessionId>.buffer.jsonl` via `bufferToolCall` (`observe.js:23-27`; `onemem-lib.mjs:102-106`). Payload = `{toolName, toolInput, toolResponse}`.
- **No network. No chain. No dashboard POST. No heartbeat.** It is a pure local file append. This is correct for "hooks must be fast," but it means **nothing is observable anywhere during the session.**

### Stop → `summarize.js`
- Reads session-state + buffered calls (`summarize.js:27-29`).
- For each buffered call, in sequence: `traces.appendCall(...)` then `traces.closeCall(...)`, threading `parentCallId` so calls Merkle-chain into a linear parent→child chain (`summarize.js:42-61`). Inputs/outputs are `encrypt: true` (Seal → Walrus).
- Calls `traces.endSession(... status: Completed)` (`summarize.js:63-68`).
- Clears the buffer + state files (`summarize.js:72-73`).
- This is the ONLY moment any tool-call content leaves the machine. All on-chain writes for an entire session happen in one burst at the end.

### What is written where/when — summary table

| Phase | Local disk | On chain | Dashboard-visible? |
|---|---|---|---|
| SessionStart | `<id>.json` session map | `TraceSession` opened (`startSession`) | Session row appears after chain read (≤5s SSE poll) — but **empty, 0 calls** |
| PostToolUse (×N) | append to `<id>.buffer.jsonl` | nothing | **No** — buffer is never read by dashboard |
| Stop | buffer + state deleted | N× `ActionCall` emit+close, `endSession` | Calls appear only after Stop + chain propagation |

---

## 2. Is local state transient or durable? When is the plugin inert?

### Durability
- **Transient by design.** Session-state and buffer files live under `~/.onemem/cc-sessions/` (`onemem-lib.mjs:12`, `73-75`, `90-92`) and are **deleted at Stop** (`summarize.js:72-73`; `clearBufferedToolCalls`/`clearSessionState`, `onemem-lib.mjs:94-100`, `129-135`). There is no durable local observation store, no SQLite, no queryable local history. Once `Stop` runs, the only surviving record is on chain. If `Stop` never fires (crash, kill), the buffer is orphaned on disk and never flushed — there is no recovery/replay path and no resume worker.
- The on-chain trace IS durable, but it is "proof truth," not "local worker truth." There is no local cache mirroring it.

### When inert (no-op)
The plugin intentionally produces nothing in these cases:
- `ONEMEM_NAMESPACE_ID` or `ONEMEM_RW_CAP_ID` unset → `loadConfig` returns null → all hooks no-op (`onemem-lib.mjs:41-51`; README:21-24; SKILL.md:43-44).
- `traceCaptureEnabled("claude-code")` false — i.e. `~/.onemem/runtime-controls.json` marks the runtime `paused` or `traceCapture:false` (`onemem-lib.mjs:152-166`). Note: a **missing** controls file (ENOENT) defaults to ENABLED (`onemem-lib.mjs:161-163`).
- SDK/signer load failure → `loadClient` returns null → no-op (`onemem-lib.mjs:63-71`).
- Any thrown error → every hook `.catch(() => {})` and `process.exit(0)` (e.g. `inject.js:42-44`). Defensive silence is correct, but it also means failures are invisible to the user.

---

## 3. Does ANY of it feed a local dashboard before Stop? (Answer: No.)

This is the crux. I traced the dashboard read path end-to-end:

- The dashboard's session list comes from `fetchRecentSessions` (`packages/dashboard/lib/trace.ts:197-217`), which does `rpc.queryEvents({ MoveEventType: <pkg>::events::TraceSessionOpenedEvent })`. **Pure on-chain read.** No reference anywhere to `~/.onemem/cc-sessions/`, the buffer, or any local IPC.
- The live "stream" is `GET /api/stream` (`packages/dashboard/app/api/stream/route.ts:1-64`), which **polls the chain** every 5s (`fetchRecentSessions(10)`, line 28) and emits only when the newest session id changes. Its own header comment admits: "Polls the chain (the SDK has no push subscription that's browser-safe here)" (lines 1-4). It is NOT an SSE bridge to a local worker like claude-mem's `/stream`.
- The heartbeat endpoint (`packages/dashboard/app/api/runtimes/heartbeat/route.ts:17-26, 49-62`) keeps a **process-local in-memory** `beats` map and merges it with on-chain recency. **Nothing in the Claude Code plugin ever POSTs a heartbeat** — I checked all three hook scripts + `onemem-lib.mjs`; there is no fetch/heartbeat call. So the "live process heartbeat" branch is dead code for this runtime; runtime status is derived purely from on-chain `openedAtMs`.

**Conclusion:** Before `Stop`, the only thing the dashboard can show for a live Claude Code session is the empty session row created at SessionStart (0 calls), surfaced via a 5s chain poll. The tool calls the user is making **right now** are sitting in a local JSONL file the dashboard cannot see. There is no live feed of observations.

---

## 4. Compared to the claude-mem blueprint: what's missing for "alive"

The repo's own reference doc (`docs/02-inspirations/claude-mem/HOOKS_AND_VIEWER_REFERENCE.md`) documents exactly what "alive" requires, and OneMem has essentially none of it:

| claude-mem (the "alive" blueprint) | OneMem Claude Code today | Gap |
|---|---|---|
| Persistent localhost worker daemon `127.0.0.1:37777` (§4) | None. Hooks are one-shot processes. | **No worker** |
| Durable local store (SQLite) written on every PostToolUse | Transient JSONL buffer, deleted at Stop | **No durable local store** |
| `/stream` SSE pushing `new_observation`/`new_prompt`/`new_summary` as they happen (§4.2, §5) | `/api/stream` polls Sui every 5s; no per-observation push | **No live observation feed** |
| `SessionStart` injects recalled context (§1 mapping) | `inject.js` opens an empty session, injects nothing | **No context injection** |
| `PostToolUse` writes observation to store immediately, viewer updates in <1s | `observe.js` appends to a file no UI reads | **Observations invisible until Stop+chain** |
| 62 worker REST endpoints feeding a live viewer (§4.7 total) | Dashboard reads chain RPC only | **Local-worker truth layer absent** |
| `systemMessage: "View Observations Live @ http://localhost:37777"` (§3) | No live local URL for in-session activity | **No "alive on localhost" moment** |

The integration-taxonomy-reset artifact reached the same conclusion independently: "ClaudeMem parity requires a local worker, not just a Next dashboard… OneMem currently has hook scripts that buffer transient JSON/JSONL and flush proof at Stop, while the local dashboard reads Sui events and has no durable local observation feed" (`2026-06-19-integration-taxonomy-reset.md:60-67`). **CONFIRMED from source.**

---

## 5. The honest capability line for Claude Code in the LOCAL dashboard today

> **"After a Claude Code session ends, OneMem writes one verifiable on-chain trace of that session's tool calls; the local dashboard shows that trace once it lands on Sui. It does NOT show a live feed of what your agent is doing during the session, and it does not recall prior memory into new sessions."**

What is TRUE: post-hoc, per-session, on-chain, Merkle-verifiable trace; Seal-encrypted I/O on Walrus; defensive/never-blocks-the-editor capture. This is real and demoable (README cites a live testnet session `0x9c88…25e7` verifying `ok:true, callCount:1`, README:42-48).

What a user would WRONGLY infer from the "Apps" page calling this `coverage: "enforced"` and "Tracing" with an `sdot-online` dot: that there is continuous, live, in-session capture they can watch — claude-mem-style. There isn't. The capability is "batch-at-Stop on-chain proof," not "live local memory."

---

## 6. The framework-adapter conflation (the owner's central concern), from source

The owner's instinct is correct and provable. `packages/dashboard/lib/runtimes.ts:24-90` hard-codes a single flat `KNOWN_RUNTIMES` list that mixes all three execution locations and stamps nearly all with `coverage: "enforced"`:
- Location A (legit local): `claude-code`, `codex` — `enforced`.
- Location B (framework SDKs in DEPLOYED apps): `crewai`, `livekit`, `elevenlabs`, `vercel-ai`, `openai-agents` — **all `coverage: "enforced"`** (`runtimes.ts:55-89`).
- Runtime-host: `openclaw`, `hermes` — `enforced`.

The `/apps` UI then renders every one of these as a card with a Pause toggle, a "Trace capture" toggle, a live status dot, an "Enforced" coverage badge, and an install command (`packages/dashboard/app/apps/AppsView.tsx:108-189`), under the sub-header "Runtime trace policy and verifiable activity from your **local** OneMem setup" (`AppsView.tsx:90-91`). So ElevenLabs and Vercel AI — which run in the developer's **deployed/serverless app**, never on the laptop — are presented as locally-controlled, locally-paused, "enforced" local runtimes. That is the nonsense the owner identified, and the prior Codex audit flagged the *flattening* but the UI still ships it.

### How adapter reads actually work (Owner Question 3, answered from source)
There is no "connected local app" read model. Every session — Claude Code or ElevenLabs alike — is read identically by `fetchRecentSessions` from Sui `TraceSessionOpenedEvent`, then **bucketed purely by the `environment` field** of the event (`runtimes.ts:166-173`; `sessions.ts:155-157`, `229-235`). A framework adapter "shows up" only because, wherever it ran (a server, a Lambda, a phone), it emitted a `TraceSession` with `environment: "vercel-ai"` (etc.) to a Sui namespace. The read is **by namespace/environment, not by connected local process.** The Pause/Trace-capture toggles on those cards write to the local `~/.onemem/runtime-controls.json` (`runtimes.ts:199-207`) — which only the local Claude Code/Codex hooks ever consult (`onemem-lib.mjs:152-166`). **Toggling "Pause" on the ElevenLabs card does nothing to a deployed ElevenLabs app** — that process never reads the local controls file. The control is inert for every Location-B row. This is concrete proof the cards are mislabeled chrome, not just mis-grouped.

---

## 7. Answers to the owner's open questions

**Q1 — What is the LOCAL dashboard FOR vs the HOSTED dashboard FOR? Why both?**
- LOCAL (one sentence a founder can repeat): *"The local dashboard is where I inspect MY OWN agents' memory and traces from MY machine, with no login — it is the daily driver for Location-A runtimes (Claude Code, Codex)."*
- HOSTED (one sentence): *"The hosted hub is for everything that can't live on one laptop — onboarding/provisioning, CLI login callback, cross-device viewing, capability sharing, and public verification — including watching traces my DEPLOYED apps (Location B) emit from anywhere."*
- Why both: Location A is personal + offline + no-login (local). Verifiability-to-third-parties, cross-device, sharing, and Location-B app traces are inherently multi-machine (hosted). The repo's `purpose-local-vs-hosted.md` already states this split well (`:11-19`, `:87-91`); the bug is that the *product* (the `/apps` card list) ignores it.

**Q2 — Do framework adapters belong in the LOCAL dashboard?**
- **No.** Vercel/LiveKit/ElevenLabs/CrewAI/OpenAI-Agents have no Location-A presence on the user's laptop. Their Pause/Trace toggles are provably inert there (§6). They must be REMOVED from the local `/apps` runtime-control grid.
- Where they go: a **hosted** "Framework adapters / Available integrations" surface that is read-only-by-environment — "set up your namespace + delegate key in your app; here are the traces that environment has emitted (`chain-observed`) — query them by namespace/environment." No local pause toggle, no "enforced," no online dot.
- For hackathon scope: keep the ones with shipped, demonstrable trace emission as **hosted, queryable namespaces**; mark the rest `planned`. None of them earns a local runtime-control card. (The taxonomy artifact's "Available adapters" section, `:108-111`, is the right destination.)

**Q3 — How do you query an adapter's traces?** Answered in §6: by `environment`/namespace on Sui, identical read path to every other session. Confirmed from `lib/trace.ts:197-217` + `lib/runtimes.ts:166-173`.

---

## 8. Codex verdicts (vs my own source reading)

I could not read `/Users/abu/Documents/Codex/2026-06-19/onemem-cloud-framework-adapters-audit/outputs/onemem-cloud-framework-adapters-audit.md` (EPERM — sandbox-blocked, both Read and `cat`). I therefore verdict the *consolidated* Codex claims captured in `2026-06-19-integration-taxonomy-reset.md`, which folds in that audit thread.

- **"ClaudeMem parity requires a local worker, not just a Next dashboard; OneMem buffers transient JSON/JSONL and flushes proof at Stop, dashboard reads Sui events, no durable local observation feed"** (`:60-67`) — **CONFIRMED.** Exact match to `observe.js` + `onemem-lib.mjs:102-135` + `lib/trace.ts` + `app/api/stream/route.ts`.
- **"`runtimes.ts` hard-codes native hosts and framework libraries into one `KNOWN_RUNTIMES` list with broad `coverage:"enforced"` labels; makes Vercel/LiveKit/ElevenLabs/CrewAI/OpenAI look like local connected apps"** (`:33-38`) — **CONFIRMED.** `runtimes.ts:24-90`, `AppsView.tsx:90-91`.
- **"Reads should be by environment/namespace, activity only after `environment=<x>` traces exist"** (`:49-53`) — **CONFIRMED.** `lib/trace.ts:197-217`, `runtimes.ts:166-173`.
- **"Local dashboard event read path has a correctness bug: dashboard uses `addr.packageId` while CLI/SDK use `originalPackageId||packageId`; after upgrades dashboard can show zero sessions"** (`:77-84`) — **PARTIALLY CONFIRMED / NUANCED.** `fetchRecentSessions` does use `addr.packageId` for the event query (`lib/trace.ts:198-203`, via `client()` `:29-35`). `fetchSession` is more careful — it derives the *session's own* package id from the object type (`traceSessionPackageId`, `:111-116`) and uses it for call reads. So per-session trace reads survive an upgrade, but the recent-sessions LIST and runtime inventory (both depend on `fetchRecentSessions`) would miss pre-upgrade sessions. Codex's directional claim holds for the list path; it slightly overreaches if read as "all reads broken."
- **"Codex audit MISSED that framework adapters don't belong in local at all" (thread brief)** — **CONFIRMED against the shipped product.** The taxonomy artifact recommends *moving* adapters into an "Available adapters" section (`:108-111`, `:159-160`) but stops short of saying the local Pause/Trace-capture control for them is *functionally inert* (no deployed adapter ever reads the controls file). My §6 proves it's not merely mislabeled — it's a no-op control. That stronger conclusion is the one the prior audit under-stated.

---

## 9. The single most important correction (product/UI, not docs)

**Remove every framework-adapter row (`vercel-ai`, `openai-agents`, `crewai`, `livekit`, `elevenlabs`) from the LOCAL dashboard's `/apps` runtime-control grid, and gate the grid to Location-A/runtime-host runtimes only (`claude-code`, `codex`, `openclaw`, `hermes`).** Concretely: split `KNOWN_RUNTIMES` in `packages/dashboard/lib/runtimes.ts:24-90` so the local `/apps` page only renders runtimes whose Pause/Trace-capture toggles actually drive `~/.onemem/runtime-controls.json` for a process running on this machine. Framework adapters move to a hosted, read-only "Adapters (by namespace/environment)" view with no pause toggle, no `enforced` badge, and a `chain-observed`/`planned` status derived from whether that `environment` has emitted any `TraceSession`.

**Second, paired correction (so the remaining Location-A card is honest):** retire the `coverage: "enforced"` + always-"Tracing" framing for Claude Code and replace it with a capability label that tells the truth about *when* capture happens — e.g. `native-hooks · batch-at-Stop · on-chain` — and stop showing an `sdot-online` "active now" dot for a runtime that has no live in-session feed. If OneMem wants the true claude-mem "alive" feeling for Claude Code, that requires building the missing local worker + durable store + per-observation SSE (taxonomy artifact step 8, `:164-171`) — a real product build, not a relabel.
