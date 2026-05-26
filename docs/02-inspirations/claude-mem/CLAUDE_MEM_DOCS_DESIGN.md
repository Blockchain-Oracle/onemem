# Claude-Mem Docs — Visual Design Extraction

Captured 2026-05-26. Every claim anchored to a screenshot in `screenshots/` or a `browser_evaluate()` result. Pixel measurements derived from the 1280-viewport `screenshots/03-introduction-light.png` unless noted; mobile from `screenshots/25-introduction-mobile-375-light.png`, tablet from `screenshots/26-introduction-tablet-768-light.png`, ultra-wide-with-TOC from `screenshots/41-introduction-wide-1600-light.png`.

## TL;DR

`docs.claude-mem.ai` ships the **default Mintlify design system with the most-vanilla configuration possible**: brand primary is unmodified Tailwind `blue-500` (`#3B82F6`), heading and body fonts are stock Inter, no custom display face, no second accent, no analytics widgets, no AI chat panel, no support widget. The Mintlify chrome is identical to Mem0's pixel-for-pixel; the only differences are (a) the color swatch (`#3B82F6` vs Mem0's `#8F74E0`), (b) a slightly bluer dark background (`#0E0E10` vs `#0A0A0A`), and (c) the team aggressively turned off optional Mintlify features (Ask AI, "Was this page helpful?", "Suggest edits", "Raise issue"). The result is the cleanest possible Mintlify install — a useful reference for what the "minimum-viable Mintlify docs" looks like.

---

## 1. Colors

### 1.1 Light mode (`screenshots/03-introduction-light.png`, `…/04-installation-light.png`, `…/15-configuration-light.png`)

All hex values derived from `getComputedStyle()` on real DOM elements in the live site (see `CLAUDE_MEM_DOCS_TECH.md` §"Theme tokens"). Tailwind variable names in parentheses match Mintlify's published palette.

