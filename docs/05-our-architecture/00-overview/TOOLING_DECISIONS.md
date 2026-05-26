# Tooling Decisions — OneMem

**Status:** Locked 2026-05-26 per approved build-prep plan (`/Users/abu/.claude/plans/lovely-painting-crane.md`).

Every tooling pick below is grounded in 2026 cross-cutting research (not MemWal-mirror defaults). Each decision has 2-3 sentences of evidence-based rationale + the reference cohort it was compared against.

Research sources:
- `/Users/abu/.claude/plans/research-inspiration-repo-layouts.md` (12-repo audit)
- Research Agent #1 monorepo+tooling findings (in conversation context; benchmarks across pnpm/Bun/npm/Yarn + Turborepo/Nx/Bazel + Biome/ESLint + Vitest/Jest + uv/poetry + Lefthook/husky)
- `02-inspirations/BRAND_AND_SURFACES.md` for brand-coupled tool picks
- `02-inspirations/mem0/MEM0_DOCS_DESIGN.md` for docs stack

---

## The locked stack at a glance

| Concern | Pick | Deviation from MemWal? |
|---|---|---|
| TS workspace | **pnpm 10** | ✅ matches |
| Python workspace | **uv** | new (MemWal didn't formalize) |
| Build orchestrator | **Turborepo 2.0** | ⚠️ deviation (MemWal uses plain `pnpm --filter`) |
| Toolchain version mgr | **Mise** | new |
| TS build (libs) | **tsup** | ⚠️ deviation (MemWal uses `tsc`) |
| TS build (dashboard) | **Next.js 15 (standalone output)** | ⚠️ deviation from MemWal's Vite `apps/app` — chosen so the same code powers local CLI launch AND hosted deploy (see audit note below) |
| TS build (landing + hosted shell) | **Next.js 15** | new (MemWal doesn't have a Next app) |
| Move build | `sui move build` | ✅ matches |
| Rust build | Cargo (stretch only) | n/a |
| TS test runner | **Vitest** | likely deviation |
| Python test runner | **pytest + pytest-asyncio** | ✅ likely matches |
| TS lint + format | **Biome 2.x** | ⚠️ deviation (MemWal uses ESLint+Prettier) |
| Python lint + format | **ruff** | new |
| Python type check | **pyright** | new |
| Git hooks | **Lefthook** | likely deviation |
| Commit conventions | **Conventional Commits** | matches |
| Release automation | **Changesets** | ✅ matches |
| CI/CD | **GitHub Actions** | matches |
| Docs site | **Mintlify** | ✅ same as Mem0 + claude-mem |

---

## Per-decision rationale

### TS workspace: **pnpm 10**

**Evidence:** 65.5M weekly npm downloads (highest of any TS workspace tool); workspace protocol is gold standard; MemWal + langfuse + elizaOS + most 2026 TS monorepos use it.

**Alternatives rejected:**
- **Bun workspaces** — ecosystem consolidation incomplete; one incompatible dep breaks mid-hackathon. Re-evaluate v0.2.
- **npm workspaces** — phantom dependency issues without explicit strict mode; less ecosystem momentum.
- **Yarn Berry** — most mature workspace features (Yarn Constraints) but slower adoption than pnpm for new projects; overkill for our needs.

**Config:** `pnpm-workspace.yaml` with `["packages/*", "apps/*", "demos/*"]`. Workspace deps use `"workspace:*"` protocol.

### Python workspace: **uv (Astral)**

**Evidence:** 100x faster than pip+poetry; native workspace mode (uv.lock shared); adopted by Letta + Zep + most new 2026 Python projects. Hybrid TS+Python monorepos in 2026 default to pnpm + uv coexisting.

**Alternatives rejected:**
- **poetry** — still used but slower; not workspace-first.
- **pixi** — cross-language but monorepo support immature.
- **rye** — Astral acquired Astral; pivot to uv was explicit.
- **Hatch** — fine for single packages; not workspace-focused.

**Config:** Root `pyproject.toml` with `[tool.uv.workspace] members = [...]` explicit list (clearer than glob for our case).

### Build orchestrator: **Turborepo 2.0**

**Evidence:** Adopted by langfuse + 70% of TS-monorepo startups (per Agent #1 research); pnpm-native task runner + dependency-ordered builds + task output caching. 1-day integration. Language-agnostic (caches task outputs regardless of what the script does — works for Move + Python + Rust).

**Deviation from MemWal:** MemWal uses plain `pnpm --filter` scripts in root `package.json`. At their package count (~6-7 packages) that's fine. At our 14+ packages, Turborepo's caching + dep ordering pays off.

**Alternatives rejected:**
- **Nx** — wins on multi-language plugins + affected detection + generators. 3-4 day integration vs Turborepo's 1 day. Overkill at our scale; revisit if we hit 50+ packages.
- **Moon** — Rust-based; stricter; immature for web3 ecosystem.
- **Bazel** — 2-3 week learning curve. Reserved for 100+ packages.
- **Lerna** — dead in 2026 (last major release 2021).
- **Just plain pnpm --filter** — works at MemWal's scale; doesn't scale to ours.

**Config:** `turbo.json` with `build` / `test` / `lint` / `dev` / `deploy` pipelines. `^build` for dep-ordered builds.

### Toolchain version manager: **Mise**

**Evidence:** Locks `pnpm`, `uv`, `node`, `sui-move`, `rust`, `bun` versions across machines + CI. Replaces asdf + nvm + pyenv + rustup with one tool. Single `.mise.toml` at root.

**Why this is new (MemWal doesn't use):** MemWal contributors are mostly Mysten employees with aligned toolchains. We expect contributors from anywhere; explicit version locking matters.

**Config:**
```toml
# .mise.toml
[tools]
node = "20.18.0"
pnpm = "9.12.3"
python = "3.12"
uv = "latest"
bun = "1.2.0"
rust = "stable"
```

### TS build (libs): **tsup**

**Evidence:** Zero-config ESM+CJS dual output; 0.5s builds on small packages; right tool for SDK/CLI/MCP packages that ship to npm. Mem0's TS packages use it; claude-mem uses it.

**Deviation from MemWal:** MemWal's `packages/sdk` uses raw `tsc` (single ESM output). We need ESM+CJS for SDK to work in both Node and browser environments + maximum compat.

**When to use plain `tsc` instead:** for internal packages that only consume one runtime (e.g., the dashboard's internal lib code). For all npm-published packages, use tsup.

**Config:** `tsup.config.ts` per package:
```ts
import { defineConfig } from 'tsup';
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
});
```

### TS build (dashboard): **Next.js 15 (standalone output)** — corrected from earlier "Vite" decision per audit (2026-05-26)

**Original draft:** Vite + React 19 (mirroring MemWal's `apps/app`).
**Corrected to:** Next.js 15 with `output: 'standalone'`.

**Why the correction:** The dashboard at `packages/dashboard/` must serve TWO modes from the SAME code:
1. **Local mode** — `onemem dashboard` CLI command boots a local server on `localhost:4040` reading `~/.onemem/credentials.json` (no login, claude-mem-style daily driver). See `06-dashboard/local-deploy.md`.
2. **Hosted mode** — `apps/hosted-dashboard/` wraps it with Enoki/zkLogin for `app.onemem.ai` (onboarding + cross-device + the public `/verify/[session_id]` page). See `06-dashboard/hosted-deploy.md` + `06-dashboard/purpose-local-vs-hosted.md`.

Vite would have forced two codebases (Vite-app for local, Next-app for hosted) — exactly the OpenMemory-failure pattern Mem0 hit (per Agent #3 research). Next.js 15's standalone output produces a self-contained server bundle the CLI can spawn (no separate "local app" needed), exports cleanly to Vercel for hosted, AND supports `next export` static-export for the Walrus Sites mirror.

**Evidence:**
- Next.js 15 + Turbopack: cold dev start now 1.5-3s (was 3-5s in v14). Acceptable for our iteration loop.
- `output: 'standalone'` produces a `node_modules`-bundled `.next/standalone/` directory the CLI launches with one command — perfect for the `onemem dashboard` UX (no install step on the user's machine beyond the CLI itself).
- Same SSR primitives that landing + hosted use → no second mental model.
- App Router supports our `/verify/[session_id]` dynamic-route public page natively.

**Tradeoff accepted:** ~1.5s slower cold dev start than Vite (1.5-3s vs Vite's <2s). Negligible vs the cost of maintaining two codebases or coordinating cross-runtime route logic.

**Config:** `next.config.mjs` with `output: 'standalone'`; `bin/onemem-dashboard` shell script in `packages/dashboard/package.json` runs `next start -p 4040`.

### TS build (landing + hosted shell): **Next.js 15**

**Evidence:** Landing needs SEO (server-rendered HTML for Google + sharing previews); Mintlify is itself Next.js under the hood; hosted-dashboard shell uses Next.js to compose the auth-gated and public routes that wrap `@onemem/dashboard`.

**Mintlify note:** `apps/docs/` is Mintlify-managed, not a hand-rolled Next.js app. We just author MDX + `docs.json`; Mintlify handles the rest.

**Single-Next.js-stack benefit:** With the audit's dashboard correction, every TS app surface (landing, docs-shell-wrapping, hosted-dashboard, packages/dashboard) speaks Next.js 15. One mental model, one auth/SSR/middleware pattern, one Turborepo cache namespace.

### Move build: `sui move build`

**Evidence:** Native Sui toolchain; nothing better exists. `sui move test --coverage` for tests.

**Config:** Standard `Move.toml` in `contracts/onemem/`. Pin Sui framework to `mainnet` git rev.

### Rust build: Cargo (stretch only)

**Evidence:** Standard. Only used if Pillar 12 (Nautilus TEE relayer) ships.

### TS test runner: **Vitest**

**Evidence:** 5-6x faster than Jest at scale (50,000-test monorepo: Vitest 38s cold, Jest 214s); ESM-native; Turborepo-aware caching; minimal config.

**Likely deviation from MemWal:** MemWal's package configs don't explicitly call out a test runner; we go with the 2026 default.

**Alternatives rejected:**
- **Jest** — slower; older; needs more config for ESM.
- **Bun test** — Bun runtime risk (per Bun workspaces rejection).

**Config:** `vitest.config.ts` per package; root config inherits.

### Python test runner: **pytest + pytest-asyncio**

**Evidence:** Standard; 60%+ adoption; works natively with uv workspaces; pytest 9.0 lands early 2026.

**Config:** `pytest.ini` per package or `[tool.pytest]` in `pyproject.toml`.

### TS lint + format: **Biome 2.x**

**Evidence:** 56-100x faster than ESLint+Prettier (pre-commit hooks 0.05s vs 1.5s); single tool for lint + format; 423+ rules in Biome 2.

**Deviation from MemWal:** MemWal uses ESLint. We accept Biome's smaller plugin ecosystem (700+ rules in ESLint vs 423 in Biome) for the speed + single-tool simplicity.

**Risk + mitigation:** If we need a niche ESLint rule Biome doesn't have, fall back to ESLint just for that file. So far Biome covers everything we need.

**Config:** `biome.json` at root with rules; per-package overrides if needed.

### Python lint + format: **ruff**

**Evidence:** 10-100x faster than flake8 (0.3s on 500K-line Django app); 900+ rules; replaces flake8 + black + isort + pydocstyle in one tool.

**Config:** `ruff.toml` at root.

### Python type check: **pyright**

**Evidence:** Faster + more accurate than mypy; used by FastAPI + Pydantic + most large 2026 Python projects.

**Alternatives rejected:**
- **mypy** — slower; more false negatives on modern Python features.
- **ty** — too new (2026 alpha); revisit v0.2.

**Config:** `pyrightconfig.json` at root with strict mode per critical package.

### Git hooks: **Lefthook**

**Evidence:** 10x faster than husky; parallel execution; YAML config; cross-language native (handles TS + Python + Move + Rust in one config).

**Alternatives rejected:**
- **husky + lint-staged** — still standard but slower; setup more verbose.
- **simple-git-hooks** — too simple for our needs.

**Config:** `lefthook.yml`:
```yaml
pre-commit:
  parallel: true
  commands:
    biome:
      glob: "*.{ts,tsx,js,jsx}"
      run: pnpm exec biome check --apply {staged_files}
    ruff:
      glob: "*.py"
      run: ruff check --fix {staged_files} && ruff format {staged_files}
    move:
      glob: "*.move"
      run: cd contracts/onemem && sui move build

pre-push:
  commands:
    test-changed:
      run: pnpm turbo test --filter=...HEAD
```

### Commit conventions: **Conventional Commits**

**Evidence:** Auto-pairs with Changesets; standard across 2026 OSS. `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`, etc.

**Enforcement:** Lefthook hook checks commit messages against pattern; rejects malformed messages.

### Release automation: **Changesets**

**Evidence:** Monorepo-first; matches MemWal exactly; polyglot support via custom version/publish scripts in GitHub Action. Mature; battle-tested.

**Config:** `.changeset/config.json` with linked publishing groups (TS packages publish via npm; Python packages publish via PyPI through custom scripts).

**Workflow:**
1. Developer makes a change, runs `pnpm changeset add` → describes change + bumps version
2. PR includes the changeset file
3. On merge to main: GitHub Action runs `pnpm changeset version` (bumps versions) + `pnpm changeset publish` (publishes to registries)
4. Python packages publish via parallel custom script: `python scripts/publish-python.py` (reads same changeset metadata)

### CI/CD: **GitHub Actions**

**Evidence:** Standard for OSS; free for public repos; well-integrated with pnpm + uv + Changesets.

**Workflow files:**
- `.github/workflows/ci.yml` — lint + test + build per PR
- `.github/workflows/release.yml` — Changesets publish on main
- `.github/workflows/deploy-contract.yml` — manual `workflow_dispatch` for Move mainnet deploys (gated by manual approval)

Example `ci.yml`:
```yaml
name: CI
on: [push, pull_request]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: jdx/mise-action@v2          # installs everything from .mise.toml
      - run: pnpm install --frozen-lockfile
      - run: uv sync --frozen
      - run: pnpm turbo run lint
      - run: pnpm turbo run test
      - run: pnpm turbo run build
      - run: cd contracts/onemem && sui move test
```

### Docs site: **Mintlify**

**Evidence:** Same stack as Mem0 + claude-mem (verified via shared Vercel project ID `prj_NdMUpHpUIb41Po1H8c6hrChv2bgr` per `02-inspirations/mem0/MEM0_DOCS_DESIGN.md`). Cream surface (`#FAF8F5`) aligns with Walrus/Sui visual family.

**Config:** `apps/docs/docs.json` with brand color overrides per `07-marketing-and-docs/docs-architecture.md`.

---

## Cross-language coordination

The trickiest concern in a hybrid TS + Python + Move + Rust monorepo: keeping shared concepts (data types from Move structs) consistent across languages.

**Approach at v0.1:** explicit codegen scripts.

- `scripts/codegen-move-types.ts` — reads the deployed Move package's BCS schema → outputs `packages/sdk-ts/src/types/move-types.ts`
- `scripts/codegen-move-python.py` — reads the same schema → outputs `packages/sdk-python/onemem/move_types.py`
- Run manually on contract changes; commit the generated files
- CI check: `pnpm turbo run codegen:check` confirms generated files are up to date

Why not auto-codegen on every build:
- Move contract changes are infrequent (~5-10 times across the 26-day build)
- Generated code in version control is reviewable
- Avoid CI complexity

**v0.2+ option:** integrate `move-binding` (Rust) for canonical schema → TS + Python codegen. Out of scope for v0.1.

---

## What we explicitly DON'T set up (and why)

| Tool | Why skipping |
|---|---|
| Bun workspaces | Ecosystem consolidation incomplete; one bad dep breaks the hackathon |
| Nx | 3-4 day integration vs Turborepo's 1 day; overkill at <20 packages |
| Bazel | 2-3 week learning curve |
| Lerna | Dead in 2026 |
| Jest | Vitest is 5.6x faster + Turborepo-integrated |
| ESLint + Prettier | Biome is 56-100x faster + single tool |
| flake8 + black + isort | ruff replaces all 3 |
| poetry | uv is 100x faster + workspace-first |
| husky | Lefthook is 10x faster + parallel |
| Storybook | Overkill for 7 dashboard routes; Playwright visual tests suffice |
| Turborepo cache server (remote) | Premature; local cache sufficient at v0.1 |
| Yalc | Use pnpm `workspace:*` instead |
| nx-python plugin | Not using Nx; uv handles Python workspaces |
| pre-commit framework (Python tool) | Lefthook covers; no need for parallel hook system |
| semantic-release | Changesets is better for monorepos |

---

## Performance budget (developer experience)

| Action | Target | Why it matters |
|---|---|---|
| Fresh clone → `pnpm install + uv sync` | <2 min on warm CI | Contributor onboarding |
| Pre-commit hook (lefthook) | <500ms | Doesn't slow commit flow |
| Pre-push hook (turbo test changed) | <30s | Doesn't slow push flow |
| Turborepo cache hit on `pnpm turbo build` | <5s | Iteration speed |
| Turborepo cold build (full monorepo) | <60s | Acceptable for clean rebuilds |
| Vitest unit test suite per package | <10s | TDD red-green cycle |
| `sui move test` for `contracts/onemem` | <30s | Move contract iteration |
| Vite dashboard dev server cold start | <2s | Frontend iteration |

If any metric blows past target during build, profile + optimize (don't just accept).

---

## Cross-references

- `MONOREPO_LAYOUT.md` — the folder structure these tools operate on
- `CODING_AGENT_SETUP.md` (Step C) — agent config that leverages these tools
- `BUILD_SEQUENCE.md` — when each tool is set up vs when it's used
- Research source: `/Users/abu/.claude/plans/research-inspiration-repo-layouts.md`
- Build-prep plan: `/Users/abu/.claude/plans/lovely-painting-crane.md`
