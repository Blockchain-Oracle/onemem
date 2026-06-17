# Verification Audit: Public Plugin Release State

## Verdict

Pass for GitHub marketplace publication; conditional fail for npm registry
publication.

The repo-local plugin package and marketplace shapes verify cleanly for Codex
and Claude Code, and the verified release commit has been pushed to both
`pillar-3-plugins` and `main`. Public GitHub marketplace installs from
`Blockchain-Oracle/onemem` now pass without a branch/ref suffix for Codex and
Claude Code. Npm package dry-runs are clean, but npm upload is blocked because
local npm auth is invalid, the repository has no `NPM_TOKEN` GitHub secret, and
the release workflow's OIDC path still requires npm-side trusted publisher
configuration plus an npm/Node runtime that supports trusted publishing.
Codex's stable MCP layer remains installable, and the optional hook scripts run
from a clean Codex plugin cache without a workspace SDK symlink by flushing
through the published `@onemem/sdk-ts@0.6.0` trace CLI. Full automatic Codex
trace coverage is still not production-claimed until a trusted `/hooks` session
emits and verifies a real on-chain OneMem `TraceSession`.

## Artifacts Checked

- `.thoughts/research/2026-06-17-public-plugin-release-state.md`
- `.thoughts/plans/2026-06-17-public-plugin-release-state.md`
- `.agents/plugins/marketplace.json`
- `.agents/plugins/README.md`
- `.claude-plugin/marketplace.json`
- `packages/plugin-codex/`
- `packages/plugin-claude-code/`
- `packages/sdk-ts/src/runtime.ts`
- `packages/sdk-ts/src/runtime-controls.ts`
- `tests/structure.test.ts`

## Requirement Traceability

- Public Codex marketplace shape: implemented in
  `.agents/plugins/marketplace.json` and verified through temporary clean
  `CODEX_HOME` installs from both a local checkout and the public default branch.
- Public Claude Code marketplace shape: implemented in
  `.claude-plugin/marketplace.json` and verified through `claude plugin
  validate . --strict` plus temporary clean `HOME` installs from both a local
  checkout and the public default branch.
- Plugin package contents: verified by `npm publish --dry-run --access public`
  for `@onemem/codex-plugin@0.1.0` and
  `@onemem/claude-code-plugin@0.1.0`.
- Hook runtime dependency: the Codex hook scripts no longer import
  `@onemem/sdk-ts/runtime` from the plugin cache; `Stop` shells out to the
  published trace CLI.
- Clean Codex plugin-cache hook lifecycle: verified with a temporary clean
  `CODEX_HOME` install and a fake `ONEMEM_TRACE_CLI` override.
- Honest publication boundary: active docs now avoid claiming every provider is
  published/live-tested and plugin READMEs name the public-branch requirement.

## Acceptance Criteria Coverage

- AC1: Codex can install the plugin from a marketplace root containing
  `.agents/plugins/marketplace.json`.
  Evidence: temporary `CODEX_HOME` local checkout and public
  `Blockchain-Oracle/onemem` marketplace add/install passed.
- AC2: Claude Code can install the plugin from a marketplace root containing
  `.claude-plugin/marketplace.json`.
  Evidence: temporary `HOME` local checkout and public
  `Blockchain-Oracle/onemem` marketplace add/install passed.
- AC3: Public GitHub marketplace install from default branch is claimed.
  Evidence: clean Codex and Claude Code public GitHub install tests both passed
  after `main` was fast-forwarded to the verified release commit.
- AC4: Npm packages are ready to publish but not published from this shell.
  Evidence: dry-runs passed; `npm whoami` returns `E401`; `gh secret list`
  returns no repository secrets; release workflow failed with npm `ENEEDAUTH`.
- AC5: Clean Codex hook lifecycle no longer depends on workspace symlinks.
  Evidence: installed plugin-cache scripts emitted a valid trace payload through
  a fake `ONEMEM_TRACE_CLI`.
- AC6: Live trusted Codex hook-to-chain proof is not claimed.
  Evidence: no real trusted `/hooks` Codex session was run in this slice.

## Quality Gates

```bash
mise exec -- pnpm --filter @onemem/codex-plugin test
```

Result: passed, 8 tests.

```bash
mise exec -- pnpm --filter @onemem/claude-code-plugin test
```

Result: passed, 4 tests; 1 live integration test skipped by default.

```bash
mise exec -- pnpm --filter @onemem/sdk-ts test -- runtime-controls runtime
```

Result: passed, 73 tests; 5 integration tests skipped by default.

```bash
mise exec -- pnpm --filter @onemem/codex-plugin lint
mise exec -- pnpm --filter @onemem/claude-code-plugin lint
```

Result: both passed.

```bash
mise exec -- pnpm test:structure
git diff --check
```

Result: structure passed, 297 tests; diff check passed.

```bash
mise exec -- pnpm lint
mise exec -- pnpm typecheck
mise exec -- pnpm test
mise exec -- pnpm build
```

Results:

- `pnpm lint`: exit 0; existing warnings remain in older files.
- `pnpm typecheck`: passed, 11 successful tasks.
- `pnpm test`: passed, 12 successful tasks.
- `pnpm build`: passed, 9 successful tasks.

