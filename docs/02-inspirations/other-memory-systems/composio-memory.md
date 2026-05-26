# Composio Memory

## What it is

Composio is **not itself a memory system** — it's the dominant agent tool-integration layer (~850+ pre-built tool integrations: GitHub, Notion, Slack, Salesforce, etc.). Memory enters Composio's surface area in two ways:

1. **Composio packages Mem0 as a first-class toolkit** — `composio.dev/toolkits/mem0`. Composio is the integration plane through which most agents reach Mem0's memory API.
2. **Composio MCP** — Composio exposes its 850+ tools (including Mem0) over the Model Context Protocol, so any MCP-capable agent (Claude, Cursor, ChatGPT, Windsurf) can use Mem0 for memory through Composio's gateway.

Composio is also the canonical example of the "N×M agent-tool problem" — without an integration layer, every agent needs custom code per tool. Without a memory layer, the rich tool access can't compound; the agent forgets which tools worked for which task.

## Storage model

- **Composio itself stores no memory.** It stores auth state, integration configs, and SOC-2-compliant encrypted credentials.
- **Mem0 is the memory backend** when an agent uses Composio's memory toolkit.

## API surface

- Composio SDK (Python, JS, TS, Go)
- Composio MCP server (`mcp.composio.dev/composio`)
- Dedicated Mem0 sub-toolkit: `composio.dev/toolkits/mem0` and `composio.dev/toolkits/mem0/framework/claude-agents-sdk`
- Direct tool actions: search, recall, remember, organize, etc. — all mapped onto Mem0 primitives.

## Integration model

- **MCP server in front of everything.** Composio's MCP gateway is the distribution mechanism.
- **Framework toolkits** for Claude Agent SDK, OpenAI Agents, LangChain, LlamaIndex, CrewAI, Autogen, etc.
- **Cloud-hosted** with SOC 2 Type 2 compliance — encrypted at rest and in transit.

## What we'd borrow for OneMem

- **Composio is a distribution channel, not a competitor.** The win is "Composio adds an `onemem` toolkit alongside `mem0`." This is a real conversation given Composio's track record of adding emerging tools quickly.
- **The N×M framing is reusable.** OneMem can pitch "verifiable memory N×M" — the same N agent frameworks × M chains × K storage backends problem. OneMem solves it via Sui + Walrus + MCP standardization.
- **MCP gateway pattern.** Composio shows that an MCP server can be the *only* surface a tool needs — agents don't need framework-specific SDKs. OneMem can ship an MCP server first and skip per-framework adapters until demand is proven.
- **SOC 2 / encryption posture.** Composio's enterprise pitch demands it. OneMem's Walrus + Seal gives it a stronger story by default — quote-worthy in any enterprise convo.

## Sources

- https://composio.dev/toolkits/mem0
- https://composio.dev/toolkits/mem0/framework/claude-agents-sdk
- https://mcp.composio.dev/mem0
- https://mcp.composio.dev/composio
- https://memu.pro/blog/composio-agent-tool-integration-memory
- https://www.mindstudio.ai/blog/agent-integration-layer-compose-io-enterprise-tools
