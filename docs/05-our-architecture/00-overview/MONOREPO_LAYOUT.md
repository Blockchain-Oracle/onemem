# Monorepo Layout — OneMem

**Status:** Locked 2026-05-26 per approved build-prep plan (`/Users/abu/.claude/plans/lovely-painting-crane.md`).

The on-disk folder structure for OneMem. Grounded in cross-cutting research across 12 reference repos (mem0, claude-mem, letta, zep, MemWal, hermes, elizaOS, langfuse, phoenix, sui, walrus-sites, deepbookv3) — **not a MemWal-mirror.** Where we deviate from MemWal, the rationale is explicit.

Repo root will live at: `/Users/abu/dev/hackathon/sui-overflow/onemem/` (new directory; not in this `research/` tree).

---

## Top-level layout

```
onemem/                                    # repo root
├── .mise.toml                             # Toolchain versions (pnpm/uv/node/sui-move/rust)
├── .gitignore
├── .editorconfig
├── .changeset/                            # Changesets release management
│   └── config.json
├── .github/
│   └── workflows/
│       ├── ci.yml                         # lint + test + build per PR
│       ├── release.yml                    # Changesets publish on main
│       ├── deploy-contract.yml            # manual workflow_dispatch for Move mainnet
│       └── deploy-walrus-sites.yml        # manual workflow_dispatch for hosted dashboard Walrus Sites mirror (NEW per audit)
├── .vscode/                               # workspace settings (optional)
│
├── package.json                           # workspace root; dev deps + scripts
├── pnpm-workspace.yaml                    # TS workspace
├── pnpm-lock.yaml
├── pyproject.toml                         # uv workspace root
├── uv.lock
├── turbo.json                             # Turborepo pipeline config
├── tsconfig.base.json                     # shared TS config
├── biome.json                             # TS lint + format
├── ruff.toml                              # Python lint + format
├── lefthook.yml                           # Git hooks
│
├── CLAUDE.md                              # Root coding-agent context (lean)
├── README.md
├── LICENSE                                # Apache-2.0
│
├── packages/                              # ALL libraries — TS + Python mixed (see rationale below)
├── apps/                                  # User-facing deployed surfaces
├── contracts/                             # Sui Move package
├── services/                              # Backend services (mostly stretch)
├── demos/                                 # 4 demo apps
├── scripts/                               # Repo-wide tooling scripts
└── docs/                                  # Internal architecture docs (mirrors context/)
```

> **Audit-applied 2026-05-26.** Four corrections rolled in after Mem0-dashboard analysis + Abu's purpose-distinction pushback:
> - `packages/dashboard/` is **Next.js 15** (was Vite — corrected; see `06-dashboard/purpose-local-vs-hosted.md`)
> - **New:** `packages/brand/` — shared brand assets (logos, fonts, OG templates) consumed by landing + dashboard + docs
> - **New:** Walrus Sites mirror artifacts (`apps/hosted-dashboard/walrus-sites/` + `scripts/deploy-walrus-sites.sh` + GitHub workflow)
> - **New:** `scripts/migrate-contract.sh` for the Move package version-as-dynamic-field upgrade flow

---

## `packages/` — the libraries

Mixed TypeScript + Python side-by-side. pnpm workspace ignores Python packages (no `package.json`); uv workspace ignores TS packages (no `pyproject.toml`). Same directory, two tools, zero conflict.

