# Claude-Mem Docs vs Mem0 Docs vs MemWal Docs

Captured 2026-05-26. OneMem-facing three-way comparison. claude-mem side sourced from `CLAUDE_MEM_DOCS_DESIGN.md` + `CLAUDE_MEM_DOCS_IA.md` + `CLAUDE_MEM_DOCS_TECH.md`. Mem0 side sourced from `../mem0/MEM0_DOCS_DESIGN.md` (et al). MemWal side sourced from `../BRAND_AND_SURFACES.md` (inspirations synthesis) + `../../../BRAND_AND_SURFACES.md` (parent extraction) — note memwal.ai doesn't ship a separate `docs.memwal.ai` surface, so the MemWal column reflects its SPA marketing site styling extended hypothetically to a docs context.

## Snapshot table

| Dimension | docs.claude-mem.ai | docs.mem0.ai | memwal.ai | OneMem inherits from… |
|---|---|---|---|---|
| Surface type | Dedicated docs site (38 pages) | Dedicated docs site (218 pages) | SPA marketing only, no docs subdomain | **claude-mem + Mem0** — OneMem needs a dedicated `docs.onemem.ai` from day 1; claude-mem proves 30-50 pages is enough at v0.1 |
| Docs stack | Mintlify | Mintlify | Vite SPA, no docs framework | **claude-mem + Mem0** — same Mintlify stack confirmed (identical Vercel project ID `prj_NdMUpHpUIb41Po1H8c6hrChv2bgr`) |
| Page count | 38 | 218 | n/a | **claude-mem** is the more realistic v0.1 target |
| License | Apache-2.0 | (proprietary product, docs unspecified) | (proprietary) | **claude-mem** — Apache-2.0 for OneMem |
| Surface color (light) | `#FFFFFF` pure white | `#FFFFFF` pure white | `#FAF8F5` cream | **MemWal** — cream beats white-SaaS for differentiation |
| Surface color (dark) | `#0E0E10` (slightly bluer black) | `#0A0A0A` (near-pure black) | `#000000` pure black | **claude-mem** lineage — `#0A0A0F` for OneMem (between Mem0 and claude-mem) |
| Brand accent | `#3B82F6` vanilla Tailwind blue-500 | `#8F74E0` custom lavender | `#CAB1FF` pastel lavender + `#E8FF75` lime | **MemWal hue family** (purple) + **OneMem's own swatch** (`#7C3AED` violet-600) — not blue (claude-mem) or lavender-light (Mem0/MemWal) |
| Secondary accent | None | None | `#E8FF75` lime | **MemWal** — reserve `#D4FF5E` chartreuse for verify UI surface only |
| Body font | Inter | Inter (TWK Lausanne declared but not bundled — phantom) | Ratch (custom variable) + Inter fallback | **claude-mem** — Inter for body, no phantom custom font |
| Headings font | Inter (clean — no custom declared) | Inter (TWK Lausanne attempted) | Ratch | **claude-mem** — Inter for headings, don't declare a font you can't bundle |
| Mono font | JetBrains Mono | JetBrains Mono | Not used | **Both Mintlify sites** — JetBrains Mono works |
| H1 weight | 600 (semibold) | 700 (bold) | (varies) | **Mem0** — H1 at 700 reads more as docs hierarchy; 600 is editorial-soft |
| Body text size | 18px | 16px | (varies) | **Mem0** — 16-17px for reference docs; 18px is editorial |
| Inline code color | Neutral gray-900 | Brand purple `#8F74E0` | n/a | **claude-mem** — neutral inline code; brand color reserved for links + active states |
| Code block border-radius | 16px (`rounded-2xl`) | 8px (`rounded-lg`) | n/a | Either — 12px (`rounded-xl`) splits the difference |
| Code block syntax theme | Shiki `github-light-default` + `dark-plus` | Shiki `atom-one-light`-family + `one-dark-pro`-family | n/a | Mem0 — Atom One feels more editorial; GitHub-light is more "default" |
| Layout archetype | 3-column (288px sidebar + content + 264px TOC) | 3-column (280px sidebar + content + 240px TOC) | Single-column SPA | **Both Mintlify** — 3-column is the universal docs UX |
| Right TOC breakpoint | 1600px+ | 1280px+ | n/a | **Mem0** — surface TOC at 1280px for better visibility on common laptops |
| Top nav rows | 1 (header only, no pills) | 2 (header + 9-pill section row) | 1 | **Hybrid** — 1 row header with 2-3 promotion pills (not 9) |
| Search | Mintlify first-party, ⌘K, instant | Mintlify first-party, ⌘K, instant + RAG-backed | None | **Both Mintlify** — same behavior |
| AI chat | Mintlify slot WIRED but DISABLED | Mintlify Ask AI active (368px sheet) | None | **claude-mem** at v0.1 (disable to ship faster); revisit at v0.2 |
| Analytics | Cloudflare Web Analytics only (zero product analytics) | PostHog reverse-proxied + Cloudflare | None | **claude-mem** at v0.1 (skip product analytics); add later |
| Support widget | None | Intercom (`jjv2r0tt`) | None | **claude-mem** — skip Intercom at v0.1 |
| Cookie banner | None | None | None | All three skip it |
| Callouts (info/tip/warn) | None observed | 4 variants used heavily | n/a | **Mem0** — opt in to admonitions for concept pages |
| Card grids | None | Home tiles, integration cards, "What's Next?" 3-card | Hero tile | **Mem0** — use card grids for home + integration index |
| API ref UI | Hidden (just `openapi.json`) | 35 rendered pages with method pills | None | **claude-mem** at v0.1 (expose `openapi.json` for LLMs); render UI when ≥10 endpoints |
| Changelog | None (gap) | 4 parallel changelogs | None | **Single `/changelog` page** — split the difference |
| Cookbooks | None | 29 pages | None | None at v0.1 |
| Top-nav promotion slot | None | "OpenClaw" + "Agent Plugins" (deep-links into integrations) | n/a | **Mem0** — surface 2-3 integration shortcuts in top nav |
| Sidebar group nesting | 6 flat groups, no sub-nesting | 5 groups per context, sub-nested 4 levels deep | n/a | **claude-mem** — flat groups at v0.1; nest when sidebar exceeds 40 items |
| Sidebar group header style | Title case 14px semibold | All-caps 12px tracking-wide | n/a | Either — pick one and commit |
| Theme toggle | Binary header + 3-option footer (system/light/dark) | Binary header only | (varies) | **claude-mem** — 3-option footer + binary header is the best UX |
| Footer "Powered by" | "Powered by Mintlify" badge | "Powered by Mintlify" badge | None | If self-host: skip badge; if Mintlify: accept it |
| Footer social icons | GitHub only | Discord + X + GitHub | None | **Mem0** — include Discord + X if we have them |
| "Suggest edits" link | None | Yes, on every page | n/a | **Mem0** — keep this, 1 line of config, removes contributor friction |
| "Was this helpful?" feedback | None | Yes | n/a | **claude-mem** at v0.1 — strip this until we have signal worth collecting |
| `llms.txt` | 48 lines (auto-generated by Mintlify) | 496 lines (auto-generated) | None | **Both Mintlify sites** — free with Mintlify |
| `llms-full.txt` | Auto-generated | Auto-generated | None | **Both** — free with Mintlify |
| KaTeX preloaded | Yes | Yes | n/a | **Both** — Mintlify default |

