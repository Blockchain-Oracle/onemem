# Cortex (Cortex Labs)

## What it is

Cortex is one of the **oldest decentralized AI inference platforms** — predates the current wave. It's a Layer 1 blockchain (CTXC) with **on-chain AI inference** as the core feature. The Cortex Virtual Machine (CVM) is EVM-compatible with added GPU-backed AI opcodes. Cortex aimed to be "the first decentralized world computer capable of running AI on-chain."

## Architecture

- **CVM (Cortex Virtual Machine)** — EVM-compatible with native AI inference opcodes. Uses GPU for non-trivial model execution.
- **Deterministic inference engine** — guarantees identical inference output across heterogeneous compute (critical for consensus on AI outputs).
- **On-chain AI model marketplace** — models can be published, bought, sold, or licensed.
- **AI smart contracts** — Solidity-style contracts that can call AI inference natively.

## Memory / trace

- **No memory layer.** Cortex is an inference + marketplace platform. Per-agent memory is not in scope.
- **Deterministic inference traces** are implicit in the consensus mechanism — every node re-runs inference and reaches the same result.

## Verifiability mechanism

- **Deterministic inference** is the trust property — verifiability via redeterminism rather than ZK or TEE.
- **Secure enclaves** mentioned in marketing for privacy-preserving training, but on-chain inference is the headline feature.

## Status

- Live for years (since 2018).
- CTXC token.
- Modest activity relative to newer Web3 AI projects.
- Niche but architecturally pioneering.

## How OneMem complements (or doesn't)

- **Largely orthogonal.** Cortex is about *running* AI on-chain; OneMem is about *remembering* AI off-chain with on-chain anchors.
- **Possible composition:** an agent running on Cortex's CVM could anchor its memory state to OneMem (cross-chain — would require a bridge). Probably more theoretical than practical given Cortex's small footprint.
- **Architectural note:** Cortex's deterministic inference is one of three approaches to verifiable AI (the others being TEE-attested and ZK-proven). It's the oldest approach and the most constrained — only small models can run deterministically on-chain at reasonable cost. The fact that newer projects (Talus, EigenCloud, Shade Agents) all chose TEE / cryptoeconomic security over deterministic inference is a useful signal for OneMem: don't assume re-execution is the right verifiability primitive for memory; per-blob hashing + Sui anchoring is the right level.

## Sources

- https://www.cortexlabs.ai/
- https://medium.com/cortexlabs/how-cortex-brings-ai-on-the-blockchain-part-1-what-is-cortex-solving-b2083f9492bc
- https://medium.com/cortexlabs/how-cortex-brings-ai-on-the-blockchain-part-2-ai-on-blockchain-ecosystem-87bd482e1ec1
- https://medium.com/cortexlabs/introducing-cortex-a-decentralized-ai-autonomous-system-b9c7a51958a0
- https://github.com/CortexFoundation/tech-doc/blob/master/ai-dapps.md
- https://www.diadata.org/web3-ai-map/cortex/
- https://iq.wiki/events/cortex-protocol
