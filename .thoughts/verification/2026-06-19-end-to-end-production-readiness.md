# Verification Audit: End-to-End Production Readiness

Date: 2026-06-19

## Verdict

Fail for full production readiness only on remaining manual hosted/deployment
boundaries.

Repo-local builds, tests, deployed landing/hosted dashboard/docs checks, Enoki
readiness, local dashboard packaged-server checks, Mintlify docs-source
validation, MCP trace verification, testnet CLI verification, and registry
publication are green. The blocking npm CLI install issue found during this
audit is resolved:

```bash
npm exec --yes --package @onemem/cli@0.6.3 -- onemem --version
```

That command prints `0.6.3`. `pnpm registry:status --strict` reports all npm and
PyPI packages current, and `pnpm release:preflight --strict --timeout 30`
reports all registry versions current with shipped artifact markers present.
The previously open trusted Codex/Claude hook-session blocker is now closed by
`.thoughts/verification/2026-06-19-trusted-runtime-hook-proof.md`. Remaining
full-readiness gaps are fresh wallet-popup mutation digests, docs deployment
automation/native Mintlify integration, public marketplace push parity for the
latest plugin fixes, and CI-side publishing secrets/trusted publishing.

## Artifacts Checked

- Goal objective:
  `/Users/abu/.codex/attachments/d19f6f36-59fb-447f-b74a-93c07ffd0d4b/goal-objective.md`
- Repo instructions: `../AGENTS.md`, `AGENTS.md`
- Context Engineering status: `.thoughts/wiki/context-engineering-status.md`
- Project map and quality profile:
  `.thoughts/wiki/project-map.md`,
  `.thoughts/quality/2026-06-17-project-quality-profile.md`
- Package/workspace manifests: `package.json`, `pnpm-workspace.yaml`,
  `turbo.json`, `.changeset/config.json`
- Deployed production domains:
  `https://onemem.xyz`, `https://app.onemem.xyz`, `https://docs.onemem.xyz`
- Local dashboard packaged launcher:
  `packages/dashboard/bin/onemem-dashboard`
- Release scripts:
  `scripts/check-registry-status.py`, `scripts/check-release-preflight.py`,
  `scripts/publish-all.sh`
- Mintlify docs source:
  `apps/docs/docs.json`, `apps/docs/*.mdx`, `apps/docs/favicon.svg`

## Requirement Traceability

