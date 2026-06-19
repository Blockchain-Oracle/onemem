# Context Engineering Status: OneMem

Date: 2026-06-18

## Active Entry Points

- Repo router: `/Users/abu/dev/hackathon/sui-overflow/onemem/AGENTS.md`
- Persistent wiki: `.thoughts/wiki/index.md`
- Project map: `.thoughts/wiki/project-map.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`
- Prototype discovery:
  `.thoughts/prototype-discovery/2026-06-17-one-mem-2.md`

## Current Rule

The repo now follows Context Engineering as the operating model:

1. Preserve raw sources.
2. Keep durable project knowledge in the wiki.
3. Use specs, stories, plans, and verification artifacts for work that changes
   behavior.
4. Keep `AGENTS.md` small and route detailed context to this thought space.
5. Treat old architecture docs as source material unless a current artifact or
   current code confirms they are still live.

## Storage Convention

Project Context Engineering artifacts live in the repo-local `.thoughts/`
directory. Do not write OneMem project artifacts anywhere else.

## Plugin Standing

The Abu Context Engineering plugin source at
`/Users/abu/plugins/abu-context-engineering` and installed cache at
`/Users/abu/.codex/plugins/cache/personal/abu-context-engineering/0.4.1`
are aligned on manifest version `0.4.1`. The plugin default artifact root is
`<project-root>/.thoughts/`; no plugin skill should create OneMem project
artifacts outside the repo-local context directory.

## Prototype Standing

`/Users/abu/Downloads/One Mem 2` is accepted as high-fidelity prototype evidence.
It is not production code to copy. Prototype-derived deltas need an explicit
accept/reject pass before implementation.

## Latest Product Slice

Unified Sessions is the first implemented prototype delta. The dashboard
`/sessions` route now presents day/runtime groups over existing on-chain
`TraceSession` objects and provides a server-side verify-all action for each
group. This remains a dashboard grouping, not a protocol-level unified-session
object.

Memory Provenance is the second implemented prototype delta. The dashboard
`/memories` route now presents real metadata from on-chain `memwal_write` events:
runtime/tool namespace, session, namespace, call, hashes, captured-by address,
Sui transaction digest, and proof-boundary copy. It remains read-only and does
not expose fake add/edit/delete/decrypt actions.

Share Capability Readiness is the third implemented prototype delta. The TS CLI
now exposes `namespace share` and `namespace capabilities`; `onemem init`
surfaces `ONEMEM_ADMIN_CAP_ID`; dashboard `/share` renders real configured
namespace/capability state and honest no-namespace guidance. Hosted share
transactions and owner-driven revoke remain out of scope until signer/session
and contract support exist. A disposable live testnet smoke minted a ReadOnly
cap and confirmed active capability count moved `2 -> 3`.

Holder Self-Revoke is the fourth implemented prototype delta. The SDK and TS CLI
now expose the current contract's real holder self-revoke path through
`namespace revoke <cap-id>`, with a CLI safety guard for Admin caps. Dashboard
`/share` points holders at that command and still avoids fake owner-driven
revoke UI. The same disposable testnet smoke revoked the minted ReadOnly cap and
confirmed capability count moved `3 -> 2`.

Memory Origin Verification is the fifth implemented prototype delta. The
dashboard `/memories` drawer now lets a user explicitly verify the selected
memory's originating `TraceSession` through the existing server verifier. Browser
proof through the Codex `@chrome` plugin confirmed a live result of `Trace
verified 0x6ceaab...c080 - 1 calls - Completed`; the feature remains
deliberately scoped to Merkle-chain integrity, not plaintext or semantic proof.

CLI Credentials Fallback is the sixth implemented cleanup slice. The
login-created `~/.onemem/credentials.json` now feeds the shared SDK runtime
memory resolver, TS CLI memory commands, MCP memory tools, and dashboard
`/settings` credential status. Env vars still override file values, unsafe file
permissions are refused, and dashboard rendering stays sanitized.

Codex Memory Plugin is the seventh implemented runtime slice. The repo now has
`packages/plugin-codex` with `.codex-plugin/plugin.json`, a validator-compatible
`.mcp.json` using `mcpServers`, a repo-local marketplace manifest, a OneMem
Codex skill, and optional `SessionStart`/`PostToolUse`/`Stop` hooks. A temporary
`CODEX_HOME` install proof passed through `codex plugin marketplace add` and
`codex plugin add`. MCP memory/search/verify is the stable baseline; full
automatic Codex tool-call trace coverage is now proven for an interactive
trusted hook session on testnet:
`0x0c88317632dcd386b6f81b94ee510003ba107d3c4bfa035ba8072fca8304e330`.
`codex exec` remains unsuitable as the hook-proof path on Codex CLI 0.140.0.

Plugin Marketplace Publication Readiness updates that runtime slice: the Codex
marketplace is now named `onemem`, the production selector is
`onemem-codex@onemem`, and Claude Code has a root
`.claude-plugin/marketplace.json` with plugin selector `onemem@onemem`. Active
docs and dashboard install strings now use `Blockchain-Oracle/onemem` repository
marketplace commands first, with local checkout commands only as development
fallbacks. GitHub marketplace installs from public `main` pass for both Codex
and Claude Code, and the Claude Code plugin tag `onemem--v0.1.0` is pushed.
Both plugin npm tarballs now use the published `@onemem/sdk-ts@^0.6.0` range
instead of `workspace:*`; direct npm publish still fails with npm `E404`
permission errors until `@onemem` scope publish permission, a valid `NPM_TOKEN`,
or npm trusted publisher configuration is fixed.

Runtime Controls is the eighth implemented prototype/runtime slice. The SDK now
persists local runtime policy at `~/.onemem/runtime-controls.json` (or
`ONEMEM_RUNTIME_CONTROLS_PATH`), `createTraceRecorder()` and `onemem-trace` obey
pause/trace-capture policy before signer/network setup, bridge-based Python
providers treat structured policy skips as intentional clears, and dashboard
`/apps` exposes real pause/trace controls backed by `/api/runtimes`. Enforced
coverage now includes Vercel AI, OpenAI Agents, Hermes, CrewAI, LiveKit, and
ElevenLabs when using the current SDK/CLI bridge. OpenClaw, Claude Code hooks,
and Codex hooks were the explicit follow-up closed by the next runtime slice.

