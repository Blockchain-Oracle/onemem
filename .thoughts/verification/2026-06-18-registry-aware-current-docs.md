# Verification Audit: Registry-Aware Current Docs

## Verdict

Pass.

The docs changes are scoped to publication/proof wording. They do not publish
packages, change runtime behavior, or claim registry availability beyond
`pnpm registry:status` evidence.

## Artifacts Checked

- Research:
  `.thoughts/research/2026-06-18-registry-aware-current-docs.md`
- Spec:
  `.thoughts/specs/2026-06-18-registry-aware-current-docs.md`
- Stories:
  `.thoughts/stories/2026-06-18-registry-aware-current-docs.md`
- Plan:
  `.thoughts/plans/2026-06-18-registry-aware-current-docs.md`
- Package READMEs for CLI, dashboard, MCP, Claude plugin, Hermes, providers,
  Python CLI, and Python SDK.
- Public docs under `apps/docs`.
- Runtime/framework architecture status pages.
- Structure guard:
  `tests/structure/registry-docs.test.ts`

## Requirement Traceability

| Requirement | Evidence |
|---|---|
| CLI/dashboard/Python CLI docs must not imply current registry availability | `README.md`, `packages/cli-ts/README.md`, `packages/dashboard/README.md`, `packages/cli-python/README.md`, `apps/docs/quickstart.mdx`, and `apps/docs/reference/cli.mdx` now direct readers to `pnpm registry:status` and state the missing package boundary. |
| Provider helper docs must distinguish source from stale public artifacts | Provider READMEs now say helper APIs are in repo-local source while public artifacts are one patch behind; `apps/docs/integrations/providers.mdx` and `docs/05-our-architecture/04-frameworks/README.md` carry the same boundary. |
| Runtime plugin docs must separate marketplace install, npm publication, and hook proof | `packages/plugin-claude-code/README.md`, `apps/docs/integrations/runtimes.mdx`, and `docs/05-our-architecture/03-runtimes/README.md` now separate GitHub marketplace install, missing npm package state, and trusted hook-session proof. |
| Published MCP package should be the primary public path | `packages/mcp-server/README.md` now uses `claude mcp add onemem -- npx -y @onemem/mcp@latest` as the public path and keeps local `dist/index.js` wiring as development-only. |
| Regression guard exists | `tests/structure/registry-docs.test.ts` checks registry-status language, package publication notes, provider drift notes, MCP public path, and runtime proof separation. |

## Acceptance Criteria Coverage

- Public quickstart and CLI reference include registry-status language.
- Provider public docs include registry-drift language.
- Package READMEs for missing/drifted packages include publication notes.
- MCP README no longer says `@onemem/mcp` is only available "once published".
- No package publish command was run.

## Quality Gates

Executed:

```bash
mise exec -- pnpm registry:status
wc -l tests/structure/registry-docs.test.ts tests/structure/context-artifacts.test.ts tests/structure/docs-frameworks.test.ts
mise exec -- pnpm exec biome check <touched docs/tests/context files>
mise exec -- pnpm test:structure
git diff --check
```

Results:

- `registry:status`: passed and reported the expected missing/drifted package
  state.
- Line caps: `registry-docs.test.ts` 87 lines,
  `context-artifacts.test.ts` 259 lines, `docs-frameworks.test.ts` 272 lines.
- Biome check on touched docs/tests/context files: passed.
- `pnpm test:structure`: passed, 400 tests.
- `git diff --check`: clean.

## Deviations From Plan

- Added the MCP README correction after the package README audit noted that
  `@onemem/mcp@0.1.0` is already current on npm.

## Gaps And Risks

- Registry state remains time-sensitive. Rerun `pnpm registry:status` before a
  release/publication claim.
- This does not configure npm/PyPI credentials or publish missing packages.

## Follow-ups

- Configure npm/PyPI auth or trusted publishers and publish missing/drifted
  packages.
- Continue deeper historical architecture-doc cleanup where stale design-phase
  claims are not current entry points.

## Evidence Log

- Package README audit matched the local registry preflight: CLI/dashboard,
  Codex/Claude plugin npm packages and Python CLI/SDK are missing; framework
  provider/Hermes public artifacts are behind repo-local source.
- Initial Biome check only requested formatting changes in the new structure
  test shard; those were applied before final gate rerun.
