# apps/hosted-dashboard

`app.onemem.ai` — the hosted, Enoki-authenticated deploy of OneMem. Wraps `@onemem/dashboard` (shared routes) and adds hosted-only routes:

- `/login` — Enoki Google OAuth + dApp Kit
- `/cli-login` — callback target for `onemem login` from the CLI
- `/onboarding` — first-time MemWalAccount mint via sponsored tx
- `/share` — owner-initiated sponsored ReadOnly/ReadWrite capability minting plus read-only event-backed history
- `/share/[capability_id]` — public recipient capability object view with holder self-revoke command; no claim tx
- `/verify/[session_id]` — **PUBLIC chain verifier** (no login; see `route-verify-public.md`)
- `/dashboard/*` — authenticated shared routes from `@onemem/dashboard`

**Read first:** `docs/05-our-architecture/06-dashboard/purpose-local-vs-hosted.md` for what hosted does that local does NOT (and what we deliberately reject from Mem0 cloud's SaaS pattern).

Also deploys to Walrus Sites as a decentralized mirror — see `walrus-sites/README.md`.
