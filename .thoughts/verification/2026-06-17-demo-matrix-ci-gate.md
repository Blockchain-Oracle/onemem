# Verification Audit: Demo Matrix CI Gate

Date: 2026-06-17

## Verdict

Pass.

The repo now exposes an explicit deterministic demo matrix gate and CI runs it
by name. The gate covers all four executable demo packages with package-level
tests, typechecks, lints, and builds. Live `demo:trace` execution remains
outside every-PR CI because it mints real Sui testnet objects.

## Artifacts Checked

- Research:
  `.thoughts/research/2026-06-17-demo-matrix-ci-gate.md`
- Spec:
  `.thoughts/specs/2026-06-17-demo-matrix-ci-gate.md`
- Stories:
  `.thoughts/stories/2026-06-17-demo-matrix-ci-gate.md`
- Plan:
  `.thoughts/plans/2026-06-17-demo-matrix-ci-gate.md`
- Root scripts:
  `package.json`
- CI:
  `.github/workflows/ci.yml`
- Docs:
  `docs/05-our-architecture/08-demos-and-tests/README.md`
  `docs/05-our-architecture/08-demos-and-tests/e2e-test-plan.md`
- Structure guard:
  `tests/structure.test.ts`

## Requirement Traceability

| Requirement | Evidence |
|---|---|
| R1: Root `test:demo-matrix` script | `package.json` exposes `test:demo-matrix`. |
| R2: Script targets all demos and runs four gates | Script is `turbo run test typecheck lint build --filter=./demos/*`. |
| R3: CI named step | `.github/workflows/ci.yml` includes `Verify deterministic demo matrix` running `pnpm test:demo-matrix`. |
| R4: Structure guards | `tests/structure.test.ts` checks both the root script and CI step. |
| R5: Demo README status | Demo pillar README now marks deterministic demo matrix CI built and live writes manual/on-demand. |
| R6: E2E plan boundary | E2E test plan current note describes deterministic CI and excludes `demo:trace` from every-PR CI. |

## Acceptance Criteria Coverage

| Acceptance Criterion | Evidence |
|---|---|
| AC1: `pnpm test:demo-matrix` passes | `mise exec -- pnpm test:demo-matrix`: 17 successful Turbo tasks, 4 demo packages in scope. |
| AC2: `pnpm test:structure` passes | `mise exec -- pnpm test:structure`: 333 passing checks. |
| AC3: Guards fail if script/CI step disappear | Structure tests assert exact root script and CI command text. |
| AC4: Docs distinguish deterministic CI from live trace proof | README and E2E plan both state live trace writes remain manual/on-demand. |

## Quality Gates

Executed:

```bash
mise exec -- pnpm test:demo-matrix
mise exec -- pnpm test:structure
```

Result:

- Packages in scope:
  - `@onemem/demo-agent-sends-money`
  - `@onemem/demo-multi-agent-coordination`
  - `@onemem/demo-switch-laptops`
  - `@onemem/demo-verifiable-research-agent`
- Tasks: 17 successful, 17 total.
- Included `test`, `typecheck`, `lint`, and `build` across all demo packages,
  plus the SDK dependency build.
- Structure tests: 333 passing checks, including guards for the CI demo matrix
  step, root `test:demo-matrix` command, and Context Engineering artifacts.

## Deviations From Plan

- None.

## Gaps And Risks

- This does not run live `demo:trace` commands in CI.
- Turbo warns that no output files are found for demo build/test cache outputs
  because these demo tasks currently run `tsc --noEmit` and do not generate
  coverage artifacts. The tasks still pass; cache-output tuning can be a later
  cleanup if it becomes noisy in CI.

## Follow-ups

- Design a separate `workflow_dispatch` or scheduled live testnet demo proof
  workflow with dedicated secrets, gas/rate limits, and explicit artifact
  retention.
- Demo Day video production remains pending.

## Evidence Log

- Context7 GitHub Actions docs checked for workflow triggers and scheduling.
- Context7 Turborepo docs checked for directory filter syntax.
- `mise exec -- pnpm test:demo-matrix`: passed, 17/17 Turbo tasks.
- `mise exec -- pnpm test:structure`: passed, 333/333 checks.
