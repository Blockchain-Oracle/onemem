# Mem0 Docs — Information Architecture

Captured 2026-05-23 from `https://docs.mem0.ai/sitemap.xml` (218 unique URLs), `https://docs.mem0.ai/llms.txt` (the AI-agent IA file, saved at `.playwright-mcp/mem0-llms.txt`), and live inspection of the top nav + sidebars on `screenshots/01-landing-introduction-light.png` and `screenshots/02-platform-overview-light.png`.

## Headline numbers

- **218 indexed pages** total
- **9 top-nav sections** (Welcome, Mem0 Platform, OpenClaw, Open Source, Cookbooks, Integrations, Agent Plugins, API Reference, Release Notes)
- **34 integrations** (frameworks + AI coding tools + voice + cloud + dev tools)
- **34 API reference endpoints** (across memory, organization, project, webhook, events, entities)
- **67 component pages** (vector stores, LLMs, embedders, rerankers) — the bulk of the long tail

## Top nav (horizontal pill bar under header)

| Label | URL | Purpose |
|---|---|---|
| Welcome | `/introduction` | Landing |
| Mem0 Platform | `/platform/overview` | Managed product hub |
| OpenClaw | `/integrations/openclaw` | Featured integration (top-level promotion of the OpenClaw integration page, not a separate section) |
| Open Source | `/open-source/overview` | Self-hosted product hub |
| Cookbooks | `/cookbooks/overview` | Tutorials |
| Integrations | `/integrations` | Integration index |
| Agent Plugins | `/integrations/claude-code` | Shortcut to the AI-coding-tool integrations cluster, defaulting to Claude Code |
| API Reference | `/api-reference` | REST endpoint docs |
| Release Notes | `/changelog/highlights` | Changelog |

Two of these (OpenClaw + Agent Plugins) are deep-linked promotions, not sections — they jump straight into the most-trafficked integration pages. That's a deliberate Mintlify pattern: use the top nav to signal what matters this quarter, not to mirror the sidebar.

Notable absences from the top nav: Core Concepts (lives only in the sidebar), Components (long tail, sidebar only), Migration (sidebar + footer link only).

## Sidebar IA (per top-nav section)

