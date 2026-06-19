# Grounding Report 03 — Claude Code Runtime (the plugin)

Thread: `claude-code-runtime`
Date: 2026-06-19
Scope: REAL behavior of `packages/plugin-claude-code`. Read-only audit. Every
claim cited to file:line.

---

## 1. The 1-paragraph truth of this surface

The OneMem Claude Code plugin is a **3-hook trace recorder**, and it is honest
about being exactly that — but only if you read the code, not the brand copy.
On `SessionStart` it opens an on-chain `TraceSession`; on every `PostToolUse` it
appends the tool name/input/response to a **local JSONL buffer file** (zero
network, instant); on `Stop` it drains that buffer and writes **2 Sui
transactions per tool call** (`appendCall` + `closeCall`), then `endSession`.
The result is one verifiable, Merkle-chained on-chain trace per Claude session.
This works — there is a real testnet TraceSession
(`0x9c88…25e7`) that `onemem verify` returns `ok: true` for. **But three things
are quietly true that undercut the "alive," "auto," headline feel: (1) nothing
exists on-chain or in the dashboard until the session STOPS — mid-session there
is only a local buffer file no one reads; (2) the plugin is fully inert without
two env vars most users will never set (`ONEMEM_NAMESPACE_ID`,
`ONEMEM_RW_CAP_ID`); (3) the file named `inject.js` injects NOTHING into the
Claude context — it is a misnomer borrowed from claude-mem.** So the end-user
who installs this and expects "open my dashboard and watch my agent work live"
gets, instead, "finish a session, then later see a static receipt of it" — and
only if they did the manual one-time namespace/cap provisioning first.

---

## 2. End-to-end trace, exactly as the code does it

### Hook wiring — `hooks/hooks.json:1-40`
- `SessionStart` → `node ${CLAUDE_PLUGIN_ROOT}/scripts/inject.js`, timeout 30s
- `PostToolUse` → `scripts/observe.js`, timeout 10s
- `Stop` → `scripts/summarize.js`, timeout 120s

Matchers are all `""` (match everything). Confirmed against the spec's intent
(`docs/05-our-architecture/03-runtimes/claude-code-plugin.md:78-90`).

### SessionStart → `scripts/inject.js`
- Reads hook stdin JSON (`inject.js:18`), gets `session_id`.
- `loadConfig()` returns `null` and the hook **returns silently** if
  `ONEMEM_NAMESPACE_ID` or `ONEMEM_RW_CAP_ID` is missing
  (`onemem-lib.mjs:42-44`, used at `inject.js:20-21`).
- Checks `traceCaptureEnabled("claude-code")` — the runtime-controls pause/permission
  gate (`inject.js:22`).
- Builds the OneMem client (`loadClient`, `inject.js:24`); on any failure returns
  silently (`onemem-lib.mjs:63-71` swallows all errors → returns `null`).
- Calls `onemem.traces.startSession(...)` — **a REAL Sui transaction**
  (`inject.js:27-33`; SDK `traces.ts:117-121` builds a `Transaction` and
  `moveCall`). `agentId: "claude-code"`, `sdkVersion: "0.1.1"` are hardcoded.
- Persists `{ onememSessionId, namespaceId, rwCapId }` to
  `~/.onemem/cc-sessions/<claude_session_id>.json` (`inject.js:34-38`;
  path from `onemem-lib.mjs:12,73-75,85-88`).
- Writes a `[onemem] trace session … started` line **to stderr only**
  (`inject.js:39`).

**Critical truth about the name "inject":** in claude-mem, the SessionStart
hook is named "inject" because it INJECTS recalled memory into the model's
context window (via stdout `additionalContext`). OneMem's `inject.js` does **no
such thing** — I grepped: it has zero `stdout` / `additionalContext` /
`hookSpecificOutput` writes (verified empty). It only opens a trace session and
logs to stderr. The name is a vestige of the claude-mem blueprint and actively
misleads anyone reading the file list expecting memory recall on session start.