Runtime-Control Plugin Adoption is the ninth implemented runtime slice.
OpenClaw, Claude Code, and Codex hook-specific trace paths now enforce local
runtime policy before buffering, opening sessions, or flushing content. Claude
hook helpers now support isolated state directories and preserve buffers on
client setup failure. Dashboard runtime metadata can now mark all current
first-party runtime capture paths as enforced. Live trusted Claude/Codex hook
sessions were later proven in the trusted runtime hook proof slice; the closed
follow-up here is script-level runtime-control enforcement covered by local
tests.

Grouped Session Replay Export is the tenth implemented prototype delta.
Dashboard `/sessions` groups now expose a Replay/export action backed by
`POST /api/sessions/export`. The export is proof-scoped JSON over existing
TraceSession IDs: group metadata, source IDs, per-session verification summary,
call hashes, Walrus blob identifiers, partial failures, and explicit proof
boundary text. It remains read-only and does not claim plaintext replay or a new
protocol-level unified-session object.

Dashboard Browser Regression is the eleventh implemented quality slice.
`@onemem/dashboard` now has `browser:smoke`, a repo-owned Playwright-core smoke
that starts a temporary dashboard server, launches local Chrome/Chromium,
verifies `/sessions` grouped Replay/export, asserts export schema/copy/download
proof-boundary UI, fails on browser console/resource errors, and cleans up its
server. Manual Codex Chrome-plugin checks remain required for affected UI work;
this harness is committed regression coverage.

Docs Status Inventory is the twelfth implemented cleanup slice. Current-facing
entry docs now route to files that exist in this checkout, root package counts
match the actual `packages/` tree, framework-provider docs distinguish shipped
trace wrappers from deferred memory-provider work, and structure tests guard
against missing-parent research links returning in current entry points.

Delegate Key Lifecycle is the thirteenth implemented prototype/runtime slice.
The shared TS runtime resolver now treats expired file-backed credentials as
loaded metadata but not usable MemWal config; env credentials can still override
and configure memory. CLI memory errors now call out expired local credentials,
dashboard `/settings` renders sanitized lifecycle state, label, TTL, and expiry
metadata, and hosted `/cli-login` sends delegate label/TTL request metadata to
the configured mint endpoint. Hosted minting and hosted share/revoke mutations
remain deferred until real signed-in account/session support exists. Dashboard
browser smoke now covers the Settings delegate lifecycle tab with a temporary
credentials file, and `/settings` no longer creates/resolves a signer just to
display local status.

Hosted Auth Readiness is the fourteenth implemented hosted slice. The hosted
app now wraps routes in the installed dApp Kit provider stack, registers Enoki
wallets only when public Enoki config is present, and uses real wallet/account
state on `/login`, `/onboarding`, and `/dashboard`. The old fake login
redirect/static signed-in flag path has been removed from those pages.
Onboarding now labels MemWalAccount/namespace provisioning as pending until real
sponsored transaction routes exist. Hosted browser smoke covers the
disconnected/missing-Enoki-config path and confirms no failed browser resources
or console errors.

Hosted Sponsored Provisioning is the fifteenth implemented hosted slice. The
hosted app now has server-owned Enoki sponsorship routes for two hard-coded
onboarding actions: `namespace::create` and
`namespace::mint_capability_readwrite`. The browser signs sponsored bytes with
dApp Kit, the server executes through Enoki, waits for Sui transaction effects,
and returns only object IDs parsed from real `objectChanges`. Browser smoke
verifies missing private-key behavior without leaking secrets, and a live
testnet smoke minted a disposable namespace/Admin cap/ReadWrite cap through the
same helper path. Hosted CLI persistence and delegate credential minting were
handled by the next slice; hosted owner share creation is handled by the
twentieth slice. Recipient claim links and owner-driven revoke remain separate
follow-ups.

Hosted CLI Delegate Minting is the sixteenth implemented hosted slice. Hosted
onboarding persists provisioned namespace metadata by wallet and network.
Hosted `/cli-login` looks up MemWal accounts from the configured registry,
creates missing accounts with wallet approval, generates delegate keys locally,
registers delegate public keys on-chain, signs the CLI nonce, and posts
credentials to the local callback. The CLI now rejects callbacks unless the
delegate private key derives the submitted public key, the nonce signature
verifies, and the submitted registration digest proves a successful
`account::add_delegate_key` call for the submitted owner, MemWal account,
package, and delegate public key/address. Automated smoke still does not click
through a real wallet popup; manual-browser verification remains required for
that UX.

Codex Built-In Memory Positioning is the seventeenth docs/context slice. Current
OpenAI Codex docs now include built-in Memories and Chronicle, so the Codex
plugin docs distinguish those local generated memory files from OneMem's
verifiable cross-runtime memory and trace layer. `packages/plugin-codex` remains
the correct OneMem install surface for Codex through bundled MCP plus optional
trusted hooks; OneMem does not write `~/.codex/memories` or replace `/memories`.

Hosted Trust Helper Coverage is the eighteenth quality slice. The hosted app now
has a package-local Vitest gate for its non-interactive trust helpers:
wallet/network-scoped provisioning storage, browser callback digest/object
parsing, MemWal registry lookup parsing through an injected client, public
config validation, and sponsorship guardrails. The test command uses a single
forked worker to avoid the default Vitest worker timeout observed in this
workspace. Hosted browser smoke remains the route-level proof; live wallet-popup
delegate registration is still manual because the current shell has no Enoki,
wallet, MemWal, or Sui private-key config.

Public Verifier Prototype Parity is the nineteenth prototype delta. Hosted
`/verify/[session_id]` now uses a testable public verifier helper, paginates all
matching `ActionCallEmittedEvent` pages for display evidence, shows
expected/on-chain and computed/re-derived roots, and renders explicit Proven /
Not proven proof-boundary panels from the One Mem 2 prototype. Hosted browser
smoke now visits the real testnet verifier route for
`0x6ceaab0fe2961043d490326960dfd192e43c25ed655772d42c04c265ad3ec080` and
asserts public verifier copy, Proven/Not proven panels, call evidence, Suiscan
link, and no browser console/resource errors.

Hosted Share Capability Creation is the twentieth hosted/prototype slice.
Hosted `/share` now exists inside `apps/hosted-dashboard` and uses the same
server-owned Enoki sponsorship boundary as onboarding. The sponsorship helper
accepts only named ReadOnly/ReadWrite share actions, validates sender,
recipient, namespace, Admin cap, network, and move target allowlists, signs
sponsored bytes in the browser through dApp Kit, and parses created capability
IDs from Sui transaction object changes after execution. Automated proof covers
unit-level validation/parsing plus browser smoke for `/share` and missing
private-key behavior. Live wallet popup execution remains manual/live proof;
recipient capability landing is handled by the twenty-first slice; owner-driven
revoke and any future claim/transfer transaction remain future work.

