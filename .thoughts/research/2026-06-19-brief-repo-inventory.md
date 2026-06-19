I have all the evidence. Producing the reality brief.

## Scope

Full inventory of the OneMem monorepo at `/Users/abu/dev/hackathon/sui-overflow/onemem`: every workspace member under `packages/*`, `apps/*`, `demos/*`, `services/*`, plus the Move `contracts/onemem`. For each: name, purpose, key exports/bins, and internal dependents (from package.json deps + import grep). Candidate-unused packages flagged as evidence only. Each tagged A (claude-mem-shaped: plugins/worker/local dashboard), B (Mem0-shaped: sdk/mcp-server/framework adapters), or shared/infra. Reality only — no deletion decisions.

## Sources Checked

- `package.json` (root) — `pnpm-workspace.yaml` — `pyproject.toml` (root) — `turbo.json` not opened in depth
- Every `packages/*/package.json` and `packages/*/pyproject.toml` (dumped in full)
- Every `apps/*/package.json`, `demos/*/package.json`, `services/nautilus-relayer/Cargo.toml`, `contracts/onemem/Move.toml`
- Internal-reference grep across `packages apps demos services tests scripts config docs` for `@onemem/*`, `onemem-*` bins, `subprocess`/`npx onemem-trace`, worker URL/SSE, brand consumers, relayer refs (node_modules/dist/.next excluded)
- `.claude-plugin/marketplace.json`; `packages/plugin-claude-code/.mcp.json`; `packages/plugin-codex/.mcp.json`
- READMEs / CLAUDE.md heads where purpose needed (cli-python, dashboard CLAUDE.md via root context)

## Verified Facts

### Workspace declaration
- JS/TS workspaces: `packages/*`, `apps/*`, `demos/*` (`pnpm-workspace.yaml`). `onlyBuiltDependencies`: biome, lefthook, esbuild.
- Python workspace (`pyproject.toml` `[tool.uv.workspace].members`): `packages/sdk-python`, `cli-python`, `plugin-hermes`, `provider-crewai`, `provider-livekit`, `provider-elevenlabs`. Note: `services/*` and `contracts/*` are NOT pnpm workspace members; `services/nautilus-relayer` is Rust (Cargo), `contracts/onemem` is Move.
- Root has a pnpm override pinning `@mysten-incubation/oc-memwal>@mysten-incubation/memwal` to the root memwal version (`package.json:44`).

### packages/* — TypeScript

