# Nautilus TEE Relayer — Pillar 12 (Day 23+ Stretch)

Mysten is shipping a Nautilus TEE-attested relayer template (per `01-sui-ecosystem/nautilus-tee.md` + `DEEP_DIVE.md` §1 — confirmed PR + new template in MemWal repo). OneMem can be the FIRST product to use it.

If it ships, our pitch gains: "Memory + trace is Seal-encrypted, hash-chained, AND the relayer that processed it is TEE-attested."

---

## What Nautilus gives us

Per `01-sui-ecosystem/nautilus-tee.md`:

- Verifiable offchain computation on Sui via AWS Nitro Enclaves (and Marlin)
- On-chain PCR registration — anyone can verify what code ran inside the TEE
- Combined with Seal: TEE can persist + reload keys across runs

What this means for OneMem's relayer:

| Without Nautilus | With Nautilus |
|---|---|
| Relayer is trusted code; users hope it doesn't see plaintext | Relayer code is TEE-attested; users can verify the code that processed their writes |
| If relayer is compromised, blobs could be exfiltrated | TEE attestation guarantees the relayer ran specified code; tampering visible on-chain |
| "/manual" Seal flow means relayer never sees plaintext anyway | Same guarantee, but now even the metadata-handling code is provably correct |

Net: the trust model goes from "trust the /manual SDK code" (already strong) to "trust the /manual SDK + verify the relayer attestation" (provably stronger).

---

## v0.1 stretch scope (Days 23-26)

If everything else lands on schedule, attempt:

1. **Fork the MemWal relayer** (`MystenLabs/MemWal/services/server`) into an OneMem-deployment-ready package
2. **Wrap in Nautilus deploy template** (from Mysten's new template, per `DEEP_DIVE.md` §1)
3. **Add `seal_approve_tee` policy** — Seal `seal_approve` function that requires the caller's PCR to match the registered OneMem relayer PCR
4. **Deploy to AWS Nitro** (or Marlin) instance
5. **Document the verification flow** at `docs.onemem.ai/concepts/tee-attestation`
6. **Demo segment in the official video** — 15 seconds: "and the relayer that handles this? It runs in a TEE. The Sui chain knows what code is running. We can prove it."

Out of scope for v0.1 (even stretch):
- Production SLA (hosted Nautilus relayer with uptime guarantees)
- Multi-region failover
- Key persistence across Nautilus container restarts (Seal handles this, but not battle-tested at v0.1)

---

## Why this is "first product" signal

Per `DEEP_DIVE.md` §1: Nautilus-TEE relayer template was shipped by Mysten as an open PR + new template. No production app has built on it yet. OneMem being the first (or among the first) is a tangible "we're at the bleeding edge of the Sui ecosystem" signal for judges.

---

## If we don't land it at v0.1

No loss. The v0.1 pitch stands without Nautilus. We tease it in the landing page Vision section + in this doc. Ship Nautilus in v0.2 when we have more time.

The risk-free fallback: just say "TEE-attested relayer in v0.2" on the landing page. Don't make it load-bearing for v0.1.

---

## Cross-references

- `README.md` (this folder)
- `../../01-sui-ecosystem/nautilus-tee.md` — Nautilus deep dive
- `../../02-inspirations/memwal-incubation/README.md` — MemWal repo's open PRs (look for the Nautilus template)
- `../00-overview/BUILD_SEQUENCE.md` — Days 23+ slot
- `../07-marketing-and-docs/landing-architecture.md` — Vision section teaser
