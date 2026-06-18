# Walrus Sites Mirror — OneMem Dashboard

The hosted OneMem dashboard ALSO deploys to Walrus Sites as a decentralized fallback. Same build artifacts; different deployment target.

Walrus Sites = static hosting on Walrus, fronted by SuiNS for human-readable names.

Source-of-truth reference: `../../01-sui-ecosystem/walrus-deep-dive.md` (Walrus Sites docs section).

---

## Why Walrus Sites for the dashboard

1. **Decentralized fallback.** If `app.onemem.ai` (Vercel) is down, users have `onemem.wal.app` (Walrus Sites). No single point of failure.
2. **Sponsor-aligned narrative.** "The OneMem dashboard is itself decentralized on Walrus" — a direct surprise for the Walrus track judges.
3. **No vendor lock-in for users.** Even if OneMem the company disappears, the dashboard keeps working on Walrus.
4. **First-mover signal.** Most products with hosted dashboards don't ship a Walrus Sites mirror. Doing so is a visible commitment to the decentralization story.

---

## What gets deployed to Walrus Sites

The Next.js app from `06-dashboard/` built with `next export` (or `output: "export"` in next.config). Static HTML + JS + CSS + assets.

Limitations:
- No server-side rendering (Walrus is static hosting)
- No `/api/*` route handlers (those would need to point to a separate API server)
- Auth flow adapted: Enoki client-side-only (no server session); credentials read from localStorage instead of HTTP-only cookie

---

## Current deploy boundary

Current implementation status:

- `scripts/deploy-walrus-sites.sh` is a real preflight/deploy wrapper around
  `site-builder`.
- The hosted dashboard still contains server-backed API routes and force-dynamic
  pages for public verify/share.
- The current Next.js toolchain does not support the old
  `next export -o out` command path used in early design notes.
- A live Walrus Sites URL remains pending until a valid static artifact exists
  and `site-builder` runs in a funded Sui/WAL environment.

## Build pipeline

```bash
# 1. Build or provide a static artifact directory.
# The artifact must contain index.html and should not be the repo root.
DIST=apps/hosted-dashboard/out

# 2. Validate without deploying.
bash scripts/deploy-walrus-sites.sh --check --dist "$DIST" --epochs 26 --context mainnet

# 3. Walrus Sites deploy.
bash scripts/deploy-walrus-sites.sh --dist "$DIST" --epochs 26 --context mainnet
# → returns Site Object ID + URL like https://<base32-hash>.wal.app

# 4. (Optional) Map a SuiNS name
sui client call --package <suins_pkg> --module suins --function set_target_object \
  --args <my_suins_name> <site_object_id>
# → onemem.wal.app now points at this deploy
```

---

## Static-export adaptations

The dashboard has features that require server-side code. These get adapted for Walrus Sites:

| Feature | Hosted (Vercel) | Walrus Sites mirror |
|---|---|---|
| Auth (Enoki) | Server session via cookie | Client-side only; ephemeral session in localStorage |
| SSE stream | Next.js API route | Direct fetch to relayer's SSE endpoint (CORS configured) |
| Memory list | API route → SDK | Direct fetch from browser to relayer + Walrus |
| Verify chain | Same | Same (client-side anyway) |
| Plugin heartbeats | API route receives | N/A (plugins on user machines can't reach Walrus Sites mirror easily; heartbeats go to relayer instead, then dashboard polls) |
| `/cli-login` callback | Receives POST from local CLI | Same — but the POST target is `localhost:12340`, not the dashboard. Dashboard just posts to local CLI. |

In practice: most API routes are thin wrappers around the SDK. The Walrus Sites build replaces them with direct browser-to-relayer calls.

---

## Build conditional

```ts
// lib/api-client.ts
const isStaticBuild = process.env.NEXT_OUTPUT_MODE === "export";

export async function fetchMemories(namespaceId: string) {
  if (isStaticBuild) {
    // Walrus Sites: browser calls relayer directly
    const client = await getOneMemClient();
    return client.getAll({ namespaceId });
  } else {
    // Vercel: through API route (server-side caching + auth)
    return fetch(`/api/memories?namespace=${namespaceId}`).then(r => r.json());
  }
}
```

Same applies to: sessions list, verify, replay, share — all switch to direct client calls in static-build mode.

---

## Walrus Sites domain config

```yaml
# sites-config.yaml
contexts:
  mainnet:
    package: "0x26eb7ee8688da02c5f671679524e379f0b837a12f1d1d799f255b7eea260ad27"
    staking_object: "0x..."
    walrus_package: "0x..."
    
sites:
  onemem-dashboard:
    contents: "./out"
    epochs: 100                # ~2 years at 2-week epochs
    domain: "onemem.wal.app"   # SuiNS name (if registered)
```

Deploy:
```bash
site-builder deploy --config sites-config.yaml --context mainnet
```

---

## Update cadence

- v0.1: deploy once, update manually as needed
- v0.2: GitHub Actions workflow auto-deploys on push to `main`
- Use `walrus-sites-provenance` + notary for SLSA-verifiable deployments (per `01-sui-ecosystem/walrus-deep-dive.md`)

---

## Cost

Per `01-sui-ecosystem/walrus-deep-dive.md`:
- Testnet pricing: 0.0001 WAL/unit/epoch + 20K FROST flat write fee
- Dashboard static export ~10 MB → ~10 storage units
- 100 epochs (~2 years) → ~0.1 WAL + 20K FROST one-time
- At current rates: well under $1 total for years of hosting

Walrus mainnet pricing TBD; verify before final deploy.

---

## What this enables (the demo moment)

In the demo / pitch:

> "And here's the dashboard — running on Vercel. Now watch: I'll switch to the Walrus Sites mirror at `onemem.wal.app`. Same UX. Same data. Decentralized hosting. Even if OneMem.ai goes down, every user has this fallback."

This is a 30-second segment that lands the decentralization story unambiguously.

---

## Cross-references

- `local-deploy.md` — the on-disk version
- `hosted-deploy.md` — the Vercel version
- `ui-architecture.md` — same codebase, just different deploy target
- `../../01-sui-ecosystem/walrus-deep-dive.md` — Walrus Sites mechanics
- `../../01-sui-ecosystem/REFERENCE_APPS.md` — `MystenLabs/walrus-sites` + `MystenLabs/example-walrus-sites` references
