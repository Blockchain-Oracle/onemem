# Context Engineering Status: OneMem

Date: 2026-06-17

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
automatic Codex tool-call trace coverage remains pending until a live Codex
`/hooks` trust/session proof exists.

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
sessions remain separate smoke proof; the closed follow-up here is script-level
runtime-control enforcement covered by local tests.

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

CLI Command Surface Refresh is the twenty-fourth docs/status slice. The
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
CLI's `--allow-admin` safety flag. Owner-driven revocation and hosted
wallet-signed revoke remain future protocol/product work.

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

1. Continue the docs/status inventory for remaining stale package READMEs and
   runtime docs found by the docs audit.
2. Continue hosted/manual wallet verification for CLI delegate registration and
   hosted share execution when real wallet/Enoki/MemWal config is available.
3. Protocol-backed claim/transfer and owner-driven revoke remain separate
   follow-up designs.
4. Re-run affected quality gates and write verification before claiming done.
5. Restore npm auth or CI `NPM_TOKEN` / npm trusted publisher settings and
   publish `@onemem/codex-plugin@0.1.0` plus
   `@onemem/claude-code-plugin@0.1.0`. The repo release path is now
   provenance/public-access hardened, but registry publication remains
   unproven until `npm view` returns real versions.

## Verification Rule

For docs/context-only cleanup, run:

```bash
pnpm test:structure
```

For product changes, use the affected-stack checks in the quality profile and
write a verification audit before claiming completion.
