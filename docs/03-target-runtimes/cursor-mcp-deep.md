# Cursor — Deep Runtime Reference

**What it is.** Anysphere's VS Code fork with first-class AI chat/agent surfaces. No plugin/extension SDK of its own beyond inherited VS Code extensions — the *only* officially-supported way for third-party tools to extend the agent is **MCP**. MCP servers are registered in `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global). One-click installs use the `cursor://anysphere.cursor-deeplink/mcp/install?...` deeplink with a base64-encoded JSON config payload. See [cursor.com/docs/context/mcp/install-links](https://cursor.com/docs/context/mcp/install-links).

---

## `mcp.json` schema

Two locations, identical schema:
- **Project-level:** `<repo>/.cursor/mcp.json`
- **Global:** `~/.cursor/mcp.json`

Project config overrides/supplements global. Both keyed under a top-level `mcpServers` object.

### stdio (local subprocess)

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "mcp-server"],
      "env": { "API_KEY": "value" }
    }
  }
}
```

stdio fields:

| Field | Required | Notes |
|---|---|---|
| `type` | recommended | set to `"stdio"`; defaults to stdio when `command` is present |
| `command` | yes | executable name (npx, python, node, docker) |
| `args` | no | string array |
| `env` | no | env-var injection |
| `envFile` | no | path to `.env` file (stdio only) |

### Remote (HTTP / SSE)

```json
{
  "mcpServers": {
    "server-name": {
      "url": "http://localhost:3000/mcp",
      "headers": { "API_KEY": "value" }
    }
  }
}
```

Streamable HTTP and SSE are both supported via the same `url` field; Cursor negotiates transport.

### OAuth (static client credentials)

```json
{
  "mcpServers": {
    "oauth-server": {
      "url": "https://api.example.com/mcp",
      "auth": {
        "CLIENT_ID": "your-oauth-client-id",
        "CLIENT_SECRET": "your-client-secret",
        "scopes": ["read", "write"]
      }
    }
  }
}
```

Fixed OAuth redirect URL Cursor listens on: `cursor://anysphere.cursor-mcp/oauth/callback`.

### Variable interpolation

In `command`, `args`, `env`, `url`, `headers`:
- `${env:NAME}` — environment variable
- `${workspaceFolder}` — project root
- `${userHome}` — user home dir

```json
{
  "mcpServers": {
    "local-server": {
      "command": "python",
      "args": ["${workspaceFolder}/tools/mcp_server.py"],
      "env": { "API_KEY": "${env:API_KEY}" }
    }
  }
}
```

---

## One-click install — the `cursor://` deeplink

