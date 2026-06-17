# Verification Audit: Docs And Instruction Alignment

Date: 2026-06-17

## Verdict

Conditional pass.

The active Context Engineering routing layer is now aligned and enforced by the
structure test. High-risk stale docs and live command snippets were corrected or
marked historical. Remaining stale examples are intentionally contained in
historical architecture docs and tracked as follow-up.

## Artifacts Checked

- `AGENTS.md`
- `CLAUDE.md`
- package-local `CLAUDE.md` files
- `docs/05-our-architecture/**/README.md`
- `docs/05-our-architecture/02-sdks/shared-api-surface.md`
- `docs/05-our-architecture/03-runtimes/mcp-server.md`
- package README files for SDK, CLI, dashboard, and MCP
- `apps/docs` examples
- dashboard/onboarding runtime command snippets
- demo READMEs
- `tests/structure.test.ts`

## Requirement Traceability

- Active agent router exists: `AGENTS.md`.
- Thought-space source of truth exists:
  `.thoughts/wiki/index.md`.
- Historical docs are labeled before stale status tables.
- Root Claude context no longer duplicates the operating model.
- Package-local instruction files retain package-specific invariants and point
  back to the active router.
- Structure tests now assert `AGENTS.md` exists and routes to the Context
  Engineering artifact root.

## Quality Gates

```bash
pnpm test:structure
pnpm --filter @onemem/dashboard typecheck
pnpm --filter @onemem/hosted-dashboard typecheck
```

All passed.

## Deviations From Plan

- I did not delete the historical architecture archive. It still contains useful
  rationale and broad design material, so the safer move was to mark it
  historical and patch high-impact live-facing drift.
- I did not run full monorepo `pnpm lint`, `pnpm typecheck`, or `pnpm build`
  because this pass was docs/context-heavy and the repo already has a broad dirty
  worktree outside this task.

## Gaps And Risks

- Historical docs still include old command examples inside body sections.
- Public docs need a deeper package-by-package example audit.
- Prototype deltas still need an accept/reject decision pass before new UI work.

## Evidence Log

- Structure test: 86/86 passing.
- Dashboard typecheck: passed.
- Hosted dashboard typecheck: passed.
