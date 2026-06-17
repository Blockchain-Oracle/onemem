# Plan: Codex Memory Plugin

## Inputs

- Research: `.thoughts/research/2026-06-17-codex-memory-plugin.md`
- Spec: `.thoughts/specs/2026-06-17-codex-memory-plugin.md`
- Stories: `.thoughts/stories/2026-06-17-codex-memory-plugin.md`
- Quality profile: `.thoughts/quality/2026-06-17-project-quality-profile.md`
- Existing Claude plugin: `packages/plugin-claude-code/`
- Existing MCP server: `packages/mcp-server/`

## Assumptions

- The first useful Codex plugin slice should bundle MCP as the stable memory
  surface and include hook scripts as optional trace capture.
- Hook scripts should be tested by simulation in this repo before any live Codex
  TUI trust/session test.
- The plugin package should remain in the monorepo for now.

## Open Questions

- Live Codex hook proof depends on the installed Codex version and hook trust
  state, so it may become a follow-up if the local CLI is unavailable or not
  configured.

## Phase 1: Package Skeleton

### Goal

Create `packages/plugin-codex` with a valid Codex plugin manifest, MCP config,
skill, hooks, README, and package metadata.

### Work

- Add `.codex-plugin/plugin.json`.
- Add `.mcp.json`.
- Add `skills/onemem-codex/SKILL.md`.
- Add `hooks/hooks.json`.
- Add `.agents/plugins/marketplace.json` for repo-local install discovery.
- Add `package.json` and `README.md`.

### Checks

- `pnpm exec biome check packages/plugin-codex`

### Acceptance Criteria Covered

- AC2, AC5.

### Stop Condition

Codex plugin package exists and lint can inspect it.

## Phase 2: Hook Scripts And Tests

### Goal

Implement defensive Codex hook scripts with local buffering and simulated
payload tests.

### Work

- Add `scripts/onemem-lib.mjs`.
- Add `scripts/inject.js`, `scripts/observe.js`, and `scripts/summarize.js`.
- Add Vitest coverage for stdin JSON, `PostToolUse` buffering, and no-config
  defensive behavior.

### Checks

- `pnpm --filter @onemem/codex-plugin test`
- `pnpm --filter @onemem/codex-plugin lint`

### Acceptance Criteria Covered

- AC1, AC2, AC4.

### Stop Condition

Codex-shaped hook simulation passes without network access.

## Phase 3: Docs And Structure

### Goal

Update current repo docs and structure tests so the Codex plugin is discoverable
and honestly scoped.

### Work

- Update Codex runtime docs from deferred to current.
- Add quickstart/docs references for Codex plugin install.
- Register `plugin-codex` in structure tests.
- Register repo-local marketplace file in structure tests.
- Register Context Engineering artifacts in structure tests and wiki.

### Checks

- `pnpm test:structure`

### Acceptance Criteria Covered

- AC3, AC6.

### Stop Condition

Docs and structure tests agree that Codex plugin support exists and what it
covers.

## Verification Checkpoint

- Run focused package gates.
- Run the local Codex plugin validator against `packages/plugin-codex`.
- Test repo-local marketplace add/list/install with a temporary `CODEX_HOME`.
- Run structure test.
- If feasible, inspect local Codex CLI/version and document whether live hook
  testing was possible.
- Write `.thoughts/verification/2026-06-17-codex-memory-plugin.md`.

## Handoff Notes

Do not claim complete Claude Code parity until live Codex hook execution proves
`SessionStart`/`PostToolUse`/`Stop` behavior in a real Codex session.