```
packages/
├── sdk-ts/                                # @onemem/sdk-ts            (TS)
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   ├── tests/
│   └── README.md
│
├── sdk-python/                            # onemem-sdk-python         (Python)
│   ├── pyproject.toml
│   ├── onemem/
│   ├── tests/
│   └── README.md
│
├── cli-ts/                                # @onemem/cli               (Node CLI)
│   ├── package.json
│   ├── bin/onemem
│   └── src/
│
├── cli-python/                            # onemem-cli                (Python CLI)
│   ├── pyproject.toml
│   └── onemem_cli/
│
├── mcp-server/                            # @onemem/mcp               (stdio MCP server, TS)
│   ├── package.json
│   ├── bin/onemem-mcp
│   └── src/
│
├── dashboard/                             # @onemem/dashboard         (Next.js 15 standalone — corrected from earlier Vite plan per audit)
│   ├── package.json                       # bin: onemem-dashboard (CLI spawns `next start -p 4040`)
│   ├── next.config.mjs                    # output: 'standalone' for CLI-launch; supports next export for Walrus mirror
│   ├── tailwind.config.ts
│   ├── app/                               # Next.js App Router (routes + components + lib)
│   ├── public/
│   └── bin/onemem-dashboard               # executable that runs next start (called by @onemem/cli)
│
├── brand/                                 # @onemem/brand             (shared brand assets — NEW per audit)
│   ├── package.json
│   ├── logo/                              # SVGs (full logo, mark, dark/light variants)
│   ├── fonts/                             # Inter + JetBrains Mono (+ Ratch/General Sans if licensed)
│   ├── og-images/                         # OG image templates for landing + docs + dashboard verify pages
│   └── tokens.css                         # CSS variables for the brand palette (lavender + chartreuse + cream + sui-blue)
│
│   # Per-runtime plugins (Pillar 3)
├── plugin-claude-code/                    # @onemem/claude-code-plugin
│   ├── package.json
│   ├── .claude-plugin/plugin.json
│   ├── hooks/hooks.json
│   └── scripts/                           # observe.js, inject.js, summarize.js, learn-codebase.js
│
├── plugin-openclaw/                       # @onemem/oc-onemem
│   ├── package.json
│   ├── openclaw.plugin.json
│   └── src/
│
├── plugin-hermes/                         # hermes-onemem             (Python; PyPI standalone)
│   ├── pyproject.toml
│   ├── manifest.toml
│   └── hermes_onemem/
│
│   # Per-framework providers (Pillar 4)
├── provider-vercel-ai/                    # @onemem/vercel-ai-provider
│   ├── package.json
│   └── src/
│
├── provider-openai-agents/                # @onemem/openai-agents     (TS + Python siblings)
│   ├── package.json
│   ├── pyproject.toml                     # OPTIONAL — TS + Python in one package
│   └── src/                               # primary TS impl
│
├── provider-crewai/                       # onemem-crewai             (Python)
│   ├── pyproject.toml
│   └── onemem_crewai/
│
├── provider-livekit/                      # onemem-livekit            (Python voice)
│   ├── pyproject.toml
│   └── onemem_livekit/
│
└── provider-elevenlabs/                   # onemem-elevenlabs         (Python voice)
    ├── pyproject.toml
    └── onemem_elevenlabs/
```

**Historical count:** this design snapshot listed 15 packages at v0.1. The
current repo has 16 package directories after adding `packages/plugin-codex/`.
Use the root `README.md` and `packages/` tree for current counts.

**Why mixed (TS + Python side-by-side):**

| Approach | Pros | Cons | Verdict |
|---|---|---|---|
| Mixed `packages/` (our pick) | Matches MemWal + elizaOS; cleaner naming (`plugin-hermes/` vs `packages-py/plugin-hermes/`); same dir scanned by both workspace tools | Mental overhead — contributors must check `package.json` vs `pyproject.toml` to know language | ✅ Pick |
| Split `packages/` + `packages-py/` (initial v1 idea) | Clear visual separation | Awkward naming; contributors need to know which dir hosts what; duplicates path depth | ❌ Reject |
| Separate repos per language | Total isolation | Major friction; PRs span multiple repos; release coordination painful | ❌ Reject |

**Naming conventions:**
- TS packages: `@onemem/<name>` scoped npm name; directory `packages/<name>/` matches
- Python packages: `onemem-<name>` PyPI name; directory `packages/<name>/` matches (with underscores in Python module names: `onemem_<name>`)
- Hermes plugin special case: `hermes-onemem` PyPI name (matches Hermes ecosystem convention from `02-inspirations/hermes`)
- Plugin packages: directory prefix `plugin-<runtime>/`; TS scoped name `@onemem/<runtime>-plugin`
- Provider packages: directory prefix `provider-<framework>/`; TS scoped name `@onemem/<framework>-provider`

---

## `apps/` — deployed user-facing surfaces

Each app is deployed independently. Not npm-published.

