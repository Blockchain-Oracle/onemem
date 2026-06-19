# Target Architecture — MCP Server (`@onemem/mcp`)

**Thread:** mcp-server
**Date:** 2026-06-19
**Scope:** `packages/mcp-server`. The universal stdio MCP server consumed by explicit-tool fallback clients (Cursor/Windsurf until OneMem ports their ClaudeMem-proven hooks; Cline, OpenCode, Gemini/Antigravity, Claude Desktop) AND as a slash-command surface inside location-A runtimes (Claude Code, Codex).
**Governing principle applied:** execution location → product surface. MCP fallback clients can ONLY perform *explicit OneMem tool calls* — **no auto-capture, no auto-recall**. The server's honest job is to be a clean, attesting tool surface, never to pretend it observes everything the agent does. Cursor/Windsurf are not architecture-level MCP-only anymore; their hook ports are pending.

---

## 0. The one decision this thread must land

**The `add_memory`-emits-no-attestation gap (BUG-3) is the single honesty hole in the MCP surface.** Today `onemem_add_memory` → `onemem.requireMemory().add(text, { namespace })` (`packages/mcp-server/src/index.ts:82`) passes ONLY the MemWal namespace string. The SDK only emits the on-chain `memwal_write` `ActionCall` when `sessionId` + `onememNamespaceId` + `rwCapId` are ALL supplied (`packages/sdk-ts/src/memory.ts:182-194`) — which the MCP path never supplies. So an MCP-written memory lands encrypted on Walrus but produces **no trace node, no Merkle attestation**, while the tool description still promises "Returns the Walrus blob id + **attestation**" (`index.ts:71`). The integration test even codifies the gap: it asserts only `walrusBlobId`, never `callId`/`suiTxDigest` (`tests/mcp.integration.test.ts:64-69`).

**DECISION: WIRE IT — make `add_memory` attest on-chain. Do NOT drop the attestation claim.**

**Justification.** OneMem's entire identity is "the verifiable record of what your agent DID + memory you OWN." A memory-write tool that produces *no verifiable record* is the product contradicting itself at the exact surface a Cursor/Windsurf user touches. Dropping the claim would be honest but would make the MCP path a strictly worse Mem0 (encrypted blob, no proof) — it would forfeit the only differentiator on location C. And wiring it is **cheap and BUILDABLE from shipped primitives** (§3): the SDK already has the full `startSession → appendCall → endSession` loop (`traces.ts:117-254`), a one-shot `recordSession` helper (`runtime.ts:222-289`), and a provision-and-persist `ensureNamespace` helper (`runtime.ts:170-208`). The MCP server already resolves a Sui signer (`signer.ts:44`). Every piece exists; they are simply not wired together in `index.ts`. There is no reason to drop a true, demoable claim when the cost to make it true is one helper call.

---

## 1. Target capability framing (location C — honest)

The server MUST tell the truth about what MCP-only gives you vs a native plugin. This framing is already correct in `docs/05-our-architecture/03-runtimes/mcp-server.md:257-264`; the target makes it the *spine* of the tool descriptions and README, not a buried table.

| Capability | MCP-only (this server) | Native plugin (Claude Code hooks) |
|---|---|---|
| Auto-capture every tool call | ❌ never — only explicit `onemem_*` calls | ✅ PostToolUse hooks |
| Auto-recall at session start | ❌ never — agent must call `onemem_search_memory` | ✅ session-start inject |
| Memory write attested on-chain | ✅ **(target)** each `add_memory` opens a 1-call attesting session | ✅ batched at Stop |
| Verify / replay / trace / share | ✅ explicit tool calls | ✅ slash commands |

**The honest one-liner the README + landing strip must carry for location C:** *"Explicit OneMem tools only — no automatic capture or recall. Every memory you write through OneMem is still attested on-chain and independently verifiable."* (Matches the dashboard "MCP clients" badge the dashboard thread is adding.)

---

## 2. Target tool surface (8 tools)

Keep the 7 shipped tools; **add ONE** (`onemem_session_status`) so an MCP agent can discover the namespace it is writing to and prove its own writes. No tool is removed.

| Tool | SDK call | Status | Change vs today |
|---|---|---|---|
| `onemem_add_memory` | `memory.add(text, { namespace, sessionId, onememNamespaceId, rwCapId })` | **SHIPPED tool, BUILDABLE fix** | Now opens/uses an attesting session; returns real `callId` + `suiTxDigest` |
| `onemem_search_memory` | `memory.search(query, opts)` | SHIPPED | unchanged |
| `onemem_verify_trace` | `traces.verifySession(id)` | SHIPPED | unchanged |
| `onemem_trace_session` | `traces.getCalls(id)` | SHIPPED | unchanged |
| `onemem_replay_session` | `traces.replaySession(id)` | SHIPPED | unchanged |
| `onemem_share_namespace` | `namespaces.shareReadOnly/ReadWrite` | SHIPPED | unchanged |
| `onemem_revoke_namespace_capability` | `namespaces.adminRevokeCapability` | SHIPPED | unchanged |
| `onemem_session_status` *(NEW)* | reads provisioned target + active MCP session id | **BUILDABLE** | new read-only tool (see §4) |

