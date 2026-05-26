# Mem0 Docs vs MemWal Docs

Captured 2026-05-23. OneMem-facing comparison. Mem0 side sourced from `MEM0_DOCS_DESIGN.md` + `MEM0_DOCS_IA.md` + `MEM0_DOCS_TECH.md`. MemWal side sourced from `../BRAND_AND_SURFACES.md` (inspirations synthesis) + `../../../BRAND_AND_SURFACES.md` (parent extraction) because memwal.ai doesn't ship a separate `docs.memwal.ai` surface — its product copy + brand tokens live on the SPA marketing site only.

## Snapshot

| Dimension | docs.mem0.ai | memwal.ai (product + implicit docs) | OneMem inherits from… |
|---|---|---|---|
| Surface type | Dedicated docs site (~218 pages) | SPA marketing + product site, no separate `docs.` subdomain | **Mem0** — OneMem needs a dedicated `docs.onemem.ai` from day 1 |
| Docs stack | Mintlify (managed SaaS) | Vite SPA, no docs-framework | **Mem0** — Mintlify for speed |
| Page count | 218 | n/a (no doc pages — all copy is on landing) | n/a |
| Primary surface color | White `#FFFFFF` (light) / `#0A0A0A` (dark) | Cream `#FAF8F5` (light) / Black `#000000` (dark) | **MemWal** — cream beats white-SaaS for differentiation; see `BRAND_AND_SURFACES.md` recommendation |
| Brand accent | Mintlify primary `#8F74E0` (deeper lavender, reads on white) | `#CAB1FF` (pastel lavender, reads on cream/dark) | **Both** — same hue family. OneMem should pick a single accent shifted slightly cooler (e.g. `#7C3AED`) to be ownable and family-aligned |
| Secondary accent | None — purple is the only chromatic moment | `#E8FF75` chartreuse-lime (CTAs, highlights) | **MemWal** — OneMem should reserve a chartreuse-family second accent for the "verify" UI surface ONLY (the parent BRAND doc names this `--accent-2: #D4FF5E`) |
| Body font | Inter (`MEM0_DOCS_TECH.md` § Fonts) | Ratch (custom variable, `/fonts/Ratch-Variable.ttf`) + Inter fallback | **Mem0** for body (Inter universal); **MemWal** for landing display (Ratch or Fustat as the brand voice) |
| Mono / code font | JetBrains Mono | Not heavily used (no code blocks on the marketing site) | **Mem0** — JetBrains Mono OR Geist Mono OR Fira Code; pick one and commit |
| Heading font | Inter (TWK Lausanne declared but not bundled) | Ratch | Either — but if we go Mintlify, Inter wins by default |
| Layout archetype | 3-column docs (240px sidebar + content + 240px TOC) | Single-column SPA hero + sections | **Mem0** — 3-column is the universal docs UX; copy directly |
| Code block syntax theme | One Dark Pro-adjacent (light + dark variants) | n/a | **Mem0** — Mintlify default + light/dark variants is fine for v0.1 |
| Callout system | 4 variants: cyan info, green tip, red warn, purple highlight | n/a (no callouts on marketing) | **Mem0** — same 4-variant pattern |
| Search | Mintlify first-party, ⌘K, instant + RAG-backed | None | **Mem0** — Mintlify ships this free |
| AI chat | Mintlify "Ask AI" 368px right sheet, first-party RAG | None | **Mem0** — same |
| Mobile responsive | 4 breakpoints (375/768/1024/1280) with hamburger drawer | SPA responsive | **Mem0** — Mintlify ships breakpoints + drawer free |
| Footer "Powered by" | "Powered by Mintlify" badge | None — Vite SPA, custom footer | **MemWal** if we self-host; **Mem0** if we accept the badge |

## What converges

