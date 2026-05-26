# elizaOS + Walrus Integration

## What it is

**elizaOS** is the leading open-source agentic operating system from ai16z / elizaOS Foundation. **`elizaOS/eliza`** has 300+ plugins via `elizaos-plugins` org. In 2025, elizaOS V2 made **Walrus the default memory layer** — the single most consequential precedent for OneMem because it validates Walrus as a viable agent-memory backend.

## What's stored where

Per the Walrus blog post on the integration:

- **On Walrus:** agent memory blobs, datasets, cross-agent workflow artifacts, large models, media.
- **On Sui:** **proof-of-availability certificates** for every Walrus upload — these are the verification anchor.
- **Encryption / access control:** **Seal** (already in the Sui ecosystem) for encrypted access control.
- **Confidential compute:** **Nautilus** for off-chain confidential computation.

> Walrus is now the default memory layer within elizaOS V2, giving developers seamless access to persistent, secure, and verifiable data management for AI agents. Every upload resolves to an on-chain proof-of-availability certificate on Sui.

## Architecture

- **elizaOS Memory abstraction.** elizaOS has a `MemoryAdapter` interface used by all plugins.
- **Walrus adapter.** A new memory adapter writes to Walrus instead of (or in addition to) local SQLite / PGLite / in-memory.
- **Default in V2.** New elizaOS deployments use Walrus out of the box; older deployments can migrate via the adapter.
- **Onboarding flow.** New users get time-limited Walrus credits, removing payment friction.

## Plugins involved

elizaOS has a multi-plugin posture around verifiability and storage:

- **Walrus memory adapter** — the integration described above.
- **`plugin-tee`** — secure key derivation and remote attestation in TEEs.
- **`plugin-tee-verifiable-log`** — verifiable logging inside TEEs for secure, auditable records.
- **`plugin-tee-log`** — TEE-anchored log generation/storage/verify.
- **`plugin-tee-marlin`** — TEE verification via Marlin Oyster.

Combined with **EigenCloud integration** (EigenAI verifies inference, EigenCompute runs in TEE) — elizaOS now has a *multi-vendor verifiable stack* covering execution, inference, logs, and memory.

## Why this matters for OneMem

elizaOS + Walrus is **the exact pattern OneMem generalizes**. The distinction:

| Property | elizaOS + Walrus (today) | OneMem |
|---|---|---|
| Memory schema | elizaOS-specific (private to the framework) | Standard, cross-runtime |
| Cross-tool portability | None — memory is locked to elizaOS | Yes — MCP server exposes the namespace to any agent runtime |
| Sui object model | Walrus upload → Sui certificate (single object per blob) | Rich `MemoryNamespace` Move object with structured children, types, scopes |
| Verifiability surface | Per-blob proof-of-availability | Per-blob + per-namespace + per-trace, with selective reveal via Seal |
| Trace anchoring | Optional (logs go to `plugin-tee-log`) | First-class — every agent run produces an anchored trace |
| Encryption | Seal optional | Seal + Nautilus first-class |

In short: elizaOS proved Walrus works as an agent-memory substrate **inside one framework**. OneMem turns that proof into a **cross-framework standard** built on the same substrate.

## Integration opportunity

The cleanest play: **build an `@elizaos/plugin-onemem` memory adapter** that uses OneMem's MemoryNamespace as the backing store. Result:

- elizaOS agents get richer memory typing + cross-tool portability.
- OneMem inherits elizaOS's 300+ plugin ecosystem and existing user base.
- Walrus + Seal usage actually goes *up* (more sophisticated writes per agent).
- A user can have one OneMem namespace shared across elizaOS, Claude Code, Cursor, Hermes, and Letta.

## Sources

- https://github.com/elizaOS/eliza
- https://github.com/elizaos-plugins
- https://blog.walrus.xyz/elizaos-walrus-agentic-ai-memory/
- https://www.walrus.xyz/blog/ai-agents-explained
- https://blog.eigencloud.xyz/how-elizaos-built-cryptographically-verifiable-agents/
- https://blockchain.news/news/elizaos-leverages-eigencloud-for-verifiable-ai-agents
- https://github.com/elizaos-plugins/plugin-tee
- https://github.com/elizaos-plugins/plugin-tee-verifiable-log
- https://github.com/elizaos-plugins/plugin-tee-log
- https://github.com/elizaos-plugins/plugin-tee-marlin
- https://docs.elizaos.ai/plugin-registry/overview
- https://www.walrus.xyz/blog/elizaos-walrus-agentic-ai-memory
