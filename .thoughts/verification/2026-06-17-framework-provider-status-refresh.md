# Verification Audit: Framework Provider Status Refresh

## Verdict

Pass locally.

## Artifacts Checked

- `.thoughts/research/2026-06-17-framework-provider-status-refresh.md`
- `.thoughts/specs/2026-06-17-framework-provider-status-refresh.md`
- `.thoughts/stories/2026-06-17-framework-provider-status-refresh.md`
- `.thoughts/plans/2026-06-17-framework-provider-status-refresh.md`
- `docs/05-our-architecture/04-frameworks/README.md`
- `tests/structure/*.test.ts`
- `tests/structure/helpers.ts`

## Requirement Traceability

- R1: pass. The architecture README no longer marks the five built framework
  providers as pending.
- R2: pass. The README states the current package READMEs and source are the
  API truth.
- R3: pass. Registry evidence is recorded for the five public framework
  provider packages.
- R4: pass. Python framework providers are described as trace wrappers/callbacks
  with memory-provider ergonomics tracked as follow-ups.
- R5: pass. The split structure-test suite now rejects stale pending rows for
  the built provider package names.

## Acceptance Criteria Coverage

Covered by the README patch, structure-test regression guard, and targeted stale
row scan.

## Quality Gates

- `rg -n '⏳ pending|\\| \`(@onemem/vercel-ai-provider|@onemem/openai-agents|onemem-crewai|onemem-livekit|onemem-elevenlabs)\` \\| ⏳ pending' docs/05-our-architecture/04-frameworks/README.md`
  - Result: no matches; command exited `1`, which is expected for this negative
    scan.
- `mise exec -- pnpm test:structure`
  - Result: pass, 351/351 tests.
- `mise exec -- pnpm exec biome check tests/structure package.json`
  - Result: pass.
- `wc -l tests/structure/*.ts`
  - Result: every structure-test shard is below 300 lines.
- `git diff --check`
  - Result: pass.

## Deviations From Plan

- User called out that the monolithic structure test itself violated the
  project's size discipline. During this slice, the structure suite was split
  into shards and given a 300-line shard guard. Product/runtime code was not
  touched.

## Gaps And Risks

- This slice does not publish missing runtime/CLI packages.
- This slice does not upgrade `hermes-onemem@0.2.0` on PyPI.
- This slice does not live-test third-party framework runtimes.

## Follow-ups

- Consider a release-focused slice for CLI/runtime plugin publication and Hermes
  version drift.

## Evidence Log

- 2026-06-17: Verified no stale pending rows remain for the five built provider
  names in `docs/05-our-architecture/04-frameworks/README.md`.
- 2026-06-17: Structure suite passed with the new regression guard and split
  structure-test harness: 351 tests, 27 suites, 0 failures.
- 2026-06-17: Structure-test shards are all under 300 lines; the old monolithic
  `tests/structure.test.ts` entrypoint was removed.
- 2026-06-17: Whitespace check passed with `git diff --check`.
