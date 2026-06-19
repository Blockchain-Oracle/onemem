# Grounding Report — Thread: claude-mem-blueprint

**Date:** 2026-06-19
**Surface:** The claude-mem "alive local viewer" model vs. what OneMem actually built.
**Verdict in one line:** OneMem borrowed claude-mem's *vocabulary* (hooks, SSE, "fills up live") but NOT its *mechanism*. There is no local worker, no local store, no per-tool-call liveness. The dashboard polls the chain every 5 seconds and a session only appears AFTER the user's Claude session ENDS. The thing that makes claude-mem feel alive is exactly the thing OneMem does not have.

---

## Part A — How claude-mem actually feels alive (reverse-engineered from the docs)

Sources: `docs/02-inspirations/claude-mem/README.md`, `.../HOOKS_AND_VIEWER_REFERENCE.md`. These are second-hand notes on claude-mem v12.6.2 (the real source is in `~/.claude/plugins/...`), but they're internally consistent and detailed. The lifecycle they describe:

1. **Setup hook** (`*`, 300s) runs `version-check.js` on every launch — validates plugin + deps. (README §1, HOOKS §1)
2. **SessionStart hook** (`startup|clear|compact`) fires TWO sub-hooks in order: (a) `worker-service.cjs start` — lazily spawns a **long-running local daemon** that writes `~/.claude-mem/worker.pid`, polls `GET /api/readiness` up to 10s; (b) `hook claude-code context` — `GET /api/context/inject`, injects prior context as a preamble. (HOOKS §9.1)
3. **UserPromptSubmit** → `POST /api/sessions/init` allocates a DB row; optional semantic injection. (HOOKS §9.2)
4. **PostToolUse** (`*`, 120s) → `POST /api/sessions/observations` — **every single tool call is written to the worker IMMEDIATELY**, which writes SQLite and **broadcasts an SSE `new_observation` event** to any connected viewer. (HOOKS §4.3, §5)
5. **PreToolUse** (`Read`) → `GET /api/observations/by-file` injects file-specific recall. (HOOKS §9.4)
6. **Stop** → `POST /api/sessions/summarize` — async compression at session end (cheap on hot path). (README §"compress at Stop").

**Why it feels alive — the three load-bearing facts:**
- **A persistent local daemon on `127.0.0.1:37777`** owns BOTH the hook write-path and the viewer read-path. It is the single source of truth. (HOOKS §4)
- **Writes land per-tool-call, synchronously, into local SQLite** (`better-sqlite3`), with a `Set<Response>` SSE broadcaster fanning `data: {...}\n\n` to the open viewer. So the instant you do work, the viewer card appears — no chain, no network, sub-100ms. (HOOKS §5; README §2 schema)
- **The viewer is served by the same daemon** off `express.static(plugin/ui/)`; it opens an `EventSource('/stream')` that auto-reconnects, and merges live SSE pushes with cursor-paginated REST history. (HOOKS §6)

**The defensive pattern that keeps it invisible when broken:** worker-unavailable errors (`ECONNREFUSED|EPIPE|...|5xx|429`) deliberately **exit 0** so a dead daemon never blocks the user's prompt; the worker is respawned on next `SessionStart`; stale PID files are liveness-checked with `process.kill(pid,0)`. (HOOKS §3, §9.6)

**Local store schema (claude-mem):** `sessions`, `memories`, `observations` (FK → `sdk_sessions`), `sdk_sessions`, `observation_queue`, plus `overviews/diagnostics/...`. SQLite is source-of-truth; Chroma sits beside it for vector search. (README §2, HOOKS §8)

---

## Part B — What OneMem actually built (ground truth, file:line)

### B.1 The Claude Code plugin: buffer-to-file, flush-on-Stop. No worker. No daemon.

