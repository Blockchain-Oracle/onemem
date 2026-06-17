# Verification Audit: Plugin Marketplace Publication Readiness

## Verdict

Conditional pass.

Repository marketplace publication readiness is verified for both Codex and
Claude Code, and npm package publish dry-runs are clean. Actual npm upload was
not performed because npm authentication is absent in this shell. Live trusted
Codex hook-to-chain proof is still not claimed.

## Artifacts Checked

- `.thoughts/research/2026-06-17-plugin-marketplace-publication-readiness.md`
- `.thoughts/specs/2026-06-17-plugin-marketplace-publication-readiness.md`
- `.thoughts/stories/2026-06-17-plugin-marketplace-publication-readiness.md`
- `.thoughts/plans/2026-06-17-plugin-marketplace-publication-readiness.md`
- `.agents/plugins/marketplace.json`
- `.claude-plugin/marketplace.json`
- `packages/plugin-codex/`
- `packages/plugin-claude-code/`
- `tests/structure.test.ts`

## Requirement Traceability

- R1: Passed. Temporary `CODEX_HOME` installed `onemem-codex@onemem`.
- R2: Passed. `claude plugin validate . --strict` passed.
- R3: Passed. Temporary `HOME` installed `onemem@onemem`.
- R4: Passed. Npm dry-pack and publish dry-run include expected files.
- R5: Passed. Active docs/dashboard install strings now use repository
  marketplace commands.
- R6: Passed. `tests/structure.test.ts` guards both marketplace manifests.

## Acceptance Criteria Coverage

- AC1: `claude plugin validate packages/plugin-claude-code --strict` passed.
- AC2: `claude plugin validate . --strict` passed.
- AC3: Temporary Codex marketplace add/list/install passed with
  `onemem-codex@onemem`.
- AC4: Temporary Claude marketplace add/list/install passed with
  `onemem@onemem`.
- AC5: `npm publish --dry-run --access public` passed for
  `@onemem/codex-plugin` and `@onemem/claude-code-plugin`.
- AC6: Focused plugin tests/lints and structure tests passed.
- AC7: Remaining non-claims are explicit: npm auth missing; live Codex hook
  trust/on-chain proof pending.

## Quality Gates

```bash
claude plugin validate packages/plugin-claude-code --strict
claude plugin validate . --strict
```

Result: passed.

```bash
CODEX_HOME="$(mktemp -d)" codex plugin marketplace add /Users/abu/dev/hackathon/sui-overflow/onemem --json
CODEX_HOME="$tmp_home" codex plugin list --available --json
CODEX_HOME="$tmp_home" codex plugin add onemem-codex@onemem --json
```

Result: passed.

```bash
HOME="$(mktemp -d)" claude plugin marketplace add /Users/abu/dev/hackathon/sui-overflow/onemem
HOME="$tmp_home" claude plugin marketplace list
HOME="$tmp_home" claude plugin install onemem@onemem --scope user
HOME="$tmp_home" claude plugin list
```

Result: passed.

```bash
mise exec -- pnpm --filter @onemem/codex-plugin test
mise exec -- pnpm --filter @onemem/claude-code-plugin test
mise exec -- pnpm --filter @onemem/codex-plugin lint
mise exec -- pnpm --filter @onemem/claude-code-plugin lint
```

Results:

- Codex plugin: 6 tests passed; lint passed.
- Claude plugin: 4 tests passed; 1 live integration test skipped by default;
  lint passed.

```bash
cd packages/plugin-codex && npm publish --dry-run --access public
cd packages/plugin-claude-code && npm publish --dry-run --access public
```

Result: both passed, public access, warning-clean after repository URL
normalization.

```bash
mise exec -- pnpm test:structure
git diff --check
```

Results:

- `pnpm test:structure`: 288 passed.
- `git diff --check`: passed.

## Deviations From Plan

- No real npm upload was attempted after `npm whoami` returned `E401` and token
  presence checks showed no npm auth token in the environment or npm config.

## Gaps And Risks

- The marketplace commands using `Blockchain-Oracle/onemem` require these
  manifest changes to be present on the public branch users install from.
- Full automatic Codex tool-call trace coverage remains pending until a real
  Codex session trusts the hooks and emits a verifiable on-chain OneMem
  `TraceSession`.

## Follow-ups

- Restore npm authentication or run the publish from CI, then publish
  `@onemem/codex-plugin@0.1.0` and
  `@onemem/claude-code-plugin@0.1.0`.
- Run live trusted Codex hook proof and verify the resulting session on-chain.

## Evidence Log

- `npm whoami`: `E401`.
- `npm view @onemem/codex-plugin`: not found.
- `npm view @onemem/claude-code-plugin`: not found.
- `npm view @onemem/mcp`: latest `0.1.0`.
- Npm token presence check: `NPM_TOKEN`, `NODE_AUTH_TOKEN`, npm registry
  `_authToken` all missing.
