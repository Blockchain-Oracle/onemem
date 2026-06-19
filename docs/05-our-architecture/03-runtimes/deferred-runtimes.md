# Deferred Runtimes — v0.2+

Runtimes we'll ship native plugins or native hook ports for AFTER v0.1. At v0.1 these are served via `@onemem/mcp` (MCP transport) unless a OneMem-specific native package already exists.

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

## Cursor hook port (planned, not shipped)

**Why planned:** the older OneMem docs treated Cursor as MCP-only, but a fresh
ClaudeMem source check shows a real `cursor-hooks/` directory and
`src/services/integrations/CursorHooksInstaller.ts`. OneMem should port that
shape to the local worker API before claiming Cursor automatic capture.

Current v0.1 path: Cursor users get OneMem via `@onemem/mcp` (covered in
`mcp-server.md`). This is explicit tool use only. The hook port is not shipped
until OneMem has installer code, tests, and a live proof.

---

## Windsurf hook port (planned, not shipped)

**Why planned:** ClaudeMem ships `src/services/integrations/WindsurfHooksInstaller.ts`
with Windsurf hook events. OneMem should port that installer to the local worker
API before claiming Windsurf automatic capture.

Current v0.1 path: Windsurf users get OneMem via `@onemem/mcp`. This is explicit
tool use only until the hook port is built and proved.

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
- `codex-cli-integration.md` — current Codex plugin package with MCP baseline
  and optional trusted hooks
- `mcp-server.md` — `@onemem/mcp` covering explicit-tool fallback runtimes
- `../../03-target-runtimes/antigravity-deep.md` — Antigravity research
- `../../03-target-runtimes/codex-cli-deep.md` — Codex research
- `../../03-target-runtimes/cursor-mcp-deep.md` — Cursor research
