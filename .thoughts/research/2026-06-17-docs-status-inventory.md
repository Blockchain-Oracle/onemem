# Reality Research: Docs Status Inventory

## Scope

Audit current-facing docs/status surfaces for claims that contradict the
implemented repo state or route agents to files missing from this checkout. This
pass focuses on root/package/docs entry points, not every historical design file.

## Sources Checked

- `README.md`
- `docs/README.md`
- `docs/INDEX.md`
- `docs/03-target-runtimes/README.md`
- `docs/04-framework-providers/README.md`
- `docs/05-our-architecture/README.md`
- `docs/05-our-architecture/00-overview/MONOREPO_LAYOUT.md`
- `docs/06-references/CANONICAL_URLS.md`
- `packages/*/README.md`
- `packages/cli-python/onemem_cli/main.py`
- `packages/cli-ts/src/index.ts`
- `packages/mcp-server/src/index.ts`
- `tests/structure.test.ts`
- Commands:
  - `find packages -mindepth 1 -maxdepth 1 -type d`
  - `rg` over docs and package READMEs for missing parent research references,
    package counts, Playwright MCP wording, and current/deferred claims.

## Verified Facts

- The repo currently has 16 package directories under `packages/`, while the
  root `README.md` still said `15 libraries`.
- The docs archive entry points referenced parent-folder files that are not
  present in this checkout: `WEDGE_V2.md`, `WEDGE_REFINEMENT.md`,
  `DEEP_DIVE.md`, `MEM0_DEEP_DIVE.md`, `TRACE_AND_PROVIDERS.md`,
  `FINAL_WEDGE.md`, `BRAND_AND_SURFACES_LEGACY.md`, `scores.json`, and
  `idea.md`.
- `docs/04-framework-providers/README.md` claimed Mem0-style memory provider
  surfaces for CrewAI/OpenAI Agents and marked ElevenLabs as v0.2, while current
  package READMEs show Vercel AI, OpenAI Agents, CrewAI, LiveKit, and ElevenLabs
  are implemented as trace-only wrappers/providers, with memory recall/capture
  deferred.
- `packages/cli-python/onemem_cli/main.py` and
  `packages/cli-python/README.md` agree that Python CLI is read-only:
  verify/trace/health only.
- `packages/cli-ts/src/index.ts` and `packages/cli-ts/README.md` agree that TS
  CLI includes `init`, `login`, `verify`, `trace`, `health`, `namespace
  share/revoke/capabilities`, `add`, and `search`.
- `packages/mcp-server/src/index.ts` registers six tools:
  `onemem_add_memory`, `onemem_search_memory`, `onemem_verify_trace`,
  `onemem_trace_session`, `onemem_replay_session`, and
  `onemem_share_namespace`.
- Current root `AGENTS.md` already routes local UI/browser verification to the
  Codex Chrome plugin first, with repo-owned browser harnesses limited to
  committed regression coverage/fallback.

## Inferences

- The most harmful docs drift is in entry-point files because they influence
  where future agents start and what they believe is implemented.
- Deeper historical docs can keep obsolete design details if they are clearly
  framed as archive material and no current entry point depends on them as API
  truth.

## Unknowns And Questions

- The missing parent research files may exist in Abu's external research
  workspace, but they are not available to agents from this repo checkout.
- A full line-by-line rewrite of every historical architecture document remains
  larger than this inventory pass.

## Not Included

- Product behavior changes.
- Library or SDK research requiring Context7.
- Runtime/provider live smoke tests.
- Rewriting every deep historical architecture document.