```
apps/
├── landing/                               # onemem.xyz                 (Next.js 15 — SEO needs SSR)
│   ├── package.json
│   ├── next.config.mjs
│   ├── app/                               # App Router
│   └── public/
│
├── docs/                                  # docs.onemem.xyz            (Mintlify)
│   ├── docs.json                          # Mintlify config
│   ├── introduction.mdx
│   ├── quickstart.mdx
│   ├── concepts.mdx
│   └── (one .mdx per docs page)
│
└── hosted-dashboard/                      # app.onemem.xyz             (deploy shell wrapping packages/dashboard + Enoki/zkLogin)
    ├── package.json                       # depends on @onemem/dashboard + @onemem/brand (workspace:*)
    ├── next.config.mjs                    # standalone for Vercel; next export for Walrus Sites mirror
    ├── app/                               # Next.js shell with hosted-only routes
    │   ├── page.tsx                       # / (landing-shell with sign-in CTA)
    │   ├── login/page.tsx                 # /login (Enoki + dApp Kit)
    │   ├── cli-login/page.tsx             # /cli-login (CLI callback target for `onemem login` flow)
    │   ├── onboarding/page.tsx            # /onboarding (first-time MemWalAccount mint via Enoki sponsored tx)
    │   ├── share/page.tsx                 # /share owner-sponsored capability minting
    │   ├── share/[capability_id]/page.tsx # /share/[id] recipient capability object view
    │   ├── verify/[session_id]/page.tsx   # /verify/[id] — PUBLIC chain verifier (no login; NEW v0.1 per audit)
    │   └── dashboard/                     # /dashboard/* (authenticated; re-exports @onemem/dashboard routes)
    │       ├── memories/page.tsx
    │       ├── apps/page.tsx
    │       ├── trace/[session_id]/page.tsx
    │       ├── sessions/[session_id]/page.tsx
    │       └── settings/page.tsx
    ├── walrus-sites/                      # Walrus Sites mirror deploy artifacts (NEW per audit)
    │   ├── sites-config.yaml              # Walrus Sites build + epoch config
    │   └── README.md                      # mirror deploy + DNS instructions
    └── public/
```

**Why `hosted-dashboard` as a deploy shell, not a separate app:**
- Per cross-cutting research (Agent 3): "single codebase for hosted + OSS." Mem0's OpenMemory sunset proved separate-apps approach fails. Langfuse confirms by example.
- `packages/dashboard/` ships the actual routes + components (works as both `localhost:4040` local launch via the CLI AND deployed via the shell).
- `apps/hosted-dashboard/` just wraps it with: Enoki/zkLogin auth, sponsored-tx server-side glue, hosted-specific routing (`/cli-login` callback), production env config.
- Same code; different deploy mode (per `06-dashboard/local-deploy.md` + `06-dashboard/hosted-deploy.md`).

---

## `contracts/` — the Sui Move package

```
contracts/
└── onemem/
    ├── Move.toml
    ├── sources/
    │   ├── registry.move
    │   ├── namespace.move
    │   ├── trace.move
    │   ├── events.move
    │   ├── seal_policy.move
    │   └── version.move
    ├── tests/
    │   ├── namespace_tests.move
    │   ├── trace_tests.move
    │   ├── capability_transfer_tests.move
    │   ├── seal_approve_tests.move
    │   └── merkle_chain_tests.move
    └── examples/                          # example PTBs in TS
        ├── mint_namespace.ts
        ├── start_trace_session.ts
        └── verify_chain.ts
```

**Why `contracts/` and not `services/contract/` (deviation from MemWal):**
- Sui ecosystem convention per Agent 3 research: DeepBook (`packages/predict/`), Walrus Sites (`contracts/`), other Sui-native projects use `contracts/` or top-level Move packages — NOT `services/`.
- `services/` traditionally implies running backend services (HTTP servers, daemons). A Move package is a deployed artifact, not a service.
- Clearer for contributors: "where are the smart contracts?" → `contracts/`.

---

## `services/` — backend services (mostly stretch)

```
services/
└── nautilus-relayer/                      # Pillar 12 stretch (Day 23+); Rust + Cargo
    ├── Cargo.toml
    ├── src/
    └── deploy/                            # Nautilus PCR registration scripts
```

Empty at v0.1 if Nautilus stretch goal doesn't land. Reserved for v0.2+ growth.

---

## `demos/` — the 4 demo apps

