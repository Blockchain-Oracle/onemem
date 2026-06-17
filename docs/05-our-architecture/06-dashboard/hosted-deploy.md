# Hosted Deploy — `app.onemem.ai`

The OneMem dashboard hosted at `app.onemem.ai`. Same Next.js 15 codebase as the local deploy (via `packages/dashboard/`) wrapped by `apps/hosted-dashboard/` with Enoki/zkLogin auth, sponsored-tx, and hosted-owned routes: `/login`, `/cli-login`, `/onboarding`, `/share`, `/share/[capability_id]`, and the **public** `/verify/[session_id]` chain verifier.

> **Audit context 2026-05-26.** Hosted serves five specific jobs, NOT "for judges" — onboarding, CLI-login callback, cross-device view, shared-namespace access, and public chain verification. Authoritative purpose split + what hosted DOES NOT do (no billing, no usage quotas, no API keys, no Intercom) is in `purpose-local-vs-hosted.md`. The public `/verify/[session_id]` page is a NEW v0.1 surface specced in `route-verify-public.md`.

---

## Differences vs local deploy

| Concern | Local (`localhost:4040`) | Hosted (`app.onemem.ai`) |
|---|---|---|
| Auth | Reads `~/.onemem/credentials.json` directly | Enoki zkLogin (Google OAuth → Sui address) |
| Wallet | dApp Kit (existing wallet) | Enoki ephemeral keys (no wallet needed) |
| Gas payment | User's wallet | Sponsored by Enoki (gasless UX) |
| Login UI | None | `/login` page with Google sign-in |
| `/cli-login` route | N/A | Present (CLI login callback) |
| `/onboarding` route | N/A | Present (first-time MemWalAccount mint via sponsored tx) |
| `/share` route | CLI-guided local capability sharing | Account-gated sponsored ReadOnly/ReadWrite capability minting plus read-only event-backed owner history |
| `/share/[capability_id]` route | N/A | Public read-only capability object view; no hosted claim tx |
| `/verify/[session_id]` route | N/A | Present and **public — no login required** (per `route-verify-public.md`) |
| Hosting | Spawned by `onemem dashboard` | Vercel (or Cloudflare Workers) |
| Domain | `localhost:4040` | `app.onemem.ai` |
| Walrus Sites mirror | N/A | Mirror deploy at `<hash>.wal.app` (per `walrus-sites-mirror.md`) — includes the `/verify` page for fully decentralized verification |
| Cookies / sessions | N/A | HTTP-only session cookie keyed to Enoki session (verify page never sets cookies) |
| Plugin heartbeats | localhost only | Authenticated via delegate key over HTTPS |

---

## Auth flow (hosted)

Per `01-sui-ecosystem/enoki-zklogin.md`:

```
1. User visits app.onemem.ai → redirected to /login if not authenticated
2. /login shows [Sign in with Google] button (Enoki)
3. User clicks → Google OAuth → returns JWT
4. Frontend: EnokiClient processes JWT → ephemeral Sui address (zkLogin)
5. First-time user: prompted to mint MemWalAccount + first namespace (sponsored by Enoki)
6. Session cookie set: HTTP-only, signed, contains { suiAddress, accountId, delegate_key_ref }
7. Subsequent visits: cookie present → render dashboard directly
```

Optional: connect existing wallet (Slush, Suiet, etc) via dApp Kit instead of Enoki — both supported.

---

## `/cli-login` page (special for hosted)

The CLI's `onemem login` opens browser to `app.onemem.ai/cli-login?nonce=X&port=12340`. This page:

```
┌──────────────────────────────────────────────────────┐
│                    OneMem                            │
│                                                      │
│   You're logging in OneMem CLI on your machine       │
│                                                      │
│   This will generate a delegate key that lets your   │
│   CLI write memories on your behalf without          │
│   re-signing each time.                              │
│                                                      │
│   ┌────────────────────────────────────────────┐    │
│   │ Sign in with Google (Enoki — gasless)     │    │
│   └────────────────────────────────────────────┘    │
│                                                      │
│   Or connect existing wallet:                        │
│   [Slush]  [Suiet]  [Sui Wallet]                     │
│                                                      │
│   ─────────────────────────────────────────          │
│                                                      │
│   After signing in, you'll see:                      │
│   - The MemWalAccount being created (one-time)       │
│   - A delegate key generated for your CLI            │
│   - A namespace to use as default                    │
│                                                      │
│   This will all happen gaslessly via Enoki.          │
└──────────────────────────────────────────────────────┘
```

