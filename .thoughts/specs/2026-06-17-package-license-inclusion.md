# Spec: Package License Inclusion

## Objective

Ensure every publishable JavaScript `@onemem/*` npm package that declares
Apache-2.0 and lists `LICENSE` in its publish allowlist actually ships the
license text in its npm tarball.

## Background And Current Reality

The repo root has an Apache-2.0 `LICENSE`, and each publishable JS package
declares `"license": "Apache-2.0"`. The package manifests also list `LICENSE`
inside `files`, but no package-local `LICENSE` files exist. Representative
`npm pack --dry-run --json` checks prove the generated tarballs omit `LICENSE`.

Source:
`.thoughts/research/2026-06-17-package-license-inclusion.md`.

## Users

- Maintainers preparing npm releases.
- Consumers inspecting installed package license files.
- Future agents validating publish artifacts before release.

## Goals

- Add a package-local Apache-2.0 license file to every publishable JS package
  whose manifest already lists `LICENSE`.
- Keep package metadata, versions, runtime code, and public APIs unchanged.
- Add a structure guard that fails if a publishable JS package lists `LICENSE`
  but lacks the file.
- Prove npm dry-pack output includes `LICENSE`.

## Non-goals

- Do not publish npm packages.
- Do not bump package versions.
- Do not audit Python package build artifacts in this slice.
- Do not change package runtime behavior.

## Requirements

- R1: `packages/brand/LICENSE` exists and contains Apache-2.0 license text.
- R2: `packages/cli-ts/LICENSE` exists and contains Apache-2.0 license text.
- R3: `packages/dashboard/LICENSE` exists and contains Apache-2.0 license text.
- R4: `packages/mcp-server/LICENSE` exists and contains Apache-2.0 license text.
- R5: `packages/plugin-claude-code/LICENSE` exists and contains Apache-2.0
  license text.
- R6: `packages/plugin-codex/LICENSE` exists and contains Apache-2.0 license
  text.
- R7: `packages/plugin-openclaw/LICENSE` exists and contains Apache-2.0 license
  text.
- R8: `packages/provider-openai-agents/LICENSE` exists and contains Apache-2.0
  license text.
- R9: `packages/provider-vercel-ai/LICENSE` exists and contains Apache-2.0
  license text.
- R10: `packages/sdk-ts/LICENSE` exists and contains Apache-2.0 license text.
- R11: Structure tests guard package-local license presence for JS packages
  that list `LICENSE` in `files`.
- R12: Dry-pack verification proves `LICENSE` is included in npm tarballs.
- R13: Context Engineering artifacts are registered in structure tests.

## Acceptance Criteria

- AC1: A manifest scan reports `files_has_LICENSE=true` and
  `local_LICENSE=true` for the ten JS packages.
- AC2: `npm pack --dry-run --json` reports `LICENSE` in the file list for each
  targeted package.
- AC3: `pnpm test:structure` passes with the new license guard.
- AC4: `git diff --check` passes.

## Constraints

- Preserve unrelated dirty worktree changes.
- Keep this slice limited to license files, structure guard, and CE artifacts.
- Use full license text inside package tarballs, not repo-relative pointers.

## Stories Needed

- Maintainer verifies release tarballs include license files.
- Future agent catches a missing package-local license before publish.

## Open Questions

- Python package artifact license inclusion remains a separate audit if needed.

## Source References

- `.thoughts/research/2026-06-17-package-license-inclusion.md`
- `LICENSE`
- `packages/*/package.json`
- `tests/structure.test.ts`