## What converges across all three

1. **Lavender / purple is the docs-product family color**. Mem0 = `#8F74E0`, memwal = `#CAB1FF`, OneMem's parent BRAND doc proposes `#B08FFF` — all in the same hue family. claude-mem is the outlier with vanilla `#3B82F6` blue; this is a meaningful divergence and one reason claude-mem feels generic vs the others. OneMem should NOT follow claude-mem here.

2. **Inter for body** — all three converge. Universal safe default.

3. **Sans-serif only**. No serif fonts in any of the three sources.

4. **Dark mode is pure-black-leaning** — `#0A0A0A`, `#0E0E10`, `#000000` are all near-black with at most a very subtle blue/gray tint. None of the three use the GitHub `#0D1117` navy-tint route.

5. **JetBrains Mono for code** (in the two that have code blocks). Universal.

6. **Mintlify chrome is hard to beat**. Both docs sites in this comparison run on it. If OneMem wants the same 3-column + search + theme toggle + responsive ladder + `llms.txt` package, Mintlify is the off-the-shelf answer.

## What diverges

1. **Brand color philosophy**:
   - claude-mem: **vanilla Tailwind primary** (`blue-500`). Zero customization.
   - Mem0: **custom hex within the purple family** (`#8F74E0`).
   - MemWal: **custom hex outside Tailwind** (`#CAB1FF`).
   - **OneMem should follow Mem0/MemWal** — pick a custom hex (`#7C3AED` violet-600 is suggested), not a vanilla Tailwind swatch. The vanilla choice is what makes claude-mem feel generic.

