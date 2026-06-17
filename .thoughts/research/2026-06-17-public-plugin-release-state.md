# Reality Research: Public Plugin Release State

## Scope

Current release reality for making OneMem installable through public Codex and
Claude Code marketplace commands, plus npm package publication state for the
Codex and Claude Code plugin packages.

## Sources Checked

- `codex plugin marketplace --help`
- `codex plugin marketplace add Blockchain-Oracle/onemem --json` in a clean
  temporary `CODEX_HOME`
- `claude plugin marketplace add Blockchain-Oracle/onemem` in a clean temporary
  `HOME`
- `gh repo view Blockchain-Oracle/onemem --json nameWithOwner,visibility,defaultBranchRef,url`
- `git ls-tree -r --name-only origin/main`
- `npm whoami`
- `npm view @onemem/codex-plugin version --json`
- `npm view @onemem/claude-code-plugin version --json`
- `~/.npmrc` presence check with token value masked
- Repo files:
  - `.agents/plugins/marketplace.json`
  - `.claude-plugin/marketplace.json`
  - `packages/plugin-codex/`
  - `packages/plugin-claude-code/`
- `.github/workflows/release.yml`
- `gh secret list --repo Blockchain-Oracle/onemem --json name,updatedAt`
- `gh run view 27709795260 --repo Blockchain-Oracle/onemem --log-failed`
- `gh run view 27710076086 --repo Blockchain-Oracle/onemem --log-failed`
- `gh run watch 27710532983 --repo Blockchain-Oracle/onemem --exit-status`
- `gh run view 27710530899 --repo Blockchain-Oracle/onemem --log-failed`
- npm trusted publishing docs, checked 2026-06-17:
  `https://docs.npmjs.com/trusted-publishers/`

## Verified Facts

- GitHub auth is present for `Blockchain-Oracle`, and
  `Blockchain-Oracle/onemem` is a public repository with default branch `main`.
- Before branch publication, `origin/main` contained the older
  `packages/plugin-claude-code/` package but did not contain root
  `.claude-plugin/marketplace.json`, `.agents/plugins/marketplace.json`, or
  `packages/plugin-codex/`.
- After commit `1d85581` was pushed to `pillar-3-plugins` and fast-forwarded to
  `main`, clean Codex public marketplace install from
  `Blockchain-Oracle/onemem` passed without `--ref`.
- After commit `1d85581` was pushed to `main`, clean Claude Code public
  marketplace install from `Blockchain-Oracle/onemem` passed with sparse paths
  `.claude-plugin packages/plugin-claude-code`.
- `~/.npmrc` contains an npm registry auth token entry, but `npm whoami`
  returns `E401`; the token is invalid, expired, or lacks access.
- `NPM_TOKEN` and `NODE_AUTH_TOKEN` are not present in this shell.
- `@onemem/codex-plugin` and `@onemem/claude-code-plugin` are not currently
  published on npm.
- `.github/workflows/release.yml` is wired to publish npm packages from CI with
  `${{ secrets.NPM_TOKEN }}` through Changesets.
- `gh secret list --repo Blockchain-Oracle/onemem --json name,updatedAt`
  returned `[]`; the repository currently has no configured `NPM_TOKEN` secret.
- The Release workflow run created by pushing `main` failed in the
  `changesets/action` publish step. Logs show `NPM_TOKEN:` empty, Changesets
  attempted OIDC, and npm returned `ENEEDAUTH` while trying to publish
  unpublished packages including `@onemem/codex-plugin@0.1.0` and
  `@onemem/claude-code-plugin@0.1.0`.
- Official npm trusted publishing docs state that trusted publishing requires
  npm CLI `11.5.1` or later and Node `22.14.0` or higher, plus a trusted
  publisher configured on npmjs.com for the package/workflow.
- The repo's mise toolchain used Node `20.18.0` and npm `10.8.2` during the
  failed release, so the workflow needed a release-only Node/npm upgrade even
  if npm-side trusted publisher configuration is added.
- After the release workflow was moved to Node `24` plus `npm@latest`, Release
  run `27710076086` reached npm with OIDC available but still failed with
  `E404 Not Found - PUT` for unpublished packages including
  `@onemem/codex-plugin@0.1.0`, `@onemem/claude-code-plugin@0.1.0`,
  `@onemem/cli@0.1.0`, `@onemem/brand@0.1.0`, and
  `@onemem/dashboard@0.1.0`.
