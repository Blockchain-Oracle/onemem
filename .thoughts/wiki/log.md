# OneMem Wiki Log

## 2026-06-17

- Created Context Engineering folder layout under `.thoughts`.
- Registered `/Users/abu/Downloads/One Mem 2` as raw prototype evidence.
- Added project quality profile.
- Added prototype discovery report.
- Added Context Engineering setup plan.
- Added wiki index and project map.
- Replaced stale repo `AGENTS.md` with a concise Codex router.
- Added Context Engineering status page and docs alignment cleanup plan.
- Began instruction-layer alignment: routed root instructions to the thought
  space, corrected dead links in package `CLAUDE.md` files, and marked the old
  coding-agent setup document as historical.
- Completed first docs/rules alignment cleanup: root `CLAUDE.md` shim,
  structure-test AGENTS enforcement, historical banners on architecture docs,
  corrected MCP/CLI/SDK docs, public docs snippets, dashboard/onboarding snippets,
  demo links, and GitHub metadata.
- Added docs/instruction audit and verification artifacts.
- Moved Context Engineering artifacts from the incorrect external project path
  into repo-local `.thoughts/`; updated repo references and plugin defaults to
  prefer `<project-root>/.thoughts/`.
- Updated the Abu Context Engineering plugin source and installed cache to
  `0.4.1`; removed legacy external storage instructions from all plugin skills
  and the operating model.
- Researched, specified, planned, implemented, and verified the first accepted
  prototype delta: dashboard Unified Sessions. `/sessions` now groups recent
  on-chain `TraceSession` events by day/runtime, renders runtime lanes and
  canonical sub-session links, and exposes a real server-side verify-all action
  for explicit session IDs.
- Implemented the next accepted prototype delta: Memory Provenance. `/memories`
  now exposes richer on-chain `memwal_write` provenance, real metadata filters,
  runtime/session/namespace context, Sui receipt fields, and explicit proof
  boundary copy without adding fake memory mutation actions.
- Implemented Share Capability Readiness. The TS CLI now exposes real
  `namespace share` and read-only `namespace capabilities` commands; fresh
  provisioning surfaces `adminCapId`; `/share` renders public verification,
  signer/Admin-cap share guidance, real namespace/capability state when
  configured, and an explicit v0.1 revoke boundary.
- Implemented Holder Self-Revoke. The SDK can derive a capability kind from its
  object type and build `namespace::revoke_capability<KIND>`; the TS CLI exposes
  `namespace revoke <cap-id>` with an Admin-cap safety override; `/share` points
  holders to the real command without adding fake owner-driven revoke UI.
- Ran live disposable testnet share/revoke proof. The smoke created namespace
  `0x362495a8baba1cc166c3a898d9069200b95aff7855fdb7eaad9a191d8bc254fd`,
  minted ReadOnly cap
  `0xcf95dbe4d5387b349f53189997f2bf25ed4cc9b4472b1f8e1cf53d41924ef90b`,
  observed capability count `2 -> 3`, revoked it with digest
  `VxQsgGzoPGBjT5Eqr5ZVzCeL4N5QWkG4RQhMSgyMWaT`, observed `3 -> 2`, and
  deactivated the temporary namespace.
- Implemented Memory Origin Verification. `/memories` now lets a user verify a
  selected memory's originating `TraceSession` from the drawer through the
  existing verifier; focused dashboard gates passed and a Chrome plugin browser
  proof returned `Trace verified 0x6ceaab...c080 - 1 calls - Completed`.
- Implemented CLI Credentials Fallback. `onemem login` credentials now feed the
  shared SDK runtime memory resolver, TS CLI memory commands, MCP memory tools,
  and dashboard `/settings` status. Focused SDK/CLI/MCP/dashboard gates passed;
  Chrome plugin proof confirmed configured status with disposable credentials
  and no rendered private key or embedding key. A live built-CLI testnet smoke
  added memory `d4119bfa-15fe-4d5c-be2a-dbc082f675eb` and retrieved it as the
  top search result.
- Implemented Codex Memory Plugin. `packages/plugin-codex` now ships a Codex
  plugin manifest, validator-compatible `.mcp.json` using `mcpServers`,
  repo-local marketplace manifest, OneMem Codex skill, and optional trusted
  hooks for `SessionStart`, `PostToolUse`, and `Stop`. Focused package
  tests/lint, the local Codex plugin validator, and a temporary `CODEX_HOME`
  marketplace add/list/install proof passed; live Codex `/hooks` trust/session
  proof remains the honest follow-up before claiming Claude Code parity.
