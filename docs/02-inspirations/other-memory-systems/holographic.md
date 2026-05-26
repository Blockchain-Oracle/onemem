# Holographic (HRR fact store)

## What it is

The "Holographic" memory provider in Hermes Agent is a local-only SQLite fact store that uses **Holographic Reduced Representations (HRR)** for compositional algebraic queries. There is no separate upstream product page — the implementation lives inside `NousResearch/hermes-agent` at `plugins/memory/holographic/`. A closely-related research project is `NeoVertex1/nuggets`, which uses the same HRR substrate for a chat agent.

HRR is a vector-symbolic-architecture (VSA) technique from Tony Plate's 1991 IJCAI paper. Each fact (e.g., "Alice prefers Python") is encoded as a superposition of complex-valued vectors bound via circular convolution; later you can *unbind* (algebraically subtract a query vector) to retrieve a fuzzy match — recall is mathematical, not similarity-search.

## Storage model

- **Local SQLite + FTS5.** Single file, lives in the Hermes home directory. Zero external dependencies, zero API keys, no network calls.
- **HRR layer.** NumPy-backed (optional) high-dimensional vector binding/unbinding for compositional queries — supports queries like "what does Alice prefer?" via algebraic decomposition of the bound vector.
- **Trust scoring.** Each fact carries a trust value (configurable default), updated via the `fact_feedback` tool.
- **Auto-extraction** (configurable) to pull facts from raw conversation turns.

## API surface

Hermes tools:

- `fact_store` (single tool exposing 9 sub-actions: add, query, list, delete, update, link, unbind, dump, restore)
- `fact_feedback` — adjust trust scores

Config keys: `db_path`, `auto_extract`, `default_trust`.

## Integration model

- **Bundled in Hermes Agent** — no external service, no install beyond `hermes config set memory.provider holographic`.
- **No public standalone repo** — referenced only inside the Hermes plugin tree and a fork at `dmore/hermes-agent-ai-self-learning/plugins/memory/holographic`.
- **Algebraic API rather than RPC** — different from every other entry in the Hermes provider set.

## Known issues

The Hermes issue tracker shows live problems with this provider:

- `#4781` — Holographic memory plugin registers but tools not injected into agent loop.
- `#20552` — `get_relevant_memories()` fails to retrieve entity-bound facts on queries with common terms.
- `#22907` — `auto_extract` saves raw user messages verbatim instead of extracting preferences.

This is useful intel — it tells us HRR is brittle in production when the embedding/extraction layer above it isn't tight.

## What we'd borrow for OneMem

- **The "no network, no API keys" posture** is a strong default for OneMem's local-cache layer — Walrus reads/writes can be async batched, while the hot path stays local.
- **HRR as a compression trick.** For OneMem's Walrus blobs, storing a *bound HRR vector* of the conversation alongside the raw JSON gives a lightweight on-device recall path that doesn't need a vector DB round-trip. Useful when the agent is offline or rate-limited.
- **Trust scoring as on-chain reputation primitive.** A fact's trust score is exactly the kind of mutable state that benefits from being a Sui object — agents can vote on facts, slashed for bad ones.
- **Negative example.** The bugs filed against Holographic are a warning: HRR alone isn't a memory system; it needs a solid extraction + indexing layer above it. OneMem should not assume the substrate solves recall quality.

## Sources

- https://github.com/NousResearch/hermes-agent (plugin tree: `plugins/memory/holographic/`)
- https://github.com/NeoVertex1/nuggets (sibling HRR project)
- https://github.com/dmore/hermes-agent-ai-self-learning/tree/main/plugins/memory/holographic
- https://redwood.berkeley.edu/wp-content/uploads/2020/08/Plate-HRR-IEEE-TransNN.pdf (Plate's HRR paper)
- https://www.ijcai.org/Proceedings/91-1/Papers/006.pdf (Plate 1991)
- https://hermes-agent.nousresearch.com/docs/user-guide/features/memory-providers
