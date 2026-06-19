# Verification Audit: Production User Flow Audit

Date: 2026-06-18
Updated: 2026-06-19

## Verdict

Conditional pass. The public landing and hosted app are live on the custom
domains, the user-facing hosted routes load, and the namespace provisioning
parser bug reported from production has been fixed and deployed. The hosted
onboarding page now reuses a connected account's saved namespace/Admin/ReadWrite
capability state instead of prompting duplicate provisioning on every return.
The Enoki readiness endpoint was fixed and redeployed so production now reports
the exact missing public env vars, required origin, and portal/provider gaps
instead of the stale `enoki_public_*` placeholder. On 2026-06-19, the Enoki
public API key and Google OAuth Web client ID were added to local `.env` and
Vercel production, and production was redeployed. The live status endpoint now
reports Enoki Google sign-in ready after the Enoki Portal Google auth provider
was added.

The remaining conditions are explicit:

- Browser automation cannot approve Slush `chrome-extension://` transaction
  prompts. Any claim about fresh namespace/share/revoke side effects still needs
  manual wallet approval and visible transaction receipts.

## Artifacts Checked

- `apps/hosted-dashboard/app/dashboard/page.tsx`
- `apps/hosted-dashboard/app/api/enoki/status/route.ts`
- `apps/hosted-dashboard/app/cli-login/page.tsx`
- `apps/hosted-dashboard/app/login/page.tsx`
- `apps/hosted-dashboard/app/onboarding/page.tsx`
- `apps/hosted-dashboard/app/share/HostedShareView.tsx`
- `apps/hosted-dashboard/lib/hosted-state.ts`
- `apps/hosted-dashboard/lib/sponsored-provisioning.ts`
- `apps/hosted-dashboard/lib/sponsored-provisioning.test.ts`
- `packages/brand/video/onemem-demo/notes/live-proof-recording-pack.generated.md`
- `packages/brand/video/onemem-demo/scripts/generate-live-proof-recording-pack.mjs`
- `tests/structure/plugins-apps.test.ts`
- `https://onemem.xyz`
- `https://app.onemem.xyz`

## Requirement Traceability

- Landing CTAs point at `https://app.onemem.xyz`, not a Vercel preview URL.
- Hosted dashboard cards point only at routes served by the hosted shell.
- Hosted login uses user-friendly Google-unavailable copy without exposing raw
  `NEXT_PUBLIC_*` env names.
- Hosted `/api/enoki/status` exposes machine-readable production readiness:
  public env status, required origins, missing origins, and Google-provider
  presence.
- Hosted Enoki readiness is now also checkable from the repo through
  `pnpm --filter @onemem/hosted-dashboard run enoki:readiness --json`.
- Hosted sponsored provisioning now handles upgraded Sui package type strings by
  using `originalPackageId` and a narrow semantic fallback for OneMem namespace
  object shapes.
- Hosted onboarding now loads saved provisioning state for the connected account
  and active network through `loadHostedProvisioningState`.
- Hosted onboarding only shows the mutation button by default when no saved
  namespace/Admin/ReadWrite state exists. If state exists, it renders an
  "Already provisioned" receipt and a deliberate "Provision a new namespace"
  escape hatch.
- Hosted onboarding completion links to `/dashboard`, not `localhost:4040`.
- Hosted CLI login now uses the same app-side stale wallet-request boundary as
  onboarding: when a wallet request is pending, the page exposes
  `Cancel wallet request` and ignores late approvals from the old request.

## Acceptance Criteria Coverage

- `vercel inspect app.onemem.xyz` confirms production deployment
  `dpl_GXYFnN5DvQdMPCP3Ly3h75z92Xf2` is ready and aliased to
  `https://app.onemem.xyz`.
- Route checks returned HTTP 200 for:
  `/`, `/login`, `/onboarding`, `/dashboard`, `/share`, `/api/enoki/status`,
  and the real public verifier sample
  `/verify/0x6ceaab0fe2961043d490326960dfd192e43c25ed655772d42c04c265ad3ec080`.
- `/api/enoki/status` returned:
  `ok: true`, `keyValid: true`, `signInReady: true`, `authProviders: 1`,
  `allowedOrigins: 2`, `hasGoogleProvider: true`,
  `publicEnv.configured: true`, no missing public env vars, required origin
  `https://app.onemem.xyz`, and `missingOrigins: []`.
- `https://onemem.xyz` Chrome audit found no `vercel.app`, `localhost`, or
  `127.0.0.1` anchors; CTAs point to `https://app.onemem.xyz`.
