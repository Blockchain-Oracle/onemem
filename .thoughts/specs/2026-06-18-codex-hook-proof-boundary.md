# Spec: Codex Hook Matcher And Proof Boundary

## Objective

Harden OneMem's Codex plugin so the packaged hook matcher is broad enough for
Codex lifecycle events while docs and tests clearly avoid claiming unproven
automatic Codex hook trace coverage.

## Background And Current Reality

The Codex plugin package is installed through the public repository marketplace
and bundles the MCP server plus optional lifecycle hooks. Local script tests
prove hook payload handling and fake trace CLI flushing. A real Sui testnet
trace proves the trace CLI can mint and verify OneMem sessions. Codex CLI 0.140
`codex exec` did not execute user-level or plugin hooks in local proof attempts.

## Users

- OneMem users installing the Codex plugin for MCP memory/search/verify tools.
- OneMem maintainers proving runtime trace coverage honestly.
- Future agents updating Codex hook behavior or docs.

## Goals

- Use an empty `SessionStart` matcher so every hook-enabled Codex session source
  is eligible.
- Keep `plugin.json` compatible with the current local validator.
- Document that `codex exec` on Codex CLI 0.140 is not the live hook proof path.
- Keep the stable MCP layer separate from optional trusted hook trace coverage.

## Non-goals

- Do not claim real automatic Codex tool-call tracing until trusted hooks emit a
  verifiable on-chain OneMem `TraceSession`.
- Do not add unsupported `hooks` fields to `plugin.json`.
- Do not publish or bump package versions in this slice.
- Do not run wallet-consuming hook proof beyond the existing bootstrap trace.

## Requirements

- R1: `packages/plugin-codex/hooks/hooks.json` must use an empty
  `SessionStart` matcher.
- R2: Plugin docs must say `SessionStart` arms local capture state, not that it
  opens the final on-chain trace session.
- R3: Runtime docs must say `codex exec` on CLI 0.140 did not run hooks in local
  proof attempts.
- R4: Structure tests must guard the matcher and README claim boundary.
- R5: The Codex plugin manifest must remain valid under the local plugin
  validator.

## Acceptance Criteria

- AC1: Codex plugin unit tests pass.
- AC2: Structure tests pass.
- AC3: Plugin validation passes.
- AC4: Docs no longer place Codex hook language under the Claude Code section.
- AC5: Verification audit records the package proof, the bootstrap trace proof,
  and the remaining trusted `/hooks` proof gap.

## Constraints

- Keep structure-test shards below 300 lines.
- Keep product source files below the current 400-line cap.
- Do not expose private keys or API tokens in artifacts.
- Use `.thoughts/` for repo-local context artifacts.

## Stories Needed

- Maintainer verifies broad hook matcher without overclaiming runtime execution.
- User understands MCP tools work without hook trust.
- Future agent sees `codex exec` proof boundary before publishing stronger
  runtime claims.

## Open Questions

- Should we retest `codex exec` after upgrading Codex CLI from 0.140 to 0.141?
- Should plugin validation be updated when upstream supports explicit manifest
  hook paths?

## Source References

- `.thoughts/research/2026-06-18-codex-hook-proof-boundary.md`
- `packages/plugin-codex/hooks/hooks.json`
- `packages/plugin-codex/README.md`
- `docs/03-target-runtimes/codex-cli-deep.md`
