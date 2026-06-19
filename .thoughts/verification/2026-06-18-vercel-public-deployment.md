# Verification Audit: Vercel Public Deployment

Date: 2026-06-18

## Verdict

Conditional pass. `https://onemem.xyz` and `https://app.onemem.xyz` are live,
public, Cloudflare-fronted Vercel deployments. Landing CTAs now route to
`https://app.onemem.xyz`, not the Vercel project URL. The hosted dashboard hub
no longer links to root-level local-dashboard routes that 404 in the hosted
shell. The public verifier works against a real testnet `TraceSession`.

The condition is explicit: Enoki Google sign-in is not ready because the Enoki
app has zero auth providers and zero allowed origins, and the production project
does not have the public Enoki/Google client env configured. The UI now says
that in user-friendly copy; `/api/enoki/status` keeps the detailed diagnostic.
The latest hosted deployment also reuses saved namespace/Admin/ReadWrite
provisioning state, so returning wallet users are not pushed into duplicate
namespace creation by default.

## Artifacts Checked

- `apps/landing/app/page.tsx`
- `apps/hosted-dashboard/app/dashboard/page.tsx`
- `apps/hosted-dashboard/app/login/page.tsx`
- `apps/hosted-dashboard/app/onboarding/page.tsx`
- `apps/hosted-dashboard/app/share/HostedShareView.tsx`
- `apps/hosted-dashboard/scripts/browser-smoke.mjs`
- `packages/cli-ts/src/commands/login.ts`
- `packages/cli-ts/src/index.ts`
- `packages/dashboard/app/share/ShareView.tsx`
- `tests/structure/plugins-apps.test.ts`
- Vercel projects:
  - `blockchain-oracles-projects/onemem-landing`
  - `blockchain-oracles-projects/onemem-hosted-dashboard`

## Requirement Traceability

- Landing deployed publicly:
  `dpl_7QVMXfRcGiH4nTus31KWUBCYNbHK`, aliased to `https://onemem.xyz`.
- Hosted dashboard deployed publicly:
  `dpl_BtEdipDexSrxYPgYniqWiJ7ZGvU7`, aliased to `https://app.onemem.xyz`.
- Landing app URL:
  Vercel production env `NEXT_PUBLIC_ONEMEM_APP_URL` was overwritten to
  `https://app.onemem.xyz`; live HTML only exposes that app URL.
- Hosted app routes:
  `/`, `/dashboard`, `/login`, `/onboarding`, `/share`,
  `/cli-login?nonce=test-nonce&port=43210`, and the real `/verify/<session-id>`
  route all returned HTTP 200.
- Hosted dashboard hub:
  Cards now link only to hosted-served routes: `/dashboard`, `/share`,
  `/onboarding`, `/login`, and a real public verifier sample.
- CLI login default:
  `onemem login --no-open --timeout 1` opens
  `https://app.onemem.xyz/cli-login?...`.

## Acceptance Criteria Coverage

- `curl -I -L https://onemem.xyz` returned HTTP 200 with Cloudflare and Vercel
  headers.
- `curl -I -L https://app.onemem.xyz` returned HTTP 200 with Cloudflare and
  Vercel headers.
- `curl -sS -L https://onemem.xyz` found only `https://app.onemem.xyz` app
  links, with no `onemem-hosted-dashboard.vercel.app` CTA target.
- `curl` route checks returned HTTP 200 for the intended hosted routes listed
  above.
- Chrome visual check:
  - Landing rendered correctly and CTAs pointed to `https://app.onemem.xyz`.
  - Hosted `/dashboard` rendered with no broken root local-dashboard links.
  - Hosted `/login` rendered friendly Google-unavailable copy without raw
    `NEXT_PUBLIC_*` env names.
  - Hosted public verifier rendered "This trace is verified.", root match yes,
    and a Suiscan testnet link.
- Clean Chrome console check:
  Fresh `/dashboard` and public verifier loads produced no app warnings or
  errors. Earlier dApp Kit modal interaction produced one non-blocking controlled
  dialog warning.
- Wallet fallback and Slush connection:
  The Chrome profile now has Slush configured. Production `/dashboard` displayed
  connected account `0x93b37bc1...d119d6`. Production `/onboarding` initially
  showed disconnected, then auto-connected to the same Slush account and enabled
  Continue. The sponsored onboarding prepare API returned a real testnet
  namespace-create transaction, and Slush opened a `sign-transaction` prompt for
  `app.onemem.xyz`. Browser automation cannot operate `chrome-extension://`
  pages directly, so the wallet signature itself remains pending on manual
  approval.
