# Pieces

## What it is

Pieces (pieces.app) is a **developer-focused, OS-level long-term memory** product. The flagship is the **LTM-2 (Long-Term Memory) agent**, which captures every application and website a developer interacts with, processes it locally, and exposes a queryable 9-month rolling window. Pieces positions LTM-2 as the beginning of a new category: "OS-Level Artificial Memory for developers."

Unlike repo-level coding-agent memory (Cline, ByteRover), Pieces captures the **wider trail** — IDE, browser, terminal, design tools, docs — not just the codebase.

## Storage model

- **Local-first by default.** All capture and processing happens on-device.
- **9-month rolling retention** by default.
- **Application-scoped capture.** You configure capture on/off per app — turn off for password managers, turn on for browser, IDE, Slack, etc.
- **PII filtering** built in — strips API keys and personal info before storage.
- **Time-indexed.** Memory is queryable by natural-language time ranges ("What conclusions were in the doc I was reading three months ago?").

## API surface

- Desktop app + browser extension + IDE plugins (VS Code, JetBrains, Sublime, Obsidian, etc.)
- **MCP server** — Pieces ships a first-class MCP integration that any MCP-capable agent (Claude Code, Cursor, Windsurf) can attach to for cross-app context.
- **GitHub integration** — surface long-term memory directly in PR/issue context.
- Native chat UI for time-based queries.

## Integration model

- **OS-level capture daemon** runs locally.
- **MCP for agent integration** — major differentiator. An agent in Claude Code can query "what was I doing in Figma last Tuesday?" through Pieces's MCP.
- **No cloud sync of capture by default** (privacy posture). Cloud collaboration is opt-in and limited.

## What we'd borrow for OneMem

- **Time-indexed query as a first-class primitive.** OneMem should support natural-language time queries over its anchored sessions — "show me what the agent saw on Tuesday." Walrus blobs + Sui anchor timestamps make this trivially queryable on-chain.
- **The MCP-as-distribution play.** Pieces shows that an OS-level memory product can ride MCP into every editor instantly. OneMem's MCP server should expose time-indexed and namespace-scoped queries the same way.
- **PII filtering at write-time** is non-negotiable. OneMem must scrub before anchoring — once a blob is on Walrus, you don't un-publish it. Pieces's filter heuristics are a reference.
- **Cross-app capture vs. coding-only.** Pieces validates the broader scope. OneMem's MemoryNamespace doesn't need to be code-only — it can carry browser history, design notes, anything an agent might want to recall.
- **Negative diff.** Pieces is Web2, closed, 100% local, no portability between machines or users. OneMem adds the verifiable + portable layer Pieces deliberately doesn't have. A user who wants their LTM portable across machines or shareable with their agent fleet has a real reason to choose OneMem.

## Sources

- https://pieces.app/features/long-term-memory
- https://pieces.app/blog/what-is-new-ltm-2
- https://pieces.app/blog/best-ai-memory-systems
- https://pieces.app/features/long-term-memory/capture-memory-ai
- https://pieces.app/ai-memory/github
- https://pieces.app/blog/mcp-memory
- https://pieces.app/blog/long-term-memory
