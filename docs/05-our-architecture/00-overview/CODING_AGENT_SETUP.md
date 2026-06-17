# Coding Agent Setup — OneMem

> Current note, 2026-06-17: this is a historical setup record from the
> pre-Context-Engineering phase. Active Codex routing now lives in `AGENTS.md`
> and `.thoughts/`. Keep this file for provenance, but do
> not treat Sahil-era skill names or old app stack notes as current instructions.

**Status:** Locked 2026-05-26 per approved build-prep plan.

**Posture:** lean per Abu's explicit preference ("don't make it too strict"). Built on top of Abu's existing `sahil-*` skill collection (which is itself 2026-best-practice for hackathon-scope) + 4 non-negotiables + minimal CLAUDE.md files + Lefthook for the few automated checks that genuinely pay off.

---

## The 4 non-negotiables

These rules live in root `CLAUDE.md` + are referenced by every coding session. Everything else is convention; these are rules.

1. **TDD** — write failing test FIRST, then code to green, then refactor. Per `superpowers:test-driven-development`. Abu's mandate; not optional.
2. **Verify before claiming done** — run `pnpm test && pnpm lint` (or language equivalent) and confirm clean output before reporting any task complete. Per `superpowers:verification-before-completion`.
3. **Git worktrees for any multi-commit work** — per `superpowers:using-git-worktrees`. Keeps main branch clean during multi-step work.
4. **Codex Chrome plugin for local UI research** — per current Abu feedback. Screenshots and browser interaction are the source of truth for visual decisions.

---

## Root `CLAUDE.md` (~80 lines)

Lives at the repo root. Every coding agent reads this first. Lean by design.