### PostToolUse → `scripts/observe.js`
- Returns early if event isn't `PostToolUse`, or no `session_id`/`tool_name`
  (`observe.js:16-18`).
- Returns early if `readSessionState()` is null — i.e. **if SessionStart never
  opened a session, every tool call is silently dropped** (`observe.js:20`).
- Checks `traceCaptureEnabled("claude-code")` again (`observe.js:21`).
- Appends ONE line to `~/.onemem/cc-sessions/<id>.buffer.jsonl` containing
  `{ toolName, toolInput, toolResponse }` (`observe.js:23-27`;
  `bufferToolCall` → `appendFileSync`, `onemem-lib.mjs:103-106`).
- **No network. No chain. No Walrus. No Seal.** This is correct per the
  "hooks must be fast" rule and is the one genuinely instant part.

### Stop → `scripts/summarize.js`
- `loadConfig()` / state guards (`summarize.js:24-28`).
- Reads the buffered calls (`summarize.js:29`).
- If `traceCaptureEnabled` is now false: clears buffer + state and returns
  WITHOUT flushing (`summarize.js:30-34`). So a pause toggled mid-session
  **discards** the buffered calls.
- Loads client; on failure **returns without clearing** (so buffer survives for
  a later retry — confirmed by unit test `plugin.test.ts:102-127`).
- For each buffered call, sequentially:
  - `traces.appendCall(...)` with `input: { content: enc(toolInput), encrypt:
    true }` (`summarize.js:43-51`)
  - `traces.closeCall(...)` with `output: { content: enc(toolResponse),
    encrypt: true }`, `status: Success` (`summarize.js:52-59`)
  - chains `parentCallId = emitted.callId` → Merkle parent-child linkage
    (`summarize.js:60`)
- `traces.endSession(... Completed)` (`summarize.js:63-68`).
- stderr `[onemem] flushed N call(s)` (`summarize.js:69-71`), then clears buffer
  + state (`summarize.js:72-73`).

**Latency reality the README hides:** each tool call = **2 on-chain
transactions** (`appendCall` then `closeCall`, both `await this.client.execute`
per `traces.ts:159-211`), executed **sequentially** in a loop, plus `startSession`
and `endSession`. A 40-tool-call session = ~82 sequential Sui testnet
transactions inside the Stop hook's 120s budget. This is plausible on testnet
but is a real risk for long sessions, and it is entirely invisible/blocking at
session end. The README frames Stop as a tidy "one batch" (`README.md:14,16`);
it is a batch of dozens-to-hundreds of sequential txs.

---

## 3. Where local state lives, and how durable it is

All under `~/.onemem/cc-sessions/` (`onemem-lib.mjs:12`), overridable via
`CLAUDE_PLUGIN_DATA`/`PLUGIN_DATA` (`onemem-lib.mjs:16-18`):

- `<claude_session_id>.json` — the session-id mapping (durable until Stop, then
  deleted at `summarize.js:73`).
- `<claude_session_id>.buffer.jsonl` — the raw, **UNENCRYPTED, plaintext**
  tool inputs/outputs (`onemem-lib.mjs:90-106`). Lives on disk for the entire
  session, deleted at Stop (`summarize.js:72`). Encryption only happens at flush
  time (`enc(...) + encrypt:true`, `summarize.js:50,57`) on the way to Walrus —
  **the local buffer itself is cleartext on the user's disk.** Worth noting
  against the "the relayer never sees plaintext" trust story: the buffer file
  does, transiently.
- `~/.onemem/runtime-controls.json` — pause/permission state
  (`onemem-lib.mjs:13,144-166`).

So: **the durable, verifiable artifact is on-chain. The local state is a
transient scratch buffer that is supposed to be empty by end of session.** If a
session never hits Stop (crash, kill -9), the buffer persists as orphaned
plaintext and never reaches chain — there is no recovery/replay-on-next-start
path in the code.

---

