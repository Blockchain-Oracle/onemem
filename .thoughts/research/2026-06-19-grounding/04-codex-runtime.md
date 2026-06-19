# Grounding Thread 04 — Codex Runtime (location A)

**Thread:** codex-runtime
**Date:** 2026-06-19
**Lens:** EXECUTION LOCATION determines PRODUCT SURFACE.
**Verdict in one line:** Codex is a genuine location-A local agent host. The plugin is structurally a near-clone of the Claude Code plugin. The honest equivalence is "MCP baseline + optional trusted-hook trace capture" — NOT unconditional "same as Claude Code". Abu's "no negotiables, Codex == Claude Code" is *achievable in architecture* but is blocked from being claimed unconditionally by one Codex-specific gate (`/hooks` trust) and one open reliability caveat (plugin-local vs global hook execution / `codex exec` dead zone).

---

## 1. What Codex actually is, through the execution-location lens

Codex CLI is OpenAI's terminal coding agent that runs **on the user's own machine** — same execution location as Claude Code (location A). Its traces are the user's own work on their laptop. This is the legitimate, natural content of a LOCAL dashboard. Unlike Vercel AI / LiveKit / ElevenLabs (location B framework adapters embedded in deployed apps), Codex belongs in a localhost "alive on my machine" surface without any conceptual contortion. Confirmed by the taxonomy reset doc's own classification table: Codex = "Local agent host / User machine" (`.thoughts/research/2026-06-19-integration-taxonomy-reset.md:44`).

So for THIS thread the location-A/B confusion is NOT present — Codex is correctly placed. The disease in this thread is a *different* one: **over-claiming parity** and **`coverage: "enforced"` labeling** that papers over a real trust gate.

---

## 2. The real Codex hook lifecycle (from source + reality research)

The plugin ships the same three-hook shape as Claude Code:

- `SessionStart` → `scripts/inject.js` — injects a OneMem context string; if `ONEMEM_NAMESPACE_ID` + `ONEMEM_RW_CAP_ID` exist and `traceCaptureEnabled("codex")`, writes local session state to arm capture (`scripts/inject.js:19-26`).
- `PostToolUse` → `scripts/observe.js` — buffers each Codex tool call to a local JSONL file; no network work (`scripts/observe.js:22-29`).
- `Stop` → `scripts/summarize.js` — flushes the buffer through the trace CLI (`npx -y -p @onemem/sdk-ts@latest onemem-trace`), mints a `TraceSession` on Sui, and clears local state on success (`scripts/summarize.js:26-85`).

Hook registration: `packages/plugin-codex/hooks/hooks.json` uses an empty `""` matcher on all three events (matches every session source), commands keyed off `${PLUGIN_ROOT}`. The manifest declares `"hooks": "./hooks/hooks.json"` explicitly (`.codex-plugin/plugin.json:14`).

### Compare to Claude Code plugin (parity check from source)
`packages/plugin-claude-code/hooks/hooks.json` is the same three events with the same empty matchers; only the env var differs (`${CLAUDE_PLUGIN_ROOT}` vs `${PLUGIN_ROOT}`). The shared lib (`scripts/onemem-lib.mjs:36`) resolves BOTH `PLUGIN_DATA` and `CLAUDE_PLUGIN_DATA`, and Codex itself aliases `CLAUDE_PLUGIN_ROOT → PLUGIN_ROOT` (codex-cli-deep.md:177). **Architecturally, the two plugins are the same plugin.** This is the strongest evidence FOR Abu's "Codex == Claude Code" demand: the trace pipeline, buffer format, payload shape (`environment: "codex"`, `agentId: "codex"` — `scripts/summarize.js:57-59`), and proof path are identical.

### Where they GENUINELY differ (and why)
1. **`/hooks` trust gate (Codex-only).** Codex records trust against the hook's hash; new/changed hooks are skipped until the user runs `/hooks` and trusts them (codex-cli-deep.md:240-243; Coverage Model `codex-cli-integration.md:150-157`). Claude Code does not impose this per-hook hash-trust review before hooks fire. **This is the single hard difference that prevents an unconditional "same as Claude Code" claim** — out of the box, Codex trace capture is INERT until an explicit human trust step.
2. **`codex exec` does not run hooks (this Codex version).** On Codex CLI 0.140, isolated `codex exec` with trusted projects and `--dangerously-bypass-hook-trust` executed shell tool calls but fired NO hooks (`2026-06-18-codex-hook-proof-boundary.md:54-56`; codex-cli-deep.md:310-314). So headless/non-interactive Codex has zero auto-trace today. Claude Code has no equivalent dead zone.
3. **Plugin-local vs global hook reliability.** OpenAI issue #16430 reports some Codex builds only consistently execute global `~/.codex/hooks.json`, not plugin-declared hooks (codex-cli-deep.md:304). The repo proved plugin-local hooks DO work on 0.140 interactively (below), but this is version-sensitive.
4. **MCP/`apply_patch` PreToolUse intermittent coverage** — both runtimes share MCP caveats, but Codex's are documented as flaky (codex-cli-deep.md:301-302); the plugin deliberately uses `PostToolUse` on all tools to route around it.

