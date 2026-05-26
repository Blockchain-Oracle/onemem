# OneMem — Coding Agent Context

Verifiable cross-runtime AI agent memory + trace layer (Sui + Walrus + Seal + MemWal). Architecture lives at `docs/05-our-architecture/`. Tooling stack + sub-agent fleet + skill inventory: `docs/05-our-architecture/00-overview/{TOOLING_DECISIONS,CODING_AGENT_SETUP}.md`. License: Apache-2.0.

## 6 non-negotiables

1. **TDD.** Failing test first; no test = no merge. (`superpowers:test-driven-development`)
2. **Verify before claiming done.** `pnpm test && pnpm lint` (or package-local) clean. (`superpowers:verification-before-completion`)
3. **Git worktrees for multi-commit work.** (`superpowers:using-git-worktrees`)
4. **Playwright MCP for UI research,** not WebFetch.
5. **Never hardcode dep versions from memory.** Use `pnpm add` / `uv add`. If hand-writing a manifest, look up actual latest via `pnpm view <pkg> version` (or `uv pip index versions <pkg>`) first; use the `^` prefix.
6. **Research before non-trivial decisions.** `context7` MCP for live framework/SDK docs; exa/Brave for ecosystem state; this repo's `docs/` for captured decisions; 3–5 inspirations under `docs/02-inspirations/` for patterns — best-of-best, not first-match.

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
