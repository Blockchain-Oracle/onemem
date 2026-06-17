# Plan: Release Auth Gate

Date: 2026-06-17

## Inputs

- Research:
  `.thoughts/research/2026-06-17-release-auth-gate.md`
- Spec:
  `.thoughts/specs/2026-06-17-release-auth-gate.md`
- Stories:
  `.thoughts/stories/2026-06-17-release-auth-gate.md`
- Current workflow:
  `.github/workflows/release.yml`
- Current guards:
  `tests/structure.test.ts`

## Assumptions

- The correct default is to keep release PR automation active but skip registry
  upload when auth is not configured.
- Trusted publishing can be re-enabled with a repo variable after npm-side
  trusted publisher configuration exists.

## Phase 1: Workflow Gate

### Goal

Make publish attempts explicit and credential-gated.

### Work

- Add job-level env variables for `NPM_TOKEN`, `PYPI_TOKEN`, and
  `ONEMEM_NPM_TRUSTED_PUBLISHING`.
- Add a notice and version-only Changesets step for the no-publish path.
- Gate the publish-capable Changesets step on npm token or trusted-publisher
  opt-in.
- Gate Python publish on `PYPI_TOKEN` and successful TS publish.
- Add a notice for skipped PyPI publish after npm publish.

### Checks

- `mise exec -- pnpm test:structure`

### Acceptance Criteria Covered

- AC1, AC3, AC4.

## Phase 2: Docs And Guards

### Goal

Document and test the release boundary.

### Work

- Update `.changeset/README.md`.
- Add structure assertions for the no-auth path, publish gate, trusted-publisher
  opt-in, and PyPI token gate.
- Register CE artifacts in the structure artifact list.
- Update wiki index/log.

### Checks

- `mise exec -- pnpm test:structure`
- `git diff --check`

### Acceptance Criteria Covered

- AC1, AC2, AC5.

## Phase 3: Verification And Publish

### Goal

Record proof and move the branch forward.

### Work

- Write verification audit.
- Commit and push the slice to `pillar-3-plugins`.
- If local gates pass and the branch remains fast-forwardable, push the same
  head to `main` and watch CI/Release because this slice directly fixes a
  default-branch failure mode.

### Stop Condition

The release workflow is guarded, local structure/diff checks pass, and the
remote branch has the focused commit.

## Verification Checkpoint

Use `abu-context-engineering:verification-audit` before claiming completion.

## Handoff Notes

Do not claim npm or PyPI publication from this slice. This only prevents known
credential absence from making default-branch Release red.
