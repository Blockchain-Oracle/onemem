# Plan: Hosted CLI Delegate Minting

Date: 2026-06-17

## Steps

1. Add hosted browser storage helpers for provisioned namespace state.
2. Update hosted onboarding to save provisioning state for the connected wallet.
3. Add `lib/cli-login.ts` and `GET /api/cli-login/memwal-account`.
4. Replace `/cli-login` placeholder mint URL with:
   - wallet connection gate,
   - account lookup,
   - account create action,
   - delegate key generation,
   - delegate registration,
   - nonce signing,
   - localhost callback.
5. Add `@mysten-incubation/memwal` as an explicit hosted-dashboard dependency.
6. Harden `packages/cli-ts/src/commands/login.ts` with delegate credential,
   keypair, and on-chain registration proof validation.
7. Add focused unit tests for delegate nonce validation and registration proof rejection.
8. Update hosted browser smoke to cover the new CLI-login disconnected/config-ready UI.
9. Run focused quality gates:
   - hosted-dashboard lint/typecheck/build/browser smoke,
   - cli-ts test/typecheck,
   - structure test,
   - git diff check.

## Verification Notes

- Browser smoke can validate disconnected UI and non-secret route behavior.
- Full live delegate registration needs an interactive wallet in the browser, so the strongest automated live proof for this slice is:
  - API account lookup against real testnet registry,
  - unit-level signature validation with real Ed25519 signing,
  - production build/typecheck.
