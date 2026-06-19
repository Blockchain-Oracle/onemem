# Grounding Thread 02 — claude-mem "Alive Local" Blueprint

**Thread:** claude-mem-blueprint
**Date:** 2026-06-19
**Lens:** EXECUTION LOCATION determines PRODUCT SURFACE. claude-mem is the purest example of Location (A) — a runtime on the user's OWN machine — and its "alive on localhost" feel is 100% a property of that location. This report reverse-engineers that feel, then produces a parity blueprint for OneMem's LOCAL dashboard scoped to Location (A) ONLY, explicitly walled off from the on-chain proof layer and from anything hosted.

**Read-only on product code. Only file written is this report.**

**Verdict in one line:** OneMem borrowed claude-mem's *vocabulary* (hooks, SSE, "fills up live") but NOT its *mechanism* — there is no local worker, no local store, no per-tool-call liveness; the dashboard polls the chain every 5 s and a session appears only AFTER the Claude session ENDS. The thing that makes claude-mem feel alive is exactly the thing OneMem does not have.

---

## 0. One-paragraph truth of this surface

claude-mem feels alive because EVERY piece of its loop lives on one machine and writes locally and IMMEDIATELY: a Claude Code hook shells out, a localhost worker daemon (port 37777) writes the observation to a local SQLite row *synchronously inside the request*, and that same worker pushes the row to the browser over an SSE channel it is itself serving. There is no network round-trip on the hot path, no remote dependency, no "submitted/pending" state — the observation is durable and visible the instant the tool call finishes. OneMem today has the OPPOSITE architecture: its Claude Code hooks buffer tool calls to a JSONL file and do NOTHING visible until the `Stop` hook flushes them on-chain in one batch (`packages/plugin-claude-code/scripts/observe.js:23`, `scripts/summarize.js:42-68`), and the dashboard's only "live" feed is a 5-second poll of Sui events (`packages/dashboard/app/api/stream/route.ts:12,28`). OneMem has a PROOF layer but no LOCAL-WORKER truth — so it cannot feel alive, and worse, it conflates "I observed this locally" with "this is anchored on chain." The parity fix is to add a local-worker truth that is SEPARATE from the proof truth, and to keep that local worker strictly Location-(A)-only.

---

## 1. Reverse-engineering the "alive local" lifecycle (claude-mem)

Sourced from `docs/02-inspirations/claude-mem/README.md` and `HOOKS_AND_VIEWER_REFERENCE.md` (both citing the un-minified mirror at `~/.claude/plugins/marketplaces/thedotmack/src/`).

### 1.1 The six hooks and their hot/cold split

| Hook | Matcher | Worker subcommand | Hot or cold | What is written, and WHEN |
|---|---|---|---|---|
| `Setup` | `*` | `version-check.js` | — | Validates version/deps. No data write. (`HOOKS_AND_VIEWER_REFERENCE.md:24`) |
| `SessionStart` | `startup\|clear\|compact` | `worker-service.cjs start` THEN `hook claude-code context` | cold (boot) + read | Boots the daemon (idempotent), then injects prior context preamble. (`README.md:130`) |
| `UserPromptSubmit` | (none) | `hook claude-code session-init` | warm | `POST /api/sessions/init` allocates a `sessionDbId` row immediately. (`HOOKS_AND_VIEWER_REFERENCE.md:183`) |
| `PreToolUse` | `Read` | `hook claude-code file-context` | read | `GET /api/observations/by-file` injects file-specific recall. (`README.md:134`) |
| `PostToolUse` | `*` | `hook claude-code observation` | **HOT** | `POST /api/sessions/observations` — appends the observation to the local queue. **This is the alive moment.** (`HOOKS_AND_VIEWER_REFERENCE.md:185`) |
| `Stop` | (none) | `hook claude-code summarize` | cold | `POST /api/sessions/summarize` triggers async compression. (`HOOKS_AND_VIEWER_REFERENCE.md:186`) |

