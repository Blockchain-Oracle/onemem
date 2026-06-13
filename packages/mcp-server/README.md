# @onemem/mcp

A stdio MCP server exposing OneMem's verifiable memory + trace surface to any
MCP-compatible runtime (Claude Code, Cursor, Codex, Windsurf, Cline, …).

## Tools

| Tool | What it does |
|---|---|
| `onemem_verify_session` | Off-chain Merkle verification of a trace session (read-only) |
| `onemem_create_namespace` | Mint a `MemoryNamespace` + Admin cap (Seal policy = OneMem package) |
| `onemem_share_readwrite` | Mint a ReadWrite capability |
| `onemem_open_session` | Open a `TraceSession` |
| `onemem_record_call` | Emit + close one ActionCall; input/output Seal-encrypted → Walrus, on-chain hash over plaintext |
| `onemem_close_session` | Lock the Merkle root + mark completed |

## Configuration (env)

- `SUI_NETWORK` — `testnet` (default active) | `mainnet` | `devnet` | `local`
- `ONEMEM_PRIVATE_KEY` — a `suiprivkey1…` secret. Falls back to the active sui
  CLI keystore's first Ed25519 key.

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