- Live Chrome audits for `/login`, `/dashboard`, `/onboarding`, `/share`, and
  the sample `/verify/[session_id]` had no app console errors and no suspicious
  anchors.
- Chrome production audit showed the hosted dashboard connected to account
  `0x93b37bc1...d119d6` and a saved testnet namespace:
  `0x1363c4b1...5e23f9`.
- Chrome production onboarding on the latest deployment rendered:
  "Already provisioned on testnet", plus receipts for namespace
  `0x1363c4b1...5e23f9`, Admin cap `0x417e505a...aa0280`, and ReadWrite cap
  `0xecc760ed...790567`.
- Chrome production share view rendered saved capability history as 2/2 active:
  ReadWrite `0xecc760ed88...86790567` and Admin
  `0x417e505a4b...b8aa0280`.
- Chrome production public verifier rendered "This trace is verified.", root
  match yes, evidence rows 1/1, and a Suiscan testnet link.
- Live Chrome CLI-login audit with a temporary CLI HOME verified the real hosted
  pairing URL, connected Slush wallet `0x93b37bc1...d119d6`, active namespace
  `0x1363c4b1...5e23f9`, and MemWal account
  `0x76bf026a4d...e2940b04`.
- Live Chrome CLI-login delegate flow opened the real wallet-signing boundary,
  showed `Cancel wallet request`, returned to idle after cancel, and displayed
  `Wallet request cancelled. Any later approval for the old prompt will be ignored.`
- Live default-browser CLI-login rerun proved the OS/browser handoff now opens
  Chrome for `onemem login`. Chrome opened
  `/cli-login?nonce=51d21ce24dfcdc8dd8caf2a82e1af911&port=52119`, Slush approved
  the `account::add_delegate_key` transaction, the hosted page rendered
  "Pairing complete", and the CLI wrote validated credentials to the isolated
  temp HOME at
  `/tmp/onemem-cli-login-default-browser.LhDvOU/.onemem/credentials.json`.
  That temp HOME was removed after sanitized inspection so the delegate private
  key is not left on disk.
- Sanitized credential inspection confirmed testnet, owner
  `0x93b37bc1...d119d6`, MemWal account `0x76bf026a...940b04`, active namespace
  `0x1363c4b1...5e23f9`, delegate public key, registration digest, and
  2026-06-19 expiry. The delegate private key was not printed.
- CLI memory search with only the browser-login credential correctly reports
  `ONEMEM_EMBEDDING_API_KEY` missing. With only the repo `.env` embedding key
  added and delegate/account/package still coming from the login credential,
  `onemem --json search test --top-k 1` exited 0 with a valid redacted result
  shape.
- The app console was clean for the checked hosted app pages; extension-origin
  warnings were from unrelated browser extensions, not OneMem app code.
- Enoki Portal at `https://portal.enoki.mystenlabs.com/` loaded to the auth
  screen with "Sign in with Email" and "Sign in with Google"; no app/project
  configuration surface was accessible without signing in.
- The local `.env` now contains `ENOKI_PRIVATE_KEY`, file permissions are
  restricted to owner read/write, and the reusable Enoki readiness preflight
  confirms the private key can reach Enoki app metadata without printing secret
  values. The same preflight reports allowed origins
  `https://onemem.xyz` and `https://app.onemem.xyz`, the Enoki public API key
  and Google OAuth Web client ID present locally, and the Google provider
  present in Enoki metadata.
- Vercel production env now contains `NEXT_PUBLIC_ENOKI_API_KEY` and
  `NEXT_PUBLIC_ENOKI_GOOGLE_CLIENT_ID`. The live custom-domain endpoint reflects
  that env after deployment `dpl_TwJBMCFqT1gm82wEXi4JHdN3zMG9`.
- Google Cloud CLI is authenticated as `abubakrclouds@gmail.com` against
  project `project-9105c0b4-dfc1-4ee7-b22`, but the normal Google OAuth Web
  Client ID surface is in Cloud Console. Chrome reached the Cloud Console
  sign-in page, so no OAuth client ID was read or created from the browser in
  this pass.

## Quality Gates

- `pnpm --filter @onemem/hosted-dashboard run enoki:readiness --json
  --deployed-status-url https://app.onemem.xyz/api/enoki/status` passed as a
  non-strict diagnostic and reported `ok: true`.
- `pnpm --filter @onemem/hosted-dashboard run enoki:readiness --strict --json
  --deployed-status-url https://app.onemem.xyz/api/enoki/status` passed and
  reported local plus deployed Enoki readiness as `ok: true`.
- Chrome live check of `https://app.onemem.xyz/login` showed Enoki Google
  wallets registered for testnet, no "Google sign-in is not enabled" copy, and
  no browser console errors.
