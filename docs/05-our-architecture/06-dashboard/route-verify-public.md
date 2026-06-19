# Route: `/verify/[session_id]` — Public Chain Verifier (Hosted Only)

**NEW v0.1 surface** added during the audit pass — decision rationale in `purpose-local-vs-hosted.md`.

Hosted-only route. No login. Anyone in the world can verify a OneMem trace session's chain integrity from a URL.

This is the surface that makes "verifiable on-chain" concrete to non-users.

---

## What it does

User visits `app.onemem.xyz/verify/0xsession_id`. Page:

1. Fetches the `TraceSession` Move object from Sui by ID (read-only Sui RPC; no auth)
2. Fetches all `ActionCallEmitted` + `ActionCallClosed` events for that session_id (Sui RPC)
3. Walks the Merkle chain:
   - For each call in order, fetches the Walrus blob commitments (Walrus public aggregator; ciphertext only)
   - Recomputes `content_hash` from event fields (no plaintext decryption needed)
   - Asserts `prev_hash` matches predecessor's `content_hash`
   - Re-derives session `merkle_root` by chaining hashes
4. Compares re-derived root against on-chain `session.merkle_root`
5. Displays VERIFIED ✓ (chartreuse glow) or BROKEN ✗ with the broken call

---

## Layout

```
┌────────────────────────────────────────────────────────────────┐
│                         OneMem                                 │
│                                                                │
│  Session 0xsess... ↗ Suiscan                                   │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Captured by:     0xowner_address... ↗                    │  │
│  │ Agent:           hermes-0.14                              │  │
│  │ Environment:     production                               │  │
│  │ Started:         2026-05-26 14:30:14 UTC                  │  │
│  │ Ended:           2026-05-26 14:35:22 UTC                  │  │
│  │ Call count:      47                                       │  │
│  │ Status:          COMPLETED                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  Verifying Merkle chain...                                     │
│  [████████████████████████████████░░░░] 38/47 ✓                │
│                                                                │
│   ✓ Call 1/47:    memwal_write         0xc4d... ↗              │
│   ✓ Call 2/47:    Read /file.ts         0xa1b... ↗             │
│   ✓ Call 3/47:    Bash pnpm test        0xe8f... ↗             │
│   ...                                                          │
│   ✓ Call 47/47:   memwal_write          0xb22... ↗             │
│                                                                │
│  Expected merkle_root:   0xabc...  (from on-chain TraceSession)│
│  Computed merkle_root:   0xabc...  (re-derived from events)    │
│  Match:                  ✓                                     │
│                                                                │
│  ✓ VERIFIED                                                    │
│                                                                │
│  This session's chain integrity is cryptographically proven.   │
│  The call sequence + hashes are immutable on Sui mainnet.      │
│                                                                │
│  Walrus blob CONTENTS remain Seal-encrypted and are not        │
│  visible without proper delegate-key authorization. This page  │
│  proves chain INTEGRITY (the recorded sequence is intact),     │
│  not chain SECRECY (which is preserved by Seal).               │
│                                                                │
│  [Share this verification link]   [Learn how this works]       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## What this DOES and DOES NOT prove

| Claim | Proven by this page? | How |
|---|---|---|
| The session was recorded on Sui | ✅ | TraceSession object exists; its events are on-chain |
| The call sequence is intact (no tampering) | ✅ | Merkle chain walk; prev_hash linkage; final root matches on-chain root |
| The captured_by_address actually signed the writes | ✅ | Sui consensus signatures on events |
| The Walrus blobs referenced exist | ✅ | We can fetch them (ciphertext); their hashes match input_hash on chain |
| The session's PLAINTEXT content was X | ❌ | Plaintext is Seal-encrypted; requires delegate-key auth |
| The agent ACTUALLY did what the input/output says | ⚠️ | We prove the recorded SEQUENCE; we don't prove the agent honestly recorded its real actions. Trust-but-verify still requires the captured_by_address being trustworthy. |

The last row is important honesty: chain integrity proves "no one tampered with what was recorded," NOT "the agent definitely did what was recorded." That second property requires either:
- Trusting the captured_by_address (delegate key holder)
- OR (v0.2) Nautilus TEE relayer attesting that the relayer captured real agent activity

We're explicit about what's proven vs not — credibility is built on honesty.

---

## Implementation

Reuses the `VerifyDrawer` component logic from `route-trace.md` minus the auth + decryption:

```ts
// apps/hosted-dashboard/app/verify/[session_id]/page.tsx
"use client";

