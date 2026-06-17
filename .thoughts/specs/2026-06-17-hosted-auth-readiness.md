# Spec: Hosted Auth Readiness

## Objective

Replace hosted login/onboarding placeholders with an honest Enoki/dApp Kit
readiness layer: real wallet-provider wiring when configured, real connected
account display, and onboarding copy that clearly separates available
connection steps from not-yet-wired sponsored minting.

## Background And Current Reality

Hosted `/login` and `/onboarding` currently simulate progress without calling
Enoki, wallet APIs, or sponsored transaction routes. Current Enoki guidance and
the installed `@mysten/enoki@0.6.20` package prefer `registerEnokiWallets` plus
dApp Kit wallet hooks. The installed hosted app uses legacy
`@mysten/dapp-kit@0.16.16`, which requires `QueryClientProvider`,
`SuiClientProvider`, and `WalletProvider`.

## Users

- New OneMem users who arrive at `app.onemem.ai` before installing the CLI.
- Existing users who want to connect a wallet or Enoki account from a browser.
- Future share recipients who will need hosted account state before claiming
  capabilities.

## Goals

- Hosted app has a real provider stack for Sui wallet state.
- Enoki wallets are registered only when public Enoki configuration is present.
- Login page exposes real connect/account state.
- Onboarding no longer claims MemWalAccount/namespace minting is complete when
  no transaction has run.
- Hosted dashboard sign-in prompt uses real connected-account state, not a
  static `NEXT_PUBLIC_ONEMEM_SIGNED_IN` flag.

## Non-goals

- No sponsored transaction route.
- No hosted namespace creation or delegate minting.
- No hosted share/revoke mutations.
- No Enoki portal/OAuth setup performed from code.
- No private key or secret display in the browser.

## Requirements

- R1: Add a client provider wrapper around hosted routes using
  `QueryClientProvider`, `SuiClientProvider`, and `WalletProvider`.
- R2: Register Enoki wallets with `registerEnokiWallets` when
  `NEXT_PUBLIC_ENOKI_API_KEY` and a provider client ID are configured.
- R3: Keep Enoki registration disabled and visibly explain missing config when
  public configuration is absent.
- R4: Login page must render a real dApp Kit `ConnectButton` and connected
  account status through `useCurrentAccount`.
- R5: Onboarding must display real connected account state and treat
  account/namespace minting as pending until sponsored transaction routes exist.
- R6: Hosted dashboard prompt must reflect real wallet/account state through
  the hosted provider stack.
- R7: Server-only Enoki status route must remain server-only and must not expose
  private Enoki keys.
- R8: Tests/builds must cover the changed hosted app and any structure/context
  artifacts.

## Acceptance Criteria

- AC1: With no public Enoki env, hosted app builds and login/onboarding show
  wallet-connect availability plus explicit Enoki configuration guidance.
- AC2: With public Enoki env at build time, the provider registration path is
  enabled and passes typecheck/build.
- AC3: Login/onboarding/dashboard use dApp Kit account state rather than fake
  redirects or static signed-in flags.
- AC4: Onboarding cannot reach a final state claiming a namespace is live unless
  a real connected account exists; minting remains clearly pending.
- AC5: No page renders `ENOKI_PRIVATE_KEY` or any server-only secret.

## Constraints

- Use the installed legacy `@mysten/dapp-kit@0.16.16` package shape unless the
  repo intentionally upgrades dependencies in a separate slice.
- `NEXT_PUBLIC_*` values used in client code are build-time public values in
  Next.js; do not treat them as server secrets.
- Keep hosted mutations honest: no fake transaction success states.

## Stories Needed

- User connects or sees missing configuration on `/login`.
- User enters onboarding and sees account state plus pending mint steps.
- User opens hosted `/dashboard` and sees whether they are connected.

## Open Questions

- Which OAuth providers beyond Google should be configured first?
- Should the next slice implement a server-driven runtime config endpoint to
  avoid build-time public Enoki config coupling?

## Source References

- `.thoughts/research/2026-06-17-hosted-auth-readiness.md`
- `apps/hosted-dashboard/app/login/page.tsx`
- `apps/hosted-dashboard/app/onboarding/page.tsx`
- `apps/hosted-dashboard/app/dashboard/page.tsx`
- Context7 `/websites/enoki_mystenlabs`
- Context7 `/websites/sdk_mystenlabs_dapp-kit`
- Context7 `/vercel/next.js/v15.1.8`
