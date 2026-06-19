# Target Architecture — Thread 01: Local Dashboard (`packages/dashboard`, local mode)

**Date:** 2026-06-19
**Thread:** local-dashboard
**Scope:** the LOCAL surface served at `localhost:4040` (location-A runtimes only). Hosted (`app.onemem.xyz`) namespace-scoped trace view and `/verify/[id]` are OTHER threads; this doc only touches what the local binary serves and the shared `lib/*` read code it depends on.
**Governing principle:** execution location determines product surface. Local chrome shows ONLY agents that physically run on this machine and actually read the local controls file.

Tag legend: **SHIPPED** (exists, file:line) · **BUILDABLE** (constructible from confirmed primitives) · **RISKY** (must verify).

---

## 0. One-paragraph target

The local dashboard becomes a **trace-led inspector for the agents running on THIS laptop**. The headline (`/trace/[id]` — verify chain turns the page chartreuse "Verified ✓") is promoted to a first-class **Trace / Sessions** entry in the sidebar so it is reachable in one click, and the Overview hero leads with that trace-and-verify story instead of a memory/runtime count. The `/apps` page is split into honest sections: **Local runtimes** (Claude Code with `native-hooks`; Codex with `trusted-hooks-required`; OpenClaw/Hermes as runtime providers; Cursor/Windsurf as `hook-port-pending`) and a controls-FREE **MCP clients** catalog (Cline / OpenCode-style clients) badged "explicit tools only — no automatic capture." Only rows whose code actually reads `~/.onemem/runtime-controls.json` render pause/trace toggles. Cursor/Windsurf stay read-only until OneMem ports and proves claude-mem's hook installers. The five framework adapters (Vercel AI, OpenAI Agents, CrewAI, LiveKit, ElevenLabs) are DELETED from the local runtime list; they have no honest local control surface and move to the hosted namespace view (other thread). The dashboard fills live by consuming the LOCAL WORKER's SSE feed (`/stream`, coordinate with local-worker thread) instead of a 5s chain poll. Four concrete correctness/honesty fixes land first: BUG-1 (event package id), BUG-2 (`127.0.0.1` bind), the fake "Verifiable" card, and removal of the 5 framework cards.

---

## 1. Corrected navigation / IA

### 1a. Target sidebar (`components/AppShell.tsx:15-21`, the `NAV` array)

| Order | Key | Label | Href | Icon | Change |
|---|---|---|---|---|---|
| 1 | overview | Overview | `/` | overview | KEEP (re-hero, §3) |
| 2 | **trace** | **Trace** | `/sessions` | **trace** | **NEW top-level entry — the headline must be in the rail** |
| 3 | memories | Memories | `/memories` | memory | KEEP |
| 4 | runtimes | Runtimes | `/apps` | apps | RELABEL "Apps" → "Runtimes" |
| 5 | share | Share | `/share` | share | KEEP (hosted-only; hidden in local mode — §6) |
| — | settings | Settings | `/settings` | settings | KEEP (footer) |

**Why a "Trace" entry, not just "Sessions":** today `/sessions` exists but is named "Sessions" and the actual demo moment is `/trace/[id]`, which is **only reachable by clicking a session row** — there is no rail entry that says "trace." The fix is to make the rail entry **Trace** and point it at `/sessions` (the list of trace sessions), so the headline surface is one click from anywhere. `/sessions` already renders day-grouped TraceSession rows that each link to `/trace/[id]` (`SessionsView.tsx:110-124,150-163`) — **SHIPPED**, only the label/route-in-rail is missing.

**Change — `AppShell.tsx:15-21`:** insert `{ key: "trace", label: "Trace", href: "/sessions", icon: "trace" }` after `overview`, and rename `apps` → `{ key: "runtimes", label: "Runtimes", href: "/apps", icon: "apps" }`. The `activeKey` matcher (`AppShell.tsx:56-58`) already does `pathname.startsWith(n.href)`, so `/sessions` and (via the trace href) `/trace/...` need a small tweak: add `/trace` to the trace entry's active match. **BUILDABLE** (one-line predicate change).

**`Icon` name `trace` — SHIPPED** (already used on Overview `app/page.tsx:54` and in nav references), so no new asset.

### 1b. Target route map (local mode)

