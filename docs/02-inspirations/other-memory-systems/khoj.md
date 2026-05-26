# Khoj

## What it is

Khoj (khoj.dev, `khoj-ai/khoj`) is an open-source, self-hostable **"AI second brain"** — a personal RAG system that indexes your documents (PDFs, Markdown, Notion, Word, org-mode, etc.) and lets you chat with them via any local or online LLM. It also handles web search, custom agents, scheduled automations, and deep research.

It's notably popular in the Obsidian / Emacs / Notion power-user crowd, and has both a self-hosted OSS version and a managed cloud tier.

## Storage model

- **Indexed local content store.** Documents are chunked, embedded, and indexed locally.
- **RAG retrieval pipeline** as the core memory loop — every chat call retrieves from the indexed corpus.
- **Model-agnostic.** Works with OpenAI, Anthropic, Google, local models via Ollama (Llama 3, Mistral, Gemma, Qwen).
- **Persistent agent definitions.** Custom agents have their own persona, knowledge base, chat model, and tool set.
- **Schedule + automation.** Agents can run on cron and emit results to chat / email / WhatsApp.

## API surface

- Web UI (Browser, Desktop, Phone, WhatsApp)
- **Obsidian plugin**, **Emacs package**
- REST API for programmatic access
- Self-hostable Docker

## Integration model

- **Self-host or cloud.**
- **Personal AI angle, not agent-infra angle** — Khoj is primarily user-facing.
- Backed by `khoj-ai` org with active community development.

## What we'd borrow for OneMem

- **The "second brain" frame** is one of the most legible mental models in the consumer AI space. If OneMem has any consumer surface (likely yes — verifiable memory matters most when *you* own it), this language is reusable.
- **Multi-surface distribution** (Obsidian, Emacs, WhatsApp, mobile, desktop) is a model for how a memory product reaches users. OneMem's MCP surface gets coding agents; an Obsidian-equivalent plugin gets the second-brain crowd.
- **Scheduled automation as a memory event source.** Khoj agents run on cron and store their outputs back into the brain. OneMem should support cron-triggered anchoring — daily summary of agent work, weekly reflection, etc., all anchored.
- **Local + model-agnostic.** Khoj's defaults are local-first with Ollama support. OneMem's local cache layer should follow the same pattern — never lock the user into a cloud LLM to read their own memory.
- **Limited overlap.** Khoj is not in the agent-runtime memory game; it's the personal-knowledge-graph game. The overlap is the *user* who wants both their personal docs (Khoj) and their agent runs (OneMem) to live in the same verifiable substrate. That's a future integration story, not a competitive threat.

## Sources

- https://github.com/khoj-ai/khoj
- https://khoj.dev/
- https://github.com/khoj-ai
- https://www.i-scoop.eu/khoj/