## 4. Does ANY of this feed the dashboard before Stop? — NO.

This is the single most important "alive vs reality" finding.

- The dashboard reads traces **purely from Sui chain events** via JSON-RPC:
  `packages/dashboard/lib/trace.ts:1-10` ("Reuses the SDK's read-only verifier …
  the same independently verifiable view the CLI and public /verify page use"),
  querying `ActionCallEmittedEvent` / `TraceSessionOpenedEvent`
  (`trace.ts:9-10`). `sessions.ts` is built entirely on `fetchRecentSessions` /
  `fetchSession` from `trace.ts` (`sessions.ts:1`).
- I grepped the entire dashboard + SDK for any read of the CC buffer
  (`cc-sessions`, `.buffer.jsonl`, `~/.onemem/cc`): **zero hits.** The dashboard
  never touches the local buffer.

Therefore mid-session there is **nothing for a user to watch**:
- SessionStart writes one `TraceSession` object on-chain, so the *session* node
  appears once Stop's prerequisite (startSession) lands — but it lands at
  SessionStart, so an empty session shell can show up. However the **calls**
  (the actual "what my agent did") only appear after Stop.
- Between SessionStart and Stop, every tool call sits in a local JSONL file that
  no surface renders.

The Pillar-2 headline — *"show me what my agent actually did"* / "Replay button"
(`GOAL.md:25-33,61`) — is only true **after a session ends**, and only as a
post-hoc receipt. There is no live stream, no worker, no tail. This is the gap
between the claude-mem "alive feel" (its `localhost:37777` viewer reads a local
SQLite DB that's written continuously) and OneMem (chain-only, write-at-Stop).

---

## 5. When is the plugin inert? (honest preconditions)

The plugin no-ops, silently, in ALL of these cases:
1. `ONEMEM_NAMESPACE_ID` or `ONEMEM_RW_CAP_ID` unset (`onemem-lib.mjs:42-44`).
   **This is the default state for any fresh install.** There is no
   auto-provisioning in the hooks — contrast with the memory MEMORY.md feedback
   "auto-provision namespace/cap/signer like the MCP auto-creates the MemWal
   account." The MCP may auto-provision, but **these trace hooks do not.**
2. No signer: no `ONEMEM_PRIVATE_KEY` AND no `~/.sui/sui_config/sui.keystore`
   (`onemem-lib.mjs:54-60`) → `loadClient` throws → swallowed → null → no-op.
3. `@onemem/sdk-ts` import fails (`onemem-lib.mjs:64-70`).
4. Runtime paused or `traceCapture:false` in runtime-controls.json
   (`onemem-lib.mjs:152-166`).
5. SessionStart didn't run / didn't persist state → PostToolUse drops everything
   (`observe.js:20`).

The SKILL.md is admirably honest about this: "Without those values, the plugin
is intentionally inert rather than partially writing traces"
(`SKILL.md:42-44`) and "Do not claim live automatic trace coverage unless the
plugin is installed, hooks are enabled … and the resulting … TraceSession
verifies on-chain" (`SKILL.md:30-32`). **The SKILL.md is the most truthful
document in the package.** The README is the least.

---

## 6. Compare to the claude-mem blueprint (the "alive" gap)

The spec explicitly says OneMem mirrors claude-mem's hook structure
(`claude-code-plugin.md:75,93`). What's MISSING for the "alive" feel:

| claude-mem (alive) | OneMem CC plugin (today) | Evidence |
|---|---|---|
| SessionStart injects recalled memory into context | `inject.js` injects NOTHING; opens a trace session only | `inject.js` (no stdout) |
| Continuous local viewer at `localhost:37777` reading live SQLite | No live local viewer; dashboard reads chain-only, post-Stop | `trace.ts:1-10` |
| Worker process writes as you go | No worker; buffer flushed in one blocking Stop pass | `summarize.js:42-68` |
| Data visible mid-session | Nothing visible until Stop | §4 above |
| Local-first durability | Transient buffer, no crash recovery | §3 above |

OneMem's differentiator (real on-chain verifiable trace + cross-runtime) is
genuine and claude-mem doesn't have it. But the *experiential* "watch your agent
think" liveness that makes claude-mem feel alive is **not present**, and the
README/GOAL copy implies it is.

---

## 7. Codex-claim verdicts (Codex audited the sibling Codex plugin + product code;
same architecture; I map each relevant claim to the Claude Code plugin)

- **CONFIRMED** — "Hook scripts are packaged and locally simulated; real trace
  writes work through the SDK; full automatic hook trace coverage needs a real
  trusted interactive session" (`codex-hook-proof-boundary.md` research,
  "Inferences"). For Claude Code: unit tests simulate the path
  (`plugin.test.ts`), an integration test exists but is gated behind
  `ONEMEM_INTEGRATION=1` (`plugin.integration.test.ts:19,44`), and the live
  trusted proof is the testnet session `0x9c88…25e7`
  (`claude-code-plugin.md:36-47`, `README.md:42-44`). Matches reality.

