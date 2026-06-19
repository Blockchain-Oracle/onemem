# Target Architecture — Thread 04: The Local Worker Daemon

**Date:** 2026-06-19
**Thread:** local-worker (the "alive like claude-mem" organ)
**Status:** TARGET design. Diagnosis already done — see `00-GROUNDING-SYNTHESIS.md §5b` and `v1/02-claude-mem-blueprint.md` Part D.
**Scope:** the `onemem worker` daemon: lifecycle, local store, hook→worker write path, SSE event set, proof-status state machine. This REPLACES the current buffer-and-flush-at-Stop model **without losing the verifiable on-chain artifact.**

Every element is tagged **SHIPPED** (exists today, file:line), **BUILDABLE** (constructible from confirmed primitives — names which), or **RISKY** (could not confirm — names what to verify).

---

## 0. The one-sentence target

A long-running localhost daemon (`onemem worker`, bound `127.0.0.1`) owns BOTH the hook write-path and the dashboard read-path: every `PostToolUse` posts an observation, the worker writes it to local SQLite **synchronously (<100ms)** and SSE-pushes it instantly, while the Seal+Walrus+Sui `ActionCall` anchoring runs **asynchronously off the hot path** as a per-row `proof_status` that flips `local → queued → anchored → verified` live in the UI. The on-chain Merkle-chained TraceSession — the entire verifiable artifact that exists today — is **preserved byte-for-byte**; it simply moves from "blocking batch at Stop" to "background reconciliation per row."

---

## 1. What exists today (the thing being replaced) — SHIPPED

The current Claude Code pipeline is a **3-hook buffer-and-flush recorder**, all under `~/.onemem/cc-sessions/`:

- **SessionStart** `inject.js:27-39` — opens an on-chain `TraceSession` via `onemem.traces.startSession(...)`, persists `{onememSessionId, namespaceId, rwCapId}` to `<claude_session_id>.json`. Injects no context. **SHIPPED.**
- **PostToolUse** `observe.js:23-27` → `bufferToolCall` (`onemem-lib.mjs:103-106`) appends one line to `<id>.buffer.jsonl`. Plaintext, no network, no UI reads it. **SHIPPED.**
- **Stop** `summarize.js:42-68` — drains the buffer and writes **2 Sui txns per call** (`appendCall`+`closeCall`) sequentially, then `endSession`. ~82 sequential testnet txns for a 40-call session, all inside the 120s Stop budget. **SHIPPED but on the hot path.**
- **Defensive exit-0 discipline** — every hook `.catch(()=>{}).finally(()=>process.exit(0))` (`observe.js:30-32` etc.). **SHIPPED, correct, KEPT verbatim.**
- **Codex plugin** (`packages/plugin-codex/scripts/`) mirrors the same 3-hook shape. **SHIPPED.**

**The single defect this thread fixes:** between SessionStart and Stop there is *nothing a user can watch* — the calls live in a JSONL file no surface renders, and the chain only fills at Stop. The dashboard's only "live" feed is a 5s chain poller (`dashboard/app/api/stream/route.ts:12`) that **no component subscribes to** (grep `EventSource` in dashboard = the route's own def only).

---

## 2. Daemon lifecycle — BUILDABLE-new

A new package `@onemem/worker` (Node, `127.0.0.1` HTTP + SSE). Lazily spawned, never blocks the user, dies silently. The lifecycle is a clean-room re-implementation of claude-mem's contract (HOOKS_AND_VIEWER_REFERENCE.md §9 — interface, not source).

### 2.1 Lazy auto-spawn from SessionStart — BUILDABLE
`inject.js` gains a FIRST step `ensureWorker()` (in `onemem-lib.mjs`) that runs **before** any chain work:

1. Read `~/.onemem/worker.pid` = `{ pid, port, startedAt, version }`.
2. **Liveness:** `process.kill(pid, 0)` — throws `ESRCH` if dead. If dead or file missing → spawn. **BUILDABLE** (`process.kill(pid,0)` is a Node primitive; claude-mem uses the identical check, HOOKS §9.6).
3. **Spawn:** `child_process.spawn(process.execPath, [workerEntry], { detached: true, stdio: ['ignore', logFd, logFd] })` then `child.unref()`. Detaches so the daemon outlives the hook process. Log → `~/.onemem/logs/worker-YYYY-MM-DD.log`. **BUILDABLE** (standard `detached+unref` daemon pattern).
4. **Readiness poll:** `GET http://127.0.0.1:<port>/api/readiness` every 200ms up to 10s; 200 `{status:"ready"}` once the SQLite migrations + HTTP listener are up, else 503 `{status:"initializing"}`. **BUILDABLE.**
5. Idempotent: a live PID short-circuits at step 2 — no double-spawn.

