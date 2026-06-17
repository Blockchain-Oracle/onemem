# Verification Audit: Public Plugin Release State

## Verdict

Conditional pass.

The repo-local plugin package and marketplace shapes verify cleanly for Codex
and Claude Code. Npm package dry-runs are clean. Public GitHub install from
`Blockchain-Oracle/onemem` without a ref still fails today because `main` does
not yet contain the new marketplace manifests and Codex plugin package. Npm
upload is blocked by invalid npm authentication in this shell. Codex's stable
MCP layer remains publishable, and the optional hook scripts now run from a
clean Codex plugin cache without a workspace SDK symlink by flushing through the
published `@onemem/sdk-ts@0.6.0` trace CLI. Full automatic Codex trace coverage
is still not production-claimed until a trusted `/hooks` session emits and
verifies a real on-chain OneMem `TraceSession`.

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

- Public Codex marketplace shape: implemented locally in
  `.agents/plugins/marketplace.json` and verified through a temporary clean
  `CODEX_HOME` local checkout install.
- Public Claude Code marketplace shape: implemented locally in
  `.claude-plugin/marketplace.json` and verified through `claude plugin
  validate . --strict` plus a temporary clean `HOME` local checkout install.
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
  Evidence: temporary `CODEX_HOME` local checkout marketplace add/install
  passed.
- AC2: Claude Code can install the plugin from a marketplace root containing
  `.claude-plugin/marketplace.json`.
  Evidence: temporary `HOME` local checkout marketplace add/install passed.
- AC3: Public GitHub marketplace install from default branch is not claimed.
  Evidence: clean Codex and Claude Code public GitHub install tests both failed
  against current `main` because the manifests are not present there.
- AC4: Npm packages are ready to publish but not published from this shell.
  Evidence: dry-runs passed; `npm whoami` returns `E401`.
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

## Deviations From Plan

- Direct npm upload was not attempted after `npm whoami` returned `E401`.
- Public default-branch install was tested and failed before branch publication;
  the failure is recorded as a blocker rather than hidden behind local install
  proof.

## Gaps And Risks

- The public GitHub commands without `--ref` require these files to land on
  `main`.
- The configured npm token in `~/.npmrc` is unusable; a valid token or CI secret
  is required for registry publication.
- Full Codex hook trace coverage still needs a real trusted `/hooks` session and
  on-chain OneMem `TraceSession` verification.
- Codex hook trace coverage still needs live trusted `/hooks` proof against a
  real chain trace. The current `npx` flush path may be slower than a future
  worker, but it avoids the workspace-symlink install trap.

## Follow-ups

- Push the focused branch commit and verify GitHub marketplace install with
  `--ref pillar-3-plugins`.
- Merge or fast-forward the marketplace commit to `main`, then verify the same
  GitHub marketplace commands without `--ref`.
- Restore npm auth or rely on a valid `NPM_TOKEN` GitHub secret, then publish
  the plugin packages and confirm `npm view` returns the published versions.
- Run live trusted Codex hook proof and verify the emitted session on-chain.
- Consider replacing `npx` Stop flushing with a warm worker if real Codex
  sessions show unacceptable Stop-hook latency.

## Evidence Log

- Clean public Codex install from `Blockchain-Oracle/onemem`: failed because the
  fetched default branch has no supported Codex marketplace manifest.
- Clean public Claude install from `Blockchain-Oracle/onemem`: failed because
  `.claude-plugin/marketplace.json` is absent from the fetched default branch.
- `npm whoami`: `E401`.
- `npm view @onemem/codex-plugin`: `E404`.
- `npm view @onemem/claude-code-plugin`: `E404`.