Format ([cursor.com/docs/context/mcp/install-links](https://cursor.com/docs/context/mcp/install-links)):

```
cursor://anysphere.cursor-deeplink/mcp/install?name=$NAME&config=$BASE64_ENCODED_CONFIG
```

Components:
- Scheme: `cursor://`
- Handler: `anysphere.cursor-deeplink`
- Path: `/mcp/install`
- `name` — server name shown in the install prompt
- `config` — **base64-encoded JSON** of the server's mcp.json entry (just the inner object, not the `mcpServers` wrapper)

Build process per docs:
1. Take the server's JSON config (the value under `mcpServers.<name>`).
2. `JSON.stringify()` it.
3. Base64-encode.
4. Substitute into the template.

Example config (verbatim from docs):

```json
{
  "postgres": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"]
  }
}
```

The inner object `{"command":"npx","args":["-y","@modelcontextprotocol/server-postgres","postgresql://localhost/mydb"]}` base64-encodes to `eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsIkBtb2RlbGNvbnRleHRwcm90b2NvbC9zZXJ2ZXItcG9zdGdyZXMiLCJwb3N0Z3Jlc3FsOi8vbG9jYWxob3N0L215ZGIiXX0=`.

Generate from shell:

```bash
NAME=onemem
CONFIG='{"command":"npx","args":["-y","@onemem/mcp"]}'
B64=$(printf '%s' "$CONFIG" | base64 | tr -d '\n')
echo "cursor://anysphere.cursor-deeplink/mcp/install?name=$NAME&config=$B64"
```

Generate from Node:

```js
const cfg = { command: "npx", args: ["-y", "@onemem/mcp"] };
const b64 = Buffer.from(JSON.stringify(cfg)).toString("base64");
console.log(`cursor://anysphere.cursor-deeplink/mcp/install?name=onemem&config=${b64}`);
```

User flow: click link → Cursor opens an install dialog pre-filled with name + transport + URL/command → user confirms → entry added to `~/.cursor/mcp.json`.

**"Add to Cursor" badge:** Cursor's MCP Directory ([cursor.com/docs](https://cursor.com/docs)) auto-generates the deeplink + button for any listed server. Per [bannerbear.com/blog](https://www.bannerbear.com/blog/how-to-set-up-mcp-servers-in-cursor/) the badge sits on the server's docs page as an "Add to Cursor" button that wraps the deeplink. No official Markdown/HTML embed snippet has been documented — third parties typically use a plain anchor:

```html
<a href="cursor://anysphere.cursor-deeplink/mcp/install?name=onemem&config=BASE64">
  Add to Cursor
</a>
```

---

## Trust / approval model

Two modes ([cursor.com/docs/context/mcp](https://cursor.com/docs/context/mcp)):
- **Default** — Agent requests approval before executing any MCP tool. User sees the tool name + arguments and approves/denies inline in chat.
- **Auto-run** — Tools execute without prompting. Configured via `~/.cursor/permissions.json` per-tool / per-server.

Enable / disable servers (without deleting config): Settings → Features → Model Context Protocol → toggle per server.

No hook lifecycle. No script-based interception. No `PreToolUse`/`PostToolUse` equivalent. Cursor's only programmatic touchpoint for memory or trace capture is *inside the MCP server itself* — the server sees the tool call payload, can mutate it, and returns the response.

---

## Distribution paths

1. **Cursor MCP Directory** — official marketplace inside Cursor. Listed servers get an auto-generated "Add to Cursor" button on their docs page. Submission process is via Cursor's marketplace listing (gated review).
2. **Manual install** — user edits `~/.cursor/mcp.json` themselves.
3. **Deeplink button** — embed the `cursor://` link on your own docs/landing page.
4. **Programmatic** (extension API): `vscode.cursor.mcp.registerServer()` — referenced in docs but minimally documented; suitable for Cursor-internal extensions only.

Smithery, MCP Hub, and other third-party directories also ship one-click Cursor deeplinks for their hosted servers ([smithery.ai/docs/use/deep-linking](https://smithery.ai/docs/use/deep-linking)).

---

## Cursor-specific surfaces beyond MCP (for context)

Even though OneMem only integrates via MCP, the broader Cursor extensibility surface includes:

- **Rules** (`.cursor/rules/*.mdc`) — Markdown files prepended to every chat. Project- and user-scoped. Not a plugin contract but the only way to inject persistent "system prompt"-style behavior.
- **`AGENTS.md`** at repo root — universal agent context file (Cursor, Codex, Antigravity, Claude Code all read it).
- **`settings.json`** — inherits VS Code's `settings.json` for editor preferences; no MCP fields here (MCP lives in `mcp.json`).
- **Composer / Chat modes** — built-in agent modes; not user-extensible.

No memory/context-injection API exists outside MCP tools + rules files. There is no equivalent to Claude Code's `SessionStart` `additionalContext` injection.

---

## Known issues / anti-patterns

- **No visual distinction between trusted and malicious deeplinks** ([proofpoint.com — CursorJack](https://www.proofpoint.com/us/blog/threat-insight/cursorjack-weaponizing-deeplinks-exploit-cursor-ide)) — the install dialog looks identical for any server. Treat third-party `cursor://` links as untrusted executables. Document a fingerprint/checksum users can verify.
- **No hooks** — cannot intercept tool calls outside MCP. If OneMem needs to capture Cursor's *native* tool calls (Read, Edit, Bash), there's no path — only calls routed through OneMem's own MCP tools are visible.
- **`url` vs `serverUrl` confusion** — Cursor uses `url` for remote MCP servers; Antigravity uses `serverUrl`. Don't share a single mcp.json config between the two.
- **Per-session disable is not granular** — toggling a server affects the whole workspace, not the current chat.
- **No telemetry to OneMem on auto-approved tool runs** outside MCP — Cursor doesn't notify external listeners when *its own* tools fire.

---

## OneMem implementation notes

**v0.1: pure MCP server (1 day).**

Install one-liner (generated deeplink):

```bash
# generate and copy to clipboard (macOS)
node -e 'console.log("cursor://anysphere.cursor-deeplink/mcp/install?name=onemem&config="+Buffer.from(JSON.stringify({command:"npx",args:["-y","@onemem/mcp"]})).toString("base64"))' | pbcopy
```

Or manual:

```jsonc
// ~/.cursor/mcp.json
{
  "mcpServers": {
    "onemem": {
      "command": "npx",
      "args": ["-y", "@onemem/mcp"],
      "env": { "ONEMEM_NAMESPACE": "${workspaceFolder}" }
    }
  }
}
```

Tools exposed by `@onemem/mcp` to Cursor: `add_memory`, `search_memory`, `get_memory`, `update_memory`, `delete_memory`, `replay_session`, `verify_trace`, `share_namespace`.

**Capture strategy.** Since there are no hooks, capture happens *inside* the MCP tool implementations:
- Every `add_memory` call → emit `ActionCall` Move object + Walrus blob.
- Every `search_memory` call → log query + emit retrieval `ActionCall`.
- For native Cursor tool calls (Read/Edit/Bash) that don't route through OneMem MCP: **no capture is possible**. Document this limitation; the trace pillar will be incomplete on Cursor compared to Claude Code or Codex.

**Distribution:**
1. Publish `@onemem/mcp` to npm.
2. Submit to Cursor MCP Directory (auto-generates "Add to Cursor" button).
3. Embed the deeplink on `onemem.xyz/install` as the canonical install path.
4. README install snippet generates the deeplink + shows the manual `mcp.json` fallback.