- Implemented Runtime Controls. `@onemem/sdk-ts/runtime` now persists
  `~/.onemem/runtime-controls.json`, `createTraceRecorder()` and
  `onemem-trace` skip before signer/network setup when policy disables tracing,
  bridge-based Python providers clear buffers on structured policy skips, and
  dashboard `/apps` exposes real pause/trace controls through
  `/api/runtimes`. Chrome plugin proof confirmed Codex trace-toggle and pause
  PATCH roundtrips against a temporary policy file.
- Implemented Runtime-Control Plugin Adoption. OpenClaw, Claude Code, and Codex
  hook-specific trace paths now call runtime policy before buffering, opening
  sessions, or flushing content; Claude hooks gained isolated state helpers and
  preserve buffers on client setup failure. Dashboard runtime metadata now marks
  all current first-party runtime capture paths as enforced.
- Implemented Grouped Session Replay Export. `/sessions` group cards now expose
  Replay/export, which opens a grouped metadata replay and downloads/copies
  proof-scoped JSON from `POST /api/sessions/export`. The export stays honest:
  dashboard-derived group only, existing TraceSession IDs only, no plaintext, no
  server-side Seal decrypt, and no new protocol object.
- Implemented Dashboard Browser Regression. `@onemem/dashboard` now has
  `browser:smoke`, backed by `playwright-core`, which starts a temporary local
  dashboard server, launches local Chrome/Chromium, verifies `/sessions`
  Replay/export through the grouped export modal, fails on console/resource
  errors, and leaves generated screenshots under ignored `.browser-smoke/`.
- Implemented Docs Status Inventory. Current entry docs no longer route agents
  to missing parent research files, the root package count matches the actual
  `packages/` tree, framework-provider docs now describe shipped trace-only
  providers vs deferred memory work, and structure tests guard the boundary.
- Implemented Hosted Share Capability Creation. Hosted `/share` now belongs to
  `apps/hosted-dashboard`, uses dApp Kit signing plus server-owned Enoki
  sponsorship to mint ReadOnly/ReadWrite namespace capabilities to recipient
  addresses, and returns only capability IDs parsed from Sui transaction object
  changes. Automated proof is unit + hosted browser smoke; live wallet popup
  execution remains the manual/live proof boundary.
- Implemented Recipient Share Landing. Hosted `/share/[capability_id]` now
  reads a Sui `NamespaceCapability`, shows owner/kind/namespace metadata,
  compares a connected wallet against the object owner, and states that v0.1
  has no separate hosted claim transaction.
- Implemented Event-backed Share History. The SDK now reads minted/revoked
  namespace capability events, hosted `/share` exposes
  `GET /api/share/history`, and the owner view refreshes read-only capability
  history after sponsored mints without adding a hosted share database.
- Implemented Dashboard Status Refresh. The dashboard architecture README now
  reports the built local/hosted routes accurately, keeps Walrus Sites mirror
  deploy evidence pending, and structure tests guard known built route rows
  from drifting back to stale pending status.
- Implemented CLI Command Surface Refresh. The CLI architecture README now
  reports TS and Python CLI status accurately, the load-bearing command-surface
  file now lists only the current v0.1 commands, package/public CLI references
  include implemented namespace commands and `local` network support, and
  structure tests guard deferred commands from returning as current command
  headings.
- Implemented CLI Historical Docs Boundary. The older CLI implementation/output
  sketches now carry historical notes, README read-order points current command
  truth at `command-surface.md` and package code, and `login-flow.md` describes
  OS-assigned callback ports without advertising a current logout command.
- Implemented Plugin Marketplace Publication Readiness. Codex marketplace
  selector is now `onemem-codex@onemem`, Claude Code has a root
  `.claude-plugin/marketplace.json`, Claude plugin context moved into a shipped
  skill, active docs/dashboard install commands now use the public repository
  marketplace path, strict Claude validation and temporary Codex/Claude install
  proofs pass, and npm publish dry-runs are clean. Actual npm upload is blocked
  by missing npm auth in this shell.
- Implemented Recipient Capability Self-Revoke. Hosted recipient capability
  pages now show the holder self-revoke CLI command, include the Admin-cap
  `--allow-admin` safety flag when relevant, and keep the no-claim/no
  owner-driven-revoke contract boundary explicit.
- Implemented Single Trace Replay Export. Dashboard trace pages now have a
  proof-scoped `GET /api/trace/[session_id]/export` export and Replay session
  modal actions for Download JSON / Copy JSON. The export contains on-chain
  TraceSession proof metadata only; browser smoke and a Chrome plugin pass
  verified the live testnet trace modal and no-plaintext boundary.
