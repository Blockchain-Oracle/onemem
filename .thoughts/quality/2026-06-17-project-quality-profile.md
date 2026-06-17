# Project Quality Profile: OneMem

## Detected Stack

OneMem is a mixed monorepo:

- TypeScript/JavaScript packages managed by `pnpm` and Turborepo.
- Next.js 15 App Router apps for local dashboard, hosted dashboard, and landing.
- Mintlify-style docs content under `apps/docs`.
- Python packages managed by `uv`.
- Sui Move package under `contracts/onemem`.
- Rust stretch service under `services/nautilus-relayer`.
- Biome for TS/JS format/lint.
- Ruff, Pyright, and Pytest for Python.
- GitHub Actions CI plus Lefthook local hooks.

## Existing Commands

Root commands:

```bash
pnpm test:structure
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm dev
```

Python commands:

```bash
uv sync --all-packages
uv run ruff check .
uv run pyright
uv run pytest packages/sdk-python -q
```

Move commands:

```bash
cd contracts/onemem
sui move build
sui move test
```

Setup:

```bash
mise install
pnpm install
uv sync
pnpm exec lefthook install
```

## Required Local Checks

For context or docs-only changes:

```bash
pnpm test:structure
```

For TS/JS package changes:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:structure
```

For Python changes:

```bash
uv run ruff check .
uv run pyright
uv run pytest packages/sdk-python -q
```

For Move changes:

```bash
cd contracts/onemem && sui move build && sui move test
pnpm test:structure
```

For UI changes:

```bash
pnpm --filter @onemem/dashboard build
pnpm --filter @onemem/hosted-dashboard build
pnpm --filter @onemem/landing build
pnpm test:structure
```

Then browser-check the affected routes with real or representative data.

## Required CI Gates

Current CI runs:

- `pnpm install --frozen-lockfile`
- `uv sync --all-packages --frozen`
- `pnpm test:structure`
- `pnpm turbo run lint`
- `pnpm turbo run typecheck`
- `pnpm turbo run test`
- `pnpm turbo run build`
- `sui move build`
- `sui move test`
- `uv run ruff check .`
- `uv run pyright`
- `uv run pytest packages/sdk-python -q`

## Suggested Hooks

Current Lefthook setup:

- Pre-commit Biome write/check for staged TS/JS/JSON.
- Pre-commit Ruff check/fix and format for staged Python.
- Pre-commit `sui move build` for Move changes.
- Pre-push `pnpm turbo run test --filter=...[origin/main]`.

Suggested follow-up:

- Add a non-mutating pre-push structure check.
- Add a warning-only file-size report at 300 lines while keeping CI hard cap at 400
  until the near-limit files are split.

## File Size Policy

Current repo policy:

- Hard cap: 400 source lines, enforced by `tests/structure.test.ts`.
- Exclusions: generated files, build output, fixtures, lockfiles, and framework output.

Context Engineering recommendation:

- Target: 200 source lines.
- Refactor warning: above 300 source lines.
- Current near-limit files include `contracts/onemem/sources/trace.move` and
  `packages/sdk-ts/src/traces.ts`; avoid adding more logic there without splitting.

## Commit Policy

The repo uses conventional commit style in recent history, for example:

- `feat(mcp): ...`
- `refactor(sdk): ...`
- `chore(oc-onemem): ...`

Recommended: keep conventional commits. Do not enforce with prose only if this
becomes important; add commitlint or equivalent hook/CI later.

## AGENTS.md Notes

`AGENTS.md` should stay a concise Codex router:

- Project snapshot.
- Commands and gates.
- Context Engineering artifact locations.
- Skill routing.
- Directory-specific context pointers.
- Subagent lane guidance.

Long specs, research, prototype reports, plans, and handoffs belong under
`.thoughts/`.

## Open Questions

- Should the current 400-line cap be lowered after the hackathon stabilization pass?
- Should stale status tables inside architecture docs be rewritten now, or preserved as
  historical design-phase documents with clear warnings?
- Which live verification flows should become env-gated integration tests next?
