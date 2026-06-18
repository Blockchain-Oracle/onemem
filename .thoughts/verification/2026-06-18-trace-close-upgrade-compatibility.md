# Verification Audit: Trace Close Upgrade Compatibility

## Verdict

Conditional pass.

The source implementation, SDK surface, docs, and local quality gates pass. The
non-mutating Sui upgrade dry-run is not complete because the installed Homebrew
Sui binary is `1.72.2` and testnet currently requires protocol version `126`
while the binary supports up to `124`. Homebrew resolved `sui 1.73.0` but could
not download the bottle because local DNS failed for
`pkg-containers.githubusercontent.com`.

Do not run the live testnet upgrade until a current Sui CLI is installed and the
dry-run succeeds.

## Artifacts Checked

- `.thoughts/research/2026-06-18-trace-close-upgrade-compatibility.md`
- `.thoughts/specs/2026-06-18-trace-close-upgrade-compatibility.md`
- `.thoughts/stories/2026-06-18-trace-close-upgrade-compatibility.md`
- `.thoughts/plans/2026-06-18-trace-close-upgrade-compatibility.md`
- `contracts/onemem/sources/trace.move`
- `contracts/onemem/tests/trace_compat_tests.move`
- `contracts/onemem/tests/trace_tests.move`
- `contracts/onemem/tests/merkle_chain_tests.move`
- `contracts/onemem/tests/admin_revoke_tests.move`
- `packages/sdk-ts/src/traces.ts`
- `packages/sdk-ts/tests/traces.unit.test.ts`
- `scripts/sdk-smoke-testnet.ts`
- `docs/05-our-architecture/01-protocol/*`
- `docs/05-our-architecture/02-sdks/*`

## Requirement Traceability

- R1: Existing public Move signatures remain present.
  - Evidence: `trace::close_call(session, cap, call_id, output_blob, output_hash, status, clock, ctx)`.
  - Evidence: `trace::close_session(session, cap, status, clock, ctx)`.
- R2: Deprecated old close functions abort rather than bypass revoke checks.
  - Evidence: both old functions abort with `ENamespaceRequiredForClose`.
  - Evidence: `trace_compat_tests.move`.
- R3: New namespace-aware functions enforce namespace identity and revoked caps.
  - Evidence: `close_call_with_namespace` and `close_session_with_namespace`
    assert session namespace and call `namespace::assert_cap_for_namespace`.
- R4: TS SDK targets the new Move functions.
  - Evidence: `packages/sdk-ts/src/traces.ts`.
  - Evidence: `packages/sdk-ts/tests/traces.unit.test.ts`.
- R5: Manual testnet smoke script passes `namespaceId` on close operations.
  - Evidence: `scripts/sdk-smoke-testnet.ts`.
- R6: Move tests cover active close behavior and deprecated abort behavior.
  - Evidence: `sui move test` passes 40/40.
- R7: Current architecture docs identify namespace-aware close function names.
  - Evidence: active docs under `docs/05-our-architecture`.

## Acceptance Criteria Coverage

- AC1: `sui move test` passes.
  - Covered.
- AC2: Focused SDK tests prove close/end transaction targets.
  - Covered by `TracesAPI trace close targets`.
- AC3: Full repo quality gates pass.
  - Covered.
- AC4: `sui client upgrade --dry-run` is attempted and recorded honestly.
  - Attempted; blocked by local Sui CLI protocol support after canonical RPC
    connectivity was restored.
- AC5: Verification audit records remaining live-migration gap.
  - Covered here.

## Quality Gates

- `sui move test`
  - Pass: 40 tests passed.
- `mise exec -- pnpm --filter @onemem/sdk-ts test`
  - Pass: 76 passed, 5 skipped.
- `mise exec -- pnpm --filter @onemem/sdk-ts typecheck`
  - Pass.
- `mise exec -- pnpm lint`
  - Pass; existing Biome schema version info only.
- `mise exec -- pnpm typecheck`
  - Pass: 15 tasks successful.
- `mise exec -- pnpm build`
  - Pass: 13 tasks successful.
- `mise exec -- pnpm test:structure`
  - Pass: 402 tests passed.
- `mise exec -- pnpm exec turbo run test --force`
  - Pass: 16 tasks successful, 0 cached.
- `mise exec -- pnpm test:demo-matrix`
  - Pass: 17 tasks successful.
- `git diff --check`
  - Pass.

## Deviations From Plan

- The plan expected a completed `sui client upgrade --dry-run`; this could not
  complete with the installed Sui CLI.
- A temporary Sui env alias `testnet-canonical` was added to test the canonical
  Mysten RPC hostname and then removed from `/Users/abu/.sui/sui_config/client.yaml`.
- A first `pnpm test` run failed because root `build` and root `test` were run in
  parallel and both wrote `packages/sdk-ts/dist`. The forced rerun without the
  external build race passed.

## Gaps And Risks

- Upgrade compatibility is still not proven against live testnet because the
  local Sui binary must be upgraded first.
- Homebrew found `sui 1.73.0`, but the bottle download failed due DNS resolution
  for `pkg-containers.githubusercontent.com`.
- Live package upgrade and metadata rewrite remain blocked until dry-run passes.

## Follow-ups

- Install a Sui CLI that supports testnet protocol `126` or newer.
- Rerun:
  `sui client upgrade --upgrade-capability 0x2834843d375d7c74d2eba35b8a1919dcd686c11e62e0993fa39577f1bb8151a9 --gas-budget 100000000 --dry-run --json`
- After dry-run passes, harden `scripts/migrate-contract.sh` to update
  `config/networks.json`, `Published.toml`, generated addresses, and verification
  docs after a live upgrade.

## Evidence Log

- Context7 `/mystenlabs/sui` docs confirm official testnet endpoint:
  `https://fullnode.testnet.sui.io:443`.
- Initial dry-run against configured endpoint failed at DNS resolution.
- `nslookup fullnode.testnet.sui.io` resolved to `34.49.79.168`.
- `curl --resolve fullnode.testnet.sui.io:443:34.49.79.168` reached the endpoint.
- Dry-run against canonical RPC reached testnet, then Sui CLI panicked:
  network protocol `126`, binary max supported `124`.
- `brew upgrade sui` and retry both failed downloading the `1.73.0` bottle due
  DNS failure for `pkg-containers.githubusercontent.com`.
