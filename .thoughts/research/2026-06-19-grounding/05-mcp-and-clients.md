# Grounding Thread 05 — MCP Server + MCP-only Clients (Execution Location C)

**Date:** 2026-06-19
**Thread:** mcp-and-clients
**Scope:** `@onemem/mcp` server + MCP-only clients — Cursor, Windsurf, Cline, OpenCode, Antigravity (Gemini). Read-only audit of source.
**Lens:** EXECUTION LOCATION determines PRODUCT SURFACE. These clients run **locally** (location C) but are **explicit-tools-only**: they can ONLY do OneMem work the agent deliberately routes through an MCP tool call. No native hooks, so no automatic capture or recall.

---

## 1. Truth of this surface (one paragraph)

The OneMem MCP server is a real, working **stdio** server (`packages/mcp-server/src/index.ts`) that exposes **7 prefixed tools** to any MCP client. It is the only OneMem integration path for Cursor/Windsurf/Cline/OpenCode/Antigravity because none of those clients has a hook lifecycle (`cursor-mcp-deep.md:165,196`; `antigravity-deep.md:294`). The decisive consequence — verified in source, not assumed — is that on these clients **OneMem captures nothing automatically**: it sees only the calls an agent explicitly makes to a OneMem tool. It cannot see the client's native Read/Edit/Bash/model calls. Worse, in the **current** code path it can't even *start a trace* from the MCP surface: there is no `start trace` tool, and `onemem_add_memory` does not emit an ActionCall unless `sessionId + onememNamespaceId + rwCapId` are passed (`memory.ts:182`), which the MCP tool never supplies (`index.ts:80-92`). So on MCP-only clients the live capabilities are **add memory, search memory, and read/verify/replay/share of traces that something ELSE (a native plugin) created**. The headline Pillar 2 (capture → trace → replay) is therefore **read-only** on these clients. None of these clients appears in the local dashboard's runtime catalog at all (`runtimes.ts:24-90` has no cursor/windsurf/cline/opencode/antigravity entry) — yet that same catalog DOES list framework adapters as `coverage: "enforced"`, which is the inverted-honesty bug the parent study is chasing.

---

## 2. What the 7 MCP tools actually do (verified, `index.ts`)

The server registers exactly these 7 tools (`index.ts:66-257`; README table `README.md:8-17`):

| Tool | SDK call | Works on MCP-only client? | Honest note |
|---|---|---|---|
| `onemem_add_memory` | `onemem.requireMemory().add(text, {namespace})` (`index.ts:82`) | yes, if MemWal env set | **Explicit only.** Writes a memory. Does NOT emit a trace ActionCall here — see §3. |
| `onemem_search_memory` | `onemem.requireMemory().search(query, …)` (`index.ts:108`) | yes, if MemWal env set | **Explicit only.** Agent/user must deliberately call it. No auto-recall. |
| `onemem_verify_trace` | `onemem.traces.verifySession(id)` (`index.ts:126`) | yes, read-only | Walks Merkle chain of an *existing* session. Works without MemWal env. |
| `onemem_trace_session` | `onemem.traces.getCalls(id)` (`index.ts:150`) | yes, read-only | **Lists** calls in an existing session. NOT a "start a trace" verb. |
| `onemem_replay_session` | `onemem.traces.replaySession(id)` (`index.ts:177`) | yes, read-only | Reconstructs an existing session from chain. Plaintext stays Seal-encrypted. |
| `onemem_share_namespace` | `namespaces.shareReadOnly/ReadWrite` (`index.ts:211-214`) | yes, if holder has Admin cap | Mints + transfers a Sui capability. On-chain write. |
| `onemem_revoke_namespace_capability` | `namespaces.adminRevokeCapability` (`index.ts:241`) | yes, if holder has Admin cap | Admin marker-revoke; object remains, gates reject it. |

**`get/update/delete_memory` are NOT exposed** — MemWal 0.0.5 has no such primitive (`index.ts:14-17`, `README.md:18`). This is honest and correctly scoped.

The integration test (`tests/mcp.integration.test.ts:29-46`) confirms the live tool list and that `onemem_verify_trace` returns `ok:true, callCount:3` against a real testnet session. The add→search round-trip is gated behind MemWal env (`:48-80`).

