# Reality Research: Walrus Sites Deploy Readiness

## Scope

Current reality for deploying `apps/hosted-dashboard` as a Walrus Sites mirror.
This focuses on the deploy script, GitHub workflow, static export boundary, and
official CLI shape.

## Sources Checked

- `scripts/deploy-walrus-sites.sh`
- `.github/workflows/deploy-walrus-sites.yml`
- `apps/hosted-dashboard/next.config.mjs`
- `apps/hosted-dashboard/package.json`
- `apps/hosted-dashboard/walrus-sites/README.md`
- `apps/hosted-dashboard/walrus-sites/sites-config.yaml`
- `docs/05-our-architecture/06-dashboard/README.md`
- `docs/05-our-architecture/06-dashboard/purpose-local-vs-hosted.md`
- `docs/05-our-architecture/06-dashboard/walrus-sites-mirror.md`
- `docs/01-sui-ecosystem/walrus-deep-dive.md`
- Context7 `/mystenlabs/walrus` docs for Walrus Sites deploy.
- Context7 `/vercel/next.js/v15.1.11` docs for App Router static parameters
  and static route behavior.
- Command probes:
  - `mise exec -- pnpm --filter @onemem/hosted-dashboard build`
  - `mise exec -- pnpm --filter @onemem/hosted-dashboard exec next export -o out`

## Verified Facts

- The current deploy script is a no-op skeleton. It prints
  `deploy-walrus-sites: skeleton` and exits successfully without checking build
  output or calling `site-builder`.
- Official Walrus docs show the deploy command as
  `site-builder deploy --epochs <NUMBER> <DIRECTORY>` and examples also use
  `site-builder --context=<network> deploy --epochs <N> <dist>`.
- Official Walrus docs explicitly warn that the deploy directory must be the
  built output directory, not the repository root.
- The hosted dashboard production build succeeds.
- The hosted dashboard build output includes a mix of static pages and dynamic
  server-rendered pages/API routes.
- `next export -o out` is not a valid command path in the current installed
  Next.js; the command fails with `unknown option '-o'`.
- The GitHub Walrus Sites workflow currently runs
  `pnpm build && pnpm exec next export -o out`, so its static-export step is
  known broken before any Walrus deploy can happen.
- The public `/verify/[session_id]`, `/share`, and `/share/[capability_id]`
  hosted pages are currently force-dynamic/server-backed and are not a complete
  static Walrus mirror.

## Inferences

- The safe near-term fix is to replace the no-op deploy script with a real
  preflight/deploy wrapper that validates a static artifact directory and calls
  `site-builder` only when the artifact exists.
- The workflow should stop calling the invalid `next export -o out` command.
- The docs should keep live deploy evidence pending and distinguish deploy
  tooling readiness from a full static mirror.

## Unknowns And Questions

- Whether the final Walrus mirror should be a full static rewrite, a smaller
  public verifier shell, or a server-hosted app plus Walrus fallback page remains
  a product/architecture decision.
- Whether the runner has `site-builder` installed and a funded Sui/WAL account is
  unknown until the manual deployment environment is configured.

## Not Included

- No live Walrus Sites deployment.
- No SuiNS domain mapping.
- No rewrite of dynamic hosted routes into browser-only static pages.