| Package (dir) | npm name | ver | Purpose (from package.json) | bins/exports | Internal dependents | Tag |
|---|---|---|---|---|---|---|
| `sdk-ts` | `@onemem/sdk-ts` | 0.6.3 | Verifiable memory + trace SDK (Sui/Walrus/Seal/MemWal) | exports `.` + `./runtime`; bins `onemem-trace`, `onemem-memory` (`package.json`) | Imported by **almost everything**: cli-ts, mcp-server, worker, plugin-claude-code, plugin-codex, plugin-openclaw, provider-vercel-ai, provider-openai-agents, dashboard, all 4 demos; Python providers shell out to its `onemem-trace`/`onemem-memory` bins | shared (core) |
| `worker` | `@onemem/worker` | 0.1.0 | 127.0.0.1 daemon writing each tool call to local SQLite + SSE to dashboard; async on-chain proof reconciliation (claude-mem parity) | bin `onemem-worker`; dep `@onemem/sdk-ts` | Declared dep of `plugin-claude-code` and `plugin-codex` (both `workspace:*`). Invoked at runtime as `onemem-worker` bin by plugin scripts (`plugin-claude-code/scripts/onemem-lib.mjs:144`, `plugin-codex/scripts/onemem-lib.mjs:168`). Dashboard talks to it over HTTP at `http://127.0.0.1:4041` (`dashboard/lib/local-worker.ts:31`) but does NOT declare it as a dep | A |
| `mcp-server` | `@onemem/mcp` | 0.6.3 | MCP server exposing memory+trace to MCP runtimes (Cursor, Codex, Windsurf, etc.); dep `@onemem/sdk-ts`, `@modelcontextprotocol/sdk` | bin `onemem-mcp` | Referenced by `plugin-claude-code/.mcp.json` and `plugin-codex/.mcp.json` as `npx -y @onemem/mcp@latest` (not a package.json dep — wired by published npm name). Structure test `tests/structure/plugin-claude-code.test.ts` references `@onemem/mcp` | B (also serves A plugins) |
| `cli-ts` | `@onemem/cli` | 0.6.3 | CLI: verify/inspect/provision memory+traces; dep `@onemem/sdk-ts` | bin `onemem` | No internal package imports it as a module (grep for `from "@onemem/cli"` empty). Spawns `onemem-dashboard` bin (`cli-ts/src/commands/dashboard.ts:22`). User-facing leaf | shared (also B) |
| `dashboard` | `@onemem/dashboard` | 0.1.4 | Next.js 15 standalone verifiable memory+trace viewer; serves localhost:4040 and hosted shell; deps `@onemem/brand`, `@onemem/sdk-ts` | bin `onemem-dashboard` | Consumed by `apps/hosted-dashboard` (`workspace:*` dep + `transpilePackages` in `next.config.mjs:31`). Spawned as `onemem-dashboard` bin by cli-ts | A |
| `brand` | `@onemem/brand` | 0.1.2 | Shared brand assets (logo, fonts, tokens, media kit) | exports tokens.css/logo/fonts/etc.; no main | Consumed by `dashboard`, `apps/landing`, `apps/hosted-dashboard` (all `workspace:*`) | shared/infra |
| `plugin-claude-code` | `@onemem/claude-code-plugin` | 0.1.1 | Claude Code plugin; SessionStart/PostToolUse/Stop hooks → on-chain traces; deps `@onemem/sdk-ts`, `@onemem/worker` | no bin; ships `.claude-plugin`, hooks, scripts, skills | Source of root marketplace plugin (`.claude-plugin/marketplace.json` → `source: ./packages/plugin-claude-code`). Leaf | A |
| `plugin-codex` | `@onemem/codex-plugin` | 0.1.2 | Codex plugin; bundles MCP tools + lifecycle hooks; dep `@onemem/worker` (sdk-ts is devDep) | ships `.codex-plugin`, hooks, scripts, skills | Leaf | A |
| `plugin-openclaw` | `@onemem/oc-onemem` | 0.2.5 | OpenClaw plugin adding on-chain traces atop oc-memwal; dep `@onemem/sdk-ts`; peer `openclaw` | bin `oc-onemem`; openclaw extension `./dist/index.js` | Referenced by string in `dashboard/lib/runtimes.ts:84` (install command), NOT a dashboard dep | A |
| `provider-vercel-ai` | `@onemem/vercel-ai-provider` | 0.1.4 | Vercel AI SDK provider wrapping any model into trace; dep `@onemem/sdk-ts`; peers `ai`, `@ai-sdk/provider` | ESM+CJS `.` export | Referenced by string in `dashboard/app/settings/SettingsView.tsx:11` (install command); grep showed `dashboard/app/settings/SettingsView.tsx -> @onemem/vercel-ai-provider` is the install-string, NOT a module import. Leaf | B |
| `provider-openai-agents` | `@onemem/openai-agents` | 0.1.5 | OpenAI Agents SDK provider → on-chain traces; dep `@onemem/sdk-ts`; peer `@openai/agents` | ESM+CJS `.` export | Referenced only by docs (`apps/docs/integrations/providers.mdx`) + structure test `docs-frameworks.test.ts`. No internal code dependents. Leaf | B |

### packages/* — Python

| Package (dir) | dist name | ver | Purpose | scripts/entry | Internal dependents | Tag |
|---|---|---|---|---|---|---|
| `sdk-python` | `onemem-sdk-python` (`onemem`) | 0.2.0 | Python SDK; v0.1 = read-only verifier (httpx+hashlib only); pysui re-added later | module `onemem` (SuiRpc, verify_session, fetch_trace_session, addresses_for) | uv-workspace source for `cli-python`, `provider-crewai`, `provider-livekit`, `provider-elevenlabs` (all `[tool.uv.sources] workspace = true` with `onemem-sdk-python>=0.2.0`). `cli-python` imports it (`main.py:14`) | shared (Python core, B) |
| `cli-python` | `onemem-cli` | 0.1.0 | "Read-only mirror of canonical TS `@onemem/cli` for Python-first environments" (README:1-4) | script `onemem-py`; dep `onemem-sdk-python`, `click` | None — leaf. README self-describes as a mirror/alternative of the TS CLI | shared (also B) |
| `plugin-hermes` | `hermes-onemem` | 0.2.0 | OneMem memory provider for Hermes; pure-stdlib, shells out to `onemem-trace` Node CLI; `dependencies = []` | script `hermes-onemem` (install:main); `provider.py` shells `npx -y -p @onemem/sdk-ts@latest onemem-trace` | None internal. Depends on TS `@onemem/sdk-ts` only via runtime npx shellout | B |
| `provider-crewai` | `onemem-crewai` | 0.1.1 | CrewAI provider; pure-stdlib, shells out to `onemem-trace`; dep `onemem-sdk-python>=0.2.0` | `tracer.py` shells `onemem-trace` | None internal; depends on sdk-python (workspace) + npx sdk-ts at runtime | B |
| `provider-livekit` | `onemem-livekit` | 0.1.1 | LiveKit Agents provider; pure-stdlib, shells `onemem-trace`; dep `onemem-sdk-python` | `tracer.py` shells `onemem-trace` | None internal | B |
| `provider-elevenlabs` | `onemem-elevenlabs` | 0.1.1 | ElevenLabs Conversational AI provider; pure-stdlib, shells `onemem-trace`; dep `onemem-sdk-python` | `tracer.py:44` shells `onemem-trace` | None internal | B |

