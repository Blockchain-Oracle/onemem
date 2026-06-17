# Verification Audit: Release Auth Gate

Date: 2026-06-17

## Verdict

Pass.

The release workflow now separates release PR automation from registry upload.
When npm credentials are absent and trusted publishing has not been explicitly
enabled, Release can still create or update the Changesets release PR without
attempting npm publication. Real npm publication remains gated on either
`NPM_TOKEN` or `ONEMEM_NPM_TRUSTED_PUBLISHING=1|true`; Python publication
remains gated on successful TS publication plus `PYPI_TOKEN`.

## Artifacts Checked

- Research:
  `.thoughts/research/2026-06-17-release-auth-gate.md`
- Spec:
  `.thoughts/specs/2026-06-17-release-auth-gate.md`
- Stories:
  `.thoughts/stories/2026-06-17-release-auth-gate.md`
- Plan:
  `.thoughts/plans/2026-06-17-release-auth-gate.md`
- Workflow:
  `.github/workflows/release.yml`
- Release docs:
  `.changeset/README.md`
- Structure guard:
  `tests/structure.test.ts`

## Requirement Traceability

| Requirement | Evidence |
|---|---|
| R1: Job env maps release credentials | `.github/workflows/release.yml` maps `NPM_TOKEN`, `PYPI_TOKEN`, and `ONEMEM_NPM_TRUSTED_PUBLISHING` at job scope. |
| R2: Version-only no-auth path | Release has `Create Release PR without npm publish` with no `publish:` input. |
| R3: Publish-capable path gated | Release has `Create Release PR or publish to npm` gated on token auth or trusted-publishing opt-in. |
| R4: Python publish gated | Python publish requires `steps.changesets.outputs.published == 'true'` and non-empty `PYPI_TOKEN`. |
| R5: Skip notices | Release emits notices for skipped npm and PyPI publication. |
| R6: Structure guards | `tests/structure.test.ts` asserts the workflow gates and CE artifacts. |
| R7: Docs explain gates | `.changeset/README.md` names `NPM_TOKEN`, `ONEMEM_NPM_TRUSTED_PUBLISHING`, and `PYPI_TOKEN`. |

## Acceptance Criteria Coverage

| Acceptance Criterion | Evidence |
|---|---|
| AC1: `pnpm test:structure` passes | `mise exec -- pnpm test:structure`: 340 passing checks. |
| AC2: `git diff --check` passes | `git diff --check`: clean. |
| AC3: Guards fail if npm publish gate disappears | Structure tests assert publish-step `if:` and no-auth path. |
| AC4: Guards fail if version-only path disappears | Structure tests assert two Changesets action paths and no `publish:` in the version-only path. |
| AC5: Docs explain auth gates | `.changeset/README.md` includes the credential boundary and registry-lookup rule. |

## Quality Gates

Executed:

```bash
mise exec -- pnpm test:structure
git diff --check
ruby -e "require 'yaml'; YAML.load_file('.github/workflows/release.yml'); puts 'release.yml yaml ok'"
/opt/homebrew/bin/actionlint .github/workflows/release.yml
```

Results:

- Structure tests: passed, 340/340.
- Diff check: clean.
- YAML parse: `release.yml yaml ok`.
- Local `actionlint`: passed with no output.

## Deviations From Plan

- None.

## Gaps And Risks

- This does not publish npm or PyPI packages.
- If `ONEMEM_NPM_TRUSTED_PUBLISHING` is enabled before npmjs.com trusted
  publisher settings are actually configured, the publish-capable Release path
  will fail again. That is intentional: the variable is treated as an explicit
  release-operator assertion.

## Follow-ups

- Configure npm package/scope permissions, a repository `NPM_TOKEN`, or npm
  trusted publisher settings for `.github/workflows/release.yml`.
- Configure `PYPI_TOKEN` before expecting Python publication.
- Confirm real publication with registry lookups after the first authorized
  Release run.

## Evidence Log

- Context7 GitHub Actions docs checked for secret/`if:` condition behavior.
- `npm whoami`: failed with npm `E401`; no local npm auth.
- `gh secret list --repo Blockchain-Oracle/onemem`: no repository secrets
  visible to this account.
- `npm view @onemem/codex-plugin version`: failed with npm `E404`; Codex
  plugin is still not published.
- `mise exec -- pnpm test:structure`: passed, 340/340 checks.
- `git diff --check`: clean.
- `ruby -e "require 'yaml'; YAML.load_file(...)"`: release workflow YAML
  parsed.
- `/opt/homebrew/bin/actionlint .github/workflows/release.yml`: passed.
