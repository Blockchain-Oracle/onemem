# Reality Research: Framework Provider Status Refresh

## Scope

Audit current framework-provider documentation against package manifests,
package READMEs, tests, and public registry state. This research is limited to
framework providers; runtime plugins and CLI publication are only noted where
they affect install-status wording.

## Sources Checked

- `docs/05-our-architecture/04-frameworks/README.md`
- `docs/04-framework-providers/README.md`
- `packages/provider-vercel-ai/package.json`
- `packages/provider-openai-agents/package.json`
- `packages/provider-crewai/pyproject.toml`
- `packages/provider-livekit/pyproject.toml`
- `packages/provider-elevenlabs/pyproject.toml`
- Provider package READMEs under `packages/provider-*`
- `tests/structure.test.ts`
- Registry checks:
  - `npm view @onemem/vercel-ai-provider version --json`
  - `npm view @onemem/openai-agents version --json`
  - `npm view @onemem/cli version --json`
  - `npm view @onemem/sdk-ts version --json`
  - `npm view @onemem/codex-plugin version --json`
  - `npm view @onemem/claude-code-plugin version --json`
  - `npm view @onemem/oc-onemem version --json`
  - `uvx --from pip --with pip pip index versions onemem-crewai`
  - `uvx --from pip --with pip pip index versions onemem-livekit`
  - `uvx --from pip --with pip pip index versions onemem-elevenlabs`
  - `uvx --from pip --with pip pip index versions hermes-onemem`

## Verified Facts

- `docs/04-framework-providers/README.md` is already the current provider
  surface and lists five implemented framework providers with scoped behavior.
- `docs/05-our-architecture/04-frameworks/README.md` has a historical-design
  warning but its implementation-status table still marks all five v0.1 provider
  packages as `⏳ pending`.
- `@onemem/vercel-ai-provider` exists in the workspace at version `0.1.1`; its
  README documents `withOneMem(...)` trace capture and explicit
  `createOneMemMemory(...)` memory helpers.
- `@onemem/openai-agents` exists in the workspace at version `0.1.2`; its
  README documents `createTracedRunner(...)` / `attachOneMem(...)` trace capture
  and explicit `createOneMemMemory(...)` memory helpers.
- `onemem-crewai`, `onemem-livekit`, and `onemem-elevenlabs` exist in the
  workspace at version `0.1.0`; their READMEs document trace-only Python
  providers that shell through `onemem-trace`.
- The three Python framework provider READMEs explicitly keep memory helpers or
  Mem0-style provider integration as follow-up work.
- Public registry checks returned:
  - npm `@onemem/vercel-ai-provider`: `0.1.1`
  - npm `@onemem/openai-agents`: `0.1.2`
  - npm `@onemem/sdk-ts`: `0.6.0`
  - npm `@onemem/oc-onemem`: `0.2.3`
  - npm `@onemem/cli`, `@onemem/codex-plugin`, and
    `@onemem/claude-code-plugin`: `E404`
  - PyPI `onemem-crewai`: `0.1.0`
  - PyPI `onemem-livekit`: `0.1.0`
  - PyPI `onemem-elevenlabs`: `0.1.0`
  - PyPI `hermes-onemem`: `0.1.0`, while the local package is `0.2.0`

## Inferences

- The stale implementation-status table can cause an agent or reviewer to plan
  already-built framework-provider work again.
- The architecture README should distinguish current built provider scope from
  original Mem0-style design goals because some Python memory-provider behavior
  remains intentionally deferred.
- Registry availability for the five framework providers can be stated for the
  checked date, but it should not be generalized to runtime plugin or CLI
  package publication.

## Unknowns And Questions

- Whether to prioritize publishing `@onemem/cli`, Codex/Claude plugins, and the
  local `hermes-onemem@0.2.0` next.
- Whether old per-framework design pages should receive historical banners too,
  or whether the README-level warning is enough for now.

## Not Included

- No implementation changes to provider code.
- No npm or PyPI publication.
- No live framework execution against external Vercel AI, OpenAI Agents, CrewAI,
  LiveKit, or ElevenLabs runtimes.
