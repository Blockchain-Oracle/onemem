# Verification Audit: Hosted Trust Helper Coverage

## Verdict

Pass.

Hosted dashboard now has a package-local unit test gate for non-interactive trust
helpers behind hosted onboarding and CLI pairing. The tests cover wallet/network
storage scoping, non-secret MemWal config validation, registry lookup parsing,
created-object parsing, digest/hex helpers, and sponsorship config guardrails.

This does not claim live wallet-popup delegate registration. That remains a
manual/live-browser proof because no Enoki, wallet, MemWal, or Sui private-key
config is present in the current shell.

## Artifacts Checked

- Plan:
  `.thoughts/plans/2026-06-17-hosted-trust-helper-coverage.md`
- Existing hosted CLI spec/story/verification:
  `.thoughts/specs/2026-06-17-hosted-cli-delegate-minting.md`
  `.thoughts/stories/2026-06-17-hosted-cli-delegate-minting.md`
  `.thoughts/verification/2026-06-17-hosted-cli-delegate-minting.md`
- Implementation:
  `apps/hosted-dashboard/package.json`
  `apps/hosted-dashboard/lib/cli-login.ts`
  `apps/hosted-dashboard/lib/hosted-state.test.ts`
  `apps/hosted-dashboard/lib/cli-login-client.test.ts`
  `apps/hosted-dashboard/lib/cli-login.test.ts`
  `apps/hosted-dashboard/lib/sponsored-provisioning.test.ts`

## Requirement Traceability

- R1: Hosted-dashboard exposes a package-local `test` command.
  - Evidence: `apps/hosted-dashboard/package.json`.
- R2: Hosted browser provisioning storage is scoped by wallet and network.
  - Evidence: `hosted-state.test.ts`.
- R3: Malformed hosted provisioning storage is ignored.
  - Evidence: `hosted-state.test.ts`.
- R4: CLI pairing browser helpers fail closed for malformed hex, missing digest,
  and missing created objects.
  - Evidence: `cli-login-client.test.ts`.
- R5: Hosted CLI MemWal config validation distinguishes unsupported networks,
  missing public config, and invalid object IDs.
  - Evidence: `cli-login.test.ts`.
- R6: MemWal account lookup parsing can be tested without live Sui RPC calls.
  - Evidence: `lookupCliLoginMemWalAccount(..., lookupClient)` injection seam and
    `cli-login.test.ts`.
- R7: Sponsored provisioning reports missing private config before transaction
  build/execution and validates supported networks/action shape.
  - Evidence: `sponsored-provisioning.test.ts`.

## Acceptance Criteria Coverage

- Package-local hosted tests run through Vitest: covered.
- Non-secret config and missing-config behavior are covered: covered.
- Wallet/network local storage scoping is covered: covered.
- Chain object parsing fails closed: covered.
- Browser smoke still covers disconnected hosted UI and missing-config paths:
  covered.

## Quality Gates

- `pnpm install --ignore-scripts` passed.
- `pnpm --filter @onemem/hosted-dashboard test` passed:
  4 files, 15 tests.
- `pnpm --filter @onemem/hosted-dashboard lint` passed.
- `pnpm --filter @onemem/hosted-dashboard typecheck` passed.
- `pnpm --filter @onemem/hosted-dashboard browser:smoke` passed:
  27 checks.
- `pnpm --filter @onemem/hosted-dashboard build` passed when rerun serially
  after browser smoke.
- `pnpm test:structure` passed:
  191 checks.
- `git diff --check` passed.

## Deviations From Plan

- The first Vitest run exposed a worker timeout while loading all hosted test
  files in the default thread pool. The hosted test command now uses a single
  forked worker via `--poolOptions.forks.minForks=1` and
  `--poolOptions.forks.maxForks=1`; the full suite then completed in 1.39s.
- A concurrent hosted `next build` and browser-smoke dev server produced the
  known transient Next page-collection error. The build was rerun serially and
  passed.

## Gaps And Risks

- Live wallet popup approval for hosted delegate registration is still not
  automated.
- Hosted share creation is superseded by
  `.thoughts/verification/2026-06-17-hosted-share-capability-creation.md`.
  Live sponsorship/wallet execution remains manual proof.
- Several current-facing docs still contain stale status claims and should be
  cleaned in a separate docs lane.

## Evidence Log

- Subagent prototype audit ranked hosted share creation, public verifier parity,
  and single-trace replay export as the next product gaps.
- Subagent docs audit identified stale current-facing claims in CLI, framework,
  MCP, runtime, OpenClaw, Hermes, and dashboard docs.
- Current environment has no Enoki/private-key/npm-token variables set, so no
  live mutation or publishing proof was claimed.
