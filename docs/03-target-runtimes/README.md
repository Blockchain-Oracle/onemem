# Target Runtimes — OneMem Plugin Surfaces

OneMem ships into every coding-agent runtime that supports plugins or MCP. We use **native plugins** where they exist (deepest hooks; best UX) and **MCP transport** as the universal fallback.

**Current source-of-truth files:**
- Runtime package READMEs under `packages/plugin-*` and `packages/mcp-server/`.
- Runtime source under `packages/plugin-*` and `packages/mcp-server/src/`.
- Active status in `.thoughts/wiki/context-engineering-status.md`.
- Historical design context under `docs/05-our-architecture/03-runtimes/`.

---

## The integration matrix

| Runtime | Native plugin? | MCP? | Hook contract | Memory slot? | Existing memory incumbent | OneMem ships at | Effort |
|---|---|---|---|---|---|---|---|
| **Claude Code** | ✅ `.claude-plugin/plugin.json` | ✅ stdio | PreToolUse / PostToolUse / SessionStart / UserPromptSubmit / Stop | No (multi-plugin) | claude-mem (77.6k ⭐) coexists; Mem0 plugin exists | **v0.1** (native plugin + MCP) | 3 days |
| **OpenClaw** | ✅ `openclaw.json` + `extensions: [...]` | ❌ uses native slot | `before_prompt_build` / `agent_end` + `registerTool` / `registerCli` / `registerService` | YES (typed slot, mutually exclusive) | `@mysten-incubation/oc-memwal` (Mysten, polished) + Mem0 OpenClaw plugin | **v0.1** (native plugin USING oc-memwal underneath as storage adapter) | 2 days |
| **Hermes Agent** (Nous, 164k ⭐) | ✅ Python `MemoryProvider` ABC (standalone PyPI; "no in-tree providers" policy) | ❌ Python-only | `prefetch / queue_prefetch / sync_turn / on_turn_start / on_session_end / on_session_switch / on_delegation / on_memory_write / handle_tool_call / shutdown` + `get_tool_schemas / system_prompt_block` | YES (`memory_provider` config) | Bundled: builtin, honcho, mem0, supermemory, byterover, hindsight, holographic, openviking, retaindb | **v0.1** (standalone `hermes-onemem` PyPI) | 2-3 days |
| **Codex CLI** | ✅ `.codex-plugin/plugin.json` + `hooks/hooks.json` | ✅ stdio | 10 events: SessionStart / SubagentStart / PreToolUse / PermissionRequest / PostToolUse / PreCompact / PostCompact / UserPromptSubmit / SubagentStop / Stop | No | Built-in Codex Memories / Chronicle local files (not a plugin) | **v0.1 plugin package** (`packages/plugin-codex`: bundled MCP baseline + optional trusted hooks) | Built; trusted hook proof complete |
| **Cursor** | Hook-port pending (ClaudeMem proves hooks) | ✅ `.cursor/mcp.json` | ClaudeMem `cursor-hooks/`; OneMem port pending | n/a | Mem0 MCP, claude-mem (via install flag) | **v0.1 MCP + hook-port backlog** | 2-3 days |
| **Windsurf** | Hook-port pending (ClaudeMem proves hooks) | ✅ `.windsurf/mcp.json` | ClaudeMem `WindsurfHooksInstaller.ts`; OneMem port pending | n/a | Mem0 MCP, claude-mem hooks | **v0.1 MCP + hook-port backlog** | 2-3 days |
| **Gemini CLI** → **Antigravity** | ✅ `~/.gemini/settings.json` hooks | ✅ MCP | 10 events: SessionStart / SessionEnd / BeforeAgent / AfterAgent / BeforeModel / AfterModel / BeforeToolSelection / BeforeTool / AfterTool / PreCompress / Notification. Hooks output strict JSON via stdout. Exit code 2 = block. | No | None known | **v0.2** (Gemini sunsetting to Antigravity; build against Antigravity once stable) | Defer |
| **OpenCode** | ❌ MCP only | ✅ | MCP only | n/a | Mem0 MCP, claude-mem (via install flag) | **v0.2** | Trivial via MCP |
| **VS Code (Copilot)** | ❌ MCP only | ✅ | MCP only | n/a | None — gap | **v0.2** | Trivial via MCP |
| **Cline** | ❌ MCP only | ✅ | MCP only | n/a | OpenMemory MCP (sunsetting) | **v0.2** | Trivial via MCP |

**v0.1 = 4 runtime packages** (Claude Code + OpenClaw + Hermes + Codex).
Other MCP-capable runtimes use the existing MCP server.

---

## Per-runtime architecture notes