- Implemented TS Provider Memory Alignment. The Vercel AI and OpenAI Agents
  provider docs now document the shipped explicit `createOneMemMemory(...)`
  helper instead of calling TS memory recall/capture deferred, while still
  keeping automatic extraction and Python provider memory support out of scope.
  Vercel AI provider tests now cover recall injection and capture passthrough.
- Implemented TS Package Export Condition Order. The SDK and TS provider
  package manifests now list `types` before `import`/`require` in conditional
  exports, removing the previous tsup/esbuild `condition "types"` warning from
  focused package builds. Structure tests now guard that package metadata rule.
- Implemented Package License Inclusion. All ten publishable JavaScript
  `@onemem/*` packages now contain package-local Apache-2.0 `LICENSE` files
  matching their manifest `files` allowlists. A dry-pack loop confirmed
  `LICENSE=true` for every targeted npm tarball, and structure tests now guard
  package-local license presence.
- Implemented Python Package License Inclusion. All six publishable Python
  packages now contain package-local Apache-2.0 `LICENSE` files. Rebuilt wheels
  include `*.dist-info/licenses/LICENSE`, rebuilt sdists include top-level
  `LICENSE`, and structure tests now guard Python package-local license
  presence.
- Implemented Python Publish Failure Handling. `scripts/publish-all.sh python`
  no longer swallows `uv publish` failures behind a skeleton fallback. It now
  builds each Python package into package-local `dist/`, publishes those exact
  artifacts, supports `PUBLISH_ALL_DRY_RUN=1`, and release docs point at the
  real script rather than a nonexistent `publish-python.py`.
- Implemented Npm Bin Executable Integrity. `packages/plugin-openclaw/bin/init.mjs`
  is now executable, dry-pack output reports executable mode for every OneMem
  npm bin artifact, and structure tests now guard package `bin` entries for
  existence, Node shebang, and executable bit.
- Implemented Public Plugin Release State cleanup. Codex now has a documented
  repo marketplace root, active runtime/provider docs no longer overclaim
  publication proof, and the Codex hook scripts no longer depend on a copied
  workspace `@onemem/sdk-ts` symlink. A clean Codex plugin-cache lifecycle
  `SessionStart -> PostToolUse -> Stop` emits the expected trace payload through
  a fake `ONEMEM_TRACE_CLI`; real trusted `/hooks` on-chain proof remains
  unclaimed. Full `pnpm test`, `pnpm typecheck`, `pnpm build`,
  `pnpm test:structure`, plugin validations, and npm publish dry-runs pass.
  Actual plugin npm upload is still blocked by `npm whoami` returning `E401`.
- Implemented npm Provenance Release Hardening. The release workflow now routes
  TS package publishing through `scripts/publish-all.sh ts`; the script defaults
  npm access to public, forwards `NPM_TOKEN` to `NODE_AUTH_TOKEN`, and supports
  CI provenance via `PUBLISH_ALL_NPM_PROVENANCE=1`. Structure tests guard those
  invariants. Plugin npm dry-runs and Python publish dry-run pass, but actual
  npm publication remains unclaimed because local npm auth returns `E401` and
  both plugin package registry lookups return `E404`.
- Implemented Verifiable Research Agent Executable Demo. The formerly pending
  `demos/verifiable-research-agent` now records a mocked three-day research
  flow as three real Sui testnet TraceSessions in one namespace, writes a JSON
  artifact, and verifies each session. Live proof created sessions
  `0x78f425...15f3`, `0x4e3fdb...b00e`, and `0x8190f5...b031`; independent TS
  CLI verification returned `ok: true` for all three. The boundary stays
  explicit: mocked tools/runtime, no real web/PDF/Hermes/MemWal/Walrus/Seal
  proof.
- Implemented Multi-Agent Coordination Executable Demo. The formerly pending
  `demos/multi-agent-coordination` now records a mocked Claude Code
  orchestrator plus mocked Hermes and CrewAI specialists as three real Sui
  testnet TraceSessions in one namespace. Live proof created namespace
  `0x6947b0...e136` with sessions `0x6b46e4...b542`,
  `0x1dadb4...6bb3`, and `0x4ce846...0de1`; independent TS CLI verification
  returned `ok: true` for all three. The two specialist sessions start from
  orchestrator delegate `parentCallId` values; runtime execution remains
  mocked, and no LangGraph or full cross-session dashboard tree claim is made.
