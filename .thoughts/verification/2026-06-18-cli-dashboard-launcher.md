# Verification Audit: CLI Dashboard Launcher

## Verdict

Pass for the scoped repo change. `onemem dashboard` is now implemented as a
defensive launcher over the existing dashboard package binary, with docs and
structure guards aligned.

## Artifacts Checked

- Research:
  `.thoughts/research/2026-06-18-cli-dashboard-launcher.md`
- Spec:
  `.thoughts/specs/2026-06-18-cli-dashboard-launcher.md`
- Stories:
  `.thoughts/stories/2026-06-18-cli-dashboard-launcher.md`
- Plan:
  `.thoughts/plans/2026-06-18-cli-dashboard-launcher.md`
- Code:
  `packages/cli-ts/src/commands/dashboard.ts`
  `packages/cli-ts/src/index.ts`
- Tests:
  `packages/cli-ts/tests/dashboard.test.ts`
  `tests/structure/docs-frameworks.test.ts`
  `tests/structure/context-artifacts.test.ts`
- Docs:
  `packages/cli-ts/README.md`
  `packages/dashboard/README.md`
  `apps/docs/reference/cli.mdx`
  `docs/05-our-architecture/05-cli/README.md`
  `docs/05-our-architecture/05-cli/command-surface.md`
  `docs/05-our-architecture/05-cli/cli-typescript-impl.md`
  `docs/05-our-architecture/06-dashboard/local-deploy.md`

## Requirement Traceability

| Requirement | Evidence |
|---|---|
| R1: Register command | `packages/cli-ts/src/index.ts` registers `dashboard`. |
| R2: Port option | Command exposes `--port <port>` with default `4040`; unit test verifies `5050`. |
| R3: Spawn dashboard binary | `launchDashboard()` spawns `onemem-dashboard` and passes `PORT` plus `ONEMEM_MODE=local`. |
| R4: Missing binary guidance | Unit test covers `ENOENT` guidance naming `@onemem/dashboard` and `onemem-dashboard`. |
| R5: Docs list command as current | CLI package README, public CLI docs, command-surface docs, and local-deploy docs list `onemem dashboard` as current. |
| R6: Tests cover launcher/docs | CLI unit tests and structure tests passed. |

## Acceptance Criteria Coverage

| Acceptance Criterion | Evidence |
|---|---|
| AC1: CLI tests pass | `pnpm --filter @onemem/cli test`: 54 tests passed. |
| AC2: CLI typecheck/lint/build pass | Focused CLI typecheck, lint, and build passed. |
| AC3: Structure tests pass | `pnpm test:structure`: 390 tests passed. |
| AC4: Docs no longer defer dashboard | Structure test asserts deferred list no longer includes `onemem dashboard`. |

## Quality Gates

Passed:

```bash
npx ctx7@latest library "Commander.js" "adding a subcommand with options and an async action handler"
npx ctx7@latest docs /tj/commander.js "adding a subcommand with options and an async action handler"
mise exec -- pnpm --filter @onemem/cli test
mise exec -- pnpm --filter @onemem/cli typecheck
mise exec -- pnpm --filter @onemem/cli lint
mise exec -- pnpm --filter @onemem/cli build
ONEMEM_DASHBOARD_BIN=/bin/echo mise exec -- pnpm --filter @onemem/cli exec node dist/index.js dashboard --port 5050
mise exec -- pnpm --filter @onemem/cli exec node dist/index.js dashboard --help
mise exec -- pnpm exec biome check packages/cli-ts docs/05-our-architecture/05-cli docs/05-our-architecture/06-dashboard/local-deploy.md packages/dashboard/README.md apps/docs/reference/cli.mdx tests/structure .thoughts
mise exec -- pnpm test:structure
```

## Deviations From Plan

- None. Browser auto-open remained out of scope as planned.

## Gaps And Risks

- This slice does not start a real dashboard server. Server startup remains
  covered by the dashboard package build/browser smoke path.
- Users still need `@onemem/dashboard` installed or `onemem-dashboard` on PATH;
  the CLI does not bundle or auto-install the heavy dashboard package.

## Follow-ups

- Decide later whether `@onemem/dashboard` should become an optional dependency
  of `@onemem/cli`.
- Decide later whether browser auto-open is worth adding.

## Evidence Log

- `launchDashboard({ port: "5050" })` test proves spawn arguments:
  binary `onemem-dashboard`, empty argv, inherited stdio, `PORT=5050`, and
  `ONEMEM_MODE=local`.
- Missing-binary test proves user-facing guidance instead of a stack trace.
- Built CLI smoke with `ONEMEM_DASHBOARD_BIN=/bin/echo` proves
  `dashboard --port 5050` is wired through Commander without starting a server.
- Structure tests prove line caps still pass and current docs expose the
  dashboard launcher.
