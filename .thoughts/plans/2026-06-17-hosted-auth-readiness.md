# Plan: Hosted Auth Readiness

## Inputs

- Research:
  `.thoughts/research/2026-06-17-hosted-auth-readiness.md`
- Spec:
  `.thoughts/specs/2026-06-17-hosted-auth-readiness.md`
- Stories:
  `.thoughts/stories/2026-06-17-hosted-auth-readiness.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`
- Current hosted app source.

## Assumptions

- Use the installed legacy `@mysten/dapp-kit@0.16.16` provider stack.
- Support Google Enoki registration first because existing copy and docs use
  Google as the primary zkLogin provider.
- Do not implement sponsored transaction minting in this slice.

## Open Questions

- The final hosted session cookie model remains open; this slice uses live
  dApp Kit account state only.

## Phase 1: Provider Wiring

### Goal

Wrap hosted app routes in real Sui/dApp Kit providers and optional Enoki wallet
registration.

### Work

- Add a hosted provider client component.
- Import dApp Kit CSS.
- Configure testnet/mainnet Sui clients.
- Register Enoki wallets when public Enoki API key + Google client ID exist.
- Surface provider configuration through a lightweight context hook.

### Checks

- `pnpm --filter @onemem/hosted-dashboard typecheck`
- `pnpm --filter @onemem/hosted-dashboard build`

### Acceptance Criteria Covered

R1, R2, R3, R7, AC1, AC2.

### Stop Condition

Hosted app builds with and without public Enoki env.

## Phase 2: Login, Onboarding, Dashboard State

### Goal

Replace fake redirect/sign-in flags with real account state and honest pending
copy.

### Work

- Update `/login` to render dApp Kit `ConnectButton`, connected account state,
  and Enoki configuration status.
- Update `/onboarding` to gate account-dependent steps on real account state and
  mark mint/namespace steps as pending future work.
- Update `/dashboard` to read account state from the provider rather than
  `NEXT_PUBLIC_ONEMEM_SIGNED_IN`.

### Checks

- `pnpm --filter @onemem/hosted-dashboard typecheck`
- `pnpm --filter @onemem/hosted-dashboard build`
- Add/extend a hosted browser smoke if practical.

### Acceptance Criteria Covered

R4, R5, R6, AC1, AC3, AC4, AC5.

### Stop Condition

No hosted page claims successful account/namespace minting without a real
transaction.

## Phase 3: Context And Verification

### Goal

Register the work in the Context Engineering trail and prove it.

### Work

- Add verification audit.
- Update wiki status and structure artifact registry.
- Run structure/lint gates.

### Checks

- `pnpm test:structure`
- `pnpm lint`

### Acceptance Criteria Covered

R8.

### Stop Condition

Verification audit maps requirements to code and commands.

## Verification Checkpoint

Write `.thoughts/verification/2026-06-17-hosted-auth-readiness.md` before
claiming the slice complete.

## Handoff Notes

The next hosted-auth slice should build real sponsored transaction routes for
MemWalAccount/namespace provisioning. Hosted share/revoke must wait until that
transaction/session path is real.
