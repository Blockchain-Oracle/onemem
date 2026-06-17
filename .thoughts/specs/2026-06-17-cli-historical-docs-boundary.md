# Spec: CLI Historical Docs Boundary

## Objective

Make non-load-bearing CLI architecture documents safe to read by marking old
implementation/output sketches as historical and correcting concrete login-flow
details that diverged from current code.

## Users

- Future agents reading CLI architecture docs before editing code.
- Developers trying to understand current TS/Python CLI boundaries.
- Reviewers checking whether docs claim unimplemented CLI behavior.

## Goals

- Update the CLI README read-order and design principles to point at current
  command truth and describe richer installers/output as deferred.
- Add historical notes to `cli-typescript-impl.md`,
  `cli-python-impl.md`, and `output-design.md`.
- Correct `login-flow.md` so it describes OS-assigned callback ports and does
  not advertise current `onemem logout`.
- Add structure guards for the historical/current boundary.
- Record the cleanup in the repo-local Context Engineering trail.

## Non-goals

- Do not delete the old design sketches.
- Do not implement `logout`, runtime installers, trace tree, replay, or richer
  terminal UI.
- Do not claim live hosted wallet-popup proof.

## Requirements

- R1: Current truth must route to `command-surface.md` and package source files.
- R2: Historical implementation/output sketches must say they are historical.
- R3: `login-flow.md` must not mention fixed `localhost:12340` callback ports.
- R4: `login-flow.md` must not document `onemem logout` as current behavior.
- R5: Structure tests must enforce the historical/current boundary.
- R6: Context Engineering artifacts and wiki/log must record the cleanup.

## Acceptance Criteria

- AC1: `pnpm test:structure` passes.
- AC2: `git diff --check` passes.
- AC3: Targeted search confirms `login-flow.md` has no `12340` or
  `onemem logout` references.
- AC4: Verification artifact records evidence and residual risk.

## Constraints

- Existing dirty worktree must be preserved.
- This is docs/test/context cleanup.
- Keep artifacts in repo-local `.thoughts/`.
