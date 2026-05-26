# `docs.onemem.ai` Docs Site Architecture

Mintlify. Same stack as Mem0 + claude-mem (confirmed via shared Vercel project ID per `02-inspirations/mem0/MEM0_DOCS_DESIGN.md`). Cream surface (`#FAF8F5`) aligned with Walrus/Sui ecosystem vs Mem0's white surface.

---

## Tech stack pick: Mintlify

Why:
- Mem0 + claude-mem both use it (proven for memory-layer docs)
- Mintlify default chrome + brand color override = professional docs in days, not weeks
- Built-in search, dark mode, API reference renderer, code-tab persistence
- One `docs.json` controls everything

Alternative considered + rejected:
- Fumadocs / Nextra — more customizable but slower to ship; brand-customization isn't load-bearing for v0.1
- Custom Next.js — way too much work
- Docusaurus — feels "open source project" not "product"

---

## `docs.json` config (Mintlify)

```json
{
  "name": "OneMem",
  "logo": {
    "light": "/logo-light.svg",
    "dark": "/logo-dark.svg"
  },
  "favicon": "/favicon.ico",
  "colors": {
    "primary": "#B08FFF",
    "light": "#C9ADFF",
    "dark": "#9A75F0",
    "background": {
      "light": "#FAF8F5",
      "dark": "#1A1815"
    }
  },
  "topbarLinks": [
    { "name": "Dashboard", "url": "https://app.onemem.ai" },
    { "name": "GitHub", "url": "https://github.com/onemem" }
  ],
  "topbarCtaButton": {
    "name": "Get Started",
    "url": "/quickstart"
  },
  "navigation": [
    {
      "group": "Get Started",
      "pages": ["introduction", "quickstart", "concepts"]
    },
    {
      "group": "Memory",
      "pages": ["memory/overview", "memory/api", "memory/taxonomies"]
    },
    {
      "group": "Trace",
      "pages": ["trace/overview", "trace/verify-tutorial", "trace/replay"]
    },
    {
      "group": "Integrations",
      "pages": [
        "integrations/index",
        "integrations/claude-code",
        "integrations/openclaw",
        "integrations/hermes-agent",
        "integrations/codex-cli",
        "integrations/cursor",
        "integrations/windsurf",
        "integrations/antigravity",
        "integrations/vercel-ai-sdk",
        "integrations/openai-agents",
        "integrations/crewai",
        "integrations/livekit",
        "integrations/elevenlabs"
      ]
    },
    {
      "group": "SDK Reference",
      "pages": [
        "sdk/typescript",
        "sdk/python",
        "sdk/api-reference"
      ]
    },
    {
      "group": "CLI Reference",
      "pages": [
        "cli/overview",
        "cli/commands"
      ]
    },
    {
      "group": "Dashboard",
      "pages": [
        "dashboard/local",
        "dashboard/hosted",
        "dashboard/walrus-sites-mirror"
      ]
    },
    {
      "group": "Self-host",
      "pages": [
        "self-host/relayer",
        "self-host/contracts"
      ]
    },
    {
      "group": "Reference",
      "pages": [
        "reference/move-contract",
        "reference/events",
        "reference/architecture",
        "changelog"
      ]
    }
  ],
  "footer": {
    "socials": {
      "twitter": "https://twitter.com/onemem",
      "github": "https://github.com/onemem",
      "discord": "https://discord.com/invite/walrusprotocol"
    }
  },
  "search": {
    "prompt": "Search OneMem docs..."
  },
  "feedback": {
    "thumbsRating": true,
    "suggestEdit": true
  }
}
```

**Brand application:** primary `#B08FFF` (lavender — distinct from Mem0's `#8F74E0`, distinct from claude-mem's stock Tailwind blue). Background cream `#FAF8F5`. Lean into the Sui/Walrus visual family.

---

## v0.1 must-have pages (the 5 we MUST ship)

Per `PRODUCT_INVENTORY.md` Pillar 10:

### 1. `quickstart.mdx` — "Get Started in 5 min"