| Route | Purpose | Status |
|---|---|---|
| `/` | Overview — trace-led hero + recent sessions + environments-seen | SHIPPED, re-hero |
| `/sessions` | **Trace** list (day-grouped TraceSessions) — rail headline | SHIPPED |
| `/trace/[session_id]` | THE demo moment: tree + gantt + Verify drawer | SHIPPED, polished |
| `/memories` | Owned-memory inventory (on-chain `memwal_write` refs) | SHIPPED |
| `/apps` → **Runtimes** | Local runtimes (real controls) + MCP clients (controls-free) | REBUILD §4 |
| `/settings` | Local config (delete dishonest copy §5) | SHIPPED, trim |
| `/share` | Hosted-only — hidden in local mode | gate §6 |

No new routes are introduced in local mode. The hosted namespace trace view is a different package/thread.

---

## 2. BUG fixes (land FIRST — without these the page is empty or unsafe)

### BUG-1 — event package id (CONFIRMED critical) — **BUILDABLE**

**Root cause (verified):** testnet was upgraded, so `packageId (0xc2e8…) ≠ originalPackageId (0x64c1…)` (`sdk-ts/src/generated/addresses.ts:31-32`, both present). Move events are emitted under the ORIGINAL package id, but the dashboard list-read code queries `addr.packageId` (the upgraded id):
- `lib/trace.ts:33` — `client()` returns `packageId: addr.packageId`.
- `lib/trace.ts:200` — `fetchRecentSessions` queries `${packageId}::${SESSION_OPENED}` with the upgraded id → **0 results**.
- `lib/memory.ts:64` — `fetchMemories` queries `${addr.packageId}::${ACTION_CALL_EMITTED}` → **0 results**.

The CLI already does this correctly: `cli-ts/src/util/sui.ts:23` exposes `eventPackageId: addresses.originalPackageId || addresses.packageId`. `/trace/[id]` survives because `fetchSession` re-derives the package id from the object type string (`lib/trace.ts:94` `traceSessionPackageId`) — so per-session reads work while every LIST path returns empty.

**Fix:** add an `eventPackageId` helper in `lib/trace.ts` and use it for ALL `queryEvents` MoveEventType filters.
- `lib/trace.ts:29-35` — change `client()` to also return `eventPackageId: addr.originalPackageId || addr.packageId`.
- `lib/trace.ts:199-203` — `fetchRecentSessions` queries with `eventPackageId`.
- `lib/trace.ts:101-104` — note: `fetchCalls` uses `meta.packageId || packageId` where `meta.packageId` comes from the object type (already original) — keep, but pass `eventPackageId` as the fallback instead of the upgraded `packageId` so a missing type still resolves correctly. `verifyTraceChain` is the SDK verifier; confirm it internally uses the original id (SDK `traces.ts:287` already does per synthesis §5a) — **RISKY (low):** verify `verifyTraceChain(rpc, packageId, …)` is passed the right id; if it needs the event id, pass `eventPackageId`.
- `lib/memory.ts:57-68` — replace `addr.packageId` with `addr.originalPackageId || addr.packageId`.

**Test:** unit test in `lib/trace.test`/`lib/sessions.test` (both SHIPPED) asserting the query type string starts with `0x64c1…`. Manual: `/`, `/sessions`, `/memories` show rows on testnet.

### BUG-2 — local dashboard binds `0.0.0.0` (privacy) — **BUILDABLE**

`bin/onemem-dashboard:26` sets `HOSTNAME: "0.0.0.0"`, exposing local credentials/memory inventory to the entire LAN. Local mode must bind loopback.

**Fix — `bin/onemem-dashboard:25-26`:** `HOSTNAME: process.env.ONEMEM_BIND ?? "127.0.0.1"`. Keep an env override (`ONEMEM_BIND`) so the same binary can serve hosted on `0.0.0.0` when explicitly configured. **BUILDABLE** (one-line + env switch). Add a note to `local-deploy.md`.

---

## 3. Overview (`/`) — trace-led hero

### 3a. DELETE the fake "Verifiable" stat card — **BUILDABLE**

`app/page.tsx:68-77` re-prints `sessions.length` in verify-chartreuse under a "Verifiable" label — implying every session is verified before anyone clicks Verify. This is the exact dishonesty. **Verify is a chain walk that runs on demand in the drawer** (`TraceView.tsx:172-179`, `VerifyDrawer`); nothing on Overview has verified anything.

**Fix:** replace the "Verifiable" card with an honest **"Actions captured"** card: count = sum of `callCount` across recent sessions (already derivable; or a neutral "Anchored on-chain" tag in ink, NOT chartreuse). Chartreuse `#D4FF5E` is brand-reserved for Verify affordances ONLY (`packages/dashboard/CLAUDE.md` non-negotiables) — so removing it here is also a brand-compliance fix. **BUILDABLE.**

