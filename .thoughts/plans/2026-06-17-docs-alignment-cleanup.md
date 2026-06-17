# Plan: Documentation And Rule Alignment

## Inputs

- Repo at `/Users/abu/dev/hackathon/sui-overflow/onemem`.
- Context Engineering operating model.
- Project quality profile.
- Prototype discovery report.
- Current instruction files and architecture docs.

## Assumptions

- Historical research and architecture docs should not be deleted unless they are
  clearly duplicate or harmful.
- Stale docs should either be corrected or labeled historical at the top.
- Agent-facing instructions should prefer `AGENTS.md` and thought-space artifacts.

## Open Questions

- Which prototype deltas are v0.1 commitments versus v0.2 design intent?
- Which public docs are submission-critical and should be polished first?
- Should old CLAUDE-oriented docs remain long-term or become compatibility shims
  for Claude workflows only?

## Phase 1: Instruction Alignment

### Goal

Make agent entrypoints agree.

### Work

- Route root instructions to `AGENTS.md` and the Context Engineering wiki.
- Correct dead links in nested `CLAUDE.md` files.
- Mark old coding-agent setup docs historical when they reference obsolete skill
  names or app architecture.

### Checks

- `rg` for missing/dead instruction references.
- `pnpm test:structure`.

### Stop Condition

New agents can follow the repo without reading stale setup rules as current.

## Phase 2: Status Documentation Cleanup

### Goal

Reduce false "pending" or wrong-status claims.

### Work

- Audit package READMEs, app READMEs, and architecture section READMEs.
- Patch wrong tool names, wrong route ownership, stale "not implemented" claims,
  and broken links.
- Mark broad architecture trackers as historical when full rewrite is risky.

### Checks

- `pnpm test:structure`.
- Spot-check changed links with `rg --files`.

### Stop Condition

Docs no longer send agents toward obsolete tasks or nonexistent files.

## Phase 3: Prototype Decision Pass

### Goal

Turn prototype discovery into accepted build scope.

### Work

- Create stories or acceptance criteria for accepted deltas.
- Defer or reject prototype-only affordances that lack storage, auth, chain, or
  local config support.
- Prioritize trust-path surfaces before operational convenience.

### Checks

- Stories/specs cite prototype discovery and quality profile.

### Stop Condition

Implementation can start without copying prototype-only behavior blindly.

## Verification Checkpoint

Write a verification audit after each cleanup phase with:

- files changed,
- commands run,
- remaining known stale areas,
- pass/conditional/fail verdict.
