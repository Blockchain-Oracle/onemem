# Purpose — Local vs Hosted Dashboard

**Read this first.** Before any dashboard implementation work, internalize this distinction. Local and Hosted are NOT two deploys of the same thing serving the same audience — they serve different USER intents on top of a shared codebase.

This doc owns the "why each exists" question. The `ui-architecture.md`, `local-deploy.md`, and `hosted-deploy.md` files handle the "how each is built."

---

## TL;DR

| | **LOCAL** (`localhost:4040`) | **HOSTED** (`app.onemem.xyz`) |
|---|---|---|
| **Primary user** | Developer / user running AI agents on their own machine | Anyone interacting with OneMem WITHOUT installing the CLI |
| **Primary jobs** | Inspect your own memory + traces. Verify, replay, manage. | Onboarding, CLI-login callback, cross-device view, shared-namespace access, public verification |
| **Auth model** | Reads `~/.onemem/credentials.json` — no login | Enoki/zkLogin (Google) OR existing wallet via dApp Kit |
| **Daily-driver?** | YES — opened every coding session | NO — occasional (onboard, share, verify) |
| **Equivalent in Mem0** | OpenMemory `localhost:3000` (Mem0's OSS local dashboard, sunsetting) | `app.mem0.ai` (Mem0's cloud platform, closed source SaaS) |
| **Inversion vs Mem0** | OSS Apache-2.0 (Mem0's sunsetting this tier) | OSS Apache-2.0 (Mem0's tier is closed-source SaaS) |
| **Codebase** | `packages/dashboard/` (Next.js 15) | `apps/hosted-dashboard/` shell plus selected shared dashboard package code |

---

## Local dashboard — the daily driver

### Who it's for

Individual developers / users running AI coding agents on their own machine. Claude Code users, OpenClaw users, Hermes users. The people who actually USE the agents OneMem instruments.

### The jobs it does

1. **Show me what my agents remembered** — `/memories` route lists memories from any namespace I have access to, with per-app provenance (which runtime wrote it, which agent_id, when)
2. **Show me what my agents DID** — `/trace/[session_id]` renders the full action call tree for any session, with the Verify drawer that turns chartreuse on chain-integrity-verified
3. **Show me what runtimes are connected** — `/apps` lists every installed plugin / MCP-served runtime with its coverage tier (full vs partial) and last-seen heartbeat
4. **Replay a session from chain** — open `/trace/[id]` → Replay modal → step through the agent's actions reconstructed from Walrus + Sui
5. **Share access via Sui capability transfer** — `/share` shows namespace/capability state and executable CLI share commands
6. **Settings for delegate keys, providers, runtimes** — `/settings`

### Auth model

- Reads `~/.onemem/credentials.json` (written by `onemem login` from CLI)
- No login UI on the local dashboard; the credentials file IS the auth
- File permissions `chmod 600` (owner read/write only)
- If the file is missing or expired, dashboard shows "Run `onemem login` from your terminal" + a link to docs

### Why local exists (the philosophical case)

Memory + traces are PERSONAL. Most users want to inspect their own data on their own machine, without an internet round-trip, without trusting a vendor's hosted dashboard, without logging into anything. The claude-mem pattern: spawn a local server, visit a localhost URL, see your stuff. Familiar UX for developers who already use claude-mem.

OneMem matches this UX expectation. Local is the daily driver.

### What local does NOT do