Recipient Share Landing is the twenty-first hosted/prototype slice. Hosted
`/share/[capability_id]` now reads a real Sui `NamespaceCapability` object,
derives kind from the phantom Move type, reads `namespace_id` from object
content, displays owner metadata and namespace summary when available, and lets
a connected wallet compare itself with the on-chain owner. It is intentionally
read-only: the current contract already transfers the capability during minting,
so there is no separate hosted claim transaction in v0.1.

Event-backed Share History is the twenty-second hosted/prototype slice. The SDK
now reads `NamespaceCapabilityMintedEvent` and
`NamespaceCapabilityRevokedEvent`, joins revoke rows by `cap_id`, and exposes
full history through `NamespacesAPI.getCapabilityHistory()`. Hosted `/share`
serves `GET /api/share/history` and renders owner capability history without a
hosted share database, refreshing the panel after sponsored mints.

Dashboard Status Refresh is the twenty-third docs/status slice. The current
dashboard README no longer marks built local/hosted routes as pending, keeps
Walrus Sites mirror deployment unproven, and structure tests now guard the
known built dashboard route rows from regressing to stale pending labels.

Walrus Sites Deploy Readiness is the twenty-fourth dashboard deployment slice. The
Walrus mirror script is no longer a no-op skeleton: it validates a real static
artifact, supports check/dry-run modes, and calls `site-builder` only when a
valid artifact exists. The deploy workflow no longer runs the invalid
`next export -o out` command. Live Walrus URL evidence and a full static mirror
remain pending until a static artifact and funded `site-builder` environment are
available.

Walrus Static Verifier Shell is the current dashboard deployment slice. The
repo now has a checked-in static verifier at
`apps/hosted-dashboard/walrus-sites/verifier`, and both the local deploy script
and manual GitHub workflow default to that real artifact. The shell performs
browser-side Sui JSON-RPC verification for TraceSession Merkle integrity and
keeps the proof boundary explicit. Live Walrus deployment URL, mainnet package
support, and full hosted-dashboard static mirroring remain pending.

CLI Command Surface Refresh is the twenty-fifth docs/status slice. The
load-bearing CLI command-surface doc now describes the actual current v0.1 TS
CLI and Python read-only mirror instead of the larger planned surface, the CLI
README status table reflects built TS/Python packages, and structure tests guard
known deferred commands from being advertised as current command headings.

Executable Demo Trace is the twenty-fifth demo/verification slice.
`demos/agent-sends-money` now exposes a workspace command that records a safe,
mocked payment flow as a real Sui testnet `TraceSession`, writes a JSON run
artifact, and verifies the Merkle chain. The generic SDK smoke script was
updated to the current trace API, and the SDK now lazy-loads MemWal's manual
entrypoint so trace-only imports do not require MemWal at startup. Live proof:
the demo created and verified
`0xc173d0abc33f51bef8f489c9e928e2d956a290419edc7e3924b79a39bec56d59`
with four calls (`resolve_suins`, `fetch_pyth_oracle`, `check_gas_estimate`,
`execute_payment`), and the TS CLI independently verified the same session from
chain data. This slice does not prove a real transfer, Walrus plaintext
availability, Seal decryptability, or trusted Codex/Claude hook capture.

CLI Historical Docs Boundary is the twenty-fifth docs/status slice. The older
CLI implementation/output sketches are now explicitly historical, the CLI
README points current truth at `command-surface.md` and package code, and
`login-flow.md` now matches the current TS login implementation's OS-assigned
loopback callback port and lack of a registered logout command.

Recipient Capability Self-Revoke is the twenty-sixth hosted/prototype slice.
Hosted `/share/[capability_id]` now explains the only revoke path supported by
contract v0.1: the capability holder can consume their own capability object via
`onemem namespace revoke <capability-id>`. Admin capability pages include the
CLI's `--allow-admin` safety flag. Owner-driven revocation remains future
protocol/product work. Hosted wallet-signed holder self-revoke is handled by the
Hosted Holder Self-Revoke slice.

Single Trace Replay Export is the twenty-seventh dashboard/prototype slice.
Dashboard `/trace/[session_id]` now exposes a proof-scoped single-session JSON
export through `GET /api/trace/[session_id]/export` and the Replay session
modal. The export includes schema/source metadata, network, proof boundary,
TraceSession verification summary, hashes, call timing, and Walrus blob
identifiers; it intentionally excludes plaintext and does not claim semantic or
model-intent proof. Browser smoke now covers this route and a Chrome plugin
manual pass confirmed the modal against a live testnet TraceSession.

TS Provider Memory Alignment is the twenty-eighth docs/coverage slice. The
Vercel AI and OpenAI Agents provider docs now match their shipped explicit
`createOneMemMemory(...)` helper, while preserving the boundary that automatic
memory extraction/tool wiring is future work. Vercel AI provider tests now cover
memory recall injection and capture passthrough, matching the existing OpenAI
Agents helper coverage, and the framework-provider overview no longer marks TS
provider memory helpers as deferred.

TS Package Export Condition Order is the twenty-ninth release-readiness slice.
The SDK, Vercel AI provider, and OpenAI Agents provider package manifests now
put `types` before `import`/`require` in conditional exports, including the
SDK's `./runtime` subpath. Focused package builds now pass without the previous
tsup/esbuild `condition "types"` warning, and structure tests guard against
reintroducing that export-condition order.

Package License Inclusion is the thirtieth release-readiness slice. All ten
publishable JavaScript `@onemem/*` packages now include package-local
Apache-2.0 `LICENSE` files matching their manifest `files` allowlists. A
dry-pack verification loop confirmed each targeted npm tarball includes
`LICENSE`, and structure tests now guard that package-local license files remain
present.

Python Package License Inclusion is the thirty-first release-readiness slice.
All six publishable Python packages now include package-local Apache-2.0
`LICENSE` files. Rebuilt wheels include `*.dist-info/licenses/LICENSE`, rebuilt
sdists include top-level package `LICENSE` entries, and structure tests now
guard Python package-local license presence.