### 3b. Re-label "Connected runtimes" → "Environments seen" — **BUILDABLE**

`app/page.tsx:128-131` panel "Connected runtimes" is misleading: the list is derived from `session.environment` on-chain events (`app/page.tsx:28-33`), NOT from any machine connection. Rename to **"Environments in this namespace"** and the sub to "distinct `environment` values on-chain." Same data, honest label.

### 3c. Trace-led hero copy — **BUILDABLE**

`app/page.tsx:39-43`: keep the H1 "Overview" but make the recent-sessions panel the visual hero and add a one-line lede: *"See and verify exactly what your agent did — every tool call, Merkle-chained on `{NETWORK}`."* The session rows (`app/page.tsx:109-124`) already deep-link to `/trace/[id]` — **SHIPPED**. Remove the unconditional green `checkCircle` per row (`app/page.tsx:113-115`) which, like the Verifiable card, implies pre-verification; replace with a neutral chevron / "open trace" affordance.

### 3d. "Add runtime" CTA — keep, re-target to `/apps` Runtimes (`app/page.tsx:45-48`). SHIPPED.

---

## 4. `/apps` → **Runtimes** — the structural rebuild

This is the root-disease fix. Today `lib/runtimes.ts:24-90` hardcodes NINE runtimes in one flat `KNOWN_RUNTIMES` list, all `coverage: "enforced"`, and `AppsView.tsx:108-191` renders every one with a Pause toggle, Trace toggle, "Enforced" badge, and live status — including five frameworks whose code never runs on this laptop and never reads the local controls file.

**Confirmed ground truth:** only `plugin-claude-code/scripts/onemem-lib.mjs:152-159` and `plugin-codex/scripts/onemem-lib.mjs` read `~/.onemem/runtime-controls.json` (`traceCaptureEnabled`). The dashboard's toggle writes that file via `setRuntimeControl` (`lib/runtimes.ts:199-207`). So **only Claude Code and Codex have a control surface that does anything.** Every other card's Pause is a provable no-op.

### 4a. Target data model — `lib/runtimes.ts`

Replace the flat list + single `coverage` enum with a **typed capability tier** and a **controllable** flag.

```
type RuntimeTier =
  | "native-hooks"            // Claude Code — hooks fire automatically
  | "trusted-hooks-required"  // Codex — one-time /hooks trust, codex exec does not capture
  | "runtime-provider"        // OpenClaw/Hermes style runtime provider
  | "hook-port-pending"       // Cursor/Windsurf — ClaudeMem proves hooks; OneMem port pending
  | "mcp-tools-only"          // Cline/OpenCode-style clients — explicit tool calls only
  | "deployed-adapter"        // unknown/off-machine environments; read-only here
  ;

interface RuntimeMetadata {
  id; name; icon; installCommand;
  tier: RuntimeTier;
  controllable: boolean;   // true ⇒ render real Pause/Trace toggles (reads controls file)
  group: "local-runtime" | "mcp-client";
}
```

**LOCAL_RUNTIMES (group `local-runtime`, `controllable: true`):**
| id | name | tier | install (confirmed shipped string) |
|---|---|---|---|
| `claude-code` | Claude Code | `native-hooks` | `claude plugin marketplace add … && claude plugin install onemem@onemem` (`runtimes.ts:29-31`) |
| `codex` | Codex | `trusted-hooks-required` | `codex plugin marketplace add … && codex plugin add onemem-codex@onemem` (`runtimes.ts:37-39`) |

(OpenClaw / Hermes: keep ONLY if a local plugin reads the controls file; per synthesis they are local-or-namespace. **RISKY/UNCONFIRMED** — do NOT show a controllable card for them until a local controls reader is confirmed. Default: omit from the controllable list; they still surface in `/sessions` by environment. Flag to Abu.)

**HOOK_PORT_PENDING (local, `controllable: false`):** Cursor and Windsurf. Static catalog rows with install copy that points to porting ClaudeMem's `cursor-hooks/`, `CursorHooksInstaller.ts`, and `WindsurfHooksInstaller.ts`. Fixed badge: **"Hook port pending."** No Pause, no Trace toggle until OneMem implements and proves the ports.

**MCP_CLIENTS (group `mcp-client`, `controllable: false`):** Cline, OpenCode, and similar clients until native hooks are proven. Static catalog rows. Fixed badge: **"Explicit tools only — no automatic capture or recall."** No Pause, no Trace toggle, no live dot. Install = the per-client MCP config snippet (BUILDABLE; copy from `mcp-server` README — **RISKY (low):** confirm exact MCP config string per client before shipping copy).

