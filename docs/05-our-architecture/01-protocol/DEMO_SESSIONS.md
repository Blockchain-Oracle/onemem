# Verifiable Demo Sessions

Real OneMem trace sessions deployed + verified end-to-end on Sui testnet. Each is a complete trace (open → emit calls → close) with a Merkle chain that any independent verifier can replay off-chain and match against the on-chain `session.merkle_root`.

**Use these for the `/verify/[session_id]` dashboard demo, the submission video, and pitch material.**

---

## testnet sessions

### Session #1 — SDK smoke test, 3 chained calls, status=COMPLETED

| Field | Value |
|---|---|
| Network | `testnet` |
| Session ID | `0x08f4ef5b53c768eb446a18659ecc0775ac1a58763890ae51d6658c301a3f33e8` |
| Verify URL (when dashboard ships) | `app.onemem.ai/verify/0x08f4ef5b53c768eb446a18659ecc0775ac1a58763890ae51d6658c301a3f33e8` |
| Suiscan | <https://suiscan.xyz/testnet/object/0x08f4ef5b53c768eb446a18659ecc0775ac1a58763890ae51d6658c301a3f33e8> |
| Call count | 3 (linear parent chain: call[0] → call[1] → call[2]) |
| Merkle root | `0x82fb3f4cd63059e4172938178d1a8b4dd59bf66a1575c1c4002727df5aae806e` |
| Verified | ✓ ok=true; computedRoot equals on-chain root; prev_hash chain intact |
| Created by | `scripts/sdk-smoke-testnet.ts` |

How to re-verify from another machine:

```bash
cd /Users/abu/dev/hackathon/sui-overflow/onemem
pnpm exec tsx -e "
  import { OneMem } from './packages/sdk-ts/src/index.js';
  import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
  const onemem = await OneMem.create({
    network: 'testnet',
    signer: Ed25519Keypair.generate(),  // any keypair; verify is read-only
  });
  const r = await onemem.traces.verifySession('0x08f4ef5b53c768eb446a18659ecc0775ac1a58763890ae51d6658c301a3f33e8');
  console.log(r);
"
```

---

## How to add a new demo session

Run the smoke script (creates a fresh session every time — `Date.now()` in the namespace name ensures uniqueness):

```bash
pnpm exec tsx scripts/sdk-smoke-testnet.ts
```

Copy the printed `sessionId` + `merkle root` into a new section above.

---

## What these sessions prove

Each verified session is a public, mathematically-checkable claim:

1. The chain of calls was recorded on Sui at the captured timestamps (signed by Sui validators in the consensus checkpoint).
2. No call was inserted, deleted, or reordered (prev_hash chain intact).
3. No call's content was modified (merkle_root chain matches off-chain re-computation).
4. The recording was authorized by the holder of the right `NamespaceCapability<ReadWrite>` (Sui object ownership semantics — only a delegate-key holder can sign the publish tx).

What they DO NOT prove (honest disclosure):
- The agent actually performed the real-world action the call describes. The captured_by_address can record whatever it wants. A v0.2 Nautilus TEE relayer would close this gap by signing only what the relayer itself observed.

This honest split is documented at `docs/05-our-architecture/06-dashboard/route-verify-public.md` (the public verify page surfaces it visibly).
