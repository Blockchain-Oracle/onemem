# Plan: Walrus Sites Deploy Readiness

## Inputs

- Reality research:
  `.thoughts/research/2026-06-18-walrus-sites-deploy-readiness.md`
- Project quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`
- Current deploy docs and workflow.
- Official Walrus and Next.js docs fetched through Context7.

## Assumptions

- A deploy script must not exit successfully without deploying or proving a
  valid static artifact.
- The current hosted dashboard is still partly server-backed; a full static
  mirror is not proven in this slice.
- Manual deployment remains acceptable only when it fails loudly on missing
  prerequisites.

## Open Questions

- Which exact static mirror shape should eventually replace the dynamic hosted
  pages is left for a separate architecture slice.

## Phase 1: Replace Skeleton Script

### Goal

Make `scripts/deploy-walrus-sites.sh` a real preflight/deploy wrapper.

### Work

- Add argument parsing for `--check`, `--dry-run`, `--dist`, `--epochs`,
  `--context`, and `--object-id`.
- Validate that the deploy target is a directory with `index.html`.
- Reject missing or invalid artifacts with actionable errors.
- Call `site-builder --context=<network> deploy --epochs <N> <dist>` only in
  deploy mode.

### Checks

- Run the script in `--check` mode against a temporary valid static directory.
- Run the script in `--dry-run` mode against a temporary valid static directory.
- Run the script in `--check` mode against the default missing artifact and
  verify it fails.

### Acceptance Criteria Covered

- A no-op skeleton can no longer masquerade as deploy readiness.

### Stop Condition

- Script checks behave deterministically without requiring live Walrus funds.

## Phase 2: Fix Workflow And Docs Boundary

### Goal

Remove the known-broken `next export -o out` command and make the remaining
static-artifact boundary visible.

### Work

- Update `.github/workflows/deploy-walrus-sites.yml`.
- Update Walrus Sites README and dashboard architecture status rows.
- Update Walrus mirror architecture doc away from the invalid command.

### Checks

- Structure tests assert the deploy script is not a skeleton and the workflow no
  longer calls `next export -o out`.
- Full structure suite.

### Acceptance Criteria Covered

- Manual deployment fails for the right reason when no static artifact exists.
- Docs keep live deploy evidence pending.

### Stop Condition

- Local gates pass and verification audit is recorded.

## Verification Checkpoint

Write a verification audit that maps the script, workflow, docs, and tests to
the requirements above.

## Handoff Notes

This slice does not deploy to Walrus. It makes the deploy path honest and
executable once a valid static artifact and `site-builder` environment exist.
