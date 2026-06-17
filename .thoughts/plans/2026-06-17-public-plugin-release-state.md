# Plan: Public Plugin Release State

## Inputs

- Reality research:
  `.thoughts/research/2026-06-17-public-plugin-release-state.md`
- Prior plugin publication readiness artifacts:
  `.thoughts/research/2026-06-17-plugin-marketplace-publication-readiness.md`
  and
  `.thoughts/verification/2026-06-17-plugin-marketplace-publication-readiness.md`
- Repo state on branch `pillar-3-plugins`
- Current public repository default branch: `main`

## Assumptions

- GitHub marketplace publication means users can run
  `codex plugin marketplace add Blockchain-Oracle/onemem` and
  `claude plugin marketplace add Blockchain-Oracle/onemem` without a local
  checkout.
- Npm publication means `npm view @onemem/codex-plugin` and
  `npm view @onemem/claude-code-plugin` return real package versions.
- Live hook coverage should not be claimed until a trusted runtime session emits
  and verifies a OneMem `TraceSession`.

## Open Questions

- Whether to merge the current branch directly to `main` or use a PR. The user
  asked for publication now, but the worktree is large and dirty, so commits
  should stay focused.
- Whether repository CI has a valid `NPM_TOKEN` secret.

## Phase 1: Truthful Release Surface

### Goal

Remove ambiguity and overclaims from install docs while keeping public
marketplace commands as the intended install path.

### Work

- Add `.agents/plugins/README.md` explaining Codex's relative `source:
  "local"` marketplace entry.
- Update active docs/READMEs where they overstate provider publication or hide
  the branch dependency for public marketplace install.

### Checks

- `rg` for stale local-only or overclaim text.
- `git diff --check`.

### Acceptance Criteria Covered

- Public docs do not imply a local checkout path is the production install path.
- Docs do not claim package publication or hook proof that has not happened.

### Stop Condition

Install docs clearly distinguish public marketplace install, local development
install, and trusted hook proof.

## Phase 2: Focused Commit For Marketplace Files

### Goal

Create a focused commit containing the public marketplace manifests, plugin
packages, required SDK runtime exports, tests, and CE release-state artifacts.

### Work

- Stage only files required by the Codex/Claude plugin release path.
- Keep unrelated dirty files unstaged.
- Run package tests and structure checks before committing.

### Checks

- `mise exec -- pnpm --filter @onemem/codex-plugin test`
- `mise exec -- pnpm --filter @onemem/claude-code-plugin test`
- `mise exec -- pnpm --filter @onemem/sdk-ts test`
- `mise exec -- pnpm test:structure`
- `git diff --check`

### Acceptance Criteria Covered

- Public marketplace files are in Git, not only the working tree.
- Runtime helper imports used by hooks are present in the same commit lineage.

### Stop Condition

Commit exists locally and focused verification passes.

## Phase 3: Public Branch And Registry Verification

### Goal

Prove what can be published from this machine and record exact blockers for what
cannot.

### Work

- Push the focused branch commit.
- Test GitHub marketplace install with `--ref pillar-3-plugins`.
- If/when merged to `main`, retest without `--ref`.
- Attempt npm auth check and, if authenticated, publish plugin packages; if not,
  record the auth blocker.

### Checks

- Clean temporary `CODEX_HOME` install from GitHub.
- Clean temporary `HOME` Claude install from GitHub.
- `npm whoami`.
- `npm publish --dry-run --access public` for both plugin packages.

### Acceptance Criteria Covered

- Public GitHub install proof exists for the exact branch tested.
- Npm publication either completes or has a precise external blocker.

### Stop Condition

Verification audit states pass, conditional pass, or fail with evidence.

## Verification Checkpoint

Write
`.thoughts/verification/2026-06-17-public-plugin-release-state.md`
before claiming publication readiness.

## Handoff Notes

Do not claim "published" for npm packages until registry lookups return the
published versions. Do not claim "full automatic Codex trace coverage" until a
real trusted Codex `/hooks` session emits and verifies an on-chain OneMem
`TraceSession`.
