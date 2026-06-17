# Stories: Codex Memory Plugin

## Traceability

- Spec: `.thoughts/specs/2026-06-17-codex-memory-plugin.md`
- Research: `.thoughts/research/2026-06-17-codex-memory-plugin.md`

## Story 1: Installable Codex Memory Tools

As a Codex user,
I want to install OneMem as a Codex plugin,
so that Codex can save, search, and verify memory through the bundled OneMem MCP
server.

### Acceptance Criteria

- The plugin manifest points at a valid `.mcp.json`.
- `.mcp.json` configures an `onemem` stdio MCP server.
- The server command uses the published `@onemem/mcp` package.
- The expected OneMem env variable names are forwarded.

### Scenarios

- Given the plugin is installed and MCP is enabled, when I ask Codex to save or
  search memory, then Codex has OneMem MCP tools available.

### Notes

This story does not require lifecycle hooks to be trusted.

## Story 2: Non-blocking Codex Tool Capture

As a Codex user with OneMem trace env configured,
I want Codex tool calls to be buffered quickly,
so that trace capture does not slow down my coding session.

### Acceptance Criteria

- `PostToolUse` hook script accepts Codex-shaped payloads.
- The hook writes a local JSONL buffer and exits `0`.
- The hook does not perform Sui, Walrus, or Seal work.

### Scenarios

- Given a session state exists, when `PostToolUse` receives `tool_output`, then
  the buffered call stores the tool name, input, and output.

### Notes

Network flushing belongs to `Stop`, not `PostToolUse`.

## Story 3: Honest Codex Coverage Docs

As a OneMem developer,
I want Codex docs to distinguish MCP coverage from hook trace coverage,
so that we do not overclaim parity with Claude Code before live hook proof.

### Acceptance Criteria

- Runtime docs identify the plugin as present.
- Docs state that MCP memory tools are the stable baseline.
- Docs state that hook trace capture requires trust/config and still needs live
  Codex session proof.

### Scenarios

- Given a future agent reads the docs, when it evaluates Codex support, then it
  sees what is built and what remains unverified.

## Open Questions

- Whether an external marketplace package should share the monorepo package name
  or live in a separate `onemem/codex-plugin` repository.
