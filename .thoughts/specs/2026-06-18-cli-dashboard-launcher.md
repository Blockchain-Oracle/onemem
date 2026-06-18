# Spec: CLI Dashboard Launcher

## Objective

Make `onemem dashboard` a real TS CLI command that launches the existing local
dashboard binary and align current-facing docs/tests with that behavior.

## Background And Current Reality

The dashboard package already exposes `onemem-dashboard`, and local/demo docs
refer to `onemem dashboard`, but the TS CLI does not currently register that
subcommand. The CLI docs therefore contradict the desired local dashboard UX.

## Users

- OneMem users launching the local dashboard during agent work.
- Maintainers checking the current CLI command surface.
- Future agents updating CLI/docs without reintroducing stale deferred-command
  claims.

## Goals

- Register `onemem dashboard` in `@onemem/cli`.
- Keep the dashboard package separate from the CLI package.
- Spawn the existing `onemem-dashboard` binary with a configurable port.
- Fail honestly with installation guidance when the dashboard binary is absent.
- Update current docs and structure tests so the command is no longer listed as
  deferred.

## Non-goals

- Do not add browser auto-open behavior in this slice.
- Do not bundle the dashboard package into the CLI package.
- Do not change dashboard routes or local/hosted route ownership.
- Do not publish packages in this slice.

## Requirements

- R1: TS CLI registers `onemem dashboard`.
- R2: The command accepts `--port <port>` and defaults to `4040`.
- R3: The command launches `onemem-dashboard` with `PORT` and local dashboard
  mode environment.
- R4: Missing `onemem-dashboard` produces a clear error with
  `@onemem/dashboard` installation guidance.
- R5: Current CLI/package/docs surfaces list `onemem dashboard` as current, not
  deferred.
- R6: Tests cover launcher success, failure guidance, docs, and structure
  invariants.

## Acceptance Criteria

- AC1: `pnpm --filter @onemem/cli test` passes with launcher unit coverage.
- AC2: `pnpm --filter @onemem/cli typecheck`, `lint`, and `build` pass.
- AC3: `pnpm test:structure` passes and no structure shard exceeds 300 lines.
- AC4: Current docs mention `onemem dashboard` as a current command and do not
  list it in deferred command inventories.

## Constraints

- Keep source files under 400 lines and structure-test shards under 300 lines.
- Use repo-local `.thoughts/` artifacts for this slice.
- Keep the command defensive: launcher failures must not produce misleading
  success output.

## Stories Needed

- Local dashboard launch.
- Missing dashboard package guidance.
- Documentation and structure guard.

## Open Questions

- Should a later release add `@onemem/dashboard` as an optional dependency of
  `@onemem/cli`?
- Should browser auto-open be added after choosing a dependency-free strategy or
  adding a small opener dependency?

## Source References

- `.thoughts/research/2026-06-18-cli-dashboard-launcher.md`
- `packages/cli-ts/src/index.ts`
- `packages/dashboard/bin/onemem-dashboard`
- `docs/05-our-architecture/05-cli/command-surface.md`