Python Publish Failure Handling is the thirty-second release-readiness slice.
`scripts/publish-all.sh python` no longer turns `uv publish` failures into a
successful release through a skeleton fallback. The script now builds each
Python package into an explicit package-local `dist/`, publishes those exact
artifacts, supports `PUBLISH_ALL_DRY_RUN=1`, and docs now point at the real
script instead of the nonexistent `publish-python.py`.

Npm Bin Executable Integrity is the thirty-third release-readiness slice. The
OpenClaw plugin's advertised `oc-onemem` bin now has owner execute permission,
matching the other OneMem npm bins. Structure tests now scan every npm package
`bin` entry for existence, Node shebang, and executable bit, and dry-pack output
reports executable mode for every bin artifact.

Public Plugin Release State is the thirty-fourth release-readiness slice. The
Codex marketplace manifest is now documented as a GitHub marketplace root whose
`source: "local"` path is relative to the fetched marketplace snapshot, not a
user-local checkout. Codex hooks now arm local state and flush buffered calls via
the published `@onemem/sdk-ts@0.6.0` `onemem-trace` CLI at `Stop`, avoiding the
workspace-symlink install trap found in clean Codex plugin-cache inspection.
Clean public Codex and Claude marketplace installs from `Blockchain-Oracle/onemem`
pass, the Claude plugin tag `onemem--v0.1.0` is pushed, npm publish dry-runs for
both plugin packages pass, and full CI passes on `main`. Npm plugin upload
remains blocked by `@onemem` registry publish permission/trusted-publisher
configuration; direct and CI publishes return npm `E404` permission errors.

Switch Laptops Executable Demo is the thirty-fifth demo-readiness slice.
`demos/switch-laptops` now has a private workspace package with deterministic
model tests plus a live `demo:trace` command. The command creates two real Sui
testnet `TraceSession`s in one namespace: Laptop A / Claude Code shaped context
write, and Laptop B / Hermes shaped recall/answer. Live proof verified sessions
`0x8b94875ac47a0a465825efffcd4f18aeae076f54869c07c8254158827df55c80` and
`0x4fa78b3df807b0f55ea21712f65c80ae01830113898ba0855c54043c5bdcffb1` under
namespace
`0xf6e5d42df661c748df8211e77a7356ef8ea290e601141569d863a38b9eda12af`. This is
same-namespace continuity proof with mocked runtime labels; it does not claim
real Claude Code hooks, Hermes hooks, MemWal recall, cross-device login, Walrus
plaintext, or Seal decryptability.

npm Provenance Release Hardening is the thirty-sixth release-readiness slice.
The GitHub release workflow now routes TS package publication through
`scripts/publish-all.sh ts` instead of a bare Changesets publish command. The
script defaults npm access to public, forwards `NPM_TOKEN` to `NODE_AUTH_TOKEN`
when token publishing is configured, and lets CI opt into npm provenance through
`PUBLISH_ALL_NPM_PROVENANCE=1`. Structure tests now guard these release
invariants. This does not claim npm upload success: local `npm whoami` still
returns `E401`, and `npm view @onemem/codex-plugin` plus
`npm view @onemem/claude-code-plugin` still return `E404`.

Verifiable Research Agent Executable Demo is the thirty-seventh demo-readiness
slice. `demos/verifiable-research-agent` now has a private workspace package,
deterministic model tests, and a live `demo:trace` command. The command creates
three real Sui testnet `TraceSession`s in one namespace for a mocked Day 1
source-discovery memory, Day 2 synthesis memory, and Day 3 answer-from-memory
flow. Live proof verified sessions
`0x78f425ce0dc09429e04101fa8281c73985fdf5ab7c243b1e459bd7d820a015f3`,
`0x4e3fdb55e768fa631afb19d6ef93fa741cf68fa35d73bd66b4e527c08069b00e`,
and `0x8190f5619b5f315bde621bb0bc1532fa62370becfd794535cf6bdc67b506b031`
under namespace
`0xbc2a0e293cd05eae4c428754dad518b9d9e57662bbda42483b3ba56744fc07dd`.
This is same-namespace, multi-session research-memory continuity proof with
mocked tools/runtime; it does not claim real web search, PDF extraction, Hermes
execution, MemWal semantic recall, Walrus plaintext, or Seal decryptability.

Multi-Agent Coordination Executable Demo is the thirty-eighth demo-readiness
slice. `demos/multi-agent-coordination` now records a mocked Claude Code
orchestrator plus mocked Hermes and CrewAI specialists as three real Sui testnet
`TraceSession`s in one namespace. Live proof verified all three sessions through
the TS CLI. Runtime execution remains mocked, and no LangGraph or full
cross-session dashboard tree claim is made.

Demo Matrix CI Gate is the thirty-ninth demo-readiness slice. Root
`test:demo-matrix` runs tests, typechecks, lints, and builds across all four
demo packages, and CI now runs that gate before the broader monorepo checks.
Live `demo:trace` writes remain manual/on-demand because they mint real Sui
testnet objects.

Release Auth Gate and Registry Publication Preflight are the fortieth
release-readiness slice. Release now keeps Changesets release PR automation
available when registry credentials are absent and only attempts npm/PyPI upload
when the configured gates are present. `pnpm registry:status` now reports the
current npm/PyPI truth table; strict mode is the required proof gate before any
fresh registry-current claim.

Hosted Holder Self-Revoke is the forty-first hosted/prototype slice. Hosted
recipient capability pages now expose contract v0.1 holder self-revoke through
the same wallet-signed Enoki sponsorship boundary used by hosted sharing. The
action is enabled only for the connected address owner, Admin caps require a
safety acknowledgement, and owner-driven revoke remains explicitly unsupported
until protocol v0.2.

Python Provider Memory Helpers is the forty-second framework-provider slice.
CrewAI, LiveKit, and ElevenLabs provider packages now export explicit
`create_onemem_memory(...)` helpers backed by `onemem-sdk-python`'s
`MemoryClient`. Helpers support defensive recall/context/capture behavior with
injected-client tests, provider wheels include the new modules and SDK
dependency metadata, and CI now runs all Python package tests instead of only
`packages/sdk-python`. Native CrewAI `memory_config`, LiveKit memory subclassing,
ElevenLabs memory adapters, and automatic memory extraction remain future
provider work.

Codex Hook Proof Boundary is the forty-third runtime-readiness slice. The Codex
plugin keeps MCP as the stable installable layer and uses an empty
`SessionStart` matcher for optional hooks. Package and runtime docs now state
that `SessionStart` arms local trace state while `Stop` flushes buffered calls
through the trace CLI. Local Codex CLI 0.140 `codex exec` proof attempts did not
execute user-level or plugin hooks. This historical boundary is superseded by
the sixtieth trusted runtime hook proof slice, where an interactive trusted
Codex session emitted a verifiable on-chain OneMem `TraceSession`.

