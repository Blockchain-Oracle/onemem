# AGENTS.md

## Project Snapshot

OneMem is a verifiable cross-runtime AI agent memory and action-trace layer for
Sui, Walrus, Seal, and MemWal.

The repo is a mixed monorepo:

- `contracts/onemem/` — Sui Move protocol.
- `packages/sdk-ts/` and `packages/sdk-python/` — SDKs.
- `packages/cli-ts/` and `packages/cli-python/` — CLI surfaces.
- `packages/mcp-server/` — stdio MCP server.
- `packages/dashboard/` — local Next.js dashboard.
- `apps/hosted-dashboard/` and `apps/landing/` — deployed surfaces;
  `apps/docs/` — docs source, pending hosted-domain proof.
- `packages/plugin-*` and `packages/provider-*` — runtime and framework integrations.

Before deciding what is next, read the Context Engineering wiki at
`.thoughts/wiki/index.md`. Use
`docs/05-our-architecture/00-overview/BUILD_SEQUENCE.md` as historical sequence
context, not as the sole current tracker.

## Working Rules

- Treat the working tree as user-owned. Do not revert or delete existing changes
  unless Abu explicitly asks.
- Use repo patterns and package-local docs before inventing new structure.
- For library, framework, SDK, API, CLI, or cloud-service questions, fetch current
  docs with `ctx7` first per the parent workspace instructions.
- For UI work, treat `/Users/abu/Downloads/One Mem 2` as prototype evidence, not
  source code to copy blindly.
- Keep `AGENTS.md` short. Detailed research, plans, audits, and discoveries belong
  in `.thoughts/`.

## Commands

Core repo checks:

```bash
pnpm test:structure
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Python checks:

```bash
uv run ruff check .
uv run pyright
uv run pytest packages/sdk-python -q
```

Move checks:

```bash
cd contracts/onemem
sui move build
sui move test
```

## Quality Gates

- Structure integrity is enforced by `pnpm test:structure`.
- TS/JS formatting and linting use Biome.
- TS packages typecheck with `tsc --noEmit` and build with `tsup` or Next.js.
- Python uses Ruff, Pyright, and Pytest.
- Move uses `sui move build` and `sui move test`.
- Source files have a current hard cap of 400 lines in
  `tests/structure/protocol.test.ts`.
  Prefer refactoring before 300 lines when touching a file that is already large.
- Product trust-path work needs real-system verification against the relevant
  runtime, Sui testnet, Walrus, Seal, or MCP protocol, not only unit tests.
- On Codex, UI/browser verification for local routes should use the `@chrome`
  plugin first. A separate repo-owned browser harness is only for committed
  regression coverage or a recorded fallback when the Chrome plugin is
  unavailable.

## Context Workflow

Use Abu Context Engineering artifacts under:

```text
.thoughts/
```

Important current artifacts:

- `wiki/context-engineering-status.md`
- `quality/2026-06-17-project-quality-profile.md`
- `prototype-discovery/2026-06-17-one-mem-2.md`
- `plans/2026-06-17-docs-alignment-cleanup.md`
- `plans/2026-06-17-context-engineering-setup.md`
- `wiki/index.md`
- `wiki/project-map.md`

Use these skills when the task matches:

- `abu-context-engineering:project-quality-profile` for guardrails and checks.
- `abu-context-engineering:prototype-discovery` before implementing from a UI prototype.
- `abu-context-engineering:research-backed-plan` before large implementation passes.
- `abu-context-engineering:verification-audit` before claiming a feature is done.
- `abu-context-engineering:agents-md-author` when changing instruction files.
- `abu-context-engineering:handoff-compaction` before long pauses or handoffs.

## Subagent Lanes

Subagents are useful when the work can be split into independent lanes:

- Protocol and SDK verification.
- Dashboard/prototype gap audit.
- Docs and landing copy audit.
- Runtime/provider smoke testing.
- CI and package release checks.

Give each subagent a narrow question or disjoint file ownership. Do not have two
agents edit the same package at the same time.

## Directory-Specific Context

Read the closest specialized context before editing:

- `contracts/onemem/CLAUDE.md`
- `packages/sdk-ts/CLAUDE.md`
- `packages/dashboard/CLAUDE.md`
- `packages/plugin-claude-code/skills/onemem-claude-code/SKILL.md`

## Do Not

- Do not put long specs, research, or plans into `AGENTS.md`.
- Do not copy static prototype HTML/CSS into Next.js without translating it into
  the target package architecture.
- Do not fake chain, Walrus, Seal, MCP, or runtime verification.
- Do not hardcode dependency versions from memory.


<claude-mem-context>
# Memory Context

# claude-mem status

This project has no memory yet. The current session will seed it; subsequent sessions will receive auto-injected context for relevant past work.

Memory injection starts on your second session in a project.

`/learn-codebase` is available if the user wants to front-load the entire repo into memory in a single pass (~5 minutes on a typical repo, optional). Otherwise memory builds passively as work happens.

Live activity: http://localhost:37701
How it works: `/how-it-works`

This message disappears once the first observation lands.
</claude-mem-context>