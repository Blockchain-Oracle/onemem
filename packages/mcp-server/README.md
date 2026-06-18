# @onemem/mcp

A stdio MCP server exposing OneMem's verifiable memory + trace surface to any
MCP-compatible runtime (Claude Code, Cursor, Codex, Windsurf, Cline, …).

## Tools (memory-centric)

| Tool | What it does |
|---|---|
| `onemem_add_memory` | Remember: client-side Seal-encrypt → Walrus via MemWal (relayer never sees plaintext); returns blob id + attestation |
| `onemem_search_memory` | Recall: vector search → download → Seal-decrypt; ranked memories (relevance 0–1) |
| `onemem_verify_trace` | Off-chain Merkle verification of a trace session (read-only) |
| `onemem_trace_session` | List the ActionCalls in a session |
| `onemem_replay_session` | Reconstruct a replayable session transcript from on-chain events |
| `onemem_share_namespace` | Mint + transfer a ReadWrite/ReadOnly capability (on-chain sharing) |
| `onemem_revoke_namespace_capability` | Admin-revoke a capability by ID; object remains but OneMem gates reject it |

`get/update/delete_memory` are v0.2 (MemWal 0.0.5 has no get/update/delete primitive).

## Configuration (env)

- `SUI_NETWORK` — `testnet` (default active) | `mainnet` | `devnet` | `local`
- `ONEMEM_PRIVATE_KEY` — a `suiprivkey1…` secret. Falls back to the active sui
  CLI keystore's first Ed25519 key.
- **Memory tools** need MemWal creds: `ONEMEM_ACCOUNT_ID`, `ONEMEM_DELEGATE_KEY`,
  `ONEMEM_EMBEDDING_API_KEY` (OpenAI), `MEMWAL_PACKAGE_ID`, `MEMWAL_RELAYER_URL`.
  Without them the server still runs (verify/trace tools work); memory tools
  report not-configured.

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

Then ask the agent: *"verify OneMem session 0x08f4ef5b…"* → it calls
`onemem_verify_trace` and reports `ok: true`.

## Install into Codex

Preferred path: install the Codex plugin package from the OneMem repository
marketplace.
It bundles this MCP server through `.mcp.json` and adds an optional OneMem skill
and trusted hook layer.

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