### Claude Code (full native plugin + MCP)
- Plugin manifest: `.claude-plugin/plugin.json` (name, version, repository, license, keywords)
- Hooks: `hooks/hooks.json` with PreToolUse / PostToolUse / SessionStart /
  UserPromptSubmit / Stop
- Hook commands receive Claude Code's tool-call payload via env vars + stdin; respond via stdout
- Install: `/plugin marketplace add <org>/<repo>` → `/plugin install <name>`
- Coexists with claude-mem (different hook commands; no conflict)
- **OneMem plugin captures:** every PostToolUse → `ActionCall` Sui object + Walrus blob + Seal encryption. SessionStart → recall last-session summary + inject into preamble. Stop → compress session → summary blob + final attestation.
- **Distribution:** Anthropic plugin marketplace + GitHub + npm

### OpenClaw (native plugin using oc-memwal underneath)
- Plugin manifest pattern (from `~/.openclaw/openclaw.json`):
  ```json
  { "plugins": { "entries": {...}, "slots": { "memory": "<plugin-id>" } } }
  ```
- Typed `memory` slot — mutually exclusive (only one memory plugin active at a time)
- Hook lifecycle: `agent.turn` (before agent responds) + `agent.response` (after)
- Plugin-internal hooks (from oc-memwal source): `before_prompt_build` + `agent_end`
- Tool registrations: `api.registerTool(...)` for `memory_search` / `memory_store`
- CLI registrations: `api.registerCli(...)` for `openclaw memwal search/stats/login`
- Service registration: `api.registerService(...)` for relayer health check
- Install: `openclaw plugins install @onemem/oc-onemem`
- **OneMem OpenClaw plugin uses `@mysten-incubation/oc-memwal` as a dependency** for the storage adapter, adds:
  - Trace capture via the same `before_prompt_build` + `agent_end` hooks
  - Sui `ActionCall` emit per agent turn
  - Tool registration `replay_session` + `verify_trace`
  - CLI `openclaw onemem trace <session-id>`
  - Dashboard integration (push events to local dashboard at `localhost:3000`)