**Explicitly NOT added** (honesty over surface area): `get_memory`, `update_memory`, `delete_memory`. MemWal 0.0.5 has **no get/update/delete primitive** — verified in-repo (`index.ts:15-17`, README "v0.2"). These need a tombstone/versioning layer that does not exist; faking them would be slop. Tag: **RISKY/UNCONFIRMED externally** — the absence is asserted by our code comments ("verified") and README; context7 has no MemWal incubation entry to independently confirm. Treat the in-repo verification as authoritative but flag it for re-confirm if MemWal bumps version.

---

## 3. The `add_memory` fix — exact wiring (BUILDABLE)

### 3a. What the MCP path has, and what it lacks

The MCP path resolves a Sui keypair (`signer.ts:44`) and builds `OneMem.create({ network, signer, memory })` (`index.ts:266-273`). The memory config (`memoryConfigFromCredentials()`, `index.ts:262-264`) carries the **MemWal** account/delegate/namespace — but NOT a OneMem `{ namespaceId, rwCapId }` trace target. That trace target is exactly what `traces.startSession`/`appendCall` require (`traces.ts:124,172-174`).

**The missing piece is a OneMem trace target — and the SDK already provisions one.** `ensureNamespace(onemem, { network, label })` (`runtime.ts:170-208`) mints a namespace + ReadWrite cap, **persists** it to `~/.onemem/<label>.<network>.json`, and returns `{ namespaceId, rwCapId, adminCapId }`. The Claude Code / Codex plugins and CLI already use this exact helper. The MCP server simply never calls it.

### 3b. Target flow for `onemem_add_memory`

On server start (in `main()`, `index.ts:266`), after creating `onemem` and **only if** a signer + network are available, resolve a trace target once and cache it:

```
const traceTarget = await ensureNamespace(onemem, { network, label: "onemem-mcp", logger });
// → { namespaceId, rwCapId } persisted to ~/.onemem/onemem-mcp.<network>.json
```

Then `onemem_add_memory` becomes (replacing `index.ts:82`):

```
const r = await onemem.requireMemory().add(text, {
  namespace,                               // MemWal namespace (unchanged)
  sessionId: mcpSession.sessionId,         // the ambient MCP attesting session
  onememNamespaceId: traceTarget.namespaceId,
  rwCapId: traceTarget.rwCapId,
});
// r.callId + r.suiTxDigest are now POPULATED (memory.ts:202-214)
```

This makes `memory.add`'s already-shipped attestation branch (`memory.ts:182-194`) fire: it calls `traces.appendCall` with `toolName: "memwal_write"`, `toolNamespace: "@onemem/sdk-ts"`, input `{ walrusBlob, hash }`, label `"memory"` — a real Merkle-chained `ActionCall`.

### 3c. The session model for an MCP server (the one design choice inside the fix)

An MCP server is a **long-lived stdio process** per client connection. Two viable shapes — pick **(B)**:

- **(A) One attesting session per `add_memory`.** Use the shipped `recordSession` one-shot (`runtime.ts:222`) so each memory is its own `open→append→close` session. Simplest; SHIPPED helper does exactly this. Cost: 3 txs per memory and a 1-call session each, which is noisy in the trace list and burns gas.
- **(B) One ambient MCP session per server lifetime (RECOMMENDED).** On first `add_memory` (lazy), `traces.startSession({ namespaceId, rwCapId, agentId: "mcp-client-<name>", environment: "mcp:<client>" })` once; cache `mcpSession.sessionId`; every subsequent `add_memory` `appendCall`s into it; `endSession` on transport close / SIGINT. This yields ONE coherent "what this MCP client did this session" trace — which is the trace-led story — and is cheaper. `environment: "mcp:cursor"` makes these legible and filterable in the dashboard/`fetchRecentSessions` by environment, consistent with the namespace-by-environment read model the dashboard thread relies on.

**Choice = (B).** It is the trace-led shape (a session = a unit of agent work), it is honest about the boundary (only OneMem-routed calls appear — that IS the location-C contract), and it costs one extra `open_session`/`close_session` per process. Each `add_memory` still chains off the previous call's `callId` as `parentCallId`, giving an ordered chain exactly like `recordSession` does (`runtime.ts:245,260`).

