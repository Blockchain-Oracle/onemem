# Pillar 3 — Per-Runtime Native Plugins (OneMem)

> Current note, 2026-06-17: this is a historical design document. Current
> runtime/package READMEs and source are the implementation truth; use
> `.thoughts/` for active planning.

OneMem ships a plugin or MCP integration for every coding-agent runtime users actually use. Native plugins where the runtime supports them (deeper hooks, better UX); MCP transport everywhere else.

---

## Read order

| File | Purpose |
|---|---|
| `README.md` | This file — runtime matrix + design principles |
| `claude-code-plugin.md` | `@onemem/claude-code-plugin` — native plugin + MCP; coexists with claude-mem |
| `openclaw-plugin.md` | `@onemem/oc-onemem` — uses `@mysten-incubation/oc-memwal` underneath; adds trace + dashboard sync |
| `hermes-plugin.md` | `hermes-onemem` PyPI standalone implementing `MemoryProvider` ABC |
| `codex-cli-integration.md` | `@onemem/codex-plugin` — bundled MCP memory tools plus optional trusted Codex hooks |
| `mcp-server.md` | `@onemem/mcp` — the universal MCP server (Pillar 6) consumed by Cursor / Windsurf / Cline / OpenCode / VS Code Copilot / Antigravity / Codex |
| `deferred-runtimes.md` | Native hook ports still deferred until proved (currently Cursor/Windsurf hook ports and Antigravity native) |

---

## Runtime coverage matrix

| Runtime | v0.1 integration | Future (v0.2+) | Source for deep dive |
|---|---|---|---|
| **Claude Code** | Native plugin + MCP | More slash commands | `../../02-inspirations/claude-mem/` + `../../03-target-runtimes/README.md` |
| **OpenClaw** | Native plugin (uses `oc-memwal` underneath) | Feature-parity expansion | `../../02-inspirations/memwal-incubation/README.md` |
| **Hermes Agent** | Standalone PyPI provider | Multi-provider composition | `../../03-target-runtimes/README.md` + `../../../TRACE_AND_PROVIDERS.md` §2 |
| **Codex CLI** | Native Codex plugin with bundled `@onemem/mcp`; optional trusted hooks | Public marketplace push parity for patched hook manifest | `../../03-target-runtimes/codex-cli-deep.md` |
| **Cursor** | Via `@onemem/mcp`; OneMem hook port pending | Port ClaudeMem `cursor-hooks/` + `CursorHooksInstaller.ts` before claiming auto-capture | `../../03-target-runtimes/cursor-mcp-deep.md` + ClaudeMem source |
| **Windsurf** | Via `@onemem/mcp`; OneMem hook port pending | Port ClaudeMem `WindsurfHooksInstaller.ts` before claiming auto-capture | ClaudeMem source |
| **OpenCode** | Via `@onemem/mcp` | TBD | (MCP-capable only) |
| **Cline** | Via `@onemem/mcp` | TBD | (MCP-capable only) |
| **VS Code Copilot** | Via `@onemem/mcp` | TBD | (MCP-capable only) |
| **Antigravity** | Via `@onemem/mcp` | Native plugin once Google stabilizes SDK | `../../03-target-runtimes/antigravity-deep.md` |

