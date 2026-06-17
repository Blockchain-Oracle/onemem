# Verification Audit: Hosted CLI Delegate Minting

## Verdict

Pass with one manual-wallet limitation.

Hosted onboarding now persists provisioned namespace metadata for the connected
wallet and network. Hosted `/cli-login` can look up or create the user's MemWal
account, generate a fresh delegate key in the browser, register the delegate
public key with wallet approval, sign the CLI nonce, and POST the credential
payload to the local `onemem login` callback. The CLI validates the nonce,
delegate private/public keypair, delegate signature, and Sui transaction proof
before writing credentials.

The remaining manual limitation is expected: the browser delegate registration
transaction requires interactive wallet approval, so automated smoke tests cover
the route, UI, signature verifier, and mocked registration-proof verifier, while
full end-to-end delegate minting is manual-browser work.

## Artifacts Checked

- Research:
  `.thoughts/research/2026-06-17-hosted-cli-delegate-minting.md`
- Spec:
  `.thoughts/specs/2026-06-17-hosted-cli-delegate-minting.md`
- Stories:
  `.thoughts/stories/2026-06-17-hosted-cli-delegate-minting.md`
- Plan:
  `.thoughts/plans/2026-06-17-hosted-cli-delegate-minting.md`
- Implementation:
  `apps/hosted-dashboard/app/cli-login/page.tsx`
  `apps/hosted-dashboard/app/api/cli-login/memwal-account/route.ts`
  `apps/hosted-dashboard/lib/cli-login.ts`
  `apps/hosted-dashboard/lib/cli-login-client.ts`
  `apps/hosted-dashboard/lib/hosted-state.ts`
  `apps/hosted-dashboard/app/onboarding/page.tsx`
  `apps/hosted-dashboard/scripts/browser-smoke.mjs`
  `packages/cli-ts/src/commands/login.ts`
  `packages/cli-ts/tests/login.test.ts`
  `tests/structure.test.ts`

## Requirement Traceability

- R1: Hosted onboarding saves successful sponsored provisioning state through
  `saveHostedProvisioningState`, and CLI pairing reloads it only when wallet and
  network match.
- R2: `GET /api/cli-login/memwal-account` reads public MemWal config and returns
  the connected owner's account ID or `null`.
- R3: The lookup helper reads the MemWal registry's `accounts` table and resolves
  the owner dynamic field without returning private config.
- R4: Hosted `/cli-login` gates pairing on a connected wallet.
- R5: Hosted `/cli-login` can create a MemWal account through the connected
  wallet when lookup returns no account.
- R6: Hosted `/cli-login` generates a delegate key locally and registers only the
  public key on-chain through `account::add_delegate_key`.
- R7: Hosted `/cli-login` signs the CLI nonce with the delegate key and sends the
  credential only to the local callback URL.
- R8: The CLI validates required fields, nonce equality, delegate keypair match,
  delegate signature, delegate address consistency, and the on-chain
  `account::add_delegate_key` registration transaction before writing credentials.
- R9: Browser smoke checks disconnected CLI-login UI and lookup route behavior.
- R10: Structure tests require the new implementation and Context Engineering
  artifact paths.

## Acceptance Criteria Coverage

- AC1: Passed. Hosted provisioning state is stored with wallet address, network,
  namespace/cap IDs, transaction digests, and update time.
- AC2: Passed. CLI-login lookup route returns non-secret public config and account
  lookup state; missing config returns structured `not_configured`.
- AC3: Passed by typecheck/build and code inspection. Delegate key generation
  happens in browser code, not a server route.
- AC4: Passed by code inspection. Delegate private key is not written to hosted
  localStorage and is only included in the localhost callback payload.
- AC5: Passed. CLI unit tests use real Ed25519 personal-message signatures and
  reject nonce mismatch, wrong-key signatures, mismatched private/public key
  pairs, bad delegate address, missing fields, failed registration transactions,
  and registration transactions for the wrong owner/account/package/delegate key.
- AC6: Passed. Hosted lint/typecheck/build/browser smoke, CLI test/typecheck, and
  structure checks passed.

## Quality Gates

- `pnpm install --lockfile-only --ignore-scripts` passed after adding the explicit
  hosted-dashboard MemWal dependency.
- `pnpm --filter @onemem/cli test` passed: 7 files, 52 tests.
- `pnpm --filter @onemem/cli lint` passed.
- `pnpm --filter @onemem/cli typecheck` passed.
- `pnpm --filter @onemem/hosted-dashboard typecheck` passed.
- `pnpm --filter @onemem/hosted-dashboard lint` passed.
- `pnpm --filter @onemem/hosted-dashboard build` passed.
- `pnpm --filter @onemem/hosted-dashboard browser:smoke` passed 27 checks and
  wrote `apps/hosted-dashboard/.browser-smoke/hosted-sponsored-provisioning.png`.
- `pnpm test:structure` passed 186 tests after the CLI-login page and CLI login
  validator were split under the structure test's line-count cap.
- `git diff --check` passed.
- Live testnet MemWal registry lookup passed with local env supplied:
  - network `testnet`
  - public package/registry/relayer config present
  - account ID resolved for the local owner address

## Deviations From Plan

- Context7 did not have a direct MemWal documentation entry; the implementation
  used Context7 Sui dApp Kit docs plus installed MemWal package types and local
  testnet object inspection.
- The Chrome connector/plugin was not callable in this Codex session after tool
  discovery. Verification used the repo-owned browser smoke harness instead of
  Playwright MCP.
- A production build attempted in parallel with the browser smoke dev server hit
  a transient Next `.next` collection error. The same build was rerun serially and
  passed.

## Subagent Review Closure

- Fixed: `delegateKey` now must derive the submitted `delegatePublicKey`; a valid
  signature from a different key is not enough.
- Fixed: the CLI now verifies the submitted `delegateRegistrationDigest` against
  Sui before persisting credentials. The transaction must succeed, be sent by the
  submitted owner, call `memwalPackageId::account::add_delegate_key`, target the
  submitted `accountId`, and register the submitted delegate public key/address.
- Fixed: hosted namespace state is reused only when both wallet address and Sui
  network match the active CLI-login lookup.

## Gaps And Risks

- Automated tests do not click through a real wallet popup for delegate
  registration; they validate the CLI trust boundary with a mocked Sui transaction
  response. Manual-browser verification remains needed for wallet popup UX.
- CLI memory write/use still requires an embedding API key or a future hosted-safe
  embedding/proxy design.
- Delegate revoke remains deferred until the product defines an owner-driven
  lifecycle UX and support path.
- Browser localStorage is only a near-term hosted-shell persistence layer; a real
  hosted account/session store is still needed.

## Evidence Log

- Context7 fetched current Sui dApp Kit transaction docs.
- Web/local package research checked MemWal account helpers and delegate key APIs.
- Direct live testnet registry lookup verified the MemWal account dynamic-field
  path for the local owner.
- Focused CLI and hosted-dashboard checks passed after implementation and after
  subagent review fixes.
- Browser smoke covered hosted CLI-login UI and non-secret lookup response
  behavior.