Release Preflight Auth Diagnostics is the forty-fourth release-readiness slice.
`pnpm release:preflight` now reports npm/PyPI packages needing publication and
whether npm token/trusted-publishing or PyPI token gates are present, and it
checks current published provider artifacts for shipped memory-helper markers,
without printing secret values or uploading artifacts. Release workflow logs run
this preflight before publish decisions. Published provider artifacts for
Vercel AI, OpenAI Agents, CrewAI, LiveKit, and ElevenLabs were stale at their
current registry versions, so local provider patch versions now advance to
publishable versions with docs/tests guarding that boundary. On 2026-06-18,
manual npm/PyPI publication completed and `pnpm registry:status --strict`
proved every local npm and PyPI package current. `pnpm release:preflight
--strict` also passes without active token env because no package publication is
currently needed.

CLI Dashboard Launcher is the forty-fifth CLI/docs slice. The TS CLI now
registers `onemem dashboard`, delegates to the separate `onemem-dashboard`
binary from `@onemem/dashboard`, passes `PORT` and `ONEMEM_MODE=local`, and
fails with install guidance when the dashboard binary is missing. Current CLI,
dashboard, and public docs now list `onemem dashboard` as implemented instead of
deferred; browser auto-open remains intentionally out of scope.

Registry-Aware Current Docs is the forty-sixth docs/release-boundary slice.
Current package READMEs and public docs now route publication claims through
`pnpm registry:status --strict`. After the 2026-06-18 live publication pass,
those docs state the npm/PyPI packages are current while preserving separate
proof boundaries for trusted hooks, hosted wallets, DNS, and deployment.

Brand Assets Package Readiness is the forty-seventh brand/package slice.
`@onemem/brand` now contains source-controlled logo SVGs and social/OG SVG
templates under the directories it already exported. The active social campaign
identity is recorded as `onemem.xyz` and `x.com/OneMemAI`; `onemem.ai` remains a
historical placeholder in older architecture docs until a deliberate DNS/docs
migration pass. A new structure shard guards the brand package asset inventory,
dimensions, and public identity strings. PNG exports, live social accounts,
DNS, video assets, and dashboard mark consolidation remain separate follow-ups.

Brand Raster And Domain Readiness is the forty-eighth brand/package slice.
`packages/brand/og-images/` now includes platform-ready PNG exports for the X
banner, Discord/community banner, GitHub/OG image, product card, and demo video
cover, beside the SVG source assets. The brand structure shard now validates PNG
signatures and dimensions from file headers. DNS verification found that
`onemem.xyz` and `docs.onemem.xyz` are the current campaign targets; deployment
is not yet claimed until DNS and hosted app responses are verified.

Ship-Readiness Go And Product Copy is the forty-ninth ship-readiness slice.
`.thoughts/plans/2026-06-18-ship-readiness-go.md` is the replacement autonomous
Go prompt: audit truth first, publish only with valid auth, deploy only with
verified Vercel/project linkage, prove hooks/wallets only with real on-chain
evidence, and keep the product story memory-first. Active landing/docs/brand
copy now leads with decentralized persistent memory for AI agents instead of
"Etherscan for AI agents" or "Stop trusting agents"; GitHub/OG and product-card
SVG plus PNG exports were refreshed. `@onemem/brand` now exports a checked-in
`vendor-logos/` inventory for launch graphics, with manifest/source coverage in
the brand structure shard. The later 2026-06-18 registry pass published all
missing/drifted npm and PyPI packages and verified them with strict registry
status. Vercel deployment remains unclaimed because no local Vercel auth/project
link has been proven.

Registry Publication Live is the fiftieth release-readiness slice. The PyPI
publish path now handles empty optional `uv publish` args under `set -u`, guarded
by structure tests and a dry-run publish pass. Live PyPI publication uploaded
`onemem-sdk-python@0.2.0`, `onemem-cli@0.1.0`, `hermes-onemem@0.2.0`, and the
three provider `0.1.1` packages. Live npm publication uploaded
`@onemem/brand@0.1.2`, `@onemem/cli@0.1.0`, `@onemem/dashboard@0.1.2`,
`@onemem/claude-code-plugin@0.1.0`, `@onemem/codex-plugin@0.1.0`,
`@onemem/openai-agents@0.1.3`, and `@onemem/vercel-ai-provider@0.1.2`.
Changesets created matching git tags across commits `0759f2c`, `ec3fae5`, and
`18292d4`. `pnpm registry:status --strict` and `pnpm release:preflight --strict`
pass. GitHub Actions repository secrets `NPM_TOKEN` and `PYPI_TOKEN` are
configured for future release workflow runs.

Vercel Public Deployment is the fifty-first deployment-readiness slice. The
landing and hosted-dashboard Vercel projects are linked under
`blockchain-oracles-projects`, SSO deployment protection is disabled, and the
custom domains are live through Cloudflare: `https://onemem.xyz` and
`https://app.onemem.xyz` both return HTTP 200 with Vercel headers. Landing
production env `NEXT_PUBLIC_ONEMEM_APP_URL` now points to
`https://app.onemem.xyz`, and live landing HTML no longer points CTA traffic at
the Vercel project URL. Final production deployments are
`dpl_7QVMXfRcGiH4nTus31KWUBCYNbHK` for landing and
`dpl_BtEdipDexSrxYPgYniqWiJ7ZGvU7` for hosted-dashboard.

The hosted dashboard hub now links only to routes served by the hosted shell:
`/dashboard`, `/share`, `/onboarding`, `/login`, and a real public verifier
sample. The previous `/dashboard` cards to root-level `/memories`, `/sessions`,
`/apps`, and `/settings` were live 404s and are fixed with a structure guard.
Chrome verified landing, hosted dashboard, login, and the real testnet public
verifier with clean fresh app console logs. The public login/dashboard copy no
longer exposes raw `NEXT_PUBLIC_*` env names. A later Chrome pass with Slush
configured confirmed production `/dashboard` and `/onboarding` can see connected
account `0x93b37bc1...d119d6`, and `/api/onboarding/sponsored/prepare` returns
a real testnet namespace-create transaction. The live onboarding proof remains
pending at the Slush `sign-transaction` prompt because browser automation cannot
control `chrome-extension://` pages directly. Remaining boundaries: docs hosting
is not deployed, hosted Google sign-in is now ready after the Enoki public key,
Google OAuth client ID, allowed origins, and Enoki Google provider were
configured, and wallet-signed onboarding/share/CLI/revoke proofs must finish
through manual Slush approvals before being claimed complete.