```
demos/
├── switch-laptops/                        # "memory follows across runtimes"
│   ├── README.md                          # how to reproduce
│   └── (per-runtime setup scripts)
│
├── agent-sends-money/                     # trace + verify flow
│   ├── README.md
│   └── wallet_agent.py                    # OpenAI Agents SDK demo agent
│
├── verifiable-research-agent/             # long-running w/ memory + replay
│   ├── README.md
│   └── (setup + populate scripts)
│
└── multi-agent-coordination/              # cross-runtime trace composition
    ├── README.md
    └── (Claude Code + Hermes orchestration script)
```

Each demo has its own `README.md` describing the recording setup + the script to reproduce. Per `08-demos-and-tests/` architecture docs.

---

## `scripts/` — repo-wide tooling scripts

```
scripts/
├── codegen-move-types.ts                  # Move struct → TS types codegen
├── codegen-move-python.py                 # Move struct → Python types codegen
├── deploy-contract.sh                     # `sui client publish` wrapper for contracts/onemem (initial publish)
├── migrate-contract.sh                    # Move package upgrade (publish new version) + per-object migration call helper (NEW per audit)
├── deploy-walrus-sites.sh                 # Walrus Sites mirror deploy for hosted dashboard (NEW per audit)
├── verify-mainnet.sh                      # smoke test against deployed mainnet contract
├── bootstrap-dev.sh                       # local dev setup (install deps, link workspace)
├── publish-all.sh                         # Changesets publish across all packages
└── update-deps.sh                         # syncpack-style cross-package version alignment
```

**Why `migrate-contract.sh` is separate from `deploy-contract.sh`:**
Per `01-protocol/upgrade-pattern.md` we adopt the **version-as-dynamic-field** pattern lifted from MemWal's `account.move`. Initial publish (`deploy-contract.sh`) creates the package + bootstrap objects; subsequent upgrades (`migrate-contract.sh`) publish a new package version + call per-object `migrate(...)` entry functions that swap the version dynamic field. Mixing them in one script causes ops mistakes during the hackathon's planned 2-3 contract iterations.

---

## `docs/` — internal architecture docs (mirror of `context/`)

```
docs/                                      # mirrors research/sui-overflow-2026/ideas/.greenfield/memwal-cross-tool-mcp/context/
├── 00-goal/
├── 01-sui-ecosystem/
├── 02-inspirations/
├── 03-target-runtimes/
├── 04-framework-providers/
├── 05-our-architecture/
├── 06-references/
└── INDEX.md
```

Why mirror inside the repo (not just keep in `research/`):
- Clean repo for contributors — they don't need to know about the hackathon-research folder
- Architecture docs travel with the code at every checkout
- Docs site can pull from `docs/` directly if needed
- Per-package CLAUDE.md files reference `docs/05-our-architecture/<sub-group>/<doc>.md` — clean relative paths

At repo bootstrap (Step D), we `cp -r` the research/context folder → `docs/` and keep them in sync via a one-way mirror script (research/context is the canonical source until launch; then `docs/` becomes canonical).

---

## Root-level config files

| File | Purpose | Format |
|---|---|---|
| `package.json` | Workspace root; dev deps (`turbo`, `@changesets/cli`, `tsx`, `typescript`); root scripts (`build`, `test`, `lint`, `dev`) | JSON |
| `pnpm-workspace.yaml` | TS workspace glob: `["packages/*", "apps/*", "demos/*"]` | YAML |
| `pyproject.toml` | uv workspace root; `[tool.uv.workspace] members = ["packages/*", "demos/*"]`; no project metadata | TOML |
| `turbo.json` | Pipeline: `build` (depends on `^build`), `test`, `lint`, `dev` (long-running) | JSON |
| `tsconfig.base.json` | Shared TS config; each package extends | JSON |
| `biome.json` | TS lint + format rules (single tool) | JSON |
| `ruff.toml` | Python lint + format rules | TOML |
| `lefthook.yml` | Git hooks: pre-commit (biome + ruff + move build); pre-push (turbo test --filter changed) | YAML |
| `.mise.toml` | Toolchain versions: `pnpm@9.x`, `uv@latest`, `node@20`, `bun@1.x`, `sui-move@latest`, `rust@stable` | TOML |
| `.changeset/config.json` | Changesets config with linked publishing groups (TS + Python packages each have their own publish flow) | JSON |
| `.editorconfig` | Cross-editor indent + line-ending consistency | INI |
| `.gitignore` | Standard ignores: `node_modules/`, `target/`, `__pycache__/`, `.venv/`, `dist/`, `build/`, `.turbo/`, `.next/`, `*.log` | text |

