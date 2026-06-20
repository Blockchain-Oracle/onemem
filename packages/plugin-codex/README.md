# @onemem/codex-plugin

OneMem plugin for Codex. It gives Codex a first-class installable package for
**decentralized, portable memory** — store, search, and recall context that lives
on Walrus (client-side Seal-encrypted via MemWal) and is owned by you across
runtimes.

## What Works Now

- Bundles the OneMem MCP server through `.mcp.json`.
- Exposes OneMem memory tools (store / search / recall / list / delete) after the
  plugin is installed and the MCP server is enabled.
- Includes optional lifecycle hooks that stream a live local dashboard view:
  - `SessionStart` registers the session with the local OneMem worker.
  - `PostToolUse` posts each Codex tool call to the worker so the dashboard fills
    up live.
  - `Stop` marks the session ended so the dashboard shows it closed.

MCP memory tools are the durable baseline. The hooks talk only to the local
OneMem worker for the live dashboard view.

## Codex Memories Compatibility

Codex has its own local Memories and Chronicle features. OneMem does not write to
`~/.codex/memories`, does not replace `/memories`, and should not be described as
the built-in Codex memory backend.

Use Codex Memories for local preferences, recurring workflows, and project
conventions that only need to live inside Codex. Use OneMem when the memory needs
to be portable across runtimes, encrypted through Seal, and stored on
Walrus/MemWal so you own it.

## Configure Memory Tools

The bundled MCP config forwards these env variable names when present:

- `ONEMEM_CREDENTIALS_PATH`
- `ONEMEM_ACCOUNT_ID`
- `ONEMEM_DELEGATE_KEY`
- `ONEMEM_EMBEDDING_API_KEY`
- `MEMWAL_PACKAGE_ID`
- `MEMWAL_RELAYER_URL`
- `ONEMEM_MEMWAL_NAMESPACE`
- `SUI_NETWORK`

`onemem login` credentials also work through the shared SDK resolver.

## Configure Optional Dashboard Hooks

The lifecycle hooks talk to the local OneMem worker — no on-chain config needed:

- `ONEMEM_WORKER_URL` — local worker URL (default `http://127.0.0.1:4041`).
- `ONEMEM_WORKER_AUTOSTART` / `ONEMEM_WORKER_COMMAND` — control worker autostart.

Codex requires non-managed hooks to be reviewed and trusted before they run. Use
`/hooks` in Codex after installing or changing the plugin.

## Install From The Public Repository Marketplace

```bash
codex plugin marketplace add Blockchain-Oracle/onemem --json
codex plugin add onemem-codex@onemem --json
```

After install, use `/hooks` in Codex to review and trust the optional lifecycle
hooks if you want the live local dashboard. MCP memory tools work without hook
trust.

This GitHub marketplace path requires `.agents/plugins/marketplace.json` and
`packages/plugin-codex/` to be present on the branch Codex fetches. By default
Codex fetches the repository's default branch; use `--ref <branch>` only for
pre-release testing.

## Install From A Local Checkout During Development

This repo includes a local Codex marketplace manifest at
`.agents/plugins/marketplace.json`.

```bash
codex plugin marketplace add /absolute/path/to/onemem --json
codex plugin add onemem-codex@onemem --json
```

After install, use `/hooks` in Codex to review and trust the optional lifecycle
hooks if you want the live local dashboard. MCP memory tools work without hook
trust.

Spec:
`docs/05-our-architecture/03-runtimes/codex-cli-integration.md`.
