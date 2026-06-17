# Spec: Npm Bin Executable Integrity

## Objective

Ensure every OneMem npm package `bin` entry points to an existing Node script
with a proper shebang and executable file mode before publishing.

## Background And Current Reality

Five npm packages expose command-line bins. Dry-pack output shows all but one bin
ships with executable mode `493`; `@onemem/oc-onemem` ships `bin/init.mjs` with
mode `420` because the local file is not executable.

Source:
`.thoughts/research/2026-06-17-npm-bin-executable-integrity.md`.

## Users

- Maintainers preparing npm releases.
- Users installing OneMem CLIs and plugins through npm/npx.
- Future agents validating release artifacts.

## Goals

- Make `@onemem/oc-onemem`'s bin file executable.
- Add structure coverage for every npm package `bin` entry.
- Verify dry-pack output reports executable mode for every bin artifact.

## Non-goals

- Do not publish to npm.
- Do not bump package versions.
- Do not change bin script behavior.

## Requirements

- R1: Every package `bin` target must exist.
- R2: Every package `bin` target must start with `#!/usr/bin/env node`.
- R3: Every package `bin` target must be executable for the file owner.
- R4: `packages/plugin-openclaw/bin/init.mjs` must become executable.
- R5: Dry-pack output for every package bin file must report executable mode.
- R6: Context Engineering artifacts must be registered in structure tests.

## Acceptance Criteria

- AC1: `stat`/structure checks prove all package bin files have owner execute
  bit set.
- AC2: `npm pack --dry-run --json` for bin packages reports mode `493` for all
  bin entries.
- AC3: `pnpm test:structure` passes with the bin guard.
- AC4: `git diff --check` passes.

## Constraints

- Preserve unrelated dirty worktree changes.
- Keep this slice scoped to bin file mode and structure/release guards.
- Use npm dry-pack output as release-artifact evidence.

## Stories Needed

- Maintainer verifies npm bin artifacts are executable.
- Future agent catches a bad bin entry before release.

## Open Questions

- None blocking for this slice.

## Source References

- `.thoughts/research/2026-06-17-npm-bin-executable-integrity.md`
- `packages/plugin-openclaw/bin/init.mjs`
- `packages/*/package.json`
- `tests/structure.test.ts`
