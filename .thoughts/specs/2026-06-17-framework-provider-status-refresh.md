# Spec: Framework Provider Status Refresh

## Objective

Make framework-provider status documentation match the current repository and
registry reality without overclaiming deferred memory-provider behavior or
runtime/CLI publication.

## Background And Current Reality

The current provider overview at `docs/04-framework-providers/README.md` already
tracks the implemented provider packages. The architecture overview at
`docs/05-our-architecture/04-frameworks/README.md` still marks the same five
providers as pending even though package manifests, READMEs, tests, and registry
checks show provider packages exist.

## Users

- Abu and future project agents planning next work.
- Demo/release reviewers checking what OneMem actually ships.
- Developers reading architecture docs before choosing an integration path.

## Goals

- Replace stale pending rows for built framework providers.
- Preserve honest boundaries for Python provider memory helpers and original
  Mem0-style provider ergonomics.
- Separate framework-provider registry status from runtime plugin/CLI package
  publication.
- Add a structure guard so the stale pending table does not return.

## Non-goals

- Publish or republish packages.
- Change provider runtime behavior.
- Claim live third-party framework execution beyond existing package tests and
  documented traces.
- Resolve runtime plugin or CLI publication gaps.

## Requirements

- R1: `docs/05-our-architecture/04-frameworks/README.md` must not mark the five
  built framework provider packages as pending.
- R2: The same README must describe the current v0.1 scope for TypeScript
  providers as trace capture plus explicit `createOneMemMemory(...)`.
- R3: The same README must describe Python providers as trace providers and keep
  memory-provider helpers deferred.
- R4: The same README must record checked registry evidence only for the
  framework provider packages, not for all OneMem packages.
- R5: `tests/structure.test.ts` must fail if the five provider rows regress to
  `⏳ pending`.

## Acceptance Criteria

- AC1: `rg` finds no `⏳ pending` implementation-status rows for the five built
  provider package names in `docs/05-our-architecture/04-frameworks/README.md`.
- AC2: Structure tests pass and include a guard for the architecture framework
  status table.
- AC3: The architecture README still names deferred Python memory-provider work.
- AC4: The Context Engineering wiki indexes this research/spec/plan/verification
  slice.

## Constraints

- Keep historical design context readable; do not rewrite every old design page
  in this slice.
- Keep docs ASCII.
- Use existing structure-test style and no new dependencies.

## Stories Needed

- A developer reads the architecture README and sees accurate current provider
  status.
- A future agent attempts to reintroduce pending provider rows and structure
  tests fail.

## Open Questions

- Should runtime plugin/CLI publication become the next release-focused slice?
- Should every per-framework historical design page get a current-scope banner?

## Source References

- `.thoughts/research/2026-06-17-framework-provider-status-refresh.md`
- `docs/04-framework-providers/README.md`
- `packages/provider-*/README.md`
