I have all the evidence. The structure tests enumerate every TS and Python package (including all candidates) in `helpers.ts` and assert their manifests/files exist — a per-package inbound reference, but a structural assertion, not a dependency edge. Here is the adversarial verification brief.

## Scope

Independent re-verification of every package the inventory brief flagged as candidate-unused in the OneMem monorepo (`/Users/abu/dev/hackathon/sui-overflow/onemem`). For each, I grepped the entire repo (excluding `node_modules/`, `dist/`, `.next/`, `build/`, `.turbo/`, `.venv/`, `pnpm-lock.yaml`, `uv.lock`) for the package's npm/dist name, its Python module name, its bin name, and import/require forms — across source, `package.json`/`pyproject.toml` deps, `tsconfig.base.json`, pnpm/uv workspace manifests, plugin/marketplace/`.mcp.json` manifests, `turbo.json`, CI workflows (`.github/workflows/*`), `config/`, and `scripts/`. Verdict per package: SAFE-CANDIDATE (no consuming references found) or IN-USE (with the exact reference). Reality only.

## Sources Checked

- Root: `package.json`, `pnpm-workspace.yaml`, `pyproject.toml`, `turbo.json`, `tsconfig.base.json`, `.claude-plugin/marketplace.json`
- Per-package manifests + the two `.mcp.json` files (`packages/plugin-claude-code/.mcp.json`, `packages/plugin-codex/.mcp.json`)
- `.github/workflows/{ci,deploy-contract,deploy-walrus-sites,release}.yml`
- `config/` (only `networks.json`, `networks.schema.json` — no package refs)
- `scripts/` (codegen, deploy, migrate, preflight) and `tests/structure/helpers.ts`
- Full-repo `rg` for each candidate's names/bins/modules (outputs reviewed in full, incl. the 350-line worker/mcp/relayer dump)

## Verified Facts

### Important cross-cutting reference (not a dep edge, but a real consumer)
- **CI runs every Python "candidate" package's tests.** `.github/workflows/ci.yml:84`: `uv run pytest packages/sdk-python packages/cli-python packages/plugin-hermes packages/provider-crewai packages/provider-livekit packages/provider-elevenlabs -q`. So `cli-python`, `plugin-hermes`, `provider-crewai`, `provider-livekit`, `provider-elevenlabs` are each named explicitly in CI.
- **Structure tests enumerate every package.** `tests/structure/helpers.ts:25-45` lists all TS packages (incl. `plugin-codex`, `plugin-openclaw`, `provider-vercel-ai`, `provider-openai-agents`) and all six Python packages; the suite asserts each one's manifest/files exist (`pnpm test:structure`). This is a structural assertion, not a runtime/dependency edge.
- **uv workspace membership.** `pyproject.toml` `[tool.uv.workspace].members` lists `cli-python`, `plugin-hermes`, `provider-crewai`, `provider-livekit`, `provider-elevenlabs` (and `sdk-python`). They are workspace members even with no internal dependents.

### Per-package adversarial verdicts

**`provider-openai-agents` (`@onemem/openai-agents`) — SAFE-CANDIDATE (no dependency/code edge)**
- Searched: `@onemem/openai-agents`, `openai-agents`, `provider-openai-agents`, code-import forms.
- Only `package.json` hit is its own `name` (`packages/provider-openai-agents/package.json:2`). No `from/require/import "@onemem/openai-agents"` anywhere outside its own package.
- All other hits are: docs (`docs/**`, `apps/docs/**`), structure tests (`tests/structure/{docs-frameworks,registry-docs,release-artifacts,brand-assets,brand-media-kit,helpers}.ts`), `scripts/check-release-preflight.py:83`, dashboard install-string (`packages/dashboard/app/settings/SettingsView.tsx:12`), and the generic `"openai-agents"` vendor/agentId string (vendor-logos, brand media-kit, `sdk-ts/tests/runtime-controls.test.ts:56`) — none of which is a dependency or code import.

**`provider-crewai` (`onemem-crewai` / `onemem_crewai`) — IN-USE (CI), no internal package-dep edge**
- IN-USE reference: `.github/workflows/ci.yml:84` (pytest target). uv workspace member (`pyproject.toml`).
- No other package imports `onemem_crewai`; all `from onemem_crewai import …` hits are inside `packages/provider-crewai/**` (own `tracer.py`, `__init__.py`, tests) plus docs/apps-docs and structure tests. Depends OUT on `onemem-sdk-python` (`provider-crewai/pyproject.toml:12,26`).

**`provider-livekit` (`onemem-livekit` / `onemem_livekit`) — IN-USE (CI), no internal package-dep edge**
- IN-USE reference: `.github/workflows/ci.yml:84`. uv workspace member.
- All `from onemem_livekit import …` hits are inside `packages/provider-livekit/**` + docs + structure tests. Depends OUT on `onemem-sdk-python` (`pyproject.toml:12,26`).