`packages/plugin-claude-code/hooks/hooks.json:1-40` registers **only three** hooks — `SessionStart` → `inject.js`, `PostToolUse` → `observe.js`, `Stop` → `summarize.js`. There is **no Setup, no UserPromptSubmit, no PreToolUse**. (Codex's HOOKS reference proposed a 6-hook verbatim mirror including `PreToolUse(Read)` file-context and `UserPromptSubmit` session-init — neither shipped.)

- `scripts/inject.js:27-39` — SessionStart opens an on-chain `TraceSession` (`onemem.traces.startSession`) and writes a local JSON state file keyed by Claude `session_id`. **It does NOT inject any prior context.** The file is literally named `inject.js` but injects nothing back into Claude; it only persists `{onememSessionId, namespaceId, rwCapId}`. The README/HOOKS docs promised `SessionStart` would "Pull recent ActionCall events, fetch Walrus blobs, decrypt via Seal, inject" (HOOKS §1 mapping table) — **none of that exists.**
- `scripts/observe.js:23-27` — PostToolUse calls `bufferToolCall(...)`, which (`onemem-lib.mjs:103-106`) **appends one line to a local `.buffer.jsonl` file**. No network, no SSE, no daemon. The comment (`observe.js:3-5`) is honest: "Buffers each tool call to a local file INSTANTLY ... flushed on-chain in one batch at Stop."
- `scripts/summarize.js:42-68` — Stop reads the buffered calls and, **only now**, writes each one on-chain as a Seal-encrypted, Walrus-stored, Merkle-chained `ActionCall` (`appendCall` + `closeCall`), then `endSession`.

**Consequence for the user experience:** nothing about a session is queryable anywhere until the Claude session STOPS and the on-chain flush completes (a batch of Sui txns, one per tool call — potentially slow). During an active session, the only artifact is a local `.buffer.jsonl` file that **no viewer reads**.

### B.2 The "defensive worker-down" pattern — partially present, but there's no worker.

`onemem-lib.mjs:1-6` and every hook's `.catch(()=>{}).finally(()=>process.exit(0))` (e.g. `observe.js:30-32`, `inject.js:42-44`, `summarize.js:76-78`) replicate claude-mem's **"never block the user, always exit 0"** ethos correctly. That part is CONFIRMED and well done. But it's defending against SDK/chain failures, not a daemon — because **there is no daemon to be down.** The `isWorkerUnavailableError`-style transport classification (claude-mem's `ECONNREFUSED|EPIPE|...`) is absent; OneMem just swallows everything.

### B.3 The dashboard: polls the chain every 5s; the SSE stream is a stub nobody consumes.

- `packages/dashboard/app/api/stream/route.ts:12,26-38` — `/api/stream` is a **5-second chain poller** (`POLL_MS = 5_000`) calling `fetchRecentSessions(10)` and emitting only `ready` / `sessions` / `ping` / `error`. The header comment (`route.ts:1-4`) is honest: "Polls the chain ... emits an event whenever the newest session id changes."
- **Nobody consumes it.** `grep EventSource|/api/stream` across `packages/dashboard` returns only the route's own definition. `SessionsView.tsx` and `TraceView.tsx` contain no `EventSource`. So even the 5s poll feed is dead code from the UI's perspective.
- `app/sessions/page.tsx:1-16` — Sessions render as a **server component, one-shot `fetchUnifiedSessionGroups(100)` at request time**. To see new work, the user must hard-refresh the page.
- `lib/trace.ts:197+,118-160` — `fetchRecentSessions` queries Sui `queryEvents` for `TraceSessionOpenedEvent` over JSON-RPC. **Pure on-chain read.** No local mirror DB exists anywhere in product code (`grep better-sqlite3|sqlite3|IndexedDB|new Database(` across `packages/` = zero hits in source; only a vendored Seal chunk in `.next`).

### B.4 The documented data-flow describes a system that wasn't built.

`docs/05-our-architecture/06-dashboard/data-flow.md:154-184` specifies an SSE architecture where the server "Calls `client.trace.subscribe(session_id)`" and streams **11 event types**: `connected, initial_load, new_action_call, call_closed, new_trace_session, session_ended, new_attestation, processing_status, verification_status_change, capability_minted, capability_revoked`. **None of these exist.** The SDK has **no `subscribe`** (`grep subscribe packages/sdk-ts/src/traces.ts` → only a doc-comment mention; the only real read helper is `replaySession` at `traces.ts:297`). The real `/api/stream` emits 4 poll-derived events. The per-route flows (e.g. `/trace` "SSE subscribes specifically to this session's stream → `new_action_call` → append to tree", data-flow.md:87-90) describe live append that the code does not do.

The `dashboard/CLAUDE.md` even instructs: *"SSE pattern lifted from claude-mem viewer. Don't invent a new transport."* — but the claude-mem pattern (per-event push from a write-path-owning worker) was NOT lifted; a chain-poller was substituted and then orphaned.

---

## Part C — User POV: what a real user SEES vs what is TRUE