Hosted Sui Upgrade Type Parser is the fifty-third production fix slice. The
hosted onboarding error
`transaction did not create expected object type ...::MemoryNamespace` was traced
to a Sui package-upgrade ID split: Move calls target current package
`0xc2e839...`, but created object and event type strings use original package
`0x64c14f...`. `config/networks.json`, generated TS/Python address artifacts,
SDK namespace/trace/memory readers, hosted sponsored provisioning, future
deploy/migrate scripts, and the static verifier now carry/use
`originalPackageId` where type strings require it. Production deployment
`dpl_697kAYJWnJQteUYXURrcTYj3foSA` is live on `https://app.onemem.xyz`. The same
slice also hardened hosted onboarding UX: Continue is disabled until real
namespace/Admin/RW IDs exist, and `Cancel wallet request` invalidates stale
signing runs so late approvals cannot overwrite the active page. Regression
gates pass, including hosted tests/build/typecheck, SDK tests/build/typecheck,
CLI tests/build/typecheck, Python SDK tests, and 432/432 structure tests. Live
Chrome verification on production saw connected wallet `0x93b37bc1...d119d6`,
disabled Continue with empty receipts, one cancel button while provisioning, no
app console errors, and a clean idle cancel message. Live chain evidence shows
namespace-create transactions succeed under original package object types; the
remaining end-to-end wallet proof is a fresh manual Slush approval for
namespace-create plus the following ReadWrite-capability mint.

Hosted Sui Parser Semantic Fallback is the fifty-fourth production fix slice.
After the user saw the namespace-create parser error again, Vercel logs showed
no fresh 502 on the current deployment, and chain inspection confirmed recent
namespace-create object changes use original package type strings. The hosted
parser now matches exact expected object types first, then narrowly falls back
to the OneMem `MemoryNamespace` and `NamespaceCapability<T>` Move type shapes if
package IDs drift. Parser failures now include observed created object types.
The regression failed before the fix and passed after it. Hosted dashboard
typecheck/build, hosted tests, and 433/433 structure tests pass. Production
deployment `dpl_EfEcJ5xcTVUEeQwGkKFEpV6x9nMg` is live on
`https://app.onemem.xyz`, with `/`, `/login`, `/onboarding`, `/dashboard`,
`/share`, and `/api/enoki/status` returning HTTP 200. Full wallet onboarding is
still not claimed until Slush manually approves namespace-create and the
following ReadWrite-capability mint.

Production User Flow Audit and Onboarding Saved-State Reuse is the fifty-fifth
production readiness slice. The live custom domains are active, route checks
return HTTP 200 for the hosted shell, and `vercel inspect app.onemem.xyz`
confirms production deployment `dpl_5ntGx66kHTKGdqXLeSnofvsutX98` is aliased to
`https://app.onemem.xyz`. Chrome verification on production showed the connected
Slush account `0x93b37bc1...d119d6`, hosted dashboard state for namespace
`0x1363c4b1...5e23f9`, and onboarding now rendering "Already provisioned on
testnet" with namespace/Admin/ReadWrite receipts instead of immediately pushing
the user into another namespace-create mutation. The share view also reads the
same saved Admin and ReadWrite capability history, and the public verifier still
renders a verified trace. Structure coverage now enforces hosted onboarding
saved-state reuse and no localhost completion link. Hosted typecheck, hosted
tests, hosted build, focused structure tests, and 440/440 structure tests pass.
The honest boundary remains unchanged: Enoki Google sign-in is still
unconfigured, and fresh wallet side-effect proofs need manual Slush approval.

Hosted CLI Login Cancel Guard is the fifty-sixth production readiness slice. A
real temporary `onemem login --no-open` pairing was opened against
`https://app.onemem.xyz/cli-login`; Chrome saw connected Slush wallet
`0x93b37bc1...d119d6`, active namespace `0x1363c4b1...5e23f9`, and after the
MemWal account existed, MemWal account `0x76bf026a4d...e2940b04`. The CLI page
previously had no app-side escape hatch while wallet registration was pending.
It now uses an `activeRunRef` stale-request guard, exposes `Cancel wallet
request` during account/delegate wallet requests, returns to idle after cancel,
and ignores late approvals from the old request. Production deployment
`dpl_GXYFnN5DvQdMPCP3Ly3h75z92Xf2` is live on `https://app.onemem.xyz`. Hosted
typecheck, hosted tests, hosted build, focused structure, and full 440/440
structure tests pass. A follow-up default-browser `onemem login` rerun opened
Chrome for `/cli-login?nonce=51d21ce24dfcdc8dd8caf2a82e1af911&port=52119`,
Slush approved the delegate registration transaction, the hosted page rendered
"Pairing complete", and the CLI persisted validated credentials under an
isolated temp HOME. That temp HOME was removed after sanitized inspection so the
delegate private key is not left on disk. CLI memory search still requires
`ONEMEM_EMBEDDING_API_KEY`; the CLI now reports that boundary without falsely
listing `MEMWAL_PACKAGE_ID` when the login credential already contains it. CLI
lint, tests, typecheck, and build pass after that message fix.

Production Enoki Diagnostic and UI Re-Audit is the fifty-seventh production
readiness slice. The hosted `/api/enoki/status` endpoint no longer points users
at a fake `enoki_public_*` placeholder. It now reports the actual missing public
env vars (`NEXT_PUBLIC_ENOKI_API_KEY`,
`NEXT_PUBLIC_ENOKI_GOOGLE_CLIENT_ID`), required origin
`https://app.onemem.xyz`, missing origins, and Google-provider presence. Vercel
production deployment `dpl_6eymTySQEppgozZprPNxvNGjjfqY` is live and aliased to
`https://app.onemem.xyz`; live route checks returned HTTP 200 for `/`,
`/login`, `/dashboard`, `/onboarding`, `/share`, and `/api/enoki/status`.
Chrome audits found no `vercel.app`, `localhost`, or `127.0.0.1` anchors on the
public landing or hosted app pages; `/login`, `/dashboard`, `/onboarding`,
`/share`, and the sample public verifier rendered without OneMem console
errors. Onboarding still reuses saved testnet namespace/Admin/ReadWrite state,
and share history loads 2/2 active capabilities. Hosted typecheck, hosted
tests, hosted build, focused structure, and full 441/441 structure tests pass.
The previous Enoki Google sign-in boundary is now closed: Vercel production has
the Google OAuth Web client ID, the Enoki Portal has the Google auth provider,
and the live readiness endpoint reports `signInReady: true`.

