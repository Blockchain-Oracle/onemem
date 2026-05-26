# Theoriq (THQ)

## What it is

Theoriq is a Web3 "agentic base layer" on Ethereum — a protocol for deploying AI agents inside live DeFi markets with provable execution, transparent economic logic, and a permanent audit trail. Built by **ChainML**. SDK at `chain-ml/theoriq-agent-sdk`. Focus: **AgentFi** — yield generation via AI agents on-chain.

## Architecture

**Hybrid on-chain / off-chain.**

### On-chain (EVM smart contracts)
- **Agent registration as NFTs.** Every Agent has an on-chain NFT identity.
- **Token operations** — payments, staking, slashing.
- **Anchoring of cryptographic proofs** — *Proof of Contribution* and *Proof of Collaboration* are recorded on-chain.
- **Verifiable message passing** — agents communicate through chain-anchored messages.

### Off-chain
- **Agent execution** in Python or Rust.
- **Swarm kernel** lets developers deploy individually upgradable agents that compose via standardized "Behaviors" (chat, code generation, data analysis, etc.).

### Computation verification (roadmap)
- **Phase 1:** Economic security via BFT consensus on model inference (interim).
- **Phase 2:** zkRollup migration — more protocol logic on-chain, more verifiability.

## Memory / trace handling

- Per-agent reasoning is recorded for verifiability — "every step, from reasoning to transaction execution, is recorded in a cryptographically verifiable environment."
- The exact storage mechanism for the trace data is **not public** in the litepaper — likely a mix of off-chain storage with on-chain hash anchoring.
- No public memory primitive (no MemoryNamespace equivalent); memory is implicit in the agent's process state.

## Verifiability mechanism

- **Cryptographic proofs anchored on EVM.**
- **Phala Network partnership** for TEE-based secure inference.
- **OpenLedger partnership** to bring verifiable agents into live DeFi.

## Status

- THQ token live.
- AgentFi product live with mainnet deployments.
- SDK public.

## How OneMem complements Theoriq

- **Theoriq is EVM, OneMem is Sui.** No ecosystem overlap; we're not competing for the same developer.
- **Both share the "verifiable agent" thesis but cover different layers.** Theoriq is agent registry + execution + economic security. OneMem is memory + trace + cross-runtime portability.
- **Cross-chain story:** Theoriq's Proofs of Contribution / Collaboration could reference OneMem namespace hashes for the agent's *memory state* at the time of contribution. Verifiable cross-chain agent memory — a real integration if/when both teams want it.
- **Borrowable concept:** the *Behaviors* primitive (standardized agent capabilities as composable units) is interesting for OneMem's tool-trace anchoring — a Behavior could carry its own anchoring policy.
- **Trace storage gap.** Theoriq's litepaper doesn't define how trace bytes are stored — exactly the gap OneMem fills. Pitch: "Use OneMem for trace storage on any chain, including Ethereum, with cross-chain hash verification."

## Sources

- https://www.theoriq.ai/
- https://uploads-ssl.webflow.com/6631eac002c5853093efa70c/66a26a64a4d588f0092e6843_Theoriq_Litepaper_2024JUL23r2.pdf
- https://github.com/chain-ml/theoriq-agent-sdk
- https://www.theoriq.ai/blog/theoriq-and-phala-network-partner-to-advance-secure-and-resilient-ai-agents-in-web3
- https://www.prnewswire.com/news-releases/openledger-partners-with-theoriq-to-bring-verifiable-ai-agents-into-live-defi-markets-302664498.html
- https://chainclarity.io/theoriqai
- https://blog.ju.com/theoriq-thq-analysis/
- https://medium.com/@0xjacobzhao/theoriq-research-report-the-evolution-of-agentfi-in-liquidity-mining-yields-fd2c36a6fd4e
