# Reality Research: Hosted Auth Readiness

## Scope

Research the current hosted dashboard auth/onboarding state and the current
Enoki/dApp Kit integration path needed before hosted share/revoke or sponsored
onboarding mutations can be implemented honestly.

## Sources Checked

- Current hosted app:
  - `apps/hosted-dashboard/app/layout.tsx`
  - `apps/hosted-dashboard/app/login/page.tsx`
  - `apps/hosted-dashboard/app/onboarding/page.tsx`
  - `apps/hosted-dashboard/app/dashboard/page.tsx`
  - `apps/hosted-dashboard/app/api/enoki/status/route.ts`
  - `apps/hosted-dashboard/package.json`
- Installed package declarations:
  - `apps/hosted-dashboard/node_modules/@mysten/dapp-kit/package.json`
  - `apps/hosted-dashboard/node_modules/@mysten/dapp-kit/dist/esm/index.d.ts`
  - `apps/hosted-dashboard/node_modules/@mysten/enoki/package.json`
  - `apps/hosted-dashboard/node_modules/@mysten/enoki/dist/esm/index.d.ts`
  - `apps/hosted-dashboard/node_modules/@mysten/enoki/dist/esm/react.d.ts`
- Project docs:
  - `docs/01-sui-ecosystem/enoki-zklogin.md`
  - `docs/05-our-architecture/06-dashboard/purpose-local-vs-hosted.md`
  - `apps/hosted-dashboard/README.md`
- Context7:
  - `/websites/enoki_mystenlabs`
  - `/websites/sdk_mystenlabs_dapp-kit`
  - `/vercel/next.js/v15.1.8`
- Web:
  - Mysten Enoki typedoc/search result:
    `https://sdk.mystenlabs.com/typedoc/modules/_mysten_enoki.html`
  - Mysten dApp Kit legacy docs/search result:
    `https://sdk.mystenlabs.com/dapp-kit/legacy`
  - Next.js environment variables docs/search result:
    `https://nextjs.org/docs/app/guides/environment-variables`

## Verified Facts

- Hosted `/login` is a local-only placeholder. Both "Continue with Google" and
  "Connect a Sui wallet" set local busy state and redirect to `/onboarding`;
  neither calls Enoki nor dApp Kit.
- Hosted `/onboarding` is a local wizard. It says it will mint a
  MemWalAccount/namespace via Enoki sponsored transaction, but it only advances
  React state and renders static command text.
- Hosted `/dashboard` uses `NEXT_PUBLIC_ONEMEM_SIGNED_IN === "1"` as a static
  config gate. It does not inspect wallet/account state.
- Root hosted layout does not wrap children in dApp Kit providers and does not
  register Enoki wallets.
- `apps/hosted-dashboard/app/api/enoki/status/route.ts` checks
  `ENOKI_PRIVATE_KEY` against Enoki's app endpoint and reports provider/origin
  readiness; it does not create a browser session.
- Installed hosted dependencies are `@mysten/dapp-kit@0.16.16`,
  `@mysten/enoki@0.6.20`, and `@mysten/sui@2.17.0`.
- Installed `@mysten/enoki@0.6.20` exports `registerEnokiWallets`,
  `isEnokiNetwork`, `EnokiClient`, and deprecated React hooks. Its
  `react.d.ts` marks `EnokiFlowProvider`, `useEnokiFlow`, `useZkLogin`, and
  `useZkLoginSession` as deprecated in favor of `registerEnokiWallets` and
  dApp Kit wallet hooks.
- Installed `@mysten/dapp-kit@0.16.16` exports `SuiClientProvider`,
  `WalletProvider`, `ConnectButton`, `createNetworkConfig`,
  `useCurrentAccount`, `useCurrentWallet`, and wallet transaction hooks.
- dApp Kit's README for this installed package requires a
  `QueryClientProvider`, `SuiClientProvider`, and `WalletProvider`, plus CSS
  import from `@mysten/dapp-kit/dist/index.css`.
- Context7 Enoki docs show `registerEnokiWallets({ apiKey, providers, client,
  network })` rendered before `WalletProvider`, and dApp Kit hooks such as
  `useSignAndExecuteTransaction` for transactions.
- Context7 Next.js docs state that `NEXT_PUBLIC_*` values are exposed to the
  browser and inlined into the client bundle during `next build`; server runtime
  environment values should be read from dynamic server rendering or routes.

## Inferences

- The safe next implementation slice is hosted auth readiness, not hosted
  sponsored minting. Provider wiring and real connect/account state can be
  implemented without minting Sui objects or fabricating sessions.
- Hosted onboarding copy should stop claiming that account/namespace minting
  has happened until real sponsored transaction routes exist.
- Because the hosted app uses legacy `@mysten/dapp-kit`, implementation should
  use the installed provider stack, not the newer `@mysten/dapp-kit-react`
  package shown in current migration docs.

## Unknowns And Questions

- Final Enoki public env names are not fully standardized in the repo. Existing
  docs mention `NEXT_PUBLIC_ENOKI_API_KEY`; the current status route uses
  `ENOKI_PRIVATE_KEY`; provider registration additionally needs provider client
  IDs, at minimum Google.
- No backend route currently mints a MemWalAccount, namespace, or delegate
  credential from a hosted signed-in account.
- No durable hosted browser session/cookie model exists yet.

## Not Included

- No owner-driven revoke design; the current contract supports holder
  self-revoke only.
- No real sponsored transaction implementation.
- No OAuth provider setup in the Enoki portal.