Enoki Readiness Preflight is the fifty-eighth production readiness slice. The
repo now has `apps/hosted-dashboard/scripts/check-enoki-readiness.mjs` exposed
through `pnpm --filter @onemem/hosted-dashboard run enoki:readiness`. The
preflight reads local env without printing secret values, checks the Enoki app
metadata through the server private key, optionally compares the deployed
`/api/enoki/status` endpoint, and supports `--strict` for release automation.
On 2026-06-19 the local `.env` contains `ENOKI_PRIVATE_KEY` with owner-only file
permissions, and the preflight reaches Enoki metadata. After the Enoki portal
origin update, both local metadata and deployed `/api/enoki/status` report
allowed origins `https://onemem.xyz` and `https://app.onemem.xyz`, with
`missingOrigins: []`. The Enoki public API key was then added to local `.env`
and Vercel production, and deployment `dpl_6idCiYDeEKhZYehoXKzwEfGFbDJL` was
promoted on `https://app.onemem.xyz`. The Google OAuth Web client ID was later
added to local `.env` and Vercel production, and deployment
`dpl_TwJBMCFqT1gm82wEXi4JHdN3zMG9` was promoted on `https://app.onemem.xyz`.
Live `/api/enoki/status` now reports `publicEnv.configured: true`,
`missingOrigins: []`, `hasGoogleProvider: true`, `authProviders: 1`, and
`signInReady: true`. The strict readiness preflight passes against both local
metadata and the deployed status endpoint. Chrome live check of
`https://app.onemem.xyz/login` shows Enoki Google wallets registered for testnet,
does not show the Google-disabled copy, and has no browser console errors.
Hosted lint, typecheck, tests, build, focused plugin/app structure, and full
443/443 structure tests pass. The CLI login page was split into a local
`model.ts` helper to keep source files under the 400-line cap without changing
behavior. Chrome reached Google Cloud Console sign-in for the active `gcloud`
project `project-9105c0b4-dfc1-4ee7-b22`; OAuth client creation was later
completed by the user outside this session and the resulting client ID is now
configured in OneMem env and Enoki.

Brand and Video Context Engineering is the fifty-second launch-readiness slice.
The brand package now contains the cream-first static campaign kit, OG/social
assets, vendor logo inventory, HyperFrames emotional intro renders, Remotion
dashboard-capture demo renders, and darker 30-second Remotion launch-mode cuts
for X/social at `packages/brand/video/onemem-demo/renders/onemem-launch-30s.mp4`,
`packages/brand/video/onemem-demo/renders/onemem-launch-square-30s.mp4`, and
`packages/brand/video/onemem-demo/renders/onemem-launch-vertical-30s.mp4`.
The launch cut was benchmarked against downloaded AgentCard, Circle,
Triton/Seal, and Sui X reference videos, uses a package-local audio headroom
pass after render, includes generated intro and launch handoffs with probed MP4
metadata and social copy, a package-local designer/ChatGPT brand brief, a
generated media-kit index and static visual gallery for designers/agents, a
final-video producer brief/spec that separates current cuts from live proof and
keeps WASI/Nautilus/TEE as future/stretch unless proven, plus a live-proof
intake validator, manifest template, generated shot-by-shot
recording runbook, generated recording-pack/readiness handoff, a live-proof
operator command for readiness/capture/hash flow, non-mutating recording preflight,
strict live-footage preparation step with per-clip MP4 SHA-256 validation, and
canonical Sui ID/base58 digest validation, Sui RPC existence validation, and
dedicated live-proof Remotion
compositions for the final recording pass. It uses
`onemem.xyz`,
`docs.onemem.xyz`, and `x.com/OneMemAI`, keeps OpenClaw spelling, and stays
memory-first. The honest boundary remains: the current demo footage is
dashboard trace-page capture backed by checked-in testnet trace artifacts, not
fresh live proof of physical laptop switching, a wallet transfer, live web
research, or runtime hooks.

