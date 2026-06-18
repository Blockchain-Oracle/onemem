# Codex CLI Integration - OneMem

OneMem now has a first-class Codex plugin package at
`packages/plugin-codex`.

The stable baseline is the bundled OneMem MCP server. Optional Codex lifecycle
hooks can add trace capture after the user reviews and trusts those hooks in
Codex.

Source-of-truth files:

- `packages/plugin-codex/README.md`
- `packages/plugin-codex/.codex-plugin/plugin.json`
- `packages/plugin-codex/.mcp.json`
- `packages/plugin-codex/hooks/hooks.json`
- `../../03-target-runtimes/codex-cli-deep.md`

---

## What Works Now

`@onemem/codex-plugin` ships:

- a Codex plugin manifest in `.codex-plugin/plugin.json`;
- a bundled MCP config in `.mcp.json` that launches `@onemem/mcp@latest`;
- a Codex skill at `skills/onemem-codex/SKILL.md`;
- optional `SessionStart`, `PostToolUse`, and `Stop` hooks under
  `hooks/hooks.json`;
- local hook tests that simulate Codex-shaped JSON payloads.

The MCP server gives Codex these OneMem tools:

- `onemem_add_memory`
- `onemem_search_memory`
- `onemem_verify_trace`
- `onemem_trace_session`
- `onemem_replay_session`
- `onemem_share_namespace`

MCP memory/search/verify is the dependable path. Hook trace capture is an
optional deeper path.

---

## Public Repository Marketplace Install

```bash
codex plugin marketplace add Blockchain-Oracle/onemem --json
codex plugin add onemem-codex@onemem --json
```

This is the production install path once the repository branch containing the
marketplace manifest is published.

## Local Checkout Install

The repo includes a local marketplace manifest:
`.agents/plugins/marketplace.json`.

```bash
codex plugin marketplace add /absolute/path/to/onemem --json
codex plugin add onemem-codex@onemem --json
```

This installs the plugin package and its bundled MCP config. After install, use
`/hooks` in Codex to review and trust optional lifecycle hooks if trace capture
is desired.

---

## Bundled MCP Server

The plugin manifest points Codex at the root `.mcp.json` file:

```json
{
  "skills": "./skills/",
  "mcpServers": "./.mcp.json"
}
```

The MCP config launches the published server:

```json
{
  "mcpServers": {
    "onemem": {
      "command": "npx",
      "args": ["-y", "@onemem/mcp@latest"],
      "env_vars": [
        "SUI_NETWORK",
        "ONEMEM_PRIVATE_KEY",
        "ONEMEM_CREDENTIALS_PATH",
        "ONEMEM_ACCOUNT_ID",
        "ONEMEM_DELEGATE_KEY",
        "ONEMEM_EMBEDDING_API_KEY",
        "ONEMEM_MEMWAL_NAMESPACE",
        "MEMWAL_PACKAGE_ID",
        "MEMWAL_RELAYER_URL"
      ]
    }
  }
}
```

Users who do not install the plugin can still configure MCP manually:

```toml
[mcp_servers.onemem]
command = "npx"
args = ["-y", "@onemem/mcp@latest"]
env_vars = [
  "SUI_NETWORK",
  "ONEMEM_CREDENTIALS_PATH",
  "ONEMEM_ACCOUNT_ID",
  "ONEMEM_DELEGATE_KEY",
  "ONEMEM_EMBEDDING_API_KEY",
  "MEMWAL_PACKAGE_ID",
  "MEMWAL_RELAYER_URL",
]
```

---

## Optional Trace Hooks

The plugin includes optional hooks:

| Event | Script | Behavior |
|---|---|---|
| `SessionStart` | `scripts/inject.js` | Adds OneMem guidance to the session and arms local trace state when trace env vars exist. |
| `PostToolUse` | `scripts/observe.js` | Buffers Codex tool-call payloads locally without network work. |
| `Stop` | `scripts/summarize.js` | Flushes buffered calls through the SDK and closes the trace session. |

Trace hooks require:

- `ONEMEM_NAMESPACE_ID`
- `ONEMEM_RW_CAP_ID`
- `ONEMEM_PRIVATE_KEY` or a configured local Sui keystore
- `SUI_NETWORK`

Codex treats plugin hooks as non-managed hooks. After install or hook edits, the
user must review/trust them with `/hooks` before Codex runs them.

---

## Coverage Model

| Path | Coverage | Trust requirement |
|---|---|---|
| Bundled MCP tools | OneMem memory/search/verify/share tool calls | No hook trust required |
| Optional plugin hooks | Codex lifecycle and tool-call trace buffering | `/hooks` trust required |
| Manual MCP config only | Same as MCP tools, without plugin skill/hooks | No plugin install |

Do not claim full Codex trace coverage unless a live Codex session has trusted
the hooks and verified `SessionStart`, `PostToolUse`, and `Stop` execution.

---

## Current Verification

Verified in this repo:

```bash
pnpm --filter @onemem/codex-plugin test
pnpm --filter @onemem/codex-plugin lint
pnpm test:structure
```

The unit tests prove:

- `SessionStart` uses an empty matcher so every hook-enabled Codex session
  source is eligible;
- `SessionStart` returns valid Codex JSON context without network config;
- `PostToolUse` buffers a Codex-shaped `tool_output` payload into
  `PLUGIN_DATA`;
- `Stop` exits successfully when trace config is absent.

Observed boundary, 2026-06-18: `codex exec` on Codex CLI 0.140 did not execute
user-level or plugin-local hooks in isolated `CODEX_HOME` proof attempts, even
with `hooks = true`, trusted projects, and `--dangerously-bypass-hook-trust`.
That makes `codex exec` unsuitable as the live automatic hook proof path for
this version.

Remaining proof needed before claiming Claude Code parity:

- install through an actual Codex plugin marketplace/local marketplace entry;
- trust hooks through `/hooks`;
- run a live Codex session and verify an on-chain OneMem `TraceSession`.

---

## Known Codex Constraints

Keep these constraints in mind when extending the plugin:

1. Plugin hooks are skipped until reviewed and trusted.
2. MCP memory tools are the reliability baseline; hook capture is additive.
3. Do not rely only on `PreToolUse` for trace capture. Current implementation
   intentionally starts with `PostToolUse`.
4. `Stop` hooks must return normal continuation JSON. Do not use inverted
   `decision: "block"` semantics here unless intentionally keeping Codex alive.
5. Do not claim `codex exec` hook coverage until the installed Codex version is
   proven to execute hooks in that mode.

---

## Cross-references

- `README.md` in this folder
- `mcp-server.md`
- `deferred-runtimes.md`
- `../../03-target-runtimes/codex-cli-deep.md`
