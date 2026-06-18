# Verification Audit: Vercel Public Deployment

Date: 2026-06-18

## Verdict

Conditional pass. Landing and hosted-dashboard are deployed publicly on Vercel
from commit `3bc029b`, return HTTP 200 without deployment protection, and were
visually verified in Chrome. Public trace verification works against a real
testnet `TraceSession`.

The condition is explicit: custom DNS resolution, docs hosting, and hosted
wallet sign-in are not claimed here.

## Artifacts Checked

- `.thoughts/wiki/context-engineering-status.md`
- `.thoughts/quality/2026-06-17-project-quality-profile.md`
- `apps/landing/app/page.tsx`
- `apps/hosted-dashboard`
- `packages/dashboard/next.config.mjs`
- `package.json`
- `scripts/install-lefthook-if-git.mjs`
- `turbo.json`
- `.gitignore`
- Vercel projects:
  - `blockchain-oracles-projects/onemem-landing`
  - `blockchain-oracles-projects/onemem-hosted-dashboard`

## Requirement Traceability

- Deploy landing publicly on Vercel:
  `https://onemem-landing.vercel.app`, deployment
  `dpl_CCv7niRngx6i4bxMkNHdFnzs6gix`, target `production`, `READY`.
- Deploy hosted-dashboard publicly on Vercel:
  `https://onemem-hosted-dashboard.vercel.app`, deployment
  `dpl_44mdoHzwajxmguvm5anTBCNZY4zy`, target `production`, `READY`.
- Attach custom domains for DNS cutover:
  Vercel accepted `onemem.xyz` on `onemem-landing` and `app.onemem.xyz` on
  `onemem-hosted-dashboard`, but both require DNS changes before they resolve.
- Landing CTAs must not route users to local development:
  Chrome DOM check found `hostedLinks: 5` and `localhostLinks: 0`.
- Hosted public verifier must work without login:
  `https://onemem-hosted-dashboard.vercel.app/verify/0x6ceaab0fe2961043d490326960dfd192e43c25ed655772d42c04c265ad3ec080`
  renders "This trace is verified.", `Root match: yes`, `Evidence rows: 1 / 1`,
  and a Suiscan testnet link.
- Vercel build should follow monorepo constraints:
  root `prepare` now skips Lefthook when Vercel builds outside a git worktree;
  `turbo.json` declares Vercel build env inputs; dashboard typed routes use the
  stable Next.js `typedRoutes` key.

## Acceptance Criteria Coverage

- Public HTTP:
  `curl -I -L https://onemem-landing.vercel.app` returned HTTP 200.
- Public hosted HTTP:
  `curl -I -L https://onemem-hosted-dashboard.vercel.app` returned HTTP 200.
- Landing content:
  HTML title is "OneMem - Decentralized persistent memory for AI agents" and
  CTAs point to `https://onemem-hosted-dashboard.vercel.app`.
- Hosted verifier:
  Curl and Chrome both show the real testnet session as verified with matching
  expected and computed roots.
- Chrome visual pass:
  landing, hosted home, and verifier pages were opened through the Codex Chrome
  plugin. Console error logs were empty for all three tabs.
- Enoki status:
  `/api/enoki/status` returned `ok: true` and `keyValid: true`, but
  `signInReady: false` with `authProviders: 0` and `allowedOrigins: 0`.

## Quality Gates

- `mise exec -- pnpm --filter @onemem/landing lint`
- `mise exec -- pnpm --filter @onemem/landing typecheck`
- `mise exec -- pnpm --filter @onemem/landing build`
- `mise exec -- pnpm --filter @onemem/dashboard lint`
- `mise exec -- pnpm --filter @onemem/dashboard typecheck`
- `mise exec -- pnpm --filter @onemem/dashboard build`
- `mise exec -- pnpm test:structure` passed `427/427`.
- Vercel hosted-dashboard build passed with 3 successful Turbo tasks.
- Vercel landing build passed with 1 successful Turbo task.

## Deviations From Plan

- Production deploys are proven on Vercel project domains. Vercel custom domain
  records are attached, but DNS for `onemem.xyz`, `app.onemem.xyz`, and
  `docs.onemem.xyz` is still unverified.
- `apps/docs` was not deployed to Vercel. The docs app is still treated as a
  separate docs-hosting/Mintlify lane.
- Hosted wallet sign-in was not claimed. The Enoki server key validates, but
  Enoki auth providers and allowed origins are not configured yet.

## Gaps And Risks

- Custom domain/DNS cutover remains pending. Vercel requested:
  `A onemem.xyz 76.76.21.21` and `A app.onemem.xyz 76.76.21.21`.
- Enoki portal configuration remains pending before hosted wallet popup flows
  can be honestly claimed.
- The Vercel build still emits pnpm's dependency approved-builds warning. The
  builds pass, and this audit does not change the repo's dependency script
  approval policy.
- Live trusted Codex/Claude hook sessions emitting on-chain traces remain
  separate proof work.

## Follow-ups

- Configure and verify custom domains for landing and hosted dashboard.
- Configure Enoki auth provider/client ID and allowed origins, then repeat live
  hosted wallet popup tests.
- Decide docs hosting path and deploy docs separately.
- Evaluate pnpm approved-builds policy deliberately instead of approving
  dependency scripts opportunistically during deploy work.

## Evidence Log

- Hosted production deployment:
  `https://vercel.com/blockchain-oracles-projects/onemem-hosted-dashboard/44mdoHzwajxmguvm5anTBCNZY4zy`
- Landing production deployment:
  `https://vercel.com/blockchain-oracles-projects/onemem-landing/CCv7niRngx6i4bxMkNHdFnzs6gix`
- Public landing URL:
  `https://onemem-landing.vercel.app`
- Public hosted URL:
  `https://onemem-hosted-dashboard.vercel.app`
- Public verifier URL:
  `https://onemem-hosted-dashboard.vercel.app/verify/0x6ceaab0fe2961043d490326960dfd192e43c25ed655772d42c04c265ad3ec080`
- Vercel custom-domain setup output:
  `onemem.xyz` and `app.onemem.xyz` were added, but both reported "not
  configured properly" until DNS points at `76.76.21.21` or Vercel nameservers.