- ❌ Require login (never)
- ❌ Sync data to a remote OneMem-controlled server (data flows: SDK → MemWal relayer → Walrus → Sui; we don't have our own data store)
- ❌ Show ads / upgrade CTAs (no upgrade tier exists)
- ❌ Show usage limits or billing (no limits, no billing)
- ❌ Track user analytics (we don't have analytics infrastructure)

---

## Hosted dashboard — the entry point + shared surfaces

### Who it's for

THREE distinct user groups (with different routes per group):

1. **New users (no CLI yet)** — discovering OneMem, signing up, minting their first MemWalAccount + namespace, getting CLI install instructions
2. **Existing users on multi-device** — checking their stuff from a friend's laptop, phone, work machine where CLI isn't installed
3. **Recipients of shared namespaces** — someone transferred them a capability via Sui; they need to view/use it without installing CLI
4. **The general public** — anyone in the world can paste a session ID + verify the Merkle chain (NO LOGIN; demonstrates the verifiability wedge)

### The jobs it does (v0.1)

| Route | Auth | Purpose |
|---|---|---|
| `/` (landing-shell-style) | public | Brand + 3-sentence pitch + "Get Started" + "Sign in" CTAs |
| `/login` | public | Sign in via Enoki (Google) OR existing wallet (dApp Kit) |
| `/cli-login?nonce=X&port=Y` | public + post-auth | Browser callback target for `onemem login` from the CLI. Mints delegate key, registers it on chain, POSTs creds back to `localhost:<port>`. |
| `/onboarding` | post-auth | First-time-user flow: mint MemWalAccount (gasless via Enoki sponsored-tx) → mint first namespace → show CLI install commands per-runtime |
| `/dashboard` | account-aware | Hosted hub and route index. It links public verify, share, onboarding, and sign-in surfaces; it is not a wrapper for every local dashboard route. |
| `/share` | post-auth | Owner-initiated sponsored ReadOnly/ReadWrite capability minting to a recipient Sui address plus event-backed owner history. |
| `/share/[capability_id]` | public + optional wallet comparison | Recipient capability object view. Reads the Sui `NamespaceCapability`, derives owner/kind/namespace metadata, and states that there is no claim transaction in v0.1. |
| **`/verify/[session_id]`** | **public, no auth** | **The PUBLIC verification page.** Anyone in the world can paste a session ID + see "✓ Verified" badge for the Merkle chain integrity. Demonstrates verifiability to non-users. |

### Why hosted exists (the philosophical case)

OneMem's wedge is **verifiable + cross-runtime + shareable agent memory**. Three of those properties have user implications that can't live on a single-machine local dashboard:

- **Verifiable** — verifiability has VALUE only if non-owners can verify too. The public `/verify/[session_id]` page makes that property real for anyone in the world.
- **Cross-runtime** — if you use OneMem from a laptop + a phone agent + a desktop work machine, a hosted view unifies them. Local-only would force you to ssh into each device.
- **Shareable** — if Bob shares a namespace with Alice via Sui capability transfer, Alice shouldn't need to install the CLI just to read it. Hosted dashboard is her entry.

Plus: onboarding non-developers. The CLI is a developer-facing tool. The hosted dashboard is where non-developer users can sign up + try OneMem before deciding whether to install anything.

### Why hosted is NOT "for judges"

Earlier framing was lazy. The hosted dashboard serves real product purposes (onboarding, cross-device, sharing, public verification). The fact that it ALSO works as a demo URL for hackathon judges is incidental, not its purpose. We'd build hosted whether or not the hackathon existed.

### What hosted does NOT do (the explicit NOT-list)

- ❌ Replace the local dashboard as daily driver (local is faster, no login, no internet dependency for cached data)
- ❌ Mem0-style SaaS billing / usage limits / "Upgrade to Pro" CTAs — we're OSS, no tiers, no upgrade
- ❌ API Keys management page (we use Sui delegate keys, not API keys; managed via `/settings`)
- ❌ Intercom / support chat widget (premature; rely on Discord/Telegram links in footer)
- ❌ Custom analytics / usage tracking (we don't have analytics infrastructure; users own their data)
- ❌ Admin / superuser view (we don't have admin powers; users own their data)
- ❌ Rate limits (Walrus + Sui have their own pricing; we don't add layers)
- ❌ Org / team RBAC UI (Sui capability transfer IS the sharing model; per-org admin UI is v0.2+)
- ❌ Webhooks management UI (we emit Sui events natively; SSE subscribes from those; UI for webhooks is v0.2)

---

## The architecture: single codebase, three deploys

```
packages/dashboard/                    # Next.js 15 — the SHARED CODE
├── app/
│   ├── (local)/                       # Routes that work without login (read creds from file)
│   │   ├── page.tsx                   # /
│   │   ├── memories/page.tsx
│   │   ├── apps/page.tsx
│   │   ├── trace/[session_id]/page.tsx
│   │   ├── sessions/[session_id]/page.tsx
│   │   ├── share/[capability_id]/page.tsx
│   │   └── settings/page.tsx
│   │
│   └── (shared)/                      # Pure UI components used by BOTH deploys
│       ├── components/
│       ├── lib/
│       └── ...

apps/hosted-dashboard/                 # Next.js shell that adds hosted-only routes + account state
├── app/
│   ├── page.tsx                       # / (different from local; landing-shell with sign-in CTA)
│   ├── login/page.tsx                 # /login (Enoki/dApp Kit connection)
│   ├── cli-login/page.tsx             # /cli-login (CLI callback target)
│   ├── onboarding/page.tsx            # /onboarding (first-time flow)
│   ├── share/page.tsx                 # /share (sponsored capability mint + history)
│   ├── share/[capability_id]/page.tsx # public capability object view
│   ├── verify/[session_id]/page.tsx   # /verify/[id] (PUBLIC verifier)
│   └── dashboard/page.tsx             # hosted hub
└── (Enoki + dApp Kit client providers)
```

**How the shared code works today:** `packages/dashboard/` owns the local daily
driver routes and reusable dashboard UI/data code. `apps/hosted-dashboard/`
owns hosted-only routes (`/login`, `/cli-login`, `/onboarding`, `/share`,
`/share/[capability_id]`, `/verify/[id]`, `/dashboard`). The older plan to wrap
every local route under `/dashboard/*` is not current implementation reality.

---

## The new public `/verify/[session_id]` page (v0.1)

This is the surface I'm proposing we add to v0.1 hosted. Not in the original architecture; identified as a gap during the audit.

### What it does

Anyone in the world visits `app.onemem.xyz/verify/<session_id>`. No login. Page shows:

```
┌───────────────────────────────────────────────────────────────┐
│                       OneMem                                  │
│                                                               │
│  Session 0xsess... ↗ Suiscan                                  │
│                                                               │
│  Captured by:     0xowner_address... ↗                        │
│  Agent:           hermes-0.14                                 │
│  Started:         2026-05-26 14:30                            │
│  Ended:           2026-05-26 14:35                            │
│  Call count:      47                                          │
│                                                               │
│  Verifying Merkle chain...                                    │
│  [████████████████████████████░░░░░░] 38/47 ✓                 │
│  ...                                                          │
│  ✓ All 47 calls verified                                      │
│                                                               │
│  ✓ VERIFIED                                                   │
│                                                               │
│  Expected merkle_root: 0xabc... (from Sui chain)              │
│  Computed merkle_root: 0xabc... (re-derived from events)      │
│  Match:                ✓                                      │
│                                                               │
│  This session's chain integrity is cryptographically proven.  │
│  Walrus blob contents are not visible without proper auth     │
│  (Seal-encrypted), but the integrity of the on-chain commit   │
│  chain is verifiable by anyone.                               │
│                                                               │
│  [Share this verification link]   [Learn how this works]      │
└───────────────────────────────────────────────────────────────┘
```

### Why this is a v0.1-worthy addition

1. **Demonstrates the wedge to non-users.** "Verifiable on-chain" is abstract until you can paste a session ID and see ✓ Verified without any signup. This page makes it concrete.
2. **No data leak.** Verifies chain integrity WITHOUT decrypting plaintext. The Walrus blobs stay Seal-encrypted; only the on-chain hashes are walked. So the public verifier reveals only what's already public on Sui.
3. **Implementation is small.** Reuses the Verify drawer's logic from `route-trace.md` minus the data-fetching auth. Maybe 1-2 days of implementation.
4. **Differentiator nobody else has.** Mem0, Letta, Zep don't have this. claude-mem doesn't have this. It's a "you can prove anything we say about our integrity" surface.
5. **Killer demo moment.** "Share this verification link" → recipient clicks → sees ✓ Verified. Trust narrative locked.

### What it does NOT do at v0.1

- ❌ Show plaintext memory content (would require auth/decrypt)
- ❌ Show input/output of individual calls in detail (same reason)
- ❌ Let you replay the session (replay requires decryption)

It JUST verifies chain integrity end-to-end. That's the most powerful public claim we can make without revealing private data.

---

## What's deferred to v0.2+ (not in v0.1 hosted)

| Surface | Why deferred |
|---|---|
| Public agent reputation page (`/agent/[agent_id]`) | Requires reputation graphs pillar (v0.2) |
| Memory marketplace UI (`/marketplace`) | Requires marketplaces pillar (v0.2) |
| Discover public namespaces (`/discover`) | Requires public-namespace flag in Move struct (v0.2) |
| Team / org RBAC (`/orgs`, `/teams`) | Sui capability transfer covers v0.1 sharing; org admin UI is v0.2+ |
| ERC-8004 bridge (`/erc8004/[address]`) | Cross-chain identity pillar (v0.2) |
| Mobile-native shell | OneMem mobile SDK doesn't exist at v0.1 |

---

## Decision rationale (why these specific choices)

### Why we keep BOTH local + hosted at v0.1 (not drop hosted)

- Hosted does jobs local fundamentally can't (onboarding non-CLI users, cross-device, sharing to non-installers, public verification)
- The CLI login flow REQUIRES `/cli-login` callback on a hosted URL (browser flow can't post to your own machine's localhost without going through SOME server)
- Single codebase means hosted is ~2 days extra work (Enoki wiring + 3 new routes) — not 2 weeks
- Without hosted, the demo story collapses on "how does someone who's never installed OneMem see the value?"

### Why hosted is NOT the daily driver

- Login friction (vs local: zero login)
- Internet dependency (vs local: cached data works offline-ish)
- Slower (vs local: direct file/IPC reads)
- The daily-use UX should match claude-mem's expectation

### Why we explicitly REJECT Mem0 cloud's SaaS patterns

| Mem0 cloud has | Why we reject |
|---|---|
| Usage limits ("0 of 10K Add events") | OSS; no quota |
| Upgrade to Pro CTAs | No paid tier exists |
| API Keys management page | We use Sui delegate keys |
| Intercom support chat | Premature; Discord/Telegram link suffices |
| Billing & invoices | Not selling anything |
| Org admin / RBAC | Sui capability transfer covers v0.1 |
| Webhooks UI | Sui events + SSE cover v0.1 |

These ARE valid for Mem0 (they're a SaaS business). We are an OSS project. Different product = different surfaces.

### Why we ADD the public `/verify/[id]` route (not in Mem0)

- It's the surface that demonstrates our wedge (verifiability) to non-users
- Mem0 doesn't have it because their data isn't on-chain — they couldn't prove integrity to a third party even if they wanted to
- Our on-chain architecture makes this trivially possible — and skipping it would be leaving the wedge on the table

---

## The local-to-hosted user journey (v0.1)

The expected flow for a new user:

```
1. User hears about OneMem (e.g., from a friend, Twitter, a Walrus demo)
   ↓
2. Visits onemem.xyz (marketing landing) → clicks "Get Started"
   ↓
3. Lands on app.onemem.xyz/onboarding (hosted dashboard)
   - Signs in with Google (Enoki, gasless)
   - Mints MemWalAccount (Sui tx, sponsored)
   - Creates first MemoryNamespace ("personal")
   - Sees CLI install commands for their runtime (Claude Code / Hermes / etc)
   ↓
4. Copies install command, runs in terminal:
   $ npm install -g @onemem/cli
   $ onemem install --runtime claude-code
   $ onemem login
   ↓
5. `onemem login` opens browser → app.onemem.xyz/cli-login?nonce=...&port=12340
   - Browser account connection is available through Enoki/dApp Kit state
   - Generates delegate key, registers it on chain
   - POSTs creds back to localhost:12340
   - Browser shows "Login complete. Close this tab."
   ↓
6. CLI saves ~/.onemem/credentials.json
   ↓
7. User opens Claude Code → OneMem plugin records traces after install,
   configuration, and trusted hook execution
   ↓
8. User runs: $ onemem dashboard
   - Launches local dashboard at localhost:4040
   - Reads creds file; no login
   - Daily-driver UX from here on
```

The hosted dashboard's job ends at step 6. After that, the local dashboard is daily-use.

But: any time the user needs to share a namespace with a teammate, they can use
hosted `/share` for sponsored owner minting or the CLI for local signer-based
minting. Hosted `/share` also loads event-backed capability history for the
namespace so owners can see active/revoked caps without a hosted share database.
Recipients can open `/share/[capability_id]` to inspect the capability object;
a future claim/transfer transaction remains a protocol follow-up because v0.1
shares already transfer the object during minting. Any time someone verifies a
public trace, they hit hosted's public `/verify/[id]`.

---

## Implementation status

| Component | Status |
|---|---|
| Local dashboard skeleton (`packages/dashboard/`) | Built; local route coverage continues to evolve |
| Shared/local dashboard routes | Built incrementally; verify current code before using older status tables |
| Hosted dashboard shell (`apps/hosted-dashboard/`) | Built with Enoki/dApp Kit providers |
| `/login` page (Enoki + dApp Kit) | Built |
| `/cli-login` callback page | Built |
| `/onboarding` flow | Built for sponsored namespace/RW-cap provisioning |
| Hosted `/share` owner capability minting/history | Built for sponsored ReadOnly/ReadWrite capability creation and event-backed owner history |
| **`/verify/[session_id]` public page (NEW v0.1 addition)** | Built |
| `/share/[capability_id]` recipient capability view | Built as read-only object inspection; claim transfer remains pending |
| Walrus Sites mirror deploy | Static public verifier shell and deploy preflight built; live `site-builder` deploy URL and full dashboard mirror remain pending |

---

## Cross-references

- `README.md` (this folder) — overall dashboard nav
- `ui-architecture.md` — shared Next.js app architecture (now Next.js 15, per audit fix)
- `data-flow.md` — how dashboard reads from Sui/Walrus/MemWal/SSE
- `design-system.md` — brand application (cream surface + lavender + chartreuse Verify-only + Sui blue Suiscan-only)
- `route-trace.md` — `/trace/[id]` headline route (Verify drawer used in both local AND public `/verify/[id]`)
- `route-share.md` — local `/share`, hosted `/share`, recipient capability view, and no-claim boundary
- `local-deploy.md` — local-specific deploy detail (`localhost:4040`, CLI-launched)
- `hosted-deploy.md` — hosted-specific deploy detail (`app.onemem.xyz`, Enoki/zkLogin)
- `walrus-sites-mirror.md` — decentralized fallback for hosted
- Inspiration: `02-inspirations/mem0/MEM0_DOCS_DESIGN.md` (Mem0 cloud dashboard pattern; what we adopt + reject)
- Inspiration: `02-inspirations/claude-mem/HOOKS_AND_VIEWER_REFERENCE.md` (claude-mem's local-server pattern; what local mirrors)
