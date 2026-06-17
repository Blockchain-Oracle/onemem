# Spec: Demo Matrix CI Gate

Date: 2026-06-17

## Objective

Make deterministic demo verification a first-class CI gate now that all four
demo packages are executable, while keeping live testnet trace writing outside
regular PR CI.

## Background And Current Reality

All four demos now exist as workspace packages. Turbo already includes their
`test` tasks in broad monorepo test runs, but there is no explicit
`test:demo-matrix` command, no named CI step, and the demo docs still mark E2E
test matrix CI as pending.

## Users

- Maintainers reviewing PRs.
- Demo operators preparing hackathon material.
- Future agents choosing the next slice from repo status docs.

## Goals

- G1: Add a root command that explicitly verifies all demo packages.
- G2: Add a named CI step for that command.
- G3: Guard the root command and CI step in structure tests.
- G4: Update demo docs so "E2E test matrix CI" reflects deterministic CI
  coverage and keeps live testnet proof separate.
- G5: Keep the proof boundary clear: CI verifies deterministic package gates,
  not live Sui object creation.

## Non-goals

- No live `demo:trace` execution on every PR.
- No scheduled/nightly testnet workflow in this slice.
- No mainnet E2E workflow.
- No Demo Day video production.

## Requirements

- R1: `package.json` must expose `test:demo-matrix`.
- R2: `test:demo-matrix` must target all packages under `demos/*` and run
  `test`, `typecheck`, `lint`, and `build`.
- R3: `.github/workflows/ci.yml` must include a named deterministic demo
  matrix step.
- R4: `tests/structure.test.ts` must guard the root script and CI step.
- R5: `docs/05-our-architecture/08-demos-and-tests/README.md` must no longer
  mark deterministic demo CI as pending.
- R6: `docs/05-our-architecture/08-demos-and-tests/e2e-test-plan.md` must state
  current CI reality and live-testnet boundaries.

## Acceptance Criteria

- AC1: `mise exec -- pnpm test:demo-matrix` passes locally.
- AC2: `mise exec -- pnpm test:structure` passes.
- AC3: Structure tests fail if the root script or CI step is removed.
- AC4: Docs distinguish deterministic demo CI from live testnet trace proof.

## Constraints

- Use the repo's pinned pnpm via `mise exec -- pnpm` locally.
- Use Turborepo directory filtering syntax from current docs.
- Do not add a workflow that consumes real Sui gas on every PR.

## Stories Needed

- Story 1: Maintainer sees an explicit demo matrix CI gate.
- Story 2: Demo operator sees honest live-proof boundaries.

## Open Questions

- Should a future `workflow_dispatch` live testnet job mint all four demo traces
  on demand with dedicated secrets?

## Source References

- Research:
  `.thoughts/research/2026-06-17-demo-matrix-ci-gate.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`
