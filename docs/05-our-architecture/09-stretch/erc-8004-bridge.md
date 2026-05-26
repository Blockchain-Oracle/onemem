# ERC-8004 Bridge — v0.2+ Vision

NOT BUILT AT v0.1. Documented for landing page Vision section + v0.2 roadmap.

---

## The idea

ERC-8004 is an EVM agent registry standard (Identity + Reputation + Validation registries). Live on EVM since Jan 2026, ~100k agents registered.

OneMem on Sui + ERC-8004 on EVM = the foundation of a cross-stack Web3 agent identity layer. Per `02-inspirations/other-memory-systems/erc-8004.md` + the WEB3_VERIFIABLE_AI_LANDSCAPE analysis.

---

## What we'd build

A bridge package:

```
onemem-erc-8004-bridge/
├── move/
│   └── erc8004_attestation.move      # Sui Move: store ERC-8004 attestation references
├── solidity/
│   └── OneMemAttestation.sol          # EVM: registry contract pointing at Sui sessions
└── ts/
    └── @onemem/erc-8004-bridge       # SDK helpers for cross-chain ref
```

User flow:
1. Hermes Agent (with OneMem) emits ActionCalls on Sui
2. Bridge package writes a summary attestation to EVM ERC-8004 registry
3. EVM dApps see the agent in their registry; can verify by following the Sui pointer
4. Cross-stack: an Olas/Theoriq/EigenAI agent could use its OneMem identity in EVM contexts

---

## Why v0.2

- Cross-chain bridging adds complexity (Wormhole / CCTP / native Sui ↔ EVM bridge)
- Requires both Move + Solidity development
- Adoption story depends on ERC-8004 ecosystem maturing
- Not load-bearing for v0.1 Walrus track demo

---

## Landing page mention

Vision bullet: "ERC-8004 bridge — interop with EVM agent identity registries."

That's all v0.1 says.

---

## Cross-references

- `README.md`
- `agent-reputation-graphs.md` — natural pair (Sui rep ↔ EVM rep)
- `../../02-inspirations/other-memory-systems/erc-8004.md` — ERC-8004 deep dive
- `../../02-inspirations/other-memory-systems/WEB3_VERIFIABLE_AI_LANDSCAPE.md` — 3-leg stack (ERC-8004 + OneMem + A2A)
