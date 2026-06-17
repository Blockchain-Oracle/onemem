# Verification: CLI Historical Docs Boundary

## Verdict

Pass.

## Artifacts Checked

- `docs/05-our-architecture/05-cli/README.md`
- `docs/05-our-architecture/05-cli/cli-typescript-impl.md`
- `docs/05-our-architecture/05-cli/cli-python-impl.md`
- `docs/05-our-architecture/05-cli/output-design.md`
- `docs/05-our-architecture/05-cli/login-flow.md`
- `tests/structure.test.ts`

## Requirements

- R1: Current truth routes to `command-surface.md` and package source files.
- R2: Historical implementation/output sketches say they are historical.
- R3: `login-flow.md` has no fixed `localhost:12340` callback port claims.
- R4: `login-flow.md` does not document `onemem logout` as current behavior.
- R5: Structure tests enforce the historical/current boundary.
- R6: Context Engineering artifacts and wiki/log record the cleanup.

## Acceptance Criteria Coverage

| Acceptance Criterion | Evidence |
|---|---|
| AC1: `pnpm test:structure` passes | Passed, 224 checks. |
| AC2: `git diff --check` passes | Passed. |
| AC3: Targeted stale login-flow search passes | Passed; no `12340` or `onemem logout` references remain in `login-flow.md`. |
| AC4: Verification artifact records evidence and residual risk | This file. |

## Quality Gates

- `pnpm test:structure` — passed, 224 checks.
- `git diff --check` — passed.
- `rg -n '12340|onemem logout' docs/05-our-architecture/05-cli/login-flow.md -S` — passed with no matches.
- `rg -n 'Same command surface|using typer|uses `chalk` \(Node\) / `rich` \(Python\)' docs/05-our-architecture/05-cli -S` — passed with no matches.

## Requirement Traceability

| Requirement | Evidence |
|---|---|
| R1: Current truth routes to `command-surface.md` and package source files | CLI README read-order and historical notes point at `command-surface.md`, `packages/cli-ts/src/index.ts`, and `packages/cli-python/onemem_cli/main.py`. |
| R2: Historical implementation/output sketches say they are historical | `cli-typescript-impl.md`, `cli-python-impl.md`, and `output-design.md` each carry a `Historical note, 2026-06-17`. |
| R3: `login-flow.md` has no fixed `localhost:12340` callback port claims | The flow now says the TS CLI uses an OS-assigned free loopback port. |
| R4: `login-flow.md` does not document `onemem logout` as current behavior | It now states no current logout command exists and revocation/deletion lifecycle is deferred. |
| R5: Structure tests enforce the historical/current boundary | `tests/structure.test.ts` checks historical notes, current login implementation note, and absence of fixed port/logout text. |
| R6: Context trail records cleanup | Research/spec/stories/plan/verification files exist and are registered in structure tests/wiki. |

## Gaps And Risks

- The historical design sketches still contain planned command examples after
  the banner. That is intentional preservation, but they remain non-authoritative.