- Sui upgrade parser fix:
  After a live Slush-approved namespace-create transaction succeeded on testnet,
  the hosted execute route rejected it because Sui object types used the original
  package ID `0x64c14f...` while the parser expected current package ID
  `0xc2e839...`. The manifest now carries `original_package_id`, generated SDK
  address artifacts expose it, parser/event readers use it for type strings, and
  production deployment `dpl_697kAYJWnJQteUYXURrcTYj3foSA` is aliased to
  `https://app.onemem.xyz`. The deployed onboarding page now also disables
  Continue until provisioning has real IDs and exposes an app-side cancel path
  for stale wallet requests.

## Quality Gates

- `pnpm --filter @onemem/landing typecheck` passed.
- `pnpm --filter @onemem/landing build` passed.
- `pnpm --filter @onemem/hosted-dashboard typecheck` passed.
- `pnpm --filter @onemem/hosted-dashboard build` passed after the final hosted
  copy/link changes.
- `pnpm --filter @onemem/cli typecheck` passed.
- `pnpm --filter @onemem/cli test` passed: 8 files, 54 tests.
- `pnpm test:structure` passed: 432 tests.
- Vercel landing production build passed with 1 successful Turbo task.
- Vercel hosted-dashboard production build passed with 3 successful Turbo tasks.
- Parser-fix Vercel hosted-dashboard production build passed with 3 successful
  Turbo tasks: deployment `dpl_6GTDf8iA2U9hQnAwzRtBLzGmenLU`.
- Parser/UX hardening Vercel hosted-dashboard production build passed with 3
  successful Turbo tasks: deployment `dpl_697kAYJWnJQteUYXURrcTYj3foSA`.
- Parser semantic fallback Vercel hosted-dashboard production build passed with
  3 successful Turbo tasks: deployment `dpl_EfEcJ5xcTVUEeQwGkKFEpV6x9nMg`,
  aliased to `https://app.onemem.xyz`.

## Deviations From Plan

- Google sign-in was not completed. The repo has `ENOKI_PRIVATE_KEY`, but not
  `NEXT_PUBLIC_ENOKI_API_KEY` or `NEXT_PUBLIC_ENOKI_GOOGLE_CLIENT_ID`, and the
  Enoki app API reports empty `authenticationProviders`, `allowedOrigins`, and
  `domains`.
- Sui wallet account connection is now partially verified through Slush:
  `/dashboard` and `/onboarding` can see the connected account. The live
  sponsored provisioning UI no longer advances without namespace/RW-cap receipts
  and no longer stays wedged after an app-side cancel. No namespace, delegate,
  share mint, or revoke mutation is claimed until the extension prompt is
  approved and the app reports transaction IDs.
- `apps/docs` is still not deployed to `docs.onemem.xyz`.

## Gaps And Risks

- Configure Enoki auth provider/client ID and allowed origins at the Enoki
  portal, then set the production public env vars and redeploy hosted-dashboard.
- Start a fresh Slush-backed hosted onboarding attempt, approve the
  `namespace-create` transaction, then approve the expected second `rw-cap-mint`
  prompt before claiming hosted onboarding end-to-end.
- Vercel builds still emit pnpm approved-builds warnings for dependency scripts.
  Builds pass; dependency script approval remains a separate policy decision.
- Docs hosting and docs-domain cleanup remain separate follow-up work.

## Evidence Log

- Landing deployment:
  `https://vercel.com/blockchain-oracles-projects/onemem-landing/7QVMXfRcGiH4nTus31KWUBCYNbHK`
- Hosted dashboard deployment:
  `https://vercel.com/blockchain-oracles-projects/onemem-hosted-dashboard/BtEdipDexSrxYPgYniqWiJ7ZGvU7`
- Hosted dashboard parser-fix deployment:
  `https://vercel.com/blockchain-oracles-projects/onemem-hosted-dashboard/6GTDf8iA2U9hQnAwzRtBLzGmenLU`
- Hosted dashboard parser/UX hardening deployment:
  `https://vercel.com/blockchain-oracles-projects/onemem-hosted-dashboard/697kAYJWnJQteUYXURrcTYj3foSA`
- Hosted dashboard parser semantic fallback deployment:
  `https://vercel.com/blockchain-oracles-projects/onemem-hosted-dashboard/EfEcJ5xcTVUEeQwGkKFEpV6x9nMg`
- Hosted dashboard onboarding saved-state deployment:
  `https://vercel.com/blockchain-oracles-projects/onemem-hosted-dashboard/5ntGx66kHTKGdqXLeSnofvsutX98`
- Public landing:
  `https://onemem.xyz`
- Public hosted dashboard:
  `https://app.onemem.xyz`
- Public verifier:
  `https://app.onemem.xyz/verify/0x6ceaab0fe2961043d490326960dfd192e43c25ed655772d42c04c265ad3ec080`
- Enoki status:
  `/api/enoki/status` returned `ok: true`, `keyValid: true`,
  `signInReady: false`, `authProviders: 0`, and `allowedOrigins: 0`.
