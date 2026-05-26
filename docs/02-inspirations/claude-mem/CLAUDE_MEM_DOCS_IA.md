# Claude-Mem Docs — Information Architecture

Captured 2026-05-26 from `https://docs.claude-mem.ai/sitemap.xml` (38 unique URLs), `https://docs.claude-mem.ai/llms.txt` (48 lines, the AI-agent IA file), and live inspection of the sidebar via `nav[aria-label="Pages"]` walk on `screenshots/03-introduction-light.png` and `screenshots/41-introduction-wide-1600-light.png`.

## Headline numbers

- **38 indexed pages** total (vs Mem0's 218) — claude-mem is ~5.7x smaller
- **0 top-nav pills** (vs Mem0's 9) — no horizontal nav row at all
- **1 sidebar group** ("Get Started") containing all 38 pages flat (vs Mem0's 5 nested groups across 9 section contexts)
- **0 API reference pages rendered in sidebar** — `openapi.json` exists at `/api-reference/openapi.json` and is advertised in `llms.txt` under `## OpenAPI Specs`, but the team does not surface it as a UI section. So no `GET`/`POST`/`PUT`/`DEL` method pills anywhere.
- **0 changelog pages** — no release notes / version history surface at all
- **0 cookbooks / tutorials section** — content is reference-style only

## Top nav

claude-mem does **not** ship a horizontal pill nav under the header. The header is minimal:

| Element | Position | Notes |
|---|---|---|
| Logo (claude-mem mark) | Left | Links to `https://github.com/thedotmack/claude-mem` (the GitHub repo, NOT a marketing landing — there is no separate marketing site) |
| Search pill (`Search... ⌘K`) | Left-center, ~340px wide | Mintlify-default chrome |
| GitHub icon link | Right | → `https://github.com/thedotmack/claude-mem` |
| "Install" icon-link | Right | → `https://github.com/thedotmack/claude-mem#quick-start` (deep-links into README) |
| Theme toggle | Right | Binary sun/moon — but the FOOTER has the full 3-option toggle (system / light / dark) |

Total header height = 64px (vs Mem0's 64px + 48px secondary tab row = 112px). The single-row header gives claude-mem 48px more vertical content space at every viewport.

## Sidebar IA

The left sidebar context-switches based on which page is open. Below is the full tree, derived from `llms.txt` + the `nav[aria-label="Pages"]` walk. **There is no nesting** — 38 pages live as a flat list under "Get Started" at the DOM level, but the `llms.txt` groups them into 6 logical sections visible via headings rendered IN the sidebar:

### Sidebar structure (the 6 visible group headings)

The accessibility snapshot at depth=8 shows the sidebar nav has 6 `<h3>` group labels with item lists under each. The DOM walk via `nav.querySelectorAll(':scope > div > div')` flattens them (counts as one group of 38), but the visual treatment is 6 grouped sections:

```
Get Started
├── Introduction                                    /introduction
├── Installation                                    /installation
├── Getting Started                                 /usage/getting-started
├── OpenRouter Provider                             /usage/openrouter-provider
├── Gemini Provider                                 /usage/gemini-provider
├── Memory Search                                   /usage/search-tools
├── Knowledge Agents                                /usage/knowledge-agents
├── Claude Desktop MCP                              /usage/claude-desktop
├── Private Tags                                    /usage/private-tags
├── Memory Export/Import                            /usage/export-import
├── Manual Recovery                                 /usage/manual-recovery
├── Folder Context Files                            /usage/folder-context
├── Beta Features                                   /beta-features
└── Endless Mode (Beta)                             /endless-mode

Cursor Integration
├── Cursor Integration                              /cursor
├── Cursor + Gemini Setup                           /cursor/gemini-setup
└── Cursor + OpenRouter Setup                       /cursor/openrouter-setup

Gemini CLI Integration
└── Gemini CLI Setup                                /gemini-cli/setup

Best Practices
├── Context Engineering                             /context-engineering
├── Progressive disclosure                          /progressive-disclosure
├── File Read Gate                                  /file-read-gate
└── Smart Explore Benchmark                         /smart-explore-benchmark

Configuration & Development
├── Configuration                                   /configuration
├── LiteLLM Gateway                                 /configuration/litellm-gateway
├── Custom Anthropic-Compatible Backends            /configuration/custom-anthropic-backends
├── Modes & Languages                               /modes
├── Development                                     /development
├── Troubleshooting                                 /troubleshooting
├── Platform Integration Guide                      /platform-integration
└── OpenClaw Integration                            /openclaw-integration

Architecture
├── Architecture Overview                           /architecture/overview
├── Architecture Evolution                          /architecture-evolution
├── Hooks architecture                              /hooks-architecture
├── Hook Lifecycle                                  /architecture/hooks
├── Worker Service                                  /architecture/worker-service
├── Database Architecture                           /architecture/database
├── Search Architecture                             /architecture/search-architecture
└── PM2 to Bun Migration                            /architecture/pm2-to-bun-migration
```

### Section count breakdown

| Section | Pages | % of total |
|---|---|---|
| Get Started | 14 | 37% |
| Cursor Integration | 3 | 8% |
| Gemini CLI Integration | 1 | 3% |
| Best Practices | 4 | 11% |
| Configuration & Development | 8 | 21% |
| Architecture | 8 | 21% |

37% of the docs sit under "Get Started" — heavy front-load. The Architecture section (8 pages, 21%) is unusually thick for a docs site this small, which signals the project's positioning: claude-mem treats itself as an architecture reference + a Claude Code user manual, not as a platform/SDK with cookbook-style growth.

### Visible duplication / overlap

- **Two "hooks" pages**: `/hooks-architecture` (the older, less polished one — listed under Architecture) AND `/architecture/hooks` (the newer "Hook Lifecycle" guide). Both live in the same section. The IA hasn't been pruned during the refactor — both URLs are still indexed. This is a docs-debt smell.
- **Two "architecture overview" surfaces**: `/architecture/overview` ("System components and data flow") + `/architecture-evolution` ("How claude-mem evolved from v3 to v5+"). Different intents, related slugs.
- **"Getting Started" appears in two places**: `/usage/getting-started` (a beginner tutorial) AND the section name itself ("Get Started"). The slug + the section header are easy to confuse.

These are signals that the IA was iterated organically rather than designed top-down. OneMem can avoid the same trap by sketching IA before writing pages.

## Indent depth

**Maximum 1 level deep at the URL level** (e.g., `/usage/getting-started`, `/architecture/overview`, `/configuration/litellm-gateway`, `/cursor/gemini-setup`). Most pages are at root (`/introduction`, `/configuration`, `/troubleshooting`, etc.) — there's no consistent path discipline. Of the 38 pages:

- 19 at root (e.g., `/introduction`, `/installation`, `/modes`, `/troubleshooting`)
- 19 one level deep (e.g., `/architecture/hooks`, `/usage/private-tags`, `/configuration/litellm-gateway`)

Mem0 by contrast has consistent 2-3 level paths (`/platform/features/v2-memory-filters`, `/components/llms/models/anthropic`, `/api-reference/memory/add-memories`) reflecting its larger surface. claude-mem stays mostly flat because it doesn't have enough pages to justify hierarchy.

## Total page count vs Mem0

| Section type | Mem0 | claude-mem |
|---|---|---|
| Total | 218 | 38 |
| Top-nav sections | 9 | 0 |
| Sidebar groups | 5-7 per context | 6 flat |
| Integrations | 34 | 3 (Cursor + Gemini + OpenClaw) |
| API endpoints (rendered) | 34 | 0 |
| Cookbooks | 29 | 0 |
| Components (vector DBs, LLMs, etc.) | 67 | 0 (just provider mentions inline) |
| Migration guides | 4 | 0 (one architecture-evolution page) |
| Changelogs | 4 | 0 |

claude-mem trades surface for focus: it's a Claude Code plugin manual + architecture book. Mem0 is a multi-product platform reference.

## Cross-linking patterns

### Top-of-page "Documentation Index" blockquote

Same pattern as Mem0 — every page opens with an `sr-only` blockquote pointing AI agents at `/llms.txt`:

```html
<blockquote class="sr-only">
  Documentation Index
  Fetch the complete documentation index at: https://docs.claude-mem.ai/llms.txt
  Use this file to discover all available pages before exploring further.
</blockquote>
```

Verified via `document.querySelectorAll('blockquote.sr-only')[0].textContent`. Same Mintlify-default behavior in both sites — the team didn't customize the prompt.

### Prev/Next page navigation at bottom of every doc

Two horizontally split cards at the bottom of each page (see all light-mode screenshots — present on every architecture and usage page):

```
[‹ OpenClaw Integration]                    [Architecture Evolution ›]
```

Verified at `/architecture/overview` via the DOM scan — the last 4 anchors in `<main>` include:
- `OpenClaw Integration` → `/openclaw-integration` (previous)
- `Architecture Evolution` → `/architecture-evolution` (next)

Mintlify generates these from the sidebar order in `docs.json`. Same behavior as Mem0.

### Anchor links on headings

Every H1/H2/H3 has a hidden anchor-link icon on the left that appears on hover (`-ml-10 flex items-center opacity-0 ... group-hover:opacity-100`). The label text is `Navigate to header X` (e.g., `Navigate to header Quick Start`). Same Mintlify convention used by Mem0.

### What's MISSING vs Mem0

- **No "What's Next?" 3-card grid at page bottom** — Mem0 has this on every doc; claude-mem does not
- **No "Additional Resources" bullet list** — Mem0 has this; claude-mem does not
- **No "Was this page helpful? [Yes] [No]" feedback row** — Mem0 has this; claude-mem strips it
- **No "Suggest edits"** link to the GitHub web editor on each page — Mem0 has this; claude-mem does not
- **No "Raise issue"** link to a prefilled GitHub issue — Mem0 has this; claude-mem does not
- **No concept-page → cookbook cross-link sentence** (because there are no cookbooks)
- **No integration-detail-page → integration-index breadcrumb** (because the integration index is just the 3 Cursor pages)

So claude-mem ships a minimum-viable Mintlify shape: search + theme toggle + prev/next + footer. Everything else is stripped.

## Search behaviour

- Triggered by `⌘K` or click on the header search pill
- Modal: ~640px max-width, centered, backdrop blur (Mintlify-default chrome)
- Input: 36px tall, "Search..." placeholder, `⌘K` hint pill on right at rest, "ESC" hint pill when modal is open
- Result rows: breadcrumb chain (e.g., "Architecture › Hooks architecture") + bold page title + 2-line excerpt + anchor link to `#section` slug
- 6 results returned for query "hook" (verified live) — Mintlify ranks by full-text match
- URL updates with `?search=<term>` as you type (verified — navigation from `/architecture/overview` → `/architecture/overview?search=hook`)
- Same modal + result-row pattern as Mem0

Empty state: `screenshots/23-search-modal-empty-light.png`.
Query "hook" state: `screenshots/24-search-modal-query-hook-light.png`.

## "Ask AI" assistant behaviour

**Disabled.** The Mintlify assistant slot exists in the DOM (`data-assistant-state="closed"` on `<html>`, `--assistant-sheet-width: 0px` CSS var) but no trigger button is rendered in the header or anywhere else on the page. So users cannot open a chat. Diverges from Mem0 which has the full 368px right-side chat sheet on every page.

## Mobile IA (375px viewport)

See `screenshots/25-introduction-mobile-375-light.png`. At mobile:

- Header collapses to: logo (left) + hamburger / overflow on right
- The 2 GitHub/Install link icons disappear into the overflow
- Search pill collapses to an icon
- Left sidebar gone — replaced by hamburger drawer trigger
- Right TOC gone (never rendered at this breakpoint anyway)
- Content fills 100% viewport width with ~16px gutters
- No floating Ask AI pill (because there's no Ask AI)
- Theme toggle moves into the overflow menu

## Tablet IA (768px viewport)

See `screenshots/26-introduction-tablet-768-light.png`. Same pattern as mobile — no left sidebar visible, no right TOC. Single-column content.

## Breakpoints

Tested at 375 / 768 / 1280 / 1440 / 1600 (verified by re-running layout-dims `evaluate`):

| Breakpoint | Left sidebar | Right TOC | Notes |
|---|---|---|---|
| 375 (mobile) | hidden, hamburger | hidden | Single column |
| 768 (tablet) | hidden, hamburger | hidden | Single column |
| 1024 (desktop S) | visible (288px wide) | hidden | 2-column |
| 1280 (desktop M) | visible | **hidden** | 2-column (Mem0 surfaces TOC at this width) |
| 1440 (desktop L) | visible | **hidden** | 2-column still |
| 1600 (desktop XL) | visible | **visible** (264px wide) | 3-column |

**Key divergence vs Mem0**: claude-mem requires a **wider viewport** for the right TOC (1600+) vs Mem0's 1280+. This is a Mintlify config option that prioritizes wide content (720px max content) over the third column. Mem0 chose to push the TOC into view sooner.

## Footer (bottom of every page)

Structured into 3 columns (verified via DOM walk):

```
[claude-mem logo + github icon]   [Resources]                [Legal]
                                  Documentation              License (Apache-2.0)
                                  Issues
```

Plus a "Powered by Mintlify" badge + the 3-option theme toggle (system / light / dark) on the right.

Both link blocks point exclusively to GitHub (no marketing site, no Discord, no X handle, no community). Compare to Mem0's footer which has Discord + X + GitHub social icons + a separate marketing URL. claude-mem is a GitHub-native project.

## What I'd port to `docs.onemem.ai`

1. **Minimum-viable Mintlify shape — don't overbuild at v0.1.** claude-mem ships a credible docs surface in 38 pages with no Ask AI, no PostHog, no Intercom, no cookbooks, no changelog. We can do the same. The Mintlify "Pro" features (Ask AI, analytics integrations) are easy to add later.
2. **Single sidebar with grouped headings — no nested context-switching.** Mem0's 9 top-nav sections each with their own sidebar tree is more IA than a v0.1 surface needs. One sidebar with grouped sections is enough.
3. **Skip the API reference UI section initially**; ship `openapi.json` at `/api-reference/openapi.json` for LLM consumption. Mintlify will detect it. Render UI pages later when there are 10+ endpoints worth detailing.
4. **Apache-2.0 license** — straightforward permissive license (matches what claude-mem does). OneMem should use the same.
5. **`/llms.txt` + `/llms-full.txt`** auto-generated by Mintlify, no setup needed.
6. **Theme toggle in the footer with system/light/dark** (3 options, not Mem0's binary) — better UX.
7. **Skip "Was this page helpful?", "Suggest edits", "Raise issue"** at v0.1 — Mintlify enables them by default but the team can disable per-page. claude-mem disables all three; we can too.

## What I'd add vs claude-mem

1. **Prev/Next pages are good, keep them** (Mintlify default).
2. **Cards on the home page** (Mem0 model) — claude-mem's `/introduction` is a long-form text page with no tile grid. OneMem's home should show 3-6 cards (Get Started / Verify a Trace / Self-Host / Providers / Dashboard / API).
3. **Top-nav promotion slots** (Mem0 model) — surface 1-2 "integration of the moment" links in the top bar (we promote Claude Code or the Sui MCP server). claude-mem skips the top nav entirely; that hides our integration story.
4. **Concept page → tutorial cross-link sentence** (Mem0 pattern) — even at 25 pages we can drive readers from short concept pages to a longer-form tutorial.
5. **Active changelog from day 1** (`/changelog` single page, no Mem0-style 4-way split). claude-mem has zero — that's a mistake. Users want to see velocity signals.