### What IS proven (do not under-claim either)
A real interactive trusted-hook run on Codex CLI 0.140 minted testnet `TraceSession 0x0c8831...4e330`, verified `ok: true`, `callCount: 1`, `agent id codex`, matching Merkle roots (`codex-cli-integration.md:171-184`; README.md:58-64). So the path is REAL end-to-end, not simulated-only. The `/hooks` proof gap noted in older docs is closed for the interactive trusted path; it remains open only for the *public Git marketplace* install until patched hook files are pushed (`codex-cli-integration.md:201-204`).

---

## 3. Is TRUE local-dashboard parity with Claude Code feasible? Honest verdict

**Yes for interactive Codex; with an asterisk.** The trace content, proof, and replay are identical to Claude Code because they share the pipeline. A Codex session's calls land on Sui exactly like a Claude Code session's and render in the same `/trace/[id]` view. The dashboard read is by `MoveEventType` + `agent_id`/`environment` (`packages/dashboard/lib/trace.ts:197-217`), so a Codex session shows up the moment it's anchored — no Codex-specific dashboard work needed.

**But parity is conditional, not automatic.** Two honest gaps vs Claude Code:
- **Trust gate:** Codex needs a one-time `/hooks` trust before ANY auto-capture. Until then it is MCP-tools-only.
- **No headless capture:** `codex exec` produces no traces on 0.140.

Plus the deeper gap the taxonomy reset already flagged for BOTH runtimes: neither has a **local worker** yet. claude-mem's "alive on localhost" feeling comes from a localhost worker that writes observations immediately and serves an SSE viewer; OneMem's hooks only buffer transient JSONL and flush proof at `Stop` (`2026-06-19-integration-taxonomy-reset.md:60-76`). So *today* neither Codex nor Claude Code delivers the claude-mem local-liveness experience — they deliver post-hoc on-chain proof. Codex is at parity with Claude Code, but that parity is currently "proof-at-Stop," not "live local feed." Abu should know the bar he's matching is itself not yet claude-mem-grade.

**Can Abu promise "same as Claude Code"?** Honestly: **"Same trace + replay + verify pipeline as Claude Code, after a one-time `/hooks` trust."** That sentence is true and defensible. Unqualified "same as Claude Code" is NOT, because of the trust gate and the `codex exec` dead zone.