`search_memory`, `verify`, `trace`, `replay` do **not** append calls — they are reads. (Optionally a later version could attest `search` as a `memwal_recall` call, but that is out of scope; recall is a read, and attesting reads adds noise without strengthening the "what it DID" story.)

### 3d. Failure honesty (already half-built)

`memory.add` throws a typed `MemoryAttestationError` carrying `{ memoryId, walrusBlobId }` when the blob IS written but the on-chain append fails (`memory.ts:195-198`). The target `onemem_add_memory` catches this specifically and returns a **partial-success** payload: `{ memoryId, walrusBlobId, attested: false, reason }` rather than a hard `isError`. This keeps the tool honest in the degraded case — "memory saved, attestation pending/failed" — instead of either silently dropping the failure or losing the written blob. Tag: **BUILDABLE** (the typed error already exists; only the catch branch is new).

### 3e. Return-shape change (drop the false promise; ship the true one)

Today `index.ts:83-87` returns `{ memoryId, walrusBlobId, attestation }` where `attestation.callId`/`suiTxDigest` are `undefined`. Target returns them **populated**, plus an explicit boolean:

```
{ memoryId, walrusBlobId, attested: true,
  callId, suiTxDigest, sessionId: mcpSession.sessionId,
  verifyHint: "verify with onemem_verify_trace sessionId=<...>" }
```

The `verifyHint` closes the loop in-chat: an agent writes a memory, gets a sessionId, and can immediately call `onemem_verify_trace` on it — the headline trace-led demo, entirely inside an MCP client.

---

## 4. New tool: `onemem_session_status` (BUILDABLE)

Read-only. Returns the MCP server's own provisioning + active session so an agent/user can find and verify its writes without external context.

```
input: {}  (no args)
output: {
  network, address,                       // onemem.network, senderAddress()
  memoryEnabled: boolean,                 // !!onemem.memory
  traceTarget: { namespaceId } | null,    // from ensureNamespace (rwCapId withheld — it's a secret)
  activeSessionId: string | null,         // mcpSession.sessionId if a session is open
  environment: "mcp:<client>"
}
```

Built entirely from values already in scope (`onemem.network`, `onemem.senderAddress()`, `onemem.memory`, the cached `traceTarget`, `mcpSession`). No new SDK call. This replaces the need for the agent to "just know" its namespace and makes the surface self-describing.

---

## 5. Coexistence with claude-mem (clean separation, no overlap)

The dashboard/grounding work establishes claude-mem as **inspiration, never competitor**, and the two must coexist when a Claude Code user runs both. The MCP server's role in that coexistence:

- **OneMem owns trace EVIDENCE.** `onemem_*` tools produce on-chain `ActionCall` objects + verifiable Merkle sessions + owned (Seal-encrypted, Walrus-stored) memory. This is the "prove what the agent did / memory you own" layer.
- **claude-mem owns local conversation SUMMARIES.** Its localhost worker writes per-tool observations to local SQLite and injects conversation recall — the "alive local context" layer. It is NOT an attestation/ownership layer.
- **No tool collision.** All OneMem tools are `onemem_`-prefixed (`index.ts:67,94,…`); claude-mem exposes its own `mcp-search` toolset. An agent can call both. OneMem never tries to summarize conversations; claude-mem never tries to attest on-chain.
- **The honest pitch when both run:** "claude-mem remembers what was *said*; OneMem proves what your agent *did* and gives you memory you actually own." The MCP server is the surface that makes OneMem's half available to any MCP client claude-mem also runs in. Tag: **SHIPPED** (prefixing is in place; coexistence is a documentation/positioning fact, not new code).

---

## 6. Install / onboarding for the MCP path

The locked DX bar is **one-line install + zero manual setup** (auto-provision namespace/cap/signer). The MCP path target:

### 6a. Install (SHIPPED, per-client)
`claude mcp add onemem -- npx -y @onemem/mcp@latest` (Claude Code) and the equivalent `.mcp.json` / `~/.codex/config.toml` / `.cursor/mcp.json` blocks already documented (README; `mcp-server.md:168-225`). These are SHIPPED and verified config shapes.

