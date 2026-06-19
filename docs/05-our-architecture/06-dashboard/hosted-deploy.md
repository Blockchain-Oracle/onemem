# Hosted Deploy — `app.onemem.xyz`

The OneMem dashboard hosted at `app.onemem.xyz`. `apps/hosted-dashboard/`
reuses shared packages where appropriate, but it is not a blanket wrapper around
every local dashboard route. Current hosted-owned routes are `/`, `/login`,
`/cli-login`, `/onboarding`, `/dashboard`, `/share`,
`/share/[capability_id]`, and the **public** `/verify/[session_id]` chain
verifier.

> **Audit context 2026-05-26.** Hosted serves five specific jobs, NOT "for judges" — onboarding, CLI-login callback, cross-device view, shared-namespace access, and public chain verification. Authoritative purpose split + what hosted DOES NOT do (no billing, no usage quotas, no API keys, no Intercom) is in `purpose-local-vs-hosted.md`. The public `/verify/[session_id]` page is a NEW v0.1 surface specced in `route-verify-public.md`.

---

## Differences vs local deploy

| Concern | Local (`localhost:4040`) | Hosted (`app.onemem.xyz`) |
|---|---|---|
| Auth | Reads `~/.onemem/credentials.json` directly | Client-side Enoki/dApp Kit account state |
| Wallet | N/A for local inspection | Enoki Google wallet or existing wallet via dApp Kit |
| Gas payment | User's wallet | Sponsored by Enoki (gasless UX) |
| Login UI | None | `/login` page with Google sign-in |
| `/cli-login` route | N/A | Present (CLI login callback) |
| `/onboarding` route | N/A | Present (first-time MemWalAccount mint via sponsored tx) |
| `/share` route | CLI-guided local capability sharing | Account-gated sponsored ReadOnly/ReadWrite capability minting plus read-only event-backed owner history |
| `/share/[capability_id]` route | N/A | Public read-only capability object view; no hosted claim tx |
| `/verify/[session_id]` route | N/A | Present and **public — no login required** (per `route-verify-public.md`) |
| Hosting | Spawned by `onemem dashboard` | Vercel (or Cloudflare Workers) |
| Domain | `localhost:4040` | `app.onemem.xyz` |
| Walrus Sites mirror | N/A | Static public-verifier artifact + deploy preflight exist; live Walrus URL/full mirror remain pending |
| Cookies / sessions | N/A | No current server session-cookie layer; account state is client-side through wallet/dApp Kit providers |
| Plugin heartbeats | Local dashboard endpoint | Hosted heartbeat endpoint is not currently implemented |

---

## Auth flow (hosted)

Per `01-sui-ecosystem/enoki-zklogin.md`:

```
1. User visits app.onemem.xyz → redirected to /login if not authenticated
2. /login shows [Sign in with Google] button (Enoki)
3. User clicks → Google OAuth → returns JWT
4. Frontend: EnokiClient processes JWT → ephemeral Sui address (zkLogin)
5. First-time user: prompted to mint MemWalAccount + first namespace (sponsored by Enoki)
6. Pages render account-aware controls from dApp Kit account state.
7. Side-effect flows use wallet approval and hosted server routes for sponsored
   transaction preparation/execution.
```

Optional: connect existing wallet (Slush, Suiet, etc) via dApp Kit instead of Enoki — both supported.

---

## `/cli-login` page (special for hosted)

The CLI's `onemem login` opens browser to `app.onemem.xyz/cli-login?nonce=X&port=12340`. This page:

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
1. User connects through Enoki Google flow or an existing wallet.
2. If no MemWal account is found, the page can create one with wallet approval.
3. Generate an Ed25519 delegate key browser-side and register its public key
   on-chain with the connected account.
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
# NEXT_PUBLIC_ENOKI_GOOGLE_CLIENT_ID=...
# NEXT_PUBLIC_SUI_NETWORK=testnet
# ENOKI_PRIVATE_KEY=...  (server-side Enoki key for sponsored transactions)
# MEMWAL_RELAYER_URL=https://relayer.memwal.ai
# MEMWAL_PACKAGE_ID=...
# MEMWAL_REGISTRY_ID=...
# SUI_NETWORK=testnet
```

The Enoki public API key and the Google client ID are different values.
`NEXT_PUBLIC_ENOKI_API_KEY` is the public Enoki API key from the Enoki project.
`NEXT_PUBLIC_ENOKI_GOOGLE_CLIENT_ID` is the Google OAuth **Web application**
client ID from Google Cloud. Configure that Google client with
`https://app.onemem.xyz` as an Authorized JavaScript origin, then paste the same
client ID into the Enoki Portal Google auth provider and Vercel production env.

Verify Enoki Google sign-in readiness before claiming the hosted auth flow:

```bash
pnpm --filter @onemem/hosted-dashboard run enoki:readiness --json \
  --deployed-status-url https://app.onemem.xyz/api/enoki/status
```

Use `--strict` when release automation should fail if Google sign-in is not
fully configured. The check is intentionally broader than "server key exists":
it requires the public Enoki key, Google client ID, Google auth provider, and
`https://app.onemem.xyz` allowed origin.

Alternative: Cloudflare Workers (with Next.js on Edge runtime — partial support; verify deps work).

---

## Walrus Sites mirror

Per `walrus-sites-mirror.md`, the repo currently contains a static public
verifier shell and deploy preflight for Walrus Sites. A live `site-builder`
deployment URL and full hosted-dashboard mirror are not yet claimed.

---

## Plugin heartbeats (hosted)

The local dashboard exposes runtime heartbeat APIs. A hosted
`app.onemem.xyz/api/runtimes/heartbeat` endpoint is not implemented yet; the
shape below is future hosted work:

```
POST /api/runtimes/heartbeat
Headers:
  Authorization: OneMem-Delegate v1 <delegate_address>:<base64_signature>

Body:
  { runtime: "claude-code", version: "1.2.3", agent_id: "...", namespace_id: "..." }
```

Future hosted server code would validate the signature against the delegate key
and update heartbeat timestamp. The current hosted app should not be described
as already accepting these posts.

For local dashboard: same endpoint at `localhost:4040/api/runtimes/heartbeat`. Plugins detect both and post to whichever is reachable (preferring local if both available).

---

## Session security

- No current server-managed session cookie is implemented.
- Browser account state comes from Enoki/dApp Kit providers.
- Capability and delegate-key mutations require wallet approval or hosted
  sponsored-transaction routes.
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