**UI label to use:** `trusted-hooks-required` (the taxonomy reset's own tier label, `2026-06-19-integration-taxonomy-reset.md:142`) for Codex — versus `native-hooks` for Claude Code. NOT the current `coverage: "enforced"`.

---

## 4. The Codex-specific product/UI problem (the load-bearing finding)

`packages/dashboard/lib/runtimes.ts:33-39` hard-codes Codex with **`coverage: "enforced"`** — identical to Claude Code — in the same flat `KNOWN_RUNTIMES` list that also (wrongly) contains the location-B framework adapters. Two problems:

1. **`enforced` is a lie for Codex out of the box.** Codex capture is *opt-in behind a hash-trust review* and *absent in `codex exec`*. Labeling it `enforced` (same word as Claude Code) tells the founder and the user that Codex auto-captures everything by default. It does not. The plugin's own SKILL.md is more honest than the dashboard: "Do not claim full Codex tool-call trace coverage unless the lifecycle hooks are configured, trusted, and verified" (`skills/onemem-codex/SKILL.md:28-29`).
2. **Codex is correctly a local row, but it sits in a list polluted by Vercel/LiveKit/ElevenLabs/CrewAI/OpenAI-Agents** (`runtimes.ts:55-86`) which are location-B and do NOT belong in the local dashboard. Codex's legitimacy gets tainted by association, and the founder can't tell which rows are "my machine" vs "my deployed app."

---

## 5. Owner-question answers (Codex-relevant)

**Q1 (local vs hosted dashboard jobs):** From the Codex vantage — the LOCAL dashboard's job is: *"Inspect and replay what the coding agents on THIS machine (Claude Code, Codex) remembered and did."* Codex is squarely in-scope for local. The HOSTED hub's job (`2026-06-19-integration-taxonomy-reset.md:56,128-135`) is onboarding, CLI pairing, sharing/capability flows, and public verification of any namespace from anywhere — Codex doesn't *need* hosted, but its anchored sessions are publicly verifiable there like any other.

**Q2 (do framework adapters belong in local):** Not my surface, but confirmed from source: the local `KNOWN_RUNTIMES` list mixes Codex (legit local) with Vercel/LiveKit/ElevenLabs/CrewAI/OpenAI-Agents (location B, do NOT belong in local chrome). They should MOVE to a hosted "Available adapters / set-up-namespace-then-see-traces" section. Codex STAYS local.

**Q3 (how do you query an adapter's traces — by namespace/environment?):** **Confirmed YES, from source.** `fetchRecentSessions` queries `MoveEventType: ${packageId}::TraceSessionOpened` globally and surfaces `agent_id`, `environment`, `namespace_id` straight from on-chain event JSON (`packages/dashboard/lib/trace.ts:197-217`). There is **no "connected local app" filter on the read path.** The read model is genuinely *by namespace/environment*. The local dashboard's per-runtime rows are a *display overlay* — `KNOWN_RUNTIMES` metadata + `runtime-controls.json` pause/permission state — painted on top of a global chain read. This is exactly why a Codex session anchored from anywhere appears in the dashboard regardless of "connection," and why putting framework adapters in the same chrome is incoherent: the chrome implies local connection that the read model never enforces.

---

## 6. Codex artifact verdicts

Read: `.thoughts/research/2026-06-19-integration-taxonomy-reset.md` (full) and `.thoughts/research/2026-06-18-codex-hook-proof-boundary.md` (full). The cloud-framework-adapters audit at `/Users/abu/Documents/Codex/2026-06-19/onemem-cloud-framework-adapters-audit/outputs/...` was **permission-blocked (EPERM)** — could not read directly; its conclusions are summarized inside the taxonomy reset doc, which I treat as the proxy.

| Codex claim | Verdict | Evidence |
|---|---|---|
| Codex = local agent host; "MCP tools baseline; optional trusted hooks; do not claim `codex exec` hook coverage" | **CONFIRMED** | `runtimes.ts` row exists; hooks require `/hooks` trust (`codex-cli-integration.md:150-157`); `codex exec` ran no hooks on 0.140 (`2026-06-18-codex-hook-proof-boundary.md:54-56`) |
| `runtimes.ts` hard-codes hosts + framework libs into one list with broad `enforced` labels | **CONFIRMED** | `runtimes.ts:23-86` — Codex at `:38` `coverage: "enforced"`; adapters `:55-86` same list/label |
| Dashboard trace read uses `addr.packageId` while CLI/SDK use `originalPackageId \|\| packageId`, so dashboard can show zero sessions after upgrade | **NOT VERIFIED HERE / flag as OVERREACH if asserted still-broken** | I read `trace.ts` reads via `client().packageId`; I did not diff against the SDK's `originalPackageId` resolver in this thread. Plausible but unconfirmed by me — defer to the dashboard thread. |
| Honest claim should be: MCP installable+stable, hook scripts packaged + locally simulated, real trace writes work, full auto coverage needs interactive trusted `/hooks` | **CONFIRMED**, now *strengthened*: interactive trusted-hook proof is DONE (testnet `0x0c8831...`), so it's no longer "needs" — it's "proven for interactive, open for public-marketplace + `codex exec`" (`codex-cli-integration.md:171-204`) |
| `traceCaptureEnabled` is a clean boolean runtime-control check | **CONFIRMED with a code smell** | `onemem-lib.mjs:134-148` is a *sync* boolean fn, but `summarize.js:42` does `await traceCaptureEnabled(...)` while `observe.js:20`/`inject.js:19` call it un-awaited. Harmless (awaiting a boolean is a no-op) but inconsistent — minor cleanup. |

---

## 7. The single most important correction (concrete product/UI change, not a doc edit)

**In `packages/dashboard/lib/runtimes.ts`, split coverage into honest capability tiers and re-label Codex `trusted-hooks-required`, not `enforced`.** Concretely:

- Replace `RuntimeControlCoverage = "enforced" | "stored"` (`runtimes.ts:13`) with the taxonomy reset's tier set (`native-hooks`, `trusted-hooks-required`, `mcp-tools-only`, `framework-adapter`, …).
- Set Codex's tier to **`trusted-hooks-required`** and render a dashboard badge/tooltip: *"Trace capture requires a one-time `/hooks` trust in Codex. Until then, MCP memory/search/verify only. `codex exec` does not capture."*
- Keep Claude Code `native-hooks`; this visibly and honestly distinguishes the two WITHOUT demoting Codex — it's the precise, defensible version of "Codex == Claude Code."
- (Adjacent, owned by other threads but required for Codex to read honestly:) REMOVE the five framework-adapter rows from this local list so Codex's local legitimacy isn't tainted by location-B noise.

This converts a false "enforced" claim into a true, demo-safe one, and is the minimal change that makes Abu's "Codex == Claude Code" promise honest: *same pipeline, one extra trust click.*
