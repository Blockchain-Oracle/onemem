# Walrus Sites mirror — apps/hosted-dashboard

Decentralized Walrus Sites deploy surface for `app.onemem.xyz` fallback work —
so the OneMem dashboard can be served from Walrus even if the centralized host is
unreachable.

## Why this exists

Per `docs/05-our-architecture/06-dashboard/walrus-sites-mirror.md`:
- Decentralization narrative — OneMem's owned-memory product should be able to
  ship on decentralized infrastructure (Walrus Sites) where possible.
- Resilience — `app.onemem.xyz` could go down (Vercel outage, DNS issue, account
  suspension); a Walrus Sites URL still works.
- The memory dashboard is the surface to mirror so users can reach their owned
  memory even when the centralized host is down.

## Current boundary

The deploy wrapper is real. The full hosted dashboard is not yet a complete
static Walrus mirror — it has server-backed API routes and force-dynamic hosted
pages. Do not claim a full dashboard mirror until those routes have
static/browser-side replacements and a live `site-builder` deployment returns a
Walrus URL.

> **Stale artifact (Phase 4/5):** the checked-in `walrus-sites/verifier/` static
> shell is leftover from a dropped direction and does NOT reflect the product
> (OneMem = decentralized memory, not a verifier). It is slated to be replaced by
> a static dashboard mirror in the Phase 4/5 dashboard work; do not treat it as a
> current OneMem surface or build on it.

Do not use `next export -o out`; that command path is invalid for the current
Next.js toolchain in this repo.

## Deploy a prepared static artifact

```bash
bash scripts/deploy-walrus-sites.sh
```

Or validate without deploying:

```bash
bash scripts/deploy-walrus-sites.sh --check
```

The GitHub Action has the same static-artifact preflight (point `--field dist`
at the static dashboard mirror once it exists).

## After deploy

The script prints the `site-builder` result, including the Walrus Sites object
and browsable URL when deployment succeeds. Optionally pair that object with a
SuiNS name such as `onemem.wal.app` after the first deploy.

## Cost

Walrus storage is paid in WAL tokens per epoch. 26 epochs ≈ 6 months. Refresh by re-running the deploy.
