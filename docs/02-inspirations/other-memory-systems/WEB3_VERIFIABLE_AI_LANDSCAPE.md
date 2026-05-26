# Web3-Native Verifiable AI Landscape

Cross-reference for OneMem positioning. Covers every Web3-native verifiable-AI project we surveyed, what layer of the stack each one occupies, and how OneMem complements (not competes with) each.

## Matrix

| Project | Chain(s) | Stack layer | Memory model | Trace model | Verifiability mechanism | Status |
|---|---|---|---|---|---|---|
| **Talus** | Sui (Move) | Agent runtime + workflow framework (Nexus) | Implicit in workflow state; no dedicated memory primitive; uses Walrus for large blobs | Workflow DAG on-chain; off-chain compute bound to on-chain commitments via Nexus | Move object state on Sui + Walrus proof-of-availability; off-chain compute trust = node operator | Mainnet live (v1.0, 2025) |
| **Theoriq (THQ)** | Ethereum + L2s | Agent registry + AgentFi + economic security | Per-agent process state; no public primitive | "Every step recorded in cryptographically verifiable environment"; storage details undisclosed | Proof of Contribution / Collaboration on EVM + TEE (Phala) + BFT consensus; ZK on roadmap | Live, THQ token, AgentFi mainnet |
| **Olas (Autonolas)** | Gnosis, Ethereum, multi-chain | Multi-agent services framework (Open Autonomy) | Developer's responsibility; not a framework primitive | ACN-based protocols; consensus-then-commit pattern | Multi-agent BFT consensus + NFT code registry + slashable staking; cryptoeconomic only | Live for years, hundreds of services |
| **ChainGPT** | EVM (AIVM roadmap) | B2B AI SaaS + roadmap chain | None | AIVM design includes audit trail; implementation TBD | AIVM design: ZK + TEE + multi-party verification + chain anchoring (roadmap) | Products live, AIVM still roadmap |
| **Cortex** | Cortex L1 (CVM, EVM-compat) | On-chain inference engine | None | Deterministic re-execution implicit in consensus | Deterministic inference via consensus (re-run on every node) | Live since 2018, niche |
| **Shade Agents (NEAR)** | NEAR + Chain Signatures cross-chain | Agent execution + cross-chain signing | TEE-encrypted local storage; no framework primitive | Not standardized | TEE attestation (Intel TDX / AMD SEV-SNP) + on-chain code hash + Chain Signatures MPC | Live on NEAR mainnet |
| **EigenCloud** | Ethereum L1 (EigenLayer) | Verifiable compute + inference + DA | None (delegated to frameworks like elizaOS) | EigenDA stores verification metadata + attestations | TEE attestation + cryptoeconomic security via EigenLayer restaking; ZK on roadmap | Mainnet alpha; AgentKit live |
| **elizaOS + Walrus** | Sui (via Walrus) | Agent OS + memory adapter | Walrus blobs as memory; standard elizaOS MemoryAdapter | TEE-anchored logs via plugin-tee-log/-verifiable-log; EigenCompute integration available | Walrus proof-of-availability certificates on Sui + Seal encryption + optional TEE attestation via EigenCloud | Live; Walrus default in elizaOS V2 |
| **ERC-8004** | Ethereum + all EVM chains | Identity / reputation / validation registry standard | None — registry only | None — but validation registry anchors pointers to off-chain proofs | Pluggable: anchors TEE, ZK, MPC, or cryptoeconomic proofs | Live on Ethereum mainnet (Jan 29, 2026) |
| **Recall Network** | Base (Ethereum L2) | Memory + skill marketplace + agent ranking | On-chain memory blocks via Tableland + Ceramic; Blake3 content addressing | On-chain action recording; AgentRank reputation | Blake3 hashes on Base + Ceramic streams + Tableland tabular DA | Live; RECALL token live |
| **OneMem** (this project) | Sui (Move) + Walrus + Seal + MemWal | **Memory + trace layer** for any agent runtime | Sui `MemoryNamespace` Move object; structured children typed by purpose (facts / episodes / procedural); Walrus blobs for content | First-class — every agent run produces an anchored trace tree | Walrus proof-of-availability + Sui object state + Blake3-style content hashing + Seal selective reveal | Hackathon scope (Sui Overflow 2026) |

## How OneMem complements each (one paragraph each)

**Talus.** Talus is the agent-runtime layer; OneMem is the memory + trace layer that any Talus agent could use. Talus's Nexus Onchain Package defines workflow DAGs as Move objects; OneMem's MemoryNamespace is also a Move object — they compose with no bridge. A Talus Tool Package could read/write OneMem namespaces directly, giving every Nexus agent verifiable, cross-runtime memory without Talus having to ship a memory primitive themselves.

**Theoriq.** Theoriq is EVM-native, AgentFi-focused, and explicitly anchors proofs of agent reasoning on Ethereum — but does not define a storage format for the trace bytes. OneMem can be the cross-chain memory + trace layer Theoriq agents reference: a Theoriq agent records its decision on Ethereum and references an OneMem Sui-anchored memory hash, giving end-to-end provability across both ecosystems.

**Olas.** Olas's MAS pattern (multi-agent BFT consensus, off-chain compute, on-chain commit) is architecturally similar to OneMem's workflow — but Olas leaves per-agent memory to the developer. An Open Autonomy memory adapter pointing at OneMem would give every Olas service verifiable memory without bespoke storage code.

**ChainGPT.** ChainGPT is primarily a product company on EVM with an AIVM roadmap. Limited deep overlap; OneMem could be the memory module in the AIVM design or a B2B partner ("ChainGPT for inference, OneMem for memory") if the AIVM ships.