import { use } from "react";
import { useVerification } from "@/lib/verify";  // shared hook
import { SessionMetadata, MerkleProgress, VerifiedBadge, ShareLink } from "@/components/verify";

export default function PublicVerifyPage({ params }: { params: Promise<{ session_id: string }> }) {
  const { session_id } = use(params);
  
  // useVerification hook: fetches Sui events + Walrus blob commitments + walks chain
  // Returns: { session, calls, progress, verified, brokenAt, details }
  const result = useVerification(session_id, { mode: "public" });  // public mode = no decryption
  
  return (
    <div className="max-w-3xl mx-auto p-8 bg-surface">
      <SessionMetadata session={result.session} />
      <MerkleProgress current={result.progress.current} total={result.progress.total} />
      <CallList calls={result.calls} />
      <RootComparison expected={result.details.expectedRoot} computed={result.details.actualRoot} />
      
      {result.verified ? <VerifiedBadge animated /> : <BrokenBadge call={result.brokenAt} />}
      
      <Disclosure />
      
      <div className="flex gap-2 mt-8">
        <ShareLink sessionId={session_id} />
        <a href="/docs/verifying-traces" className="text-sui underline">Learn how this works</a>
      </div>
    </div>
  );
}
```

Server-side Sui RPC + Walrus reads use a public read-only delegate key (hosted dashboard's server-side OneMem client has read access to public chain events; no user creds needed).

---

## Performance budget

For a 47-call session:
- Sui event fetch: ~500ms (single bulk query)
- Walrus blob hash fetches: 47 parallel, ~2s total
- Merkle chain walk: <100ms (pure compute)
- Total verification: <3s p95

For a 1000-call session: scales linearly (~30s). Show progress bar; OK to wait.

---

## SEO + sharing

- `<meta property="og:title" content="OneMem verification: Session 0xsess..." />`
- OG image: dynamically generated with the session ID + ✓ Verified badge
- Sharing a link reveals: session ID, agent_id, owner address (all public anyway), call count, verification status
- Does NOT reveal: any plaintext content

Optimized for sharing — that's the point.

---

## Demo flow (for the official Demo Day video)

Frame 1: `app.onemem.xyz/verify/0xsess_id` URL in browser bar (incognito mode — emphasis on "no login")
Frame 2: Page loads; metadata appears; progress bar animates
Frame 3: All 47 calls tick ✓
Frame 4: Chartreuse "VERIFIED" badge animates in
Frame 5 (voiceover): "Anyone in the world can verify what my agent did. No account. No trust. Just math."

10 seconds in the official 5-min Demo Day video. Trust narrative locked.

---

## What this page does NOT have (deliberate scope control)

- ❌ Plaintext display of inputs/outputs (requires auth)
- ❌ Replay modal (requires auth + decryption)
- ❌ Comment/reaction features (premature)
- ❌ User profile pages (v0.2 with reputation pillar)
- ❌ "Embed this verification" widget (v0.2 if there's demand)

Keep it focused: chain integrity, publicly provable. Nothing else.

---

## Cross-references

- `purpose-local-vs-hosted.md` — decision rationale for adding this surface
- `route-trace.md` — the authenticated `/trace/[id]` view (Verify drawer inside)
- `../01-protocol/events-and-attestation.md` — Merkle chain mechanics + event::emit_authenticated (the primitive this page consumes)
- `hosted-deploy.md` — where this route is deployed
- `walrus-sites-mirror.md` — public verifier ALSO lives on Walrus Sites (decentralized fallback)
