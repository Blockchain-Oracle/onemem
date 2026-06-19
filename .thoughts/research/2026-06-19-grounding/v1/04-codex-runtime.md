# Grounding Report — Thread 04: codex-runtime

**Date:** 2026-06-19
**Surface:** OneMem's Codex CLI plugin (`packages/plugin-codex`) + the "Codex must equal Claude Code" parity question.
**Verdict bar:** Pillar 2 (action TRACE + REPLAY) is the headline. Question: what does a Codex user actually GET, and can Abu honestly promise "same as Claude Code"?

All claims below are grounded in source I read. File:line citations inline.

---

## 1. The one-paragraph truth

The Codex plugin is **real, tested, and (unusually for this repo) honestly documented.** It ships a Codex plugin manifest, bundles the OneMem MCP server, ships a skill, and ships three optional lifecycle hooks (`SessionStart` → `inject.js`, `PostToolUse` → `observe.js`, `Stop` → `summarize.js`). The MCP memory/search/verify tools are the stable baseline and need no hook trust. The trace-capture hook path **does work** — there is a real testnet `TraceSession` (`0x0c88...e330`) minted from a trusted interactive Codex 0.140 session and verified `ok: true, callCount: 1` (README.md:58-64, codex-cli-integration.md:171-185). BUT the Codex trace path differs from Claude Code in three structural ways: (a) Codex requires the user to manually review+trust the hooks via `/hooks` before they fire at all; (b) the flush mechanism is an out-of-process shell-out to a separate `onemem-trace` CLI rather than the in-process SDK that Claude Code uses; (c) `codex exec` (non-interactive/headless mode) provably does NOT run the hooks on this Codex version. The end on-chain artifact is the same *kind* of object as Claude Code's, but the path to get it is more fragile and less "auto."

---

## 2. What the Codex hook lifecycle ACTUALLY is

Source: `packages/plugin-codex/hooks/hooks.json` (whole file) and `docs/03-target-runtimes/codex-cli-deep.md:81-130`.

Codex exposes a **10-event hook lifecycle** (`SessionStart`, `SubagentStart`, `UserPromptSubmit`, `PreToolUse`, `PermissionRequest`, `PostToolUse`, `PreCompact`, `PostCompact`, `SubagentStop`, `Stop` — codex-cli-deep.md:85-96). Hooks get JSON on stdin, return JSON on stdout, exit-code 2 to block. This is genuinely modeled on Claude Code's hook shape, and Codex even ships `CLAUDE_PLUGIN_ROOT`/`CLAUDE_PLUGIN_DATA` env aliases so Claude Code plugins port unchanged (codex-cli-deep.md:177).

OneMem uses **only 3 of the 10 events** (hooks.json):
- `SessionStart` → `inject.js`: injects a one-line OneMem guidance string into the model preamble, and if trace env vars are present, writes local "armed" session state (inject.js:16-28). It does NOT open an on-chain session here.
- `PostToolUse` → `observe.js`: buffers each tool call to a local `.buffer.jsonl` file, no network (observe.js:22-29). Gated on session state existing + `traceCaptureEnabled("codex")`.
- `Stop` → `summarize.js`: reads the buffer, builds a payload, and **shells out** to the `onemem-trace` CLI to mint the on-chain trace (summarize.js:54-86).

This 3-hook choice is deliberate and documented: codex-cli-deep.md:300-303 warns `apply_patch` PreToolUse is unreliable and MCP-tool PostToolUse coverage is intermittent, so the plugin "intentionally starts with PostToolUse" (codex-cli-integration.md:213-215).

---

## 3. The `/hooks` trust requirement (REAL, and a genuine UX gap vs Claude Code)

Source: codex-cli-deep.md:239-246, README.md:55-57, codex-cli-integration.md:143-144.

Codex records hook trust **against the hook's content hash**. New or changed hooks are "marked for review and skipped until trusted" (codex-cli-deep.md:240). Workflow:
1. Plugin installs → hooks are **inert** until the user runs `/hooks` and trusts each one.
2. Edit a hook script → trust voids → user re-prompted.

