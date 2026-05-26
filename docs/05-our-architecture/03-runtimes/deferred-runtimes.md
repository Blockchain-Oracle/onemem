# Deferred Runtimes — v0.2+

Runtimes we'll ship native plugins for AFTER v0.1. At v0.1 these are served via `@onemem/mcp` (MCP transport).

---

## Antigravity native plugin (v0.2)

**Why deferred:** per `../../03-target-runtimes/antigravity-deep.md`, Antigravity's plugin SDK is still in announcement-stage and hook firing is buggy on current builds. Documentation is thin. MCP transport via `mcp_config.json` works today; native plugin will work better once Google ships stable SDK + docs.

**Planned shape:**

```
onemem-antigravity-plugin/
├── gemini-extension.json              # manifest (carryover from Gemini CLI)
├── hooks/
│   └── hooks.json
├── scripts/
│   ├── before-tool.js                 # BeforeTool hook
│   ├── after-tool.js                  # AfterTool hook
│   ├── session-start.js
│   └── session-end.js
└── ...
```

**Migration path from Gemini CLI:** users who already have a Gemini CLI OneMem plugin can `agy plugin import gemini` per the migration command (`../../03-target-runtimes/antigravity-deep.md`).

**Hook coverage at v0.2:**
- `SessionStart` / `SessionEnd` → start/end OneMem trace session
- `BeforeAgent` / `AfterAgent` → emit agent-level trace markers
- `BeforeModel` / `AfterModel` → model-call ActionCalls
- `BeforeTool` / `AfterTool` → tool-call ActionCalls (PENDING / SUCCESS-or-FAILURE)
- `PreCompress` → end session before compression
- `Notification` → relay to dashboard

**Breaking-change vigilance:** MCP config rename `url` → `serverUrl` (silent failure if not renamed). OneMem MCP uses `command`/`args` so this doesn't bite us; but native plugin must handle it for its own MCP config.

---

## Codex native plugin (v0.2)

Covered in `codex-cli-integration.md` §"v0.2: Native plugin (deferred)". Brief recap:
- 10-event lifecycle hook coverage
- Requires user to enable `[features].plugin_hooks = true` (distribution friction)
- 3 known footguns documented
- Ships when Codex's plugin-local hook execution becomes more reliable (currently buggy per OpenAI/codex#16430)

---

## Cursor native plugin (NOT planned)

**Why never:** Cursor explicitly has no plugin SDK beyond inherited VS Code extensions. MCP is the ONLY integration path. Cursor's `02-inspirations/...` deep-dive confirms this. We don't ship a Cursor "plugin" because there's nothing to plug into.

Cursor users get OneMem via `@onemem/mcp` (covered in `mcp-server.md`).

---

## Windsurf native plugin (NOT planned)

Same as Cursor — MCP-only.

---

## OpenCode / Cline / VS Code Copilot native plugins (NOT planned)

All MCP-only at v0.1. If any ships a plugin SDK later, revisit.

---

## Gemini CLI native plugin (NOT planned)

Gemini CLI is being sunsetted to Antigravity per Google's developer blog. We don't ship Gemini CLI-specific anything; Antigravity native is the forward path (v0.2).

Users still on Gemini CLI today can use `@onemem/mcp` via MCP config.

---

## Hermes — feature parity expansion (v0.2+)

`hermes-onemem` ships at v0.1 with full MemoryProvider implementation. v0.2+ adds:
- Multi-provider composition (run OneMem alongside Honcho or Mem0 — share writes)
- Tool schema expansion (more agent-accessible OneMem operations)
- Hermes Skills integration (auto-register OneMem skills)

---

## Cross-references

- `README.md` (this folder) — main runtime matrix
- `codex-cli-integration.md` — Codex v0.1 (MCP) + v0.2 (native) detail
- `mcp-server.md` — `@onemem/mcp` covering all MCP-only runtimes
- `../../03-target-runtimes/antigravity-deep.md` — Antigravity research
- `../../03-target-runtimes/codex-cli-deep.md` — Codex research
- `../../03-target-runtimes/cursor-mcp-deep.md` — Cursor research