**DELETE entirely from `KNOWN_RUNTIMES` (`runtimes.ts:55-89`):** `crewai`, `livekit`, `elevenlabs`, `vercel-ai`, `openai-agents`. Their traces still appear in `/sessions` + `/trace/[id]` automatically by `environment` (read path `lib/trace.ts:197-217` is environment-agnostic — SHIPPED), so **zero read capability is lost.** Adapter PACKAGES keep shipping.

### 4b. `fetchRuntimeInventory` — derived, not hardcoded — **BUILDABLE**

`lib/runtimes.ts:160-197` already merges three id sources (KNOWN + on-chain environments + controls keys). Target behavior:
- **Local-runtime cards:** ALWAYS show the 2 known local runtimes (so the user has an install target even before first session), enriched with session counts/last-seen from on-chain environments and live status from the controls file.
- **MCP-client cards:** ALWAYS show the static catalog (no enrichment needed).
- **Unknown on-chain environments** (`unknownMetadata`, `runtimes.ts:123-131`): render in a third **"Other environments seen"** read-only strip (count + last-seen, no controls) — this is where a Vercel/CrewAI trace written from a deployed app shows up locally WITHOUT pretending it's a local app. **BUILDABLE.**

### 4c. `AppsView.tsx` rebuild — **BUILDABLE**

- Page title "Apps" → **"Runtimes"** (`AppsView.tsx:89`); sub: *"Trace policy for agents on this machine, plus MCP clients and other environments seen."* (drop "from your local OneMem setup" framing — `AppsView.tsx:91`).
- Render in three sections: **Local runtimes** (controllable cards), **MCP clients** (controls-free), **Other environments seen** (read-only).
- Pause/Trace toggles (`AppsView.tsx:145-182`) render ONLY when `row.controllable`. The PATCH path (`AppsView.tsx:37-83` → `/api/runtimes/[id]`) stays for controllable rows — it writes the real controls file the plugins read. **SHIPPED control path, gated by `controllable`.**
- Replace `coverageLabel` "Enforced/Stored" (`AppsView.tsx:12-14`) with the tier label: "Native hooks" / "Requires `/hooks` trust" / "Explicit tools only." For Codex add helper text: *"requires a one-time `/hooks` trust; `codex exec` does not capture"* (grounded: synthesis §04, `04-codex-runtime.md:32-33`).
- `runtimes.test.ts` (SHIPPED) updates: assert framework ids are ABSENT, assert MCP rows have `controllable: false`, assert toggles only render for controllable rows.

### 4d. Honest empty states — **BUILDABLE**
- No local runtime installed yet: card shows the install command + "Run a session to see traces here." (not a fake live dot).
- `/sessions` empty state already honest (`SessionsView.tsx:38-47`). KEEP.
- Status dot: never show "active now" unless a session's `lastMs` is genuinely within `ONLINE_MS` AND the runtime is controllable (`statusOf`, `runtimes.ts:114-121` — SHIPPED, gate by group).

---

## 5. Dishonest copy to DELETE

| Location | Issue | Fix | Tag |
|---|---|---|---|
| `app/page.tsx:68-77` | "Verifiable" card = session count in chartreuse | Replace w/ neutral "Actions captured" (§3a) | BUILDABLE |
| `app/page.tsx:113-115` | unconditional green check per session row | neutral chevron | BUILDABLE |
| `app/page.tsx:128-131` | "Connected runtimes" (not connected) | "Environments in this namespace" | BUILDABLE |
| `SettingsView.tsx:226-227` | hardcoded "Auto-capture on / Auto-trace on" | derive from controls file, or drop | BUILDABLE |
| `lib/runtimes.ts` `coverage:"enforced"` ×9 | enforcement theater | tier-based labels (§4a) | BUILDABLE |
| `AppsView.tsx:91` | "from your local OneMem setup" over frameworks | section-scoped honest sub | BUILDABLE |

`SettingsView.tsx:226-227` "Advanced" tab Rows: either read the real per-runtime control state from the controls file (the plugin lib already parses it — `onemem-lib.mjs:156`) or remove the static rows. Keep "Decrypt: client-side (Seal SessionKey)" — that one is TRUE (`TraceView.tsx:206-221` decrypts via `/api/decrypt`, server never sees plaintext per CLAUDE.md non-negotiable). **BUILDABLE.**

---

## 6. Live feed — consume the LOCAL WORKER SSE (cross-thread with local-worker)

