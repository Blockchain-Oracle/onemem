# Reality Research: Dashboard Status Refresh

## Scope

Audit current-facing dashboard status docs for stale implementation claims after
the recent hosted dashboard, public verifier, share, and local dashboard slices.
This is limited to status truth and routing guidance, not new dashboard behavior.

## Sources Checked

- `docs/05-our-architecture/06-dashboard/README.md`
- `docs/05-our-architecture/06-dashboard/purpose-local-vs-hosted.md`
- `docs/05-our-architecture/06-dashboard/data-flow.md`
- `packages/dashboard/app/`
- `apps/hosted-dashboard/app/`
- `apps/hosted-dashboard/app/api/`
- `.thoughts/wiki/context-engineering-status.md`

## Verified Facts

- `docs/05-our-architecture/06-dashboard/README.md` still marks these as
  pending: scaffold/dApp Kit/SSE, `/`, `/memories`, `/apps`, `/trace/[id]`,
  `/sessions/[id]`, `/settings`, `/login`, `/cli-login`, `/onboarding`,
  `/verify/[session_id]`, local deploy, and hosted deploy.
- Current local dashboard route files exist under `packages/dashboard/app/` for
  `/`, `/memories`, `/apps`, `/trace/[session_id]`, `/sessions`, `/settings`,
  and `/share`.
- Current local dashboard API files exist under `packages/dashboard/app/api/`
  for decrypt, memories, overview, runtimes, and stream.
- Current hosted route files exist under `apps/hosted-dashboard/app/` for
  `/login`, `/cli-login`, `/onboarding`, `/dashboard`, `/share`,
  `/share/[capability_id]`, and `/verify/[session_id]`.
- Current hosted API files exist under `apps/hosted-dashboard/app/api/` for
  Enoki status, CLI-login lookup, sponsored onboarding prepare/execute,
  sponsored share prepare/execute, and share history.
- `purpose-local-vs-hosted.md` already has a more current implementation-status
  table than the dashboard README.
- `.thoughts/wiki/context-engineering-status.md` lists Event-backed Share
  History in the immediate queue, but not yet in the main latest-product-slice
  narrative.

## Inferences

- The dashboard README table is current-facing enough to misroute future agents
  even though its header says the file is partly historical.
- A structure guard can cheaply prevent the dashboard README from claiming the
  already-built route set is still pending.

## Unknowns And Questions

- Walrus Sites mirror deploy remains marked pending in current docs; no current
  evidence was found in this audit proving a deployed mirror, so that should not
  be flipped to built.
- Live wallet-popup execution remains outside this docs cleanup.

## Not Included

- No product behavior changes.
- No live Sui, wallet, Enoki, or browser-popup verification.
- No rewrite of historical design sections beyond the stale status table.
