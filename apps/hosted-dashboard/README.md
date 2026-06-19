# apps/hosted-dashboard

`app.onemem.xyz` — the hosted, Enoki/dApp Kit deploy of OneMem. It reuses
shared dashboard packages where appropriate and owns the hosted routes below:

- `/login` — Enoki Google OAuth + dApp Kit
- `/cli-login` — callback target for `onemem login` from the CLI
- `/onboarding` — first-time MemWalAccount mint via sponsored tx
- `/share` — owner-initiated sponsored ReadOnly/ReadWrite capability minting plus read-only event-backed history
- `/share/[capability_id]` — public recipient capability object view with hosted holder self-revoke; no claim tx
- `/verify/[session_id]` — **PUBLIC chain verifier** (no login; see `route-verify-public.md`)
- `/dashboard` — hosted account hub and route index

**Read first:** `docs/05-our-architecture/06-dashboard/purpose-local-vs-hosted.md` for what hosted does that local does NOT (and what we deliberately reject from Mem0 cloud's SaaS pattern).

## Enoki readiness

Google sign-in is ready only when all three layers agree:

- Vercel/build env has `NEXT_PUBLIC_ENOKI_API_KEY` and `NEXT_PUBLIC_ENOKI_GOOGLE_CLIENT_ID`.
- Enoki Developer Portal has a Google auth provider.
- Enoki Developer Portal allows `https://app.onemem.xyz`.

`NEXT_PUBLIC_ENOKI_API_KEY` is the public Enoki API key from the Enoki project.
`NEXT_PUBLIC_ENOKI_GOOGLE_CLIENT_ID` is not an Enoki key; it is the Google OAuth
**Web application** client ID configured in Google Cloud. The Google client
should allow `https://app.onemem.xyz` as an Authorized JavaScript origin.

Run the reusable preflight before claiming Google sign-in:

```bash
pnpm --filter @onemem/hosted-dashboard run enoki:readiness --json \
  --deployed-status-url https://app.onemem.xyz/api/enoki/status
```

Add `--strict` in CI or release checks when Google sign-in must be fully live.
The command sanitizes secrets and reports provider/origin/env gaps without
printing API keys.

Walrus Sites currently has a checked-in static public-verifier shell and deploy
preflight; a live Walrus URL and full dashboard mirror remain unclaimed. See
`walrus-sites/README.md`.