On submit:
1. User signs (Enoki Google flow or wallet)
2. If first time: build PTB to mint `MemWalAccount` + register first delegate key + create initial `MemoryNamespace` — all in one sponsored tx
3. Generate Ed25519 delegate key (browser-side)
4. POST back to `http://localhost:12340/callback` with credentials:
   ```json
   {
     "delegateKey": "...",
     "delegatePublicKey": "...",
     "accountId": "...",
     "suiAddress": "...",
     "activeNamespaceId": "...",
     "agentId": "cli-default",
     "signature": "...",
     "expiresAt": <epoch>
   }
   ```
5. Show success: "Login complete. You can close this tab."

---

## Deployment

Vercel (default):

```bash
vercel --prod
# Set env:
# NEXT_PUBLIC_ENOKI_API_KEY=...
# NEXT_PUBLIC_RELAYER_URL=https://relayer.memwal.ai
# NEXT_PUBLIC_SUI_NETWORK=mainnet
# ENOKI_SERVER_API_KEY=...  (for sponsored-tx server-side)
# SESSION_SECRET=...
```

Alternative: Cloudflare Workers (with Next.js on Edge runtime — partial support; verify deps work).

---

## Walrus Sites mirror

Per `walrus-sites-mirror.md`, the hosted deploy ALSO ships to Walrus Sites as a decentralized fallback. Same build artifacts, deployed via `site-builder deploy`. Domain: `onemem.wal.app` or similar.

If `app.onemem.ai` is down: users fall back to the Walrus Sites URL. Same UX, decentralized infrastructure.

---

## Plugin heartbeats (hosted)

Plugins running on user machines post heartbeats to `app.onemem.ai/api/runtimes/heartbeat` with:

```
POST /api/runtimes/heartbeat
Headers:
  Authorization: OneMem-Delegate v1 <delegate_address>:<base64_signature>

Body:
  { runtime: "claude-code", version: "1.2.3", agent_id: "...", namespace_id: "..." }
```

Server validates signature against the delegate key. If valid, updates heartbeat timestamp. Dashboard's `/apps` page reads via SWR.

For local dashboard: same endpoint at `localhost:4040/api/runtimes/heartbeat`. Plugins detect both and post to whichever is reachable (preferring local if both available).

---

## Session security

- Session cookie HTTP-only + SameSite=Strict + Secure
- 7-day lifetime; refresh on activity
- Logout: clear cookie + (optional) revoke delegate key on chain
- No password / no Mem0-style API keys at v0.1

---

## What we DON'T do at hosted v0.1

Per `purpose-local-vs-hosted.md` — we deliberately reject the Mem0-cloud SaaS pattern:

- **No billing / Usage & Billing tab** — OneMem is Apache-2.0 OSS at v0.1; we don't charge
- **No usage quotas** — no "Hobby plan: 10K Add / 1K Retrieval"-style framing
- **No "Upgrade to Pro" CTAs** anywhere
- **No API Keys page** — auth is via Sui delegate keys generated through `/cli-login`, not opaque API tokens
- **No Intercom support chat widget** — docs site + GitHub issues are sufficient
- **No team workspaces / RBAC UI** (v0.2 if requested)
- **No account deletion flow** (TODO; v0.2)
- **No email verification** (v0.2)
- **No SAML / SSO** (v0.2 enterprise)
- **No org/project switcher UI** — namespace switcher in `/settings` covers the same concept without enterprise overhead

---

## Cross-references

- `purpose-local-vs-hosted.md` — authoritative local-vs-hosted split (READ FIRST)
- `route-verify-public.md` — public `/verify/[session_id]` page spec
- `local-deploy.md` — sibling local deploy (same shared codebase)
- `walrus-sites-mirror.md` — decentralized fallback
- `../00-overview/MONOREPO_LAYOUT.md` — `apps/hosted-dashboard/` folder structure with hosted-only routes
- `../00-overview/TOOLING_DECISIONS.md` — Next.js 15 + Enoki + sponsored-tx stack
- `../05-cli/login-flow.md` — CLI side of `/cli-login` flow
- `../../01-sui-ecosystem/enoki-zklogin.md` — Enoki + zkLogin mechanics
- `../../02-inspirations/memwal-incubation/README.md` — `memwal.ai` dashboard precedent for credentials UI
- `../../02-inspirations/mem0/README.md` — what we explicitly REJECT from Mem0 cloud's pattern (billing, quotas, API keys, Intercom)