| Requirement | Evidence |
| --- | --- |
| Landing production is reachable | `https://onemem.xyz` returns HTTP 200. Chrome rendered the page with no visible app error, no console errors for the page, no localhost/vercel-preview link leaks, and no old "Replay any run purely from chain + Walrus" copy. |
| Hosted production is reachable | `https://app.onemem.xyz` returns HTTP 200. Hosted production smoke passed 48 checks against `ONEMEM_HOSTED_SMOKE_BASE_URL=https://app.onemem.xyz`. |
| Hosted CLI login is not blank | Chrome rendered `https://app.onemem.xyz/cli-login?nonce=chrome-prod-proof-2&port=12345` with "Pair your terminal", connected wallet state, MemWal account state, and an enabled "Approve & mint delegate key" button; no console errors. |
| Enoki Google readiness is configured | `pnpm --filter @onemem/hosted-dashboard run enoki:readiness --strict --json --deployed-status-url https://app.onemem.xyz/api/enoki/status` returned `ok: true`, `signInReady: true`, Google provider present, allowed origins including `https://onemem.xyz` and `https://app.onemem.xyz`, and deployed `ready: true`. |
| Docs domain is honest | `https://docs.onemem.xyz` is live via the Vercel `onemem-docs` project using a Mintlify static export. Deployment `dpl_F4iKnanzYDEq968cbtq1Z3hHNwLb` is aliased to `docs.onemem.xyz`; `/`, `/quickstart`, `/reference/cli`, and `/integrations/runtimes` return HTTP 200. |
| Docs source validates | `mise exec -- npx mintlify@latest validate` under repo-pinned Node 20.18.0 returned `success build validation passed`. The first Node 26 attempt failed because Mintlify does not support Node 25+. A missing `apps/docs/favicon.svg` warning was fixed by adding the docs favicon and a structure-test guard. |
| Local dashboard packaged server works | `pnpm --filter @onemem/dashboard build` passed. `PORT=4061 pnpm --filter @onemem/dashboard start` launched the standalone server. Chrome verified `/`, `/apps`, `/memories`, `/sessions`, `/share`, `/settings`, and `/trace/0x6cea...c080` visible content with no visible app error and no console errors. |
| Local dashboard API routes work | Against the packaged server, `/api/overview`, `/api/memories`, `/api/runtimes`, `/api/sessions/0x6cea...c080`, and `/api/trace/0x6cea...c080/export` returned HTTP 200 and expected JSON shapes. |
| Local CLI build/bin works | `pnpm --filter @onemem/cli build` passed and `node packages/cli-ts/bin/onemem --help` printed the command surface. |
| Python CLI verifies real on-chain traces | `uv run onemem-py --json --network testnet verify 0x08f4ef5b53c768eb446a18659ecc0775ac1a58763890ae51d6658c301a3f33e8` returned `ok: true`, `callCount: 3`, and matching Merkle/count roots after the original-package event-query fix. |
| MCP baseline and memory tools work | With repo `.env` loaded, `ONEMEM_INTEGRATION=1 pnpm --filter @onemem/mcp test` passed live stdio MCP tests against testnet. The server started with `memory ON`, tool listing included `onemem_add_memory`, `onemem_search_memory`, `onemem_verify_trace`, and `onemem_revoke_namespace_capability`, trace verification returned `ok: true` with `callCount: 3`, `add_memory` returned a Walrus blob id, and `search_memory` found the stored "deploy target is Sui testnet" fact. |
| Trusted Codex hooks emit on-chain trace | Interactive Codex hook trust on 2026-06-19 emitted testnet TraceSession `0x0c88317632dcd386b6f81b94ee510003ba107d3c4bfa035ba8072fca8304e330`; CLI and MCP verification returned `ok: true`, `callCount: 1`, and matching Merkle roots. |
| Trusted Claude Code hooks emit on-chain trace | Live Claude Code run with `--include-hook-events` emitted testnet TraceSession `0x9c88993b6197a8460f4fbd4a886c6353505d36383bf35035e5305088b64825e7`; CLI and MCP verification returned `ok: true`, `callCount: 1`, and matching Merkle roots. |
| Plugin packages remain testable | `pnpm test` passed Codex plugin tests, Claude Code plugin tests, OpenClaw tests, hosted/dashboard tests, provider tests, and demo tests. |
| Published npm CLI install path works | `npm exec --yes --package @onemem/cli@0.6.3 -- onemem --version` prints `0.6.3`. A temporary public install of `@onemem/sdk-ts@0.6.3` contains the dynamic trace chunk used by the hook proof path. |
| Release preflight proves registry/artifact parity | `pnpm registry:status --strict` reports every npm and PyPI package current. `pnpm release:preflight --strict --timeout 30` exits 0, reports all npm/PyPI packages current, and confirms all checked published artifacts contain required markers. |

## Quality Gates

