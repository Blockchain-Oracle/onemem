# MCP Server — `@onemem/mcp` (Pillar 6)

> Current note, 2026-06-17: this is a historical design document. Current tool
> truth lives in `packages/mcp-server/src/index.ts` and
> `packages/mcp-server/README.md`; current v0.1 exposes 6 prefixed tools, not
> the 9-tool design below.

Universal stdio MCP server. Ship once; consumed by every MCP-capable runtime: Cursor, Windsurf, Cline, OpenCode, VS Code Copilot, Codex CLI, Antigravity, Claude Desktop.

This is **Pillar 6** in the inventory; lives in `03-runtimes/` because every runtime that's NOT a native plugin consumes this server.

---

## Package layout

```
onemem-mcp/
├── package.json
├── README.md
├── LICENSE
├── src/
│   ├── index.ts                       # stdio server entry
│   ├── server.ts                      # MCP server (uses @modelcontextprotocol/sdk)
│   ├── tools/
│   │   ├── add_memory.ts
│   │   ├── search_memory.ts
│   │   ├── get_memory.ts
│   │   ├── update_memory.ts
│   │   ├── delete_memory.ts
│   │   ├── replay_session.ts          # OneMem-unique
│   │   ├── verify_trace.ts            # OneMem-unique
│   │   ├── share_namespace.ts         # OneMem-unique
│   │   └── trace_session.ts           # OneMem-unique
│   ├── login.ts                       # `onemem-mcp login` subcommand
│   └── credentials.ts                 # ~/.onemem/credentials.json reader
└── bin/
    └── onemem-mcp                     # executable entry
```

---

## `package.json`

```json
{
  "name": "@onemem/mcp",
  "version": "0.1.0",
  "description": "OneMem MCP server — verifiable agent memory + trace for any MCP-capable client",
  "license": "Apache-2.0",
  "bin": {
    "onemem-mcp": "./bin/onemem-mcp"
  },
  "main": "./dist/index.js",
  "type": "module",
  "files": ["dist", "bin", "README.md", "LICENSE"],
  "scripts": {
    "build": "tsup",
    "start": "node ./bin/onemem-mcp"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.x",
    "@onemem/sdk-ts": "^0.1.0",
    "commander": "^11.x"
  }
}
```

---

## Tool surface (historical 9-tool design)

These map 1:1 to the SDK's memory + trace + namespace API.

| MCP tool | SDK call | Purpose |
|---|---|---|
| `onemem_add_memory` | `client.requireMemory().add(text, opts)` | Write a memory |
| `onemem_search_memory` | `client.requireMemory().search(query, opts)` | Semantic memory search |
| `onemem_verify_trace` | `client.traces.verifySession(id)` | Walk Merkle chain; return verification status |
| `onemem_trace_session` | `client.traces.getCalls(id)` | List calls in a trace session |
| `onemem_replay_session` | `client.traces.replaySession(id)` | Reconstruct session metadata + calls from chain |
| `onemem_share_namespace` | `client.namespaces.shareReadOnly/ReadWrite(...)` | Mint + transfer capability |
| `onemem_revoke_namespace_capability` | `client.namespaces.adminRevokeCapability(...)` | Admin marker-revoke; object remains but gates reject it |

---

## Server implementation

```ts
// src/server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { OneMem } from "@onemem/sdk-ts";
import { readCredentials } from "./credentials.js";
import * as tools from "./tools/index.js";

const creds = readCredentials();
if (!creds) {
  console.error("[onemem-mcp] No credentials. Run: onemem-mcp login");
  process.exit(1);
}

const client = await OneMem.create({
  key: creds.delegateKey,
  accountId: creds.accountId,
  serverUrl: "https://relayer.memwal.ai",
  namespaceId: creds.activeNamespaceId,
  agentId: `mcp-client-${process.env.MCP_CLIENT_NAME ?? "unknown"}`,
  environment: process.env.ONEMEM_ENV ?? "production",
  network: "mainnet",
});

const server = new Server(
  { name: "onemem", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler("tools/list", () => ({
  tools: [
    tools.addMemory.schema,
    tools.searchMemory.schema,
    tools.verifyTrace.schema,
    tools.traceSession.schema,
    tools.replaySession.schema,
    tools.shareNamespace.schema,
    tools.revokeNamespaceCapability.schema,
  ],
}));

server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;
  const handler = tools.byName[name];
  if (!handler) throw new Error(`Unknown tool: ${name}`);
  return await handler.execute(args, client);
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

Each tool file follows the same shape — a `schema` (JSON Schema) + an `execute` function.

```ts
// src/tools/verify_trace.ts
export const schema = {
  name: "onemem_verify_trace",
  description: "Verify the Merkle chain integrity of a OneMem trace session. Returns { verified, brokenAt?, details }.",
  inputSchema: {
    type: "object",
    properties: {
      session_id: { type: "string", description: "Sui object ID of the TraceSession" },
    },
    required: ["session_id"],
  },
};

