# Grounding Report 05 — MCP Server + MCP-only Clients

**Thread:** mcp-and-mcp-only-clients
**Date:** 2026-06-19
**Author:** grounding subagent (read-only on product code)
**Scope:** `@onemem/mcp` server and the MCP-only client targets (Cursor, Windsurf, Cline, OpenCode, VS Code Copilot, Gemini/Antigravity). What can OneMem **actually** do in an MCP-only client, and which marketing claims are true vs false.

---

## 1. The one-paragraph truth of this surface

`@onemem/mcp` (package version **0.6.3**, `packages/mcp-server/package.json:3`) is a real, working stdio MCP server that exposes **7 tools** — `onemem_add_memory`, `onemem_search_memory`, `onemem_verify_trace`, `onemem_trace_session`, `onemem_replay_session`, `onemem_share_namespace`, `onemem_revoke_namespace_capability` (`packages/mcp-server/src/index.ts:66-257`). These are thin wrappers over `@onemem/sdk-ts`. In any MCP-only client, OneMem is an **on-demand, agent-invoked memory + on-chain-trace-reader tool**, and nothing more. There is **no automatic capture of the host runtime's native tool calls** (Read/Edit/Bash/etc.) and **no automatic recall on session start** — both require native hooks the MCP transport does not provide, and the code has no mechanism to obtain them. Worse for the Pillar-2 headline: **the MCP `add_memory` path does not even emit the per-write on-chain ActionCall attestation** that the SDK is capable of, because the server never passes the session/namespace/cap arguments. So in an MCP-only client, a memory write goes to Walrus but produces **no on-chain trace node at all**. The trace tools (`verify`/`trace`/`replay`) are read-only inspectors of sessions that must have been created **elsewhere** (a native-hook runtime, the dashboard, or a manual SDK script).

---

## 2. Exactly what each MCP tool does (file:line)

All seven are registered in `buildServer()` (`packages/mcp-server/src/index.ts:62-260`):

| Tool | Lines | Underlying SDK call | What a user gets |
|---|---|---|---|
| `onemem_add_memory` | 66-92 | `onemem.requireMemory().add(text, { namespace })` | Seal-encrypt → Walrus blob via MemWal. Returns `memoryId`, `walrusBlobId`, `attestation`. **No on-chain ActionCall emitted via this path** (see §3). |
| `onemem_search_memory` | 94-114 | `onemem.requireMemory().search(query, { namespace, topK })` | Vector recall, client-side Seal-decrypt, ranked memories. |
| `onemem_verify_trace` | 116-138 | `onemem.traces.verifySession(sessionId)` | Off-chain Merkle re-computation of an **already-existing** session. Read-only. |
| `onemem_trace_session` | 140-165 | `onemem.traces.getCalls(sessionId)` | Lists ActionCalls of an existing session. Read-only. |
| `onemem_replay_session` | 167-194 | `onemem.traces.replaySession(sessionId)` | Reconstructs session metadata + calls in order. Read-only. |
| `onemem_share_namespace` | 196-220 | `onemem.namespaces.shareReadWrite/ReadOnly(...)` | Mints + transfers a NamespaceCapability on-chain. Needs an Admin cap arg. |
| `onemem_revoke_namespace_capability` | 222-257 | `onemem.namespaces.adminRevokeCapability(...)` | Marker-revokes a cap on-chain. Needs an Admin cap arg. |

`get/update/delete_memory` are intentionally **not** exposed (header comment `index.ts:15-17`, README `packages/mcp-server/README.md:18`) — MemWal 0.0.5 has no such primitive. This is an honest omission.

Memory tools degrade gracefully: without MemWal env the server still starts and the trace/verify tools still work; memory tools report not-configured (`index.ts:275-278`, README:25-28). Confirmed honest.

---

## 3. THE CORE HONESTY PROBLEM — auto-capture and auto-recall are impossible in MCP-only clients, AND the MCP write path emits no trace

### 3a. No native hooks ⇒ no auto-capture / no auto-recall

The architecture doc states this plainly and it is **true**:

> "Auto-capture every tool call (hook into PostToolUse): … ❌ — only captures calls routed through OneMem MCP tools"
> "Auto-recall memory on every session start: … ❌ — user / agent must explicitly call `onemem_search_memory`"
> — `docs/05-our-architecture/03-runtimes/mcp-server.md:259-265`

The Cursor deep-dive is equally explicit:

> "No hooks — cannot intercept tool calls outside MCP. … only calls routed through OneMem's own MCP tools are visible."
> — `docs/03-target-runtimes/cursor-mcp-deep.md:196`
> "For native Cursor tool calls (Read/Edit/Bash) that don't route through OneMem MCP: **no capture is possible**. … the trace pillar will be incomplete on Cursor compared to Claude Code or Codex."
> — `cursor-mcp-deep.md:234`

