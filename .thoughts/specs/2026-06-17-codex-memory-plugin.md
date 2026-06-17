# Spec: Codex Memory Plugin

## Objective

Add a first-class OneMem plugin package for OpenAI Codex so Codex users can
install OneMem memory/search/verify tooling through Codex's plugin model, with
optional lifecycle hooks for verifiable trace capture.

## Background And Current Reality

OneMem already ships a Claude Code plugin and a generic MCP server. Current
Codex docs support plugin manifests, bundled MCP server config, bundled skills,
and plugin lifecycle hooks. The repo's older Codex integration docs still
describe native plugin support as deferred.

## Users

- Codex CLI users who want OneMem memory tools without hand-editing MCP config.
- Codex IDE/app users who share the same MCP configuration layer.
- OneMem developers validating cross-runtime parity with Claude Code.

## Goals

- Add `packages/plugin-codex` as an installable Codex plugin package.
- Bundle the existing `@onemem/mcp` server through `.mcp.json`.
- Include a Codex skill that tells Codex when and how to use OneMem memory and
  trace tools.
- Include defensive optional hooks for Codex trace capture.
- Keep hook scripts non-blocking and safe when OneMem trace env vars are absent.
- Add a repo-local Codex marketplace manifest for development install testing.
- Update docs and Context Engineering artifacts so native Codex plugin support
  is no longer described as deferred.

## Non-goals

- Do not publish to a public Codex marketplace in this slice.
- Do not require plugin hooks for basic memory/search usage.
- Do not claim full built-in Codex tool-call capture until a live Codex hook
  session proves it.
- Do not replace the existing `@onemem/mcp` package.
- Do not implement hosted credential mint/revoke flows.

## Requirements

- R1: `packages/plugin-codex` must have a valid `.codex-plugin/plugin.json`.
- R2: The plugin must include `.mcp.json` for the OneMem MCP server.
- R3: The plugin must include a skill under `skills/`.
- R4: The plugin must include `hooks/hooks.json` using Codex event names.
- R5: Hook scripts must read JSON from stdin, exit `0` defensively, and emit
  valid JSON stdout where Codex requires it.
- R6: `PostToolUse` capture must buffer locally and avoid Sui/Walrus network
  work.
- R7: `Stop` must flush buffered calls only when trace env config exists.
- R8: Docs must clearly distinguish MCP memory coverage from optional hook
  trace coverage.
- R9: Structure tests must register the new package and Context Engineering
  artifacts.
- R10: The repo-local marketplace manifest must expose `onemem-codex`.

## Acceptance Criteria

- AC1: `pnpm --filter @onemem/codex-plugin test` passes.
- AC2: `pnpm --filter @onemem/codex-plugin lint` passes.
- AC3: `pnpm test:structure` passes with the new package and artifacts.
- AC4: A local hook simulation proves `PostToolUse` buffers Codex-shaped
  `tool_output`.
- AC5: `.mcp.json` uses the Codex plugin `mcpServers` wrapper, points at
  `@onemem/mcp`, and forwards the expected OneMem env variable names.
- AC6: Docs no longer say the native Codex plugin is deferred for lack of
  plugin support.
- AC7: A temporary `CODEX_HOME` can add the repo as a local marketplace, list
  `onemem-codex@onemem-local`, and install it without mutating the user's real
  Codex config.

## Constraints

- Use current Codex docs over old internal assumptions.
- Keep plugin manifest paths relative to the plugin root and beginning with
  `./`.
- Omit a top-level `hooks` manifest field because Codex auto-loads
  `hooks/hooks.json` and the local plugin-creator skill still warns about
  manifest validator drift for that field.
- Do not print private keys or memory credentials.

## Stories Needed

- Codex user installs OneMem plugin and gets memory tools through bundled MCP.
- Codex hook runtime buffers a tool call without blocking the user's workflow.
- Codex user can see honest docs for what is automatic and what remains manual.

## Open Questions

- Which exact Codex plugin marketplace path will be used for external
  distribution after hackathon packaging.
- Whether to make hook trace capture enabled by default or documented as an
  advanced opt-in after live TUI proof.

## Source References

- `.thoughts/research/2026-06-17-codex-memory-plugin.md`
- `packages/plugin-claude-code/`
- `packages/mcp-server/`
- `docs/03-target-runtimes/codex-cli-deep.md`
- `docs/05-our-architecture/03-runtimes/codex-cli-integration.md`
