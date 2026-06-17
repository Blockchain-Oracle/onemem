# Spec: Release Auth Gate

Date: 2026-06-17

## Objective

Stop unauthenticated default-branch Release runs from failing while preserving
the real publish path once npm/PyPI credentials or trusted publishing are
configured.

## Background And Current Reality

The repo has public GitHub marketplace manifests for Codex and Claude Code, but
npm registry publication remains blocked by missing auth or trusted-publisher
permissions. The current Release workflow attempts npm publishing on `main`
regardless of credential readiness, leaving Release red even when CI passes.

## Users

- Maintainers watching `main` health.
- Release operators configuring npm/PyPI publication.
- Future agents deciding whether packages are actually published.

## Goals

- G1: Keep `main` Release green when npm publishing is not configured.
- G2: Keep Changesets release PR creation available without npm credentials.
- G3: Preserve npm token publishing.
- G4: Preserve npm trusted publishing, but only behind an explicit repo variable
  opt-in.
- G5: Prevent PyPI publish attempts when PyPI credentials are absent.
- G6: Add structure tests so this workflow boundary does not regress.

## Non-goals

- No actual npm/PyPI publish in this slice.
- No npm organization permission changes.
- No npm trusted-publisher configuration outside GitHub.
- No package version bump.

## Requirements

- R1: `.github/workflows/release.yml` must expose job-level env variables for
  `NPM_TOKEN`, `PYPI_TOKEN`, and a trusted-publishing opt-in variable.
- R2: The workflow must run a Changesets version-only step when npm publishing
  is disabled.
- R3: The workflow must run the publish-capable Changesets step only when
  `NPM_TOKEN` is present or the trusted-publishing opt-in variable is enabled.
- R4: Python publish must run only after TS publish reports success and
  `PYPI_TOKEN` is present.
- R5: The workflow must emit notices when npm or PyPI publish is intentionally
  skipped.
- R6: `tests/structure.test.ts` must guard the release auth gates.
- R7: Release docs must state the credential gates honestly.

## Acceptance Criteria

- AC1: `mise exec -- pnpm test:structure` passes.
- AC2: `git diff --check` passes.
- AC3: Structure tests fail if the npm publish step is no longer gated.
- AC4: Structure tests fail if the unauthenticated Changesets version-only path
  disappears.
- AC5: Docs explain that npm publish needs either `NPM_TOKEN` or explicit
  trusted-publishing opt-in.

## Constraints

- Use GitHub Actions' documented pattern: secrets copied into job env before
  being used in `if:` conditions.
- Do not print secret values.
- Do not claim npm/PyPI publication until registry lookups show published
  versions.

## Open Questions

- Should the trusted-publishing opt-in variable be named
  `ONEMEM_NPM_TRUSTED_PUBLISHING` or another project-wide convention?

## Source References

- Research:
  `.thoughts/research/2026-06-17-release-auth-gate.md`
- Public plugin release verification:
  `.thoughts/verification/2026-06-17-public-plugin-release-state.md`
