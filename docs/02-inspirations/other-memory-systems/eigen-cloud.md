# EigenCloud (EigenLayer)

## What it is

EigenCloud is **EigenLayer's pivot toward a cloud-style verifiable compute platform**. The premise: AI agents and complex apps can run off-chain while inheriting the transparency and slashing guarantees of restaking. EigenCloud bundles three core services for verifiable AI:

1. **EigenAI** — verifiable inference (cryptographic guarantees that agents operate with unmodified code and correct model weights).
2. **EigenCompute** — TEE-based execution environment (mainnet alpha). Devs upload Docker images, code runs inside a TEE, results return with attestation.
3. **EigenDA** — persistent data availability layer for verification metadata.

Plus **AgentKit** — an SDK for building sovereign agents that hold wallets and earn revenue (9 launch partners).

## Architecture

### Verification model (today, mainnet alpha)
- TEE-based execution (Intel TDX / equivalent).
- Cryptographic attestations of execution.
- EigenLayer staking ties economic penalties to infrastructure operator misbehavior.

### Verification model (roadmap)
- Multiple verifiability options: cryptoeconomic security on EigenLayer, ZK proofs.
- TEE is the *starting point*, not the endpoint.

### Stack
- **EigenLayer L1 restaking** as the trust root.
- **EigenCompute** as the execution layer.
- **EigenDA** for persistent data with availability proofs.
- **EigenAI** for inference-specific verifiability.

## Notable integrations

- **elizaOS** — the most-publicized integration. elizaOS uses EigenCompute to run agents in TEEs and EigenAI for verifiable inference. Combined with elizaOS's Walrus memory layer, this gives elizaOS a multi-vendor verifiable stack.
- **Ungate Wukong** — autonomous trading agent built on the trust layer.
- **Google partnership** — for business + consumer trust in AI payments.

## Memory / trace

- EigenCloud's primary product is **verifiable compute and inference**, not memory.
- EigenDA can store verification metadata (attestations, hashes) with availability guarantees — adjacent to memory but not a memory primitive.
- Persistent agent memory is delegated to the agent framework (e.g., elizaOS + Walrus).

## Verifiability mechanism

- **TEE attestation** (today, mainnet alpha)
- **Cryptoeconomic security** via EigenLayer restaking + slashing
- **EigenDA availability proofs** for persistent verification data
- **ZK proofs** on the roadmap

## How OneMem complements EigenCloud

- **Different layer of the stack.** EigenCloud verifies *execution*; OneMem verifies *memory state*. They compose: an agent runs verifiably on EigenCompute and stores its memory verifiably on OneMem (Walrus + Sui).
- **The elizaOS + Walrus + EigenCloud trio is the proof point.** elizaOS already uses Walrus for memory and EigenCloud for verifiable compute. OneMem (which sits on top of Walrus with a richer memory schema + cross-runtime API) is the natural next layer in that stack.
- **Cross-chain memory bridge.** EigenLayer is Ethereum-anchored. OneMem is Sui-anchored. A cross-chain attestation pattern — EigenCompute proves the run, OneMem anchors the memory, hashes are cross-referenced — gives an agent operator end-to-end provability across the strongest substrates on each chain.
- **No competitive overlap.** EigenCloud explicitly does not do agent memory; they delegate to frameworks like elizaOS. OneMem plugs in cleanly.

## Sources

- https://www.eigencloud.xyz/
- https://www.eigencloud.xyz/agentkit
- https://blog.eigencloud.xyz/eigencloud-brings-verifiable-ai-to-mass-market-with-eigenai-and-eigencompute-launches/
- https://blog.eigencloud.xyz/how-elizaos-built-cryptographically-verifiable-agents/
- https://blog.eigencloud.xyz/eigencloud-partners-with-google/
- https://blog.eigencloud.xyz/ungate-wukong-trust-layer-for-ai-agents/
- https://theagenttimes.com/articles/eigencloud-ships-agentkit-for-sovereign-agents-that-hold-wal-3bf30a83
- https://alearesearch.substack.com/p/eigencloud-verifiable-ai-compute
- https://4pillars.io/en/issues/eigencloud-when-agents-become-businesses
