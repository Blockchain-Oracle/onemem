# @onemem/codex-plugin

OneMem plugin for Codex. It gives Codex a first-class installable package for
portable memory and verifiable trace workflows.

## What Works Now

- Bundles the OneMem MCP server through `.mcp.json`.
- Exposes OneMem memory/search/verify tools after the plugin is installed and
  the MCP server is enabled.
- Includes optional lifecycle hooks for trace capture:
  - `SessionStart` arms local trace capture state when trace env vars exist.
  - `PostToolUse` buffers Codex tool calls locally without network work.
  - `Stop` flushes buffered calls to Sui/Walrus and closes the trace session
    when trace config and client setup succeed.

MCP memory tools are the stable baseline. Hook trace capture depends on Codex
hook trust and `ONEMEM_NAMESPACE_ID` / `ONEMEM_RW_CAP_ID` configuration.

## Codex Memories Compatibility

Codex has its own local Memories and Chronicle features. OneMem does not write to
`~/.codex/memories`, does not replace `/memories`, and should not be described as
the built-in Codex memory backend.

Use Codex Memories for local preferences, recurring workflows, and project
conventions that only need to live inside Codex. Use OneMem when the memory or
trace needs to be portable across runtimes, encrypted through Seal, stored on
Walrus/MemWal, or verifiable against Sui.

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

## Configure Optional Trace Hooks

For lifecycle trace capture, configure:

- `ONEMEM_NAMESPACE_ID`
- `ONEMEM_RW_CAP_ID`
- `ONEMEM_PRIVATE_KEY` or a local Sui keystore
- `SUI_NETWORK`

Codex requires non-managed hooks to be reviewed and trusted before they run. Use
`/hooks` in Codex after installing or changing the plugin.

Proof note, 2026-06-19: a local marketplace install of
`onemem-codex@onemem` v0.1.2 on Codex CLI 0.140 was trusted through the
interactive hook review UI and emitted a real testnet `TraceSession`:
`0x0c88317632dcd386b6f81b94ee510003ba107d3c4bfa035ba8072fca8304e330`.
`onemem verify` returned `ok: true`, `callCount: 1`, and matching Merkle roots.
The older local `codex exec` tests on Codex CLI 0.140 still did not run hooks,
so `codex exec` is not treated as the hook-proof path.

## Install From The Public Repository Marketplace

```bash
codex plugin marketplace add Blockchain-Oracle/onemem --json
codex plugin add onemem-codex@onemem --json
```

After install, use `/hooks` in Codex to review and trust the optional lifecycle
hooks if you want trace capture. MCP memory tools work without hook trust.

This GitHub marketplace path requires `.agents/plugins/marketplace.json` and
`packages/plugin-codex/` to be present on the branch Codex fetches. By default
Codex fetches the repository's default branch; use `--ref <branch>` only for
pre-release testing.

Publication claim boundary: this install path provides the stable MCP layer and
ships optional hook scripts that flush through the current published
`@onemem/sdk-ts` trace CLI. Live hook trace capture is proven for the patched
v0.1.2 local marketplace install above, but users still must review and trust
the optional hooks after install or hook changes.

## Install From A Local Checkout During Development

This repo includes a local Codex marketplace manifest at
`.agents/plugins/marketplace.json`.

```bash
codex plugin marketplace add /absolute/path/to/onemem --json
codex plugin add onemem-codex@onemem --json
```

After install, use `/hooks` in Codex to review and trust the optional lifecycle
hooks if you want trace capture. MCP memory tools work without hook trust.

Spec:
`docs/05-our-architecture/03-runtimes/codex-cli-integration.md`.
