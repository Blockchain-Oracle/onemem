# Reality Research: Architecture Status Refresh

## Scope

Audit current-facing architecture README status tables that still show
historical `pending` rows for already-built OneMem protocol and SDK work.

## Sources Checked

- `docs/05-our-architecture/README.md`
- `docs/05-our-architecture/01-protocol/README.md`
- `docs/05-our-architecture/02-sdks/README.md`
- `docs/05-our-architecture/03-runtimes/README.md`
- `docs/05-our-architecture/06-dashboard/README.md`
- `contracts/onemem/sources/`
- `contracts/onemem/tests/`
- `packages/sdk-ts/src/`
- `packages/sdk-python/onemem/`
- `packages/sdk-ts/README.md`
- `packages/sdk-python/README.md`
- `config/networks.json`
- `contracts/onemem/Published.toml`
- `packages/sdk-ts/src/generated/addresses.ts`
- `packages/sdk-python/onemem/generated/addresses.py`
- Commands:
  - `git status --short --branch`
  - `npm view @onemem/sdk-ts version --json`
  - `pnpm registry:status`
  - `pnpm release:preflight`
  - `sui client object 0xc2e839c719e1c61222440f5661199e68de5413d8cfb49dd8bae3223e92fcf138 --json`

## Verified Facts

- The worktree started clean on `pillar-3-plugins` aligned with
  `origin/pillar-3-plugins` and `origin/main` at commit `6bf0f52`.
- `docs/05-our-architecture/README.md` labels its table a historical
  design-phase snapshot, but its rows still mark `01-protocol/`, `02-sdks/`,
  `03-runtimes/`, `05-cli/`, `06-dashboard/`, and `08-demos-and-tests/` as
  `⏳ pending`.
- `docs/05-our-architecture/01-protocol/README.md` labels its implementation
  status as historical, but every listed protocol component except mainnet
  deployment is still shown as `⏳ pending`.
- `contracts/onemem/sources/` contains `events.move`, `namespace.move`,
  `registry.move`, `seal_policy.move`, `trace.move`, and `version.move`.
- `contracts/onemem/tests/` contains unit/integration tests for namespaces,
  traces, capabilities, Seal approval, Merkle chain verification, registry,
  versioning, admin revoke, and trace compatibility.
- The current testnet package in `config/networks.json` is
  `0xc2e839c719e1c61222440f5661199e68de5413d8cfb49dd8bae3223e92fcf138`.
- On-chain package inspection reports that package's `content.Package.version`
  as `2`.
- `docs/05-our-architecture/02-sdks/README.md` labels its implementation
  status as historical, but all SDK rows are still `⏳ pending`.
- `packages/sdk-ts/src/` contains exported client, namespace, trace, memory,
  credential, runtime, Seal, Walrus, generated-address, and Move type modules.
- `packages/sdk-ts/src/index.ts` exports `OneMem`, `NamespacesAPI`,
  `TracesAPI`, `MemoryAPI`, generated addresses, Seal/Walrus helpers, and Move
  types.
- `npm view @onemem/sdk-ts version --json` returns `0.6.0`, matching the local
  package version.
- `packages/sdk-python/onemem/` contains Python source for RPC, client,
  hashing, memory, provider memory, trace verification, generated addresses,
  and typed package metadata.
- `packages/sdk-python/onemem/__init__.py` describes the v0.1 Python surface as
  the off-chain trace verifier and exports memory and trace helper APIs.
- Public PyPI lookup for `onemem-sdk-python` returns 404 through
  `pnpm registry:status`; the Python SDK is source-built but not published.
- `pnpm registry:status` currently reports:
  - `@onemem/sdk-ts` current at `0.6.0`.
  - `onemem-sdk-python` missing from PyPI.
  - Several runtime/provider packages still missing or drifted.

## Inferences

- The protocol and SDK README status rows are stale as live implementation
  truth, even though nearby notes already warn that the documents began as
  historical design material.
- The correct update is not to erase pending work; it is to replace stale
  `pending` rows with scoped current status and keep real gaps such as mainnet
  deployment and PyPI publication explicit.
- Structure tests can prevent stale core protocol/SDK pending rows from
  returning without requiring all historical architecture docs to be rewritten.

## Unknowns And Questions

- Whether mainnet deployment should be marked in flight or pending remains a
  product/release decision; current evidence only proves testnet deployment.
- Whether Python SDK should target full TS write parity in v0.1 remains
  unresolved; current evidence supports read/verify plus memory bridge, not full
  transaction-writing parity.

## Not Included

- No npm or PyPI publication.
- No mainnet mutation.
- No dashboard UI change.
- No attempt to rewrite every historical design table in the repo.
