# Talus Network (deepened)

## What it is

Talus is the **agent-runtime layer for Sui** — a decentralized AI automation protocol that lets developers and creators launch AI agents that "think and act in verifiable and transparent ways." Built in Move on Sui. Talus Protocol v1.0 went live on Sui mainnet in 2025.

This is the most architecturally adjacent project to OneMem in the entire Sui ecosystem. The relationship is **complementary, not competitive** — Talus is the *agent runtime*, OneMem is the *memory + trace layer* any Talus agent could plug into.

## Architecture

Three components:

### 1. Talus Network
A network of nodes optimized for agent execution. Provides the off-chain compute substrate where LLM inference and heavy work happens.

### 2. Nexus (the agentic framework)
**"The world's first framework for fully onchain autonomous AI agents."** Three sub-layers:

- **Onchain logic** — Sui Move smart contracts manage workflow execution, orchestration, agent permissions, asset management. The **Nexus Onchain Package (NOP)** is the foundational layer maintained by the Talus team — defines core data structures, workflow coordination logic, and protocol primitives. **Tool Packages** sit atop NOP and let developers publish modular tools agents can invoke.
- **Python SDK** — developer-facing API for setting up agents, interacting with contracts, running workflows.
- **Offchain components** — LLM inference and tools, defined in two Python packages: `nexus_events` and `nexus_tools`.

### 3. Sui as the substrate
- Sui Move's object-centric model fits the framework naturally (workflows = DAGs of objects).
- Programmable Transaction Blocks (PTBs) allow up to 1,024 operations per execution.
- Parallel execution for independent transactions.
- Sub-second finality.

## Walrus integration

Talus uses **Walrus for onchain storage** of large objects (models, datasets, media). This is publicly announced and documented — Talus and Walrus have a partnership story. Walrus's proof-of-availability is the verification layer for off-chain data.

## Verifiable execution

Every Talus Agent action is recorded onchain. The Nexus workflow DAG, the agent permissions, the asset state — all live in Sui Move objects. Off-chain compute is bound back to on-chain commitments via the Nexus protocol.

## Real deployments

- **Doppel Games** — early adopter, AI gaming arena built on Talus.
- **Swarm Network** — multi-agent coordination partnership.

## API surface

- **Nexus Python SDK** (primary)
- **Nexus Onchain Package (Move)** — `Talus-Network/nexus` repo
- **Tool Packages** — open ecosystem of Move modules other devs publish

## How OneMem complements Talus

**This is the key relationship in our landscape.** Talus owns the *runtime + workflow* layer; OneMem owns the *memory + trace* layer. They are non-overlapping.

- A Talus Agent's workflow DAG is on-chain — but the LLM inputs/outputs, intermediate reasoning traces, and accumulated memory between runs are *not* canonically defined by Nexus. Today the LLM I/O ends up in `nexus_events` off-chain or in ad-hoc storage. **OneMem can be the standard memory backend for Nexus agents** — give every Talus agent a `MemoryNamespace` Sui object, write traces to Walrus, anchor hashes back to the agent's Nexus state.
- The Nexus Onchain Package already uses Move objects. OneMem's MemoryNamespace is also a Move object. They compose natively — a Talus Tool Package could read/write OneMem namespaces directly with no bridge.
- The OneMem MCP server lets a Talus-deployed agent *also* be queryable from any non-Talus agent runtime (Claude Code, Cursor, Hermes, Letta, elizaOS) — turning Talus agent memory into cross-runtime portable memory.

## Sources

- https://talus.network/
- https://blog.talus.network/
- https://blog.talus.network/talus-protocol-v1-0-release-verifiable-ai-agents-live-on-sui-mainnet/
- https://blog.talus.network/introducing-nexus-the-worlds-first-fully-onchain-agentic-framework/
- https://github.com/Talus-Network/nexus
- https://talus.network/whitepaper
- https://talus.network/litepaper
- https://www.walrus.xyz/blog/talus-builds-onchain-ai-agents-walrus
- https://blog.sui.io/talus-ai-agents-walrus/
- https://blog.talus.network/talus-x-doppel-games-bringing-verifiable-autonomy-to-the-ai-gaming-arena/
- https://blog.talus.network/talus-partners-with-swarm-network-to-scale-multi-agent-coordination/
- https://a1research.io/blog/talus-the-foundational-layer-of-the-agentic-onchain-economy
