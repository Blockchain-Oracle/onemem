# Codex CLI Integration — OneMem

OneMem integrates with Codex CLI via **MCP transport at v0.1** (consumed via `@onemem/mcp`). Native `.codex-plugin/plugin.json` plugin deferred to v0.2 because: Codex's `plugin_hooks` is OFF by default (distribution friction), and per `../../03-target-runtimes/codex-cli-deep.md` there are 3 known footguns to design around.

Source-of-truth: `../../03-target-runtimes/codex-cli-deep.md`

---

## v0.1: MCP transport (recommended)

Install OneMem via Codex's MCP support (no plugin_hooks opt-in required):

```toml
# ~/.codex/config.toml
[mcp.servers.onemem]
command = "npx"
args = ["-y", "@onemem/mcp@latest"]

[mcp.servers.onemem.env]
MCP_CLIENT_NAME = "codex"
ONEMEM_ENV = "production"
```

User can then call OneMem tools from Codex prompts:
- "Search OneMem for what we decided about authentication" → Codex calls `onemem_search_memory`
- "Save this decision to memory" → Codex calls `onemem_add_memory`
- "Verify this trace session" → Codex calls `onemem_verify_trace`

**Coverage at v0.1:** only calls routed through OneMem MCP tools. Native Codex tool calls (Bash, apply_patch, etc.) are invisible. Dashboard surfaces this honestly with a "partial coverage" badge.

---

## v0.2: Native plugin (deferred)

When we ship the native plugin, the package would look like:

```
onemem-codex-plugin/
├── .codex-plugin/
│   └── plugin.json
├── hooks/
│   └── hooks.json
├── scripts/
│   ├── observe.js                     # PreToolUse + PostToolUse capture
│   ├── inject.js                      # SessionStart + UserPromptSubmit
│   ├── summarize.js                   # Stop + SubagentStop
│   └── compat-check.js
├── package.json
└── README.md
```

### `.codex-plugin/plugin.json` (planned for v0.2)

```json
{
  "name": "onemem",
  "version": "0.2.0",
  "description": "Verifiable agent memory + action trace for Codex CLI",
  "repository": "https://github.com/onemem/codex-plugin",
  "license": "Apache-2.0",
  "hooks": "./hooks/hooks.json"
}
```

### `hooks/hooks.json` (planned for v0.2)

Following the Codex 10-event lifecycle (per `../../03-target-runtimes/codex-cli-deep.md`):

```json
{
  "hooks": {
    "SessionStart": [
      { "matcher": "*", "hooks": [{ "type": "command", "command": "node ${PLUGIN_ROOT}/scripts/inject.js context" }] }
    ],
    "SubagentStart": [
      { "matcher": "*", "hooks": [{ "type": "command", "command": "node ${PLUGIN_ROOT}/scripts/inject.js subagent" }] }
    ],
    "UserPromptSubmit": [
      { "matcher": "*", "hooks": [{ "type": "command", "command": "node ${PLUGIN_ROOT}/scripts/inject.js session-init" }] }
    ],
    "PreToolUse": [
      { "matcher": "*", "hooks": [{ "type": "command", "command": "node ${PLUGIN_ROOT}/scripts/observe.js pre" }] }
    ],
    "PermissionRequest": [
      { "matcher": "*", "hooks": [{ "type": "command", "command": "node ${PLUGIN_ROOT}/scripts/observe.js permission" }] }
    ],
    "PostToolUse": [
      { "matcher": "*", "hooks": [{ "type": "command", "command": "node ${PLUGIN_ROOT}/scripts/observe.js post" }] }
    ],
    "PreCompact": [
      { "matcher": "*", "hooks": [{ "type": "command", "command": "node ${PLUGIN_ROOT}/scripts/observe.js pre-compact" }] }
    ],
    "PostCompact": [
      { "matcher": "*", "hooks": [{ "type": "command", "command": "node ${PLUGIN_ROOT}/scripts/observe.js post-compact" }] }
    ],
    "SubagentStop": [
      { "matcher": "*", "hooks": [{ "type": "command", "command": "node ${PLUGIN_ROOT}/scripts/summarize.js subagent" }] }
    ],
    "Stop": [
      { "matcher": "*", "hooks": [{ "type": "command", "command": "node ${PLUGIN_ROOT}/scripts/summarize.js session" }] }
    ]
  }
}
```

### User must opt-in via Codex config

```toml
[features]
hooks = true
plugin_hooks = true   # this is the friction — OFF by default
```

OneMem README + post-install message walks the user through this.

---

## Known Codex footguns (v0.2 build-time gotchas)

Per `../../03-target-runtimes/codex-cli-deep.md`:

1. **`apply_patch` PreToolUse is unreliable.** If we depend on PreToolUse firing for every tool call, we may miss `apply_patch` calls. Mitigation: emit ActionCall on EITHER PreToolUse OR `agent_intent_to_edit` (whichever fires first).

2. **MCP tool hook coverage is intermittent.** Plugin-local hooks for tool calls routed through MCP servers may or may not fire consistently. Mitigation: rely on PostToolUse (which fires reliably even for MCP-routed calls).

3. **`Stop` / `SubagentStop` have INVERTED `decision: "block"` semantics** compared to other events. For Stop: `decision: "block"` means "don't terminate yet"; for PreToolUse: it means "don't execute this tool." Don't mix them up. Our `summarize.js` returns `{"decision": "approve"}` always.

---

## Per-version distribution table

| Codex feature | v0.1 OneMem | v0.2 OneMem |
|---|---|---|
| Tool call observation | Via MCP wrapping (partial coverage) | Via PreToolUse/PostToolUse hooks (full coverage) |
| SessionStart auto-recall | Manual (`onemem_search_memory` MCP tool) | Auto via SessionStart hook |
| Subagent spawn tracking | Manual | Via SubagentStart/SubagentStop hooks |
| Compaction handling | N/A | Via PreCompact/PostCompact hooks |
| Permission request audit | N/A | Via PermissionRequest hook |
| Cross-runtime trace composition | Yes (via shared namespace_id) | Yes (deeper — every tool call captured) |

---

## Install path summary

```bash
# v0.1 (MCP transport)
# Add to ~/.codex/config.toml:
[mcp.servers.onemem]
command = "npx"
args = ["-y", "@onemem/mcp@latest"]

# v0.2 (native plugin — once we ship it)
codex plugin marketplace add onemem/codex-plugin
codex plugin install onemem

# Enable hooks (one-time):
codex config set features.hooks true
codex config set features.plugin_hooks true
```

---

## Cross-references

- `README.md` (this folder)
- `mcp-server.md` — `@onemem/mcp` that v0.1 uses
- `deferred-runtimes.md` — Codex native plugin in the deferred list
- `../../03-target-runtimes/codex-cli-deep.md` — full Codex hook contract + footguns (the source-of-truth)