Passed:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:structure
pnpm test:demo-matrix
pnpm --filter @onemem/cli test
pnpm --filter @onemem/cli typecheck
pnpm --filter @onemem/cli build
pnpm --filter @onemem/claude-code-plugin test
pnpm --filter @onemem/oc-onemem test
pnpm --filter @onemem/mcp test
set -a; source .env; set +a; ONEMEM_INTEGRATION=1 pnpm --filter @onemem/mcp test
pnpm --filter @onemem/dashboard build
pnpm --filter @onemem/hosted-dashboard build
ONEMEM_HOSTED_SMOKE_BASE_URL=https://app.onemem.xyz pnpm --filter @onemem/hosted-dashboard browser:smoke
pnpm --filter @onemem/hosted-dashboard run enoki:readiness --strict --json --deployed-status-url https://app.onemem.xyz/api/enoki/status
pnpm --filter @onemem/landing build
mise exec -- npx mintlify@latest validate
uv run pytest packages/cli-python -q
uv run ruff check .
uv run pyright
uv run python -m py_compile scripts/check-release-preflight.py
uv run python -m py_compile scripts/check-registry-status.py scripts/check-release-preflight.py
uv run ruff check scripts/check-registry-status.py scripts/check-release-preflight.py
pnpm registry:status --strict
git diff --check
```

Now passes after the npm publication fix:

```bash
pnpm release:preflight --strict --timeout 30
```

The command reports all npm/PyPI packages current and all checked artifact
markers present.

Notable counts:

- Full `pnpm test`: 16 successful package tasks.
- Structure tests: 454 passed.
- Hosted production browser smoke: 48 checks passed.
- Python CLI tests: 21 passed.
- MCP live integration: 2 passed, including MemWal add/search round-trip.

## Deviations From Plan

- The older registry status check said all versions were current, but live
  installed CLI execution proved that version parity was insufficient. The
  release preflight now inspects the SDK tarball for the runtime export marker.
- The docs domain was fixed through a Vercel-hosted Mintlify static export
  because native Mintlify CLI account auth is unavailable in this shell. This is
  a real hosted docs site, but not a native Mintlify dashboard/Git deployment.
  The docs source itself validates through Mintlify under the repo-pinned Node
  20 runtime.
- `pnpm --filter @onemem/cli exec onemem --help` still fails because pnpm does
  not expose the package's own bin that way. Direct source/built bin works; the
  real published `npm exec --yes --package @onemem/cli@0.6.3 -- onemem
  --version` path works.

## Gaps And Risks

- Follow-up for docs operations: automate the current static export plus Vercel
  deploy/alias path, or connect native Mintlify dashboard/Git deployment. Until
  then, docs source changes need an explicit static export redeploy.
- Fresh trusted Codex `/hooks` and Claude Code hook sessions emitting real
  on-chain traces are now claimed with 2026-06-19 testnet evidence. The remaining
  distribution follow-up is to commit/push the patched public marketplace files
  and repeat from a fresh public install.
- Fresh wallet-popup mutations are not newly claimed without transaction
  digests. Chrome saw an existing OneMem Slush testnet namespace-create request,
  but the Chrome automation policy blocks `chrome-extension://` transaction page
  control. The Slush tab was left open as a manual handoff; no new digest is
  claimed from automation.
- MCP memory write/search is proven through the live stdio integration with
  MemWal env loaded. Trusted Codex and Claude Code hook sessions are now proven
  separately in the 2026-06-19 hook-proof audit.

## Evidence Log

- 2026-06-19: Read the active goal objective and verified the audit scope.
- 2026-06-19: Reconnected Chrome and verified deployed landing/hosted UI and
  local packaged dashboard UI.
- 2026-06-19: Verified hosted production `/cli-login` hydration after the
  fallback fix; the page reaches ready-to-mint state instead of blank render.
- 2026-06-19: Ran strict Enoki readiness against local metadata and deployed
  `/api/enoki/status`; result `ok: true`.
- 2026-06-19: Built and launched local dashboard standalone on port 4061,
  verified UI/API routes, then stopped the server.
- 2026-06-19: Verified Python CLI testnet trace verification after fixing event
  queries to use the original package ID.
- 2026-06-19: Found the original published npm CLI startup failure via
  `npm exec --yes --package @onemem/cli@0.1.0 -- onemem --version`.
- 2026-06-19: Confirmed the old published SDK tarball lacked
  `resolveMemoryConfigFromSources` in the runtime entrypoint, then added a
  release-preflight SDK runtime marker so this artifact drift is caught.
- 2026-06-19: Persisted npm/PyPI publishing tokens into gitignored local
  `.env`, `.npmrc`, and `.pypirc` with `0600` permissions. `.gitignore` now
  ignores `.npmrc` and `.pypirc`; release preflight and `publish-all.sh` load
  gitignored `.env` locally without overriding shell/CI env.
- 2026-06-19: Hardened registry/preflight HTTP fetches with bounded retries
  after transient PyPI timeouts created false "needs publication" rows.
- 2026-06-19: Published the npm drift line through `pnpm changeset publish`.
  Final current npm versions are `@onemem/sdk-ts@0.6.3`, `@onemem/cli@0.6.3`,
  `@onemem/mcp@0.6.3`, `@onemem/codex-plugin@0.1.2`,
  `@onemem/claude-code-plugin@0.1.1`,
  `@onemem/dashboard@0.1.4`, `@onemem/oc-onemem@0.2.5`,
  `@onemem/openai-agents@0.1.5`, and `@onemem/vercel-ai-provider@0.1.4`.
- 2026-06-19: Fixed CLI/SDK/MCP runtime version reporting to read installed
  package manifests. Public install proof: `npm exec --yes --package
  @onemem/cli@0.6.3 -- onemem --version` prints `0.6.3`; a temporary public
  install of `@onemem/sdk-ts@0.6.3` includes the dynamic trace chunk required by
  the published hook flush path.
