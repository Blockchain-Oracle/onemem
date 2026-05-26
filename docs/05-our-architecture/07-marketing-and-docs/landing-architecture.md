# `onemem.ai` Landing Page Architecture

The marketing surface. Visitors see this first; conversion target = `npm install @onemem/cli` (or equivalent).

Built with Next.js (or Framer if we want CMS-driven content). Same brand stack as the dashboard.

---

## Page structure (one long scroll, marketing-page convention)

```
┌────────────────────────────────────────────────────────────────────┐
│  Nav (sticky)                                                       │
│   OneMem logo  | Docs | Integrations | GitHub | Dashboard | Get Started │
│                                                                     │
│  ─── Hero ─────────────────────────────────────────────────────── │
│  Verifiable agent memory + trace,                                  │
│  for every runtime                                                  │
│                                                                     │
│  Every memory your AI agent writes is on Walrus.                   │
│  Every action your AI agent takes is on Sui.                       │
│  Cryptographically provable. Cross-runtime portable.               │
│  Built on MemWal.                                                   │
│                                                                     │
│   [Get started in 5 min →]   [Watch demo (5:00)]                   │
│                                                                     │
│  ─── Trust strip ────────────────────────────────────────────────── │
│  Built on: Sui · Walrus · Seal · MemWal · OpenZeppelin · OtterSec  │
│                                                                     │
│  ─── 1-minute pitch (video) ────────────────────────────────────── │
│  [embedded YouTube of 60-second product video]                     │
│                                                                     │
│  ─── The problem ──────────────────────────────────────────────── │
│  Your AI agents are powerful, but stateless and fragmented.        │
│  Memory is tied to a single app. You can't share it. You can't     │
│  prove what your agent did. You can't take it with you.            │
│                                                                     │
│  ─── The OneMem stack ───────────────────────────────────────────── │
│  [Diagram: agents (Claude Code, Hermes, Cursor, ...) → SDK → MemWal│
│   + Seal + Walrus + Sui]                                           │
│                                                                     │
│  ─── 3 pillars ────────────────────────────────────────────────── │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐         │
│  │ Memory layer   │ │ Action trace   │ │ Cross-runtime  │         │
│  │ Walrus-backed  │ │ Merkle-chained │ │ Same namespace │         │
│  │ encrypted      │ │ replayable     │ │ everywhere     │         │
│  └────────────────┘ └────────────────┘ └────────────────┘         │
│                                                                     │
│  ─── How it works (3-step) ─────────────────────────────────────── │
│  1. Install OneMem in your runtime (1 line)                        │
│  2. Use your agent normally — memories + traces auto-captured      │
│  3. Verify anything from the dashboard or CLI                      │
│                                                                     │
│  ─── Code samples (tabbed: TS / Python / CLI) ──────────────────── │
│  [Sample 1: withOneMem middleware]                                 │
│  [Sample 2: CrewAI provider config]                                │
│  [Sample 3: Hermes provider import]                                │
│  [Sample 4: Claude Code plugin install]                            │
│  [Sample 5: CLI verify]                                            │
│                                                                     │
│  ─── Comparison ────────────────────────────────────────────────── │
│  How OneMem complements Mem0 / claude-mem / Zep                    │
│  [Honest table: what each does well, where OneMem extends]         │
│                                                                     │
│  ─── Integrations (5 v0.1 + 7 MCP) ─────────────────────────────── │
│  [Grid of runtime logos + framework logos, each links to docs]     │
│                                                                     │
│  ─── Demo: "Verification turns the page green" ─────────────────── │
│  [Embedded animation / GIF of /trace/[id] Verify drawer]           │
│                                                                     │
│  ─── Vision (where this goes) ──────────────────────────────────── │
│  Today: Verifiable memory + trace + cross-runtime.                 │
│  Soon: Agent reputation graphs. Memory marketplaces.               │
│  ERC-8004 bridge. The full stack for accountable AI agents.        │
│                                                                     │
│  ─── Pricing ──────────────────────────────────────────────────── │
│  v0.1: Free. OSS. Self-host or use Mysten's MemWal relayer.        │
│  v0.2+: Pricing announced post-hackathon.                          │
│                                                                     │
│  ─── Open source ──────────────────────────────────────────────── │
│  All packages are Apache-2.0 on GitHub. Contributions welcome.     │
│  [GitHub link]                                                     │
│                                                                     │
│  ─── Footer ──────────────────────────────────────────────────── │
│  Quick links | Docs | GitHub | Twitter | Walrus Telegram | Contact │
│  Built for Sui Overflow 2026                                       │
└────────────────────────────────────────────────────────────────────┘
```

---

## Hero copy (the load-bearing words)

```
Verifiable agent memory + trace,
for every runtime

Every memory your AI agent writes is encrypted on Walrus.
Every action your AI agent takes is a Merkle-chained
attestation on Sui. Cross-runtime portable. Cryptographically
provable. Built on MemWal.

Stop trusting your AI agent. Verify it.

[Get started in 5 min →]    [Watch demo (5:00)]
```

Headline tries to win the 5-second scan. Subhead delivers the 3-pillar story in 4 short sentences.

