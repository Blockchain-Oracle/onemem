# Verification Audit: Testnet Upgrade Dry-run Proof

## Verdict

Pass.

The hardened migration script now prints the exact Sui CLI path/version, the
upgrade strategy docs explain the current `suiup` testnet-channel path, and a
real Sui testnet upgrade dry-run succeeds with the `suiup` testnet binary
without mutating chain state or repo manifests.

## Artifacts Checked

- `.thoughts/research/2026-06-18-testnet-upgrade-dry-run-proof.md`
- `.thoughts/specs/2026-06-18-testnet-upgrade-dry-run-proof.md`
- `.thoughts/stories/2026-06-18-testnet-upgrade-dry-run-proof.md`
- `.thoughts/plans/2026-06-18-testnet-upgrade-dry-run-proof.md`
- `scripts/migrate-contract.sh`
- `tests/structure/deploy-scripts.test.ts`
- `docs/05-our-architecture/01-protocol/upgrade-strategy.md`

## Requirement Traceability

- Requirement 1: `scripts/migrate-contract.sh` now sets `SUI_BIN` from
  `command -v sui`, sets `SUI_VERSION` from `sui --version`, and prints both
  before the upgrade dry-run.
- Requirement 2: `upgrade-strategy.md` now documents the `suiup install
  sui@testnet` path for current testnet-channel upgrades.
- Requirement 3: `upgrade-strategy.md` includes the PATH-prefixed command:
  `PATH="/Users/abu/.local/bin:$PATH" bash scripts/migrate-contract.sh testnet --dry-run`.
- Requirement 4: this audit records the successful dry-run command and confirms
  no deployment manifests or generated address files changed.

## Acceptance Criteria Coverage

- `PATH="/Users/abu/.local/bin:$PATH" bash scripts/migrate-contract.sh testnet --dry-run`: pass.
- Dry-run output included `Sui CLI: /Users/abu/.local/bin/sui (sui 1.73.1-ff1fe0ec4551)`.
- Dry-run output included `No chain state changed` and `No repo files were updated`.
- `git diff -- config/networks.json contracts/onemem/Published.toml packages/sdk-ts/src/generated/addresses.ts packages/sdk-python/onemem/generated/addresses.py`: no output.
- `bash -n scripts/migrate-contract.sh`: pass.
- `mise exec -- pnpm test:structure`: pass, 408 tests.

## Quality Gates

- `brew upgrade sui`: pass, Homebrew Sui moved from `1.72.2` to `1.73.0`.
- `/Users/abu/.local/bin/suiup install sui@testnet`: pass, installed `v1.73.1`.
- `/Users/abu/.local/bin/suiup default set sui@testnet`: pass.
- `/Users/abu/.local/bin/sui --version`: `sui 1.73.1-ff1fe0ec4551`.
- `PATH="/Users/abu/.local/bin:$PATH" bash scripts/migrate-contract.sh testnet --dry-run`: pass.
- `bash -n scripts/migrate-contract.sh`: pass.
- `mise exec -- pnpm exec biome check --write tests/structure/deploy-scripts.test.ts docs/05-our-architecture/01-protocol/upgrade-strategy.md`: pass.
- `mise exec -- pnpm lint`: pass; existing Biome schema-version info only.
- `mise exec -- pnpm typecheck`: pass, 15 Turbo tasks.
- `mise exec -- pnpm build`: pass, 13 Turbo tasks.
- `mise exec -- pnpm test:structure`: pass, 408 tests.
- `sui move test`: pass, 40/40 Move tests.
- `mise exec -- uv run ruff check .`: pass.
- `git diff --check`: pass.

## Deviations From Plan

- Homebrew stable was upgraded first because it was the least disruptive
  official path, but it still lagged current testnet protocol. The plan then
  moved to `suiup`, which Context7 also documents as the testnet-channel tool.

## Gaps And Risks

- No live upgrade was executed in this slice.
- Homebrew and testnet protocol versions are time-sensitive; future operators
  may not need `suiup` if Homebrew stable catches up.
- `/Users/abu/.local/bin` is a local machine path. The durable instruction is
  to put the `suiup` binary directory first in PATH.

## Follow-ups

- Run the live testnet upgrade as a separate deliberate slice using the proven
  `suiup` testnet binary path.
- After live upgrade, run `bash scripts/verify-mainnet.sh testnet`, regenerate
  address artifacts, and commit the new package manifest state.

## Evidence Log

- Homebrew `sui 1.73.0-homebrew` dry-run failed with protocol max 125 while
  testnet reported protocol 126.
- `suiup` installed `sui@testnet` release `v1.73.1`.
- The successful dry-run used:
  `PATH="/Users/abu/.local/bin:$PATH" bash scripts/migrate-contract.sh testnet --dry-run`.
- The dry-run compiled `onemem` and exited before manifest/codegen updates.