### Capability verdict per the owner's checklist (add/search/trace/verify/replay/share)
- **add** works — explicit write, no trace side-effect (§3).
- **search** works — explicit recall, no auto-recall.
- **trace** READ-only (`onemem_trace_session` lists; there is no *create-trace* tool).
- **verify** works fully, even with memory OFF.
- **replay** works fully, read-only, Seal-gated plaintext.
- **share / revoke** work on-chain, require Admin cap.

---

## 3. The decisive finding: MCP-only clients cannot capture a trace at all

The GOAL doc (`GOAL.md:33`) says "every MCP invocation … captured as a node in a TraceSession tree." On MCP-only clients **this does not happen**, for two independent reasons proven in source:

1. **No native hooks → no interception of the client's own tool calls.** Cursor: "No hook lifecycle… Cursor's only programmatic touchpoint … is *inside the MCP server itself*" (`cursor-mcp-deep.md:165`); "For native Cursor tool calls (Read/Edit/Bash) that don't route through OneMem MCP: **no capture is possible**" (`cursor-mcp-deep.md:234`). Antigravity: hook path is deferred and buggy (`antigravity-deep.md:294,307`; `deferred-runtimes.md:7-9`).

2. **The OneMem MCP tools themselves emit no trace.** `onemem_add_memory` calls `add(text, {namespace})` with no session args (`index.ts:82`). `Memory.add` only appends an ActionCall when `opts.sessionId && opts.onememNamespaceId && opts.rwCapId` are all present (`memory.ts:182-185`) — the MCP tool supplies none of them. There is no `start_session`/`record_call` tool registered (`index.ts:66-257`). So even the *deliberate* OneMem calls an agent makes on Cursor produce a memory blob but **no trace node**.

**Consequence for Pillar 2 (the headline):** on Cursor/Windsurf/Cline/OpenCode/Antigravity, OneMem is a memory tool (add/search) + a *trace reader/verifier/replayer* for sessions that a **native plugin elsewhere** (Claude Code, Codex, OpenClaw, Hermes) created. The trace tree these clients can *show* is never one they *produced*. This must be said plainly in product copy. The README runtime matrix is honest about session creation being lazy/explicit (`03-runtimes/README.md:68,71-73`: "first add_memory MCP call lazily creates a session" / "explicit MCP tool"), but note even that "lazy session" claim is **not borne out by the MCP `add_memory` code path** — flag as a doc-vs-source gap.

---

## 4. How the dashboard currently (mis)represents these clients

### 4a. MCP-only clients are INVISIBLE in the local dashboard
`KNOWN_RUNTIMES` (`runtimes.ts:24-90`) lists: claude-code, codex, openclaw, hermes, crewai, livekit, elevenlabs, vercel-ai, openai-agents. **No cursor, windsurf, cline, opencode, or antigravity.** So a Cursor user who installed `@onemem/mcp` and ran `search_memory` sees *nothing labelled Cursor* on `/apps`. If a session's `environment`/`agentId` happens to surface, it falls through to `unknownMetadata` (`runtimes.ts:123-131`) → generic "cube" icon, raw id as name, `coverage:"stored"`. There is no first-class, honest row for "MCP client: explicit tools only."

### 4b. Every catalog row is mislabelled as a capture-policy control
`/apps` renders each runtime with a **"Trace capture" toggle** and a "Tracing/Trace off/Paused" badge (`AppsView.tsx:16-20,156-182`) plus pause control, and the page subtitle is "Runtime trace **policy** … from your local OneMem setup" (`AppsView.tsx:91`). For an MCP-only client this control is **meaningless** — there is no capture to toggle; capture is impossible. Presenting a "Trace capture: Enforced" affordance for a surface that cannot capture is exactly the dishonesty the study targets. (The Codex taxonomy-reset artifact flags the same flattening, `2026-06-19-integration-taxonomy-reset.md:34-56,98-111`.)

### 4c. `coverage:"enforced"` is applied uniformly and wrongly
All 9 catalog rows carry `coverage:"enforced"` (`runtimes.ts:32,39,46,53,60,67,74,81,88`), including framework adapters (crewai/livekit/elevenlabs/vercel-ai/openai-agents). "Enforced" implies guaranteed automatic capture. That is false for framework adapters (capture only when app code wraps OneMem) and would be false for MCP clients too (capture impossible). The taxonomy-reset artifact recommends replacing `enforced/stored` with a capability matrix (`…taxonomy-reset.md:138-151`) — I concur.

---

## 5. Owner's open questions — my answers (grounded)

