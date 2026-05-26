# ByteRover (formerly Cipher)

## What it is

ByteRover is a portable memory layer for autonomous coding agents, marketed as an "Agentic Memory Management Platform." Originally launched as Cipher by the campfirein team and rebranded ByteRover 1.0, it ships as a CLI (`brv`) plus an optional cloud sync product. It is one of the eight bundled external memory providers in Nous Research's Hermes Agent.

## Storage model

- **Local-first.** Default deployment is on-device — a hierarchical knowledge tree per project, persisted to disk, no network calls required.
- **Multiple Memory Architecture.** Splits storage into System 1 (programming concepts, business logic, past interactions), System 2 (reasoning steps), and Workspace Memory (team-shared context).
- **Tiered file-search pipeline** instead of pure vector embeddings. ByteRover explicitly claims this approach achieved 92.2% on the LoCoMo benchmark.
- **Optional ByteRover Cloud** for team sync and cross-machine portability — paid tier.

## API surface

CLI is the primary surface. In Hermes Agent's provider registry the bound tools are:

- `brv_query` — semantic / hierarchical search over the project context tree
- `brv_curate` — write / restructure entries
- `brv_status` — inspect current memory state

Install via `curl -fsSL https://byterover.dev/install.sh | sh` or `npm install -g byterover-cli`. Runs an interactive REPL with file-read/write and code execution tools alongside memory.

## Integration model

- **MCP server** — connects to Cursor, Windsurf, Cline, Claude Code, and any MCP-capable client.
- **Hermes Agent provider plugin** — bound via Hermes's pluggable memory provider interface; users select with `hermes config set memory.provider byterover`.
- **LLM-agnostic** — supports any LLM provider.

## What we'd borrow for OneMem

- **The dual-tier mental model** (System 1 fast-pattern / System 2 reasoning) is a clean schema for organizing the trace events OneMem writes to Walrus — separate "what the agent recalled" from "how the agent reasoned."
- **The agentic-map concept** (the agent maintains its own structured map of the codebase) maps cleanly to a Sui `MemoryNamespace` object that an OneMem-aware agent updates as it works.
- **The MCP-first distribution** validates OneMem's plan to ship a single MCP server that any IDE/CLI can attach to.
- **The benchmark posture** (publish LoCoMo / LongMemEval numbers) is table stakes for adoption — OneMem needs a comparable retrieval-quality eval.

## Sources

- https://www.byterover.dev/
- https://docs.byterover.dev/cipher/overview
- https://github.com/campfirein/cipher (now `campfirein/byterover-cli`)
- https://hermes-agent.nousresearch.com/docs/user-guide/features/memory-providers
- https://cursor.directory/mcp/byterover-2