| Token | Hex | Where it lives |
|---|---|---|
| `--background-light` | `#FFFFFF` | Page bg, content area |
| `--gray-50` (sidebar tint) | `#F4F6FA` | Left sidebar bg (subtle cool-gray off-white — slightly cooler than Mem0's `#FAFAFA`) |
| Foreground (body) | `#404246` (`--gray-700`) | Body paragraph color — note this is `gray-700`, darker than Mem0's `gray-800`-ish body |
| Foreground (headings) | `#181A1E` (`--gray-900`) | H1/H2/H3 |
| Foreground (muted / TOC heading) | `#515357` (`--gray-600`) | "On this page" label, muted secondary text |
| Border subtle | `#E0E2E6` (`--gray-200`) | Card borders, sidebar dividers, header underline |
| Border (active sidebar) | none | claude-mem does NOT use a left-edge accent bar on active sidebar items (Mem0 does). The active state is bg-tint + text-color only |
| Active sidebar bg | `rgba(59,130,246,0.10)` | A 10% tint of the primary blue — `bg-primary/10` Tailwind utility |
| Active sidebar text | **`#3B82F6`** (`--primary`) | Selected sidebar row text |
| **CTA / accent (primary)** | **`#3B82F6`** | Active sidebar, link color, focus rings, search input focus border |
| Link color (in-content) | **`#3B82F6`** | All `<a>` in `<main>` — `text-primary` |
| Link decoration | none at rest | Underline appears only on hover (Mintlify-default) |
| Code block bg (light) | `#FFFFFF` | All `<pre>` blocks transparent over white — relies on the wrapper border for separation |
| Code block border | `#EFF1F5` (`--gray-100`) | 1px wrapper border + 16px `rounded-2xl` |
| Inline code bg | `rgba(239,241,245,0.5)` | `bg-gray-100/50` — a HALF-OPACITY light gray (Mem0 uses a purple-tinted bg here) |
| Inline code text | `#111827` (`text-gray-900`) | Neutral near-black — NOT brand-tinted (Mem0 uses purple `#8F74E0` for inline code text) |
| Inline code padding | `2px 8px` | Small horizontal padding |
| Inline code border-radius | 6px | `rounded-md` |
| Code block border-radius | 16px | `rounded-2xl` — bigger than Mem0's 8px (`rounded-lg`) |

### 1.2 The blue specifically

Primary resolves to **`#3B82F6`** — verified three ways:
1. `getComputedStyle(documentElement).getPropertyValue('--primary')` returns `"59 130 246"` (which is `#3B82F6`)
2. `<meta name="msapplication-TileColor">` = `#3B82F6`
3. The `og:image` URL params include `primaryColor=%233B82F6` (Mintlify renders OG cards server-side using the actual theme tokens)

This is **vanilla Tailwind `blue-500`** — the team did not pick a custom shade or shift the hue. By contrast, Mem0 picked a custom lavender `#8F74E0` (close-to-but-not-equal-to `purple-400` `#A78BFA`). claude-mem's design philosophy here is "ship the framework default, don't bikeshed the brand color".

The corresponding `--primary-light = #EFF6FF` (`blue-50`) and `--primary-dark = #1E40AF` (`blue-700`) complete the Tailwind blue family. Mintlify uses `light` as the dark-mode foreground accent and `dark` as the light-mode hover/active state.

### 1.3 Dark mode (`screenshots/27-introduction-dark.png`, `…/28-architecture-overview-dark.png`, `…/29-hook-lifecycle-dark.png`, `…/30-getting-started-dark.png`, `…/36-database-dark.png`)

| Token | Hex | Where |
|---|---|---|
| `--background-dark` | `#0E0E10` | Page bg + sidebar bg (no elevation) — slightly bluer than Mem0's `#0A0A0A` |
| Foreground (body) | `#A0A2A6` (`--gray-400`) | Body paragraph text |
| Foreground (headings) | `#E0E2E6` (`--gray-200`) | H1, H2, H3 |
| Border | `rgba(255,255,255,0.10)` (`white/10`) | Card borders, code block borders, dividers |
| Active sidebar bg | `rgba(239,246,255,0.10)` | 10% tint of `--primary-light` (not `--primary`) — Mintlify shifts to the lighter token in dark mode |
| Active sidebar text | `#EFF6FF` (`--primary-light`) | The light-blue token reads better on near-black than the saturated `#3B82F6` would |
| In-content link color | `#EFF6FF` (`--primary-light`) | Same shift — links go light-blue in dark mode |
| Code block bg | transparent (same as page) | Relies on wrapper border + slight elevation |
| Code block border | `rgba(255,255,255,0.10)` (`white/10`) | Same border treatment as cards |
| Inline code bg | `rgba(255,255,255,0.05)` (`white/5`) | Very subtle white wash |
| Inline code text | `#E0E2E6` (`--gray-200`) | Neutral, not brand-tinted |

### 1.4 Callouts / admonitions

I scanned 12 light-mode pages (`screenshots/03` through `…/22`, `…/33-platform-integration-light.png`, `…/34-modes-languages-light.png`, `…/40-pm2-bun-migration-light.png`) — **claude-mem does not use Mintlify's callout components anywhere visible**. There are no `<Info>`, `<Tip>`, `<Warning>`, `<Note>` blocks rendered in the captured set.

The only blockquote on every page is the `sr-only` "Documentation Index" pointer at `/llms.txt` — not a visual element.

So the four-variant callout system that Mem0 uses heavily (cyan info / green tip / red warn / purple highlight) is **absent from claude-mem**. Either the team doesn't lean on admonitions or they've stripped them stylistically.

Implication: if OneMem wants admonitions, we have to opt-in (Mintlify ships the components; they appear when MDX authors use `<Info>`/`<Tip>`/etc.). claude-mem demonstrates you can ship a docs site with zero admonitions and have it read fine.

### 1.5 HTTP method badge colors

**None observed.** claude-mem has no rendered API reference pages (only the raw `/api-reference/openapi.json` for LLM consumption). So no `GET` / `POST` / `PUT` / `DELETE` color pills appear anywhere in the site. Mem0 by contrast uses these heavily (4 colors: GET green, POST blue, PUT yellow, DEL red) — but only because Mem0 has a 34-endpoint rendered API section.

Implication: when OneMem ships its API ref section, we get the same Mintlify method-pill system free — but only if we render the OpenAPI as UI pages, which neither claude-mem nor (in v0.1) OneMem needs to do immediately.

### 1.6 Syntax highlighting (`screenshots/05-getting-started-light.png`, `…/07-hook-lifecycle-light.png`, `…/15-configuration-light.png`, `…/40-pm2-bun-migration-light.png`)

Code blocks use Shiki — verified by `<pre class="shiki shiki-themes github-light-default dark-plus">`. So:

- **Light mode theme**: `github-light-default` (vs Mem0's `atom-one-light`-family)
- **Dark mode theme**: `dark-plus` (Microsoft VSCode's stock dark-plus — vs Mem0's `one-dark-pro`-family)

Hex palette derived from the screenshots:

| Token | Light (`github-light-default`) | Dark (`dark-plus`) |
|---|---|---|
| Comment | `#6E7781` | `#6A9955` (green-leaning, classic VSCode) |
| Keyword (`from`, `import`, `const`, `function`) | `#CF222E` (red) | `#569CD6` (blue) |
| String literal | `#0A3069` (deep blue) | `#CE9178` (orange-brown) |
| Number | `#0550AE` (blue) | `#B5CEA8` (pale green) |
| Function name | `#8250DF` (purple) | `#DCDCAA` (pale yellow) |
| Identifier / variable | `#24292F` | `#9CDCFE` (light blue) |
| JSON key | `#0A3069` | `#9CDCFE` |
| Punctuation | `#24292F` | `#D4D4D4` |

These are the canonical GitHub-default-light + Microsoft-dark-plus palettes Shiki ships with. claude-mem picked stock themes (vs Mem0 which picked Atom One variants). The trade-off: GitHub-light has higher syntax contrast (red keywords pop) but feels less "designer-curated"; Atom-one-light is more muted but feels editorial.

### 1.7 Sidebar group heading color

Sidebar group headings ("Get Started", "Cursor Integration", "Architecture") render as `<h3>` elements:

- Light mode color: `#181A1E` (`--gray-900`) — near-black, same as content H1
- Dark mode color: `#E0E2E6` (`--gray-200`) — near-white
- Font: Inter 14px / weight 600 / line-height 24px
- NOT all-caps (Mem0 uses all-caps tracking for sidebar group headings; claude-mem uses title case)

So claude-mem's sidebar groups read more like a content navigation list than Mem0's labeled "section" headings.

---

## 2. Typography

### 2.1 Font families (verified via `CLAUDE_MEM_DOCS_TECH.md` §Fonts)

```css
--font-inter: "Inter", "Inter Fallback", -apple-system, BlinkMacSystemFont,
              "Segoe UI", system-ui, sans-serif;
--font-jetbrains-mono: "JetBrains Mono", "JetBrains Mono Fallback",
                       "SF Mono", "SFMono-Regular", Menlo, Monaco,
                       "Cascadia Mono", "Segoe UI Mono", "Roboto Mono",
                       "Oxygen Mono", "Ubuntu Monospace", "Source Code Pro",
                       "Fira Mono", "Droid Sans Mono", Consolas, "Courier New",
                       monospace;
--font-family-headings-custom: ""    /* NOT declared - clean vs Mem0's phantom TWK Lausanne */
--font-family-body-custom: ""        /* NOT declared */
```

- **All text (body + headings):** Inter
- **Code:** JetBrains Mono

Same as Mem0 but cleaner — Mem0 declares `--font-family-headings-custom: 'TWK Lausanne'` and never bundles the woff, so headings silently fall back to Inter. claude-mem doesn't declare a phantom font; both `--font-family-headings-custom` and `--font-family-body-custom` are empty strings.

### 2.2 Size scale (measured at 1280px viewport from `screenshots/03-introduction-light.png` via `getComputedStyle(mdx.querySelector('h1'))` etc.)

| Element | Size | Weight | Line-height | Margin top |
|---|---|---|---|---|
| H1 (e.g. "Introduction", "Claude-Mem") | 30px | 600 (semibold, NOT 700 bold) | 36px | 32px |
| H1 subhead ("Persistent memory compression system…") | 18px | 400 | 28px | n/a |
| H2 (e.g. "Quick Start", "Key Features") | 24px | 700 (bold) | 32px | 48px |
| H3 (subsection within content) | 18-20px | 600 | n/a | varies |
| Body paragraph | 18px | 400 | 28px | n/a — note this is bigger than Mem0's 16px |
| Body (secondary paragraphs) | 16px | 400 | 24px | n/a |
| Sidebar nav link | 14px | 400 | 24px | 6px 12px 6px 16px padding |
| Sidebar group header (h3) | 14px | 600 | 24px | not all-caps |
| Right TOC heading | 14px | 600 | 24px | "On this page" |
| Code (block + inline) | 14px | 400 | 24px (block), 1.0 (inline) | — |

**Notable**: claude-mem's body text is **18px** (vs Mem0's 16px). This makes pages feel more spacious / more like an editorial article and less like a dense reference. Combined with `gray-700` body color (not `gray-800`), the result is a more relaxed reading rhythm.

### 2.3 H1 weight = 600 (not 700)

A subtle but real choice: claude-mem H1s are `font-semibold` (weight 600), not `font-bold` (700). Mem0 H1s are 700. This makes claude-mem H1s sit lower in visual hierarchy — closer to H2 weight — and gives the pages a quieter, more documentation-handbook feel.

---

## 3. Layout

### 3.1 Three-column grid (1600px+ viewport — `screenshots/41-introduction-wide-1600-light.png`)

| Region | Width | Notes |
|---|---|---|
| Left sidebar | 288px | Verified via `nav[aria-label="Pages"].getBoundingClientRect()` — slightly wider than Mem0's 280px |
| Main content | flex-fill, **content max ~720px** at 1600px viewport | Centered with growing gutters at wider viewports |
| Right TOC ("On this page") | 264px | At 1600px viewport — verified via `nav.getBoundingClientRect()` returning `{x: 1240, w: 264}` |

At 1280px viewport: sidebar (288px) + content (~528px, smaller because no right TOC competing) — see `mdxBox.width = 528.8px` from the layout-dims `evaluate` call.

### 3.2 Two-column grid (1280px viewport — `screenshots/03-introduction-light.png`)

Right TOC is **not** rendered at 1280px. Content expands to fill the right space. This differs from Mem0 which surfaces the TOC at 1280px. claude-mem's breakpoint for TOC is somewhere between 1440 and 1600 (tested both).

### 3.3 Top bar (~64px tall, sticky)

Sticky across all screenshots. Bottom border: 1px `#E0E2E6` (`--gray-200`). Internal padding 16px V, 32px H.

Layout (left → right at desktop):
1. Claude-Mem logo (mark + wordmark) — links to `https://github.com/thedotmack/claude-mem` (NOT a marketing site)
2. Search pill (`bg-background-light` over the page bg, `border-gray-200`, ~340px wide on desktop, "Search…" placeholder + `⌘K` hint on right)
3. (right-aligned cluster) GitHub icon link, Install icon link, theme toggle button

There is **no secondary nav row** (Mem0 has one with 9 horizontal pills under the top bar). The whole header is one row.

### 3.4 Padding scale (Tailwind defaults — Mintlify's tokens)

Padding values inferred from the spacing rhythm in the screenshots map to the standard Tailwind scale: `4, 8, 12, 16, 24, 32, 48px`. Sidebar item vertical padding is `6px 12px 6px 16px`. H2 margin-top is 48px (good vertical rhythm).

### 3.5 Breakpoints

Tested explicitly at 375 / 768 / 1280 / 1440 / 1600 (see `CLAUDE_MEM_DOCS_IA.md` §Breakpoints table). Summary:

| Breakpoint | Behavior |
|---|---|
| < 768px (mobile, 375 captured at `…/25-…`) | Single column. Top nav items collapse to overflow. Left sidebar gone — hamburger trigger. Right TOC gone. Search pill collapsed to icon. Theme toggle in overflow menu. |
| 768–1023px (tablet, 768 captured at `…/26-…`) | Still hamburger + single column. No left sidebar. No right TOC. Content expands to full width with generous gutters. |
| 1024px+ (desktop) | Left sidebar appears (288px). |
| 1600px+ | Right TOC appears (264px). |

Mem0 surfaces the right TOC at 1280px+; claude-mem holds it back to 1600px+. This trade prioritizes content width over the TOC at common desktop widths (1280, 1366, 1440 are the most common laptop screens).

### 3.6 Sticky header behavior

The top bar is sticky with the same `backdrop-blur` and `bg-white/80` overlay pattern as Mem0 (Mintlify-default). No secondary scroll-under row since claude-mem has no second nav row.

---

## 4. Component patterns

### 4.1 Left sidebar

Verified at all desktop screenshots, esp. `screenshots/03-introduction-light.png` and `…/27-introduction-dark.png`:

- **Collapsibles**: 6 group headings ("Get Started", "Cursor Integration", "Gemini CLI Integration", "Best Practices", "Configuration & Development", "Architecture") render as `<h3>` static labels. Not collapsible — the entire 38-page list is always expanded. Mem0 has collapsibles for sub-groups; claude-mem does not.
- **Indent depth**: 1 visual level (flat list under each group heading). Mem0 goes 4 levels deep at the Platform section.
- **Group header**: 14px semibold (`font-weight: 600`), `text-gray-900` (light) / `text-gray-200` (dark). NOT all-caps. NOT tracking-widened. Just bigger-than-body weight.
- **Active state**: Background `rgba(59,130,246,0.10)` (`bg-primary/10`), text `#3B82F6` (`text-primary`), no left border bar. Border-radius `rounded-xl` (12px).
- **Hover state**: Background gray-50 tint, no text color shift.
- **Icons**: Each group header has a small line icon (~16px) preceding the text — `<img>` not inline SVG, served from Mintlify CDN. Page-level sidebar items have NO icons (only group headings do).
- **No "section selector" pill at top** — Mem0 has the "Documentation" book-icon pill that signals multi-collection switching; claude-mem does not have multiple collections so this is correctly omitted.
- **Sidebar width**: 288px (vs Mem0's 280px — 8px wider).

### 4.2 Right TOC ("On this page")

Surfaced only at 1600px+ viewport (see `screenshots/41-…`):

- Header "On this page" with a small icon to the left, 14px semibold, `text-gray-600`
- Each entry = the H2 anchor link (H3s NOT auto-indented under H2 in the captured pages — flat list)
- Width: 264px
- Position: sticky from ~104px top, ends at footer
- 6 entries for `/introduction` (Claude-Mem / Quick Start / Key Features / How It Works / System Requirements / Next Steps)

### 4.3 Code blocks (`screenshots/05-getting-started-light.png`, `…/15-configuration-light.png`, `…/40-pm2-bun-migration-light.png`)

Verified via DOM inspection — the wrapper is `<div class="code-block mt-5 mb-8 not-prose rounded-2xl relative group min-w-0 codeblock-light border ...">`:

- Wrapper border-radius **16px** (`rounded-2xl`) — bigger than Mem0's 8px (`rounded-lg`)
- Wrapper border 1px `--gray-100` (light) / `white/10` (dark)
- Internal padding: 14px vertical (`py-3.5`), 16px horizontal (`px-4`)
- Margin: 20px top (`mt-5`), 32px bottom (`mb-8`)
- No line numbers
- No tab bar (single-language code blocks only — see §4.4)
- Background: transparent over page bg in light; `dark:bg-codeblock` in dark mode (a CSS variable; resolves close to `#1E1E1E`)

Top affordance row (`<div class="absolute top-3 right-4 flex items-center gap-1.5 print:hidden">`):
- Copy button on the right (icon-only, no label, hidden via `opacity-0` until hover via the `group` class on the wrapper)
- No language label visible — claude-mem code blocks display the code but not the language name

### 4.4 Code block language tabs

**None observed.** Every captured code block is single-language. Mem0 heavily uses the multi-tab pattern (Python | JavaScript | cURL) on quickstart + API ref pages. claude-mem doesn't need them because the code samples are mostly shell commands and one-off snippets, not API client invocations.

### 4.5 Inline code

- Background: `rgba(239,241,245,0.5)` (`bg-gray-100/50` light) / `rgba(255,255,255,0.05)` (dark)
- Color: `#111827` (`gray-900` light) / `#E0E2E6` (`gray-200` dark)
- Padding: `2px 8px` (smaller than typical, tighter horizontal padding)
- Border-radius: 6px (`rounded-md`)
- Font: JetBrains Mono, 14px

**Crucially, the text color is NEUTRAL (gray-900) — not brand-tinted.** This is a clean choice. Mem0 colors inline code in purple `#8F74E0` which makes API body tables visually busy. claude-mem's neutral inline code lets the prose breathe.

### 4.6 Tables

Captured tables on `/architecture/database`, `/architecture/hooks`, `/configuration` (see `screenshots/09-database-light.png`, `…/07-hook-lifecycle-light.png`, `…/15-configuration-light.png`). Same chrome as Mem0:
- Header row: subtle gray bg, semibold gray-700 text
- Body rows: flat white with 1px row separators
- No alternating row striping
- Border: 1px all-around, ~8px border-radius
- Cell padding: 12px V, 16px H

### 4.7 API endpoint header block

**None.** No rendered API reference pages.

### 4.8 Card grids

**None observed** in the captured screenshots. Mem0 has card grids on the home page + integrations index. claude-mem's `/introduction` page is a long-form text article, not a card grid hero. The 3 Cursor integration pages and the OpenClaw page are similar — long-form text with code blocks, no card-based navigation.

This is a meaningful UX choice: Mem0 = "browse by tile"; claude-mem = "read top-to-bottom". The trade-off is discoverability vs depth.

### 4.9 Search modal (`screenshots/23-search-modal-empty-light.png`, `…/24-search-modal-query-hook-light.png`)

Same Mintlify chrome as Mem0:
- Modal: 640px max-width, centered ~80px from top
- Backdrop: dark overlay with `backdrop-blur-sm`
- Input row: 48px tall, search icon left, "ESC" pill right
- Result row: breadcrumb (gray-500, 12px) → bold page title with mark highlighting in `--primary` (`#3B82F6` here) → 2-line excerpt with mark highlighting
- Each row 60-70px tall, hover bg subtle gray tint
- No "Ask AI assistant" CTA at the bottom of results (because Ask AI is disabled — see `CLAUDE_MEM_DOCS_TECH.md`)
- Keyboard nav: ↑↓ to walk results, Enter to open, ESC dismisses

The result-row highlight color follows the brand: terms appear in `#3B82F6` blue (vs Mem0's `#8F74E0` purple). Same Mintlify component, different theme primary.

### 4.10 Ask AI assistant panel

**Not present.** Disabled — see `CLAUDE_MEM_DOCS_TECH.md`. The Mintlify slot exists (`data-assistant-state="closed"`) but no trigger button is rendered. So no 368px right-side sheet, no chat textarea, no "Suggestions" buttons, no contact-support link.

### 4.11 Theme toggle

Two distinct theme toggle UIs:
- **Header (top right)**: Single binary button — "Toggle dark mode" icon. Cycles between light and dark on click.
- **Footer (bottom right)**: Three explicit buttons — "Switch to system theme" / "Switch to light theme" / "Switch to dark theme". This is the canonical Mintlify 3-option toggle.

Mem0 has only the binary header toggle (no 3-option footer toggle). claude-mem's footer 3-option gives users explicit control over system-preference-matching, which is a UX improvement.

### 4.12 "Suggest edits" / "Raise issue" / page feedback row

**None.** Verified by DOM scan for `helpful|suggest|raise|edit` — only got false positives (sidebar links matching "helpful" substring). No `Was this page helpful? [Yes] [No]` row. No `[Suggest edits ✏]` link. No `[Raise issue ⚠]` link.

This is a deliberate disable — Mintlify ships these by default. The team turned them off in `docs.json` (`feedback.thumbsRating: false`, `feedback.suggestEdits: false`, `feedback.raiseIssue: false`).

### 4.13 Prev / Next page navigation

Confirmed via the last 4 `<a>` elements inside `<main>` on `/architecture/overview`:

```
[OpenClaw Integration]                        [Architecture Evolution ›]
```

Same chrome as Mem0: two horizontally-split cards at the very bottom, ~50% width with 12px gap, 1px gray-200 border, 16px padding. Card title in 14px medium gray-700.

### 4.14 Footer

3-column layout + bottom row:

```
[claude-mem logo + github icon]
                       Resources         Legal
                       Documentation     License (Apache-2.0)
                       Issues
                       github

──────────────────────────────────────────────────────────────────────
Powered by Mintlify                       [System] [Light] [Dark]
```

The logo + GitHub icon column is left-aligned. Two columns ("Resources" + "Legal") sit center. The "Powered by Mintlify" badge with utm tracking sits on the bottom-left of the second row; the 3-option theme toggle on the right.

No social icons (Discord, X) beyond the GitHub link — claude-mem is exclusively GitHub-native, no Discord server, no Twitter handle in the footer.

### 4.15 Mobile menu (`screenshots/25-introduction-mobile-375-light.png`)

- Hamburger icon on left of top bar
- Tapping opens a left-side full-height drawer with the sidebar tree (no top-nav section to switch between — there's only one section)
- Backdrop: dark scrim
- Slide animation: standard Mintlify 200ms ease-out
- Close: tap backdrop, swipe left, or close X in drawer header

### 4.16 Hidden anchor-link icons on headings

Every H1/H2/H3 in `.mdx-content` has a hidden anchor-link button on the left that appears on hover:

```html
<a class="-ml-10 flex items-center opacity-0 border-0 group-hover:opacity-100 focus:opacity-100 ..." href="#section-id">
  <!-- chain-link icon SVG -->
</a>
```

Same pattern as Mem0 — both inherit Mintlify-default heading anchor behavior. Visual label text is `Navigate to header X` for screen readers.

---

## 5. Content patterns

### 5.1 Introduction / landing page (`screenshots/03-introduction-light.png`)

Structure:
1. H1 + 1-sentence subhead in `<p>`
2. Hidden `sr-only` blockquote pointing AI agents at `/llms.txt`
3. H1 again ("Claude-Mem") — repeats the title BELOW the page H1 (a docs-debt smell — the title is rendered twice, once by Mintlify's page chrome and once by the MDX frontmatter)
4. **bold** lead paragraph: "Persistent memory compression system for Claude Code"
5. Body intro paragraph
6. H2 "Quick Start" + 2 sequential code blocks (one curl install + one Claude Code marketplace install)
7. H2 "Key Features" + unordered list (4-6 items)
8. H2 "How It Works" + ordered list with **bold** "Core Components:" sub-headers + nested bullets
9. H2 "System Requirements" + bullet list
10. H2 "Next Steps" + body paragraph or 2-3 inline links
11. Prev/Next nav (no prev on intro; "Installation ›" as next)
12. Footer

No cards, no callouts, no images beyond a small mermaid-style ASCII diagram in "How It Works".

### 5.2 Concept page (`screenshots/19-context-engineering-light.png`, `…/22-file-read-gate-light.png`)

Structure:
1. H1 + subhead
2. Long-form body text (2-4 paragraphs)
3. Optionally one or two H2 subsections with body text + bullet lists
4. Occasionally a code block (config example)
5. Prev/Next + footer

These pages read like blog-post essays — declarative, narrative, no callouts, no cards. Different from Mem0's concept pages which have purple-tinted "Why it matters" callouts + comparison tables + linked CTAs.

### 5.3 Integration page (`screenshots/13-openclaw-integration-light.png`, `…/14-cursor-integration-light.png`)

Structure:
1. H1 + subhead
2. H2 "What is it?" / "Overview" — context paragraph
3. H2 "Installation" / "Setup" — numbered list with code blocks
4. H2 "Configuration" — tables or labeled key/value blocks
5. H2 "Usage" — code samples + body explanation
6. Optionally H2 "Troubleshooting" — bullet list
7. Prev/Next + footer

Shorter than Mem0's integration pages (which include "Available Tools" tables for MCP integrations). claude-mem's integration pages are more like setup guides than reference.

### 5.4 Architecture page (`screenshots/06-architecture-overview-light.png`, `…/07-hook-lifecycle-light.png`, `…/10-search-architecture-light.png`)

Structure:
1. H1 + subhead
2. Long-form expository text with H2/H3 sectioning
3. Code blocks throughout — config samples, function signatures, file paths
4. Tables for events / API surfaces / hook matchers
5. Occasional inline diagrams (rendered as code blocks with ASCII art)
6. Prev/Next + footer

These are the densest pages on the site — 1500-3000 word essays explaining how the worker service / hook lifecycle / database schema work. The Architecture section (8 pages, 21% of all pages) is unusually thick for a project this size, signaling that the team treats the docs as a reference book for platform implementers.

### 5.5 Configuration page (`screenshots/15-configuration-light.png`, `…/20-litellm-gateway-light.png`)

Structure:
1. H1 + subhead
2. H2 sections per config area (e.g., "Environment Variables", "Hooks Configuration", "Mode System")
3. Each section: 1-paragraph intro + a labeled config code block
4. Sometimes a table of env var names + descriptions
5. Prev/Next + footer

### 5.6 Code sample defaults

Across all pages: **Bash/shell is the most common language**, followed by JavaScript and JSON config snippets. Python appears sparingly (vs Mem0 where Python is the default everywhere). No multi-language tab switching — single-language code blocks throughout.

This signals the audience is Claude Code users (who run shell commands + edit JSON config) rather than SDK consumers writing app code.

### 5.7 Deprecation / version notes

Not observed in the captured pages. Versioned content lives in `/architecture-evolution` (an essay) and `/architecture/pm2-to-bun-migration` (a migration guide). No top-of-page banner saying "v3 deprecated, see v4 →".

### 5.8 External resource citations

Inline links use `#3B82F6` color (light) / `#EFF6FF` (dark), no underline at rest. Hover adds underline. External links don't get an explicit ↗ glyph.

---

## 6. Interaction patterns

- **Sidebar groups don't animate** because they aren't collapsible — all 38 items are always visible
- **Search debouncing**: None visible — types straight into Mintlify's search index, results update on every keystroke
- **Search URL state**: typing into the search input appends `?search=<term>` to the page URL (verified live)
- **Code copy button**: hover-only reveal (`opacity-0 group-hover:opacity-100`) — Mem0 also uses this pattern
- **Theme toggle**: instant swap, no transition animation visible
- **Scroll-spy on right TOC**: standard Mintlify `IntersectionObserver`, smooth (verified at 1600px viewport)
- **Heading anchor links**: hidden chain-link icon appears on hover, click copies the URL with `#anchor` fragment

---

## 7. Direct recommendations for `docs.onemem.ai`

### 7.1 Lock in Mintlify — claude-mem is the minimum-viable proof

The biggest takeaway: a credible Mintlify docs site can ship with **zero brand color customization** (`#3B82F6` is unmodified Tailwind blue-500), **zero analytics widgets**, **zero AI chat**, **zero feedback buttons**, **zero changelog**, and **38 pages of content**. The result is `docs.claude-mem.ai` — which works.

For OneMem v0.1 this means: don't sweat the Mintlify config. Pick a purple from the Tailwind palette (`violet-600 = #7C3AED`), ship the default Mintlify chrome, and write content. Optional features (Ask AI, analytics, feedback row) can be enabled in v0.2 once we have signal worth measuring.

### 7.2 OneMem theme config (Mintlify `docs.json`)

Same scaffold as the Mem0 recommendation but corrected with what claude-mem teaches:

```json
{
  "name": "OneMem",
  "theme": "mint",
  "colors": {
    "primary": "#7C3AED",     // Tailwind violet-600 — picks our distinct purple from the same family as Mem0 and memwal
    "light":   "#A78BFA",     // violet-400 — for dark-mode foreground + hover
    "dark":    "#5B21B6"      // violet-800 — for light-mode hover/active
  },
  "favicon": "/favicon.svg",
  "navigation": {
    "tabs": [],                   // skip top-nav tabs at v0.1 (claude-mem does this)
    "groups": [
      { "group": "Get Started",    "pages": [...] },
      { "group": "Core Concepts",  "pages": [...] },
      { "group": "Trace",          "pages": [...] },
      { "group": "Memory",         "pages": [...] },
      { "group": "Providers",      "pages": [...] },
      { "group": "Self-Host",      "pages": [...] },
      { "group": "Architecture",   "pages": [...] }
    ]
  },
  "feedback": {
    "thumbsRating": false,    // claude-mem-style: disable to keep pages clean
    "suggestEdits": true,     // KEEP — Mem0 has this; trivial to add and reduces friction
    "raiseIssue":  false
  },
  "ai": {
    "assistant": "disabled"   // ship without Ask AI at v0.1; revisit at v0.2 if Mintlify Pro
  },
  "font": {
    "headings": { "family": "Inter" },   // claude-mem-clean — no phantom custom font
    "body":     { "family": "Inter" }
  }
}
```

### 7.3 Patterns to copy from claude-mem (and AVOID from Mem0)

| Pattern | claude-mem | Mem0 | OneMem |
|---|---|---|---|
| Brand color | Vanilla Tailwind blue-500 | Custom lavender `#8F74E0` | Pick a Tailwind hex — `violet-600 #7C3AED`. Avoid bikeshedding |
| Headings font | Inter (no custom declared) | Inter + phantom TWK Lausanne | Inter only. Don't declare a custom font you can't bundle |
| Inline code color | Neutral gray-900 | Brand purple | Neutral gray. Brand color reserved for links + active states only |
| Sidebar group header style | Title case 14px semibold | All-caps 12px tracking-wide | Either works; pick one |
| Code block border-radius | 16px (`rounded-2xl`) | 8px (`rounded-lg`) | 12px (`rounded-xl`) — split the difference |
| Top-nav row | None | 9-pill horizontal nav | 2-3 pills MAX (we promote 1-2 integrations + API) |
| Feedback row | Stripped | Yes/No + Suggest edits + Raise issue | Just "Suggest edits → GitHub" (1 link, low cost, high signal) |
| Right TOC breakpoint | 1600px+ | 1280px+ | 1280px+ (Mem0's choice — wider visibility on common laptops) |
| Theme toggle | 3-option (system/light/dark) in footer + binary in header | Binary in header only | 3-option in footer (claude-mem wins here — explicit system option) |
| API ref UI | Hidden (just `openapi.json` for LLMs) | 35 rendered pages | Render UI pages once we have ≥10 endpoints; before that, expose `openapi.json` only |
| Cookbooks | None | 29 pages | None at v0.1; add when we have ≥5 partner integrations |
| Changelog | None (gap) | 4 parallel changelogs (over-engineered) | One `/changelog` page — single stream |

### 7.4 Anti-patterns observed (avoid)

- **Duplicate hook pages** (`/hooks-architecture` AND `/architecture/hooks`) — claude-mem hasn't pruned during refactor. Both still indexed. **Lesson: when migrating IA, delete the old URLs and 301 to the new ones.**
- **Repeated H1 on `/introduction`** — page chrome renders the H1 "Introduction" and then the MDX adds a second H1 "Claude-Mem" below. Visual + accessibility issue. **Lesson: pick one source of H1 (frontmatter title vs MDX `# Heading`) and stick with it.**
- **No top-nav at all** — claude-mem's 64px single-row header is clean but loses an opportunity to surface the integration of the moment. **Lesson: use the top nav for 2-3 promotion slots, not 9 like Mem0.**
- **No "Suggest edits" link** — claude-mem disabled this Mintlify default. **Lesson: keep "Suggest edits" — it's a 1-line config and removes friction for contributors.**
- **No changelog at all** — claude-mem has zero release notes surface. **Lesson: ship one `/changelog` page from day 1. Users want to see velocity.**
- **Body paragraphs at 18px with `gray-700` color** — this reads beautifully but burns vertical space on long pages. **Lesson: 16-17px body is the sweet spot for reference docs; 18px is for editorial. Pick based on content type.**

### 7.5 What claude-mem proves

The single most-useful insight from this deep-dive: **Mintlify in vanilla config is a complete docs surface**. You don't need to customize the color, you don't need Ask AI, you don't need analytics, you don't need cookbooks. With 38 well-organized pages + the Mintlify default chrome + a Tailwind primary color, you have a docs site that competes with `docs.mem0.ai` on quality despite being 5x smaller and stripped of premium features.

For a hackathon project (OneMem at Sui Overflow), this is the right baseline.

---

## 8. Cross-references

- `CLAUDE_MEM_DOCS_IA.md` — full sitemap + sidebar tree (38 pages, 6 groups, no top nav)
- `CLAUDE_MEM_DOCS_TECH.md` — Mintlify + Vercel + Cloudflare stack proof, theme tokens, license, what's-NOT-used
- `CLAUDE_MEM_DOCS_VS_OTHERS.md` — three-way compare claude-mem vs mem0 vs memwal
- `../mem0/MEM0_DOCS_DESIGN.md` — the headline Mem0 file this deep-dive mirrors
- `../BRAND_AND_SURFACES.md` (parent inspirations dir) — palette synthesis across 14 reference products
- `../../../BRAND_AND_SURFACES.md` (idea root) — OneMem brand decisions