### Q1. What is the LOCAL dashboard FOR vs the HOSTED dashboard FOR?
- **LOCAL** (`localhost:4040`): *"Inspect MY OWN agents' memory and traces on MY OWN machine — the things my locally-running agents (Claude Code, Codex, OpenClaw, Hermes) remembered and did — and verify/replay/share them, no login."* (`purpose-local-vs-hosted.md:11-58`.) For **execution-location C clients specifically**, the local dashboard's only honest job is to be the place where the *agent inside Cursor* points its `verify`/`replay` tool output, not a "connected app" monitor.
- **HOSTED** (`app.onemem.xyz`): *"Onboard, pair the CLI, share namespaces, and let anyone publicly verify a session — for people NOT on the installed machine."* (`purpose-local-vs-hosted.md:61-110`.)
- **Why both:** verifiable/cross-runtime/shareable each has a non-owner implication that a single-machine local view can't serve (`purpose-local-vs-hosted.md:87-93`). This split is sound. The problem is not the split; it's that the **local `/apps` surface is showing the wrong inhabitants** (framework adapters yes, MCP clients no).

### Q2. Do MCP-only clients belong in the LOCAL dashboard, and HOW?
**Yes — but ONLY as a clearly-labelled, non-policy "MCP clients" section, never with a "Trace capture" toggle.** These genuinely run on the user's machine (location C), so a local row is correct in principle. But the row must say **"Explicit tools only — no automatic capture or recall"**, must have **no capture toggle and no pause toggle** (there is nothing to pause), and should at most show "last explicit tool call seen." They are the *inverse* of framework adapters: MCP clients are local-but-explicit; framework adapters are remote-but-emit-on-deploy. Both are currently mislabelled, in opposite directions, by the same `KNOWN_RUNTIMES` flattening.

### Q3. How do you query an adapter's / client's traces? Read model = namespace/environment, not "connected local app"?
**Confirmed: reads are by environment/namespace, not by a live local connection.** `fetchRuntimeInventory` derives every row by scanning recent on-chain sessions and **grouping by `session.environment || session.agentId`** (`runtimes.ts:166-173`). The runtime "rows" are *projections of chain events keyed by environment string* merged with a static catalog — there is no socket/heartbeat that proves an app is "connected." So the read model is already namespace/environment-based; the UI just *dresses it up* as a connected-apps monitor with live policy toggles, which is the lie. For MCP clients, the same holds: a Cursor-emitted memory write would show up only as an `environment` value on a session, queried from chain — exactly as the taxonomy artifact says ("activity only after traces exist", `…taxonomy-reset.md:49-54`).

---

## 6. Codex artifact verdicts (with file:line evidence)

Source: `.thoughts/research/2026-06-19-integration-taxonomy-reset.md` (the cloud-framework-adapters-audit output file is sandbox-permission-blocked; its claims relevant to my area are mirrored in the taxonomy artifact lines 49-54).

| Codex claim | Verdict | Evidence |
|---|---|---|
| Cursor/Windsurf/Cline/OpenCode are MCP-tools-only; no auto-capture (`…taxonomy:45-46`) | **CONFIRMED** | `cursor-mcp-deep.md:165,196,234`; `deferred-runtimes.md:40-56`; `index.ts:80-92` (no session args). |
| "Do not claim Cursor/Windsurf/Cline/OpenCode automatic trace capture" (`…taxonomy:181`) | **CONFIRMED** | Same as above; capture is structurally impossible without hooks. |
| `KNOWN_RUNTIMES` over-flattens hosts + adapters into one `coverage:"enforced"` list (`…taxonomy:34-37`) | **CONFIRMED** | `runtimes.ts:24-90` — single list, all `coverage:"enforced"`. |
| `/apps` presents local runtime *policy controls* that mislead (`…taxonomy:34-36`) | **CONFIRMED** | `AppsView.tsx:91` ("trace policy"), `:156-182` (capture toggle), `:145-153` (pause). |
| Reads should be keyed by environment, activity only after traces exist (`…taxonomy:49-54`) | **CONFIRMED** | `runtimes.ts:166-173` groups by `environment`/`agentId`. |
| Replace `enforced/stored` with a capability matrix incl. `mcp-tools-only` (`…taxonomy:138-151`) | **CONFIRMED + ENDORSED** | Matches source reality; `mcp-tools-only` is the exact honest label for §2. |
| Rename visible `Apps` → `Integrations`, keep `/apps` route (`…taxonomy:98-102,156`) | **CONFIRMED as reasonable** | Lower-priority than removing the false capture toggle; cosmetic vs. the honesty bug. |
| **OVERREACH check:** Codex frames MCP clients as belonging in the (relabelled) Integrations list alongside everything else | **OVERREACHED (mild)** | Codex's taxonomy table (`:45-46`) lists MCP clients but its remediation never says the **capture/pause toggles must be REMOVED for them** — it stops at relabelling sections. The product fix is not a new *section label*; it is **removing the policy affordance** that doesn't apply. A section rename without killing the toggle still ships the lie. |
| Codex MISS the parent study already noted (framework adapters in local at all) | **CONFIRMED MISS** | Codex keeps framework adapters in a local "Available adapters" section (`…taxonomy:108,159-160`) rather than asking whether they belong in the *local* dashboard at all. For my thread this matters because MCP clients are the *only* group that legitimately stays local — adapters arguably should move hosted. |

