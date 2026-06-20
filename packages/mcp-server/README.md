# @onemem/mcp

A stdio MCP server exposing OneMem's decentralized memory surface to any
MCP-compatible runtime (Claude Code, Cursor, Codex, Windsurf, Cline, …).

## Tools (memory-centric)

| Tool | What it does |
|---|---|
| `onemem_add_memory` | Remember: client-side Seal-encrypt → Walrus via MemWal (relayer never sees plaintext); returns memory id + blob id |
| `onemem_search_memory` | Recall: vector search → download → Seal-decrypt; ranked memories (relevance 0–1) |
| `onemem_get_memory` | Fetch one stored memory by id (excludes soft-deleted) |
| `onemem_list_memories` | List stored memories, newest-first, filtered by user/agent/run/namespace/metadata |
| `onemem_delete_memory` | Soft-delete a memory by id; the encrypted Walrus blob persists until its storage epoch expires |

MemWal 0.0.7 is append-only (no get/get-all/delete primitive), so `get`/`list`
are served from a local index that mirrors every write, and `delete` is a
soft-delete in that index.

## Configuration (env)

- `SUI_NETWORK` — `testnet` (default active) | `mainnet` | `devnet` | `local`
- `ONEMEM_PRIVATE_KEY` — a `suiprivkey1…` secret. Falls back to the active sui
  CLI keystore's first Ed25519 key.
- **Memory tools** need MemWal creds: `ONEMEM_ACCOUNT_ID`, `ONEMEM_DELEGATE_KEY`,
  `ONEMEM_EMBEDDING_API_KEY` (OpenAI), `MEMWAL_PACKAGE_ID`, `MEMWAL_RELAYER_URL`.
  Without them the server still starts, but the memory tools report
  not-configured until the creds are present.

## Install into Claude Code

```bash
claude mcp add onemem -- npx -y @onemem/mcp@latest
```

From a development checkout, use the built local entry instead:

```bash
claude mcp add onemem -- node /absolute/path/to/packages/mcp-server/dist/index.js
```

Or add the published server to `.mcp.json` / your client's MCP config:

```json
{
  "mcpServers": {
    "onemem": {
      "command": "npx",
      "args": ["-y", "@onemem/mcp@latest"],
      "env": { "SUI_NETWORK": "testnet" }
    }
  }
}
```

Then ask the agent: *"save this decision to OneMem"* or *"search OneMem for what
we decided about X"* → it calls `onemem_add_memory` / `onemem_search_memory`.

## Install into Codex

Preferred path: install the Codex plugin package from the OneMem repository
marketplace.
It bundles this MCP server through `.mcp.json` and adds an optional OneMem skill
and a local-dashboard hook layer.

```bash
codex plugin marketplace add Blockchain-Oracle/onemem --json
codex plugin add onemem-codex@onemem --json
```

Manual MCP-only path:

```toml
[mcp_servers.onemem]
command = "npx"
args = ["-y", "@onemem/mcp@latest"]
env_vars = ["SUI_NETWORK", "ONEMEM_CREDENTIALS_PATH", "ONEMEM_ACCOUNT_ID", "ONEMEM_DELEGATE_KEY", "ONEMEM_EMBEDDING_API_KEY", "MEMWAL_PACKAGE_ID", "MEMWAL_RELAYER_URL"]
```

Spec: `docs/05-our-architecture/03-runtimes/mcp-server.md`.