**Coverage at v0.1: 10 runtimes** (4 native/plugin packages when counting
Codex's MCP-first plugin + MCP server coverage for the rest).

---

## Design principles

1. **Native plugins where they exist; MCP transport everywhere else.** Cleanest tradeoff between depth-of-integration and ship velocity.
2. **Plugins are THIN wrappers over `@onemem/sdk-ts` / `onemem-sdk-python`.** No SDK logic in plugins. Plugins translate runtime events → SDK method calls.
3. **Coexist, don't replace.** Claude Code plugin runs alongside claude-mem. OpenClaw plugin uses oc-memwal underneath. Mem0 plugin can coexist with OneMem plugin if the user wants both.
4. **One MCP server fits all.** `@onemem/mcp` serves every MCP-capable runtime; ship once, distribute everywhere.
5. **Hook contract per runtime documented from researched docs**, not invented. See `03-target-runtimes/` for the source-of-truth hook contracts.
6. **Install command must be 1-line.** Repository marketplace install is current
   for Claude/Codex plugin packages, `openclaw plugins install
   @onemem/oc-onemem` is current, and runtime npm/PyPI packages are current
   after `pnpm registry:status --strict`. Trusted Claude/Codex hook automation
   now has 2026-06-19 testnet proof; fresh public marketplace installs need the
   patched plugin files pushed.
7. **License: Apache-2.0** (matches claude-mem now that we verified — see `02-inspirations/claude-mem/CLAUDE_MEM_DOCS_TECH.md`).

---

## What gets emitted on what hook (cross-runtime canonical mapping)

The trace pillar (Pillar 1) defines `ActionCall` with PENDING → SUCCESS/FAILURE lifecycle. Per-runtime hook events map to SDK method calls as follows:

| Action | Claude Code | OpenClaw | Hermes | Codex | Cursor/etc (MCP) |
|---|---|---|---|---|---|
| Session begins | `SessionStart` → `trace.startSession()` | (no explicit session start; first `agent.turn` triggers it) | `initialize` → `trace.startSession()` | `SessionStart` arms local trace state | first `add_memory` MCP call lazily creates a session |
| Tool call starts | `PreToolUse` → `trace.appendCall(PENDING)` | `agent.turn` → (collect tool calls during turn) | `handle_tool_call` → `trace.appendCall(PENDING)` | no pending-open in current v0.1 hook path | (MCP tools wrap calls themselves; emit on tool entry) |
| Tool call completes | `PostToolUse` → `trace.closeCall(SUCCESS)` | `agent.response` → `trace.closeCall(SUCCESS)` for each tool call in turn | (on return) → `trace.closeCall(SUCCESS)` | `PostToolUse` buffers completed calls; `Stop` flushes/appends/closes | (MCP tools wrap completion) |
| Memory write (semantic) | hook intercepts user's explicit memory intent | `agent.response` extracts facts → `client.add()` | `sync_turn` extracts facts → `client.add()` | similar to Claude Code | explicit MCP tool: `add_memory` |
| Memory recall | `PreToolUse(Read)` injection (mirror claude-mem pattern) | `before_prompt_build` → `client.search()` | `prefetch` → `client.search()` | `PreToolUse` injection | explicit MCP tool: `search_memory` |
| Session ends | `Stop` → `trace.endSession()` | (no explicit end; session implicit) | `on_session_end` → `trace.endSession()` | `Stop` → `trace.endSession()` | (session ends on user-explicit MCP call or after timeout) |
| Cross-runtime parent | (n/a — top-level) | (n/a) | `on_delegation` sets `parent_call_id` for child runtime's calls | (n/a) | (n/a) |

This is the canonical mapping. Per-runtime docs reference back to this matrix.

---

## What we satisfy + what surprises (lens check)

| Walrus must-have | How runtimes pillar satisfies |
|---|---|
| Cross-tool / cross-agent memory sharing | Same namespace ID works across every plugin; user's namespace follows them |
| Adding persistent memory to existing agent frameworks | Each plugin IS that addition |
| Multi-agent coordination | Hermes `on_delegation` + cross-runtime trace composition via shared `parent_call_id` |

| Surprise dimension | Why judges recognize it |
|---|---|
| **Native plugins per runtime (not just MCP)** | Mem0 has native plugins; we match the depth + add verifiability |
| **Cross-runtime trace composition** | A Claude Code session that spawns a Hermes sub-agent renders as ONE trace tree in the dashboard — nobody else does this |
| **OpenClaw plugin uses Mysten's `oc-memwal` underneath** | We BUILD ON the sponsor's primitive, not against it — explicit "complement not compete" architectural decision |
| **Coexists with claude-mem (77.6k stars)** | Doesn't fragment users; OneMem adds the layers claude-mem doesn't have |

---

## Cross-references

- `../02-sdks/shared-api-surface.md` — the SDK methods plugins call
- `../01-protocol/data-model.md` — the Move types these plugins emit
- `../../03-target-runtimes/README.md` + per-runtime deep dives — the hook contracts these plugins implement
- `../../02-inspirations/claude-mem/HOOKS_AND_VIEWER_REFERENCE.md` — claude-mem hook contract to mirror
- `../../02-inspirations/memwal-incubation/README.md` — oc-memwal plugin we wrap

---

## Implementation status

| Plugin | Status |
|---|---|
| `@onemem/claude-code-plugin` | Built; package tests pass; trusted live hook proof complete |
| `@onemem/oc-onemem` (OpenClaw) | Built; runtime-policy tests pass |
| `hermes-onemem` (Hermes PyPI) | Built; package tests pass |
| `@onemem/mcp` (universal MCP server) | Built and JSON-RPC verified |
| `@onemem/codex-plugin` | Built; package tests pass; trusted live hook proof complete |
| Codex via MCP wired | Built through `packages/plugin-codex/.mcp.json` and manual config path |
| Cursor / Windsurf via MCP docs | Universal MCP path documented; native hook ports deferred until OneMem adapts and proves ClaudeMem-style installers |
| Antigravity via MCP docs | Universal MCP path documented; native runtime work deferred |

Registry check, 2026-06-19: `pnpm registry:status --strict` reports the npm and
PyPI runtime packages as current. Keep registry publication separate from
repository marketplace install and local package tests. Trusted Codex/Claude
hook proof is recorded in
`.thoughts/verification/2026-06-19-trusted-runtime-hook-proof.md`.