---

## 7. The single most important correction (concrete UI/product change)

**On the LOCAL `/apps` (Integrations) page, MCP-only clients must render as a separate, read-only "MCP clients" group with NO "Trace capture" toggle, NO pause toggle, and a fixed badge reading "Explicit tools only — no auto-capture/recall." Concretely: add an integration *kind* to the catalog (`runtimes.ts`), set MCP clients to a `kind:"mcp-client"` / capability `mcp-tools-only`, and in `AppsView.tsx` branch so `kind:"mcp-client"` rows DROP the `traceBadge` "Tracing/Enforced" affordance and the capture/pause buttons entirely, replacing them with a static descriptor.** This is the minimal change that stops the dashboard asserting a capture policy for a surface that cannot capture.

### Exact wording to STOP using (for MCP-only clients)
- STOP: "Trace capture: Enforced" / the "Tracing" badge (`AppsView.tsx:16-20,178`)
- STOP: "Runtime trace policy" as the framing for these rows (`AppsView.tsx:91`)
- STOP: any "auto-capture", "captures every tool call", "captures every MCP invocation" (the `GOAL.md:33` phrasing) when describing Cursor/Windsurf/Cline/OpenCode/Antigravity
- STOP: "Connected app" implying a live local link (the read is chain/environment-based, `runtimes.ts:166-173`)

### Exact wording to START using
- USE: "MCP client — explicit tools only. No automatic capture or recall."
- USE: "OneMem tools available: add memory, search memory, verify / list / replay trace, share / revoke namespace."
- USE: "Traces shown here were captured by a native plugin (Claude Code / Codex / OpenClaw / Hermes); MCP clients read and verify them, they don't create them."
- USE: for the catalog tier — `mcp-tools-only` (per `…taxonomy:144`).

### Secondary corrections (lower priority, still product not docs)
1. Add first-class catalog rows for cursor/windsurf/cline/opencode/antigravity so MCP users aren't invisible or rendered as anonymous "cube" unknowns (`runtimes.ts:123-131`).
2. Replace uniform `coverage:"enforced"` (`runtimes.ts`) with the capability matrix; MCP clients = `mcp-tools-only`, framework adapters = `framework-adapter`, native hosts = `native-hooks`/`trusted-hooks-required`.
3. Consider exposing a real `start_trace`/`record_call` MCP tool (or wiring `add_memory` to lazily open a session per `03-runtimes/README.md:68`) IF agent-initiated traces from MCP clients are in scope — otherwise drop the `GOAL.md:33` "every MCP invocation captured" claim for these clients. Today neither exists in source (`index.ts`, `memory.ts:182`).

---

## 8. Appendix — files read
- `docs/00-goal/GOAL.md` (north star; Pillar 2 capture claim at :33)
- `packages/mcp-server/README.md`, `src/index.ts`, `src/signer.ts`, `tests/mcp.integration.test.ts`
- `docs/05-our-architecture/03-runtimes/mcp-server.md`, `deferred-runtimes.md`, `README.md` (matrix lines 68-73)
- `docs/03-target-runtimes/cursor-mcp-deep.md`, `antigravity-deep.md`
- `packages/dashboard/lib/runtimes.ts`, `lib/runtimes.test.ts`, `app/apps/AppsView.tsx`
- `docs/05-our-architecture/06-dashboard/purpose-local-vs-hosted.md`
- `packages/sdk-ts/src/memory.ts` (`:182` trace-emit gate)
- `.thoughts/research/2026-06-19-integration-taxonomy-reset.md`
- (blocked: `…/onemem-cloud-framework-adapters-audit.md` — permission denied; covered via taxonomy mirror)
