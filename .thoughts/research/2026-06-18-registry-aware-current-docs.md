# Reality Research: Registry-Aware Current Docs

## Scope

Audit current-facing package and public docs for install/API claims that are
ahead of the public npm/PyPI registry state.

## Sources Checked

- `mise exec -- pnpm registry:status`
- `packages/*/README.md`
- `packages/*/package.json`
- `packages/*/pyproject.toml`
- `apps/docs/quickstart.mdx`
- `apps/docs/reference/cli.mdx`
- `apps/docs/integrations/providers.mdx`
- `apps/docs/integrations/runtimes.mdx`
- `docs/05-our-architecture/03-runtimes/README.md`
- `docs/05-our-architecture/04-frameworks/README.md`

## Verified Facts

- `pnpm registry:status` reports these npm packages as current:
  `@onemem/mcp@0.1.0`, `@onemem/oc-onemem@0.2.3`, and
  `@onemem/sdk-ts@0.6.0`.
- `pnpm registry:status` reports these npm packages as missing:
  `@onemem/brand@0.1.0`, `@onemem/cli@0.1.0`,
  `@onemem/dashboard@0.1.0`, `@onemem/claude-code-plugin@0.1.0`, and
  `@onemem/codex-plugin@0.1.0`.
- `pnpm registry:status` reports provider version drift:
  `@onemem/vercel-ai-provider` local `0.1.2` vs npm `0.1.1`, and
  `@onemem/openai-agents` local `0.1.3` vs npm `0.1.2`.
- `pnpm registry:status` reports these PyPI packages as missing:
  `onemem-cli@0.1.0` and `onemem-sdk-python@0.2.0`.
- `pnpm registry:status` reports Python provider/Hermes drift:
  `hermes-onemem` local `0.2.0` vs PyPI `0.1.0`, and
  `onemem-crewai`, `onemem-livekit`, `onemem-elevenlabs` local `0.1.1`
  vs PyPI `0.1.0`.
- Current source READMEs for the provider packages document explicit memory
  helper APIs that exist in local source but are not present in the stale
  public provider artifacts.
- `@onemem/mcp@0.1.0` is current on npm, so its README should make
  `npx -y @onemem/mcp@latest` the public path and keep local `dist/index.js`
  wiring as a development fallback.
- `packages/plugin-claude-code/tests/plugin.integration.test.ts` is a gated
  script-level live testnet proof, skipped unless `ONEMEM_INTEGRATION=1`.

## Inferences

- Public docs can keep target install commands only if they also state the
  current publication boundary.
- Package-local README examples should stay source-truth, but missing/drifted
  package READMEs need registry notes so agents do not mistake local source for
  already-published artifacts.

## Unknowns And Questions

- Which npm/PyPI account or trusted-publisher configuration will perform the
  first missing publishes.
- Whether a real trusted Claude Code client hook session has been run after the
  current package/marketplace changes.

## Not Included

- No npm/PyPI publish command was run.
- No package version bump was performed.
- No product code changed.
