# Docs And Instruction Audit

Date: 2026-06-17

## Scope

Read-only subagents audited:

- instruction files and agent-facing docs,
- product/status docs and package/app READMEs.

## Findings Integrated

- `AGENTS.md` should be the active Codex router.
- Root `CLAUDE.md` should be a compatibility shim, not the operating manual.
- Old architecture docs should be marked historical before agents treat status
  tables as current implementation truth.
- Package-local `CLAUDE.md` files had dead references to missing protocol docs.
- The Claude Code plugin context and package metadata advertised
  `UserPromptSubmit`, but the current hook manifest is `SessionStart`,
  `PostToolUse`, and `SessionEnd`.
- `packages/mcp-server/README.md` and the architecture MCP doc disagreed on
  tool count and names.
- SDK docs over-claimed TS/Python API parity.
- CLI/dashboard docs mentioned `onemem dashboard` and deferred `onemem login`
  even though current package commands differ.
- Public docs and dashboard/onboarding snippets showed old runtime install
  commands.
- Demo READMEs linked to missing demo docs.
- GitHub metadata pointed to the old `github.com/onemem/onemem` URL.

## Applied Cleanup

- Reworked root `CLAUDE.md` into a short compatibility shim.
- Updated structure tests to require `AGENTS.md` and a Context Engineering wiki
  pointer.
- Added historical banners to architecture section READMEs and high-risk specs.
- Corrected package-local instruction links and current hook names.
- Corrected MCP README, CLI/dashboard package READMEs, docs-site examples,
  demo links, and GitHub URL metadata.

## Remaining Backlog

- Historical architecture body content still contains old examples such as
  `onemem dashboard`, `onemem install --runtime`, and `UserPromptSubmit`. These
  are now under historical banners but can be rewritten later if those docs need
  to become current public docs.
- Framework design docs still describe some old provider shapes; package READMEs
  and source should remain the source of truth until those architecture docs are
  refreshed.
- Public docs need a full example audit against every package README/source, not
  only the high-risk examples patched in this pass.
- `BUILD_SEQUENCE.md` still has original phase language. It is marked historical;
  refresh only if it becomes a current tracker again.
