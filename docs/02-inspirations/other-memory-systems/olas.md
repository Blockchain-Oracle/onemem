# Olas (formerly Autonolas)

## What it is

Olas is one of the oldest and most established **decentralized autonomous-agent networks** — predates the current AI agent boom. Built on a multi-chain footing (Gnosis, Ethereum, Polygon, Solana via bridges). Native token: OLAS. Slogan/thesis: "towards a billion AI agents, owned and powered by users."

The framework's name is **Open Autonomy** — a Python framework for building **agent services** (off-chain autonomous services running as multi-agent systems that interact with on-chain contracts).

## Architecture

### Composition stack
- **Components** — atomic building blocks.
- **Skills** — compositions of components (multiple rounds = a skill).
- **Agent blueprints** — compositions of skills.
- **Agent instances** — runtime agents from blueprints.
- **Multi-agent services** — multiple agent instances running as one autonomous service.

### Multi-Agent Systems (MAS) architecture
- Agents communicate over the **Agent Communication Network (ACN)** with structured protocols.
- Agents expose REST APIs and call external APIs to interact with traditional services.

### On-chain registry
- All components, agents, services registered as **NFTs on Ethereum / L2s**.
- Provides primitives for composing components → agents → services and operating them.
- On-chain economic primitives (staking, slashing, payments) tie behavior to incentives.

### Open Autonomy Framework
- Off-chain autonomous services that operate as MAS.
- Extends operational scope of traditional smart contracts.
- Built in Python.

## Memory / trace

Olas is not a memory product. Per-agent memory is the developer's responsibility. The framework's primitives are around *coordination* (consensus among agents, atomic on-chain commits) rather than memory.

That said — many Olas services *do* manage persistent state, and the framework's pattern of off-chain consensus + on-chain anchoring is architecturally similar to OneMem's flow.

## Verifiability mechanism

- Multi-agent consensus (BFT-style) — agents within a service reach consensus before committing on-chain.
- On-chain NFT registry for code provenance.
- Slashable staking for misbehavior.
- No TEE / no ZK in the default model — verifiability is **cryptoeconomic**.

## Status

- Live for years across multiple chains.
- Hundreds of services deployed.
- Mature SDK, real revenue.

## How OneMem complements Olas

- **Different layer.** Olas is the agent coordination + services framework. OneMem is memory + trace.
- **Memory gap inside Olas services is real.** Olas services often need persistent state per agent instance — currently developers roll their own storage (IPFS, S3, custom DBs). An OneMem adapter for Open Autonomy would give every Olas service verifiable memory for free.
- **Cross-chain story:** Olas runs primarily on Gnosis/EVM. OneMem is Sui. Integration would require either:
  - A bridge (write hashes on Sui, reference them from Gnosis), or
  - A future EVM port of OneMem (worth considering if Olas adoption justifies it).
- **The MAS pattern is borrowable.** Olas's ACN + protocols define how multiple agents talk and reach consensus. OneMem could borrow this: multi-agent writes to a single MemoryNamespace could go through a consensus step (multiple agents must agree) before anchoring.

## Sources

- https://www.olas.network/
- https://stack.olas.network/open-autonomy/
- https://docs.olas.network/open-autonomy/
- https://stack.olas.network/open-autonomy/questions-and-answers/
- https://www.rootdata.com/Projects/detail/Autonolas?k=Nzk2NA%3D%3D
- https://www.gate.com/learn/articles/olas-towards-a-billion-ai-agents/4797
- https://www.gate.com/learn/articles/what-is-autonolas-olas/7162
- https://collectiveshift.io/olas/