Source confirms there is no hook surface in the MCP server: `index.ts` registers tools only; there is no PostToolUse/PreToolUse listener, and the MCP protocol itself gives the server no visibility into the host's other tools. **This is a hard protocol limit, correctly documented.**

### 3b. The MCP write path does not even attest the memory write on-chain

This is the most important and least-advertised gap. The SDK's `MemoryAPI.add()` *can* emit a verifiable on-chain ActionCall — but **only** when `sessionId`, `onememNamespaceId`, and `rwCapId` are all supplied:

```
// packages/sdk-ts/src/memory.ts:182-194
if (opts.sessionId && opts.onememNamespaceId && opts.rwCapId) {
  const emitted = await this.client.traces.appendCall({ … toolName: "memwal_write" … });
  callId = emitted.callId;
  suiTxDigest = emitted.txDigest;
}
```

The MCP server calls `add` with **only `namespace`** (`index.ts:82`):

```
const r = await onemem.requireMemory().add(text, { namespace });
```

`namespace` here is the MemWal logical namespace string — **not** `onememNamespaceId`/`rwCapId`/`sessionId`. So the attestation branch never fires. The integration test proves the live behavior: it calls `onemem_add_memory` with only `{ text }` and asserts only `walrusBlobId` is truthy — never `callId` or `suiTxDigest` (`packages/mcp-server/tests/mcp.integration.test.ts:64-69`).

**Net effect in an MCP-only client:** a memory write is stored encrypted on Walrus but leaves **no on-chain ActionCall, no trace node, no Merkle-chained attestation**. The `attestation` object returned to the agent (`index.ts:84-86`, `memory.ts:207-213`) contains a `walrusBlobId` + plaintext `inputHashHex` but `suiTxDigest`/`callId` are `undefined`. It is a content hash, not an on-chain proof.

### 3c. Consequence: in an MCP-only client the trace tools have nothing of their own to verify

`verify_trace`/`trace_session`/`replay_session` all take a pre-existing `sessionId` and read it from chain. Because the MCP server never *creates* a session or *appends* calls (3b), an MCP-only client can only inspect sessions produced by **some other** OneMem path (a native-hook plugin like Claude Code, the dashboard, or a hand-written SDK script). The integration test verifies a hard-coded **demo** session id `0x08f4ef5b…` with `callCount: 3` (`mcp.integration.test.ts:16,42`) — i.e. a pre-seeded session, not one the MCP client made.

So the end-user mental model "OneMem shows me what my agent did in Cursor" is **not deliverable through MCP**. The honest statement is "OneMem lets your agent in Cursor explicitly remember/recall, and lets it *read & verify* traces that were recorded by a hook-capable runtime."

---

## 4. Per-client honest capability line

All of these clients are MCP-only by design (no plugin SDK / hooks reachable by OneMem). Sources: `deferred-runtimes.md:40-64`, `cursor-mcp-deep.md:1-3,165`, `antigravity-deep.md:294,307`.

- **Cursor** — MCP-only (no plugin SDK; MCP is the *only* extension path, `cursor-mcp-deep.md:1-3`). OneMem = agent-invoked remember/recall + on-chain trace *reader*. No auto-capture of Cursor's Read/Edit/Bash. No auto-recall. No on-chain attestation of the memory write itself (§3b).
- **Windsurf** — same as Cursor, MCP-only (`deferred-runtimes.md:48-51`). Same capability line.
- **Cline** — MCP-only (`deferred-runtimes.md:54-56`). Same.
- **OpenCode** — MCP-only (`deferred-runtimes.md:54-56`). Same.
- **VS Code Copilot** — MCP-only (`deferred-runtimes.md:54-56`). Same.
- **Gemini CLI / Antigravity** — MCP-only at v0.1; native plugin **deferred to v0.2** because the plugin SDK is announcement-stage and `BeforeTool` hooks are broken on current builds (`antigravity-deep.md:294,307`, `deferred-runtimes.md:7-36`). Same capability line as Cursor today. The v0.2 native plugin (hooks) is the only path to auto-capture here, and it isn't built.

**Common honest line for every client in this thread:**
> "In Cursor/Windsurf/Cline/OpenCode/Copilot/Antigravity, OneMem gives your agent on-demand tools to *remember* and *recall* encrypted memories on Walrus, and to *verify/replay* on-chain traces that a hook-capable runtime recorded. It cannot silently watch what the agent does, cannot auto-recall on session start, and (today) does not attest the memory write itself on-chain from these clients."

---

## 5. Wording OneMem must STOP using for MCP-only clients

From GOAL.md and surrounding marketing, these phrasings are **false or misleading** for MCP-only clients:

1. **"every tool call, every MCP invocation, every skill execution — is captured"** (`GOAL.md:13`). FALSE for MCP-only clients — only OneMem's *own* tool calls are even visible, and even those don't emit a trace node today (§3b). Acceptable only for native-hook runtimes.
2. **"auto-capture on" / "drop-in native plugins for every coding agent runtime … Cursor, Windsurf"** (`GOAL.md:13,42`). MISLEADING — Cursor/Windsurf have **no** native plugin and **never will** (`deferred-runtimes.md:40-51`); they are MCP-only. Listing them next to "drop-in native plugins" implies parity that does not exist.
3. **"see everything any of your agents remembered and did, across every runtime"** (`GOAL.md:103`). FALSE for the MCP-only set — "did" (trace) is not captured in these runtimes at all.
4. Any "1-line install = full trace" implication. The 1-line MCP install is real (`README.md:33`, `cursor-mcp-deep.md:209-211`) but it buys **on-demand memory tools + a trace reader**, not trace capture.

## 6. Wording OneMem SHOULD use

- "**Native-hook runtimes** (Claude Code; Codex via the plugin's optional trusted hooks): automatic capture + recall."
- "**MCP runtimes** (Cursor, Windsurf, Cline, OpenCode, Copilot, Antigravity-today): agent-invoked memory + on-chain trace **inspection**. Capture is explicit, not automatic."
- For the trace pillar specifically: "Trace capture requires a hook-capable runtime. In MCP-only clients you can **verify and replay** traces, and your agent can explicitly remember/recall — but OneMem does not silently record the client's native tool calls."
- **Fix the code-truth gap too:** either (a) wire `add_memory` to create/append a session so MCP writes *do* attest on-chain (then "every memory write is attested" becomes true for MCP clients), or (b) stop claiming on-chain attestation for the MCP memory path. Right now the README line "returns blob id + attestation" (`README.md:10`) overstates: the attestation has no `suiTxDigest` in the MCP path.

---

## 7. Verdicts on Codex-audit claims in my area

Codex artifact touching this surface: `.thoughts/research/2026-06-18-onemem-product-code-audit.md`.

- **"The MCP server exposes memory-first tools: add memory, search memory, share namespace, revoke namespace capability, plus trace/proof inspection." (audit:54)** — **CONFIRMED.** Matches `index.ts:66-257` exactly (7 tools). Audit's tool list at `:86-92` is accurate.
- **"Trace sessions and Merkle verification are implemented, but … they prove integrity of the recorded sequence, not that the agent honestly recorded all real-world activity." (audit:56)** — **CONFIRMED.** The proof is Merkle integrity only (`index.ts:116-138`, `traces.verifySession`). The "honestly recorded all activity" caveat is exactly the MCP-only auto-capture gap (§3a). Codex stated the boundary correctly.
- **"Cursor / Windsurf / OpenCode / Cline / VS Code Copilot / Antigravity / Claude Code and Codex when used through MCP" are MCP-compatible targets (audit:103-112)** — **CONFIRMED** as the target list, matching `deferred-runtimes.md`. (Note: Codex is now positioned as *not* MCP-only because its plugin bundles optional hooks — `mcp-server.md:266-269` — but that's a Codex-plugin detail outside this thread's MCP-only set.)
- **Implicit Codex framing that MCP gives a working memory+trace surface** — **CONFIRMED for memory + trace-reading; UNCERTAIN/INCOMPLETE for trace-*writing*.** The audit does NOT flag that the MCP `add_memory` path skips the on-chain ActionCall attestation (§3b). That gap is **not in the Codex audit** and is my single most important new finding. Mark as **UNCERTAIN in Codex (not addressed); REFUTED by me as "MCP write is attested on-chain."**

No Codex claim in my area was outright REFUTED; the one material miss is an omission, not an error.

---

## 8. Single most important correction

**Stop implying MCP-only clients deliver Pillar 2 (trace + replay of what the agent did). They do not — and cannot, by MCP protocol.** Two concrete truths the marketing must absorb:

1. In Cursor/Windsurf/Cline/OpenCode/Copilot/Antigravity, OneMem captures **nothing automatically** — not the host's tool calls, not on session start. It is an on-demand memory tool + a read-only trace verifier.
2. Even the memory *write* through MCP currently emits **no on-chain ActionCall** (`index.ts:82` never passes session/cap to `memory.ts:182`), so the "every memory write is an attested on-chain trace node" claim is false for these clients today. Fix the wiring or fix the claim.

The honest headline for this entire client set: **"Your agent can remember, recall, and verify — on demand. Automatic trace capture requires a hook-capable runtime (Claude Code / Codex-with-hooks)."**