Structure (the actual file we'll create at bootstrap):

```markdown
# OneMem — Coding Agent Context

OneMem is a verifiable cross-runtime memory + action-trace layer for AI agents, built on Sui + Walrus + Seal + MemWal. Submitted to Sui Overflow 2026 Walrus track.

## Where to find things

- Architecture: `docs/05-our-architecture/` — start at `README.md` for navigation
- Inspiration references: `docs/02-inspirations/` — competitive landscape + design patterns we draw from
- Folder structure spec: `docs/05-our-architecture/00-overview/MONOREPO_LAYOUT.md`
- Tooling decisions: `docs/05-our-architecture/00-overview/TOOLING_DECISIONS.md`
- Per-pillar specs: `docs/06-specs/` (BMad-style; sahil-spec-writer output)

If you're editing `packages/<name>/` — check `packages/<name>/CLAUDE.md` for package-specific context.

## The 4 non-negotiables

1. **TDD always.** Write failing test → make it pass → refactor. No exceptions. Use `superpowers:test-driven-development` skill.
2. **Verify before claiming done.** Run `pnpm test && pnpm lint && pnpm typecheck` (or `pytest && ruff check && pyright` for Python). Confirm clean output. Then report.
3. **Git worktrees for multi-commit work.** Use `superpowers:using-git-worktrees`. Don't pollute main during a multi-step build.
4. **Codex Chrome plugin for any local UI research.** Never WebFetch a page expecting visual fidelity — it strips colors, layout, fonts.

## Stack at a glance

- Monorepo: pnpm + uv workspaces + Turborepo
- TS: tsup builds, Vitest tests, Biome lint+format
- Python: pytest tests, ruff lint+format, pyright type check
- Move: `sui move test` + `sui move build`; package at `contracts/onemem/`
- Apps: Vite (dashboard), Next.js 15 (landing), Mintlify (docs)
- Hooks: Lefthook (pre-commit lint, pre-push test)
- Release: Changesets

## Anti-patterns (saved feedback; don't drift)

- Don't fear competitor ship cycles — just build our thing. Mem0/claude-mem/MemWal shipping new features isn't a threat; it's signal the lane is real.
- Complement, never compete. Every incumbent is a layer we build on top of. OpenClaw plugin uses `oc-memwal` underneath. Claude Code plugin coexists with claude-mem.
- Don't bounce decisions back to Abu within a phase. Phase = research, architecture, build, polish. Within a phase: execute. At phase boundaries: pause + converse.
- Don't default to one inspiration. Cross-cutting research across 3-5 references minimum for non-trivial decisions.
- Don't write speculative comments / docs. Don't add backwards-compat shims unless asked.
- Problem statements are snapshots — every commit serves either "satisfy a must-have" OR "deliver a surprise."

## Skills to invoke explicitly

- `sahil-coding-protocol` — master coding protocol; invoke at start of any non-trivial coding session
- `sahil-spec-writer` — produce BMad specs per pillar
- `sahil-visual-loop` — day-0 setup for `packages/dashboard` + `apps/landing`
- `sahil-anti-slop-audit` — every UI merge
- `sahil-pr-audit` — fresh-context audit before merge
- `superpowers:writing-plans` then `superpowers:executing-plans` for non-trivial multi-step
- `codex:rescue` — if stuck (second-opinion from Codex)

## Sub-agents available

- `general-purpose` — research + analysis
- `code-reviewer` — code review per merge (NOT per commit)
- `security-reviewer` — every Move contract diff + every encryption-touching diff
- `linter` — lint diagnostics
- `test-runner` — execute tests + report
- `Explore` — codebase search
- `Plan` — planning for non-trivial multi-step

## Coding loop (sahil-coding-protocol)

For any non-trivial code task:
1. Read relevant `docs/05-our-architecture/<sub-group>/<doc>.md`
2. If UI work: anchor screenshot via `sahil-visual-loop`
3. `superpowers:writing-plans` to break into commits
4. Create git worktree (`superpowers:using-git-worktrees`)
5. TDD per commit (`superpowers:test-driven-development`)
6. `superpowers:verification-before-completion` before claiming done
7. `sahil-pr-audit` + (for UI) `sahil-anti-slop-audit` before merge
8. Merge to main; close worktree

License: Apache-2.0 across all packages.
```

That's it. ~80 lines. No bloat.

---

## Per-package `CLAUDE.md` (only where needed)

Created at bootstrap for packages with non-obvious patterns. Others can be added during build as the coding agent discovers gaps.

### `contracts/onemem/CLAUDE.md`

```markdown
# OneMem Move Package

Sui Move package at `contracts/onemem/`. Implements `MemoryNamespace`, `TraceSession`, `ActionCall`, `NamespaceCapability` + the Merkle chain mechanic.

## Read first

- `docs/05-our-architecture/01-protocol/data-model.md` — canonical schemas
- `docs/05-our-architecture/01-protocol/move-contract.md` — package layout + entry functions
- `docs/05-our-architecture/01-protocol/events-and-attestation.md` — `event::emit_authenticated` mechanics
- `docs/05-our-architecture/01-protocol/access-control-and-sharing.md` — Seal + capability transfer
- `docs/05-our-architecture/01-protocol/upgrade-strategy.md` — version-as-dynamic-field pattern

## Move conventions (non-obvious)

- Capability types use phantom params: `NamespaceCapability<KIND>` where `KIND` ∈ `{ReadOnly, ReadWrite, Admin}`
- Version stored as dynamic field on UID (NOT struct field) per `upgrade-strategy.md`. Lifted from MemWal `account.move`.
- `event::emit_authenticated` is the keystone — emits per `ActionCall` for light-client verifiable Merkle chain
- `seal_approve` policy gates Seal decryption — capability presented at call time, not stored in ACL
- Dynamic-field children for `ActionCall`s under `TraceSession` (Walrus Sites pattern)

## Anti-patterns

- DON'T add fields to structs after first publish — Move forbids it. Use version dynamic field for additions.
- DON'T use shared objects when owned + capability works — parallelization matters on Sui.
- DON'T re-implement what MemWal `account.move` already does. We extend, not replace.

## Test conventions

- `sui move test --coverage` target: 100% line coverage on entry functions
- Tests live in `tests/` per Move convention
- Use `tests/test_scenario` builder for multi-party tests

## Deploy

- `sui move build` locally before push
- Mainnet deploy via `scripts/deploy-contract.sh` — requires Sui CLI + funded account
- Package upgrades use `sui client upgrade` per `upgrade-strategy.md`
```

### `packages/dashboard/CLAUDE.md`

```markdown
# OneMem Dashboard — Coding Context

Vite + React 19 + Tailwind + shadcn + Radix Themes + `@mysten/dapp-kit-react`. Serves on `localhost:4040` (local) + deploys via `apps/hosted-dashboard/` (production).

## Read first

- `docs/05-our-architecture/06-dashboard/ui-architecture.md` — routes, components, state mgmt
- `docs/05-our-architecture/06-dashboard/design-system.md` — brand tokens (lavender + chartreuse + cream + Sui blue)
- `docs/05-our-architecture/06-dashboard/data-flow.md` — Sui RPC + Walrus + Seal flows
- `docs/05-our-architecture/06-dashboard/route-*.md` — per-route specs (7 routes at v0.1)
- `docs/02-inspirations/BRAND_AND_SURFACES.md` — canonical brand

## Brand rules (non-obvious)

- `#D4FF5E` chartreuse — ONLY for Verify affordances. Never decoration.
- `#0090FF` Sui blue — ONLY for Suiscan links. Never primary buttons.
- `#B08FFF` lavender — primary accent everywhere else.
- Surface cream `#FAF8F5` — page background. Cards slightly lighter.

## UI loop

- Visual changes go through `sahil-visual-loop` (screenshot anchors + diff before merge)
- Every PR touching `src/components/` or `src/routes/` triggers `sahil-anti-slop-audit` before merge

## Test conventions

- Vitest for component logic
- Playwright for E2E + visual regression
- Coverage target: 50% (UI tests are expensive; focus on data flow + state)
```

### `packages/sdk-ts/CLAUDE.md`

```markdown
# OneMem TS SDK — Coding Context

`@onemem/sdk-ts`. Wraps `@mysten-incubation/memwal` + `@mysten/sui` + `@mysten/seal`. Mirrors Mem0's ergonomic.

## Read first

- `docs/05-our-architecture/02-sdks/shared-api-surface.md` — the canonical API contract (TS + Python share this)
- `docs/05-our-architecture/02-sdks/sdk-typescript.md` — TS-specific implementation
- `docs/05-our-architecture/02-sdks/relayer-integration.md` — how SDK talks to MemWal relayer
- `docs/05-our-architecture/02-sdks/compatibility-contract.md` — version negotiation

## Non-negotiables

- **Always use Seal `/manual` flow.** Never relayer-handled encryption. Trust model is non-negotiable.
- **Method names match Python SDK exactly** (camelCase here, snake_case there; same semantics). Symmetry across SDKs is contractual.
- **Match Mem0 ergonomic** for memory methods (`add`, `search`, `get`, `update`, `delete`, etc) — migration is the wedge.

## Build

- `tsup` for ESM+CJS dual; targets Node 18+ and browsers
- `vitest run` for tests
- Publish via Changesets
```

### `packages/plugin-claude-code/skills/onemem-claude-code/SKILL.md`

```markdown
# OneMem For Claude Code

Native Claude Code plugin + MCP. Coexists with claude-mem (Apache-2.0; verified) — different storage backend, same hook events.

## Read first

- `docs/05-our-architecture/03-runtimes/claude-code-plugin.md` — plugin spec
- `docs/02-inspirations/claude-mem/HOOKS_AND_VIEWER_REFERENCE.md` — claude-mem's hook contract (the pattern we mirror)
- `docs/05-our-architecture/03-runtimes/README.md` — runtime matrix

## Hook contract (mirrored from claude-mem)

- `Setup` — compat check
- `SessionStart` (matcher `startup|clear|compact`) — inject prior context
- `UserPromptSubmit` — gate context injection
- `PreToolUse` (matcher `Read`) — inject file-specific memory
- `PreToolUse` (matcher `*`) — open `ActionCall` PENDING
- `PostToolUse` (matcher `*`) — close `ActionCall` with output
- `Stop` — end session + optional summary

## Worker-down behavior

Per claude-mem pattern: if relayer/SDK unreachable, hook script exits 0 silently. Never block the user.

## Coexistence

User can have BOTH `@onemem/claude-code-plugin` AND `claude-mem` installed. No conflict — different storage paths, different hook scripts.

## Test conventions

- Hook scripts: integration tested via `sahil-coding-loop` test harness
- MCP tools: tested by hitting the local MCP server with `mcp-test`
```

---

## Lefthook config (`lefthook.yml`)

Lean. Pre-commit hooks run fast (<500ms target); pre-push runs the test suite for changed packages.

```yaml
pre-commit:
  parallel: true
  commands:
    biome:
      glob: "*.{ts,tsx,js,jsx,json}"
      run: pnpm exec biome check --apply {staged_files}
      stage_fixed: true
    
    ruff-check:
      glob: "*.py"
      run: pnpm exec ruff check --fix {staged_files}
      stage_fixed: true
    
    ruff-format:
      glob: "*.py"
      run: pnpm exec ruff format {staged_files}
      stage_fixed: true
    
    move-build:
      glob: "contracts/**/*.move"
      run: cd contracts/onemem && sui move build --silent
    
    # Conventional Commits enforcement
    commit-msg-check:
      run: |
        head -1 "$1" | grep -qE '^(feat|fix|chore|docs|test|refactor|perf|build|ci|revert)(\(.+\))?: .+'

pre-push:
  parallel: true
  commands:
    test-changed-ts:
      run: pnpm turbo run test --filter=...HEAD
    
    test-changed-py:
      glob: "packages/**/*.py"
      run: uv run pytest packages/ --testmon
```

`testmon` (a pytest plugin) caches test results per file, so only tests affected by the diff re-run. Same idea as Turborepo's caching, applied to Python tests.

---

## Sub-agent fleet (existing; don't define new)

| Agent | Purpose | When invoked |
|---|---|---|
| `general-purpose` | Research + multi-step | Open-ended tasks |
| `code-reviewer` | Code review per merge | Before merging substantial work (per PR, not per commit) |
| `security-reviewer` | Security review per encryption/contract diff | Every Move contract change + every Seal/auth change |
| `linter` | Lint diagnostics | On-demand if Lefthook surfaces something unclear |
| `test-runner` | Execute + report | On-demand for complex test runs |
| `Explore` | Codebase search | Open-ended search across the monorepo |
| `Plan` | Planning agent | Non-trivial multi-step tasks |
| (claude-mem-managed) | Cross-session memory | Automatic; no invocation needed |

NOT defining new project-specific sub-agents at v0.1. The existing fleet covers everything. Revisit at v0.2 if a recurring task pattern emerges.

---

## Skills to invoke during the build

| Skill | When | Purpose |
|---|---|---|
| `sahil-coding-protocol` | Start of any coding session | Master coding protocol; sets the loop |
| `sahil-spec-writer` | Start of each pillar | Produces BMad PRD + epics + stories |
| `sahil-visual-loop` | Day 0 of dashboard + landing | Sets up Playwright + screenshot anchors + diff workflow |
| `sahil-anti-slop-audit` | Every UI merge | Vision review pre-merge |
| `sahil-pr-audit` | Before any substantial merge | Fresh-context PR audit |
| `superpowers:test-driven-development` | Every code task | TDD enforcement (red → green → refactor) |
| `superpowers:writing-plans` | Non-trivial multi-step | Plan before code |
| `superpowers:executing-plans` | After plan approved | Execute the plan |
| `superpowers:verification-before-completion` | Before claiming task done | Run + verify; no shortcuts |
| `superpowers:using-git-worktrees` | Multi-commit work | Isolation; clean main branch |
| `superpowers:requesting-code-review` | Before merging substantial work | Get fresh-context review |
| `superpowers:subagent-driven-development` | When parallel sub-tasks fit | Use sparingly per Abu's step-by-step preference |
| `codex:rescue` | When stuck | Second-opinion from Codex |
| `claude-mem:do` | Multi-phase execution | Phased plan via sub-agents (use sparingly) |
| `episodic-memory:search-conversations` | Session start | Recall prior decisions |
| `pr-review-toolkit:silent-failure-hunter` | Every error-handling diff | Catch silent failures |
| `pr-review-toolkit:comment-analyzer` | After writing docs/comments | Comment quality check |
| `pr-review-toolkit:type-design-analyzer` | New types/structs | Encapsulation + invariants check |

---

## Memory + observation

- **`claude-mem`** is already auto-injecting cross-session observations (no setup needed; runs at session start)
- **`episodic-memory:search-conversations`** to recall specific prior decisions on a new session
- All saved feedback memories at `/Users/abu/.claude/projects/-Users-abu-dev-hackathon-sui-overflow/memory/feedback_*.md` are loaded into context via MEMORY.md
- New feedback during build saved as additional memory files per existing pattern

---

## Workflow position awareness

Per saved feedback (`feedback_step_by_step_phase_transitions`):

- **Within a phase** (e.g., "build the dashboard"): just continue, no asking
- **At phase transitions** (e.g., "architecture done → build start"): pause + converse
- Phases for the build: **bootstrap → spec per pillar → code per pillar → polish/demo → submission**
- Pause for conversation at each pillar boundary (not at every story within a pillar)

---

## Explicitly NOT set up at v0.1

| Thing | Why not |
|---|---|
| Custom MCP servers for the build process | Existing skills + sub-agents cover everything |
| PreToolUse hooks blocking edits without tests | Use the TDD SKILL instead; respect comes from culture not enforcement (per Abu's "not too strict") |
| Mandatory PR audit on every commit | Only on merge (Abu's "not too strict") |
| Complex Playwright config beyond `sahil-visual-loop` defaults | Defaults are good |
| `AGENTS.md` per package (in addition to `CLAUDE.md`) | CLAUDE.md is sufficient; AGENTS.md duplicates |
| Auto-formatter on save (editor-side) | Lefthook on commit covers; over-formatting causes diff churn |
| Remote Turborepo cache server | Premature; local cache sufficient at v0.1 |
| Per-package `CONTRIBUTING.md` | Repo-root CONTRIBUTING.md is enough |
| Per-package `CHANGELOG.md` (manual) | Changesets generates these |
| GitHub Issue templates | Premature; we're not soliciting contributions during the hackathon |
| CodeRabbit / Greptile / other auto-review bots | `sahil-pr-audit` + `code-reviewer` agent cover this |
| Semantic Pull Request bot | Lefthook commit-msg-check covers Conventional Commits |
| Renovate / Dependabot | Premature; 26-day build window doesn't need auto-dep updates |

---

## First-day setup commands (paste-ready for Step D bootstrap)

```bash
# At repo root after `git init`
mise install                                  # install all toolchain versions from .mise.toml
pnpm install                                  # TS workspace
uv sync                                       # Python workspace
lefthook install                              # register git hooks
pnpm exec biome init                          # generate biome.json if not present
pnpm changeset init                           # set up Changesets
pnpm dlx commitizen init cz-conventional-changelog --save-dev --save-exact  # optional commit helper

# Verify everything works
pnpm turbo run lint
pnpm turbo run test
pnpm turbo run build

# First commit
git add .
git commit -m "chore: bootstrap monorepo"
```

---

## Cross-references

- `MONOREPO_LAYOUT.md` — the folder structure these configs target
- `TOOLING_DECISIONS.md` — the tool picks these configs apply
- `BUILD_SEQUENCE.md` — when this setup matters vs when coding starts
- Build-prep plan: `/Users/abu/.claude/plans/lovely-painting-crane.md`
- Feedback memory directory: `/Users/abu/.claude/projects/-Users-abu-dev-hackathon-sui-overflow/memory/feedback_*.md`