export async function execute(args: { session_id: string }, client: OneMem) {
  const result = await client.trace.verifySession(args.session_id);
  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
  };
}
```

---

## Per-runtime install patterns

### Cursor (`.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "onemem": {
      "command": "npx",
      "args": ["-y", "@onemem/mcp@latest"],
      "env": {
        "MCP_CLIENT_NAME": "cursor"
      }
    }
  }
}
```

Or via deeplink: `cursor://anysphere.cursor-deeplink/mcp/install?name=onemem&config=<base64>`

### Windsurf (`.windsurf/mcp.json`)

Same shape as Cursor.

### Codex CLI (`~/.codex/config.toml`)

```toml
[mcp_servers.onemem]
command = "npx"
args = ["-y", "@onemem/mcp@latest"]
env = { MCP_CLIENT_NAME = "codex" }
```

### Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "onemem": {
      "command": "npx",
      "args": ["-y", "@onemem/mcp@latest"]
    }
  }
}
```

### Antigravity (`mcp_config.json`)

```json
{
  "mcpServers": {
    "onemem": {
      "command": "npx",
      "args": ["-y", "@onemem/mcp@latest"]
    }
  }
}
```

(Note: per `03-target-runtimes/antigravity-deep.md`, Antigravity's MCP config moved from `settings.json` to `mcp_config.json` with the breaking `url` → `serverUrl` rename. We don't use `url`/`serverUrl` for stdio — we use `command`/`args`, so the rename doesn't bite us.)

### Cline / OpenCode / VS Code Copilot

Same pattern; each has its own MCP config file. Documentation per `03-target-runtimes/README.md`.

---

## One-line install via `npx mcp-add` (planned)

If a community tool like `mcp-add` exists, ship a config:

```bash
npx mcp-add @onemem/mcp --client all
```

Auto-writes config to every detected MCP-capable runtime on the machine.

(If `mcp-add` doesn't exist, OneMem ships its own: `onemem-cli install --runtime <id>` per Pillar 5.)

---

## Login flow

```bash
npx -y @onemem/mcp@latest login
# Opens browser → wallet → MemWalAccount → credentials saved to ~/.onemem/credentials.json
# Subsequent runs auto-read credentials
```

---

## What runtimes can / can't do via MCP-only (vs native plugin)

| Capability | Native plugin (Claude Code, OpenClaw, Hermes, Codex optional hooks) | MCP-only (Cursor, Windsurf, Cline, OpenCode, VS Code Copilot, Antigravity) |
|---|---|---|
| Auto-capture every tool call (hook into PostToolUse) | ✅ | ❌ — only captures calls routed through OneMem MCP tools |
| Auto-recall memory on every session start | ✅ | ❌ — user / agent must explicitly call `onemem_search_memory` |
| Cross-runtime trace composition | ✅ | Partial — only OneMem-routed calls compose |
| Verify / replay / share via slash commands | ✅ (in-chat) | ✅ (via MCP tool call from agent) |

Important: Codex is no longer MCP-only because `packages/plugin-codex` bundles
MCP plus optional trusted hooks. The hook path still needs live `/hooks` proof
before claiming complete automatic Codex trace parity.

---

## Compatibility check

Every server startup runs the compatibility check from `02-sdks/compatibility-contract.md`. If SDK is below `minSupportedSdk`, log clear upgrade message + exit.

---

## Distribution

- npm: `@onemem/mcp` (executable via `npx -y @onemem/mcp@latest`)
- GitHub: `onemem/mcp-server`
- Docs: per-runtime install snippets at `docs.onemem.ai/runtimes/<runtime>`

---

## Cross-references

- `README.md` (this folder) — runtime matrix
- `claude-code-plugin.md` — Claude Code can ALSO consume this MCP for slash commands
- `../02-sdks/shared-api-surface.md` — SDK methods this server wraps
- `../../03-target-runtimes/cursor-mcp-deep.md` — Cursor MCP config format (verified)
- `../../03-target-runtimes/codex-cli-deep.md` — Codex CLI MCP integration
- `../../03-target-runtimes/antigravity-deep.md` — Antigravity MCP config (note: defer native plugin to v0.2)