The load-bearing insight: **the per-tool-call write (`PostToolUse`) is the alive event, and it happens DURING the session, not at the end.** The worker writes the row to SQLite synchronously and broadcasts it over SSE before the hook returns. Compression/embedding (the expensive, AI-routed work) is deferred to `Stop` and runs async in the worker — off the hot path (`README.md:32-33`).

### 1.2 How the worker starts (lazy, hook-spawned, idempotent)

`SessionStart` runs `worker-service.cjs start` (`HOOKS_AND_VIEWER_REFERENCE.md:474-478`):
- `WorkerProcess.start(port)` writes `~/.claude-mem/worker.pid` = `{pid, port, startedAt, version}`.
- Spawns the daemon detached, stdout → `~/.claude-mem/logs/worker-YYYY-MM-DD.log`.
- Polls `GET /api/readiness` for up to 10 s (15 s on Windows) then confirms `GET /api/health`.
- Idempotent: if a live PID already owns the port, start is a no-op. Stale PID detected via `process.kill(pid, 0)` liveness check and cleaned up.

### 1.3 What is written LOCALLY + IMMEDIATELY vs LATER

- **Immediately (hot path, local SQLite):** the session row (`session-init`), every observation row (`PostToolUse` → `observation_queue` / `observations`), every user prompt. Durable on disk the instant the hook returns. (`README.md:192-202`)
- **Later (async, in-worker):** AI compression into `summaries`, vector embedding into Chroma, AST extraction. Triggered at `Stop`; the user never waits. (`README.md:32`, `README.md:298-300`)

There is no "pending/submitted" limbo: a local row is TRUE the moment it is written. The async work only ENRICHES it.

### 1.4 The viewer / SSE model

- The SAME worker that ingests hooks also serves the viewer (`express.static(plugin/ui/)`) and the SSE endpoint — single source of truth for BOTH the write path (hooks) and the read path (dashboard) (`README.md:188-190`).
- Transport: vanilla HTTP + **one SSE endpoint** `GET /stream`. No WebSocket, no long-poll (`HOOKS_AND_VIEWER_REFERENCE.md:157`).
- `SSEBroadcaster` keeps a `Set<Response>` and fans out `data: {...}\n\n`. Event types: `connected | initial_load | new_observation | new_summary | new_prompt | processing_status` (`HOOKS_AND_VIEWER_REFERENCE.md:264-278`).
- Client `useSSE.ts` connects on mount, auto-reconnects after `SSE_RECONNECT_DELAY_MS`, type-discriminated `switch (data.type)` dispatch prepends to local React arrays (`HOOKS_AND_VIEWER_REFERENCE.md:280-339`). Historical data is REST + `IntersectionObserver` infinite scroll (pull); live data is SSE (push).

### 1.5 The local DB schema (the local truth)

`src/services/sqlite/migrations.ts` (`HOOKS_AND_VIEWER_REFERENCE.md:407-465`): `sessions`, `memories`, `observations` (FK → `sdk_sessions`), `sdk_sessions`, `streaming_sessions`, `observation_queue` (per-session backlog of un-processed tool calls), plus `overviews`, `diagnostics`, `transcript_events`, `schema_versions`, `PendingMessageStore`. `better-sqlite3` used **synchronously** inside handler scope — that synchronicity is WHY the write is durable before the hook returns.

### 1.6 The "worker-down exits 0" defensive pattern

The single most important reliability pattern for Location (A) (`HOOKS_AND_VIEWER_REFERENCE.md:134-145`): if any hook's HTTP call to the worker fails (`ECONNREFUSED|ECONNRESET|EPIPE|ETIMEDOUT|ENOTFOUND|...`, any 5xx, 429, any timeout), `isWorkerUnavailableError` returns true and the hook `process.exit(0)` — **never blocks the user's prompt.** A dead daemon degrades silently and is respawned on the next `SessionStart`. Hooks are thin shell-outs; all heavy work is behind the worker so the hook stays <100ms.