- Commit `a35779b` fixed Python typecheck regressions in the CLI/network
  validator, ElevenLabs tracer, LiveKit tracer, and SDK memory tests. It is
  pushed to both `pillar-3-plugins` and `main`.
- Main CI run `27710532983` passed all repository gates on commit `a35779b`,
  including the previously failing Python typecheck step.
- Release run `27710530899` still failed in npm publish with `E404 Not Found -
  PUT` permission errors for unpublished packages:
  `@onemem/brand@0.1.0`, `@onemem/cli@0.1.0`,
  `@onemem/dashboard@0.1.0`, `@onemem/claude-code-plugin@0.1.0`, and
  `@onemem/codex-plugin@0.1.0`.
- An initial temporary local Codex marketplace install created a plugin cache
  entry for `onemem-codex@onemem` with an empty copied
  `node_modules/@onemem` scope; the workspace symlink to `@onemem/sdk-ts` was
  not available inside the Codex cache.
- The current Codex hook implementation no longer imports
  `@onemem/sdk-ts/runtime` from the plugin cache. It arms local state on
  `SessionStart`, buffers on `PostToolUse`, and flushes on `Stop` through
  `npx -y -p @onemem/sdk-ts@0.6.0 onemem-trace`.
- A clean Codex plugin-cache simulation ran
  `SessionStart -> PostToolUse -> Stop` successfully using `ONEMEM_TRACE_CLI`
  as a fake local trace CLI override; the emitted payload contained the expected
  Codex tool call.
- A temporary local Claude Code marketplace install creates a plugin cache entry
  whose `node_modules/@onemem/sdk-ts/dist/runtime.js` is present.
- On 2026-06-17, the Claude Code release tag `onemem--v0.1.0` was created and
  pushed. The annotated tag resolves to `origin/main` commit `640c3a3`.
- Fresh public default-branch marketplace installs still pass for both Codex and
  Claude Code after the tag push.
- `npm pack` inspection found that the Claude Code plugin tarball still carried
  a runtime dependency on `@onemem/sdk-ts: "workspace:*"`. The plugin package
  manifests were changed to use the published SDK range `^0.6.0`, and tarball
  re-inspection confirmed no `workspace:*` remains in either plugin package.
- Direct `npm publish --access public` attempts for
  `@onemem/codex-plugin@0.1.0` and
  `@onemem/claude-code-plugin@0.1.0` still failed with npm `E404 Not Found -
  PUT ... or you do not have permission to access it`.

## Inferences

- The repo-local package work was not enough for public installation until the
  relevant marketplace manifests and plugin package files were committed and
  pushed to the branch users fetch.
- Production one-line install commands without `--ref` require `main`, because
  both Codex and Claude Code default to the repository's default branch for
  `owner/repo` marketplace sources. This is now satisfied.
- Npm publication from this shell is blocked by external authentication, not by
  package metadata alone.
- CI cannot currently publish with a token because the repository has no
  `NPM_TOKEN` secret. CI may publish through OIDC only after npm trusted
  publisher settings or package/scope publish permissions are configured on
  npmjs.com.
- The Codex plugin's stable MCP layer is not affected by the missing copied SDK
  dependency because `.mcp.json` launches `npx -y @onemem/mcp@latest`.
- The Codex optional hook layer no longer depends on a workspace symlink in the
  plugin cache, but live production coverage still requires trusted `/hooks`
  execution and real on-chain verification.
- Repository marketplace publication and Claude Code tag publication are in our
  control and are complete for v0.1.0. Npm package publication is blocked by
  npm scope/package permission rather than by package contents.

## Unknowns And Questions

- Whether npm trusted publisher settings exist for any `@onemem/*` packages on
  npmjs.com.
- Whether the npm organization/scope can publish first versions of new packages
  by trusted publishing alone, or whether first publish requires a token/account
  publish.
- Whether full trusted Codex hook execution will succeed after the user reviews
  `/hooks`; package simulation tests do not prove hook trust in a real Codex
  session.
- Whether the `npx` CLI flush path is fast enough for all real Codex `Stop`
  hook sessions, or whether a long-running worker should replace it later.
- Which npm account, organization permission, `NPM_TOKEN`, or npm trusted
  publisher configuration is authorized to create first publishes under the
  `@onemem` scope.

## Not Included

- No npm upload was completed because npm auth is currently invalid.
- `main` was later fast-forwarded after verification, and public default-branch
  marketplace installs passed.
- No live trusted Codex `/hooks` on-chain trace proof was performed.
