# ChainGPT

## What it is

ChainGPT is a Web3-native AI infrastructure brand — chatbot, image generator, smart-contract utilities, NFT tools, and a broader AI agent platform with a roadmap for an **AIVM (AI Virtual Machine)**, a blockchain layer purpose-built for AI-native applications and agent execution. CGPT token live.

ChainGPT is more of a *consumer + tool layer* than a deep infrastructure protocol — but the AIVM whitepaper is technically substantive.

## Architecture

### AIVM (roadmap)
- A blockchain layer for AI-native apps and agent execution.
- Engine for executing smart contracts, managing agent logic, on-chain operations.
- **Dual-path execution:** simple models run on-chain transparently; complex workloads off-chain on specialized nodes.
- **Validator specialization:** some validators verify execution, others monitor compute quality, others maintain data integrity.

### Verification layers (AIVM design doc)
- **Cryptographic proofs** — mathematically verify model outputs.
- **Hardware attestation** — TEEs confirm secure isolated execution.
- **Multi-party verification** — redundancy via cross-checking validators.
- **Blockchain anchoring** — every proof stored on-chain for immutable audit trail.

### Current products (live, pre-AIVM)
- Web3 AI chatbot (B2B SaaS API + SDK)
- AI NFT generator
- Smart-contract auditor and code generator
- AI Agents SDK (announced 2025)

## Memory / trace

- ChainGPT's product set does **not** ship a dedicated memory or trace primitive.
- The AIVM design includes an immutable audit trail of model outputs and proofs — closer to trace than memory.
- No public MemoryNamespace-equivalent.

## Verifiability mechanism

- Per AIVM whitepaper: ZK + TEE + multi-party verification + chain anchoring.
- Status of these mechanisms in production is unclear — most is roadmap.

## Status

- CGPT token live.
- Multiple consumer + B2B AI products in production.
- AIVM remains largely a roadmap item — no public mainnet AIVM chain confirmed.

## How OneMem complements ChainGPT

- **Different scope.** ChainGPT is a product company building consumer + B2B AI services on Web3. OneMem is an infrastructure protocol for verifiable memory + trace.
- **AIVM compatibility:** If AIVM ships, it would presumably define its own audit trail format. OneMem could position as the standard memory layer for AIVM agents, sitting at the same architectural altitude as a "memory module" in their stack.
- **B2B SaaS angle:** ChainGPT sells AI SDKs/APIs to other Web3 companies. An OneMem SDK is sold to a similar audience — there's a "ChainGPT for inference, OneMem for memory" partnership shape that would benefit both.
- **Limited direct overlap.** ChainGPT is not deeply technical at the layer OneMem targets. Mostly a product company; useful for distribution stories, not architectural inspiration.

## Sources

- https://www.chaingpt.org/
- https://docs.chaingpt.org/
- https://docs.chaingpt.org/ai-tools-and-applications/aivm-blockchain-whitepaper
- https://docs.chaingpt.org/dev-docs-b2b-saas-api-and-sdk/web3-ai-chatbot-and-llm-api-and-sdk
- https://medium.com/@chaingpt/ai-agents-are-coming-to-chaingpt-meet-the-future-of-decentralized-automation-8a2cef3ca1ed
- https://www.chaingpt.org/blog/ai-agents-are-coming-to-chaingpt-meet-the-future-of-decentralized-automation
- https://kaironlabs.com/blog/chaingpt-transforms-the-blockchain-ecosystem-through-ai