**Today (SHIPPED but weak):** `app/api/stream/route.ts:12,28` polls the chain every 5s and only fires when the top session id changes. During a session there is nothing to watch — the buffer is a transient JSONL flushed on-chain in one batch at `Stop` (synthesis §5b). The "live" badge (`app/page.tsx:96-99`, `AppShell.tsx:99-102`) is therefore decorative.

**Target:** the local worker (other thread) owns a localhost SQLite + `/stream` SSE that the Claude Code / Codex hooks write to on every `PostToolUse`, with a per-row `proof_status` that upgrades `local → anchored → verified`. The dashboard CONSUMES that feed:

- **Overview recent-sessions panel** and **`/sessions`** subscribe to the worker SSE; new tool-call rows appear the instant a call finishes (not at Stop, not on a 5s poll). The "live" badge becomes truthful.
- Each in-flight call shows a `proof_status` chip: `local` (ink) → `anchored` (ink) → `verified` (chartreuse, the ONLY place chartreuse appears outside the Verify drawer, and only after a real chain check). **BUILDABLE on top of the worker; the worker itself is BUILDABLE/largest-lift (sequence last per synthesis §7.8).**
- **Contract this thread depends on from local-worker:** SSE event shape `{ type, sessionId, callId, toolName, toolNamespace, parentCallId, status, proof_status, ts }` and a worker base URL/port. If the worker is not ready for the demo, the dashboard falls back to the existing chain-poll `/stream` (SHIPPED) — degrade gracefully, never block the headline.

**RISKY/UNCONFIRMED:** the worker does not exist yet. The dashboard must be built so the live feed is an enhancement, not a hard dependency — the trace-led story (record → `/trace/[id]` → Verify) works on the chain-poll path TODAY once BUG-1 is fixed.

---

## 7. What's SHIPPED vs BUILDABLE vs RISKY (rollup)

**SHIPPED (cite):** `/trace/[id]` tree+gantt+Verify drawer (`TraceView.tsx:13-189`, `VerifyDrawer` 172-179); client-side Seal decrypt (`TraceView.tsx:206-221`, `/api/decrypt`); `/sessions` day-grouped list linking to traces (`SessionsView.tsx:50-166`, `lib/sessions.ts:55-145`); environment-agnostic read path (`lib/trace.ts:197-217`); real controls write path for Claude Code/Codex (`lib/runtimes.ts:199-207` → `/api/runtimes/[id]` → plugin libs read at `onemem-lib.mjs:152-159`); memory inventory from on-chain `memwal_write` (`lib/memory.ts:57-97`); chain-poll SSE (`api/stream/route.ts`).

**BUILDABLE:** BUG-1 `eventPackageId` helper (mirror `cli-ts/src/util/sui.ts:23`); BUG-2 loopback bind; nav "Trace" entry; rebuilt `/apps` Runtimes (tiered model, 3 sections, framework removal); all copy deletions; tier labels; dashboard consumption of worker SSE (given the contract).

**RISKY/UNCONFIRMED:** (1) **local worker** does not exist — live feed is enhancement-only; verify worker contract + port. (2) **OpenClaw/Hermes controllability** — no confirmed local controls reader; omit controllable cards until verified. (3) **MCP-client install/config strings** — confirm exact per-client MCP config before shipping copy. (4) `verifyTraceChain` package-id argument — confirm it walks the chain under the original id (low risk; SDK already correct per synthesis).

---

## 8. Cross-thread dependencies

- **local-worker:** SSE event contract + worker URL/port (§6). Hard for the "alive" feel, soft for the demo (chain-poll fallback exists).
- **sdk/contracts:** `addresses.ts` must keep exposing `originalPackageId` (BUG-1 depends on it — currently SHIPPED at `addresses.ts:32`). If a future upgrade changes ids, the `eventPackageId` helper absorbs it.
- **hosted-dashboard thread:** owns the rehomed framework adapters (namespace-scoped trace view). This thread only DELETES them from local; it does not build the hosted view. The `/share` rail entry is hosted-only and must be hidden in local mode (gate in `AppShell.tsx` NAV by a `LOCAL_MODE` env flag — BUILDABLE).
- **mcp thread:** confirms the MCP-client list + the BUG-3 attestation decision (does MCP `add_memory` attest on-chain). Affects whether MCP-client cards can claim any trace at all; for now they claim none (controls-free, explicit-tools-only) which is safe regardless.
- **landing thread:** Overview re-hero copy should rhyme with the trace-led landing H1 (synthesis §7.6).
