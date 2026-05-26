# Recall Network

## What it is

Recall is a **decentralized intelligence network and on-chain memory layer for AI agents**, built on Base (Ethereum L2). It was formed by the merger of **Textile (creators of Tableland)** and **3Box Labs (creators of Ceramic)** — combining two of the most established Web3 data primitives. RECALL is the native token.

Recall's positioning is "PageRank for AI agents" — it pairs the memory layer with a competitive evaluation protocol where agents compete in real-world tasks for ranking, with on-chain reputation flowing from the results. They claim 8M+ on-chain evaluations.

## Storage model

- **Memory-first architecture.** All AI agent actions and outcomes are verifiable on-chain.
- **Blake3 hashes** ensure memory blocks are cryptographically consistent and tamper-proof.
- **Layered storage.**
  - Off-chain bulk data via Tableland (modular, mutable, queryable tabular storage).
  - Persistent on-chain identities via Ceramic (verifiable, censorship-resistant document streams).
  - On-chain verifiable records on Base for immutable knowledge logs and reputation.
- **AgentRank / Recall Rank** — portable reputation scores updated dynamically based on competition outcomes and community staking.

## API surface

- Competition API (run / submit / score agent runs)
- Memory/skill marketplace (read, write, monetize knowledge)
- RECALL token for staking, payments, and skin-in-the-game ranking

(Public docs at `docs.recall.network` focus on overview rather than API specifics — full reference is gated behind the SDK and competition pages.)

## Integration model

- **Smart contracts on Base.**
- **Ceramic streams** for mutable agent state.
- **Tableland** for queryable tabular storage of evaluations, leaderboards, knowledge entries.
- **Live since 2025**; RECALL token launch covered Q2 2026.
- **GitHub:** `github.com/recallnet`.

## Closest competitor / overlap with OneMem

Recall is **the closest direct architectural analog** to OneMem in the entire landscape. The differences are crisp:

| Axis | Recall | OneMem |
|---|---|---|
| Chain | Base (EVM L2) | Sui (Move) |
| Bulk storage | Tableland (custom L2 + IPFS) | Walrus (purpose-built blob storage with proof-of-availability) |
| Identity/state streams | Ceramic | Sui objects (Move) |
| Encryption | Not native | Seal (native to Sui ecosystem) |
| Primary product | Agent competition + skill marketplace | Cross-runtime memory + trace anchoring |
| Token | RECALL (live) | (none / TBD) |

## What we'd borrow / how OneMem complements

- **The Blake3 content-addressing pattern is exactly right.** OneMem can use the same primitive — Walrus blobs hashed with Blake3, hash anchored on Sui, identical guarantee.
- **The "memory-first" framing** is already validated by Recall — OneMem can reuse the same investor/developer pitch language.
- **AgentRank is a primitive OneMem doesn't need to build.** OneMem's MemoryNamespace could expose its content + provenance trail; AgentRank-style reputation can be layered on top by other projects.
- **Don't compete on competition infra.** Recall's evaluation harness is well-funded and live. OneMem should position as the *substrate* — "use OneMem for memory + trace, use Recall for evaluation + ranking" — and pursue an actual integration story.
- **Architectural validation.** That two serious Web3 teams (Textile + 3Box) merged specifically to build this category tells you the market is real and the moat is the chain + storage choice. Sui + Walrus + Seal + Move is a genuinely different architectural bet than Base + Tableland + Ceramic.

## Sources

- https://www.recall.network/ (via docs)
- https://docs.recall.network/advanced/overview
- https://blog.ceramic.network/the-future-of-ceramic-focusing-on-recall/
- https://simplystaking.com/recall-on-ceramic
- https://www.bitget.com/academy/what-is-recall-and-how-does-it-work
- https://crypto-fundraising.info/projects/recall-labs/
- https://medium.com/@Alex44/recall-a-protocol-for-transparent-ai-competitions-and-persistent-intelligence-79fc2e33dafe