---

## 2. What OneMem has TODAY (grounded, file:line)

### 2.1 The Claude Code plugin: buffer-then-flush, NO local worker

- `packages/plugin-claude-code/hooks/hooks.json:1-40` registers only THREE hooks: `SessionStart` → `inject.js`, `PostToolUse` → `observe.js`, `Stop` → `summarize.js`. No `Setup`, no `UserPromptSubmit`, no `PreToolUse`.
- `scripts/observe.js:23-27` — `PostToolUse` calls `bufferToolCall(...)` which `appendFileSync` to a local `*.buffer.jsonl` (`onemem-lib.mjs:103-106`). **No network, no worker, nothing visible.** Header comment is explicit: "Buffers each tool call to a local file INSTANTLY ... the buffer is flushed on-chain in one batch at Stop" (`observe.js:3-5`).
- `scripts/summarize.js:42-68` — `Stop` drains the buffer and, per call, `appendCall` + `closeCall` (Seal-encrypt, Walrus-store, Merkle-chain on Sui), then `endSession`. THIS is the only point anything becomes visible — and it's on-chain, batched, at session end.
- Defensive `exit(0)` pattern IS present and correct (`observe.js:30-32`, `summarize.js:76-78`, `onemem-lib.mjs:7`). That part already matches claude-mem.

**Verdict:** OneMem has the proof layer but is missing the entire local-worker truth. No `observation_queue`-equivalent queryable mid-session, no localhost daemon, no per-tool-call durable local row, no SSE of local observations. The `*.buffer.jsonl` is a transient flat file, not a queryable store, and it is DELETED at `Stop` (`summarize.js:72`).

### 2.2 The dashboard "live" feed is chain-polling, not local-worker SSE

- `packages/dashboard/app/api/stream/route.ts:1-4,12,28-32` — the dashboard's SSE endpoint polls `fetchRecentSessions(10)` every `POLL_MS = 5_000` and emits a `sessions` event only when the newest session id CHANGES. Its own header comment: "Polls the chain (the SDK has no push subscription that's browser-safe here)."
- A session cannot appear until it has been flushed on-chain at `Stop` AND the 5s poll catches it. Multi-second-to-minutes gap between "I did a thing" and "I can see it." The antithesis of alive.

### 2.3 The dashboard read model is on-chain, keyed by `environment` (CRITICAL for Q3)

- `packages/dashboard/lib/trace.ts:5-10,29-35` — reads are pure Sui JSON-RPC over `ActionCallEmittedEvent` / `TraceSessionOpenedEvent`. No signer, no Walrus, no Seal. No local store involved.
- `packages/dashboard/lib/runtimes.ts:166-173` — `fetchRuntimeInventory` buckets sessions by `(session.environment || session.agentId || "unknown")`. **The "runtime" a session belongs to is literally the free-text `environment` string baked into the on-chain TraceSession event** — NOT a connection to any local app.
- `packages/sdk-ts/src/runtime.ts:333` — `environment = opts.environment ?? agentId`. The caller (any SDK consumer, anywhere it runs) chooses this string. `packages/sdk-ts/src/traces.ts:127` writes it as `tx.pure.string(args.environment)` into the on-chain event.

**Decisive grounding for owner question 3:** reads are by `environment`/namespace tag, fully reconstructed from chain. A framework adapter running on a server in production emits the exact same on-chain shape with `environment="vercel-ai"`; the dashboard buckets it identically to a local Claude Code session. The dashboard has NO concept of "connected local app" — it never did. The `/apps` "last-seen heartbeat / active now" status (`runtimes.ts:114-121`) is a FICTION derived from the newest on-chain session timestamp for that `environment` string, not from any live local connection.

### 2.4 The `/apps` page flattens all execution locations into one list with `coverage: "enforced"`

