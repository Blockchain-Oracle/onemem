# @onemem/dashboard

Next.js 15 standalone dashboard. Same code serves the local launch
(`localhost:4040` via `onemem dashboard` or the package binary
`onemem-dashboard`) and is wrapped by `apps/hosted-dashboard/` for
`app.onemem.ai`.

**Publication note, 2026-06-18:** `@onemem/dashboard@0.1.1` is current on npm
after `pnpm registry:status --strict`. Re-run that command before making a fresh
public install claim.

**Read first:** `docs/05-our-architecture/06-dashboard/purpose-local-vs-hosted.md` for the authoritative local-vs-hosted purpose split.

See also: `docs/05-our-architecture/06-dashboard/ui-architecture.md` for routes + state mgmt + data fetching.
