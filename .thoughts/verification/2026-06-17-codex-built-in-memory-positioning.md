# Verification: Codex Built-In Memory Positioning

Date: 2026-06-17

## Scope

Verify the docs/context cleanup that positions OneMem alongside Codex built-in
Memories and Chronicle.

## Evidence

- Context7 resolved the official Codex CLI docs as `/openai/codex`.
- Context7 docs confirmed current plugin marketplace, MCP server config, and hook
  event shapes.
- Official OpenAI Codex Memories docs confirm built-in memories are local Codex
  state under `~/.codex/memories/` and are controlled with `/memories`.
- Official OpenAI Chronicle docs confirm Chronicle is opt-in, macOS-only research
  preview, and stores generated memories under
  `$CODEX_HOME/memories_extensions/chronicle/`.
- Official OpenAI hooks docs confirm plugin-bundled hooks load from
  `hooks/hooks.json`, receive `PLUGIN_ROOT` / `PLUGIN_DATA`, and require trust.

## Result

- `packages/plugin-codex/README.md` now says OneMem coexists with Codex Memories
  and does not write `~/.codex/memories`.
- `packages/plugin-codex/skills/onemem-codex/SKILL.md` now tells Codex not to
  treat built-in Memories as the OneMem backend.
- `docs/03-target-runtimes/README.md` now lists built-in Codex Memories /
  Chronicle as the incumbent local memory feature and describes Codex
  distribution as plugin-first with manual MCP config as fallback.
- `docs/03-target-runtimes/codex-cli-deep.md` now treats `plugin_hooks = true`
  as a legacy-build troubleshooting note instead of a current install
  requirement.
- Sub-agent audit findings were reconciled: current and historical runtime docs
  now describe the Codex v0.1 hook path as `PostToolUse` buffering with `Stop`
  flush, not `PreToolUse + PostToolUse`; the stale Codex verification test count
  is corrected from 4 to 6; and the Claude Code plugin package now includes the
  `.claude-plugin/plugin.json` manifest that its package metadata already
  claimed.

## Verification

```bash
pnpm test:structure
```

Result: passed. Node reported 189 checks passing.

After reconciling the sub-agent audit:

```bash
pnpm --filter @onemem/codex-plugin test
pnpm --filter @onemem/codex-plugin lint
pnpm --filter @onemem/claude-code-plugin test
pnpm --filter @onemem/claude-code-plugin lint
pnpm test:structure
git diff --check
```

Results:

- `@onemem/codex-plugin`: 6 tests passed.
- `@onemem/codex-plugin` lint passed.
- `@onemem/claude-code-plugin`: 4 tests passed; 1 integration test skipped by
  the package test suite.
- `@onemem/claude-code-plugin` lint passed.
- `pnpm test:structure` passed with 191 checks.
- `git diff --check` passed.