**`provider-elevenlabs` (`onemem-elevenlabs` / `onemem_elevenlabs`) — IN-USE (CI), no internal package-dep edge**
- IN-USE reference: `.github/workflows/ci.yml:84`. uv workspace member.
- All `from onemem_elevenlabs import …` hits are inside `packages/provider-elevenlabs/**` + docs + structure tests. Depends OUT on `onemem-sdk-python` (`pyproject.toml:12,26`).

**`plugin-hermes` (`hermes-onemem` / `hermes_onemem`) — IN-USE (CI), no internal package-dep edge**
- IN-USE reference: `.github/workflows/ci.yml:84`. uv workspace member. `dependencies = []` (`plugin-hermes/pyproject.toml`); bin `hermes-onemem = "hermes_onemem.install:main"` (`pyproject.toml:15`).
- `from hermes_onemem.provider import …` appears only in its own test (`packages/plugin-hermes/tests/test_provider.py:19`). All other hits are docs + the dashboard/hosted-dashboard install-string lists (`packages/dashboard/lib/runtimes.ts:91`, `SettingsView.tsx:16`, `apps/hosted-dashboard/app/onboarding/page.tsx:15`).

**`cli-python` (`onemem-cli` / `onemem_cli`, bin `onemem-py`) — IN-USE (CI), no internal package-dep edge**
- IN-USE reference: `.github/workflows/ci.yml:84`. uv workspace member; depends OUT on `onemem-sdk-python` (`cli-python/pyproject.toml:9,27`).
- `from onemem_cli import …` appears only in its own tests (`packages/cli-python/tests/test_{format,validate,commands}.py`). Note the dist name `onemem-cli` collides as a substring with: `tests/structure/registry-docs.test.ts:31` (asserts the package name), and unrelated temp-dir prefixes `onemem-cli-creds-` (`packages/cli-ts/tests/memory-config.test.ts:33`) and the hosted-dashboard default delegate label `"onemem-cli"` (`apps/hosted-dashboard/app/cli-login/page.tsx:44,158`) — none is an import or dep. README self-labels it "read-only mirror of the canonical TS `@onemem/cli`."

**`plugin-codex` (`@onemem/codex-plugin`) — SAFE-CANDIDATE as a consumed package (it is a leaf, but it CONSUMES others)**
- No package declares `@onemem/codex-plugin` as a dep; only its own `name` (`packages/plugin-codex/package.json:2`). It is the marketplace/published leaf plugin.
- Note (not unused): it itself depends on `@onemem/worker` (`package.json:33`, `workspace:*`) and devDeps `@onemem/sdk-ts`; its `.mcp.json` launches `@onemem/mcp@latest`; its script spawns `onemem-worker` (`plugin-codex/scripts/onemem-lib.mjs:168`). pnpm workspace member.

**`plugin-openclaw` (`@onemem/oc-onemem`, bin `oc-onemem`) — SAFE-CANDIDATE as a consumed package (leaf)**
- No package declares `@onemem/oc-onemem` as a dep; only its own `name` (`packages/plugin-openclaw/package.json:2`).
- The only non-doc, non-own-source reference is an **install-command string** in `packages/dashboard/lib/runtimes.ts:84` and `apps/hosted-dashboard/app/onboarding/page.tsx:16` (`"openclaw plugins install @onemem/oc-onemem && npx @onemem/oc-onemem init"`) — a string literal, not an import/dep. The `oc-onemem` bin/id occurrences are all inside its own package (`src/**`, `bin/init.mjs`, `openclaw.plugin.json`). Depends OUT on `@onemem/sdk-ts`; peer `openclaw`.

**`provider-vercel-ai` (`@onemem/vercel-ai-provider`) — SAFE-CANDIDATE (no dependency/code edge)**
- No package declares it as a dep; only its own `name` (`packages/provider-vercel-ai/package.json:2`).
- The dashboard reference is an **install string only**: `packages/dashboard/app/settings/SettingsView.tsx:11` → `["Vercel AI SDK", "npm i @onemem/vercel-ai-provider"]`. Confirmed NOT a module import (no `from/require "@onemem/vercel-ai-provider"` in dashboard). All other hits are docs + `scripts/check-release-preflight.py:73` + structure tests. Depends OUT on `@onemem/sdk-ts`; peers `ai`, `@ai-sdk/provider`.