```bash
claude plugin validate packages/plugin-claude-code --strict
claude plugin validate . --strict
```

Result: both passed.

```bash
cd packages/plugin-codex && npm publish --dry-run --access public
cd packages/plugin-claude-code && npm publish --dry-run --access public
```

Result: both passed and included the expected manifest, hook, script, skill,
README, and LICENSE files.

```bash
CODEX_HOME="$tmp/codex-home" codex plugin marketplace add /Users/abu/dev/hackathon/sui-overflow/onemem --json
CODEX_HOME="$tmp/codex-home" codex plugin add onemem-codex@onemem --json
```

Result: passed.

```bash
PLUGIN_DATA="$tmp/plugin-data" ONEMEM_NAMESPACE_ID=0xnamespace ONEMEM_RW_CAP_ID=0xrw \
  node "$codex_plugin_cache/scripts/inject.js"
PLUGIN_DATA="$tmp/plugin-data" ONEMEM_NAMESPACE_ID=0xnamespace ONEMEM_RW_CAP_ID=0xrw \
  node "$codex_plugin_cache/scripts/observe.js"
PLUGIN_DATA="$tmp/plugin-data" ONEMEM_NAMESPACE_ID=0xnamespace ONEMEM_RW_CAP_ID=0xrw \
  ONEMEM_TRACE_CLI="$fake" node "$codex_plugin_cache/scripts/summarize.js"
```

Result: passed. The clean plugin-cache lifecycle emitted a payload with
`environment: "codex"`, target namespace/cap ids, and the buffered `Bash` tool
call. This used a fake CLI to avoid touching chain.

```bash
HOME="$tmp/home" claude plugin marketplace add /Users/abu/dev/hackathon/sui-overflow/onemem
HOME="$tmp/home" claude plugin install onemem@onemem
HOME="$tmp/home" claude plugin list
```

Result: passed.

```bash
CODEX_HOME="$tmp/codex-home" codex plugin marketplace add Blockchain-Oracle/onemem --json
CODEX_HOME="$tmp/codex-home" codex plugin add onemem-codex@onemem --json
```

Result: passed from public `main`.

```bash
HOME="$tmp/claude-home" claude plugin marketplace add Blockchain-Oracle/onemem --sparse .claude-plugin packages/plugin-claude-code
HOME="$tmp/claude-home" claude plugin install onemem@onemem
HOME="$tmp/claude-home" claude plugin list
```

Result: passed from public `main`; plugin `onemem@onemem` installed and enabled.

```bash
gh run view 27709795260 --repo Blockchain-Oracle/onemem --log-failed
```

Result: release workflow failed in `changesets/action` publish step. It found no
`NPM_TOKEN`, attempted OIDC, then npm returned `ENEEDAUTH` for unpublished
packages including `@onemem/codex-plugin@0.1.0` and
`@onemem/claude-code-plugin@0.1.0`.

## Deviations From Plan

- Direct npm upload was not attempted after `npm whoami` returned `E401`.
- Public default-branch install initially failed before branch publication, then
  passed after the verified release commit was pushed to `main`.
- The first Release workflow run failed because npm authentication/trusted
  publishing was not actually usable.

## Gaps And Risks

- The public GitHub commands without `--ref` are now working from `main`.
- The configured npm token in `~/.npmrc` is unusable; no `NPM_TOKEN` repository
  secret is present; npm registry publication requires either a valid secret or
  npm trusted publisher entries for the packages and workflow.
- The release workflow was still using Node 20/npm 10 before the follow-up fix;
  npm docs require npm 11.5.1+ and Node 22.14+ for trusted publishing.
- Full Codex hook trace coverage still needs a real trusted `/hooks` session and
  on-chain OneMem `TraceSession` verification.
- Codex hook trace coverage still needs live trusted `/hooks` proof against a
  real chain trace. The current `npx` flush path may be slower than a future
  worker, but it avoids the workspace-symlink install trap.

## Follow-ups

- Configure npm registry authentication: either add a valid `NPM_TOKEN` repo
  secret or configure npm trusted publishers for `release.yml` on npmjs.com.
- Re-run the Release workflow after auth is configured, then confirm `npm view`
  returns versions for `@onemem/codex-plugin` and
  `@onemem/claude-code-plugin`.
- Run live trusted Codex hook proof and verify the emitted session on-chain.
- Consider replacing `npx` Stop flushing with a warm worker if real Codex
  sessions show unacceptable Stop-hook latency.

## Evidence Log

- Clean public Codex install from `Blockchain-Oracle/onemem`: initially failed
  before branch publication; passed after `main` was fast-forwarded.
- Clean public Claude install from `Blockchain-Oracle/onemem`: initially failed
  before branch publication; passed after `main` was fast-forwarded.
- `npm whoami`: `E401`.
- `npm view @onemem/codex-plugin`: `E404`.
- `npm view @onemem/claude-code-plugin`: `E404`.
- `gh secret list --repo Blockchain-Oracle/onemem`: `[]`.
- Release run `27709795260`: failed with npm `ENEEDAUTH`.