---

## Pnpm workspace config

```yaml
# pnpm-workspace.yaml
packages:
  - "packages/*"
  - "apps/*"
  - "demos/*"
  - "scripts"              # if scripts has its own package.json
```

The pattern relies on pnpm's behavior: if a directory matches the glob but has NO `package.json`, pnpm silently ignores it. So Python-only packages (with only `pyproject.toml`) won't cause errors.

## uv workspace config

```toml
# pyproject.toml (root, no project metadata — just workspace config)
[tool.uv.workspace]
members = [
    "packages/sdk-python",
    "packages/cli-python",
    "packages/plugin-hermes",
    "packages/provider-crewai",
    "packages/provider-livekit",
    "packages/provider-elevenlabs",
]
```

We use explicit member list (not glob) for uv to avoid scanning every `packages/*` and discovering non-Python ones. uv supports both; explicit is clearer here.

## Turborepo pipeline

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"],
      "cache": true
    },
    "lint": {
      "outputs": [],
      "cache": true
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "deploy": {
      "dependsOn": ["build", "test"],
      "cache": false
    }
  }
}
```

`^build` means "build my dependencies first." Turborepo handles dependency-ordered builds automatically.

---

## What changed from MemWal's layout

| Concern | MemWal | OneMem | Rationale |
|---|---|---|---|
| Workspace orchestrator | Plain `pnpm --filter` scripts in root `package.json` | **Turborepo 2.0** | At 14 packages + future growth, Turborepo's caching + dep-ordering pays off. MemWal works at their scale; we'll grow. |
| Move package location | `services/contract/` | **`contracts/onemem/`** | Sui ecosystem convention (DeepBook + Walrus Sites both use `contracts/`); `services/` implies running daemons |
| Workspace languages | Mixed in `packages/` | Mixed in `packages/` (same) | ✅ Matches |
| Releases | Changesets | Changesets (same) | ✅ Matches |
| Workspace tool TS | pnpm | pnpm (same) | ✅ Matches |
| Workspace tool Python | (only one Python pkg; no formal workspace) | **uv workspace** | Multiple Python packages at v0.1 (6); workspace mode keeps deps consistent |
| Apps location | `apps/` | `apps/` (same) | ✅ Matches |
| Docs location | `docs/` (top-level) | `docs/` (top-level) | ✅ Matches |
| Toolchain version mgr | (not used — implicit) | **`.mise.toml`** | Reproducibility across machines + CI |

---

## Path-resolution + tsconfig

`tsconfig.base.json` (extended by each TS package):

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "noUncheckedIndexedAccess": true
  }
}
```

Each package's `tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

No `paths` aliases at v0.1 — workspace dependencies use `"@onemem/<name>": "workspace:*"` in `package.json` directly. pnpm resolves to the on-disk package.

---

## How a new contributor finds their way around

1. Open repo root → `README.md` says "see `CLAUDE.md` for the agent overview; see `docs/05-our-architecture/README.md` for the human-readable architecture."
2. Want to work on a specific component? `cd packages/<name>/` → `CLAUDE.md` there points to the relevant `docs/05-our-architecture/<sub-group>/<doc>.md`
3. Want to add a new package? `MONOREPO_LAYOUT.md` (this file) shows the naming convention; copy an existing package's structure
4. Want to run everything? `pnpm install && uv sync && pnpm turbo run build test lint dev` at root

---

## Cross-references

- `BUILD_SEQUENCE.md` — when each package gets built within the 26-day window
- `DEPENDENCY_GRAPH.md` — what depends on what at the pillar level
- `TOOLING_DECISIONS.md` (Step B) — locked tooling picks per concern
- `CODING_AGENT_SETUP.md` (Step C) — coding agent config approach
- Build-prep plan: `/Users/abu/.claude/plans/lovely-painting-crane.md`
- Cross-cutting research: `/Users/abu/.claude/plans/research-inspiration-repo-layouts.md` (1,347 lines; 12 reference repos audited)