### Hermes Agent (standalone PyPI MemoryProvider)
- Plugin discovery: `discover_memory_providers()` scans `plugins/memory/` (bundled) AND `$HERMES_HOME/plugins/`
- Plugin policy: **"No in-tree memory providers accepted going forward. Must ship as standalone repos."**
- ABC required: `name` (property) + `is_available()` + `initialize(session_id, **kwargs)` + `get_tool_schemas()`
- ABC optional hooks: `system_prompt_block`, `prefetch`, `queue_prefetch`, `sync_turn`, `handle_tool_call`, `shutdown`, `on_turn_start`, `on_session_end`, `on_session_switch`, `on_pre_compress`, `on_delegation`, `on_memory_write`, `get_config_schema`, `save_config`
- Install pattern: `pip install hermes-onemem` → set `memory_provider: onemem` in Hermes config
- **OneMem Hermes provider implements:**
  - `initialize` → instantiate Python MemWal SDK
  - `prefetch(query)` → `client.recall(query, ns=session_namespace)`, distance filter
  - `sync_turn(user, assistant)` → `client.analyze("User: ... Assistant: ...")` + emit `ActionCall`
  - `on_delegation(task, result, child_session_id)` → cross-runtime trace parent-child linking (HUGE — this is how a Claude-Code-spawned Hermes agent's trace links back to the parent session)
  - `get_tool_schemas()` → expose `memwal_search` / `memwal_store` / `onemem_trace`
- The bundled `Mem0MemoryProvider` is 893 byte README + 173 byte manifest + 14 KB implementation — our equivalent is ~1 day of work because the ABC does most of the design

### Codex CLI (`.codex-plugin/plugin.json`)
- Current package: `packages/plugin-codex`.
- Plugin manifest points at `./skills/`, `./.mcp.json`, and
  `./hooks/hooks.json`.
- Bundled MCP server is the stable memory/search/verify/share path.
- Optional hooks live at `hooks/hooks.json`; Codex auto-loads that default path.
- Current optional hook set: `SessionStart`, `PostToolUse`, and `Stop`.
- `SessionStart` uses an empty matcher so every hook-enabled Codex session
  source is eligible. `codex exec` on Codex CLI 0.140 did not execute user-level
  or plugin hooks in local proof attempts, so do not use `codex exec` as the
  live hook-proof path.
- Env vars: `PLUGIN_ROOT`, `PLUGIN_DATA`, legacy `CLAUDE_PLUGIN_ROOT` and
  `CLAUDE_PLUGIN_DATA` compatibility aliases.
- Trust model: non-managed hooks require explicit user review and trust before
  they run. The 2026-06-19 proof trusted OneMem's SessionStart, PostToolUse,
  and Stop hooks interactively and emitted testnet TraceSession
  `0x0c88317632dcd386b6f81b94ee510003ba107d3c4bfa035ba8072fca8304e330`.
- **OneMem Codex plugin v0.1 = MCP-first plugin package with optional trusted
  hook trace capture.** Live proof exists for an interactive trusted session;
  `codex exec` remains unsuitable as the hook-proof path on CLI 0.140.
- **Codex Memories compatibility:** Codex now has built-in local Memories and
  Chronicle. OneMem does not write `~/.codex/memories`; it is the verifiable,
  portable, encrypted cross-runtime memory/trace layer exposed through MCP.

### Cursor / Windsurf (MCP plus hook-port pending)
- Both consume MCP via `.cursor/mcp.json` / `.windsurf/mcp.json`.
- ClaudeMem proves deeper hook paths exist: `cursor-hooks/` plus
  `CursorHooksInstaller.ts` for Cursor, and `WindsurfHooksInstaller.ts` for
  Windsurf. OneMem must port those installers before claiming automatic capture.
- Until the OneMem ports land, OneMem ships as a stdio MCP server with:
  `onemem_add_memory`, `onemem_search_memory`, `onemem_verify_trace`,
  `onemem_trace_session`, `onemem_replay_session`, and
  `onemem_share_namespace`.
- `get/update/delete_memory` remain deferred because the current MemWal memory
  primitive does not expose those operations.
- Same MCP server serves Codex CLI, OpenCode, Cline, VS Code Copilot, Antigravity.

### Gemini CLI → Antigravity (defer to v0.2)
- Gemini CLI sunsetting per [developers.googleblog.com](https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/)
- Antigravity preserves "Agent Skills, Hooks, Subagents, and Extensions"
- 10 events: SessionStart / SessionEnd / BeforeAgent / AfterAgent / BeforeModel / AfterModel / BeforeToolSelection / BeforeTool / AfterTool / PreCompress / Notification
- Strict JSON via stdout; exit 2 = block
- Defer until Antigravity API is stable (~mid-2026)

---

## Capture-hook canonical mapping

For the trace pillar, the same `ActionCall` Sui object gets emitted from different hook events per runtime:

| Runtime | Capture event | Action data extracted |
|---|---|---|
| Claude Code | `PreToolUse` opens call; `PostToolUse` closes with outputs | tool_name, inputs, outputs, started_at, ended_at |
| OpenClaw | `agent.turn` opens; `agent.response` closes | same |
| Hermes | `handle_tool_call` opens; on return closes; `on_delegation` adds parent_call_id when crossing agents | tool_name, inputs, outputs, parent_call_id |
| Codex | `PostToolUse` buffers completed tool calls; `Stop` flushes, appends, closes calls, and ends the session | tool_name, inputs, outputs, success/failure |
| Vercel AI SDK (framework, not runtime) | `wrapGenerate` / `wrapStream` middleware | tool_name, inputs, outputs |
| LangChain (framework) | `BaseCallbackHandler` subclass `on_tool_start` / `on_tool_end` | same |

All converge into the same `ActionCall` Move object — cross-runtime trace stitching just works via shared `namespace_id` + `parent_call_id`.

---

## Distribution channels per runtime

| Runtime | Channel | Effort |
|---|---|---|
| Claude Code | Anthropic plugin marketplace + GitHub + npm | Manifest submission; ~1-7 day review (verify Day-1) |
| OpenClaw | `openclaw plugins install <pkg>` from npm | Direct npm publish |
| Hermes | `pip install hermes-onemem` from PyPI | Direct PyPI publish; optional Nous plugin listing (don't gate v0.1 on it) |
| Codex | Codex plugin marketplace/local manifest with bundled MCP; manual `~/.codex/config.toml` remains a fallback | Local marketplace or public marketplace listing |
| Cursor / Windsurf | MCP via `.cursor/mcp.json` / `.windsurf/mcp.json` now; native hook ports must adapt ClaudeMem's installers before automatic capture is claimed | MCP now; hook ports gated by implementation + proof |
| Antigravity | MCP via `mcp_config.json` now; native plugin after SDK stabilizes | None gating for MCP |

---

## Cross-references

- Claude Code plugin package: `packages/plugin-claude-code/README.md`
- OpenClaw plugin package: `packages/plugin-openclaw/README.md`
- Hermes plugin package: `packages/plugin-hermes/README.md`
- Codex plugin package: `packages/plugin-codex/README.md`
- MCP server package: `packages/mcp-server/README.md`
- Historical runtime designs: `docs/05-our-architecture/03-runtimes/`
