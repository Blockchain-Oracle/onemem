# Plan: Registry Publication Preflight

## Inputs

- Research:
  `.thoughts/research/2026-06-18-registry-publication-preflight.md`
- Existing release-auth plan and verification artifacts.
- Existing release workflow and publish script.
- Current local package manifests and workspace metadata.

## Assumptions

- Publication claims must be based on registry metadata, not on package files
  merely existing in the repo.
- The command should be read-only by default and usable without credentials.
- CI should guard the wiring but should not fail on current missing packages
  until registry publication is actually complete.

## Open Questions

- Whether strict registry publication should become a release workflow gate
  after first publishes are complete.

## Phase 1: Read-only Preflight

### Goal

Add one repo command that reports local npm and PyPI package versions against
public registry state.

### Work

- Add `scripts/check-registry-status.py`.
- Discover npm packages from local manifests.
- Discover Python packages from the `uv` workspace and package-local
  `pyproject.toml` metadata.
- Query npm and PyPI JSON metadata.
- Print a human-readable table and support JSON output plus strict/fail modes.
- Add `registry:status` to `package.json`.

### Checks

- `mise exec -- pnpm registry:status`
- `mise exec -- pnpm registry:status --strict`

### Acceptance Criteria Covered

- Operators can see current, missing, and version-drift packages in one command.
- Strict mode fails until registry state exactly matches local package versions.

### Stop Condition

The command reports current registry state without publishing anything.

## Phase 2: Docs And Guards

### Goal

Make the preflight discoverable and prevent accidental removal.

### Work

- Document `pnpm registry:status` in `.changeset/README.md`.
- Add structure assertions for the root script and registry endpoints.
- Register the script in the structure script inventory.
- Register this CE artifact set.

### Checks

- `mise exec -- pnpm test:structure`
- `mise exec -- pnpm exec biome check tests/structure package.json`
- `git diff --check`

### Acceptance Criteria Covered

- Release docs tell operators how to check npm/PyPI status before making claims.
- Structure tests guard the preflight command wiring.

### Stop Condition

Docs and structure tests pass.

## Verification Checkpoint

Write
`.thoughts/verification/2026-06-18-registry-publication-preflight.md`
before claiming the slice complete.

## Handoff Notes

This slice does not publish packages. It records and automates the registry
truth check that must precede any "published" claim.