- `packages/dashboard/lib/runtimes.ts:24-90` — `KNOWN_RUNTIMES` hard-codes 9 entries in ONE flat list: `claude-code`, `codex`, `openclaw`, `hermes`, **`crewai`, `livekit`, `elevenlabs`, `vercel-ai`, `openai-agents`** — every one tagged `coverage: "enforced"`.
- The page renders per-runtime **pause / trace-capture toggles** and live-status dots (`runtimes.ts:94-106,199-207`; `app/apps/page.tsx`). This presents ElevenLabs, LiveKit, Vercel AI, CrewAI, OpenAI Agents as local connected apps with local policy controls and a heartbeat — exactly the dishonesty the owner identified. None run on the user's laptop; they are libraries embedded in a DEPLOYED app (Location B).

---

## 3. Answers to the owner's open questions

### Q1 — What is the LOCAL dashboard FOR? The HOSTED dashboard FOR? Why both?

**LOCAL (one sentence a founder can repeat):** "The local dashboard is the claude-mem-style daily driver that shows me, live and offline, what the agents running ON MY OWN MACHINE (Claude Code, Codex, local OpenClaw) just remembered and did — read from a local worker FIRST, with on-chain proof status layered on top."

**HOSTED (one sentence):** "The hosted dashboard is the no-install, login-gated entry point and shareable surface — onboarding/wallet provisioning, CLI pairing, cross-device viewing, capability sharing, and the public `/verify/[session_id]` page that lets ANYONE on earth verify a trace's Merkle chain without trusting me."

**Why both exist:** two of OneMem's three wedge properties cannot live on a single machine. *Verifiable* has value only if a non-owner can verify → needs a public hosted page. *Shareable* is a capability transfer to someone who may not have the CLI → needs hosted. *Cross-runtime/cross-device* unification of agents you run on a laptop AND a phone AND a work box → needs hosted. The LOCAL dashboard exists for the opposite reason: daily, personal, offline, no-login inspection of YOUR OWN machine's agents — the thing that must feel alive. This split is already correctly articulated in `docs/05-our-architecture/06-dashboard/purpose-local-vs-hosted.md`; the problem is the PRODUCT doesn't honor it (the local surface shows Location-B adapters; the "live" feed is chain-polling).

### Q2 — Do framework adapters belong in the LOCAL dashboard?

**No. Categorically not. Remove all five from local.** `crewai`, `livekit`, `elevenlabs`, `vercel-ai`, `openai-agents` are Location-(B) libraries embedded in a DEPLOYED app; they run on a server/serverless/production box, never on the user's laptop. Putting them in `KNOWN_RUNTIMES` with local pause/trace toggles and an "active now" heartbeat (`runtimes.ts:62-89`) is the root dishonesty.

Where they belong:
- **NOT in the local dashboard's `/apps` runtime list at all.** The local `/apps` list must contain ONLY Location-(A) runtimes (Claude Code, Codex, local OpenClaw) — the ones a local worker can actually see.
- **In the HOSTED dashboard** as a read-only "Environments / Available adapters" view: the developer sets an API-key/namespace for their deployed app, and the hosted dashboard shows traces for that `environment` tag, queried from chain — "watch your deployed app's traces from anywhere." NO pause toggle, NO heartbeat, NO "enforced" claim. A row appears only after that `environment` has emitted at least one on-chain session (`chain-observed`), else it's a docs-linked `framework-adapter (available)` catalog row.
- **For hackathon scope:** KEEP `vercel-ai` and `openai-agents` as the two demonstrable JS adapters (they prove cross-framework on-chain trace), but only as hosted/queryable environments, never in local chrome. CrewAI/LiveKit/ElevenLabs are explicit tracer wrappers per the taxonomy-reset audit (§5) and the Python provider packages are thinner — surface them as `available` catalog rows or CUT them from the demo dashboard entirely. They do not need to appear in ANY dashboard chrome to be real; they are simply "namespaces that emit traces you can query."

### Q3 — HOW do you query an adapter's traces? Is the read model by namespace/environment?