### apps/*

| App | name | ver | Purpose | Internal dependents | Tag |
|---|---|---|---|---|---|
| `hosted-dashboard` | `@onemem/hosted-dashboard` | 0.0.4 (private) | app.onemem.xyz — Enoki-authenticated wrapper around `@onemem/dashboard` + public `/verify/[session_id]`; deps `@onemem/brand`, `@onemem/dashboard`, `@onemem/sdk-ts`, `@mysten-incubation/memwal`, `@mysten/enoki`, `@mysten/dapp-kit` | terminal app (no dependents) | A (hosted variant) / B (public verify) |
| `landing` | `@onemem/landing` | 0.0.2 (private) | Marketing landing page; dep `@onemem/brand` only | terminal | shared/infra |
| `docs` | (no package.json) | — | Mintlify-style docs (`docs.json`, `.mdx`, `quickstart.mdx`, `reference/`, `integrations/`); references many `@onemem/*` names in prose | not a workspace member (no package.json); referenced by structure tests `registry-docs.test.ts`, `docs-frameworks.test.ts` | shared/infra |

### demos/* (pnpm workspace members; all `private`, all dep `@onemem/sdk-ts` workspace:*)
- `agent-sends-money` (`@onemem/demo-agent-sends-money` 0.1.2) — mocked agent payment → real testnet trace; `demo:trace` runs `src/mock-payment-trace.ts`
- `multi-agent-coordination` (`@onemem/demo-multi-agent-coordination` 0.1.2) — cross-linked traces
- `switch-laptops` (`@onemem/demo-switch-laptops` 0.1.2) — laptop/runtime handoff, two traces one namespace
- `verifiable-research-agent` (`@onemem/demo-verifiable-research-agent` 0.1.2) — multi-day research agent traces
- All four: terminal members, no internal dependents. Tag: shared (demo harness; lean B-shaped). Root script `test:demo-matrix` filters `./demos/*`.

### services/ and contracts/
- `services/nautilus-relayer` (`Cargo.toml`): Rust, `version 0.1.0`, description "OneMem Nautilus TEE relayer (Pillar 12 stretch)". `[dependencies]` empty — "Filled in if/when Pillar 12 ships. Skeleton only at v0.1." Bin `nautilus-relayer` → `src/main.rs`. NOT a pnpm/uv workspace member. No code references it; only conceptual mentions of "relayer/TEE" in sdk-python comments. Tag: infra (stub).
- `contracts/onemem` (`Move.toml`): Move package `onemem` 0.1.0, addr `0x0`. Has `build/`, `sources/`, `tests/`, `examples/`, `Published.toml`. Consumed by `sdk-ts` generated addresses (`scripts/codegen-move-types.ts -> @onemem/sdk-ts`, `sdk-ts/src/generated/addresses.ts`). Tag: shared/infra (on-chain core).

### Internal dependency edges (verified)
- `@onemem/sdk-ts` ← cli-ts, mcp-server, worker, plugin-claude-code, plugin-codex(dev), plugin-openclaw, provider-vercel-ai, provider-openai-agents, dashboard, all 4 demos (package.json deps + `src` imports).
- `@onemem/worker` ← plugin-claude-code (dep), plugin-codex (dep). Runtime-spawned as `onemem-worker` bin.
- `@onemem/brand` ← dashboard, landing, hosted-dashboard.
- `@onemem/dashboard` ← hosted-dashboard (dep + transpilePackages); spawned as `onemem-dashboard` bin by cli-ts.
- `@onemem/mcp` ← plugin-claude-code/.mcp.json + plugin-codex/.mcp.json (via published npm name `@onemem/mcp@latest`, not workspace dep).
- `onemem-sdk-python` ← cli-python, provider-crewai, provider-livekit, provider-elevenlabs (uv workspace).
- Python providers + plugin-hermes ← `@onemem/sdk-ts` via runtime `npx … onemem-trace` shellout (`_DEFAULT_TRACE_CMD`); sdk-python/memory.py shells `onemem-memory`.