**Port:** OneMem owns `4040` for the dashboard already (`dashboard/CLAUDE.md` "headline view", `claude-code-plugin.md:242`). The worker binds a **separate** port (default `4041`, env `ONEMEM_WORKER_PORT`) so the daemon and the Next.js dashboard can co-exist; the local dashboard fetches the worker cross-origin on `127.0.0.1:4041` (localhost CORS allow-list). **BUILDABLE.** *Design choice owned here: keep them separate processes rather than serving the dashboard from the worker — the dashboard is already a standalone Next build (`next.config.mjs output:'standalone'`), and re-hosting it inside the worker is scope we don't need for the demo.*

### 2.2 Bind 127.0.0.1 — BUILDABLE / fixes a SHIPPED bug
Worker listens on `127.0.0.1` only (never `0.0.0.0`). This also closes BUG-2 (`bin/onemem-dashboard:26` binds `0.0.0.0`) for the local surface. **BUILDABLE.**

### 2.3 Worker-down classification + exit-0 — BUILDABLE
Port claude-mem's `isWorkerUnavailableError(err)`: matches `ECONNREFUSED|ECONNRESET|EPIPE|ETIMEDOUT|ENOTFOUND|"fetch failed"|"socket hang up"`, any 5xx, 429 (HOOKS §3). On a worker-unavailable error the hook **exits 0** (never blocks the user). On any OTHER error (a real bug) it logs to stderr so it surfaces — an improvement over today's blanket swallow (`onemem-lib.mjs:64-70`). The existing `.finally(process.exit(0))` stays. **BUILDABLE** — extends SHIPPED discipline.

### 2.4 Readiness payload carries credential state — BUILDABLE
`GET /api/readiness` → `{ status, version, pid, capture: { configured, namespaceId?, signer } }` where `configured` reflects `loadConfig()` (`onemem-lib.mjs:41-51`) — so the dashboard can show "capture is OFF — set namespace + cap" instead of looking silently empty (closes the "default install is inert, silently" gap, runtime report §8.2). **BUILDABLE.**

---

## 3. Local store schema — BUILDABLE-new (SQLite via `better-sqlite3`)