| User belief (set by docs/narrative) | Reality (file:line) |
|---|---|
| "My local dashboard fills up the instant my agent does work." | **False.** Nothing is written anywhere queryable until the Claude session **Stops** and the on-chain batch flush completes. `summarize.js:42-68`. |
| "There's a live local viewer like claude-mem's localhost:37777." | **False.** No local worker, no local store, no served viewer. The dashboard is a separate Next.js app reading the chain. `hooks.json`, `lib/trace.ts:197`. |
| "The dashboard live-updates via SSE." | **False in practice.** `/api/stream` is a 5s chain poller, and **no component subscribes to it.** Sessions need a manual page refresh. `route.ts:12`, `sessions/page.tsx:6`. |
| "SessionStart injects my prior memory back into Claude." | **False.** `inject.js` injects nothing; it only records a session-id mapping. `inject.js:27-39`. |
| "Per-tool-call observations stream in live." | **False.** Tool calls go to a local `.buffer.jsonl` no UI reads, then flush in one batch at Stop. `observe.js:23-27`, `onemem-lib.mjs:103-106`. |

The honest part: the **in-session local buffer IS instant** (`observe.js` comment is truthful) and the **defensive exit-0 discipline is real and correct**. The dishonest gap is that "instant local buffer" is dressed up as "live local dashboard" — and the buffer feeds nothing the user can look at.

---

## Part D — PARITY BLUEPRINT: minimal set to make OneMem's local dashboard fill up the instant a user works

This is the concrete delta. It deliberately **separates the live-local layer from the on-chain proof layer** — exactly the split that makes claude-mem fast and OneMem currently slow.

### D.1 Stand up a local worker daemon (the missing organ)
- A long-running local process (Node/Bun) bound to `127.0.0.1:<port>` (claude-mem uses 37777; OneMem dashboard already assumes `localhost:4040` per `claude-code-plugin.md:242` — pick one and own it).
- Lazily spawned by `SessionStart`; writes `~/.onemem/worker.pid` (`{pid,port,startedAt,version}`); `GET /api/readiness` polled up to 10s; PID liveness via `process.kill(pid,0)`.
- Health endpoint returns a **status superset** including MemWal creds state: `{status, version, pid, memwal:{signedIn,accountId,sealReady}}` (the docs already anticipated this — README §6).
- **Worker-down classification:** port the `isWorkerUnavailableError` transport list (`ECONNREFUSED|ECONNRESET|EPIPE|ETIMEDOUT|...|5xx|429`); hooks exit 0 on it. (OneMem already exits 0 but should distinguish so genuine bugs surface in logs.)

### D.2 Write to a local store on EVERY PostToolUse (not the chain)
- Replace "append to `.buffer.jsonl`, nobody reads it" with "**write to a local SQLite (or even the same JSONL, but served)** + broadcast SSE."
- Minimal tables (mirroring claude-mem, adapted):
  - `sessions(session_id, onemem_session_id, project, runtime, status, started_at_epoch)`
  - `observations(id, session_id, seq, tool_name, tool_namespace, input_preview, output_preview, parent_call_id, created_at_epoch, onchain_status)` — `onchain_status ∈ {buffered, flushing, attested}` is the OneMem-specific column that bridges local→proof.
  - `attestations(call_id, session_id, walrus_input_blob, walrus_output_blob, content_hash, prev_hash, sui_txid, attested_at_epoch)` — populated lazily by the flush worker.
- The write is **synchronous + local + sub-100ms**, just like claude-mem. The chain write becomes a **background reconciliation**, not a blocker.

### D.3 Endpoints the worker must expose (minimum viable superset)
- `GET /` — serve the local viewer (or proxy to the Next.js dashboard; either way one origin).
- `GET /health`, `GET /api/readiness` — daemon status incl. MemWal creds.
- `POST /api/sessions/observations` — hook write-path (per tool call).
- `GET /api/observations`, `GET /api/sessions`, `GET /api/session/:id` — read-path with cursor pagination.
- `GET /stream` — **real SSE** that fans `data: {...}\n\n` for `connected | initial_load | new_observation | new_attestation | processing_status`. Push on write, not on a 5s timer.
- `GET /api/processing-status` — flush queue depth (`buffered` count waiting for chain) so the UI can show "3 calls pending on-chain."

### D.4 Hook → worker flow (replace buffer-and-pray)
- `SessionStart`: spawn worker (idempotent) → `POST /api/sessions/init` → **AND inject prior context** (`GET /api/context/inject`) — close the `inject.js`-injects-nothing gap.
- `PostToolUse`: `POST /api/sessions/observations` (worker writes local + SSE-pushes instantly; worker independently enqueues the on-chain `appendCall`).
- `Stop`: `POST /api/sessions/summarize` → worker flushes remaining buffered calls to chain and marks them `attested`; SSE-push `new_attestation` per call so the viewer's lock icons flip live.

### D.5 The proof layer stays exactly where it is — but moves OFF the hot path
- The Seal-encrypt + Walrus-store + Merkle-chain + Sui-txn logic in `summarize.js`/`traces.ts` is **good and stays**. The only change: the worker performs it **asynchronously** and reconciles `observations.onchain_status` from `buffered → attested`. The user sees the row instantly (local) and watches it earn its on-chain proof (SSE update) — the best of both models.