1. **Lavender accent**: `#8F74E0` (Mem0 docs primary) and `#CAB1FF` (memwal landing) are in the same lavender-violet hue family. Both products use it as the single chromatic moment against a near-neutral surface. Verified in `screenshots/01-landing-introduction-light.png` ("Your Dashboard >" pill, sidebar active, H1 brand word) and the memwal CSS extraction in `BRAND_AND_SURFACES.md` (6 occurrences of `#CAB1FF`).
2. **Single dominant accent, no rainbow**: Both products avoid multi-hue palettes. Mem0 = purple-only (with green/yellow/red reserved for HTTP method badges and admonition variants). MemWal = lavender + lime (lime is a single accent, not a palette). OneMem should do the same: lavender for primary, chartreuse for the verify-specific moment, no third chromatic accent.
3. **Inter for body**: Both ship Inter (mem0 explicitly; memwal as the system fallback when Ratch fails). Inter is the safe universal default for any text-heavy doc surface.
4. **Sans-serif, no serif**: Neither product uses a serif anywhere. OneMem should commit to sans-only.
5. **Dark mode is pure-black-leaning**: mem0 docs dark = `#0A0A0A`. memwal landing dark = `#000000`. Both reject the GitHub-style `#0D1117` navy-tint route. OneMem should pick one approach and commit — `BRAND_AND_SURFACES.md` (parent) recommends `#0A0A0F` for OneMem (slightly bluer than pure black, distinguishes from memwal's `#000`).

## What diverges

1. **Surface color (the headline divergence)**: Mem0 docs ships **pure white** light mode. MemWal ships **warm cream `#FAF8F5`**. The cream surface is what gives memwal (and Walrus, and Langfuse, and Talus) the "documents / paper" editorial feel vs Mem0's "generic SaaS docs" feel. **OneMem should adopt the cream surface for landing AND docs** — this is the single highest-leverage brand differentiator vs Mem0.
2. **Typography distinctiveness**: Mem0 docs commits to Inter and lets the content speak. MemWal commits to Ratch (custom variable face) and lets the typography itself carry brand voice. OneMem could pick either approach but the Mem0 path is faster (no font licensing) and the MemWal path is more distinctive. **Recommendation: Inter for docs body + headings (Mem0 model) but Geist or Ratch for the landing-only display H1 (MemWal model).**
3. **Code-block presence**: Mem0 docs are 60%+ code blocks. MemWal landing has zero. OneMem docs will look like Mem0; OneMem landing should look like MemWal (image-first hero, not code-first).
4. **Second accent**: Mem0 has no second chromatic accent (HTTP method badges are functional, not brand). MemWal has lime `#E8FF75` as a deliberate brand signature. OneMem should follow MemWal here and reserve `#D4FF5E` (chartreuse) for the **verify** UI surface — the green-checkmark moment when a trace re-walks the Merkle chain successfully. This is what makes verification the visual signature of the product (analogous to how MemWal made lime its CTA color).
5. **Information density**: Mem0 docs pages run long (often 1500+ lines rendered) with high inline-link density and tabbed code blocks. MemWal copy is editorial-density (short paragraphs, generous whitespace). OneMem docs should match Mem0 density; OneMem landing should match MemWal density.

## What OneMem inherits from each

### From Mem0 (the docs structure)

- **Mintlify as the stack** — gets us search + Ask AI + `llms.txt` + responsive + dark mode + Github-edit + code-block-tabs free
- **3-column layout** (240px sidebar + max-720px content + 240px TOC)
- **HTTP method badge colors** (GET green / POST blue / PUT yellow / DELETE red) for API ref
- **4-variant callout system** (cyan info / green tip / red warn / purple highlight) — but rename "highlight" to use our brand purple
- **Tab-persistent code blocks** with Python-first ordering (or Python + TS as twins, TS first if our SDK is TS-primary)
- **Prev/Next + "What's Next?" 3-card row + "Additional Resources" bullets** at every page bottom
- **"Suggest edits → GitHub web editor"** link in every page footer
- **Concept page → cookbook cross-link sentence** pattern ("Want the long-form tutorial? See…")
- **Top-nav promotion slot** for the integration of the moment (mem0 promotes OpenClaw; we promote Claude Code or Sui MCP)

### From MemWal (the brand voice + visual signature)

- **Cream `#FAF8F5` surface** for landing + docs (OneMem parent BRAND doc proposes `#FAFAF7` — close enough to be on the family but not pixel-match)
- **Ratch (or Fustat) display font** for landing H1 + section H2s — body stays Inter
- **Second chromatic accent** reserved for one signature moment (theirs = CTA lime; ours = verify chartreuse)
- **Black dark-mode bg** — commit to `#0A0A0F` (slightly bluer than memwal's `#000`)
- **Square buttons** (`border-radius: 0`) — Mem0 uses pill, MemWal mixes; the parent BRAND doc commits OneMem to square per Sui ecosystem signal (`BRAND_AND_SURFACES.md` Section 7)
- **Editorial spacing on the landing** — short paragraphs, generous gutters, no code-as-hero (Mem0 puts the code snippet front-and-center; we replace it with a Merkle-chain SVG per parent BRAND §2.4)

## Net stance for OneMem

A docs site that **structurally** clones Mem0 (Mintlify + 3-column + lavender accent + tabbed code) but **visually** sits in the MemWal/Walrus/Sui-ecosystem family (cream surface + Geist-or-Ratch display type + square buttons + chartreuse verify-moment accent). The result reads as "Mintlify-default, but unmistakably ours" — the same trick LangSmith plays with their lavender-and-blue tint over Mintlify chrome, but committed harder.

## Cross-references

- `MEM0_DOCS_DESIGN.md` — full Mem0 visual extraction with hex codes + measurements
- `MEM0_DOCS_IA.md` — Mem0 sitemap + sidebar trees
- `MEM0_DOCS_TECH.md` — Mem0 stack provenance (Mintlify + Vercel + Cloudflare + PostHog)
- `../BRAND_AND_SURFACES.md` — palette synthesis across 14 reference products (includes MemWal extraction)
- `../../../BRAND_AND_SURFACES.md` — root brand decisions for OneMem incl. proposed `--accent #B08FFF` + `--accent-2 #D4FF5E`