**Cortex.** Largely orthogonal — Cortex is about *running* small models on-chain via deterministic inference. OneMem is about *remembering* outside the chain with on-chain anchoring. The architectural lesson Cortex teaches OneMem is that re-execution-based verifiability is too expensive at scale — hashing + DA proofs is the right level for memory.

**Shade Agents (NEAR).** Shade Agents has rock-solid code provenance (TEE + on-chain code hash) but no memory or trace primitive. A NEAR Shade Agent could anchor its session output to OneMem via a cross-chain receipt, getting verifiable memory to complement its verifiable code. No competition; integration story across chains.

**EigenCloud.** EigenCloud verifies *execution* via TEEs + cryptoeconomic security. OneMem verifies *memory state* via Walrus + Sui. They compose cleanly: an agent runs verifiably on EigenCompute and stores its memory verifiably on OneMem. The elizaOS + Walrus + EigenCloud stack is the working precedent.

**elizaOS + Walrus.** elizaOS already proved Walrus works as a memory substrate inside one framework. OneMem generalizes that proof into a cross-framework standard with a richer schema, typed namespaces, and cross-runtime MCP access. An `@elizaos/plugin-onemem` adapter is the most obvious integration shipping today.

**ERC-8004.** ERC-8004 is the EVM identity + reputation + validation registry standard. An ERC-8004 agent card can reference an OneMem MemoryNamespace as one of its service endpoints — making cross-chain agents discoverable on EVM but reading/writing memory on Sui. ERC-8004 reputation can also be computed in part from OneMem trace history (verifiable proof of past behavior). Combined with Google's A2A protocol, the three primitives (A2A = communication, ERC-8004 = identity/reputation, OneMem = memory/trace) form a full Web3 agent stack.

**Recall Network.** This is **the closest architectural analog**. Same memory-first thesis, different substrate (Base + Tableland + Ceramic vs Sui + Walrus + Seal + Move). Both use content hashing (Recall = Blake3 on Base, OneMem = Blake3-style on Sui). Recall couples its memory layer to an agent-competition + ranking product; OneMem focuses purely on the memory + trace substrate. Position: "Use OneMem for memory + trace, use Recall for evaluation + ranking" — and pursue an actual integration story since the two products live on different chains and serve different evaluator/builder audiences.

## Cross-project integration opportunities

These are the live, concrete integrations OneMem can pursue:

1. **`@elizaos/plugin-onemem`** — Memory adapter that uses OneMem's MemoryNamespace as the backing store for elizaOS V2. Hijacks the existing Walrus integration path with a richer schema. Single biggest distribution lever.
2. **Talus Nexus Tool Package** — Publish an OneMem tool package on Talus that lets any Nexus agent read/write memory via OneMem. Native Sui object composition; no bridge required.
3. **Hermes Agent memory provider** — Add OneMem as the 9th provider in NousResearch's Hermes Agent registry (alongside Mem0, Honcho, ByteRover, Hindsight, Holographic, OpenViking, RetainDB, builtin). Validates OneMem against the strongest provider-spec contract in the ecosystem and ships OneMem to Hermes's user base.
4. **MCP server** — OneMem as a first-class MCP server exposes the namespace to Claude Code, Cursor, Windsurf, Cline, ChatGPT, and any future MCP client. This is the cross-tool universal adapter.
5. **ERC-8004 agent cards** — A bridge contract that lets an EVM ERC-8004 agent card reference a Sui OneMem namespace as a service endpoint. Makes cross-chain agents possible.
6. **Cognee backend adapter** — Cognee's storage interface accepts a custom backend. An OneMem backend turns Cognee's graph + vector memory into verifiable, on-chain-anchored memory. Largest potential impact in the framework-agnostic memory market.
7. **LangMem `BaseStore`** — Implement `OneMemStore(BaseStore)` for LangGraph. Every LangGraph agent gets verifiable memory for free; LangMem's semantic/episodic/procedural taxonomy maps cleanly onto OneMem's typed namespace.
8. **EigenCloud + OneMem reference stack** — Publish a reference deployment: agent runs verifiably on EigenCompute (TEE), inference verified by EigenAI, memory anchored on OneMem (Sui+Walrus). Cross-chain trust composition.

## Yes/no — could Talus agents write to an OneMem MemoryNamespace?

**Yes, natively.** Both Talus's Nexus Onchain Package and OneMem's MemoryNamespace are Sui Move objects in the same chain. A Talus Tool Package can take a `MemoryNamespace` object reference as a parameter and call its public Move functions to read/write. No bridge, no off-chain coordinator, no oracle. This is the single strongest architectural argument for OneMem being on Sui rather than any other chain.

## Yes/no — could elizaOS use OneMem as a memory backend?

**Yes, via a memory adapter plugin.** elizaOS has a standard `MemoryAdapter` interface — the same interface their current Walrus integration uses. An `@elizaos/plugin-onemem` would implement that interface against OneMem's MCP server (or directly against the Move modules + Walrus SDK). This is a 2-3 day implementation given how clean both APIs are. The result: elizaOS agents inherit OneMem's typed schema, cross-runtime portability, and richer verifiability surface without elizaOS itself changing.

## Sources

See per-project files in this directory for full source URLs:

- `talus.md`, `theoriq.md`, `olas.md`, `chaingpt.md`, `cortex.md`, `shade-agents.md`, `eigen-cloud.md`, `elizaos-walrus.md`, `erc-8004.md`, `recall.md`
