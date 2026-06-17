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

## Verified Facts

- GitHub auth is present for `Blockchain-Oracle`, and
  `Blockchain-Oracle/onemem` is a public repository with default branch `main`.
- `origin/main` contains the older `packages/plugin-claude-code/` package but
  does not contain root `.claude-plugin/marketplace.json`.
- `origin/main` does not contain `.agents/plugins/marketplace.json` or
  `packages/plugin-codex/`.
- A clean Codex public marketplace install from `Blockchain-Oracle/onemem`
  currently fails because the fetched default branch does not contain a
  supported Codex marketplace manifest.
- A clean Claude Code public marketplace install from
  `Blockchain-Oracle/onemem` currently fails because the fetched default branch
  does not contain `.claude-plugin/marketplace.json`.
- The working tree contains local marketplace manifests and the Codex plugin
  package, but they are not yet present on the public default branch.
- `~/.npmrc` contains an npm registry auth token entry, but `npm whoami`
  returns `E401`; the token is invalid, expired, or lacks access.
- `NPM_TOKEN` and `NODE_AUTH_TOKEN` are not present in this shell.
- `@onemem/codex-plugin` and `@onemem/claude-code-plugin` are not currently
  published on npm.
- `.github/workflows/release.yml` is wired to publish npm packages from CI with
  `${{ secrets.NPM_TOKEN }}` through Changesets.
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

## Inferences

- The repo-local package work is not enough for public installation until the
  relevant marketplace manifests and plugin package files are committed and
  pushed to the branch users fetch.
- For production one-line install commands without `--ref`, the changes must
  land on `main`, because both Codex and Claude Code default to the repository's
  default branch for `owner/repo` marketplace sources.
- Npm publication from this shell is blocked by external authentication, not by
  package metadata alone.
- CI may be able to publish the npm packages if the repository secret
  `NPM_TOKEN` is valid, but that cannot be proven from this shell.
- The Codex plugin's stable MCP layer is not affected by the missing copied SDK
  dependency because `.mcp.json` launches `npx -y @onemem/mcp@latest`.
- The Codex optional hook layer no longer depends on a workspace symlink in the
  plugin cache, but live production coverage still requires trusted `/hooks`
  execution and real on-chain verification.

## Unknowns And Questions

- Whether GitHub Actions currently has a valid `NPM_TOKEN` secret.
- Whether the current dirty branch should be merged directly to `main` or opened
  as a PR after focused release verification.
- Whether full trusted Codex hook execution will succeed after the user reviews
  `/hooks`; package simulation tests do not prove hook trust in a real Codex
  session.
- Whether the `npx` CLI flush path is fast enough for all real Codex `Stop`
  hook sessions, or whether a long-running worker should replace it later.

## Not Included

- No npm upload was completed because npm auth is currently invalid.
- No direct push to `main` was performed in this research step.
- No live trusted Codex `/hooks` on-chain trace proof was performed.