2. **Surface color**:
   - claude-mem + Mem0: **pure white** light, near-black dark.
   - MemWal: **cream `#FAF8F5`** light, pure black dark.
   - **OneMem inherits from MemWal** — cream surface is the single highest-leverage brand differentiator. See parent `BRAND_AND_SURFACES.md`.

3. **Surface complexity** (number of pages, sections, components, widgets):
   - claude-mem: **minimum-viable**. 38 pages, 1 sidebar, 0 widgets.
   - Mem0: **everything-included**. 218 pages, 9 sections, Intercom + PostHog + Ask AI.
   - MemWal: **n/a**.
   - **OneMem should target claude-mem-complexity at v0.1, Mem0-complexity at v0.3**. Don't ship Mem0's surface on day 1 — we don't have the content to fill it.

4. **AI chat assistant**:
   - claude-mem: **disabled** (slot exists, no trigger button).
   - Mem0: **active** (full Mintlify Ask AI with prefilled prompts).
   - **OneMem: disabled at v0.1**. Revisit once we have enough content for the RAG to be useful.

5. **Analytics**:
   - claude-mem: **none** (only CF Web Analytics).
   - Mem0: **PostHog reverse-proxied + Intercom + CF**.
   - **OneMem: PostHog reverse-proxied at v0.1** (we want product signal from day 1; PostHog free tier covers it). Skip Intercom until we have actual customers asking questions.

6. **Inline code color**:
   - claude-mem: **neutral gray-900**.
   - Mem0: **brand purple**.
   - **OneMem follow claude-mem** — neutral inline code reads better in dense reference pages. Brand color reserved for links + active states only.

7. **Top nav**:
   - claude-mem: **no top nav at all** (just header).
   - Mem0: **9 horizontal pills** under the header.
   - **OneMem: 1-row header with 2-3 promotion pills** — surface our top integrations (Claude Code, Sui MCP) without Mem0's 9-pill chaos. Mid-route between the two.

8. **Body text size + color**:
   - claude-mem: **18px / `gray-700`** (editorial spacing, relaxed reading rhythm).
   - Mem0: **16px / `gray-800`** (dense reference rhythm).
   - **OneMem: 16-17px / `gray-800`** — reference-doc rhythm, not editorial. Mem0 wins here.

## What OneMem inherits from each

### From claude-mem (the minimum-viable shape)

- **Single sidebar, flat group structure** at v0.1. Don't nest 4 levels deep until we have 100+ pages.
- **Vanilla Mintlify chrome with brand color override only** — no other customization. Ship in a day.
- **Apache-2.0 license** — permissive, lets community fork freely.
- **Skip product analytics + support widget + AI chat at v0.1**. Add them after launch when we have actual users to measure.
- **Strip "Was this helpful?" feedback row** — the data is noise at low traffic.
- **3-option footer theme toggle** (system/light/dark) — better UX than Mem0's binary header-only toggle.
- **`/llms.txt` + `/llms-full.txt`** auto-generated — every coding agent (Cursor, Claude Code, Codex) reads them.
- **GitHub-as-source MDX** workflow — Mintlify pulls from the repo via webhook.

### From Mem0 (the surface depth + brand voice)