**Confirmed from source: YES — the read model is by `environment`/namespace, reconstructed entirely from chain. There is no "connected local app" model anywhere.** An adapter emits `ActionCall` + `TraceSession` Sui objects from wherever it runs, tagged with a free-text `environment` string the caller sets (`sdk-ts/src/runtime.ts:333`, `traces.ts:127`). The dashboard reads those events via `fetchRecentSessions` (`dashboard/lib/trace.ts`) and buckets by `session.environment` (`runtimes.ts:166-173`). So:
- You query an adapter's traces by FILTERING on-chain sessions where `environment == "vercel-ai"` (or the namespace the app writes to).
- There is no local connection, no heartbeat, no "is it online" — the only honest status is "this environment has N on-chain sessions, newest at time T."
- Correct mental model: **the local dashboard reads the LOCAL WORKER for Location-(A) liveness; the hosted dashboard reads the CHAIN by namespace/environment for everything (including Location-B adapters).** Two different read models — must not be conflated. (Codex taxonomy-reset finding #1 says the same: "two truths — local worker/cache truth ... and proof truth.")

---

## 4. PARITY BLUEPRINT — OneMem LOCAL dashboard (Location A ONLY)

Build a local worker that gives OneMem the claude-mem "alive" feel, STRICTLY for Location-(A) runtimes, with the proof layer as a SEPARATE async track and a clearly distinct visual state. Nothing hosted, no framework adapters, no chain on the hot path.

### 4.1 Hook → worker flow (replaces buffer-then-flush)

```
SessionStart  → onemem-worker start (idempotent; PID at ~/.onemem/worker.pid)
              → POST /api/sessions/init           (allocate local sessionDbId NOW)
              → GET  /api/context/inject          (recall preamble; existing inject.js logic)
PostToolUse   → POST /api/observations            (HOT: write local row + SSE broadcast NOW)
                                                    (worker ALSO enqueues a proof job — async)
Stop          → POST /api/sessions/summarize      (close local session; flush proof batch async)
```

Keep `observe.js`'s instant-local-write spirit, but write to the WORKER (local SQLite) instead of a throwaway JSONL, and broadcast immediately. The on-chain flush moves INTO the worker's async proof queue — it stops being the only moment data exists. Every hook keeps the `exit(0)`-on-worker-down pattern verbatim (already present, `observe.js:30-32`).

### 4.2 Local worker endpoints (localhost-only, no auth, CORS 127.0.0.1)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | `{status, version, pid, uptime, memwal:{signedIn,accountId,sealReady}}` — extend claude-mem's health shape with credential state (per `README.md:327-330`) |
| GET | `/api/readiness` | 200 once init complete, else 503 |
| POST | `/api/sessions/init` | allocate local session row; return `{sessionDbId}` |
| POST | `/api/observations` | append local observation row + enqueue proof job + SSE broadcast |
| POST | `/api/sessions/summarize` | close local session; trigger proof flush |
| GET | `/api/observations` | paginated local observations (cursor) for historical pull |
| GET | `/api/sessions` | local sessions list with per-row proof status |
| GET | `/api/stats` | local counts + proof-queue depth |
| GET | `/stream` | **SSE** — the alive feed (see 4.4) |
| GET | `/` | serve the local dashboard bundle |

Reads come from the LOCAL store first; the existing `dashboard/lib/trace.ts` chain reads become the PROOF-status enrichment, not the primary source. (Implements taxonomy-reset finding #1 and implementation step 8.)

### 4.3 Local DB schema (clean-room, OneMem-shaped)

```sql
-- Location-A only. Runtime constrained to {claude-code, codex, openclaw-local}.
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  local_session_id TEXT UNIQUE NOT NULL,   -- Claude/Codex session_id
  onemem_session_id TEXT,                   -- Sui TraceSession id, NULL until anchored
  runtime TEXT NOT NULL,                    -- claude-code | codex | openclaw-local
  project TEXT NOT NULL,
  namespace_id TEXT,
  status TEXT NOT NULL,                     -- open | closed
  proof_status TEXT NOT NULL DEFAULT 'local', -- local|queued|submitted|anchored|verified|failed
  created_at_epoch INTEGER NOT NULL
);
CREATE TABLE observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  local_session_id TEXT NOT NULL,
  seq INTEGER NOT NULL,
  tool_name TEXT NOT NULL,
  tool_input TEXT,                          -- plaintext local; encrypted only on proof flush
  tool_response TEXT,
  proof_status TEXT NOT NULL DEFAULT 'local',
  action_call_id TEXT,                      -- Sui ActionCall id, NULL until anchored
  walrus_input_blob TEXT,                   -- NULL until anchored
  created_at_epoch INTEGER NOT NULL,
  FOREIGN KEY(local_session_id) REFERENCES sessions(local_session_id) ON DELETE CASCADE
);
CREATE TABLE proof_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  local_session_id TEXT NOT NULL,
  observation_id INTEGER,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  enqueued_at_epoch INTEGER NOT NULL
);
```

Non-negotiable design rule (per Codex taxonomy-reset finding #1, and the owner's honesty concern): **`proof_status` is a first-class column on every local row.** A local row is TRUE-as-observed-locally the instant it's written, but the UI must label it `local` / `queued` / `submitted` / `anchored` / `verified` / `failed` and must NOT render an unanchored local row as if it were on-chain proof. This is the honest version of claude-mem's "the row is true the moment it's written": OneMem's row is true as a LOCAL OBSERVATION immediately, and becomes PROOF asynchronously.

### 4.4 SSE events (`/stream`)

```ts
type OneMemStreamEvent =
  | { type: 'connected'; t: number }
  | { type: 'initial_load'; runtimes: string[] }                // Location-A only
  | { type: 'new_observation'; observation: LocalObservation }  // HOT, on PostToolUse
  | { type: 'session_closed'; localSessionId: string }
  | { type: 'proof_status'; localSessionId: string; observationId?: number;
      status: 'queued'|'submitted'|'anchored'|'verified'|'failed' }  // async enrichment
  | { type: 'processing_status'; proofQueueDepth: number };
```

Two distinct event families make the separation visible in the UI: `new_observation` (alive, instant, local) and `proof_status` (the row "upgrading" to anchored/verified as the async chain work lands). The browser prepends `new_observation` rows immediately (claude-mem `useSSE` pattern), then PATCHES each row's badge as `proof_status` events arrive. This is OneMem's differentiator made legible: you watch a row go `local → anchored → verified` in real time. Reuse claude-mem's auto-reconnect + type-discriminated dispatch verbatim (clean-room; it's API surface).

### 4.5 What the LOCAL `/apps` (rename "Integrations") must show

ONLY Location-(A) runtimes: Claude Code, Codex, local OpenClaw. Status comes from the LOCAL WORKER (real heartbeat: is there an open local session / did an observation arrive in the last N min), not a chain timestamp. Pause/trace-capture toggles are legitimate here because the local worker can actually enforce them. Remove all five framework adapters from this list entirely.

### 4.6 Worker boot/recovery — adopt verbatim

Items 1, 2, 4, 5, 6, 7 from `HOOKS_AND_VIEWER_REFERENCE.md:472-497` transfer directly: lazy hook-spawned start, PID file with liveness check, `exit(0)` on worker-down, respawn on next `SessionStart`, Windows wrapper/inner split. Health endpoint additionally surfaces MemWal credential state.

---

## 5. Codex verdicts (CONFIRMED / REFUTED / OVERREACHED, with my own evidence)

The dedicated cloud-framework-adapters audit file at the path given in my brief (`/Users/abu/Documents/Codex/2026-06-19/onemem-cloud-framework-adapters-audit/outputs/...`) **DOES NOT EXIST on disk** — `/Users/abu/Documents/Codex/2026-06-19/` is empty/absent. The only artifact present is the consolidated `2026-06-19-integration-taxonomy-reset.md`, which references the missing file. I verdict that doc.

- **Finding #1 ("ClaudeMem parity requires a local worker, not just a Next dashboard"): CONFIRMED.** Exactly right and central. `observe.js:23` buffers to JSONL, `summarize.js:42-68` flushes on-chain at Stop, `app/api/stream/route.ts:12,28` polls chain every 5s. No durable local observation feed. Two truths (local-worker + proof) is the correct framing.
- **Finding #2 ("local dashboard event read path bug — uses `addr.packageId` not `originalPackageId||packageId`"): CONFIRMED on the dashboard side.** `trace.ts:34` uses `packageId: addr.packageId`. I did not diff the CLI's event read to fully confirm divergence, so I mark it CONFIRMED-on-the-dashboard-side, unverified-on-the-CLI-side. Worth a one-line fix regardless.
- **Finding #3 ("memory rows ≠ trace rows; empty Memories after trace proof is not a bug"): CONFIRMED.** Consistent with the architecture — memory writes are a separate `memwal_write` ActionCall path; the Claude Code Stop flush records trace calls (`summarize.js:42-61`) without necessarily emitting memory writes.
- **Finding #4 ("use 'Integrations' not 'Apps'; split into Native/MCP/Framework/Protocol/Hosted"): CONFIRMED for naming, UNDERREACHED for the local surface.** The rename is right but insufficient. For the LOCAL dashboard the framework section should not merely be relabeled — it should be REMOVED entirely (those runtimes are Location B and cannot appear in a local-worker-backed surface). Codex keeps them as a section; I say cut them from local chrome.
- **Finding #5 ("framework adapter docs are ahead of implementations"): CONFIRMED.** `runtimes.ts:24-90` tags all five adapters `coverage: "enforced"` — an overclaim. The packages are tracer wrappers, not native providers.
- **Finding #6 ("hosted = Hosted Hub, not full local dashboard"): CONFIRMED.** Matches `purpose-local-vs-hosted.md`.
- **The PRIOR Codex audit's MISS (per my brief): CONFIRMED.** No Codex artifact states that framework adapters do not belong in the LOCAL dashboard AT ALL. The taxonomy-reset doc keeps them as a dashboard "Framework adapters" section (step 4: "Move framework libraries into an 'Available adapters' section") — it relocates them within the dashboard rather than recognizing they have no place in a LOCAL (Location-A) surface. That is the gap this thread closes.

No Codex claim I reviewed is REFUTED; the notable OVERREACH-adjacent item is keeping framework adapters in the (local) dashboard IA at all.

---

## 6. The single most important correction (concrete product/UI change)

**Build a OneMem LOCAL WORKER daemon (`onemem worker start/status/stop`, localhost SQLite, `/stream` SSE) that the Claude Code/Codex/local-OpenClaw hooks write to ON EVERY `PostToolUse` — and re-point the LOCAL dashboard to read that worker FIRST, with on-chain proof as an async per-row `proof_status` badge that upgrades live (`local → anchored → verified`).** In the same change, DELETE the five framework adapters (`crewai`, `livekit`, `elevenlabs`, `vercel-ai`, `openai-agents`) from the LOCAL dashboard's `KNOWN_RUNTIMES`/`/apps` list (`packages/dashboard/lib/runtimes.ts:62-89`) — the local runtime list shows ONLY Location-(A) runtimes, and framework adapters move to a hosted, chain-queried "Environments" view keyed by `environment`/namespace, with no pause toggle, no heartbeat, and no `enforced` claim. This single change makes OneMem's local dashboard feel ALIVE (claude-mem parity), makes the honesty problem disappear (only real local runtimes appear local; proof state is never faked), and operationalizes the read-model truth that adapter traces are queried by namespace/environment from chain, not by local connection.
