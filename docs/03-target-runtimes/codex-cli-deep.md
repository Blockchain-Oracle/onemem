# Codex CLI — Deep Runtime Reference

**What it is.** OpenAI's terminal coding agent (`codex`). Ships with a first-party plugin system (`.codex-plugin/plugin.json`) modeled after Claude Code's plugin shape, a 10-event hook lifecycle, a managed MCP server registry, and a marketplace command (`codex plugin marketplace add`). Hook scripts receive JSON on stdin, return JSON on stdout, exit-code 2 to block. The full plugin contract is documented at [developers.openai.com/codex/plugins/build](https://developers.openai.com/codex/plugins/build) and the hook contract at [developers.openai.com/codex/hooks](https://developers.openai.com/codex/hooks).

---

## Plugin manifest — `.codex-plugin/plugin.json`

Verbatim, from the [build docs](https://developers.openai.com/codex/plugins/build):

```json
{
  "name": "my-plugin",
  "version": "0.1.0",
  "description": "Bundle reusable skills and app integrations.",
  "author": { "name": "Your team", "email": "team@example.com", "url": "https://example.com" },
  "homepage": "https://example.com/plugins/my-plugin",
  "repository": "https://github.com/example/my-plugin",
  "license": "MIT",
  "keywords": ["research", "crm"],
  "skills": "./skills/",
  "mcpServers": "./.mcp.json",
  "apps": "./.app.json",
  "hooks": "./hooks/hooks.json",
  "interface": {
    "displayName": "My Plugin",
    "shortDescription": "Reusable skills and apps",
    "longDescription": "Distribute skills and app integrations together.",
    "category": "Productivity",
    "capabilities": ["Read", "Write"],
    "defaultPrompt": ["Use My Plugin to summarize new CRM notes."],
    "brandColor": "#10A37F",
    "composerIcon": "./assets/icon.png",
    "logo": "./assets/logo.png",
    "screenshots": ["./assets/screenshot-1.png"]
  }
}
```

Directory layout:

```
my-plugin/
├── .codex-plugin/
│   └── plugin.json          # required manifest
├── skills/<name>/SKILL.md   # skill bodies (Markdown w/ frontmatter)
├── hooks/hooks.json         # lifecycle hooks (default path)
├── .mcp.json                # MCP server config
├── .app.json                # connector/app mappings
└── assets/                  # icons, logos, screenshots
```

Only `plugin.json` belongs in `.codex-plugin/`; everything else lives at the plugin root. The `hooks` manifest field can be a single path, an array of paths, or an inline hooks object — if omitted, Codex auto-loads `./hooks/hooks.json` if present.

---

## Hook contract — full lifecycle

Ten events, every hook script receives a JSON envelope on stdin with shared base fields and event-specific fields, then writes JSON to stdout. Source: [developers.openai.com/codex/hooks](https://developers.openai.com/codex/hooks).

| Event | When it fires | Key event-specific fields |
|---|---|---|
| `SessionStart` | New session or `--resume` | `matcher` selects `"startup"` or `"resume"` |
| `SubagentStart` | A subagent begins a turn | `subagent_id`, parent `session_id` |
| `UserPromptSubmit` | User submits a prompt | `prompt` (string) |
| `PreToolUse` | Before `shell`/`apply_patch`/MCP tool call | `tool_name`, `tool_use_id`, `tool_input` |
| `PermissionRequest` | Approval prompt about to show | `permission_kind`, `tool_input` |
| `PostToolUse` | After tool returns | `tool_name`, `tool_use_id`, `tool_input`, `tool_output` |
| `PreCompact` | Before context compaction | `trigger` (`"auto"` or `"manual"`) |
| `PostCompact` | After compaction completes | `summary` (string) |
| `SubagentStop` | A subagent finishes | `subagent_id` |
| `Stop` | Conversation turn stops | — |

Shared base payload (every event):

```json
{
  "session_id": "string",
  "transcript_path": "string | null",
  "cwd": "string",
  "hook_event_name": "string",
  "model": "string",
  "turn_id": "string",
  "permission_mode": "default|acceptEdits|plan|dontAsk|bypassPermissions"
}
```

Hook output (all events accept the base shape):

```json
{
  "continue": true,
  "stopReason": "optional human-readable reason",
  "systemMessage": "optional inline note",
  "suppressOutput": false
}
```

Event-specific output extensions:
- **`PreToolUse`** — `permissionDecision: "allow" | "deny"` and optional `updatedInput` to rewrite tool inputs (e.g. redact secrets).
- **`PermissionRequest`** — `decision: { "behavior": "allow"|"deny", "message": "..." }`.
- **`PostToolUse`** — `decision: "block"` halts further processing.
- **`Stop` / `SubagentStop`** — `decision: "block"` *continues* rather than stops (inverted semantics — see anti-patterns).
- **`SessionStart`** — `hookSpecificOutput.additionalContext` (string) is injected into the model preamble.

Exit codes: `0` = success (stdout JSON consumed), `2` = block with stderr-as-reason, anything else = error logged and skipped.

### `hooks.json` registration

Plugin-local default at `hooks/hooks.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume",
        "hooks": [
          { "type": "command",
            "command": "python3 ${PLUGIN_ROOT}/hooks/session_start.py",
            "statusMessage": "Loading plugin context",
            "timeout": 30 }
        ]
      }
    ],
    "PreToolUse": [
      { "matcher": "^Bash$",
        "hooks": [{ "type": "command", "command": "node ${PLUGIN_ROOT}/hooks/govern.mjs" }] }
    ]
  }
}
```

Real-world reference (verbatim from [openai/codex-plugin-cc](https://github.com/openai/codex-plugin-cc/blob/main/plugins/codex/hooks/hooks.json)):

```json
{
  "description": "Optional stop-time review gate for Codex Companion.",
  "hooks": {
    "SessionStart": [{ "hooks": [{ "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/session-lifecycle-hook.mjs\" SessionStart", "timeout": 5 }] }],
    "SessionEnd":   [{ "hooks": [{ "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/session-lifecycle-hook.mjs\" SessionEnd",   "timeout": 5 }] }],
    "Stop":         [{ "hooks": [{ "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/stop-review-gate-hook.mjs\"",                "timeout": 900 }] }]
  }
}
```

Note `SessionEnd` appears in OpenAI's own example but is not currently listed in the public hooks docs — treat as undocumented-but-supported.

### Environment variables passed to hook commands

- `PLUGIN_ROOT` — installed plugin root directory
- `PLUGIN_DATA` — plugin's writable data directory
- `CLAUDE_PLUGIN_ROOT` — compatibility alias for `PLUGIN_ROOT` (so Claude Code plugins ported to Codex work unchanged)
- `CLAUDE_PLUGIN_DATA` — compatibility alias for `PLUGIN_DATA`

Working directory for hook commands = session `cwd`. Default `timeout` = 600 seconds. `commandWindows` field on a hook entry overrides per-OS.

---

## TOML config — `~/.codex/config.toml`

Per-user hook registration (alternative to plugin hooks) uses inline TOML tables:

```toml
[[hooks.PreToolUse]]
matcher = "^Bash$"

[[hooks.PreToolUse.hooks]]
type = "command"
command = '/usr/bin/python3 "script.py"'
timeout = 30
statusMessage = "Checking Bash command"
```

Per-plugin MCP server tuning (post-install user override):

```toml
[plugins."my-plugin".mcp_servers.docs]
enabled = true
default_tools_approval_mode = "prompt"
enabled_tools = ["search"]

[plugins."my-plugin".mcp_servers.docs.tools.search]
approval_mode = "approve"
```

Disable a plugin without uninstalling:

```toml
[plugins."gmail@openai-curated"]
enabled = false
```

---

## MCP server registration — `.mcp.json`

Two forms accepted ([build docs](https://developers.openai.com/codex/plugins/build)):

```json
{ "docs": { "command": "docs-mcp", "args": ["--stdio"] } }
```

or wrapped:

```json
{ "mcp_servers": { "docs": { "command": "docs-mcp", "args": ["--stdio"] } } }
```

Codex consumes stdio MCP servers transparently; tools surface in the agent's tool catalog and route through `PreToolUse`/`PostToolUse` like any first-party tool.

---

## Trust model

From [developers.openai.com/codex/hooks](https://developers.openai.com/codex/hooks): *"Codex records trust against the hook's current hash, so new or changed hooks are marked for review and skipped until trusted."* Workflow:

1. Plugin installs → hooks are inert until user runs `/hooks` and trusts each one.
2. Trust is keyed by SHA hash of the hook command + args. Edit the script → trust voids → user re-prompted.
3. Managed hooks (MDM / system policy) auto-trust.
4. `--dangerously-bypass-hook-trust` flag skips persistence for one-off runs (escape hatch, not for daemons).
5. `--full-auto` keeps hooks firing but suppresses approval prompts. Do not use `--dangerously-bypass-approvals-and-sandbox` (OpenAI labels it "Elevated Risk / not recommended" per [agenticcontrolplane.com](https://agenticcontrolplane.com/blog/codex-cli-hooks-reference)).

---

## Permission scope

`permission_mode` field in every payload tells the hook what mode the agent is in: `default | acceptEdits | plan | dontAsk | bypassPermissions`. Hooks can decline to act in `bypassPermissions` mode or escalate via `PermissionRequest` output.

---

## Distribution — marketplaces

In-CLI browser: `codex /plugins` opens an interactive plugin browser with marketplace tabs, search, install, and per-plugin enable/disable (Space). No standalone `codex plugin install <pkg>` documented.

Marketplace management commands ([build docs](https://developers.openai.com/codex/plugins/build)):

```bash
codex plugin marketplace add owner/repo
codex plugin marketplace add owner/repo --ref main
codex plugin marketplace add https://github.com/example/plugins.git --sparse .agents/plugins
codex plugin marketplace add ./local-marketplace-root
codex plugin marketplace list
codex plugin marketplace upgrade
codex plugin marketplace remove marketplace-name
```

Marketplace catalog file at `$REPO_ROOT/.agents/plugins/marketplace.json` or `~/.agents/plugins/marketplace.json`:

```json
{
  "name": "local-example-plugins",
  "interface": { "displayName": "Local Example Plugins" },
  "plugins": [
    { "name": "my-plugin",
      "source": { "source": "local", "path": "./plugins/my-plugin" },
      "policy": { "installation": "AVAILABLE", "authentication": "ON_INSTALL" },
      "category": "Productivity" }
  ]
}
```

Git-backed entries use `"source": "url"` or `"source": "git-subdir"`.

Reference plugins on GitHub:
- [openai/plugins](https://github.com/openai/plugins) — official catalog (figma, notion, expo, build-ios-apps, build-macos-apps, build-web-apps, netlify, remotion, google-slides)
- [openai/codex-plugin-cc](https://github.com/openai/codex-plugin-cc) — Claude Code → Codex bridge plugin (uses `CLAUDE_PLUGIN_ROOT` env var)
- [coderabbitai/codex-plugin](https://github.com/coderabbitai/codex-plugin) — CodeRabbit review plugin
- [hashgraph-online/awesome-codex-plugins](https://github.com/hashgraph-online/awesome-codex-plugins) — curated list

---

## Known issues / anti-patterns

From [agenticcontrolplane.com/blog/codex-cli-hooks-reference](https://agenticcontrolplane.com/blog/codex-cli-hooks-reference) and [openai/codex#16430](https://github.com/openai/codex/issues/16430):

- **`apply_patch` PreToolUse is unreliable today.** File-edit calls intermittently bypass hooks. Don't gate Move-emit on `apply_patch` capture; use `PostToolUse` on `shell` instead.
- **MCP tool calls have intermittent hook coverage** — same caveat as above. If OneMem's MCP server is the capture path, don't rely on `PostToolUse` to also fire; capture inside the MCP handler itself.
- **`Stop`/`SubagentStop` decision semantics are inverted** — `decision: "block"` *continues* the loop instead of stopping it. Easy to flip if you reuse `PostToolUse` block logic.
- **Plugin-local hooks vs global hooks** — [Issue #16430](https://github.com/openai/codex/issues/16430) reports the runtime only consistently executes global `~/.codex/hooks.json` even when plugin manifests declare hooks; verify on the current Codex version before shipping a plugin-only hook strategy.
- **`plugin_hooks` feature flag** — per the wedge notes, some Codex builds gate plugin-declared hooks behind `[features] plugin_hooks = true` in `config.toml`. Install path must instruct users to enable it.
- **CodeRabbit/codex-plugin-cc use `CLAUDE_PLUGIN_ROOT`** — not `PLUGIN_ROOT`. Use the Claude alias for cross-runtime portability; both resolve identically.

---

## OneMem implementation notes

**v0.1 path (1 day): MCP transport.** Ship `@onemem/mcp` stdio server. User adds to `~/.codex/config.toml`:

```toml
[mcp_servers.onemem]
command = "npx"
args = ["-y", "@onemem/mcp"]
```

Capture happens *inside* the MCP tool handlers (`add_memory`, `search_memory`) — no hook reliance, sidesteps the `apply_patch`/MCP coverage gap.

**v0.2 path (3 days): native `.codex-plugin/plugin.json`.** Bundle MCP server + hook scripts. Wire:

- `SessionStart` → `node hooks/session-start.mjs` → recall last-session summary via MemWal SDK, emit as `hookSpecificOutput.additionalContext`
- `PostToolUse` (matcher `^shell$`) → `node hooks/post-tool.mjs` → emit `ActionCall` Move object + Walrus blob
- `Stop` → `node hooks/stop.mjs` → compress session into summary blob + final on-chain attestation (timeout: 900s)
- `SubagentStart` / `SubagentStop` → parent-child trace stitching via `subagent_id` → `parent_call_id`

Install one-liner (v0.2):

```bash
codex plugin marketplace add onemem/codex-plugin && codex /plugins   # then click install
```

Distribution: publish to `openai/plugins` marketplace PR + standalone `onemem/codex-plugin` GitHub repo. Use `CLAUDE_PLUGIN_ROOT` in hook commands so the same scripts work if ported back to Claude Code.

Hook script shape (Node, paste-ready skeleton):

```js
#!/usr/bin/env node
import { readFileSync } from "node:fs";
const payload = JSON.parse(readFileSync(0, "utf8"));
const { session_id, tool_name, tool_input, tool_output, permission_mode } = payload;
// emit ActionCall via MemWal SDK, then:
process.stdout.write(JSON.stringify({ continue: true, suppressOutput: true }));
```
