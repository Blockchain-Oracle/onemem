# Verification Audit: Hosted Auth Readiness

## Verdict

Pass.

The hosted app now has real dApp Kit provider wiring, optional Enoki wallet
registration when public config is present, honest connected-account UI, and
browser smoke coverage for the disconnected/missing-config path. Sponsored
MemWalAccount or namespace minting remains intentionally out of scope and is
now labeled as pending instead of simulated.

## Artifacts Checked

- Research:
  `.thoughts/research/2026-06-17-hosted-auth-readiness.md`
- Spec:
  `.thoughts/specs/2026-06-17-hosted-auth-readiness.md`
- Stories:
  `.thoughts/stories/2026-06-17-hosted-auth-readiness.md`
- Plan:
  `.thoughts/plans/2026-06-17-hosted-auth-readiness.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`
- Implementation:
  `apps/hosted-dashboard/components/HostedProviders.tsx`
  `apps/hosted-dashboard/app/layout.tsx`
  `apps/hosted-dashboard/app/login/page.tsx`
  `apps/hosted-dashboard/app/onboarding/page.tsx`
  `apps/hosted-dashboard/app/dashboard/page.tsx`
  `apps/hosted-dashboard/app/globals.css`
  `apps/hosted-dashboard/app/icon.svg`
  `apps/hosted-dashboard/scripts/browser-smoke.mjs`
  `apps/hosted-dashboard/package.json`
  `pnpm-lock.yaml`
  `tests/structure.test.ts`

## Requirement Traceability

- R1: `HostedProviders` wraps hosted routes with `QueryClientProvider`,
  `SuiClientProvider`, and `WalletProvider`; `app/layout.tsx` imports dApp Kit
  CSS and wraps all hosted pages.
- R2: `HostedProviders` calls `registerEnokiWallets` only when
  `NEXT_PUBLIC_ENOKI_API_KEY` and a Google client ID are present.
- R3: `useHostedAuthConfig` exposes missing public Enoki config; `/login`,
  `/onboarding`, and `/dashboard` render visible missing-config guidance.
- R4: `/login` renders dApp Kit `ConnectButton`, `useCurrentAccount`, and
  `useCurrentWallet` status instead of redirect-only placeholder buttons.
- R5: `/onboarding` gates the first step on `useCurrentAccount` and labels
  provisioning as pending until sponsored transaction routes exist.
- R6: `/dashboard` reads `useCurrentAccount`; disconnected users see a connect
  prompt, while public verification remains linked without account state.
- R7: No client code reads `ENOKI_PRIVATE_KEY`; client registration uses only
  `NEXT_PUBLIC_*` values, which are public by Next.js design.
- R8: Hosted browser smoke coverage and the Context Engineering artifacts are
  registered in `tests/structure.test.ts`.

## Acceptance Criteria Coverage

- AC1: Passed. Default hosted build succeeded without public Enoki env, and
  browser smoke verified login/onboarding/dashboard missing-config guidance.
- AC2: Passed. Build succeeded with
  `NEXT_PUBLIC_ENOKI_API_KEY=public-smoke` and
  `NEXT_PUBLIC_ENOKI_GOOGLE_CLIENT_ID=google-smoke`, exercising the configured
  registration path at compile/build time.
- AC3: Passed. Login, onboarding, and dashboard all use dApp Kit account hooks.
  The previous fake redirects/static signed-in flag are not used for these
  pages.
- AC4: Passed. Onboarding cannot advance from the account step while
  disconnected and no longer claims namespace minting completed.
- AC5: Passed by code inspection. The changed client files do not reference
  `ENOKI_PRIVATE_KEY` or render server-only secret names/values.

## Quality Gates

- `pnpm --filter @onemem/hosted-dashboard lint` passed.
- `pnpm --filter @onemem/hosted-dashboard typecheck` passed.
- `pnpm --filter @onemem/hosted-dashboard build` passed.
- `NEXT_PUBLIC_ENOKI_API_KEY=public-smoke NEXT_PUBLIC_ENOKI_GOOGLE_CLIENT_ID=google-smoke pnpm --filter @onemem/hosted-dashboard build`
  passed.
- `pnpm --filter @onemem/hosted-dashboard browser:smoke` passed 13 checks and
  wrote
  `apps/hosted-dashboard/.browser-smoke/hosted-auth-readiness.png`.

## Deviations From Plan

- The hosted app imports `@mysten/dapp-kit/dist/index.css` from
  `app/layout.tsx` instead of `globals.css`; Next.js package export resolution
  rejected the CSS `@import`, while the TypeScript layout import builds.
- `getFullnodeUrl` was not available from the hosted app's installed
  `@mysten/sui/client` export shape, so the provider uses explicit Mysten
  fullnode URLs for testnet, mainnet, and devnet.
- `registerEnokiWallets` receives the dApp Kit client through a narrow cast
  because the installed dApp Kit and Enoki packages bring separate
  `@mysten/sui` type identities.

## Gaps And Risks

- Real Google OAuth could not be completed in automated smoke because this
  needs live Enoki portal configuration and browser identity flow.
- Sponsored onboarding remains unimplemented by design; the next slice needs a
  real server-side route and transaction policy before hosted namespace minting
  can be claimed.
- Next build/dev emits a non-fatal `localStorage is not available because
  --localstorage-file was not provided` warning while prerendering dApp Kit
  pages.
- Next dev smoke emits a future `allowedDevOrigins` warning because the smoke
  browser uses `127.0.0.1` while Next reports `localhost`; no request failed.

## Follow-ups

- Implement real sponsored transaction routes for hosted account/namespace
  provisioning.
- Decide the durable hosted session model after wallet connection.
- Configure Enoki OAuth providers in the deployment environment and manually
  test Google wallet connection against testnet.
- Consider adding `allowedDevOrigins` to hosted Next config if the warning
  becomes noisy or blocking in a future Next release.

## Evidence Log

- Context7 research was run for `/websites/enoki_mystenlabs`,
  `/websites/sdk_mystenlabs_dapp-kit`, and `/vercel/next.js/v15.1.8`.
- Web research checked Mysten Enoki typedoc, Mysten dApp Kit legacy docs, and
  Next.js environment variable docs.
- Hosted lint/typecheck/build commands passed after import cleanup.
- Hosted configured build passed with public smoke env values.
- Hosted browser smoke started Next dev on port 4056, loaded `/login`,
  `/onboarding`, and `/dashboard`, verified 13 checks, and saw no failed
  resource responses or browser console errors.