- **CONFIRMED** — Product-audit claim: "Trace sessions and Merkle verification
  are implemented, but … they prove integrity of the recorded sequence, not that
  the agent honestly recorded all real-world activity"
  (`onemem-product-code-audit.md:56`). This is exactly right and is THE honest
  boundary for Pillar 2. The CC plugin only records what PostToolUse fires on;
  it cannot prove completeness.

- **CONFIRMED** — Product-audit: dashboard trace/memory views are derived from
  on-chain events (`onemem-product-code-audit.md:55`, my §4). Verified at
  `trace.ts:1-10`.

- **CONFIRMED / EXTENDED** — Codex verification claims a `callCount:1` verified
  trace per its trusted proof. The CC README claims the same shape
  (`README.md:42-44`, `callCount: 1`). I did not re-run chain verification (no
  signer/network in this read-only thread), so the *existence* of the on-chain
  session is **UNCERTAIN-by-me** but the code path that would produce it is real
  and correct. Marking the code path CONFIRMED, the specific tx hash UNCERTAIN
  (unverified by me).

- **UNCERTAIN** — README publication note (`README.md:40-48`) asserts
  `@onemem/claude-code-plugin@0.1.1` is current on npm and the GitHub
  marketplace path works. I cannot verify registry/marketplace state from a
  read-only local audit. Flagging as unverified, not refuted.

- **No REFUTED items.** Nothing the Codex audits claimed about this area is
  contradicted by source. The Codex framing ("verification is a support layer,
  not the headline," `onemem-product-code-audit.md:146`) is, if anything, MORE
  honest than the GOAL.md headline and the README.

---

## 8. Top problems (user-POV)

1. **"Alive" is a lie of omission.** No surface shows anything until the session
   STOPS. The user who expects to watch their agent live (implied by Pillar-2
   copy and the dashboard "Replay" framing) sees nothing mid-session. Fix the
   copy, or build a tail.
2. **Default install is inert.** Without `ONEMEM_NAMESPACE_ID` +
   `ONEMEM_RW_CAP_ID` (not auto-provisioned by the hooks), the plugin does
   exactly nothing, silently. A user can "install" and believe capture is on
   when it is off. There is no startup warning to the user (stderr only).
3. **`inject.js` is a misnomer** that injects no memory/context, and the local
   buffer is **plaintext on disk** — a small but real dishonesty against the
   "relayer never sees plaintext / everything encrypted" story.

## 9. The single most important correction

**Stop claiming or implying live/auto/alive capture for Claude Code. The honest
one-liner is:** *"When configured with a namespace + write capability, the
OneMem Claude Code plugin records each session's tool calls to a local buffer
and, at session end, writes them as one Merkle-chained, Seal-encrypted,
on-chain TraceSession you can verify and replay after the fact."* Every word of
that is backed by source. Anything stronger ("alive," "real-time," "auto," "just
install it") is not.
