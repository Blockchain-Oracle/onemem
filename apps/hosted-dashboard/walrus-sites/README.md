# Walrus Sites mirror — apps/hosted-dashboard

Decentralized Walrus Sites deploy surface for `app.onemem.ai` fallback work.
The current checked-in artifact is a small public verifier shell, not the full
hosted dashboard.

## Why this exists

Per `docs/05-our-architecture/06-dashboard/walrus-sites-mirror.md`:
- Trust narrative — the verifiable-memory product should ship on verifiable infrastructure where possible
- Resilience — `app.onemem.ai` could go down (Vercel outage, DNS issue, account suspension); Walrus Sites URL still works
- The public `/verify/[session_id]` page is the most important surface to mirror — anyone can verify chain integrity even if the centralized host is unreachable

## Current boundary

The deploy wrapper is real and now defaults to a checked-in static artifact:
`apps/hosted-dashboard/walrus-sites/verifier`.

That artifact verifies a OneMem `TraceSession` directly in the browser through
public Sui JSON-RPC. It recomputes the Merkle root from
`ActionCallEmittedEvent` rows and shows the proof boundary.

The full hosted dashboard is still not a complete static Walrus mirror. It has
server-backed API routes and force-dynamic hosted pages. Do not claim a full
dashboard mirror until those routes have static/browser-side replacements and a
live `site-builder` deployment returns a Walrus URL.

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

The GitHub Action has the same static-artifact preflight:

```bash
gh workflow run deploy-walrus-sites.yml \
  --field epochs=26 \
  --field context=mainnet \
  --field dist=apps/hosted-dashboard/walrus-sites/verifier
```

## After deploy

The script prints the `site-builder` result, including the Walrus Sites object
and browsable URL when deployment succeeds. Optionally pair that object with a
SuiNS name such as `onemem.wal.app` after the first deploy.

## Cost

Walrus storage is paid in WAL tokens per epoch. 26 epochs ≈ 6 months. Refresh by re-running the deploy.
