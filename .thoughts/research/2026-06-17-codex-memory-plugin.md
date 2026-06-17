# Reality Research: Codex Memory Plugin

## Scope

Current reality for adding a OneMem integration to OpenAI Codex that is
comparable to the existing Claude Code plugin, with emphasis on current Codex
plugin/MCP/hook support and what the OneMem repo already has.

## Sources Checked

- Context7 `/openai/codex` docs for Codex CLI plugin, hook, MCP, and AGENTS.md
  behavior.
- OpenAI Codex docs:
  - `https://developers.openai.com/codex/plugins/build`
  - `https://developers.openai.com/codex/hooks`
  - `https://developers.openai.com/codex/mcp`
  - `https://developers.openai.com/codex/guides/agents-md`
- OpenAI Codex source/docs:
  - `https://github.com/openai/codex`
- Repo files:
  - `packages/plugin-claude-code/*`
  - `packages/mcp-server/*`
  - `docs/05-our-architecture/03-runtimes/codex-cli-integration.md`
  - `docs/03-target-runtimes/codex-cli-deep.md`
  - `docs/05-our-architecture/03-runtimes/claude-code-plugin.md`
  - `apps/docs/quickstart.mdx`
  - `docs/06-references/CANONICAL_URLS.md`

## Verified Facts

- Codex stores MCP server configuration in `config.toml`; Codex CLI and the IDE
  extension share that configuration.
- Codex supports stdio MCP servers with `command`, `args`, `env`, `env_vars`,
  and `cwd`.
- Codex plugins can include a `.codex-plugin/plugin.json` manifest and bundle
  skills, MCP server configuration, apps, and lifecycle hooks.
- Plugin manifests can point `mcpServers` at a `.mcp.json` file.
- Installed first-party Codex plugins on this machine use `.mcp.json` with a
  top-level `mcpServers` object, and the local plugin validator accepts that
  shape.
- Codex checks `hooks/hooks.json` by default for plugin hooks, even without a
  top-level `hooks` manifest field.
- Plugin hook commands receive `PLUGIN_ROOT` and `PLUGIN_DATA`. Codex also sets
  `CLAUDE_PLUGIN_ROOT` and `CLAUDE_PLUGIN_DATA` for compatibility.
- Codex plugin hooks are non-managed hooks by default and must be reviewed and
  trusted by the user before they run.
- Codex hook docs include `SessionStart`, `PreToolUse`, `PostToolUse`,
  `SubagentStart`, `SubagentStop`, `UserPromptSubmit`, `PreCompact`,
  `PostCompact`, `PermissionRequest`, and `Stop`.
- `SessionStart` can return `hookSpecificOutput.additionalContext` to inject
  extra developer context.
- `PostToolUse` includes `tool_name`, `tool_use_id`, `tool_input`, and a tool
  result field according to the current hook contract.
- `Stop` expects JSON on stdout when a hook exits successfully.
- The current OneMem repo has a Claude Code plugin under
  `packages/plugin-claude-code`, but no `packages/plugin-codex`.
- The Claude Code plugin opens a trace session at `SessionStart`, buffers tool
  calls locally at `PostToolUse`, and flushes encrypted trace calls at
  `SessionEnd`.
- OneMem already has an MCP server package, `@onemem/mcp`, exposing memory and
  trace tools.
- Existing OneMem Codex architecture docs still describe a native Codex plugin
  as deferred, which is now stale relative to current Codex plugin docs.

## Inferences

- A Codex-native OneMem plugin can exist now as an installable Codex plugin.
- The most stable first slice is to bundle the existing `@onemem/mcp` server in
  a Codex plugin so Codex users get memory/search/verify tools through the
  native plugin install flow.
- Optional lifecycle hooks can reuse the Claude Code plugin's defensive
  buffering pattern, but they must follow Codex-specific event names and stdout
  requirements.
- Full built-in tool-call coverage should be treated as optional trace capture
  until hook behavior is verified against a live Codex CLI session.

## Unknowns And Questions

- The local Codex CLI exists at version `codex-cli 0.140.0`, but plugin hooks
  still need a live trust/session test before claiming full trace capture.
- Whether the user's active Codex configuration has plugin hooks trusted for
  this package.
- Whether current Codex `PostToolUse` payloads always use `tool_output`, or
  whether compatibility with `tool_response` remains useful for ported scripts.
- Whether OneMem should later publish a standalone external plugin repository or
  keep the plugin package inside this monorepo for the hackathon.

## Not Included

- No claim that Codex hook capture has been live-tested through a real Codex TUI
  session yet.
- No hosted plugin marketplace publication.
- No automatic key minting or hosted credential flow.
