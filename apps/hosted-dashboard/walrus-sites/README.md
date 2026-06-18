# Walrus Sites mirror — apps/hosted-dashboard

Decentralized mirror deploy of `app.onemem.ai`. Same build artifacts; deployed via Walrus Sites for censorship-resistance + as fallback if Vercel is down.

## Why this exists

Per `docs/05-our-architecture/06-dashboard/walrus-sites-mirror.md`:
- Trust narrative — the verifiable-memory product should ship on verifiable infrastructure where possible
- Resilience — `app.onemem.ai` could go down (Vercel outage, DNS issue, account suspension); Walrus Sites URL still works
- The public `/verify/[session_id]` page is the most important surface to mirror — anyone can verify chain integrity even if the centralized host is unreachable

## Current boundary

The deploy wrapper is real, but the hosted dashboard is not yet a complete
static Walrus mirror. The app currently has server-backed API routes and
force-dynamic pages for public verify/share. The script therefore expects a
prebuilt static artifact directory and fails loudly if `out/index.html` is
missing.

Do not use `next export -o out`; that command path is invalid for the current
Next.js toolchain in this repo.

## Deploy a prepared static artifact

```bash
bash scripts/deploy-walrus-sites.sh
```

Or validate without deploying:

```bash
bash scripts/deploy-walrus-sites.sh --check --dist apps/hosted-dashboard/out
```

The GitHub Action has the same static-artifact preflight:

```bash
gh workflow run deploy-walrus-sites.yml --field epochs=26 --field context=mainnet --field dist=apps/hosted-dashboard/out
```

## After deploy

The script prints the `site-builder` result, including the Walrus Sites object
and browsable URL when deployment succeeds. Optionally pair that object with a
SuiNS name such as `onemem.wal.app` after the first deploy.

## Cost

Walrus storage is paid in WAL tokens per epoch. 26 epochs ≈ 6 months. Refresh by re-running the deploy.
