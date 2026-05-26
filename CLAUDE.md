# OneMem — Coding Agent Context

Verifiable cross-runtime AI agent memory + action trace layer for Sui + Walrus + Seal + MemWal. The full architecture is at `docs/05-our-architecture/` (65 design docs). Read the overview README there before touching any package.

## The 6 non-negotiables

1. **TDD.** Write the failing test first, then the code, then refactor. No test = no merge. Use `superpowers:test-driven-development`.
2. **Verify before claiming done.** Run `pnpm test && pnpm lint` (or the package-local equivalent) and confirm clean output before reporting a task complete. Use `superpowers:verification-before-completion`.
3. **Git worktrees for multi-commit work.** Use `superpowers:using-git-worktrees` so concurrent pillar work doesn't collide on `main`.
4. **Playwright MCP for any UI research.** Default to Playwright MCP over WebFetch — screenshots are the source of truth for visual decisions.
5. **Never hardcode dependency versions from memory.** Use `pnpm add <pkg>` / `uv add <pkg>` so the tool resolves to current latest-stable. If a manifest MUST be hand-written (bootstrap stubs, frozen configs), look up actual latest first via `pnpm view <pkg> version` or `uv pip index versions <pkg>` and use the `^` prefix. Training-data versions go stale — always verify against the registry.
6. **Research before deciding non-trivial things.** Don't blindly mirror one inspiration. For any non-trivial decision use:
   - `context7` MCP (`mcp__plugin_context7_context7__resolve-library-id` then `query-docs`) for official live framework/SDK docs
   - Web search (exa MCP / Brave) for current ecosystem state + GitHub trends
   - This repo's `docs/` folder (mirrors of `research/.../context/`) for already-captured decisions
   - 3-5 reference repos under `docs/02-inspirations/` when picking patterns — best-of-best, not first-match

## Where to read before editing

| Editing... | Read first |
|---|---|
| `contracts/onemem/` | `docs/05-our-architecture/01-protocol/` + this folder's `CLAUDE.md` |
| `packages/sdk-ts/` or `packages/sdk-python/` | `docs/05-our-architecture/02-sdks/` |
| `packages/plugin-*/` | `docs/05-our-architecture/03-runtimes/` + matching `02-inspirations/<runtime>/` |
| `packages/provider-*/` | `docs/05-our-architecture/04-frameworks/` |
| `packages/cli-*/` | `docs/05-our-architecture/05-cli/` |
| `packages/dashboard/` | `docs/05-our-architecture/06-dashboard/README.md` → then `purpose-local-vs-hosted.md` |
| `apps/hosted-dashboard/` | Same as above, plus `06-dashboard/hosted-deploy.md` |
| `apps/landing/` or `apps/docs/` | `docs/05-our-architecture/07-marketing-and-docs/` |
| `demos/` | `docs/05-our-architecture/08-demos-and-tests/` |

## Anti-patterns (carry-through feedback)

- **Don't fear competitor ship cycles.** Build our thing. Competitor activity is signal that the lane is real, not a threat.
- **Complement, never compete** with incumbents. claude-mem, Mem0, MemWal, MCP servers — all are layers we build on top of, never replace.
- **Don't bounce decisions back within a phase.** When direction is set, execute. Save the conversation for major phase transitions.
- **Don't blindly mirror one inspiration.** For non-trivial decisions, research across 3-5 references (MemWal, claude-mem, Mem0, Letta, Zep, langfuse, phoenix, etc.). Best-of-best.
- **Problem statements are snapshots.** Satisfy the track's must-haves AND build the thing the sponsor would write into the brief if they were rewriting it after seeing our submission.
- **Install missing tools in the background.** When pre-flight finds a missing tool, install it via Bash run_in_background. Don't pause to ask.

## Workspace + tooling at a glance

- **TS workspace:** pnpm 10 + Turborepo 2.0
- **Python workspace:** uv
- **Toolchain version mgr:** Mise (`.mise.toml`)
- **TS lib build:** tsup (ESM+CJS dual)
- **TS app build:** Next.js 15 (App Router, standalone)
- **Move build:** `sui move build` / `sui move test`
- **TS lint+format:** Biome 2.x
- **Python lint+format:** ruff
- **Python type check:** pyright
- **Test runners:** Vitest (TS), pytest+pytest-asyncio (Python), `sui move test` (Move)
- **Git hooks:** Lefthook
- **Releases:** Changesets
- **Docs site:** Mintlify

Full rationale in `docs/05-our-architecture/00-overview/TOOLING_DECISIONS.md`.

## Skills to invoke during build

- `sahil-coding-protocol` — master protocol
- `sahil-spec-writer` — produce BMad spec per pillar (PRD + architecture + epics + stories)
- `sahil-visual-loop` — day-0 setup for `apps/landing` + `packages/dashboard`
- `sahil-anti-slop-audit` — every UI merge
- `sahil-pr-audit` — fresh-context audit before merge
- `superpowers:test-driven-development` — every code task
- `superpowers:writing-plans` then `superpowers:executing-plans` — every non-trivial multi-step
- `superpowers:verification-before-completion` — before claiming any task done
- `superpowers:using-git-worktrees` — per-pillar isolation
- `superpowers:requesting-code-review` — before merging substantial work
- `codex:rescue` — second opinion when stuck

## Sub-agents (use when scope warrants)

- `general-purpose`, `code-reviewer`, `security-reviewer` (every Move + encryption diff), `linter`, `test-runner`, `Explore`, `Plan`

## License

Apache-2.0. See `LICENSE`.