The left sidebar context-switches based on top-nav selection. Below is the full tree for each context, derived from `llms.txt` (which is itself the AI-agent-targeted IA file the team maintains, so it's a faithful reflection of the human sidebar).

### Welcome / Getting Started

```
Getting Started
├── Introduction                          /introduction
├── Vibe Code with Mem0                   /vibecoding
├── Platform Overview                     /platform/overview
├── Sign up as an agent                   /platform/agent-signup
├── Platform vs Open Source               /platform/platform-vs-oss
├── Platform Quickstart                   /platform/quickstart
├── Platform CLI                          /platform/cli
├── Mem0 MCP Server                       /platform/mem0-mcp
├── Open Source Overview                  /open-source/overview
├── Open Source Configuration             /open-source/configuration
├── Open Source Python Quickstart         /open-source/python-quickstart
├── Open Source Node.js Quickstart        /open-source/node-quickstart
└── Self-Hosted Setup                     /open-source/setup
```

### Core Concepts

```
Core Concepts
├── Memory Types                          /core-concepts/memory-types
└── Memory Operations
    ├── Add                               /core-concepts/memory-operations/add
    ├── Search                            /core-concepts/memory-operations/search
    ├── Update                            /core-concepts/memory-operations/update
    └── Delete                            /core-concepts/memory-operations/delete
Memory Evaluation                         /core-concepts/memory-evaluation
```

### Mem0 Platform (28 pages)

```
Platform
├── Overview                              /platform/overview
├── Agent signup                          /platform/agent-signup
├── Quickstart                            /platform/quickstart
├── CLI                                   /platform/cli
├── Mem0 MCP                              /platform/mem0-mcp
├── Platform vs OSS                       /platform/platform-vs-oss
├── Advanced memory operations            /platform/advanced-memory-operations
├── FAQs                                  /platform/faqs
├── Contribute                            /platform/contribute
└── Features/
    ├── Essential
    │   ├── Platform Features Overview    /platform/features/platform-overview
    │   ├── V2 Memory Filters             /platform/features/v2-memory-filters
    │   ├── Entity-Scoped Memory          /platform/features/entity-scoped-memory
    │   ├── Async Client                  /platform/features/async-client
    │   ├── Multimodal Support            /platform/features/multimodal-support
    │   └── Custom Categories             /platform/features/custom-categories
    ├── Advanced Retrieval
    │   ├── Advanced Retrieval            /platform/features/advanced-retrieval
    │   ├── Criteria-Based Retrieval      /platform/features/criteria-retrieval
    │   ├── Temporal Reasoning            /platform/features/temporal-reasoning
    │   ├── Contextual Add                /platform/features/contextual-add
    │   ├── Custom Instructions           /platform/features/custom-instructions
    │   └── Memory Decay                  /platform/features/memory-decay
    ├── Data Management
    │   ├── Direct Import                 /platform/features/direct-import
    │   ├── Memory Export                 /platform/features/memory-export
    │   └── Timestamp Support             /platform/features/timestamp
    └── Integration & Ops
        ├── Webhooks                      /platform/features/webhooks
        ├── Feedback Mechanism            /platform/features/feedback-mechanism
        ├── Group Chat Support            /platform/features/group-chat
        └── MCP Integration               /platform/features/mcp-integration
```

Nesting depth = 4 here (Platform → Features → Subgroup → Page). The subgroup labels (Essential / Advanced Retrieval / Data Management / Integration & Ops) are pure organizational headers, not pages.

### Open Source (13 pages)

```
Open Source
├── Overview                              /open-source/overview
├── Configuration                         /open-source/configuration
├── Python Quickstart                     /open-source/python-quickstart
├── Node.js Quickstart                    /open-source/node-quickstart
├── Self-Hosted Setup                     /open-source/setup
└── Features/
    ├── Overview                          /open-source/features/overview
    ├── Async Memory                      /open-source/features/async-memory
    ├── Custom Instructions               /open-source/features/custom-instructions
    ├── Metadata Filtering                /open-source/features/metadata-filtering
    ├── Multimodal Support                /open-source/features/multimodal-support
    ├── OpenAI Compatibility              /open-source/features/openai_compatibility
    ├── Reranker Search                   /open-source/features/reranker-search
    └── REST API Server                   /open-source/features/rest-api
```

Both Platform and Open Source have an "Overview" + "Quickstart" + "Features" pattern. The shape is mirror-symmetric so users can swap between paths without re-learning the IA.

### Components (67 pages — the long tail)

```
Components/
├── Vector DBs  (27 pages, e.g. /components/vectordbs/dbs/qdrant)
├── LLMs        (19 pages, e.g. /components/llms/models/anthropic)
├── Embedders   (12 pages, e.g. /components/embedders/models/openai)
└── Rerankers   (9 pages, e.g. /components/rerankers/cohere)
```

Each subsection has an `/overview`, a `/config`, and then one page per provider. Provider pages are highly templated (per-provider config table + code snippet). This is the part of the IA that scales with ecosystem growth — every new vector DB or LLM adds one MDX file.

### Integrations (34 pages)

```
Integrations
├── Overview                              /integrations
├── Agent Frameworks (15)
│   LangChain, LangGraph, LangChain Tools, LlamaIndex, CrewAI,
│   AutoGen, Agno, Camel AI, ChatDev, Hermes, OpenAI Agents SDK,
│   Google AI ADK, Mastra, OpenClaw, Vercel AI SDK
├── AI Coding Tools (3)
│   Claude Code, Cursor, Codex
├── Voice & Real-time (3)
│   LiveKit, Pipecat, ElevenLabs
├── Cloud & Infrastructure (1)
│   AWS Bedrock
└── Developer Tools (5)
    Dify, Flowise, AgentOps, Keywords AI, Raycast
```

Subgroup labels exist as section headers in the sidebar. They are also reflected in `llms.txt` as `### Agent Frameworks`, `### AI Coding Tools`, etc.

### Cookbooks (29 pages)

```
Cookbooks
├── Overview                              /cookbooks/overview
├── Essentials (5)
│   Building an AI Companion, Partition Memories by Entity,
│   Controlling Memory Ingestion, Tagging and Organizing Memories,
│   Exporting Memories
├── AI Companions (7)
│   Quickstart Demo, Node.js Companion, ...
├── Integrations (6)
├── Operations (5)
└── Frameworks (5)
```

Cookbook pages are recipe-style. Each is a long-form tutorial with prerequisites + step-by-step build + complete code + production gotchas + cross-links.

### API Reference (35 pages)

```
API Reference
├── Overview                              /api-reference
├── Organizations & Projects (intro)      /api-reference/organizations-projects
├── Memory APIs (13)
│   POST   Add Memories                   /api-reference/memory/add-memories
│   POST   Get Memories                   /api-reference/memory/get-memories
│   POST   Search Memories                /api-reference/memory/search-memories
│   GET    Get Memory                     /api-reference/memory/get-memory
│   PUT    Update Memory                  /api-reference/memory/update-memory
│   DEL    Delete Memory                  /api-reference/memory/delete-memory
│   DEL    Delete Memories                /api-reference/memory/delete-memories
│   GET    Memory History                 /api-reference/memory/history-memory
│   POST   Create Memory Export           /api-reference/memory/create-memory-export
│   GET    Get Memory Export              /api-reference/memory/get-memory-export
│   POST   Feedback                       /api-reference/memory/feedback
│   POST   Batch Update                   /api-reference/memory/batch-update
│   POST   Batch Delete                   /api-reference/memory/batch-delete
├── Entity APIs (2)
│   GET    Get Users                      /api-reference/entities/get-users
│   DEL    Delete User                    /api-reference/entities/delete-user
├── Event APIs (2)
│   GET    Get Events                     /api-reference/events/get-events
│   GET    Get Event                      /api-reference/events/get-event
├── Webhook APIs (4)
│   POST/GET/PUT/DELETE  Webhook CRUD     /api-reference/webhook/*
├── Organization APIs (6)
│   create-org, get-orgs, get-org, delete-org, add-org-member, get-org-members
└── Project APIs (6)
    create-project, get-projects, get-project, delete-project, add-project-member, get-project-members
```

Sidebar labels for API endpoints prefix the method as an inline pill: `POSTAdd Memories`, `PUTUpdate Memory`, `DELDelete Memory`. Color-coded (POST blue, GET green, PUT yellow, DELETE red). The pill is part of the link text in the DOM, not a separate badge — see `screenshots/15-api-add-memories-light.png` left sidebar.

### Migration (4 pages)

```
Migration
├── OSS to Platform                       /migration/oss-to-platform
├── OSS v2 to v3                          /migration/oss-v2-to-v3
├── Platform v2 to v3                     /migration/platform-v2-to-v3
└── API Changes                           /migration/api-changes
```

### Changelog (4 pages)

```
Changelog
├── Highlights                            /changelog/highlights
├── Product                               /changelog/product
├── Open Source                           /changelog/open-source
└── SDK                                   /changelog/sdk
```

Four parallel changelogs — they don't merge into one stream. Each audience (product user, OSS user, SDK consumer) gets their own.

### Contributing (2 pages)

```
Contributing
├── Code                                  /contributing/contribute-to-code
└── Documentation                         /contributing/contribute-to-docs
```

## Cross-linking patterns

### Top of page — "Documentation Index" blockquote on the landing

The landing (`/introduction`) opens with a blockquote callout titled "Documentation Index" that says "Fetch the complete documentation index at: https://docs.mem0.ai/llms.txt — Use this file to discover all available pages before exploring further." This is targeted at AI agents reading the docs. See `screenshots/01-landing-introduction-light.png` lines 71–76 of `.playwright-mcp/mem0-snapshot-landing.md`.

### Inline cross-links inside concept pages

Concept pages use a "Want the long-form tutorial?" sentence pattern that links to the matching cookbook. Example from `/platform/features/entity-scoped-memory` (caught via search snapshot):

> "Want the long-form tutorial? The Partition Memories by Entity cookbook walks through multi-agent storage, debugging, and cleanup step by step."

Pattern: short concept page → links out to long-form cookbook for the same topic.

### "What's Next?" 3-card grid at the bottom of each tutorial

From `/platform/quickstart` (`screenshots/03-platform-quickstart-light.png`):

```
What's Next?
[Memory Operations]  [Platform Features]  [API Reference]
```

Each card: icon + title + 2-line description, links to the next obvious step. Drives the user from "I have a working snippet" → "what feature can I layer on next?".

### "Additional Resources" bullet list

After the "What's Next?" grid:

```
Additional Resources
• Platform vs OSS — Understand the differences between Platform and Open Source
• Troubleshooting — Common issues and solutions
• Integration Examples — See Mem0 in action
```

Up to ~3 supplementary cross-links per page.

### Prev/Next page navigation at bottom of every doc

Two horizontally split cards at the bottom (see screenshots 03, 11, 15, etc.):

```
[< Previous: Platform vs Open Source]    [Next: Memory Types >]
```

The link text is the title of the previous/next page in the sidebar order. Mintlify auto-generates these from the `docs.json` nav config.

### "Was this page helpful?" feedback bar

Every doc page bottom (verified on `/api-reference/memory/add-memories`):

```
Was this page helpful?  [Yes] [No]    [Suggest edits] [Raise issue]
```

- Yes/No → POSTs feedback to Mintlify (analytics)
- "Suggest edits" → links to `https://github.com/mem0ai/mem0/edit/main/docs/<slug>.mdx` — opens the GitHub web editor on the source MDX
- "Raise issue" → opens a new GitHub issue prefilled with the page slug

### Footer (bottom of every page)

Social icons rendered as SVG `-webkit-mask-image` swatches (no `<img>`): Discord (`https://mem0.dev/DiD`), X (`https://x.com/mem0ai`), GitHub. Right side: "Powered by Mintlify" badge with `utm_campaign=poweredBy&utm_medium=referral&utm_source=mem0`.

### Search behaviour

- Triggered by `Cmd+K` or clicking the search pill in the header
- Modal: 640px max-width, centered, backdrop blur
- Results: instant (no debounce visible — types one char, results update), grouped only by URL path breadcrumb (no explicit "Section: Platform" grouping headers)
- Each result row: breadcrumb chain (Mem0 Platform › Platform Features › Essential Features › Memory Filters) + bold page title + content excerpt with `<mark>` highlighting on matched terms
- API endpoint results carry an inline `POST`/`GET`/`PUT`/`DELETE` color-coded pill
- Below results: "Ask AI assistant" CTA + 3 prefilled suggestions
- ESC dismisses

See `screenshots/24-search-modal-empty.png` (empty state) and `screenshots/25-search-modal-query-memory.png` (results state).

### Ask AI behaviour

- Triggered by clicking "Ask AI" button in the header
- Opens a 368px right-side sheet (`data-assistant-state="open"`, `--assistant-sheet-width: 368px`) — page content shifts left
- Header: "Assistant" + close + new-chat buttons
- Disclaimer line: "Responses are generated using AI and may contain mistakes."
- Suggestions section with 3 prefilled prompts
- Input textbox: "Ask a question..."
- Footer: "Contact support" → `mailto:support@mem0.ai`

See `screenshots/26-ask-ai-assistant-panel.png`.

## Mobile IA (375px viewport)

See `screenshots/21-platform-overview-mobile-375.png`. At mobile:

- Header collapses: hamburger menu on left, logo center, search icon + theme toggle on right
- Top nav pills disappear into the hamburger
- Left sidebar gone — full-width content
- Right TOC gone
- "On this page" appears as a collapsible above content (typical Mintlify)

Breakpoints (tested at 375 / 768 / 1280 / 1440):
- < 768: mobile (single column, hamburger)
- 768–1023: tablet (still hamburger, no sidebar)
- 1024+: desktop (sidebar appears)
- 1280+: TOC appears on the right

## What I'd port to `docs.onemem.ai`

1. **Mirror the Platform/OSS twin-IA pattern.** OneMem has both a hosted indexer (OneMem Cloud) and a self-host shape (raw Move calls + tracelog daemon). Give each its own `/cloud/*` and `/self-host/*` section, both with Overview + Quickstart + Features so users can swap paths.
2. **Top-nav promotion slots.** Use the top nav to deep-link into the integration of the moment (for us: Mintlify's `OpenClaw` slot = our `Claude Code` integration; our `Agent Plugins` slot = the `Sui MCP server` page).
3. **Always-on `llms.txt` + `llms-full.txt`.** Mintlify auto-generates these. If we go non-Mintlify, write the script ourselves and ship them — every coding agent (Cursor, Claude Code, Codex) reads them.
4. **API ref with inline method badges in the sidebar** — `POSTverify-trace` / `GETtrace/{id}` etc., color-coded.
5. **"Suggest edits → GitHub web editor" link on every page.** Trivial, removes friction for contributors.
6. **Concept page → cookbook cross-link sentence** ("Want the long-form tutorial? See …") so short concept pages don't have to over-explain.
7. **"What's Next?" 3-card grid + "Additional Resources" bullets** at the bottom of every doc — drives onward navigation without forcing the user back to the sidebar.
