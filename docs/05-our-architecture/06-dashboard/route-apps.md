# Route: `/apps` — Dashboard

Connected runtimes monitor. Per-runtime status + per-runtime pause + per-runtime permissions. Lifts from Mem0's OpenMemory `/apps` pattern.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ Sidebar │ Topbar                                                      │
├─────────┼────────────────────────────────────────────────────────────┤
│         │  Connected Runtimes                          [+ Add runtime]│
│         │                                                             │
│         │  ┌────────────────────────────────────────────────────┐    │
│         │  │ ● Claude Code                Full coverage   [⏸]  │    │
│         │  │ ─────────────────────────────────────────────────  │    │
│         │  │ Version: 1.2.3                                     │    │
│         │  │ Last seen: 2 seconds ago                           │    │
│         │  │ Memories captured: 87                              │    │
│         │  │ Sessions: 12 (10 verified, 2 in-flight)            │    │
│         │  │                                                    │    │
│         │  │ Permissions:                                       │    │
│         │  │  ☑ Auto-capture memories                           │    │
│         │  │  ☑ Auto-recall on session start                    │    │
│         │  │  ☑ Trace all tool calls                            │    │
│         │  │  ☐ Send notifications on verify failure            │    │
│         │  │                                                    │    │
│         │  │ [View sessions] [Reconfigure] [Uninstall]          │    │
│         │  └────────────────────────────────────────────────────┘    │
│         │                                                             │
│         │  ┌────────────────────────────────────────────────────┐    │
│         │  │ ● Hermes Agent              Full coverage   [⏸]   │    │
│         │  │ ─────────────────────────────────────────────────  │    │
│         │  │ Version: 0.14                                      │    │
│         │  │ Last seen: 14 minutes ago                          │    │
│         │  │ Memories: 24 (multi-agent coordination active)     │    │
│         │  │ Sessions: 8 (8 verified)                           │    │
│         │  │                                                    │    │
│         │  │ Permissions:                                       │    │
│         │  │  ☑ Auto-capture on sync_turn                       │    │
│         │  │  ☑ Trace delegation events                         │    │
│         │  │  ☑ Cross-runtime trace composition                 │    │
│         │  │                                                    │    │
│         │  │ [View sessions] [Reconfigure] [Uninstall]          │    │
│         │  └────────────────────────────────────────────────────┘    │
│         │                                                             │
│         │  ┌────────────────────────────────────────────────────┐    │
│         │  │ ◐ Cursor                    Partial coverage [⏸]  │    │
│         │  │ ─────────────────────────────────────────────────  │    │
│         │  │ Only OneMem-routed calls are captured.             │    │
│         │  │ Cursor's native tools (Read/Edit/Bash) are invisible│   │
│         │  │ — Cursor has no plugin SDK for OneMem to hook into.│    │
│         │  │                                                    │    │
│         │  │ Last seen: 2 hours ago                             │    │
│         │  │ MCP tool calls captured: 7                         │    │
│         │  │                                                    │    │
│         │  │ [Reconfigure MCP] [Uninstall MCP]                  │    │
│         │  └────────────────────────────────────────────────────┘    │
│         │                                                             │
│         │  ┌────────────────────────────────────────────────────┐    │
│         │  │ + Add a runtime                                    │    │
│         │  │ Install OneMem in: Claude Code, OpenClaw, Hermes,  │    │
│         │  │ Codex, Cursor, Windsurf, OpenCode, Cline, VS Code  │    │
│         │  │ Copilot, Antigravity, and more                     │    │
│         │  │                                                    │    │
│         │  │ [Browse all integrations →]                        │    │
│         │  └────────────────────────────────────────────────────┘    │
└─────────┴────────────────────────────────────────────────────────────┘
```

---

## Components

| Component | Purpose |
|---|---|
| `<RuntimeCard>` | Per-runtime card with status, version, stats, permissions, actions |
| `<CoverageTierBadge>` | "Full" (chartreuse-edged) / "Partial" (warning yellow) / "Paused" (muted) |
| `<RuntimePauseToggle>` | ⏸ button; pauses auto-capture for that runtime (saved to runtime's config) |
| `<RuntimePermissions>` | Checkboxes per-permission (synced to runtime's config file via API) |
| `<AddRuntimeDialog>` | Shows install snippets per runtime |
| `<UninstallConfirm>` | Confirmation dialog before uninstalling |

---

## Coverage tier explanation

Per `03-runtimes/README.md` matrix:

| Runtime | Tier | Why |
|---|---|---|
| Claude Code | Full (chartreuse edge) | Native plugin with PreToolUse / PostToolUse hooks |
| OpenClaw | Full | Native plugin with agent.turn / agent.response hooks |
| Hermes | Full | MemoryProvider ABC with sync_turn / handle_tool_call / on_delegation |
| Codex CLI | Partial | `packages/plugin-codex` bundles MCP tools now; optional hooks require live trust before full coverage |
| Cursor | Partial | No plugin SDK; only OneMem-routed MCP calls captured |
| Windsurf | Partial | Same as Cursor |
| OpenCode / Cline / VS Code Copilot | Partial | MCP-only |
| Antigravity | Partial | MCP-only v0.1 |

Hovering the tier badge shows a tooltip with the explanation.

---

## Pause behavior

⏸ button toggles `enabled: false` in the runtime's config (e.g., for Claude Code: writes to plugin config; for OpenClaw: writes to `openclaw.json`). Plugin checks this on every hook fire and exits early if disabled.

Resume: ▶ button. Same flow.

While paused: card border greys out + "Paused" badge replaces coverage tier badge.

---

## Permissions panel

Per-runtime permissions surface what the plugin actually does. The user can toggle:

- Auto-capture (toggles `auto_capture` in plugin config)
- Auto-recall (toggles `auto_recall`)
- Trace all tool calls (toggles `auto_trace`)
- Notifications on verify failure (toggles `notify_on_verify_failure` — new v0.2 feature; greyed at v0.1)

Toggles persist via API call → SDK → writes to local config file (for local mode) OR updates hosted config (for hosted mode).

---

## Add runtime dialog

```
┌──────────────────────────────────────────────────┐
│ Add a runtime                            [✕]     │
├──────────────────────────────────────────────────┤
│ Pick a runtime to install OneMem in:             │
│                                                  │
│ Native plugins (full coverage):                  │
│   ☐ Claude Code         npm:@onemem/cc-plugin    │
│   ☐ OpenClaw            npm:@onemem/oc-onemem    │
│   ☐ Hermes Agent        pip:hermes-onemem        │
│                                                  │
│ MCP transport (partial coverage):                │
│   ☐ Codex CLI                                    │
│   ☐ Cursor                                       │
│   ☐ Windsurf                                     │
│   ☐ OpenCode                                     │
│   ☐ Cline                                        │
│   ☐ VS Code Copilot                              │
│   ☐ Antigravity                                  │
│   ☐ Claude Desktop                               │
│                                                  │
│ Or install everywhere with one command:          │
│   $ onemem install --runtime all                 │
│                                                  │
│      [Show install snippet]   [Cancel]           │
└──────────────────────────────────────────────────┘
```

On "Show install snippet": expands a code block with the exact install command for the selected runtime(s), copy-to-clipboard button included.

---

## Live status detection

How dashboard knows a runtime is "connected":
- Each plugin/MCP-client emits a heartbeat on init (`POST /api/runtimes/heartbeat` with runtime ID + version + capabilities)
- Heartbeat refreshed every 30 seconds while runtime is active
- "Last seen" computed from latest heartbeat
- "● online" if seen <60s ago; "◐ idle" if 60s-15m; "○ offline" if >15m

For local mode: heartbeats go to `localhost:4040/api/runtimes/heartbeat`. For hosted: to `app.onemem.xyz/api/runtimes/heartbeat` (authenticated via delegate key).

---

## Cross-references

- `ui-architecture.md`
- `route-trace.md` — "View sessions" links to per-session view filtered by this runtime
- `../03-runtimes/README.md` — runtime matrix (coverage tiers)
- `../05-cli/command-surface.md` — `onemem install --runtime <id>` installer commands
- `../../02-inspirations/mem0/README.md` — OpenMemory `/apps` pattern