### D.6 Dashboard changes
- Add an `EventSource('/stream')` consumer to `SessionsView` and `TraceView` (currently absent). Type-discriminate the events (claude-mem's `switch(data.type)` pattern). On `new_observation` → prepend a card; on `new_attestation` → flip the Verify state.
- For the LOCAL dashboard, read from the worker's local store first (instant) and treat the chain as the verification overlay — not the primary feed. The chain-poller `/api/stream` is the right transport for the HOSTED dashboard only.

**Net:** the minimal parity set is (1) a daemon, (2) a synchronous local write on every PostToolUse, (3) a real push-SSE, (4) a UI that consumes it, with (5) the on-chain attestation demoted to async background reconciliation. Everything else OneMem already has.

---

## Part E — CONFIRMED / REFUTED / UNCERTAIN on Codex claims in my area

The Codex artifacts touching this surface are the inspiration notes themselves (`README.md`, `HOOKS_AND_VIEWER_REFERENCE.md` — these read as Codex/agent-authored research) and `.thoughts/research/2026-06-18-onemem-product-code-audit.md`. Verdicts:

1. **Codex (HOOKS §1 mapping table): "OneMem will mirror claude-mem's 6-hook contract verbatim, incl. `Setup`, `UserPromptSubmit`, `PreToolUse(Read)` file-context, SessionStart context injection."**
   → **REFUTED.** Only 3 hooks shipped (`hooks.json:3-38`); no Setup/UserPromptSubmit/PreToolUse; `inject.js:27-39` injects no context. The mapping table is a *plan*, presented in places as if it's the contract. It is not the built reality.

2. **Codex (HOOKS §6, data-flow.md): "SSE pattern lifted from claude-mem viewer; dashboard live-updates via push SSE with `new_action_call`/`call_closed`/... events."**
   → **REFUTED.** Real `/api/stream` is a 5s chain poller emitting `ready/sessions/ping/error` (`route.ts:12,30-38`); the 11 documented event types don't exist; no UI consumes the stream. The *transport shape* (text/event-stream) was lifted; the *mechanism* (worker-owned per-write push) was not.

3. **Codex (README §"worker-service pattern", §6 IPC): "adopt the background daemon + HTTP IPC + worker-down exit-0 verbatim."**
   → **REFUTED (daemon) / CONFIRMED (exit-0 ethos).** No daemon, no HTTP IPC, no local store were built (`grep` = zero). The "always exit 0, never block the user" discipline WAS adopted and is correct (`onemem-lib.mjs:1-6`, every hook's `.finally(process.exit(0))`).

4. **Codex audit `2026-06-18-onemem-product-code-audit.md:55`: "dashboard memory view lists encrypted memory write metadata derived from on-chain `memwal_write` ActionCalls because MemWal lacks list/history."**
   → **CONFIRMED (consistent with code).** Matches the chain-read-only model in `lib/trace.ts`/`lib/memory.ts`; the dashboard is an on-chain reader, which is precisely why it can't be "instant." This audit is honest about it.

5. **Codex audit framing: "Verification is a support layer, not the headline; OneMem is closest to Mem0-but-decentralized."**
   → **UNCERTAIN / out-of-scope for me.** That's a positioning judgment. For MY surface it's irrelevant to whether the local-live experience exists — and it does not, regardless of how the product is framed. I flag only that GOAL.md (Pillar 2, lines 25-33) makes trace+replay THE end-user headline, which contradicts the audit's "demote verification" advice; that tension is for the positioning thread, not this one.

---

## Part F — The single most important correction

**OneMem copied claude-mem's words, not its clock.** claude-mem feels alive because a **local daemon writes every tool call to a local store synchronously and pushes it to a viewer over SSE in <100ms** — the chain (claude-mem has none) is never on the hot path. OneMem inverted this: it put **the chain on the hot path** (Stop-time batch flush) and left the local buffer feeding **nothing**, while the dashboard reads the chain by **polling every 5s with an SSE endpoint no component even subscribes to**, and the docs describe a live push-SSE system that was never built.

The fix is not more on-chain work — it's a **local worker + synchronous local write + real push-SSE + a UI that consumes it**, with the existing Seal/Walrus/Sui attestation demoted to **async background reconciliation**. Until that daemon exists, any claim that "the dashboard fills up the instant your agent works" is false, and the headline Pillar 2 ("show me what my agent actually did") only becomes visible AFTER the agent is done and the chain has settled.
