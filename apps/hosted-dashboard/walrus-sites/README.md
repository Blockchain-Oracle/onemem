# Walrus Sites mirror — apps/hosted-dashboard

Decentralized mirror deploy of `app.onemem.ai`. Same build artifacts; deployed via Walrus Sites for censorship-resistance + as fallback if Vercel is down.

## Why this exists

Per `docs/05-our-architecture/06-dashboard/walrus-sites-mirror.md`:
- Trust narrative — the verifiable-memory product should ship on verifiable infrastructure where possible
- Resilience — `app.onemem.ai` could go down (Vercel outage, DNS issue, account suspension); Walrus Sites URL still works
- The public `/verify/[session_id]` page is the most important surface to mirror — anyone can verify chain integrity even if the centralized host is unreachable

## Deploy

```bash
bash scripts/deploy-walrus-sites.sh
```

Or via the GitHub Action: `gh workflow run deploy-walrus-sites.yml --field epochs=26`.

## After deploy

The script prints a `<hash>.wal.app` URL. Optionally pair with a Suins domain (`onemem.wal.app`) — set `domain:` in `sites-config.yaml` after the first deploy.

## Cost

Walrus storage is paid in WAL tokens per epoch. 26 epochs ≈ 6 months. Refresh by re-running the deploy.