---

## Trust strip (third-party signals)

Logos in muted greyscale:
- Sui (with the official Sui blue `#0090FF` only on the logo itself, per brand rule)
- Walrus (purple aligned)
- Seal
- MemWal
- OpenZeppelin (audit-ready)
- OtterSec (audit-ready)

Plus: "Built for Sui Overflow 2026" badge in chartreuse (the Verify accent — appropriate use).

---

## Code sample section

Tabbed component (shadcn Tabs):

Tab 1 — Vercel AI SDK
```ts
import { withOneMem } from "@onemem/vercel-ai-provider";
import { openai } from "@ai-sdk/openai";

const model = withOneMem(openai("gpt-4o"));
// Every call is now Walrus-backed + Sui-attested
```

Tab 2 — CrewAI
```python
from crewai import Crew

crew = Crew(
    agents=[...], tasks=[...],
    memory=True,
    memory_config={"provider": "onemem"},  # 1-line
)
```

Tab 3 — Claude Code
```bash
/plugin marketplace add onemem/claude-code-plugin
/plugin install onemem
/onemem login
```

Tab 4 — Hermes Agent
```bash
pip install hermes-onemem
hermes config set memory.provider onemem
```

Tab 5 — CLI verify
```bash
onemem verify 0xsession...
# ✓ All 47 calls verified
# Merkle chain integrity: ✓
# VERIFIED
```

Each tab has copy-to-clipboard button. Code blocks rendered with shiki (same as docs).

---

## Comparison section (honest, no FUD)

```
┌──────────────────┬─────────┬───────────┬─────────┬──────────┐
│ Feature          │ Mem0    │ claude-mem│ Zep     │ OneMem   │
├──────────────────┼─────────┼───────────┼─────────┼──────────┤
│ Memory layer     │ ✓       │ ✓ (CC only)│ ✓       │ ✓        │
│ Cross-runtime    │ ✓ (SaaS)│ ✓ (flag)  │ ✗       │ ✓        │
│ Encrypted at rest│ ✗       │ ✗         │ ✗       │ ✓ (Seal) │
│ Verifiable on    │ ✗       │ ✗         │ ✗       │ ✓ (Sui)  │
│   chain          │         │           │         │          │
│ Cross-runtime    │ ✗       │ ✗         │ ✗       │ ✓        │
│   trace tree     │         │           │         │          │
│ Replay from chain│ ✗       │ ✗         │ ✗       │ ✓        │
│ Sharing model    │ Team    │ ✗         │ Team    │ Sui cap  │
│                  │ accounts│           │ accounts│ transfer │
│ OSS              │ Partial │ ✓ Apache  │ Partial │ ✓ Apache │
│ Stack            │ SaaS    │ Local SQL │ SaaS    │ Walrus+Sui│
└──────────────────┴─────────┴───────────┴─────────┴──────────┘
```

Caption: "OneMem complements the existing memory layer products. Use OneMem when you need verifiability + cross-runtime + decentralization. Use the others when those don't matter."

---

## Integrations grid

5 v0.1 runtimes (full coverage badge):
- Claude Code, OpenClaw, Hermes Agent, plus voice (LiveKit, ElevenLabs)

7 MCP-served runtimes (partial coverage badge):
- Codex CLI, Cursor, Windsurf, OpenCode, Cline, VS Code Copilot, Antigravity

5 v0.1 framework providers:
- Vercel AI SDK, OpenAI Agents SDK, CrewAI, LiveKit, ElevenLabs

8 v0.2 framework providers (greyed out):
- LangChain, LangGraph, AutoGen, LlamaIndex, Google ADK, Pipecat, Mastra, Agno

Each clickable → docs.onemem.ai/integrations/<name>

---

## Vision section

```
What's next for OneMem

Today (v0.1):
  Verifiable memory + trace + cross-runtime + dashboard

Soon (v0.2):
  - Agent reputation graphs — agents accrue verifiable track records
  - Memory marketplaces — namespaces become tradeable on Sui
  - ERC-8004 bridge — interop with EVM agent identity registries
  - Nautilus TEE relayer — even the relayer can't tamper

The end state: a fully accountable, fully portable AI agent stack
where every action is provable and every memory is yours.
```

---

## SEO + meta

```html
<title>OneMem — Verifiable Agent Memory + Trace on Sui + Walrus</title>
<meta name="description" content="Every memory your AI agent writes is encrypted on Walrus. Every action is a Merkle-chained attestation on Sui. Cross-runtime portable. Built on MemWal.">
<meta property="og:title" content="OneMem — Verifiable Agent Memory + Trace">
<meta property="og:description" content="...">
<meta property="og:image" content="https://onemem.ai/og-image.png">  // hero with brand
<meta property="og:url" content="https://onemem.ai">
```

---

## Cross-references

- `README.md` (this folder)
- `docs-architecture.md`
- `../../02-inspirations/BRAND_AND_SURFACES.md` — brand application
- `../00-goal/GOAL.md` — the vision copy this leans on
- `../00-overview/PRODUCT_INVENTORY.md` — features mentioned