End-to-End Production Readiness Verification is the fifty-ninth readiness
slice. The active 2026-06-19 audit now has current evidence across production
configuration, local dashboard UI, hosted dashboard UI, CLI, SDK, MCP baseline,
plugins, providers, Python packages, Move contracts, registry state, and repo
structure. A live SDK blocker was found and fixed in source:
`@mysten/seal` rejects upgraded package objects for Seal identities, so the
TypeScript SDK now uses `originalPackageId` for Seal encryption/session keys,
the current package for `seal_policy::seal_approve`, and the original package
for capability type identity. The full live SDK integration passes on testnet:
canonical verify, fresh namespace/session/calls, real Walrus tool I/O, and Seal
encrypt -> Walrus store -> cap-holder decrypt. The Walrus failure was diagnosed
honestly: the test signer needed current WAL/SUI balance management; a minimal
Walrus write/read succeeded before the full SDK integration rerun. A production
release blocker was then found and closed: the old
`npm exec --yes --package @onemem/cli@0.1.0 -- onemem --version` path failed
because the published `@onemem/sdk-ts@0.6.0` runtime artifact did not export
`resolveMemoryConfigFromSources`. `scripts/check-release-preflight.py` now
checks the SDK runtime tarball for that marker, and the current npm publication
line is live: `@onemem/sdk-ts@0.6.3`, `@onemem/cli@0.6.3`,
`@onemem/mcp@0.6.3`, `@onemem/codex-plugin@0.1.2`,
`@onemem/claude-code-plugin@0.1.1`, `@onemem/dashboard@0.1.4`,
`@onemem/oc-onemem@0.2.5`,
`@onemem/openai-agents@0.1.5`, and `@onemem/vercel-ai-provider@0.1.4`.
`npm exec --yes --package @onemem/cli@0.6.3 -- onemem --version` prints
`0.6.3`, and a temporary public pack/install inspection of
`@onemem/sdk-ts@0.6.3` confirms the dynamic trace chunk required by the hook
flush path is present. The registry/preflight scripts now retry
transient HTTP fetch failures after PyPI timeouts produced changing
false-positive package errors. Current `pnpm registry:status --strict` reports
every npm and PyPI version current, and `pnpm release:preflight --strict
--timeout 30` exits 0 with all checked artifact markers present. Local
publishing tokens are persisted in gitignored `.env`, `.npmrc`, and `.pypirc`
with `0600` permissions; `.npmrc`/`.pypirc` are now ignored, and release scripts
load `.env` locally without overriding shell/CI env.
Current repo-local/deployed gates pass: `pnpm lint`,
`pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm test:structure` (454/454),
`pnpm test:demo-matrix`, hosted production browser smoke against
`https://app.onemem.xyz` (48 checks), local packaged dashboard route/API checks,
Enoki strict readiness against `https://app.onemem.xyz/api/enoki/status`,
Python ruff/pyright/pytest, MCP live stdio trace verification, and
`git diff --check`. A follow-up docs-source slice added Mintlify canonical URL
metadata and `apps/docs/favicon.svg`, added a structure test for docs navigation,
favicon, and CLI install-proof copy, and proved `apps/docs` with
`mise exec -- npx mintlify@latest validate` under the repo-pinned Node 20.18.0;
direct shell Node 26 is rejected by the Mintlify CLI. Structure now passes
454/454. The docs domain is now live through the Vercel `onemem-docs` project
using a Mintlify static export: deployment
`dpl_F4iKnanzYDEq968cbtq1Z3hHNwLb` is aliased to `docs.onemem.xyz`, SSO
protection is disabled for public access, and `/`, `/quickstart`,
`/reference/cli`, and `/integrations/runtimes` return HTTP 200 with expected
OneMem/docs content. This is not a native Mintlify dashboard/Git deployment, so
docs source changes still need an explicit export plus Vercel redeploy until
that path is automated. The MCP memory boundary is now also proven with repo
`.env` loaded: the live stdio integration started with `memory ON`,
`onemem_add_memory` returned a Walrus blob id, and `onemem_search_memory` found
the stored test fact. The same follow-up repaired stale generated
launch-audio/video provenance hashes caught by structure tests. A later focused
gate caught generated brand JSON formatter drift and a stale
`audio-provenance.generated.json` hash in the designer-campaign manifest; the
manifest now records size `4225` and SHA-256
`bd7830963d617dfdb9275f45676b2652021200c601d795b08728a7b14c05acbe`, while the
current silent launch WAV remains
`b96b59dcb0153a383ff6ddc3ae729c687e4fb9efb816dcc4f719f1718ef58574`.
`tests/structure/brand-designer-campaign.test.ts` now recomputes manifest file
sizes and SHA-256 hashes from disk, and the latest focused gates are green:
`pnpm lint`, `pnpm test:structure` (454/454), and `git diff --check`.
Trusted Runtime Hook Proof is the sixtieth runtime-readiness slice. The
previously unclaimed Codex and Claude Code hook boundary is now closed with
fresh testnet evidence from real trusted runtime sessions. Codex trusted
`SessionStart`, `PostToolUse`, and `Stop` and emitted
`0x0c88317632dcd386b6f81b94ee510003ba107d3c4bfa035ba8072fca8304e330`; Claude
Code ran `SessionStart`, `PostToolUse`, and `Stop` with
`--include-hook-events` and emitted
`0x9c88993b6197a8460f4fbd4a886c6353505d36383bf35035e5305088b64825e7`. Both
sessions verify `ok: true`, `callCount: 1`, and matching Merkle roots through
the CLI and published `@onemem/mcp@0.6.3`. The proof also fixed the concrete
runtime issues found during testing: Codex manifest now declares
`"hooks": "./hooks/hooks.json"`, Codex hook config no longer has the rejected
top-level `description`, Claude Code flushes on `Stop` instead of `SessionEnd`,
and the Claude Code plugin now bundles `.mcp.json` like ClaudeMem.

Remaining honest boundaries are manual hosted/deployment proofs:
fresh wallet-popup mutation digests, docs deployment automation/native Mintlify
integration, public marketplace push parity for the latest plugin fixes, and
CI-side trusted publishing/secret configuration.
Chrome can see the pending OneMem Slush testnet transaction tab, but automation
is blocked from controlling `chrome-extension://` pages by browser policy, so
wallet-popup proof still requires manual approval before a digest can be
claimed.

## Documentation Standing

The repo contains three kinds of docs:

- Current operating docs: `AGENTS.md`, quality profile, project map, and current
  package READMEs that match code. Current entry points have been patched to
  avoid required links to missing parent research files.
- Historical architecture docs: useful for rationale but may contain stale
  status tables.
- Stale or contradictory docs: must be patched, marked historical, or replaced
  when they misroute future agents.

## Subagent Lanes

Use subagents for independent lanes with disjoint write scopes:

- instruction-file alignment,
- public/package docs status cleanup,
- prototype-vs-implementation gap audit,
- runtime/provider smoke verification,
- release/package metadata audit,
- trust-path verification.

## Immediate Cleanup Queue

1. Continue deeper docs/status inventory for stale historical architecture pages
   that are not current entry points.
2. Run a live `site-builder` deployment for the static public verifier shell
   and record the returned Walrus URL; full dashboard static mirroring remains
   separate future work.
3. Record fresh live proof clips for physical laptop switching, wallet
   transfer, and live research before calling the final proof demo complete.
   Trusted Codex/Claude runtime hooks now have on-chain proof, but demo footage
   can still include them if useful.
4. Automate docs hosting for `docs.onemem.xyz`; the current domain is live via
   Vercel static Mintlify export, but future source changes still require a
   deliberate export/deploy/alias step unless native Mintlify Git deployment or
   CI automation is added.
5. Start fresh Slush-backed hosted mutations only when side-effect proof is
   required. Returning onboarding users now reuse saved namespace/Admin/ReadWrite
   state; fresh proof still requires manual approval for namespace-create,
   ReadWrite-capability mint, hosted share execution, and holder self-revoke
   before claiming the entire hosted wallet path.
6. Protocol-backed claim/transfer and owner-driven revoke remain separate
   follow-up designs.
7. Re-run affected quality gates and write verification before claiming done.
8. Configure CI repository secrets or npm/PyPI trusted publishing for future
   automated releases. Local npm/PyPI credentials are now available, but CI
   still needs repository secrets or trusted publishing before unattended
   release runs can publish without local intervention.

## Verification Rule

For docs/context-only cleanup, run:

```bash
pnpm test:structure
```

For product changes, use the affected-stack checks in the quality profile and
write a verification audit before claiming completion.
