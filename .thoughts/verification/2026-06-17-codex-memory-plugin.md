# Verification: Codex Memory Plugin

Date: 2026-06-17

## Scope

Verify the first OneMem Codex plugin slice:

- `packages/plugin-codex` exists as a Codex plugin package.
- MCP memory/search/verify tools are bundled through `.mcp.json`.
- Optional hook scripts handle Codex-shaped JSON defensively.
- Docs no longer route Codex plugin work to the old deferred bucket.

## Files Checked

- `packages/plugin-codex/.codex-plugin/plugin.json`
- `packages/plugin-codex/.mcp.json`
- `packages/plugin-codex/hooks/hooks.json`
- `packages/plugin-codex/scripts/*.js`
- `packages/plugin-codex/scripts/onemem-lib.mjs`
- `packages/plugin-codex/skills/onemem-codex/SKILL.md`
- `packages/plugin-codex/tests/plugin.test.ts`
- `docs/05-our-architecture/03-runtimes/codex-cli-integration.md`
- `docs/03-target-runtimes/codex-cli-deep.md`
- `docs/03-target-runtimes/README.md`
- `apps/docs/integrations/runtimes.mdx`
- `packages/mcp-server/README.md`
- `tests/structure.test.ts`

## Evidence

Workspace dependency linking:

```bash
pnpm install
```

Result: passed. The new package was linked into the pnpm workspace.

Focused package tests:

```bash
pnpm --filter @onemem/codex-plugin test
```

Result: passed. Vitest ran 6 tests:

- `SessionStart` returns valid Codex JSON context without trace config.
- `PostToolUse` buffers a Codex-shaped `tool_output` payload into temp
  `PLUGIN_DATA` without network work.
- `Stop` exits successfully and writes valid JSON when trace config is absent.
- `Stop` preserves buffered calls when trace client setup fails.
- `PostToolUse` skips buffering while Codex trace capture is paused by runtime
  policy.
- `Stop` clears local state and buffers while Codex trace capture is paused by
  runtime policy.

Focused package lint:

```bash
pnpm --filter @onemem/codex-plugin lint
```

Result: passed. Biome checked the plugin package with no fixes needed after the
test harness was scoped to temp `PLUGIN_DATA`.

Codex plugin validator:

```bash
uv run --with pyyaml python /Users/abu/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/abu/dev/hackathon/sui-overflow/onemem/packages/plugin-codex
```

Result: passed.

Important note: the validator and installed first-party Codex plugins use
`.mcp.json` with a top-level `mcpServers` object. The package now uses that
shape.

Structure test:

```bash
pnpm test:structure
```

Result: passed. Node test reported 138 passing checks, including the new
`packages/plugin-codex` TypeScript package checks, Codex plugin entrypoint
checks, repo-local marketplace checks, workspace dependency resolution, and
Context Engineering artifact inventory.

Local Codex CLI:

```bash
which codex
codex --version
```

Result:

- `/opt/homebrew/bin/codex`
- `codex-cli 0.140.0`

Temporary Codex marketplace/install proof:

```bash
tmp_home=$(mktemp -d)
CODEX_HOME="$tmp_home" codex plugin marketplace add /Users/abu/dev/hackathon/sui-overflow/onemem --json
CODEX_HOME="$tmp_home" codex plugin list --available --json
CODEX_HOME="$tmp_home" codex plugin add onemem-codex@onemem-local --json
rm -rf "$tmp_home"
```

Result: passed without mutating the user's real Codex config. Codex discovered
`onemem-codex@onemem-local` from `.agents/plugins/marketplace.json` and
installed version `0.1.0` into the temporary plugin cache.

Docs stale-language scan:

```bash
rg -n "<stale Codex-deferred and old browser-tooling patterns>" docs apps packages README.md CLAUDE.md AGENTS.md .thoughts --glob '!docs/05-our-architecture/00-overview/PRODUCT_INVENTORY.md'
```

Result: remaining matches are only in the research/spec artifacts that describe
the stale state being fixed.

## Source Research Used

- Context7 `/openai/codex` docs.
- OpenAI Codex plugin docs:
  `https://developers.openai.com/codex/plugins/build`
- OpenAI Codex hooks docs:
  `https://developers.openai.com/codex/hooks`
- OpenAI Codex MCP docs:
  `https://developers.openai.com/codex/mcp`
- Local installed Codex plugin examples under:
  `/Users/abu/.codex/plugins/cache/openai-curated/openai-developers/43313cc9`
  and `/Users/abu/.codex/plugins/cache/openai-bundled/computer-use/1.0.809`.

## What Is Verified

- Codex plugin package structure is present and validator-compatible.
- Repo-local marketplace install works under a temporary `CODEX_HOME`.
- The plugin bundles OneMem MCP as the stable memory/search/verify path.
- Hook scripts are defensive with absent trace config.
- `PostToolUse` buffering works in local simulation with Codex-shaped
  `tool_output`.
- Failed trace client setup does not silently delete buffered tool calls.
- Docs and public runtime page now describe Codex support as current, not
  deferred.
- Old browser-tooling wording in the historical setup doc was replaced with the
  Codex Chrome plugin guidance.

## What Is Not Yet Verified

- The plugin has not been installed into the user's active Codex config in this
  verification pass. Temporary `CODEX_HOME` marketplace add/list/install proof
  did pass.
- `/hooks` trust has not been exercised in the Codex TUI.
- No live Codex hook session has emitted an on-chain OneMem `TraceSession`.

Therefore, this slice verifies MCP-first Codex plugin packaging and simulated
hook behavior. It does not claim complete Claude Code parity for automatic
Codex tool-call tracing.
