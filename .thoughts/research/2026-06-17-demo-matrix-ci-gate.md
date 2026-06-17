# Reality Research: Demo Matrix CI Gate

Date: 2026-06-17

## Scope

Current CI and demo coverage after all four executable demo packages exist.
This research records what is already covered and what is missing before adding
a demo-specific CI gate.

## Sources Checked

- `.github/workflows/ci.yml`
- `package.json`
- `turbo.json`
- `demos/*/package.json`
- `docs/05-our-architecture/08-demos-and-tests/README.md`
- `docs/05-our-architecture/08-demos-and-tests/e2e-test-plan.md`
- `tests/structure.test.ts`
- `mise exec -- pnpm turbo run test --dry=json`
- Context7 GitHub Actions docs:
  - `npx ctx7@latest library "GitHub Actions" ...`
  - `npx ctx7@latest docs /websites/github_en_actions ...`
- Context7 Turborepo docs:
  - `npx ctx7@latest library "Turborepo" ...`
  - `npx ctx7@latest docs /vercel/turborepo ...`

## Verified Facts

- CI currently runs `pnpm test:structure`, `pnpm turbo run lint`,
  `pnpm turbo run typecheck`, `pnpm turbo run test`, and
  `pnpm turbo run build`.
- All four demos are pnpm workspace packages with `test`, `typecheck`, `lint`,
  `build`, and `demo:trace` scripts.
- `pnpm turbo run test --dry=json` includes the demo packages because
  `pnpm-workspace.yaml` includes `demos/*`.
- There is no root-level script that explicitly means "verify the demo matrix."
- CI has no named step that explicitly verifies the deterministic demo matrix.
- The demo pillar README still marks "E2E test matrix CI" pending.
- Live `demo:trace` commands write real Sui testnet objects. Those are not
  appropriate for every pull request without secrets, rate budgeting, and
  explicit intent.
- GitHub Actions docs confirm `workflow_dispatch` and `schedule` are valid
  triggers, and scheduled workflows run on the latest commit on the default
  branch.
- Turborepo docs confirm directory filters such as
  `turbo run build --filter=./apps/*` and task filters such as
  `turbo test --filter=./apps/*`.

## Inferences

- A deterministic CI gate should run package-level demo tests, typechecks,
  lints, and builds using a Turborepo directory filter over `./demos/*`.
- Live testnet trace proof should remain manual/on-demand until a separate
  scheduled or workflow-dispatch job is designed with dedicated secrets and
  gas/rate limits.

## Unknowns And Questions

- Whether the project wants a future scheduled live testnet workflow that mints
  real demo traces nightly.
- Whether Demo Day video production should become a separate tracked artifact.

## Not Included

- No live testnet writes in CI.
- No video production.
- No real runtime hook execution.
