---
purpose: Concise reference for Nautilus — verifiable offchain compute (TEE) on Sui. Why OneMem might use it for the relayer Day 23-29.
sources:
  - https://docs.sui.io/sui-stack/nautilus/nautilus-overview
  - https://docs.sui.io/sui-stack/nautilus/nautilus-design
  - https://docs.sui.io/sui-stack/nautilus/seal
  - https://github.com/MystenLabs/nautilus
verified: 2026-05-23
---

# Nautilus (TEE) for OneMem

## What it is

Verifiable offchain compute on Sui. Run code in a Trusted Execution Environment (TEE), produce a cryptographic attestation, verify the attestation onchain via Move smart contract.

Supported TEEs:
- **AWS Nitro Enclaves** (self-managed) — primary supported environment.
- **Marlin Oyster** — Dockerized TEE marketplace deployments.

Reference repo: https://github.com/MystenLabs/nautilus (template — Apache 2.0, "not feature complete, not audited" disclaimer).

## Two components per Nautilus app

1. **Offchain server** — runs inside the TEE. Handles user input, scheduled tasks, external API calls, AI inference.
2. **Onchain Move contract** — verifies TEE attestations before accepting outputs. PCRs (enclave measurements) must be registered + verified onchain.

## When OneMem might use it (Day 23-29)

Per the spec brief: the relayer Day 23-29 is the Nautilus integration window. Two natural fits:

1. **OneMem relayer in a TEE.** OneMem's middleware (sits between agents + MemWal) processes potentially sensitive memory writes. Running it in a TEE means:
   - Users get cryptographic guarantee OneMem never logged plaintext outside the enclave.
   - The OneMem Move contract can verify the relayer's attestation before accepting a `commit_memory` call (gates submissions to attested code).
   - Differentiator: MemWal's Nautilus PR (MEM-51) wraps the MemWal relayer; OneMem wrapping its own audit relayer in TEE makes the entire chain (agent → OneMem → MemWal) verifiable.

2. **AI inference for memory enrichment.** If OneMem auto-classifies / extracts policy violations / runs anomaly detection on agent memory writes, run that in Nautilus so the classification is verifiably tamper-resistant. PCR registration commits the exact model + code that processed each write.

## Nautilus + Seal combo (documented pattern)

A common TEE challenge: persisting secret keys across restarts / migration. Seal solves this — store long-term keys in Seal, grant decryption ONLY to properly attested TEEs (via `seal_approve` checking the TEE attestation).

```move
entry fun seal_approve_tee(
    id: vector<u8>,
    attestation: &TeeAttestation,
    expected_pcrs: &PcrRegistry,
) {
    assert!(verify_attestation(attestation, expected_pcrs), EBadAttestation);
    // Bind id to attestation digest if you want per-session keys.
}
```

The combo lets you build apps where:
- OneMem state is encrypted at rest with Seal-managed keys.
- Only the attested TEE running the OneMem code can decrypt.
- Encrypted state lives on Sui / Walrus; processing happens inside the enclave.

See `https://docs.sui.io/sui-stack/nautilus/seal` for the full pattern.

## Use cases per Mysten

From the Nautilus overview:
- Trusted oracles (Web2 → onchain, with TEE attestation as freshness/integrity proof).
- **AI agents** (run inference inside TEE, attest data + model provenance onchain). ← OneMem fit.
- DePIN privacy.
- Fraud prevention in multi-party systems.
- Identity management.

## Pros for OneMem judging

- **"AI agents in a TEE with onchain attestation"** is one of two angles Mysten explicitly calls out in the Nautilus overview. OneMem hits this verbatim.
- Adds verifiability past "trust the relayer" — relevant to OZ / OtterSec security-track judging signals.
- Modest dev cost if OneMem reuses the reference template — clone, swap the offchain handler, write a `seal_approve_tee` policy.

## Cons / risks

- AWS Nitro setup is non-trivial (1-2 days of devops if you've never done it).
- The reference template is explicitly "not feature complete, not audited" — production claims should be muted.
- If OneMem's relayer is doing simple metadata commits, TEE adds operational complexity without much trust win.

## OneMem recommended approach

- **Day 1-22**: ship without TEE. OneMem relayer runs as a normal server. Soak the audit flow.
- **Day 23-29**: wrap the relayer in Nautilus (AWS Nitro). Add a `seal_approve_tee` policy. Register relayer PCRs in OneMem Move contract.
- **Demo**: show OneMem rejecting a `commit_memory` call from a non-attested relayer (using a tampered binary), then accepting one from the genuine TEE.

This is exactly the "you can verify OneMem itself, not just trust it" story the security tracks reward.