`~/.onemem/worker.db`. Synchronous, single-writer (the daemon), sub-100ms writes. `better-sqlite3` is a new dependency on the worker package only — confirmed-standard (it's exactly what claude-mem uses, HOOKS §8). **BUILDABLE.** *(If native-build friction on the demo machine is a risk, the same schema runs on `node:sqlite` (Node 22+) — note as the fallback.)*

```sql
CREATE TABLE sessions (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  runtime_session_id TEXT UNIQUE NOT NULL,   -- Claude/Codex session_id
  onemem_session_id TEXT,                    -- on-chain TraceSession objectId (from startSession)
  namespace_id      TEXT NOT NULL,
  rw_cap_id         TEXT NOT NULL,
  runtime           TEXT NOT NULL,           -- 'claude-code' | 'codex'
  project           TEXT,                    -- cwd
  status            TEXT NOT NULL,           -- 'active' | 'completed' | 'failed'
  started_at_epoch  INTEGER NOT NULL,
  ended_at_epoch    INTEGER
);

CREATE TABLE observations (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  runtime_session_id TEXT NOT NULL,
  seq               INTEGER NOT NULL,        -- order within session
  tool_name         TEXT NOT NULL,
  tool_namespace    TEXT NOT NULL DEFAULT 'claude-code',
  input_preview     TEXT,                    -- truncated, for the card
  output_preview    TEXT,
  input_raw         TEXT,                    -- full plaintext, needed for the async anchor
  output_raw        TEXT,
  parent_call_id    TEXT,                    -- Merkle parent (filled when prior row anchors)
  call_id           TEXT,                    -- on-chain ActionCall id (filled at anchor)
  sui_tx_digest     TEXT,
  proof_status      TEXT NOT NULL DEFAULT 'local',  -- local|queued|anchored|verified|failed
  created_at_epoch  INTEGER NOT NULL,
  FOREIGN KEY(runtime_session_id) REFERENCES sessions(runtime_session_id)
);

CREATE TABLE prompts (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  runtime_session_id TEXT NOT NULL,
  seq               INTEGER NOT NULL,
  text              TEXT NOT NULL,
  created_at_epoch  INTEGER NOT NULL
);

CREATE TABLE proof_jobs (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  observation_id    INTEGER NOT NULL,
  kind              TEXT NOT NULL,           -- 'append_close' | 'end_session'
  attempts          INTEGER NOT NULL DEFAULT 0,
  last_error        TEXT,
  claimed_at_epoch  INTEGER,                 -- lease, for crash-safe single-flight
  done              INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(observation_id) REFERENCES observations(id)
);
```

**The OneMem-specific column is `observations.proof_status`** — the bridge from "observed locally" to "anchored on chain." It is the entire reason this design differs from claude-mem: claude-mem has no chain, so it has no such column. **`proof_jobs` is the durable async queue** that replaces the in-process Stop loop — and gives us crash recovery the current model lacks (today an un-Stopped session orphans plaintext forever, runtime report §3).

---

## 4. Hook → worker write path — BUILDABLE-new (the core change)

The hooks stop touching SQLite/the chain directly. They become thin HTTP clients to the daemon. `onemem-lib.mjs` gains `postWorker(path, body)` (a `fetch` to `127.0.0.1:4041` wrapped in `isWorkerUnavailableError` → exit 0).

| Hook | TODAY (SHIPPED) | TARGET (BUILDABLE) |
|---|---|---|
| **SessionStart** `inject.js` | `startSession` on chain + write JSON state | `ensureWorker()` → `POST /api/sessions/init {runtime_session_id, namespace_id, rw_cap_id, runtime, project}`. **Worker** opens the on-chain `TraceSession` (async, see §5) and writes the `sessions` row. |
| **PostToolUse** `observe.js` | append to `.buffer.jsonl` | `POST /api/sessions/observations {runtime_session_id, tool_name, tool_input, tool_response}`. **Worker** writes the `observations` row synchronously (`proof_status='local'`), SSE-pushes `new_observation` instantly, and enqueues a `proof_jobs` row. Returns 202 in <100ms. |
| **Stop** `summarize.js` | sequential append/close/end on chain (the 82-tx blocker) | `POST /api/sessions/summarize {runtime_session_id}`. **Worker** marks the session `completed` and enqueues `end_session`. The flush has ALREADY been draining in the background since the first PostToolUse — Stop just closes the tail. **No blocking batch.** |

**Critical:** the hot path is now `fetch → SQLite insert → SSE write → return`. The chain is never on it. **The 120s Stop blocking budget problem disappears** because anchoring streams concurrently with the session instead of batching at the end.

### 4.1 What the worker actually calls — reuses SHIPPED SDK
The worker instantiates ONE long-lived `OneMem.create({network, signer})` client (no per-hook re-creation) and calls the **exact SHIPPED methods** the Stop hook calls today:
- `onemem.traces.startSession(...)` — SHIPPED `traces.ts:117`.
- `onemem.traces.appendCall({ sessionId, namespaceId, rwCapId, parentCallId, toolName, toolNamespace, input:{content:enc(...), encrypt:true} })` → `{callId, txDigest}` — SHIPPED `traces.ts:159`, args `AppendCallArgs:44-53`.
- `onemem.traces.closeCall({ ..., callId, output:{content:enc(...), encrypt:true}, status:CallStatus.Success })` — SHIPPED `traces.ts:211`, `CloseCallArgs:55-62`.
- `onemem.traces.endSession({ ..., status:SessionStatus.Completed })` — SHIPPED `traces.ts:239`.

So the verifiable artifact is **identical** to today's — Seal-encrypted, Walrus-stored, Merkle-chained, same `verifySession` (`traces.ts:267`) / public `/verify` path validates it. We changed *when and where* these run, not *what* they produce. The plaintext that today sits in `.buffer.jsonl` now sits in `observations.input_raw/output_raw` until anchored, then is nulled — same transient-plaintext exposure as today, no worse (runtime report §3).

---

## 5. The proof reconciler — BUILDABLE-new (off the hot path)

A single in-process loop in the worker (`setInterval` ~750ms, or wake-on-enqueue) drains `proof_jobs` **in `seq` order per session** (Merkle chain requires strict parent→child ordering — `summarize.js:60` sets `parentCallId = emitted.callId`):

```
for each pending append_close job (oldest seq first, per session):
  set observations.proof_status = 'queued'; SSE push proof_status
  callId  = await appendCall({ parentCallId: <prev row's call_id>, ... })   // 1 Sui tx
  await closeCall({ callId, ... })                                          // 1 Sui tx
  set call_id, sui_tx_digest, parent_call_id, proof_status='anchored'; done=1
  SSE push { type:'proof_status', observation_id, proof_status:'anchored', sui_tx_digest }
end_session job (after all rows anchored): endSession(...) ; session.status='completed'
```

- **`verified`** is computed on read: the dashboard/worker runs `onemem.traces.verifySession(onemem_session_id)` (SHIPPED `traces.ts:267`) and, if the Merkle root checks out, flips the badge to `verified`. The worker can run this once after `end_session` lands and SSE-push the final `proof_status:'verified'` per row. **BUILDABLE.**
- **`failed`** on max attempts; `last_error` recorded; SSE push so the badge shows an honest red, never a fake green.
- **Crash recovery:** `proof_jobs.claimed_at_epoch` is a lease; on worker restart, un-done jobs with a stale lease are re-claimed. This is the recovery path the current model entirely lacks. **BUILDABLE.**

**RISKY — sequential parent-chain throughput.** The Merkle chain forces append/close to run *in order* (you need the prior `call_id` before the next `parentCallId`). So per-session anchoring is still serial — 2 txns/call — exactly as today, just concurrent with the session instead of batched at Stop. For a 100-call session that's ~200 testnet txns trickling over the session's lifetime; if the session is short and bursty, the tail still drains after Stop. **Must verify:** testnet tx latency under sustained sequential load, and confirm the UI honestly shows "N calls still anchoring" after Stop rather than implying instant proof. *Mitigation if needed:* the local row is `verified-by-local-hash` immediately (we hold the plaintext + can compute `content_hash` locally and show "locally recorded, anchoring…"), and only the on-chain badge lags — which is the honest claim anyway.

---

## 6. The `/stream` SSE event set — BUILDABLE-new

Real push SSE (`text/event-stream`, `data: <JSON>\n\n`), pushed **on write**, not on a 5s timer. Replaces the orphaned chain-poller (`dashboard/app/api/stream/route.ts`) for the LOCAL surface. A `Set<res>` broadcaster fans to all connected dashboard tabs (claude-mem's `SSEBroadcaster` pattern, HOOKS §5 — interface only). Reconnect on the client with the claude-mem `EventSource.onerror → close → setTimeout(connect)` pattern (HOOKS §5).

```ts
type WorkerStreamEvent =
  | { type: 'connected'; timestamp: number }
  | { type: 'initial_load'; sessions: SessionRow[]; capture: { configured: boolean } }
  | { type: 'new_session';     session: SessionRow }
  | { type: 'new_observation'; observation: ObservationRow }   // proof_status:'local'
  | { type: 'new_prompt';      prompt: PromptRow }
  | { type: 'proof_status';    observationId: number; sessionId: string;
                               proofStatus: 'local'|'queued'|'anchored'|'verified'|'failed';
                               suiTxDigest?: string }
  | { type: 'session_ended';   sessionId: string; status: string }
  | { type: 'processing_status'; pending: number };            // proof_jobs not-done count
```

Dashboard consumes via a type-discriminated `switch(data.type)` (HOOKS §6.3): `new_observation` → prepend a card with a grey "local" dot; `proof_status` → flip THAT card's badge live (`local`→spinner→`anchored` lock →`verified` chartreuse ✓). **This is how the badges flip in real time** — and the chartreuse ✓ stays reserved for Verify only (`dashboard/CLAUDE.md` brand rule). **BUILDABLE.**

### 6.1 Worker HTTP surface (minimum viable)
`GET /api/readiness` · `GET /api/health` · `POST /api/sessions/init` · `POST /api/sessions/observations` · `POST /api/sessions/summarize` · `GET /api/sessions` · `GET /api/session/:id` · `GET /api/observations?session=` (cursor-paginated history) · `GET /stream`. All localhost-CORS gated. **BUILDABLE.** *(Subset of claude-mem's 62 endpoints — we ship the ~9 the demo needs, not the corpus/search/settings surface.)*

---

## 7. How this REPLACES buffer-and-flush without losing the artifact

| Property | Buffer-and-flush (SHIPPED) | Worker (TARGET) |
|---|---|---|
| Mid-session visibility | none (JSONL no one reads) | **instant** SSE card per call |
| On-chain artifact | Merkle TraceSession at Stop | **same** Merkle TraceSession, anchored progressively |
| Stop latency | blocks ≤120s on ~82 txns | near-zero; tail drains async |
| Crash recovery | none (orphan plaintext) | `proof_jobs` lease re-claim |
| Proof honesty | binary, post-hoc | live `local→queued→anchored→verified` badge |
| `verifySession` path | unchanged | **unchanged** (`traces.ts:267`) |

The on-chain TraceSession, ActionCall Merkle chain, Seal encryption, Walrus storage, and the public `/verify` verifier are **byte-for-byte preserved**. We moved the SDK calls from the Stop hook into a background reconciler and inserted a local SQLite mirror + SSE in front. **Nothing verifiable is lost; everything alive is gained.**

---

## 8. SHIPPED / BUILDABLE / RISKY ledger

**SHIPPED (reuse as-is):** `OneMem.create` factory; `traces.startSession/appendCall/closeCall/endSession/verifySession` (`traces.ts:117/159/211/239/267`); `enc()` + `encrypt:true` Seal/Walrus path; exit-0 defensive discipline; `loadConfig/loadClient/loadSigner` (`onemem-lib.mjs:41-71`); `traceCaptureEnabled` pause gate (`onemem-lib.mjs:152`); 3-hook manifest shape (`hooks.json`).

**BUILDABLE (new, from confirmed primitives):** the daemon (`detached spawn`+`unref`, `process.kill(pid,0)`, readiness poll — all Node stdlib); `~/.onemem/worker.pid`; `better-sqlite3` store (or `node:sqlite` fallback); the 4-table schema incl. `proof_status`; hook→worker HTTP rewrite; `proof_jobs` durable async queue + reconciler; real push `/stream` + the 8 event types; dashboard `EventSource` consumer (currently absent — grep confirms); readiness credential-state payload.

**RISKY / must verify:**
1. **Sequential Merkle anchoring throughput** on testnet under sustained per-call load (§5) — confirm latency + that the UI honestly shows the anchoring tail. Highest design risk.
2. **`better-sqlite3` native build** on the demo/CI machine — fallback is `node:sqlite` (Node 22+); confirm Node version before committing the dep.
3. **Worker/dashboard two-port CORS** on `127.0.0.1` from a `localhost:4040` Next origin — standard but verify the dashboard's fetch/SSE isn't blocked.
4. **Codex hook parity** — Codex requires a one-time `/hooks` trust and `codex exec` doesn't fire hooks (synthesis §4); the worker contract is identical but capture is `trusted-hooks-required`, not automatic. Verify Codex pipes the same stdin shape.

---

## 9. Dependencies on other threads
- **Dashboard thread (03):** must add the `EventSource('127.0.0.1:4041/stream')` consumer + `proof_status` badge component (chartreuse ✓ reserved for `verified`). The local `/sessions` + `/trace/[id]` read from the **worker** (instant) and treat the chain as the verification overlay — not from the chain-poller. The hosted dashboard keeps the chain-read path.
- **Bug-fix thread:** BUG-1 (package-id event read) still gates `verifySession`/chain reads the worker's `verified` step depends on (`lib/trace.ts:33` vs `originalPackageId`). The worker's local feed is independent of BUG-1 — it works even if chain reads are broken — which is itself a resilience win.
- **Positioning thread (Pillar-2 headline):** this daemon is what makes "watch exactly what your agent did, live" *true* for the local demo. Without it the headline is post-hoc only.
- **MCP thread:** out of scope here (location C, explicit-tools-only, no PostToolUse) — but if `add_memory` is wired to attest (synthesis §8a), it would post to the same worker `observations` path.
