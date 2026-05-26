# Shade Agents (NEAR)

## What it is

Shade Agents is NEAR Protocol's framework for **trustlessly autonomous AI agents** that can own assets and operate cross-chain. Built by NEAR + Proximity Labs. The two technical pillars:

1. **NEAR Chain Signatures** — multi-party computation that lets a NEAR contract sign transactions on any chain (BTC, ETH, Solana, etc.).
2. **TEE-attested code** — agents run inside Trusted Execution Environments (Intel TDX, AMD SEV-SNP); the TEE's attestation proves the agent is running the registered code.

## Architecture

- **Agent contract on NEAR** verifies:
  1. The agent's code hash matches what was registered.
  2. The code is running inside an approved TEE.
  3. The transaction the agent wants to sign falls within allowed policy.
- **TEE worker** runs the agent's actual logic (LLM calls, business rules) and submits signed transactions via Chain Signatures.
- **Cryptographic attestations** flow from TEE → NEAR contract → cross-chain signature.

## Memory / trace

- Shade Agents doesn't ship a memory primitive. Memory is the developer's responsibility, typically inside the TEE's encrypted storage.
- The TEE attestation + code hash registry gives a *code provenance* trail, not a *memory provenance* trail.
- Trace of agent decisions is not standardized — the agent's logs live wherever the developer puts them.

## Verifiability mechanism

- **TEE attestation** is the trust root (Intel SGX/TDX, AMD SEV-SNP).
- **On-chain code hash** registration on NEAR.
- **Chain Signatures** ensure only the verified agent code can sign outbound transactions.
- **No ZK in the default model.** TEE is the verifiability boundary.

## Use cases highlighted

- DeFi automation (autonomous treasury management).
- Prediction markets.
- Cross-chain asset management without trusted custodians.
- Privacy-preserving computation.

## Status

- Live on NEAR mainnet.
- Aurora Virtual Chains (NEAR's EVM L2) partnership for broader deployment.
- Active developer ecosystem.

## How OneMem complements Shade Agents

- **Different chain (NEAR), different verifiability primitive (TEE + MPC vs Walrus proof-of-availability + Sui anchoring).**
- **Memory gap is real.** Shade Agents have rock-solid code provenance but no memory/trace primitive. A Shade Agent that runs over a long horizon (months of treasury management) accumulates state that benefits from verifiable, queryable storage. OneMem could be that storage layer — even on NEAR, via a cross-chain bridge.
- **Architectural cousin.** OneMem and Shade Agents share the philosophy that "the trust property must be cryptographic, not reputational." We anchor different things (memory vs code), but the worldview is the same.
- **Possible integration:** a Shade Agent could include an `onemem_anchor` step that writes its session output to Walrus and emits the hash to a cross-chain receipt — making the agent's *output trail* verifiable across chains, complementing the on-chain *code* attestation.
- **No competition.** NEAR's developer base is largely disjoint from Sui's; integration story rather than competitive story.

## Sources

- https://docs.near.org/ai/shade-agents/introduction
- https://www.proximity.dev/shadeagents
- https://medium.com/nearprotocol/shade-agents-the-first-truly-autonomous-ai-agents-a5ac4c51bda9
- https://nightly.app/article/shade-near-agents-ai-that-controls-crypto-wallets-without-trust-issues
- https://iq.wiki/wiki/shade-agents
- https://aminagroup.com/research/near-protocol-bringing-ai-and-smart-ux-onchain/
- https://messari.io/copilot/share/understanding-shade-agents-3aa84375-0167-44b6-a8bc-ea27dec57d9f
- https://x.com/auroraisnear/status/1966078691747967132
