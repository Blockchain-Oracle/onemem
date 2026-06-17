# Plan: Plugin Marketplace Publication Readiness

## Inputs

- Research:
  `.thoughts/research/2026-06-17-plugin-marketplace-publication-readiness.md`
- Spec:
  `.thoughts/specs/2026-06-17-plugin-marketplace-publication-readiness.md`
- Stories:
  `.thoughts/stories/2026-06-17-plugin-marketplace-publication-readiness.md`
- Current package reality under `packages/plugin-codex` and
  `packages/plugin-claude-code`.

## Assumptions

- The public GitHub repository marketplace path is the correct install surface
  available today for both Codex and Claude Code.
- Actual npm upload needs restored npm auth or a CI publish job.

## Open Questions

- Whether there is a separate third-party official directory submission path
  for Codex beyond `codex plugin marketplace add`.

## Phase 1: Marketplace Manifests

### Goal

Make both runtimes discover OneMem from repository marketplace manifests.

### Work

- Rename `.agents/plugins/marketplace.json` marketplace to `onemem`.
- Add `.claude-plugin/marketplace.json`.
- Guard both manifests in `tests/structure.test.ts`.

### Checks

- Temporary Codex marketplace add/list/install.
- Temporary Claude marketplace add/list/install.

### Acceptance Criteria Covered

- AC1, AC2, AC3, AC4.

### Stop Condition

Both temporary install paths pass.

## Phase 2: Shipped Plugin Context And Package Metadata

### Goal

Make the Claude plugin package validate strictly and make both npm packages
publish-ready.

### Work

- Move Claude plugin instructions into
  `skills/onemem-claude-code/SKILL.md`.
- Remove plugin-root `CLAUDE.md`.
- Add `skills` to the Claude package files list.
- Add homepage, repository, bugs, and `publishConfig.access=public` metadata.

### Checks

- `claude plugin validate packages/plugin-claude-code --strict`
- Npm dry-pack and publish dry-run for both plugin packages.

### Acceptance Criteria Covered

- AC1, AC5.

### Stop Condition

Strict validation and dry-runs pass without package metadata warnings.

## Phase 3: Docs And Product Copy

### Goal

Remove local-only install instructions from active user-facing surfaces.

### Work

- Update package READMEs.
- Update docs quickstart/runtime pages.
- Update dashboard runtime/onboarding install commands.
- Keep local checkout commands only under explicit development fallback
  sections.

### Checks

- Stale-string grep for `onemem-local` and old absolute Claude install path.

### Acceptance Criteria Covered

- AC7.

### Stop Condition

No active user-facing stale install strings remain.

## Verification Checkpoint

Run focused plugin tests/lints, marketplace validators, temporary install
proofs, npm publish dry-runs, `pnpm test:structure`, and `git diff --check`.

## Handoff Notes

Actual npm upload is blocked by missing npm auth in this shell. Live Codex hook
trace proof remains a separate integration task after hooks are trusted and a
real on-chain `TraceSession` verifies.