### 6b. Zero-config first run (BUILDABLE — closes the DX gap)
Today the README requires the user to hand-set `ONEMEM_PRIVATE_KEY`/MemWal env. Target removes manual setup for the **trace** half:
- **Signer:** already auto-falls-back to the sui keystore (`signer.ts:44-53`). If no key exists, generate+persist a wallet (the SDK's `resolveSigner` already supports a generated wallet path, `runtime.ts:110`).
- **Trace target:** `ensureNamespace` auto-provisions + auto-funds via faucet on testnet (`runtime.ts:155-163,185`) and persists. So **trace/verify/replay/attesting-add work with zero credentials on testnet** — the agent can write an attested memory the first time, no setup.
- **Memory (MemWal) half:** still needs `ONEMEM_ACCOUNT_ID`/`ONEMEM_DELEGATE_KEY`/embedding key for vector recall. The server already degrades honestly here ("memory OFF (set MemWal env)", `index.ts:275`). Target: surface this in `onemem_session_status` and in the startup stderr line, and make the missing-memory error from `requireMemory()` point at the one-line fix.

### 6c. The honest onboarding line
"Install the MCP server; the first attested write auto-provisions your namespace on testnet — no keys to paste. Add MemWal creds when you want vector recall." Tag: signer fallback + provisioning = **SHIPPED in SDK, BUILDABLE wiring in MCP** (call `ensureNamespace` in `main()`).

---

## 7. SHIPPED / BUILDABLE / RISKY ledger

**SHIPPED (exists today, cited):**
- 7-tool stdio server, all wired to real SDK calls (`index.ts:66-257`).
- Signer resolution: env key → sui keystore (`signer.ts:44-53`).
- Full session lifecycle in SDK: `startSession`/`appendCall`/`closeCall`/`endSession` (`traces.ts:117-254`).
- `memory.add` attestation branch (fires when session+ns+cap supplied) (`memory.ts:182-214`).
- `ensureNamespace` provision+fund+persist; `recordSession` one-shot (`runtime.ts:170-208,222-289`).
- `MemoryAttestationError` typed partial-failure carrying ids (`memory.ts:195-198`).
- Real-protocol integration test harness (spawn over stdio, call tools on live testnet) (`tests/mcp.integration.test.ts`).
- Per-client install config shapes (README; `mcp-server.md:168-225`).

**BUILDABLE (constructible from the above, no new primitive):**
- Wire `add_memory` to an ambient attesting MCP session: call `ensureNamespace` once in `main()`; lazy `startSession`; pass `{ sessionId, onememNamespaceId, rwCapId }` to `memory.add`; `endSession` on close. (§3)
- Updated `add_memory` return shape with populated `callId`/`suiTxDigest`/`attested`/`verifyHint`; fix the now-true tool description. (§3e)
- Partial-success catch for `MemoryAttestationError`. (§3d)
- `onemem_session_status` read-only tool. (§4)
- Zero-config testnet onboarding (generated wallet + auto-provision). (§6b)
- Updated integration test asserting `callId`/`suiTxDigest` populated + a verify round-trip on the just-written memory's session.

**RISKY / UNCONFIRMED (must verify before claiming):**
- **MemWal get/update/delete absence** — asserted in-repo as "verified" (`index.ts:15-17`) but NOT independently confirmable via context7 (no MemWal incubation library entry). Action: re-confirm against the installed `@mysten-incubation/memwal` package surface before any doc claims "MemWal cannot do X"; safe default is to keep these tools OUT.
- **Gas cost / faucet reliability of auto-provision on first MCP call** — `ensureNamespace` triggers a faucet request + namespace mint (`runtime.ts:155,185`). On a fresh wallet this adds latency to the first `add_memory` and depends on testnet faucet uptime (`FAUCET_TIMEOUT_MS = 15_000`). Verify the first-call latency is acceptable in a live MCP client and handle faucet failure gracefully (return a clear "fund <address>" message, don't hang the tool).
- **Long-lived session close on abnormal exit** — if the stdio transport dies without SIGINT, the ambient session may never `endSession` and stays `Open`. Verify the SDK verifier treats an un-closed session as still-verifiable for the calls it contains (it should — verification walks emitted calls, `traces.ts:267`), and add a best-effort close on `transport.onclose`/process signals.

---

## 8. Dependencies on other threads

- **SDK thread:** owns `ensureNamespace`/`recordSession`/`memory.add` signatures. The fix assumes these stay stable; if the SDK refactors the trace-target shape, the MCP wiring follows. No new SDK method is requested — only consumption.
- **Dashboard thread:** the MCP server sets `environment: "mcp:<client>"` on its sessions. The dashboard's "MCP clients" section + namespace-by-environment read path (`fetchRecentSessions`) must recognize `mcp:*` environments so MCP-written sessions appear (read-only, no Pause/Trace toggle — location C is controls-free). The exact environment-string convention is a coordination point.
- **Landing/positioning thread:** must carry the location-C honest one-liner ("explicit tools only — no auto-capture/recall; writes still attested + verifiable") and the claude-mem coexistence line. The MCP server's tool descriptions are the source of truth for that copy.
- **Onboarding/hosted thread:** zero-config testnet provisioning is local-only. If a user wants their MCP-written traces on a SHARED/hosted namespace (not the auto-provisioned local one), that namespace + delegate key comes from the hosted onboarding flow — the MCP server should accept a `ONEMEM_NAMESPACE_ID`/cap override env so it writes into the shared namespace instead of auto-provisioning. Coordinate the env-var name with the hosted thread.
