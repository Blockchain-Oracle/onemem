# Verification Audit: npm Provenance Release Hardening

Date: 2026-06-17

## Verdict

Pass for release-path hardening.

Actual npm publication remains unclaimed. Current registry/auth evidence still
shows `@onemem/codex-plugin` and `@onemem/claude-code-plugin` unpublished, and
local npm auth unavailable.

## Artifacts Checked

- Research:
  `.thoughts/research/2026-06-17-npm-provenance-release-hardening.md`
- Spec: `.thoughts/specs/2026-06-17-npm-provenance-release-hardening.md`
- Stories: `.thoughts/stories/2026-06-17-npm-provenance-release-hardening.md`
- Plan: `.thoughts/plans/2026-06-17-npm-provenance-release-hardening.md`
- Workflow: `.github/workflows/release.yml`
- Script: `scripts/publish-all.sh`
- Guard tests: `tests/structure.test.ts`
- npm docs fetched through Context7: `/websites/npmjs`

## Requirement Traceability

| Requirement | Evidence |
|---|---|
| R1: Workflow routes TS publishing through repo-owned script | `.github/workflows/release.yml` now sets Changesets action `publish: bash scripts/publish-all.sh ts`. |
| R2: Workflow opts TS npm publishing into provenance | Release step env sets `PUBLISH_ALL_NPM_PROVENANCE: "1"`. |
| R3: Public scoped package access is configured | Release step env sets `NPM_CONFIG_ACCESS: public`; `scripts/publish-all.sh` defaults `NPM_CONFIG_ACCESS` and `npm_config_access` to `public`. |
| R4: Token and trusted-publishing paths are both supported | Script forwards `NPM_TOKEN` to `NODE_AUTH_TOKEN` when needed; absence of a token does not abort the TS path, allowing npm OIDC/trusted publishing in GitHub Actions when configured. |
| R5: Python publication path still works | `PUBLISH_ALL_DRY_RUN=1 bash scripts/publish-all.sh python` rebuilt and dry-published all six Python packages successfully. |
| R6: Structure tests guard release behavior | `tests/structure.test.ts` now checks workflow publish command/env and script access/provenance/token-forwarding logic. |
| R7: Status remains honest | This audit, wiki status, and log distinguish hardening from actual npm upload. |

## Acceptance Criteria Coverage

| Acceptance Criterion | Evidence |
|---|---|
| AC1: TS script sets/preserves public npm access | Mocked `pnpm` probe printed `access=public` and `lower_access=public`; structure test also guards the script text. |
| AC2: TS script can opt into npm provenance | Mocked `pnpm` probe printed `provenance=true` and `lower_provenance=true` when `PUBLISH_ALL_NPM_PROVENANCE=1`. |
| AC3: Workflow uses `bash scripts/publish-all.sh ts` | `pnpm test:structure` passed the release workflow invariant. |
| AC4: Workflow sets provenance env switch | `pnpm test:structure` passed `PUBLISH_ALL_NPM_PROVENANCE: "1"` invariant. |
| AC5: Structure guard passes | `pnpm test:structure` passed 316 tests after this audit was added to the guarded artifact inventory. |
| AC6: Plugin package dry-runs pass | `npm publish --dry-run --access public` passed for both plugin packages. |
| AC7: npm auth remains explicitly recorded | `npm whoami` still returns `E401`; both `npm view` package checks still return `E404`. |

## Quality Gates

Executed:

```bash
npx ctx7@latest library npm "npm trusted publishing GitHub Actions publish scoped packages E404 permission first publish 2026"
npx ctx7@latest docs /websites/npmjs "trusted publishing GitHub Actions publish scoped packages first publish E404 permission package provenance npm token"
bash -n scripts/publish-all.sh
pnpm test:structure
cd packages/plugin-codex && npm publish --dry-run --access public
cd packages/plugin-claude-code && npm publish --dry-run --access public
PUBLISH_ALL_DRY_RUN=1 bash scripts/publish-all.sh python
```

Mocked no-upload TS script probe:

```bash
PATH="<tmp fake pnpm>:$PATH" \
  PUBLISH_ALL_NPM_PROVENANCE=1 \
  NPM_TOKEN=fake-token \
  bash scripts/publish-all.sh ts
```

Result:

```text
==> Publishing TS packages via Changesets...
cmd=changeset publish
access=public
lower_access=public
provenance=true
lower_provenance=true
node_auth=fake-token
```

Registry/auth checks:

```bash
npm view @onemem/codex-plugin version --json
# E404
npm view @onemem/claude-code-plugin version --json
# E404
npm whoami
# E401
```

## Deviations From Plan

- Did not run the actual TS publish command because it would upload packages if
  credentials were valid. The TS path was verified with a mocked `pnpm`
  executable that captured env and argv without network mutation.

## Gaps And Risks

- npm-side org permissions, repository `NPM_TOKEN`, or npm trusted-publisher
  registration remain external. Code cannot prove those are fixed.
- Changesets still decides the release set. This slice only controls npm config
  around the Changesets publish execution.

## Follow-ups

- Configure npm-side trusted publisher for
  `Blockchain-Oracle/onemem/.github/workflows/release.yml`, or provide a valid
  `NPM_TOKEN` secret with `@onemem` publish permission.
- Re-run the release workflow after config is fixed.
- Only claim publication after:

  ```bash
  npm view @onemem/codex-plugin version --json
  npm view @onemem/claude-code-plugin version --json
  ```

  return real versions.

## Evidence Log

- `bash -n scripts/publish-all.sh`: passed.
- `pnpm test:structure`: 316 passed after this audit was added to the guarded
  artifact inventory.
- `npm publish --dry-run --access public`:
  - `@onemem/codex-plugin@0.1.0`: passed.
  - `@onemem/claude-code-plugin@0.1.0`: passed.
- `PUBLISH_ALL_DRY_RUN=1 bash scripts/publish-all.sh python`: passed; all six
  Python packages built and dry-published.
- `npm whoami`: `E401`.
- `npm view @onemem/codex-plugin version --json`: `E404`.
- `npm view @onemem/claude-code-plugin version --json`: `E404`.