- `pnpm --filter @onemem/hosted-dashboard lint` passed.
- `node --import tsx --test tests/structure/plugins-apps.test.ts` passed:
  21 tests.
- `pnpm --filter @onemem/hosted-dashboard typecheck` passed.
- `pnpm --filter @onemem/hosted-dashboard test` passed: 41 tests.
- `pnpm --filter @onemem/hosted-dashboard build` passed.
- `pnpm test:structure` passed after the Enoki preflight and CLI-login model
  split: 442 tests.
- `git diff --check` passed for the touched hosted-dashboard/docs/structure
  files.
- `pnpm test:structure` passed after the production user-flow changes: 441
  tests.
- Vercel production build passed with 3 successful Turbo tasks for deployment
  `dpl_TwJBMCFqT1gm82wEXi4JHdN3zMG9`, which is live and aliased to
  `https://app.onemem.xyz`.
- Vercel production build passed with 3 successful Turbo tasks for deployment
  `dpl_6idCiYDeEKhZYehoXKzwEfGFbDJL`, which is live and aliased to
  `https://app.onemem.xyz`.
- Vercel production build passed with 3 successful Turbo tasks for deployment
  `dpl_6eymTySQEppgozZprPNxvNGjjfqY`, which is live and aliased to
  `https://app.onemem.xyz`.
- Vercel production build passed with 3 successful Turbo tasks for deployment
  `dpl_5ntGx66kHTKGdqXLeSnofvsutX98`.
- Vercel production build passed with 3 successful Turbo tasks for deployment
  `dpl_GXYFnN5DvQdMPCP3Ly3h75z92Xf2`.
- `npm run footage:recording-pack` regenerated the stale generated brand
  recording pack so the full structure gate's configured-Sui-RPC boundary
  assertion is satisfied.
- `packages/brand/media-kit/generate-media-kit.mjs` was split under the source
  line-count cap by extracting `media-kit-html.mjs`; the media kit was
  regenerated and the HTML proof-boundary section remains covered by structure
  tests.
- `pnpm --filter @onemem/cli lint` passed after the CLI memory-config message
  fix.
- `pnpm --filter @onemem/cli test` passed: 58 tests.
- `pnpm --filter @onemem/cli typecheck` passed.
- `pnpm --filter @onemem/cli build` passed.

## Deviations From Plan

- No fresh share, revoke, or duplicate namespace mutation was executed from the
  browser during this audit. Those are real wallet side effects and require user
  approval inside Slush.
- Enoki Google sign-in had been left unclaimed earlier because the Enoki Portal
  Google auth provider was missing. That provider is now present in live Enoki
  metadata.
- The Enoki diagnostic endpoint was improved and deployed, but that is a
  visibility fix only; it does not configure Google sign-in.
- The 2026-06-19 Enoki public-key/status-message update and Google client env
  update were redeployed to production. The final portal-side Google provider
  registration was then completed and verified through Enoki metadata.

## Gaps And Risks

- When a fresh side-effect proof is needed, approve the Slush prompts manually
  and verify the app displays the resulting transaction IDs instead of relying
  on preparation-only checks.
- Continue manual hosted checks for share execution and holder self-revoke
  before marking the entire wallet path done. CLI delegate registration has one
  live Chrome/default-browser proof as of 2026-06-18.

## Evidence Log

- Production deployment:
  `https://vercel.com/blockchain-oracles-projects/onemem-hosted-dashboard/TwJBMCFqT1gm82wEXi4JHdN3zMG9`
- Previous production deployment:
  `https://vercel.com/blockchain-oracles-projects/onemem-hosted-dashboard/6idCiYDeEKhZYehoXKzwEfGFbDJL`
- Previous production deployment:
  `https://vercel.com/blockchain-oracles-projects/onemem-hosted-dashboard/6eymTySQEppgozZprPNxvNGjjfqY`
- Previous production deployment:
  `https://vercel.com/blockchain-oracles-projects/onemem-hosted-dashboard/GXYFnN5DvQdMPCP3Ly3h75z92Xf2`
- Previous production deployment:
  `https://vercel.com/blockchain-oracles-projects/onemem-hosted-dashboard/5ntGx66kHTKGdqXLeSnofvsutX98`
- Public landing:
  `https://onemem.xyz`
- Public hosted dashboard:
  `https://app.onemem.xyz`
- Public verifier:
  `https://app.onemem.xyz/verify/0x6ceaab0fe2961043d490326960dfd192e43c25ed655772d42c04c265ad3ec080`
