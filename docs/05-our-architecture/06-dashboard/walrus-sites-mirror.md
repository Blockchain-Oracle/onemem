# Walrus Sites Mirror — OneMem Dashboard

The Walrus Sites target is the decentralized fallback surface for OneMem's
hosted dashboard work. The current repo ships a checked-in static public
verifier shell first; the full dashboard mirror remains future work.

Walrus Sites = static hosting on Walrus, usually fronted by SuiNS for a
human-readable name.

Source-of-truth reference: `../../01-sui-ecosystem/walrus-deep-dive.md`
(Walrus Sites docs section).

---

## Why Walrus Sites for OneMem

1. **Decentralized verification fallback.** If the hosted app is unavailable,
   users should still have a static verifier that can check Sui trace evidence.
2. **Sponsor-aligned narrative.** The proof-critical verification path works
   from a static Walrus-hosted page.
3. **No fake mirror claim.** Server-backed dashboard routes are not described
   as static until they actually have static/browser-side replacements.

---

## Current deploy boundary

Current implementation status:

- `apps/hosted-dashboard/walrus-sites/verifier/` is a checked-in static
  artifact with `index.html`, CSS, JS, and `ws-resources.json`.
- The shell verifies a OneMem `TraceSession` from Sui JSON-RPC in the browser:
  it loads the object, scans matching `ActionCallEmittedEvent` rows, checks the
  `prev_hash` chain, recomputes `SHA-256(running_root || content_hash)`, and
  compares the computed root to the session's on-chain Merkle root.
- `scripts/deploy-walrus-sites.sh` defaults to that verifier directory and
  refuses to deploy missing artifacts or the repo root.
- `.github/workflows/deploy-walrus-sites.yml` validates and deploys that same
  static artifact.
- A live Walrus Sites URL remains pending until `site-builder` runs in a funded
  Sui/WAL environment.
- The full hosted dashboard still contains server-backed API routes and
  force-dynamic pages. A full static mirror remains pending.

---

## Build pipeline

```bash
# 1. Validate the checked-in static verifier artifact.
bash scripts/deploy-walrus-sites.sh --check

# 2. Optional: validate an explicit artifact path and network context.
bash scripts/deploy-walrus-sites.sh \
  --check \
  --dist apps/hosted-dashboard/walrus-sites/verifier \
  --epochs 26 \
  --context mainnet

# 3. Walrus Sites deploy, once wallet/WAL/SUI environment is configured.
bash scripts/deploy-walrus-sites.sh \
  --dist apps/hosted-dashboard/walrus-sites/verifier \
  --epochs 26 \
  --context mainnet
# returns Site Object ID + URL like https://<base32-hash>.wal.app
```

Optional SuiNS mapping happens only after a successful first deploy returns a
site object ID.

---

## Static verifier scope

| Capability | Current static verifier |
|---|---|
| Public `/verify` shell | Built as static HTML/CSS/JS |
| Sui `sui_getObject` read | Built in browser |
| Sui `suix_queryEvents` scan | Built in browser |
| Merkle root recompute | Built with browser `crypto.subtle.digest` |
| Proof boundary copy | Built |
| Mainnet verification | Disabled until mainnet package ID exists |
| Full authenticated dashboard | Pending |
| Hosted share/onboarding flows | Pending for static mirror |
| Live Walrus URL | Pending `site-builder` deployment |

---

## Proof boundary

The static verifier proves chain integrity for OneMem trace metadata:

- the TraceSession object exists at the provided Sui object ID;
- matching `ActionCallEmittedEvent` rows can be read from the configured package;
- each event's `prev_hash` matches the predecessor content hash;
- the recomputed Merkle root matches the TraceSession object.

It does not prove plaintext content, external tool execution, Walrus blob
availability, Seal decryptions, or semantic correctness.

---

## Future full-dashboard mirror

The larger dashboard mirror needs static/browser-side replacements for features
that currently depend on server code:

| Feature | Hosted app | Future Walrus mirror |
|---|---|---|
| Auth / Enoki | Server routes plus wallet state | Client-side only or omitted |
| Hosted sponsorship | Next API routes | Separate service or omitted |
| SSE stream | Next API route | Direct relayer/Sui polling |
| Memory/session APIs | Server wrappers | Browser-side SDK/RPC calls |
| Share mutations | Sponsored API routes | Separate service or CLI handoff |

Do not describe the full hosted dashboard as deployed on Walrus until this work
is implemented and a live site URL is verified.

---

## Cross-references

- `local-deploy.md` — the local dashboard server
- `hosted-deploy.md` — the hosted app shell
- `ui-architecture.md` — route split and data flow
- `../../01-sui-ecosystem/walrus-deep-dive.md` — Walrus Sites mechanics
