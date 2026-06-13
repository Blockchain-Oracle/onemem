# OneMem — Coding Agent Context

Verifiable cross-runtime AI agent memory + trace layer (Sui + Walrus + Seal + MemWal). Architecture lives at `docs/05-our-architecture/`. Tooling stack + sub-agent fleet + skill inventory: `docs/05-our-architecture/00-overview/{TOOLING_DECISIONS,CODING_AGENT_SETUP}.md`. License: Apache-2.0.

## What OneMem actually is — READ THIS BEFORE BUILDING ANY PACKAGE

OneMem is a **Mem0-ergonomic, claude-mem-inspired** memory layer that adds verifiability + cross-runtime trace on top of existing infra. It is TWO layers — do not conflate them:

1. **Memory layer (the product, Mem0-mirror):** `add / search / get / update / delete / getAll / history / feedback / export`. **WRAPS `@mysten-incubation/memwal`** — memory writes call MemWal's `remember`/`analyze`, reads call `recall` (vector search), via the MemWal relayer + delegate key. We do NOT hand-roll memory storage. Every write also emits a trace `ActionCall` + returns an `attestation {suiTx, walrusBlobId, sealEnvelopeHash}`.
2. **Trace layer (OneMem's net-new headline):** `TraceSession` + `ActionCall`, Merkle-chained, signed directly to Sui against `onemem::trace`. This is the part nobody else ships. Trace content blobs are OneMem's own Walrus+Seal.

**Canonical contracts (the source of truth — read before writing code for a pillar, the task list is NOT the spec):**
- `docs/00-goal/GOAL.md` — what we're building + what we're NOT (e.g. "not Mem0 but decentralized"; complement, never compete).
- `docs/05-our-architecture/02-sdks/shared-api-surface.md` — the EXACT SDK method surface both TS + Python must expose.
- `docs/02-inspirations/{mem0,claude-mem,memwal-incubation}/` + `docs/01-sui-ecosystem/memwal-deep-dive.md` — wrap/mirror these, don't reinvent.

If what you're about to build isn't in those docs, you're building the wrong thing. Re-read them, don't invent from the task title.

## 10 non-negotiables

1. **TDD.** Failing test first; no test = no merge. (`superpowers:test-driven-development`)
2. **Verify before claiming done.** `pnpm test && pnpm lint` AND `pnpm turbo run typecheck build` (or package-local) clean. `tsx`/smoke scripts transpile-only — they hide typecheck + `tsup` build errors; CI runs the real build, so run it locally too. (`superpowers:verification-before-completion`)
3. **Manual testing on real systems.** Beyond unit tests, exercise every new feature by hand on the real runtime / real Walrus / real testnet as it's built — continuously, never batched to the end. The manual real-system run is the bar; env-gated integration tests (`ONEMEM_INTEGRATION=1`) just make it repeatable. Detail → `docs/05-our-architecture/00-overview/TESTING_STRATEGY.md`.
4. **Git worktrees for multi-commit work.** (`superpowers:using-git-worktrees`)
5. **Playwright MCP for UI research,** not WebFetch.
6. **Never hardcode dep versions from memory.** Use `pnpm add` / `uv add`. If hand-writing a manifest, look up actual latest via `pnpm view <pkg> version` (or `uv pip index versions <pkg>`) first; use the `^` prefix.
7. **Research before every story; specs are hypotheses.** Expect the spec/architecture to be subtly wrong (~99% of the time) — validate by building and correct as you discover. Before each story: `context7` for live SDK docs, exa/Brave for ecosystem state, this repo's `docs/` for captured decisions, 3–5 inspirations under `docs/02-inspirations/` for patterns. Tire-kick unfamiliar libs in a `/tmp` scratch before architecting around them. Confused mid-build → look it up, don't guess.
8. **Autonomous through the tracker.** Loop: research → TDD → verify → commit → flip `BUILD_SEQUENCE.md` checkbox → start next story. Pause ONLY at MAJOR phase boundaries (pillar→pillar, code→mainnet, pre-submission). Never pause mid-pillar for "ready?" — just start.
9. **Review each feature, not just at PR time.** Run `pr-review-toolkit` (review-pr + its agents: code-reviewer, silent-failure-hunter, type-design-analyzer, comment-analyzer, pr-test-analyzer) on each new feature's diff *as you build it* — don't wait for PR creation. Branch `pillar-N-<name>`; one PR per pillar; CI green to merge.
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