This is a real divergence from Claude Code, where plugin hooks fire after install without a separate per-hook content-hash trust gate. **For a Codex user, "install the plugin" does NOT mean "trace capture is on."** They must additionally open `/hooks` and trust 3 hooks. The docs are honest about this (README.md:73-74: "MCP memory tools work without hook trust").

---

## 4. The `codex exec` boundary (this is the sharpest limit)

Source: codex-cli-integration.md:195-199, codex-cli-deep.md:310-314, `.thoughts/research/2026-06-18-codex-hook-proof-boundary.md:53-56`.

On Codex CLI 0.140, **`codex exec` (the non-interactive / headless / scriptable mode) does not run hooks at all** — verified across isolated `CODEX_HOME`, trusted projects, AND `--dangerously-bypass-hook-trust`. Shell tool calls ran, but no hook side-effects were produced. So:

- **Trace capture only works in the interactive Codex TUI**, where the user can `/hooks`-trust.
- Any automated/CI/headless Codex usage gets **zero OneMem trace**, even fully configured.

This matters because a lot of "agent does a task unattended" framing (the Pillar-2 use cases: "I told my agent to send money / make a video / do research") implies headless/autonomous runs. On Codex those headless runs currently produce **no trace** via this plugin. MCP memory tools would still work (they're model-invoked tools, not hooks), but the automatic action-trace does not.

---

## 5. MCP-baseline vs hook path — what the user SEES vs what's TRUE

| Path | What it gives | Trust needed | Proven? |
|---|---|---|---|
| Bundled MCP (`.mcp.json` → `@onemem/mcp@latest`) | `onemem_add_memory`, `_search_memory`, `_verify_trace`, `_trace_session`, `_replay_session`, `_share_namespace` as model-callable tools | None | Yes — MCP layer is the stable baseline (README.md:7-18) |
| Optional hooks (3 events) | Automatic buffering + on-chain trace flush of Codex's own tool calls | `/hooks` content-hash trust per hook | Yes, but only interactive TUI; one real testnet session proven |
| `codex exec` headless | Nothing from hooks | n/a | **Proven NOT to fire hooks** on 0.140 |

User-belief risk: the GOAL paragraph (GOAL.md:42) lists "Codex CLI … (MCP transport at minimum)" — that minimum bar IS honestly met. The danger is the headline "every coding agent runtime gets drop-in native trace capture" creating the belief that installing the Codex plugin auto-captures traces like Claude Code. It does not auto-capture: it requires `/hooks` trust and only works interactively.

---

## 6. The Claude-Code-vs-Codex mechanism difference (verified by diffing both plugins)

I diffed all scripts of `plugin-claude-code` vs `plugin-codex`. They are NOT the same code with a renamed var — they flush traces by **fundamentally different mechanisms**:

**Claude Code** (`plugin-claude-code/scripts/`):
- `inject.js` opens a REAL on-chain `TraceSession` at SessionStart via in-process SDK: `onemem.traces.startSession({...agentId:"claude-code"})` and persists the `onememSessionId`.
- `summarize.js` (Stop) imports `@onemem/sdk-ts` in-process and calls `appendCall`/`closeCall` per buffered call (each Seal-encrypted, Walrus-stored), then `endSession`. Full SDK, no subprocess.

**Codex** (`plugin-codex/scripts/`):
- `inject.js` does NOT open a session — only writes local "armed" state (inject.js:19-25).
- `summarize.js` (Stop) writes a JSON payload file and **shells out**: `npx -y -p @onemem/sdk-ts@latest onemem-trace <payload>` (summarize.js:26-30, 76-81). The whole session is created at Stop, inside the CLI.

I confirmed the CLI is real and full-fidelity: `packages/sdk-ts/bin/onemem-trace.mjs` reads the payload and calls `recordSession(onemem, {...})` through the same `OneMem` SDK — "full Walrus + Seal + Merkle" (bin/onemem-trace.mjs:1-4, 77-86). So **the END on-chain artifact is the same kind of verifiable TraceSession.** The difference is *how* and *when*: Codex is out-of-process + session-created-at-Stop; Claude Code is in-process + session-opened-at-SessionStart.

Practical consequences of the Codex mechanism:
- Codex Stop hook has a 120s timeout (hooks.json:35) and shells `npx … @latest`, which can cold-download the SDK — slower, more failure surface than in-process.
- On CLI failure Codex **preserves** the buffer (summarize.js:82-85) — good, retry-safe. Verified by test `Stop preserves buffered calls when the trace CLI fails` (plugin.test.ts:189-220).

---

## 7. Is TRUE parity with Claude Code FEASIBLE? Honest verdict

**Partial parity is already achieved and is the most that is currently honest.**

What is genuinely equal:
- Same 3-hook lifecycle (SessionStart/PostToolUse/Stop).
- Same env config contract (`ONEMEM_NAMESPACE_ID`, `ONEMEM_RW_CAP_ID`, `ONEMEM_PRIVATE_KEY`/keystore, `SUI_NETWORK`).
- Same bundled MCP toolset.
- Same *kind* of end artifact: one verifiable, Merkle-rooted, Seal/Walrus-backed `TraceSession`. Both have ONE real testnet proof session, both `callCount: 1`.

What CANNOT currently be made equal (Codex's model, not OneMem's fault):
1. **Trust friction.** Codex's content-hash `/hooks` trust gate is a platform requirement (codex-cli-deep.md:240). Claude Code has no equivalent per-hook trust step. OneMem cannot remove this; it is Codex's security model.
2. **Headless capture.** `codex exec` doesn't fire hooks on 0.140 (codex-cli-integration.md:195-199). Claude Code's headless mode does run hooks. Until a future Codex build changes this, headless Codex trace parity is **not feasible**.
3. **Plugin-local hook reliability.** Issue #16430 (codex-cli-deep.md:304) reports Codex sometimes only honors global `~/.codex/hooks.json`, not plugin-declared hooks. The one proof session worked, but this is a known intermittent platform risk Claude Code doesn't have.

**So: Abu CANNOT honestly promise "same as Claude Code" as an unqualified statement.** The honest equivalence is:

> "In an interactive Codex session where you've trusted OneMem's hooks via `/hooks`, you get the same verifiable on-chain trace you get from Claude Code. The MCP memory/verify tools work identically with no trust step. The one thing Codex doesn't yet support is automatic trace capture in headless `codex exec` runs — that's a Codex platform limitation, not a OneMem gap."

That is a strong, honest, demo-able claim. It is NOT "drop-in identical, auto-on everywhere."

---

## 8. Where they genuinely differ, and WHY (summary table)

| Dimension | Claude Code | Codex | Why |
|---|---|---|---|
| Hook lifecycle | SessionStart/PostToolUse/Stop | identical | OneMem design choice |
| Hook trust | fires after install | needs `/hooks` content-hash trust | **Codex platform model** |
| Headless mode | hooks fire | hooks DON'T fire (`codex exec`, 0.140) | **Codex bug/limitation** |
| Session open | at SessionStart (in-process SDK) | at Stop (out-of-process CLI) | OneMem impl choice (avoids bundling SDK in plugin) |
| Flush mechanism | in-process `@onemem/sdk-ts` | `npx onemem-trace` subprocess | OneMem impl choice |
| Plugin-local hook reliability | reliable | intermittent (#16430) | **Codex platform risk** |
| MCP tools | identical | identical | shared `@onemem/mcp` |
| Proof | 1 testnet session, callCount 1 | 1 testnet session, callCount 1 | symmetric evidence |

---

## 9. Codex audit verdicts (CONFIRMED / REFUTED / UNCERTAIN)

The Codex-agent artifact in my area is `.thoughts/research/2026-06-18-codex-hook-proof-boundary.md`. Verdicts on its notable claims, from my own source reading:

- **"MCP tools are installable and stable; hook scripts packaged + locally simulated; real trace writes work through the trace CLI"** → **CONFIRMED.** `.mcp.json` + 3 hook scripts present; 9 unit tests pass (turbo-test.log: "Tests 9 passed"); `onemem-trace.mjs` exists and calls `recordSession` (bin/onemem-trace.mjs:77-86).
- **"`codex exec` is not a valid live hook proof path on Codex CLI 0.140"** → **CONFIRMED** (as a reproduced observation; can't independently re-run Codex here, but it's consistent across both docs and the proof brief — codex-cli-integration.md:195-199, codex-cli-deep.md:310-314, proof-boundary.md:53-56).
- **"`plugin_hooks` feature flag removed; `hooks` stable on 0.140"** → **CONFIRMED as documented** (proof-boundary.md:49, codex-cli-deep.md:305-309). Environment-dependent; I trust the recorded `codex features list` output.
- **Proof-boundary brief's stated trace session `0xcf95...c9b1` (line 44-45)** vs **README's `0x0c88...e330`** → **UNCERTAIN / STALE.** The 06-18 brief cites a *bootstrap* session `0xcf95...`; the 06-19 README + integration doc cite the *trusted-hook* session `0x0c88...`. These are two different sessions from two different proof attempts. Not a contradiction, but the brief's "no real trusted interactive /hooks session completed" (proof-boundary.md:78-79) was **superseded** by the 06-19 README/integration claim that one WAS completed. The brief is one day stale; README is newer. I did not independently query chain to confirm either session id resolves — flagging as the one thing I cannot verify from source alone.
- **codex-cli-deep.md:26 "live Codex TUI hook execution remains an explicit follow-up before claiming Claude Code parity"** → **REFUTED as current state / STALE.** That line (dated "as of 2026-06-17") is now contradicted by the same-repo 06-19 proof (codex-cli-integration.md:171-185, README.md:58-64). The follow-up was apparently done. **Doc drift:** codex-cli-deep.md:26 should be updated; it currently understates what the README claims.

---

## 10. Gaps / problems (ranked)

1. **The headline overpromises relative to Codex reality.** GOAL.md:13/38-42 frames "drop-in native plugins for every coding agent runtime" + the auto-capture Pillar-2 narrative. For Codex specifically, trace capture is NOT drop-in/auto — it needs `/hooks` trust and only works interactively. The *plugin docs* are honest (README, integration doc both carve this out); the *top-level GOAL/marketing* is where the dishonesty risk lives. The fix is framing, not code.
2. **Headless / `codex exec` produces no trace, silently.** A user running Codex non-interactively gets zero trace and no warning. There's no runtime message telling them hooks didn't fire. This is the single most likely "user believes X, truth is Y" trap.
3. **Single-session proof + on-chain id not re-verified here.** Both plugins rest on exactly ONE `callCount: 1` testnet session each. That proves the path *can* work once; it does not prove robustness (multi-call, multi-session, mainnet). And the two proof-doc session ids differ (see §9) — at minimum the 06-18 brief and codex-cli-deep.md:26 are stale relative to README and should be reconciled.

---

## 11. The single most important correction

**Stop saying (or implying) "Codex works the same as Claude Code, auto-capture on."** It is not true and the plugin's own SKILL.md already forbids it (SKILL.md:28-29: "Do not claim full Codex tool-call trace coverage unless the lifecycle hooks are configured, trusted, and verified"). The honest, still-impressive claim is: *"Codex gets the same verifiable on-chain trace as Claude Code in an interactive session once you trust the hooks via `/hooks`; MCP memory/verify is identical with no setup; headless `codex exec` trace is a Codex platform limitation we don't yet cover."* Put that qualifier wherever the GOAL/marketing currently says "every runtime, auto-on" — the package-level docs already model the right honesty; propagate it upward.
