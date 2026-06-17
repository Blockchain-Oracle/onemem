# Reality Research: Plugin Marketplace Publication Readiness

## Scope

Current reality for making the OneMem Codex and Claude Code plugins installable
through public/repository marketplace flows instead of local checkout paths, and
for determining whether npm publication can happen from this machine.

## Sources Checked

- OpenAI Codex plugin docs:
  `https://developers.openai.com/codex/plugins/build`
- OpenAI Codex hooks docs:
  `https://developers.openai.com/codex/hooks`
- Claude Code plugin marketplace docs:
  `https://code.claude.com/docs/en/plugin-marketplaces`
- Local CLIs:
  - `codex plugin marketplace --help`
  - `codex plugin add --help`
  - `claude plugin marketplace --help`
  - `claude plugin validate --help`
- Repo files:
  - `.agents/plugins/marketplace.json`
  - `.claude-plugin/marketplace.json`
  - `packages/plugin-codex/`
  - `packages/plugin-claude-code/`
  - `packages/dashboard/lib/runtimes.ts`
  - `apps/docs/integrations/runtimes.mdx`

## Verified Facts

- Codex supports marketplace sources from local paths, `owner/repo`, HTTPS Git,
  SSH Git, and sparse Git checkouts.
- Codex installs plugins from `.agents/plugins/marketplace.json` using selectors
  like `plugin@marketplace`.
- Claude Code supports marketplace add/install flows and validates plugin or
  marketplace manifests with `claude plugin validate`.
- Claude Code validates a repository marketplace manifest at
  `.claude-plugin/marketplace.json`.
- Before this slice, OneMem had a Codex marketplace manifest named
  `onemem-local` and no Claude Code marketplace manifest at the repo root.
- Before this slice, active docs and dashboard runtime metadata still pointed
  Claude Code users at `/absolute/path/to/packages/plugin-claude-code`.
- `npm whoami` returns `E401`; no `NPM_TOKEN`, `NODE_AUTH_TOKEN`, npm config
  registry auth token, or equivalent npm token is present in this environment.
- Registry lookup shows `@onemem/codex-plugin` and
  `@onemem/claude-code-plugin` are not currently published to npm.
- `@onemem/mcp@0.1.0` is published on npm.

## Inferences

- The repo can be made marketplace-installable through GitHub by using
  `Blockchain-Oracle/onemem` as the marketplace source after these files land on
  a public branch.
- Npm publishing cannot be completed from this shell until npm authentication is
  restored.
- A successful marketplace install proves package discovery and installation,
  but not live trusted Codex hook execution. Codex hook coverage still requires
  `/hooks` trust and an on-chain `TraceSession` emitted from a real Codex
  session.

## Unknowns And Questions

- Whether the public branch containing these marketplace manifests is already
  pushed and merged at the moment a user runs the GitHub marketplace command.
- Whether the active npm org token exists outside this shell.
- Whether Codex public directory listing beyond GitHub marketplace add is
  available for third-party submission today.

## Not Included

- No npm upload was performed because npm auth is absent.
- No live trusted Codex `/hooks` session proof was performed in this slice.
