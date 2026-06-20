# @onemem/claude-code-plugin

OneMem plugin for Claude Code — **decentralized memory** for your coding agent,
plus a live local dashboard of each session's activity. Memory is stored through
MemWal (client-side Seal-encrypted blobs on Walrus — the relayer never sees
plaintext) and is owned by you across runtimes. Coexists with claude-mem
(local conversation summary); OneMem adds portable, owned memory you can store,
search, and recall.

**Publication note, 2026-06-19:** `@onemem/claude-code-plugin@0.1.1` is current on npm
after `pnpm registry:status --strict`, and the repository marketplace path is current.
Re-run that command before a fresh public install claim.

## How it works (hooks)

The lifecycle hooks register each session with a **local OneMem worker** and
stream readable tool-call observations to a **live local dashboard** — they keep
the editor responsive and never block Claude.

| Hook | Script | What it does |
|---|---|---|
| `SessionStart` | `inject.js` | Registers the session with the local OneMem worker |
| `PostToolUse` | `observe.js` | Posts each tool call to the worker instantly so the dashboard fills up live |
| `Stop` | `summarize.js` | Marks the session ended so the dashboard shows it closed |

The dashboard view is local. Durable memory (add/search/recall) is the MCP +
SDK surface below, encrypted on Walrus via MemWal.

## Configure (env)

The hooks talk to the local worker — no on-chain config is required for the live
dashboard:

- `ONEMEM_WORKER_URL` — local worker URL (default `http://127.0.0.1:4041`).
- `ONEMEM_WORKER_AUTOSTART` / `ONEMEM_WORKER_COMMAND` — control worker autostart.

Memory tools (the durable layer) read MemWal config from `onemem login`
credentials or env (`ONEMEM_ACCOUNT_ID`, `ONEMEM_DELEGATE_KEY`,
`ONEMEM_EMBEDDING_API_KEY`, `MEMWAL_PACKAGE_ID`, `MEMWAL_RELAYER_URL`,
`SUI_NETWORK`).

## Bundled MCP

The plugin root includes `.mcp.json`, so Claude Code exposes the OneMem MCP
server alongside the lifecycle hooks. The MCP server is the dependable
memory layer — `add` / `search` / `get` / `list` / `delete` — and works
independently of the dashboard hooks.

## Install From The Public Repository Marketplace

```bash
claude plugin marketplace add Blockchain-Oracle/onemem
claude plugin install onemem@onemem
```

This GitHub marketplace path requires `.claude-plugin/marketplace.json` and
`packages/plugin-claude-code/` to be present on the repository branch Claude Code
fetches.

## Install From A Local Checkout During Development

```bash
claude plugin marketplace add /absolute/path/to/onemem
claude plugin install onemem@onemem
```

Spec: `docs/05-our-architecture/03-runtimes/claude-code-plugin.md`.