**`services/nautilus-relayer` (Rust crate) — SAFE-CANDIDATE (zero inbound references)**
- Searched `nautilus-relayer`, `nautilus`, `relayer` repo-wide (excluding its own dir). Zero code/manifest references to the crate. It is NOT a pnpm or uv workspace member (`pnpm-workspace.yaml` and `pyproject.toml` do not include `services/*`). It is not named in any CI workflow.
- Every `relayer` hit is unrelated: the MemWal relayer concept (`relayer.memwal.ai`, the `relayerUrl`/`serverUrl` config field in `sdk-ts/src/credentials.ts`, `sdk-ts/src/memory.ts`, dashboard/hosted-dashboard creds, tests) or docs about the Pillar 12 stretch (`docs/05-our-architecture/09-stretch/nautilus-tee-relayer.md`, `MONOREPO_LAYOUT.md:255`, `TOOLING_DECISIONS.md:155` "Only used if Pillar 12 ships"). `Cargo.toml` `[dependencies]` is empty ("Skeleton only at v0.1").

### Confirmed IN-USE packages (for contrast — real inbound edges)
- `@onemem/sdk-ts` — `workspace:*`/`^0.6.3` dep in cli-ts, mcp-server, worker, plugin-claude-code, plugin-codex(dev), plugin-openclaw, provider-vercel-ai, provider-openai-agents, dashboard, all 4 demos.
- `@onemem/worker` — dep of plugin-claude-code (`package.json:35`) and plugin-codex (`package.json:33`), both `workspace:*`; spawned as `onemem-worker` bin (`plugin-claude-code/scripts/onemem-lib.mjs:144`, `plugin-codex/scripts/onemem-lib.mjs:168`).
- `@onemem/brand` — `workspace:*` dep of dashboard (`package.json:33`), landing (`package.json:16`), hosted-dashboard (`package.json:24`).
- `@onemem/dashboard` — `workspace:*` dep of hosted-dashboard (`package.json:25`); spawned as `onemem-dashboard` bin by cli-ts (`packages/cli-ts/src/commands/dashboard.ts:22`).
- `@onemem/mcp` — referenced by published name in both plugin `.mcp.json` files (`npx -y @onemem/mcp@latest`) and asserted in `tests/structure/plugin-claude-code.test.ts:52`. Not a `workspace:*` dep.
- `@onemem/cli` — leaf binary; no module imports it (confirmed: `from/require "@onemem/cli"` returns nothing). Only its own `name` + structure-test/docs references.
- `onemem-sdk-python` — `workspace = true` dep of cli-python, provider-crewai, provider-livekit, provider-elevenlabs (`pyproject.toml` in each).

## Inferences

- (Inference) "No internal dependents" is expected and not evidence of being unused for: leaf published plugins (`plugin-codex`, `plugin-openclaw`), framework providers (the whole point is downstream consumers install them, not other workspace packages), CLIs/apps, and demos. The brief's own tagging agrees.
- (Inference) The five Python "candidates" (`cli-python`, `plugin-hermes`, `provider-crewai/livekit/elevenlabs`) are best described as IN-USE-by-CI-and-workspace rather than fully orphaned: a pure package.json/pyproject *dependency* graph shows zero inbound edges, but `ci.yml:84` + uv-workspace membership + structure tests are live consumers. The TS leaves (`provider-openai-agents`, `provider-vercel-ai`, `plugin-codex`, `plugin-openclaw`) likewise have no dep edge but are referenced by structure tests, release-preflight, and (for some) dashboard install-strings.
- (Inference) `services/nautilus-relayer` is the only candidate with truly zero inbound references of any kind (no dep, no import, no CI, no workspace membership) — its sole couplings are prose in docs. Strongest "isolated" signal.

## Unknowns And Questions

- `tsconfig.base.json` has no `paths`/aliases, so there are no TS path-alias edges to any candidate (verified: file contains only compilerOptions, no `paths`). Confirmed not an alias source.
- `deploy-walrus-sites.yml` and `release.yml` were not opened line-by-line; the `--filter`/`@onemem/`/`onemem-`/`packages/`/`nautilus` grep across all of `.github/workflows/` returned only the `ci.yml:84` pytest line, so no other workflow names a candidate package — but I did not read those two YAMLs in full to confirm there is no indirect inclusion (e.g., a glob build of all workspaces).
- `scripts/check-release-preflight.py` names every publishable package (incl. all TS/Python candidates) for release verification; whether this script gates CI or is run manually was not traced.
- On-disk `dist/` artifact freshness per package was not inspected (excluded from grep).

Key files: `/Users/abu/dev/hackathon/sui-overflow/onemem/.github/workflows/ci.yml:84`, `/tests/structure/helpers.ts:25-45`, `/pyproject.toml` (uv members), `/packages/dashboard/lib/runtimes.ts:84`, `/packages/dashboard/app/settings/SettingsView.tsx:11`, `/apps/hosted-dashboard/app/onboarding/page.tsx:15-16`, `/services/nautilus-relayer/Cargo.toml`, `/tsconfig.base.json`, `/scripts/check-release-preflight.py`.