- 2026-06-19: Final registry proof: `pnpm registry:status --strict` reports all
  npm/PyPI packages current, and `pnpm release:preflight --strict --timeout 30`
  exits 0 with all checked artifact markers present.
- 2026-06-19: Reran full repo gates, hosted production smoke, MCP live baseline,
  Python checks, and diff whitespace checks.
- 2026-06-19: Used current Mintlify CLI docs/source behavior to validate
  `apps/docs`; direct shell Node 26 failed with Mintlify's Node 25+ unsupported
  error, while `mise exec -- npx mintlify@latest validate` under Node 20.18.0
  passed.
- 2026-06-19: Fixed the Mintlify favicon warning by adding
  `apps/docs/favicon.svg` and a structure-test assertion that the configured
  favicon exists.
- 2026-06-19: Added `tests/structure/docs-site.test.ts` to verify docs
  canonical URL, navigation targets, favicon, and published CLI install-proof
  copy.
- 2026-06-19: Regenerated brand launch-audio provenance and aligned the designer
  campaign export manifest to the current WAV/MP4 hashes after structure tests
  caught stale media hashes.
- 2026-06-19: Reran `pnpm lint` and caught formatter drift in generated brand
  JSON plus two structure tests. Ran Biome formatting, then found
  `packages/brand/designer-campaign/manifest.json` still recorded the
  pre-format `audio-provenance.generated.json` hash. Updated that entry to
  size `4225` and SHA-256
  `bd7830963d617dfdb9275f45676b2652021200c601d795b08728a7b14c05acbe`; current
  launch audio remains SHA-256
  `b96b59dcb0153a383ff6ddc3ae729c687e4fb9efb816dcc4f719f1718ef58574`.
  Strengthened `tests/structure/brand-designer-campaign.test.ts` so every
  designer-campaign manifest file now has its size and SHA-256 recomputed from
  disk.
- 2026-06-19: Exported `apps/docs` with `npx mintlify@latest export`, created
  the Vercel `onemem-docs` project, deployed static export
  `dpl_BUr1DSvGZHRJKLS1DBAS4ReUfTAu`, aliased it to `docs.onemem.xyz`, disabled
  Vercel SSO protection for that project, and verified public HTTP 200 for `/`,
  `/quickstart`, `/reference/cli`, and `/integrations/runtimes`.
- 2026-06-19: After registry/docs copy was updated, re-exported `apps/docs`,
  deployed Vercel static export `dpl_F4iKnanzYDEq968cbtq1Z3hHNwLb`, reassigned
  `docs.onemem.xyz`, verified `/`, `/quickstart`, `/reference/cli`, and
  `/integrations/runtimes` return HTTP 200, and confirmed live Quickstart/CLI
  pages contain the `@onemem/cli@0.6.3`, `@onemem/dashboard@0.1.4`, and
  `onemem-cli@0.1.0` release text.
- 2026-06-19: A focused structure rerun caught a stale docs guard still
  expecting `apps/docs/README.md` to call the hosted docs domain planned. The
  guard now requires the live Vercel static-export proof, deployment ID, route
  proof, and native-Mintlify caveat.
- 2026-06-19: Loaded repo `.env` without printing secret values and reran the
  MCP live integration. The MCP server reported `memory ON`, `onemem_add_memory`
  returned a Walrus blob id, and `onemem_search_memory` found the stored fact
  over the real stdio MCP protocol.
- 2026-06-19: Connected through the Chrome plugin for wallet proof and found an
  existing Slush popup for a OneMem testnet namespace-create request. Direct
  extension-page automation is blocked by Browser Use URL policy, so the tab was
  finalized as a handoff and no transaction digest was claimed.
- 2026-06-19: Latest focused gates: `pnpm test:structure` 454/454,
  `pnpm lint` pass, `pnpm registry:status --strict` pass,
  `pnpm release:preflight --strict --timeout 30` pass,
  `git diff --check` pass, Mintlify validate pass, no listeners on ports
  3000/4040/4041/4044/4061.
- 2026-06-19: Trusted Codex and Claude Code hook proof completed. Codex emitted
  `0x0c88317632dcd386b6f81b94ee510003ba107d3c4bfa035ba8072fca`; Claude Code
  emitted
  `0x9c88993b6197a8460f4fbd4a886c6353505d36383bf35035e5305088b64825e7`. Both
  verify `ok: true`, `callCount: 1`, and matching Merkle roots through CLI and
  MCP.
