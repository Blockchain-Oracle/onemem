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
| `onemem_share_namespace` | Mint + transfer a ReadWrite/ReadOnly capability (on-chain sharing) |

`get/update/delete_memory` + `replay_session` are v0.2 (MemWal 0.0.5 has no get/update/delete primitive).

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
# from a built checkout
claude mcp add onemem -- node /absolute/path/to/packages/mcp-server/dist/index.js
# or, once published:  claude mcp add onemem -- npx -y @onemem/mcp
```

Or add to `.mcp.json` / your client's MCP config:

```json
{
  "mcpServers": {
    "onemem": {
      "command": "node",
      "args": ["/absolute/path/to/packages/mcp-server/dist/index.js"],
      "env": { "SUI_NETWORK": "testnet" }
    }
  }
}
```

Then ask the agent: *"verify OneMem session 0x08f4ef5b…"* → it calls
`onemem_verify_session` and reports `ok: true`.

Spec: `docs/05-our-architecture/03-runtimes/mcp-server.md`.