```mdx
---
title: "Quickstart"
description: "Install OneMem in your AI agent and verify your first trace in under 5 minutes."
---

## 1. Install

<CodeGroup>
```bash CLI
npm install -g @onemem/cli
```
```bash Python
pip install onemem-cli
```
</CodeGroup>

## 2. Login

```bash
onemem login
```

A browser opens. Sign in with Google (gasless via Enoki) or connect a Sui wallet. Done.

## 3. Install in your runtime

Pick one:

<CardGroup cols={3}>
  <Card title="Claude Code" href="/integrations/claude-code">npm + `/plugin install`</Card>
  <Card title="Hermes Agent" href="/integrations/hermes-agent">pip + 1-line config</Card>
  <Card title="Vercel AI SDK" href="/integrations/vercel-ai-sdk">npm + `withOneMem(...)`</Card>
</CardGroup>

## 4. Use your agent normally

OneMem captures every memory + every tool call in the background.

## 5. Verify

```bash
onemem trace list
onemem verify 0x<session-id>
```

You'll see:

```
✓ All 47 calls verified
Merkle chain integrity: ✓
VERIFIED
```

Open the dashboard:

```bash
onemem dashboard
```

That's it. You're done.

<Note>Next: read [Concepts](/concepts) to understand how OneMem works under the hood.</Note>
```

### 2. `concepts.mdx`

Explains: Memory + Trace + Namespace + Capability + Verifiability. ~400 words. Diagrams.

### 3. `trace/verify-tutorial.mdx` — "Verify a trace, end-to-end"

Step-by-step walkthrough of running a Hermes trace + verifying it. The Abu use case ("agent sends money") reframed as a tutorial. Includes screenshots of the dashboard's Verify drawer turning chartreuse.

### 4. `sdk/api-reference.mdx`

Full API reference for both TS + Python SDKs. Auto-generatable from JSDoc / docstrings + Mintlify's API renderer.

### 5. `integrations/index.mdx`

Grid of all integrations with install snippets per runtime + framework.

---

## v0.2+ docs to add (deferred)

- Cookbook (recipe per use case)
- Video tutorials
- Full Move contract reference
- Self-hosting guide (full relayer + contract deploy)
- Architecture deep-dives per pillar

---

## Search backend

Mintlify defaults to its built-in search; later swap to Algolia DocSearch + Kapa.ai for AI chat (Mem0 has both per `02-inspirations/mem0/MEM0_DOCS_DESIGN.md`). v0.1: built-in is fine.

---

## Code rendering

- Shiki themes: `github-light-default` + `dark-plus` (Mem0 uses Atom One; we pick stock GitHub for neutrality)
- Code block tabs: language-tabs persisted across pages (Mintlify default)
- Inline code: neutral gray text (NOT lavender — per `02-inspirations/mem0/MEM0_DOCS_DESIGN.md` recommendation; using accent in code creates noise)

---

## Layout decisions (lessons from Mem0 + claude-mem)

| Decision | Choice | Why |
|---|---|---|
| TOC visibility threshold | 1280px+ (Mem0 default) | claude-mem's 1600px is wrong — most laptops are 1280-1440 |
| Sidebar depth | 2 levels max | Don't over-nest; flat-ish like claude-mem (38 pages, flat) |
| Page count at v0.1 | ~30-40 | Mem0's 218 is overkill for v0.1; claude-mem's 38 is the realistic floor |
| Body font | Inter (Mintlify default) | Both Mem0 and claude-mem use Inter; no reason to differ |
| Headings | Same Inter (Mem0 has phantom TWK Lausanne — don't repeat that bug) | Avoid declared-but-unbundled fonts |
| Callouts | Use sparingly; chartreuse for "Verify" / "Tip", muted for "Note" | Per brand rule, chartreuse exclusively for verify affordances |

---

## Mintlify deployment

```bash
# Setup
npx mintlify init

# Develop locally
mintlify dev   # serves at localhost:3000

# Deploy: Mintlify's hosted deploy (free for OSS) or self-host
git push  # Mintlify watches the repo + auto-deploys
```

---

## Cross-references

- `README.md`
- `landing-architecture.md`
- `../../02-inspirations/mem0/MEM0_DOCS_DESIGN.md` — Mintlify config + IA template (the reference)
- `../../02-inspirations/claude-mem/CLAUDE_MEM_DOCS_DESIGN.md` — minimum-viable Mintlify baseline
- `../../02-inspirations/BRAND_AND_SURFACES.md` — brand colors
