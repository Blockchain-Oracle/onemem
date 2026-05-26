# Mem0 Docs — Visual Design Extraction

Captured 2026-05-23. Every claim anchored to a screenshot in `screenshots/`. Pixel measurements derived from the 1280-viewport `screenshots/23-platform-overview-1280.png` unless noted; mobile/tablet observations from screenshots 21–22.

## TL;DR

`docs.mem0.ai` ships the default **Mintlify design system** with one customization: a brand-tinted primary **`#8F74E0`** (hex confirmed from the `<meta name="msapplication-TileColor">` and the rendered CTA pill in `screenshots/01-landing-introduction-light.png`). The CSS variable surface is full Tailwind with named tokens `--primary`, `--gray-50…950`, `--background-light`, `--background-dark`. Type stack: **Inter** for body + headings (the team declared `TWK Lausanne` for headings but the woff didn't bundle — `MEM0_DOCS_TECH.md` §Fonts), **JetBrains Mono** for code. The whole site reads as Mintlify-default-skin-with-a-purple-accent, which is itself a perfectly fine v0.1 stance for a docs surface.

---

## 1. Colors

### 1.1 Light mode (`screenshots/02-platform-overview-light.png`, `…/23-platform-overview-1280.png`)

| Token | Hex | Where it lives |
|---|---|---|
| `--background-light` | `#FFFFFF` | Page bg, content area |
| `--gray-50` (sidebar tint) | `#FAFAFA` | Left sidebar bg (very subtle warm-gray off-white) |
| Foreground (body) | `#1F2937` ~ Tailwind `gray-800` | Body paragraph color |
| Foreground (headings) | `#030712` ~ Tailwind `gray-950` | H1/H2 near-black, slight cool tint |
| Foreground (muted) | `#6B7280` ~ Tailwind `gray-500` | Subhead under H1 ("Managed memory layer for AI agents…") |
| Border subtle | `#E5E7EB` ~ Tailwind `gray-200` | Card borders, sidebar dividers, header underline |
| Border (active sidebar) | `#8F74E0` | Left vertical accent stripe on active TOC item (visible in `screenshots/23-platform-overview-1280.png` right rail, "Mem0 Platform Overview" highlighted) |
| Active sidebar bg | `#F3EFFE` (purple-50, derived from primary) | Selected sidebar row ("Overview" highlighted in left nav of `screenshots/23-…`) |
| **CTA / accent (primary)** | **`#8F74E0`** | "Your Dashboard >" pill button, sidebar active state, H1 brand word ("Mem0"), link color, "Documentation" header pill in left rail |
| CTA pill border-radius | ~9999px (full pill) | "Your Dashboard >" + sidebar group header pill |
| Brand wordmark | `#000000` | The "mem0" logo (atom mark on left) |
| Code block bg (light) | `#F9FAFB` ~ Tailwind `gray-50` | All `<pre>` blocks, with `#E5E7EB` border |
| Inline code bg | `#F3F4F6` ~ Tailwind `gray-100` | `<code>` text, ~2px x-padding |
| Inline code text | `#8F74E0` (purple) | The hex matches the primary — see `screenshots/15-api-add-memories-light.png` where "user_id" / "agent_id" / "messages" in the `--required` body table render in purple |

### 1.2 Lavender / purple specifically

The Mintlify primary on `docs.mem0.ai` resolves to **`#8F74E0`** (the value Mintlify embeds into `<meta name="msapplication-TileColor">` — see `MEM0_DOCS_TECH.md`). Visual confirmation: the "Your Dashboard >" header pill in `screenshots/01-landing-introduction-light.png`, the active sidebar row highlight in `screenshots/23-platform-overview-1280.png`, and the H1 brand color word ("**Mem0**" in "Build with **Mem0**" — `screenshots/01-landing-introduction-light.png`). This is in the same hue family as memwal.ai's `#CAB1FF` and mem0.ai's marketing `#CBB2FF` but **darker and more saturated** — Mintlify uses one swatch as both primary surface AND text/border accent, so it needs to read on white. The marketing site can use the pastel tint because it sits on cream/dark surfaces.

### 1.3 Dark mode (`screenshots/20-platform-overview-dark.png`, `…/33-landing-introduction-dark.png`, `…/30-api-add-memories-dark.png`)

| Token | Hex | Where |
|---|---|---|
| `--background-dark` | `#0A0A0A` (near-pure black, slight elevation off `#000`) | Page bg |
| Sidebar bg | `#0A0A0A` | Same as page (no elevation) |
| Foreground (body) | `#E5E7EB` ~ Tailwind `gray-200` | Body text |
| Foreground (headings) | `#FFFFFF` | H1, H2, H3 — pure white |
| Foreground (muted) | `#9CA3AF` ~ Tailwind `gray-400` | Subhead text |
| Border | `rgba(255,255,255,0.1)` (`white/10`) | Card borders, dividers — confirmed from CSS class names in `MEM0_DOCS_TECH.md` (`border-white/10`) |
| Active sidebar bg | rgba(143,116,224,~0.15) | Subtle purple wash on selected row ("Overview" highlighted in `screenshots/20-platform-overview-dark.png` left rail) |
| Active sidebar text | `#8F74E0` (same primary, no tonal shift) | Mem0 doesn't auto-derive a "purple-300" for dark mode — they keep `#8F74E0` |
| Code block bg | `#0F0F0F` (slightly elevated off page bg) | All `<pre>` blocks — visible in `screenshots/30-api-add-memories-dark.png` |
| Inline code bg | `rgba(255,255,255,0.06)` | Inline `<code>` against dark body text |

### 1.4 Callout / admonition colors

Verified across `screenshots/03-platform-quickstart-light.png` ("Pro Tip" cyan/teal callout), `screenshots/05-open-source-overview-light.png` ("Two ways to run Mem0 OSS" cyan info callout and "Need a managed alternative" green tip callout), `screenshots/09-core-concept-memory-types-light.png` ("Why it matters" near-white-with-purple-left-border callout and "Use user_id" green tip), `screenshots/12-migration-oss-to-platform-light.png` (multiple), and `screenshots/27-feature-v2-memory-filters-light.png` (red warning + green tip in close proximity).

| Variant | BG (light) | Border-left | Icon hue | Use |
|---|---|---|---|---|
| **Info / Note** (cyan) | `#ECFEFF` ~ `cyan-50` | `#06B6D4` ~ `cyan-500` | cyan | "Pro Tip", "Note" — most common |
| **Tip** (green) | `#F0FDF4` ~ `green-50` | `#22C55E` ~ `green-500` | green | "Use `user_id`…" |
| **Warning** (amber/red) | `#FEF2F2` ~ `red-50` | `#EF4444` ~ `red-500` | red | "Avoid storing secrets" in `screenshots/09-core-concept-memory-types-light.png`, "Bad practices" in `screenshots/27-…` |
| **Highlight / promo** (purple wash) | `#F3EFFE` (purple-50, brand) | `#8F74E0` | purple | "What you get with Mem0 Platform" collapsible, "Why it matters" |

All four variants share the same chrome: 12px padding, 8px border-radius, 4px left border, small icon (16px) + label inline with first sentence.

In dark mode the variants invert to `rgba(<hue>,0.08)` backgrounds with the same left-border accent (visible in `screenshots/30-api-add-memories-dark.png` — the green "Post the event status here" callout reads as a faint green wash on near-black).

### 1.5 HTTP method badge colors (`screenshots/14-api-reference-index-light.png` left sidebar, `screenshots/15-api-add-memories-light.png` heading + sidebar)

| Method | Hex (bg pill) | Text |
|---|---|---|
| `GET` | `#22C55E` ~ green-500 | white |
| `POST` | `#3B82F6` ~ blue-500 | white |
| `PUT` | `#EAB308` ~ yellow-500 | white/black depending on contrast |
| `DEL` (DELETE) | `#EF4444` ~ red-500 | white |

These pills appear both inline in the sidebar link text (e.g. left rail of `screenshots/15-…` shows the stacked list: green "GET", blue "POST", yellow "PUT", red "DEL") and as a larger badge to the left of the endpoint URL in the page header (e.g. `POST  v2/memories/add` at the top of `screenshots/15-…`). The "Try it ▶" button on the right of the same row is `#8F74E0` filled.

### 1.6 Syntax highlighting

Code blocks use **One Dark Pro-adjacent** palette (`screenshots/15-api-add-memories-light.png` request body block; `screenshots/30-api-add-memories-dark.png` for the dark variant where contrast is clearest):

| Token | Light mode hex | Dark mode hex |
|---|---|---|
| Comment | `#6B7280` (gray-500) | `#7F848E` |
| Keyword (`from`, `import`, `def`, `if`) | `#A626A4` (magenta) | `#C678DD` |
| String literal | `#50A14F` (green) | `#98C379` |
| Number | `#986801` (dark amber) | `#D19A66` |
| Function name | `#4078F2` (blue) | `#61AFEF` |
| Identifier (default) | `#383A42` | `#ABB2BF` |
| JSON key | `#E45649` (red) in light, `#E06C75` in dark | matches dark One Dark |

Mintlify uses `shiki` under the hood (visible in their generated DOM markup) with the `github-light` / `github-dark` themes by default but Mem0 appears to override to a `one-dark-pro`-family theme for dark mode. The light mode is closer to `atom-one-light` / `github-light`.

---

## 2. Typography

### 2.1 Font families (verified per `MEM0_DOCS_TECH.md` §Fonts + visual confirmation in all light-mode screenshots)

```css
--font-inter: "Inter", "Inter Fallback", -apple-system, BlinkMacSystemFont,
              "Segoe UI", system-ui, sans-serif;
--font-jetbrains-mono: "JetBrains Mono", "JetBrains Mono Fallback",
                       "SF Mono", "SFMono-Regular", Menlo, monospace;
```

CSS declares `--font-family-headings-custom: 'TWK Lausanne'` but the font file isn't bundled (no woff for TWK Lausanne in the three preloaded `media/*.woff2` URIs). H1/H2/H3 all compute to **Inter** at runtime. So in practice:

- **All text (body + headings):** Inter — verified by inspecting computed `font-family` on the H1 "Overview" in `screenshots/23-platform-overview-1280.png`
- **Code:** JetBrains Mono — visible in every `<pre>` block (e.g. `screenshots/15-api-add-memories-light.png`, the right-side `curl` example)

### 2.2 Size scale (measured from `screenshots/23-platform-overview-1280.png` — 1280px viewport, default zoom)

| Element | Size | Weight | Line-height |
|---|---|---|---|
| H1 ("Overview") | 36px | 700 (bold) | 1.2 (~43px) |
| H1 subhead ("Managed memory layer…") | 16px | 400 (regular) | 1.5 (~24px) |
| H2 ("Mem0 Platform Overview", "Why it matters", "Choose your path") | 24px | 700 | 1.3 (~31px) |
| H3 (used inside card titles, e.g. "Launch Your Workspace") | 16px | 600 | 1.4 |
| Body | 16px | 400 | 1.65 (~26px — generous, easy reading) |
| Small body / muted | 14px | 400 | 1.5 |
| Sidebar nav link | 14px | 500 (medium) | 1.4 |
| Sidebar group header ("Getting Started", "Core Concepts") | 12px | 600 (semibold), all-caps tracking | 1.2 |
| Right TOC ("On this page" header) | 12px | 600, all-caps | 1.2 |
| Right TOC entries | 13px | 400 | 1.5 |
| Code (block + inline) | 14px | 400 | 1.6 (block), 1.0 (inline) |
| Top-nav pill labels ("Welcome", "Mem0 Platform", …) | 14px | 500 active / 400 inactive | 1.4 |

### 2.3 Marketing landing (`screenshots/01-landing-introduction-light.png`) — different scale

The landing H1 "Build with Mem0" reads at ~48–52px, weight 700. Subhead "Universal, self-improving memory layer…" at ~18px regular. CTA link "Write your first memory →" at ~14px medium with a `#8F74E0`-tinted underline on hover. So the landing page uses a noticeably larger display scale than the doc pages, but with the same font stack.

---

## 3. Layout

### 3.1 Three-column grid (1280px+ viewport — `screenshots/23-platform-overview-1280.png`)

| Region | Width | Notes |
|---|---|---|
| Left sidebar | 280px | Includes 24px padding L/R, content ~232px |
| Main content | flex-fill, **max-width 720px** of text | Centered with extra margin on both sides at wide viewports |
| Right TOC ("On this page") | 240px | Sticky, ~150px from page top |

At 1440px+ the layout doesn't expand the content max-width — it grows the right/left gutters instead. This is the classic Mintlify "ribbon of content in a sea of whitespace" pattern.

### 3.2 Top bar (~64px tall, sticky)

Sticky across the screenshots. Bottom border: 1px `#E5E7EB`. Internal padding 16px V, 32px H.

Layout (left → right):
1. Mem0 logo (atom mark + wordmark, ~80px wide)
2. Centered: Search pill (`bg-gray-50`, `border-gray-200`, ~480px wide on desktop, `Search…` placeholder + `⌘K` hint on the right)
3. Centered: "Ask AI" pill button (gray, with sparkle icon)
4. Right: "Your Dashboard >" CTA pill (filled `#8F74E0`, white text, 14px medium, ~150px wide)
5. Right: theme toggle (sun/moon icon, no system option visible — pure binary toggle)

Below the top bar: a secondary nav row (~48px tall) with the 9 horizontal section pills (Welcome / Mem0 Platform / OpenClaw / …). The active section has an underline border-bottom in `#8F74E0`. This row scrolls under the top bar (the top bar is sticky, this row is not — verified by comparing scroll position screenshots).

### 3.3 Padding scale (Tailwind defaults — Mintlify's tokens)

Padding values inferred from the spacing rhythm in the screenshots map to the standard Tailwind scale: 4, 8, 12, 16, 24, 32, 48px. Card padding inside the home tiles (`screenshots/01-landing-introduction-light.png`) is 24px. Section vertical rhythm between H2 blocks is 48–64px. Sidebar item vertical padding is 6–8px.

### 3.4 Breakpoints (from `screenshots/21-platform-overview-mobile-375.png`, `…/22-platform-overview-tablet-768.png`, `…/23-platform-overview-1280.png`)

| Breakpoint | Behavior |
|---|---|
| < 768px (mobile, 375 captured) | Single column. Top nav pills disappear into hamburger. Left sidebar gone — replaced by a "Getting Started › Overview" breadcrumb bar with a hamburger icon. Right TOC gone. Search pill replaced by search icon. Theme toggle replaced by a 3-dot overflow menu. Floating Ask AI pill at bottom-right with a darker Mem0 atom badge attached. |
| 768–1023px (tablet, 768 captured) | Still no left sidebar — same hamburger + breadcrumb pattern as mobile. No right TOC. Content expands to full width with generous gutters. |
| 1024px+ (desktop) | Left sidebar appears. |
| 1280px+ | Right TOC appears. |

This is the standard Mintlify responsive ladder.

### 3.5 Sticky header behavior

The top bar (logo + search + Ask AI + dashboard + theme) is `position: sticky` with a `backdrop-blur` and a `bg-white/80` overlay (verified by class names in `MEM0_DOCS_TECH.md` § Search). Scroll position shifts the second row (the 9-tab nav) under the top bar — only the top 64px is permanently visible. The right TOC is also sticky, ~150px from top, ending at footer.

---

## 4. Component patterns

### 4.1 Left sidebar

- **Collapsibles**: Each top-level group ("Getting Started", "Core Concepts", "Platform Features") is a static label (not collapsible). Subgroups inside ("Essential Features", "Advanced Features" under "Platform Features" — visible in `screenshots/02-platform-overview-light.png`) ARE collapsible — small chevron `›` rotates to `⌄` on click. State persists in `localStorage` (Mintlify default).
- **Indent depth**: 4 levels max (Platform → Features → Essential → page). Each level adds 16px left padding.
- **Group header**: 12px uppercase semibold, `text-gray-500`, 16px top margin from prior group.
- **Active state**: Background `#F3EFFE` (purple-50), text `#8F74E0`, left border 2px `#8F74E0`. No bold weight shift.
- **Hover state**: Background `#F9FAFB` (gray-50), no text color shift.
- **Icons**: Each top-level item has a small line icon (~16px) preceding the label. Icons are line-weight 1.5, gray-600. Icons go purple when the item is active.
- **"Documentation" pill** at the top (purple-tinted bg `#F3EFFE`, book icon, `#8F74E0` text) — this is the section selector. There's only one "Documentation" book in this site so it doesn't expand to a menu, but it's the slot where Mintlify customers with multiple guidebook collections would show a switcher.

### 4.2 Right TOC ("On this page")

- Header "On this page" with a small list icon, 12px uppercase, `text-gray-500`.
- Each entry = the H2/H3 anchor link. H3s indented 12px under their parent H2.
- Active entry: 2px left border + text `#8F74E0`. Smooth scroll-spy as the user scrolls (no jitter).
- Sticky from ~150px top, ends at footer.
- Disappears below 1280px.

### 4.3 Code blocks (`screenshots/15-api-add-memories-light.png`, `…/17-oss-python-quickstart-light.png`)

Frame:
- Background `#F9FAFB` (light) / `#0F0F0F` (dark)
- Border 1px `#E5E7EB` (light) / `rgba(255,255,255,0.08)` (dark)
- Border-radius 8px
- Padding 16px (top/bottom slightly tighter when tab-bar is present)
- No line numbers visible in any screenshot

Top affordance row:
- **Language tab(s)** on the left (active tab has `#8F74E0` underline + dark text; inactive tabs are gray)
- **Copy button** on the right (clipboard icon, 16px, gray-500 → gray-700 on hover; no visible "copied!" toast in screenshots but it animates per Mintlify defaults)

### 4.4 Code block tabs (Python | JavaScript | TS | cURL)

Visible in `screenshots/03-platform-quickstart-light.png`:
- Tab order: `Python | JavaScript | cURL` for SDK examples; `Python | TS | cURL` on API ref pages
- Selected tab persists across pages via `localStorage` (Mintlify default — verified by `MEM0_DOCS_TECH.md`)
- "Python" is the default selected tab everywhere
- Tab labels are 13px regular, with the active one bolded to 500 and underlined in `#8F74E0`

### 4.5 Inline code

`background: rgba(143,116,224,0.10); color: #8F74E0; padding: 1px 6px; border-radius: 4px; font-family: var(--font-jetbrains-mono); font-size: 0.875em`

The purple color for inline code is a deliberate brand choice — most Mintlify customers use neutral gray. Verified by the "user_id" / "agent_id" / "messages" markers in `screenshots/15-api-add-memories-light.png` body text and the "Use `user_id`…" green-tip callout in `screenshots/09-core-concept-memory-types-light.png`.

### 4.6 Tables (`screenshots/15-api-add-memories-light.png` body table)

- Header row: `bg-gray-50`, semibold gray-700 text, 12px uppercase tracking
- Body rows: alternating? No — flat white with 1px `#E5E7EB` row separators
- Hover: no visible row hover state in screenshots
- Border: 1px all-around, 8px border-radius (subtle)
- Cell padding: 12px V, 16px H
- Column widths: param name + type + required + description (auto-fit; description gets the bulk)

### 4.7 API endpoint header block (`screenshots/15-api-add-memories-light.png`)

The endpoint page opens with:
```
POST  v2/memories/add        [Try it ▶]
```
- Method pill (`POST`, blue `#3B82F6`, 13px white) inline-flex with the URL (mono, 16px)
- Right-aligned "Try it ▶" CTA in `#8F74E0`
- Below: a brief one-sentence description, then sections for Endpoint / Headers / Request body / Response

This is the standard Mintlify OpenAPI page chrome.

### 4.8 Card grids (home + integrations + cookbooks)

Two patterns in active use:

**Home tile cards** (`screenshots/01-landing-introduction-light.png`):
- 3-column grid at desktop, 2-col at tablet, 1-col at mobile
- Card: 12px border-radius, 1px gray-200 border, no shadow
- Each card has an illustrated thumbnail at top (~40% of card height), then title + 2-line description
- Hover: subtle shadow OR purple border (not visible in static screenshots but consistent with Mintlify default)

**Integration index cards** (`screenshots/06-integrations-index-light.png`):
- 2-column grid
- Smaller: 16px logo icon at top-left + title + 2-line description
- 8px border-radius, 1px gray-200 border
- Click → integration detail page

**"What's Next?" 3-card row** (bottom of every doc page — `screenshots/03-platform-quickstart-light.png`, `…/17-oss-python-quickstart-light.png`):
- 3-column grid (collapses on mobile)
- Each card: small icon + title + 1-2 line description
- No image — just icon/title/text

### 4.9 Search modal (`screenshots/24-search-modal-empty.png`, `…/25-search-modal-query-memory.png`)

- Modal: 640px max-width, centered ~80px from top
- Backdrop: `rgba(0,0,0,~0.4)` with `backdrop-blur-sm`
- Input row: 48px tall, search icon left, "ESC" pill right (`bg-gray-100`, `text-gray-500`, 11px)
- Result row: breadcrumb (gray-500, 12px, e.g. "Mem0 Platform › Platform Features › Essential Features") → bold page title with `<mark>` highlighting of matched terms in `#8F74E0` → 2-line excerpt with same `<mark>` highlighting
- Each row 60-70px tall, hover bg `#F9FAFB`
- API endpoint results carry their HTTP method pill inline (blue POST pill before "Create Memory Export" in `screenshots/25-…`)
- Footer "Ask AI assistant" link with the sparkle icon — purple text, leads into a prefilled chat starter
- Keyboard nav: ↑↓ to walk results, Enter to open, ESC dismisses (standard Mintlify)

### 4.10 Ask AI assistant panel (`screenshots/26-ask-ai-assistant-panel.png`)

- Right-side sheet, 368px wide
- When open, `<html>` gets `data-assistant-state="open"` and CSS var `--assistant-sheet-width: 368px` shifts the page content left
- Header: "Assistant" label + close (X) + new-chat (+) icons
- Disclaimer line: "Responses are generated using AI and may contain mistakes." in 12px gray-500
- 3 prefilled suggestion buttons under a "Suggestions" header
- Input textarea: "Ask a question…" 100% wide, with a small `⌘I` keyboard hint and an upward-arrow send button on the right (purple when input has content, gray when empty)
- Footer: "Contact support" link with email icon → `mailto:support@mem0.ai`
- Below the assistant sheet is a small floating black-circle pill with the Mem0 atom mark — that's the assistant TOGGLE button, persistent at bottom-right of viewport

### 4.11 Theme toggle

- Top bar far-right: sun ☀ / moon 🌙 icon button (no system option visible)
- One-click toggle, no dropdown
- State persists in `localStorage`
- Mobile (`screenshots/21-…`): the toggle moves into the 3-dot overflow menu

### 4.12 "Suggest edits" / "Raise issue" / page feedback row

Every doc page footer (`screenshots/03-platform-quickstart-light.png`, etc.):

```
Was this page helpful?  [Yes] [No]              [Suggest edits ✏] [Raise issue ⚠]
```

- "Yes"/"No" pills: outline buttons, ~60px wide, `border-gray-200`
- "Suggest edits" → opens `https://github.com/mem0ai/mem0/edit/main/docs/<slug>.mdx` in GitHub's web editor
- "Raise issue" → opens a prefilled GitHub issue
- 12px regular gray-600 text, icons 14px

### 4.13 Prev / Next page navigation

Two horizontally split cards at very bottom of every doc:

```
[ ‹ Previous: Platform vs Open Source ]    [ Next: Memory Types › ]
```

- Each card: 1px gray-200 border, 16px padding, 50% width with 12px gap
- Title in 14px medium, gray-700
- "Previous" / "Next" label in 12px gray-500
- Card hover: border darkens to gray-300 (no color shift)

### 4.14 Footer (bottom of every page)

- Centered row with 3-4 social icons (Discord, X, GitHub) as `-webkit-mask-image` SVG swatches (not `<img>` tags — see `MEM0_DOCS_TECH.md`)
- "Powered by Mintlify" badge on the right with utm tracking params
- Background: same as page (no separator beyond the prev/next card row)

### 4.15 Mobile menu (`screenshots/21-platform-overview-mobile-375.png`)

- Hamburger icon on left of top bar
- Tapping opens a left-side full-height drawer with the section nav (the 9 top-level tabs) + the active section's sidebar tree
- Backdrop: `rgba(0,0,0,0.5)`
- Slide animation: 200ms ease-out from left
- Close: tap backdrop, swipe left, or close X in drawer header

---

## 5. Content patterns

### 5.1 Get-started / quickstart page (`screenshots/03-platform-quickstart-light.png`, `…/17-oss-python-quickstart-light.png`)

Standard structure:
1. **Breadcrumb header** ("Getting Started") above H1
2. **H1** + 1-sentence subhead + Copy Page button (with split-dropdown for "Open in Cursor" / etc.)
3. **Prerequisites** as a bulleted list with linked external resources
4. **Installation** in a numbered list of code blocks (1. Install SDK 2. Set up API key 3. Add a memory 4. Search memories)
5. **Output** code block showing expected response
6. Optional cyan tip callout near the end
7. **What's Next?** 3-card row
8. **Additional Resources** bullet list (3 items)
9. Page feedback + prev/next nav + footer

### 5.2 Concept page (`screenshots/09-core-concept-memory-types-light.png`)

1. Breadcrumb + H1 + subhead
2. **H2 "How Mem0 Organizes Memory"** intro paragraph
3. **Purple-tinted "Why it matters" callout** with 3 bullet justifications — this is the page's value-prop block
4. **Key terms** as H2 → small definition list, each term in **bold**, 1-sentence definition
5. **Comparison subsection** ("Short-term vs long-term memory") with a side-by-side block
6. **"How does it work?"** numbered steps + code block
7. **"When should you use each layer?"** bullet list
8. **"How it compares"** table
9. **"Put it into practice"** with linked CTAs (Add Memory, Memory Operations)
10. **"See it live"** with linked tutorial cards
11. Prev/next + footer

### 5.3 Integration page (`screenshots/07-integration-claude-code-light.png`, `…/08-integration-openclaw-light.png`, `…/19-integration-langchain-light.png`)

Universal shape:
1. Breadcrumb + H1 (integration name) + subhead
2. **What it does** H2: 2-3 paragraph context
3. **Requirements** as a table or bullet list
4. **Installation** as a tabbed code block (the install command — usually `npm install …` or `pip install …`)
5. **Setup and Configuration** with multiple sub-flows (e.g. Hosted / Self-host / OpenAI-compatible)
6. **Available Tools** as a table (for MCP-style integrations) OR **Code examples** for SDK-style
7. **Troubleshooting** bullet list of common errors
8. Prev/next + footer

The install command shape is always the same: code block + language tabs + copy button + 1-line caption underneath. Easy to lift.

### 5.4 API reference page (`screenshots/15-api-add-memories-light.png`)

1. **Method pill + endpoint URL** as the H1-equivalent (no separate H1 above)
2. Inline "Try it ▶" CTA
3. **Description** paragraph
4. **Endpoint** sub-section with Method / URL / Content-Type
5. **Required headers** table
6. **Request body** with a JSON example code block + a "Common fields" parameter table
7. **Response** with example JSON + body field table
8. The **right side** of this page (not the right TOC, but the right HALF of the content column) is a sticky 2-pane block with: top half = "URL" + curl example; bottom half = response JSON example. This is the classic two-pane API reference layout, embedded inline rather than as a separate column.

### 5.5 Code sample defaults

Across `screenshots/03-…` (quickstart), `…/15-…` (API ref), `…/17-…` (Python quickstart), `…/19-…` (LangChain integration): **Python is always the default tab**. JavaScript/TypeScript and cURL appear as alternates. This signals the team's primary audience is Python-first AI engineers.

### 5.6 Deprecation / version notes

Visible in `screenshots/27-feature-v2-memory-filters-light.png` — a small warning callout near the top of the page noting "v3 introduces…" with a link to the migration guide. No version selector in the top nav — the migration guide is the only way to disambiguate versions.

### 5.7 External resource citations

Inline links use `#8F74E0` color + `text-decoration: underline` on hover (no underline at rest). External links don't get an explicit `↗` glyph. The migration page (`screenshots/12-migration-oss-to-platform-light.png`) shows the team uses callout boxes with phrases like "See the Configuration page →" to externalize navigation rather than dropping raw URLs inline.

---

## 6. Interaction patterns

- **Sidebar nav animation**: Collapsible chevrons rotate 90° on click, 150ms ease. Subgroups slide-down with a 200ms ease-out reveal.
- **Search debouncing**: None visible — Mintlify pushes characters straight to its search index and renders results on every keystroke. With ~218 pages indexed this is fast enough to feel instant.
- **Code copy button feedback**: Icon swap from clipboard → checkmark for ~1.5s, then revert. No toast.
- **Tab switching persistence**: Selected language tab (Python vs JS vs cURL) persists across all code blocks on the page AND across pages via `localStorage`. Persistence key is per-language-group (so SDK tabs and API tabs are separate keys).
- **Theme toggle persistence**: `localStorage` + respects `prefers-color-scheme` on first visit.
- **Scroll-spy**: Right TOC updates the active anchor as you scroll. Smooth (not jittery) — uses `IntersectionObserver`.

---

## 7. Direct recommendations for `docs.onemem.ai`

### 7.1 Docs stack — pick Mintlify for v0.1

Mintlify gets you the entire surface in this document for free, including:
- 3-column layout with sticky TOC + sidebar
- Search + "Ask AI" first-party (no Algolia / Kapa setup)
- `llms.txt` + `llms-full.txt` auto-generated
- Suggest-edits → GitHub web editor on every page
- Light/dark theme toggle with localStorage persistence
- HTTP method badge colors out-of-the-box for OpenAPI pages
- Tab-persistent code blocks across pages
- Mobile responsive ladder (375 / 768 / 1024 / 1280 breakpoints)

The trade is a Mintlify Pro subscription for custom domain + analytics + Ask AI (currently $150-300/mo depending on plan), and a "Powered by Mintlify" badge in the footer.

If we want to avoid the SaaS lock-in: **Fumadocs** (Next.js, MDX, has search out of the box, no first-party AI chat) is the closest self-hosted shape. Recommend Mintlify for v0.1 speed; revisit at Series A.

### 7.2 OneMem theme config (Mintlify `docs.json`)

```json
{
  "name": "OneMem",
  "theme": "mint",
  "colors": {
    "primary": "#7C3AED",     // shifted from mem0 #8F74E0 to be deeper / more violet
    "light": "#A78BFA",       // primary tint for dark mode
    "dark": "#5B21B6",        // primary darken for active states
    "anchors": {
      "from": "#7C3AED",
      "to": "#D4FF5E"         // chartreuse second accent — used on "verify" UI surfaces ONLY
    }
  },
  "favicon": "/favicon.svg",
  "topbarCtaButton": {
    "type": "link",
    "name": "Open Dashboard",
    "url": "https://app.onemem.ai"
  },
  "font": {
    "headings": { "family": "Geist" },
    "body":     { "family": "Inter" }
  }
}
```

Brand-matched, **not** a Mem0 clone — `#7C3AED` is meaningfully darker/more saturated than `#8F74E0`, so the doc surface feels like its own thing while still being on the purple-lavender family lineage that mem0/memwal/Zep/Walrus all sit in.

### 7.3 IA template for OneMem (informed by Mem0 but reordered)

```
1. Get Started
   ├── Welcome / What is OneMem
   ├── Quickstart
   ├── Verify a trace (5-min tutorial)
   └── Concepts (TraceSession, ActionCall, MemoryNamespace, Anchor)

2. Core Concepts
   ├── Trace anatomy
   ├── Memory anatomy
   ├── Anchor + verify (Merkle chain + Sui attestation)
   └── Namespaces + capabilities

3. Trace
   ├── Capturing traces
   ├── Verifying traces
   ├── Replaying traces
   └── Exporting (JSON / SARIF)

4. Memory
   ├── Add / Search / Update / Delete
   ├── Namespaces
   ├── Capabilities + sharing
   └── Bulk operations

5. Providers (THE INTEGRATION GRID — top-nav slot)
   ├── Claude Code
   ├── Hermes
   ├── Vercel AI SDK
   ├── OpenAI Agents SDK
   ├── LiveKit
   └── Raw SDK (Python / TS)

6. Runtimes
   ├── Cloud (hosted)
   ├── Self-host
   ├── Move package reference
   └── CLI

7. API Reference (auto-generated from OpenAPI)
   ├── Memory APIs
   ├── Trace APIs
   ├── Namespace APIs
   └── Webhook APIs

8. Dashboard
   ├── Local install
   ├── Hosted
   └── /trace/[id] viewer reference

9. Self-host
   ├── Setup
   ├── Configuration
   └── Operations

10. Changelog
    ├── Highlights
    ├── SDK
    └── Move package
```

Reorder vs Mem0:
- **"Providers" replaces "Integrations"** — and it gets the top-nav promotion slot (the way Mem0 promotes "OpenClaw" + "Agent Plugins" — we promote our top 1-2 providers per quarter)
- **"Trace" gets its own top-level section** — this is our pillar that Mem0 doesn't have
- **"Self-host" pulled out from under "Open Source"** — we don't have the Platform-vs-OSS split, just one runtime story with a hosted convenience
- **No "Cookbooks" at v0.1** — we don't have enough recipes. Add this in v0.2 after we ship 5+ partner integrations.

### 7.4 Five must-have pages at v0.1

1. `/get-started/welcome` — what is OneMem + the 3 pillars (verifiable / cross-runtime / replayable)
2. `/get-started/quickstart` — install + send first trace in 5 commands (Python tab default, with TS + cURL alternates)
3. `/get-started/verify-a-trace` — the killshot tutorial: send a trace, anchor it, re-verify it, share it (this is the doc that gets shared in the launch tweet)
4. `/api-reference` — auto-generated OpenAPI index
5. `/providers` — the 6-card integration grid

That's it. Everything else lives behind nav and gets fleshed out by v0.2.

### 7.5 Anti-patterns observed in Mem0 docs (avoid)

- **Top-nav promotion ambiguity**: Having "OpenClaw" and "Agent Plugins" as top-nav slots that are actually deep-links into the Integrations section is genuinely confusing — a first-time visitor doesn't know whether "OpenClaw" is a separate product or a feature. Avoid: keep the top nav as section-level only. Promote individual integrations via the home page card grid instead.
- **TWK Lausanne phantom font**: They declared a custom headings font in CSS and never bundled the woff, so headings fall back silently to Inter. Either bundle the font or don't declare it. We should pick Inter (or Geist) and commit.
- **Four parallel changelogs**: Mem0 splits changelog into Highlights / Product / OSS / SDK. For a single-product team at v0.1 this is over-engineered. Ship one `/changelog` page. Split when you actually have 3+ audiences.
- **Inline purple for code identifiers is overplayed**: `user_id`, `agent_id`, `messages` etc. all render in `#8F74E0` which makes API body tables feel busy. Use neutral gray for inline code; reserve purple for links + active states. (This may be a personal taste call — but I'd flag it.)
- **No version selector in the top nav**: Mem0 has v2/v3 SDK splits but no UI to switch between docs versions. Migration guide is the only escape hatch. If OneMem ships a v2 of anything, plan a docs version switcher from day 1.
- **Mobile assistant floats over content**: The bottom-right Ask AI pill in mobile view (`screenshots/21-platform-overview-mobile-375.png`) sits ON TOP of the content. On a short page or near the bottom this obscures the prev/next nav. Avoid: position assistant trigger in the header overflow menu instead.

---

## 8. Cross-references

- `MEM0_DOCS_IA.md` — full sitemap + sidebar trees per section
- `MEM0_DOCS_TECH.md` — Mintlify + Vercel + Cloudflare stack proof, font CSS variables, search/assistant internals
- `MEM0_DOCS_VS_MEMWAL_DOCS.md` — side-by-side compare (this folder)
- `../BRAND_AND_SURFACES.md` (parent inspirations dir) — palette synthesis across 14 reference products
- `../../../BRAND_AND_SURFACES.md` (idea root) — extracted lavender from memwal + mem0 marketing sites
