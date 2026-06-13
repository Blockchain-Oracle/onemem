# OneMem — Coding Agent Context

Verifiable cross-runtime AI agent memory + trace layer (Sui + Walrus + Seal + MemWal). Architecture lives at `docs/05-our-architecture/`. Tooling stack + sub-agent fleet + skill inventory: `docs/05-our-architecture/00-overview/{TOOLING_DECISIONS,CODING_AGENT_SETUP}.md`. License: Apache-2.0.

## 10 non-negotiables

1. **TDD.** Failing test first; no test = no merge. (`superpowers:test-driven-development`)
2. **Verify before claiming done.** `pnpm test && pnpm lint` AND `pnpm turbo run typecheck build` (or package-local) clean. `tsx`/smoke scripts transpile-only — they hide typecheck + `tsup` build errors; CI runs the real build, so run it locally too. (`superpowers:verification-before-completion`)
3. **Manual testing on real systems.** Beyond unit tests, exercise every new feature by hand on the real runtime / real Walrus / real testnet as it's built — continuously, never batched to the end. The manual real-system run is the bar; env-gated integration tests (`ONEMEM_INTEGRATION=1`) just make it repeatable. Detail → `docs/05-our-architecture/00-overview/TESTING_STRATEGY.md`.
4. **Git worktrees for multi-commit work.** (`superpowers:using-git-worktrees`)
5. **Playwright MCP for UI research,** not WebFetch.
6. **Never hardcode dep versions from memory.** Use `pnpm add` / `uv add`. If hand-writing a manifest, look up actual latest via `pnpm view <pkg> version` (or `uv pip index versions <pkg>`) first; use the `^` prefix.
7. **Research before every story; specs are hypotheses.** Expect the spec/architecture to be subtly wrong (~99% of the time) — validate by building and correct as you discover. Before each story: `context7` for live SDK docs, exa/Brave for ecosystem state, this repo's `docs/` for captured decisions, 3–5 inspirations under `docs/02-inspirations/` for patterns. Tire-kick unfamiliar libs in a `/tmp` scratch before architecting around them. Confused mid-build → look it up, don't guess.
8. **Autonomous through the tracker.** Loop: research → TDD → verify → commit → flip `BUILD_SEQUENCE.md` checkbox → start next story. Pause ONLY at MAJOR phase boundaries (pillar→pillar, code→mainnet, pre-submission). Never pause mid-pillar for "ready?" — just start.
9. **PR per pillar + review.** Branch `pillar-N-<name>`; after opening the PR run `pr-review-toolkit:review-pr` + the review skills (`superpowers:requesting-code-review`, `code-reviewer`/`security-reviewer`); CI must be green to merge.
10. **Coding guardrails.** Full doc: `docs/05-our-architecture/00-overview/CODING_GUARDRAILS.md` (TS + Python + Move + cross-cutting). Headline rules: source files ≤ 400 lines (structure test enforces); named `const` over magic literals; named types over primitive bags; structured loggers (Pino / structlog) over `console.log` / `print()` — now CI-enforced via biome `noConsole` + ruff `T20`; typed error classes with `cause` chains; each new TS lib package needs its own `tsup.config.ts` or it builds nothing; per-language section headers + naming per the doc; pre-commit self-review checklist at the bottom of that doc.

## Where to read before editing

| Editing... | First read |
|---|---|
| `contracts/onemem/` | `contracts/onemem/CLAUDE.md` |
| `packages/sdk-ts/` | `packages/sdk-ts/CLAUDE.md` |
| `packages/dashboard/` | `packages/dashboard/CLAUDE.md` |
| `packages/plugin-claude-code/` | `packages/plugin-claude-code/CLAUDE.md` |
| `apps/hosted-dashboard/` | `docs/05-our-architecture/06-dashboard/purpose-local-vs-hosted.md` → then `hosted-deploy.md` |
| Any other package / app / demo | matching `docs/05-our-architecture/<sub-group>/` + the dir's `README.md` |

## Where we are + what's next

`docs/05-our-architecture/00-overview/BUILD_SEQUENCE.md` is the always-current phase tracker (checkbox list at the top). Re-read it at the start of every session to load position into context. After every completed chunk, flip the checkbox + move the `← CURRENT` arrow + link the commit SHA in the same commit. Never ask "what's next" — read the tracker.

## Structural integrity

Run `pnpm test:structure` before declaring any monorepo change done. It asserts the canonical layout (workspace globs, manifests, `CLAUDE.md` inventory, `workspace:*` cross-refs, Move modules, hosted-dashboard routes, brand tokens). When you intentionally add or rename a package, update `tests/structure.test.ts` in the same commit — drift must be loud, not silent.