### Candidate-unused (NO internal package dependents AND not referenced as a workspace dep / bin / manifest by any other workspace member) — evidence only
Confirmed leaves with **zero** inbound internal edges of any kind:
- `provider-openai-agents` — only inbound refs are docs prose + `tests/structure/docs-frameworks.test.ts`. No code imports it. (B)
- `provider-crewai`, `provider-livekit`, `provider-elevenlabs` — no internal dependents; each depends OUT on sdk-python + sdk-ts(npx). (B)
- `plugin-hermes` — no internal dependents; `dependencies = []`. (B)
- `cli-python` — no internal dependents; README labels it a "read-only mirror of the canonical TS `@onemem/cli`". (B)
- `plugin-codex` — no internal dependents (leaf published plugin). (A)
- `plugin-openclaw` — only an install-command string in `dashboard/lib/runtimes.ts:84`; no code/dep edge. (A)
- `provider-vercel-ai` — only an install-command string in `dashboard/app/settings/SettingsView.tsx:11`; no code/dep edge (despite appearing in import grep, it is NOT a real import and NOT in dashboard deps). (B)
- All 4 `demos/*` — no internal dependents (expected for demos). (shared)
- `apps/landing`, `apps/hosted-dashboard`, `apps/docs` — terminal apps, no dependents (expected for apps). (shared/A)
- `services/nautilus-relayer` — empty-dependency Rust stub, zero references, "Pillar 12 stretch / skeleton only." (infra)

Strongest "candidate-unused" signals (leaf + self-described as alternative/superseded/stub): **`cli-python`** (README: "mirror of the canonical TS `@onemem/cli`"), **`services/nautilus-relayer`** (explicit "skeleton only" / "stretch"), and **`provider-openai-agents`** (no code dependents, docs-only).

### SDK-like / potentially duplicated or superseded pairs (evidence)
- `@onemem/sdk-ts` (TS, full Sui/Walrus/Seal/MemWal write+read) vs `onemem-sdk-python` (Python, README: "v0.1 is the read-only verifier"). Two SDKs, explicitly different fidelity (Python is read-only-verifier subset).
- `@onemem/cli` (TS, full provision/verify) vs `onemem-cli` (Python, README: "read-only mirror of the canonical TS `@onemem/cli`"). Two CLIs; Python framed as a subset mirror.
- All four Python framework providers (crewai/livekit/elevenlabs + hermes) share the identical pattern: pure-stdlib tracer that shells out to the TS `onemem-trace` bin (`_DEFAULT_TRACE_CMD = "npx -y -p @onemem/sdk-ts@latest onemem-trace"`). They are siblings, not duplicates of each other, but all are thin wrappers over the same TS bridge.
- `@onemem/dashboard` (the Next.js package) vs `apps/hosted-dashboard` (Enoki wrapper that transpiles + re-serves `@onemem/dashboard`). Not duplicated — the app wraps the package.

## Inferences

- (Inference) `@onemem/mcp` and `@onemem/oc-onemem`/`@onemem/vercel-ai-provider` show "no workspace-dep edge" because the consuming surfaces reference them by published npm name / install string rather than `workspace:*`. They are not truly unused — they are runtime/published-name coupled — but a pure package.json-dep graph would mark them as having no internal dependents. Flagging the distinction, not a deletion verdict.
- (Inference) `@onemem/cli` and `@onemem/dashboard` are end-user leaf binaries (verified: no module imports them), so absence of internal dependents is expected for a CLI/app, not evidence of being unused.
- (Inference) Product tagging A vs B is read off package.json descriptions + wiring; some packages legitimately straddle both (e.g., `mcp-server` is the B-shaped memory surface but is wired into the A-shaped plugins; `hosted-dashboard` serves both the A local-dashboard shell and the B public verify page).

## Unknowns And Questions

- `turbo.json` pipeline contents not read in this pass — whether any package is excluded/included from build/test there is unverified.
- Whether `contracts/onemem` and `services/nautilus-relayer` are intentionally outside the pnpm/uv workspaces (they have no package.json/pyproject) or simply not wired — confirmed they are NOT members; intent unverified.
- `apps/docs` has no package.json — unverified whether it is built/deployed by any tooling beyond the structure tests that lint its `.mdx` references.
- Actual on-disk `dist/` build state per Python package (each has a `dist/` dir) — not inspected; cannot confirm whether published artifacts match current source.
- Worker port mismatch surface: dashboard expects worker at `:4041` (`local-worker.ts:31`) while the worker package description mentions the dashboard at `:4040`; whether `:4747`-type defaults exist elsewhere is unverified (only `:4041` and `:4040` observed).

Key files: `/Users/abu/dev/hackathon/sui-overflow/onemem/package.json`, `/pnpm-workspace.yaml`, `/pyproject.toml`, `/.claude-plugin/marketplace.json`, `packages/plugin-claude-code/.mcp.json`, `packages/dashboard/lib/local-worker.ts:31`, `packages/dashboard/lib/runtimes.ts:84`, `packages/dashboard/app/settings/SettingsView.tsx:11`, `packages/sdk-python/onemem/memory.py:26`, `packages/provider-*/onemem_*/tracer.py` (`_DEFAULT_TRACE_CMD`), `packages/cli-python/README.md:1-4`, `services/nautilus-relayer/Cargo.toml`, `contracts/onemem/Move.toml`.