- **3-column layout with right TOC at 1280px+** (not claude-mem's 1600px+).
- **Custom brand hex** (not a vanilla Tailwind swatch). OneMem picks `#7C3AED` violet-600.
- **HTTP method badge colors** (GET green / POST blue / PUT yellow / DEL red) for the API ref section — comes for free with Mintlify when we render OpenAPI as UI pages (do this in v0.2 when we have ≥10 endpoints).
- **4-variant callout system** (cyan info / green tip / red warn / brand-tinted highlight). Mem0 uses these heavily; claude-mem doesn't use them at all. We follow Mem0.
- **Tab-persistent multi-language code blocks** (Python + TS + cURL) — for our SDK + API ref pages.
- **Prev/Next + "What's Next?" 3-card row + "Additional Resources" bullets** at every page bottom.
- **"Suggest edits → GitHub web editor"** link in every footer (claude-mem strips this — we keep it).
- **Top-nav promotion slot** for the integration of the moment (we promote Claude Code or Sui MCP).
- **Card grids on home + integration index** — claude-mem has none; Mem0 uses them effectively.
- **Active changelog from day 1** — but ONE page only (not Mem0's 4 parallel changelogs).

### From MemWal (the visual differentiation)

- **Cream `#FAF8F5` surface** for landing + docs (or a slightly different `#FAFAF7` per parent BRAND doc).
- **Second chromatic accent** (`#D4FF5E` chartreuse) reserved for the verify UI surface only.
- **Black dark-mode bg** (`#0A0A0F` — slightly bluer than memwal's `#000`).
- **Square buttons** (`border-radius: 0`) per Sui ecosystem signal (parent BRAND doc commitment).
- **Editorial spacing on the landing** — no code-as-hero (Mem0 puts code front-and-center; we replace with a Merkle-chain SVG).
- **Display font for landing H1 only** (Geist or Ratch) — docs body stays Inter (claude-mem + Mem0 path).

## Net stance for OneMem

OneMem docs at v0.1 = **claude-mem's shape + Mem0's surface details + MemWal's visual differentiation**.

- **Structure** (sidebar IA, page count, complexity): copy claude-mem. 30-50 pages, flat sidebar with 5-7 grouped sections, no AI chat, no analytics widgets, no feedback row.
- **Surface details** (3-column layout, callouts, card grids, code-block tabs, prev/next, "Suggest edits", method pills, promotion-slot top nav): copy Mem0. The depth-of-affordances Mem0 ships are the right v1.0 target.
- **Visual identity** (cream surface, custom purple hex, chartreuse verify-accent, square buttons, display font for landing): copy MemWal. This is what makes OneMem feel like *us*, not like "another Mintlify".

The result reads as "Mintlify-default chrome but unmistakably ours" — same trick LangSmith plays. Same trick Talus plays. Same trick Walrus plays. We follow the lineage.

## What we explicitly REJECT from claude-mem

- **Vanilla Tailwind brand color** — generic, undifferentiated, makes the site feel like every other Mintlify install.
- **Zero changelog** — leaves users without a velocity signal. We ship `/changelog` from day 1.
- **No "Suggest edits" link** — trivial Mintlify config, big contributor-experience win. We keep it.
- **18px body text** — too editorial for a reference docs surface. We use 16-17px.
- **Right TOC pushed to 1600px+** — most laptop screens are 1280-1440. The TOC should be visible there.
- **No top-nav promotion at all** — claude-mem hides its integrations. We surface them.
- **Duplicate hook pages** (`/hooks-architecture` AND `/architecture/hooks`) — IA hygiene. We delete on refactor.

## Cross-references

- `CLAUDE_MEM_DOCS_DESIGN.md` — full claude-mem visual extraction with hex codes + measurements
- `CLAUDE_MEM_DOCS_IA.md` — claude-mem sitemap + sidebar trees
- `CLAUDE_MEM_DOCS_TECH.md` — claude-mem stack provenance (Mintlify + Vercel + Cloudflare, license Apache-2.0)
- `../mem0/MEM0_DOCS_DESIGN.md` + `MEM0_DOCS_IA.md` + `MEM0_DOCS_TECH.md` + `MEM0_DOCS_VS_MEMWAL_DOCS.md` — full Mem0 deep-dive set
- `../BRAND_AND_SURFACES.md` — palette synthesis across 14 reference products (includes MemWal extraction)
- `../../../BRAND_AND_SURFACES.md` — root brand decisions for OneMem
