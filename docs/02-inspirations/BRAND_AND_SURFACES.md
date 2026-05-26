---
status: canonical merge of (a) trace+providers agent brief and (b) Playwright visual synthesis across 18 reference products
date: 2026-05-23
project_slug: OneMem (working name — candidates: OneMem / Receiptly / Driftwood / Memcite)
purpose: single source of truth for v0.1 brand tokens, surface inventory, type stack, and "don't do" list
supersedes: `../../BRAND_AND_SURFACES_LEGACY.md` (kept for archival)
inputs:
  - mem0.ai + docs.mem0.ai (Framer + custom)
  - memwal.ai (Vite SPA)
  - 14 Playwright captures (this `02-inspirations/` tree + `01-sui-ecosystem/visual/`)
  - 4 added in this pass: elizaOS, Theoriq, Olas, OnlyFins
  - extracted CSS-bundle hex + computed-style data via Playwright
---

# Brand & Surfaces — OneMem v0.1 (canonical)

Single source of truth for the v0.1 visual + surface decisions. Combines the trace+providers agent's surface spec (5 ship surfaces + CLI command shape + lavender-family extraction) with the Playwright agent's hard data across 18 live products.

---

## §1 — Color palette synthesis

### 1.1 Background surfaces (the most differentiating dimension)

| Product | Primary bg | Family | Source |
|---|---|---|---|
| mem0.ai | `#FFFFFF` | pure white | Framer DOM extraction |
| mem0 docs | `#FFFFFF` | pure white | DOM |
| MemWal | `#FAF8F5` / `#FAF8F5` | warm cream | CSS bundle (`/assets/index-BKeqVLoc.css`, 6 occurrences) |
| Walrus | `#000000` (cream text `#FAF8F5`) | inverse cream/black | DOM |
| Sui | `#000000` (white text) | black + navy steps | DOM |
| Supermemory | `#F5F9FF` | light-blue tint | DOM |
| Letta | `#C9CDD1` | cool gray | DOM |
| Zep | `#FFFFFF` + `#F5F3FF` lavender + `#F5F3F0` cream | white with tinted fills | DOM |
| Pieces | `#FFFFFF` + `#292A2B` dark | white / graphite inverse | DOM |
| Khoj | `#FFFFFF` | pure white | DOM |
| Langfuse | `#EDEDE8` | warm sand / paper | DOM |
| LangSmith | `#FFFFFF` + `#EDE9FE` lavender + `#E0EDF8` blue | white + lavender/blue | DOM |
| Phoenix | `#FFFFFF` | pure white | DOM |
| Helicone | `#FFFFFF` | pure white | DOM |
| Talus | `#ECEBE9` | warm light-gray | DOM |
| **elizaOS** | **`#000000`** + `#D7D5CA` tan card | **full dark + tan break** | DOM |
| **Theoriq** | **`#FFFFFF`** + `#000000` inverted sections | white + dark alternation | DOM |
| **Olas** | **`#FFFFFF`** + slate-50/100 banding | white + slate banding | DOM |
| **OnlyFins** | **`#000000`** (Radix dark-theme) | full dark (Radix Themes) | CSS bundle |

**Clusters:**
- **Warm/tinted (differentiated):** MemWal `#FAF8F5`, Langfuse `#EDEDE8`, Talus `#ECEBE9`, Letta `#C9CDD1`, Supermemory `#F5F9FF`, elizaOS tan-card `#D7D5CA`
- **White-SaaS (generic):** mem0, Khoj, Phoenix, Helicone, LangSmith, Olas, Theoriq
- **Full dark (bold):** Walrus, Sui, OnlyFins, elizaOS

### 1.2 Accent colors (the brand signature)

| Product | Accent hex | Hue family |
|---|---|---|
| mem0.ai | `#0066FF` + `#CBB2FF` | electric blue + lavender |
| MemWal | `#CAB1FF` + `#E8FF75` | lavender + lime |
| Walrus | `rgba(161,200,255,0.1)` | pale blue tint |
| Sui | `#298DFF` | sui blue (marketing) |
| OnlyFins | `#0090FF` | sui blue (product, brighter) |
| Supermemory | `#0763EE` + `#0452DB` + `#2563EB` | three-step blue |
| Letta | none — monochrome | — |
| Zep | `#4226AA` + `#421FCB` + `#F5F3FF` | three-step purple |
| Pieces | none — pure monochrome | — |
| Khoj | none — pure monochrome | — |
| Langfuse | `#1863DC` (link only) | minimal blue |
| LangSmith | `#EDE9FE` + `#E0EDF8` | lavender + light blue |
| Phoenix | `#0384C3` | cyan-blue |
| Helicone | `#0EA5E9` | sky-500 |
| Talus | none — monochrome | — |
| **elizaOS** | **`#FF5800`** + `#0B35F1` | **electric orange + electric blue** |
| **Theoriq** | **`#FFFD37`** + `#D4A843` gold | **hi-vis yellow + gold** |
| **Olas** | **`#7E22CE`** + `#9333EA` | **deep + standard violet** |

**Pattern signal:**
- **Purple/lavender lineage** (the genre signal for memory + agent infra): **mem0, MemWal, Zep, LangSmith, Walrus, Olas** — 6 of 18 products. **OneMem's lavender choice is on-pattern, not derivative.**
- **Blue lineage** (dev-tool default): mem0 CTA, Sui, OnlyFins, Supermemory, Phoenix, Helicone, Langfuse — the generic safe pick.
- **Single-fluorescent-on-dark** (the strong-brand pattern): MemWal lime `#E8FF75`, elizaOS orange `#FF5800`, Theoriq yellow `#FFFD37`. Three different fluorescent picks, same architectural move. **OneMem's chartreuse + lavender pairing is the same move with new pigments.**
- **Pure monochrome** (no accent): Pieces, Khoj, Letta, Talus. "Serious infra" stance — OneMem is NOT taking this position; we need the chartreuse to make verification visible.

### 1.3 Detailed lavender-family hex extraction (from CSS bundles)

The trace+providers agent extracted these directly from the CSS bundles — preserved as the ground-truth source for the lavender choice:

**Memwal.ai (`/assets/index-BKeqVLoc.css`):**

| Token | Hex | Occurrences | Role |
|---|---|---|---|
| `bg.dark` | `#000000` | 78 | Primary dark bg |
| `text.dark` | `#2D2D3A` | 3 | Dark-mode body text |
| `bg.cream` | `#FAF8F5` | 6 | Primary light bg |
| `bg.cream-2` | `#F0EDE8` | 2 | Card surface light |
| `border.subtle` | `#E8E8E8` / `#E4E5E4` | 2 each | Borders light |
| `text.muted` | `#8A8D9A` | 2 | Secondary text |
| **`accent.lavender`** | **`#CAB1FF`** | **6** | **Primary accent** |
| **`accent.lime`** | **`#E8FF75`** | **10** | **Secondary accent (CTA)** |
| `state.success` | `#22C55E` | 2 | Tailwind green-500 |
| `state.warning` | `#F59E0B` | 1 | Tailwind amber-500 |
| `state.error` | `#EF4444` / `#F87171` | 2 + 2 | Tailwind red-500/400 |

**Mem0.ai (Framer-rendered HTML):**

| Token | Hex | Role |
|---|---|---|
| `bg.dark` | `#000000` | Primary dark bg |
| `bg.charcoal` | `#121212` | Secondary dark bg |
| `bg.cream` | `#FCFCFC` | Primary light bg |
| `text.body` | `#565553` | Body on light |
| `text.muted` | `#A1A1AA` | Tailwind zinc-400 |
| **`accent.lavender`** | **`#CBB2FF`** | **Primary accent** |
| `accent.blue` | `#0099FF` | Link/hover |
| `text.heading` | `#181818` | Headings on light |

**Verified insight:** `#CAB1FF` (MemWal) and `#CBB2FF` (mem0) are functionally the same color — this is the brand family OneMem joins. Olas (`#7E22CE`) and Zep (`#4226AA`) sit at the *deeper* end of the same family; LangSmith (`#EDE9FE`) at the *lighter* wash end.

### 1.4 Status colors observed across the corpus

- Zep: red `#DA3633`, amber `#D4A017`
- OnlyFins (Radix Themes defaults): green `#46A758` / `#30A46C`, amber `#FFC53D`, red `#FF0000`
- Tailwind defaults (Helicone, Olas): sky/zinc/red
- GitHub-derived (clean, accessible): error `#DA3633`, warning `#D4A017`, ok `#2EA043`

---

## §2 — Typography matrix

### 2.1 Fonts observed (custom vs free)

| Product | Display | Body | Code | License |
|---|---|---|---|---|
| mem0.ai | Fustat (custom) | DM Mono | DM Mono | Fustat free / DM Mono free (Google Fonts) |
| mem0 docs | Inter | Inter | — | free |
| MemWal | **Ratch** (variable, custom — `/fonts/Ratch-Variable.ttf`, weight 100–900) | Inter | JetBrains Mono | Ratch licensed (verify foundry) |
| Walrus | Ratch | Ratch | — | licensed |
| Sui | TWK Everett | TWK Everett | — | licensed |
| OnlyFins | Segoe UI (Custom) + Open Sans (Custom) | (Radix `size-adjust` pattern over system) | Menlo / Consolas (Custom) | free |
| Supermemory | Space Grotesk | DM Sans | — | both free (Google) |
| Letta | Roobert (custom) | Roobert | Fira Code | Roobert licensed, Fira Code free |
| Zep | Neue Montreal (custom) | Neue Montreal | system mono | NM licensed |
| Pieces | GT America (custom) | GT America | — | licensed (~$650/weight) |
| Khoj | Roboto | Source Serif 4 | — | both free (Google) |
| Langfuse | f37 Analog (serif) | Inter | — | f37 licensed, Inter free |
| LangSmith | TWK Lausanne | Inter | — | TWK licensed, Inter free |
| Phoenix | Roboto | Roboto | — | free |
| Helicone | Inter | Inter | — | free |
| Talus | BelfastGrotesk | Borna | — | both licensed |
| **elizaOS** | **NHaasFont** (Neue Haas Grotesk variant) | NHaasFont | — | licensed |
| **Theoriq** | **Test Founders Grotesk** + Inter Variable | Founders Grotesk | — | Founders licensed, Inter free |
| **Olas** | **Inter** (only) | Inter | — | free |

### 2.2 Pattern observations

- **Inter is the dominant body fallback** — 7 of 18 products use it directly; another 4 use it as fallback
- **Two-font system** (custom display + neutral body) is the dominant pattern: mem0, MemWal, Supermemory, Langfuse, LangSmith, Talus, Theoriq
- **Single-font system** (often Inter) reads more "generic Tailwind starter": Olas, Helicone, mem0-docs
- **Display sizes** cluster at: 60–72px (most common — mem0, MemWal, elizaOS, Olas, Theoriq) and 84–176px (Sui 176, Walrus 144, Helicone 84 — for bold "poster" heroes)
- **Editorial small-body** (14–16px body under 60–70px display) gives an editorial / publication feel — Letta 28px body is the outlier going the *other* way (oversized body)

### 2.3 Free pairings that look premium

- `Geist + Geist Mono` (Vercel, OFL — modern, neutral)
- `General Sans + Inter` (free analog of Founders Grotesk + Inter pattern from Theoriq)
- `Space Grotesk + DM Sans` (used by Supermemory — geometric/technical pair)
- `Inter Display + Inter` (Helicone/Langfuse — universal default)
- `Fustat + Inter` (mem0 pattern, both free via Google)

---

## §3 — Layout archetypes observed

### 3.1 Marketing landing archetypes

1. **Big-poster H1 hero** (Sui 176px, Walrus 144px, Pieces 68.8px, Helicone 84px, **elizaOS 72px**) — full-bleed dark, single huge headline, one CTA
2. **Cream / paper editorial** (MemWal, Langfuse, Talus) — warm bg, restrained type, "documents" feel
3. **Tinted-white SaaS** (Supermemory, LangSmith) — light-blue/lavender bg, multi-section feature reels
4. **Pure-white minimal** (mem0, Khoj, Helicone, Phoenix, **Olas**) — fastest to ship, hardest to differentiate
5. **Alternating light/dark sections** (**Theoriq**, Sui, Walrus) — white hero → dark product section → white CTA → editorial rhythm

### 3.2 Docs archetypes

- **3-column** (left nav 240–270px, main, right TOC): Langfuse 240px, LangSmith 267px, Phoenix 256px, mem0 docs (Mintlify default)
- **Mintlify-default** dominates: mem0, LangSmith, Phoenix all look variant-of-Mintlify
- Card-tile feature grids (rounded-2xl + hover-primary) on docs home

### 3.3 Dashboard archetypes (inferred from public trace-viewer references)

- **Left span tree + right detail pane** (Langfuse, LangSmith, Phoenix) — the universal trace UX
- **Tabbed detail pane**: Input / Output / Attributes / Metadata / Logs / Feedback
- **Top meta bar**: timing, token count, status chip
- **Gantt-style waterfall** (Phoenix) — span timing as horizontal bars

### 3.4 Web3/dApp app archetypes (from OnlyFins)

- **Radix Themes** as the component library — buttons, dialogs, cards, dropdowns
- **`@mysten/dapp-kit`** for wallet-connect, account display, transaction signing
- Top-bar ConnectButton, dark-theme default
- System-font + `size-adjust` (no custom typeface loaded — fastest path)

---

## §4 — Component patterns that recur

- **Color-coded span chips** (LLM / retrieval / tool / function) — universal in trace viewers (Langfuse, LangSmith, Phoenix)
- **Frosted sticky header** (`rgba(255,255,255,0.9)`) — LangSmith, Langfuse
- **Code block in One Dark colorway** (`#282C34` bg, `#ABB2BF` text) — Zep
- **Single chromatic accent on monochrome bg** — Sui, Pieces, Walrus, Talus, **elizaOS**, **Theoriq** all do this
- **Pill or fully-rounded buttons** (Pieces 40px, Walrus 26px) vs **square** (mem0, Sui, Helicone, Talus, **elizaOS** 4px, **Theoriq** 0px) — pick a position, don't default to 6/8px Tailwind rounded-md
- **Multi-step neutral surfaces** (Langfuse 3-tier sand: `#EDEDE8` / `#CFCFC9` / `#F6F6F3`; Sui 5-tier navy)
- **Lavender callout panel** on monochrome page (mem0, Walrus, Zep) — single chromatic moment
- **Multi-chain chip strip** (Olas: Ethereum/Polygon/Base/Gnosis pills) — OneMem repurposes as multi-runtime chip strip
- **Tan/kraft-card section break** on full-black ground (elizaOS) — usable layout move for "anchored receipt" section
- **Hi-vis CTA over black** (MemWal lime, elizaOS orange, Theoriq yellow) — three different fluorescents, same architectural move
- **Radix Themes + dapp-kit** as the MystenLabs official Sui visual language (OnlyFins, likely other example apps)

---

## §5 — The 5 surfaces (ship inventory)

Five surfaces ship at v0.1. Each has its own quality bar; none is afterthought. Lifted from the trace+providers agent's spec; ports and stacks are decisions, not options.

| # | Surface | URL (target) | Stack | Build day | Visual reference |
|---|---|---|---|---|---|
| 1 | **Marketing landing** | `onemem.ai` | Next.js + Tailwind + shadcn, static-export | 22–24 | mem0.ai sectioning + MemWal cream bg |
| 2 | **Docs site** | `docs.onemem.ai` | **Mintlify** (zero design tax, matches mem0 + LangSmith + Phoenix) — or Fumadocs if we want self-host control | 22–24 | docs.mem0.ai (left nav 256px + card tiles + dark mode) |
| 3 | **CLI** | `pip install onemem-cli` + `npm i -g @onemem/cli` | Python (Typer/Click) + Node (Commander), shared gRPC/REST backend | 4 + 13 | docs.mem0.ai/platform/cli (verbatim command shape — see LEGACY §4) |
| 4 | **Local dashboard** | `localhost:4040` (avoids claude-mem 37777 collision) | Next.js export, runs via `onemem dashboard` CLI | 16–22 | OpenMemory `localhost:3000` (per-app provenance pane) |
| 5 | **Hosted dashboard** | `app.onemem.ai` | Same Next.js codebase as local, deployed to Vercel + Walrus Sites fallback at `onemem.wal.app` | 16–22 | claude-mem viewer + MemWal dashboard + OnlyFins (Radix + dapp-kit) |

**Codebase strategy:** Surfaces 4 and 5 are the same Next.js codebase with two builds — local mode skips Enoki/zkLogin and reads from local SQLite mirror; hosted mode uses Enoki zkLogin and reads from MemWal relayer. Surfaces 1 and 2 share design tokens but are separate apps (landing is content-marketing, docs is reference).

**Why `4040` for local port:** claude-mem uses `37777`. Picking `4040` (memorable, no common-tool conflict) keeps OneMem's local UI cohabitable with claude-mem on the same machine.

**Why Radix Themes + dapp-kit for the dashboards:** Matches MystenLabs's own reference-app pattern (OnlyFins CSS bundle confirms this). Cheapest path to "looks like Sui product surface" credibility. Ratch / Geist display only on landing — dashboards stay system-font (Radix `size-adjust` pattern) for speed.

---

## §6 — Concrete brand recommendations for OneMem

### 6.1 Color tokens (paste-ready)

```css
:root {
  /* surfaces — landing leans warm cream (MemWal/Walrus/Talus lineage), dashboard leans dark navy (Sui lineage) */
  --bg-cream:     #FAF8F5;   /* match MemWal exactly for ecosystem signal (per BRAND_AND_SURFACES_LEGACY §7 — committed) */
  --bg-cream-2:   #F0EDE8;   /* card surface on cream */
  --bg-dark:      #0A0F18;   /* page bg (slightly navy-tinted vs MemWal/elizaOS pure-black — Sui ecosystem signal) */
  --bg-dark-2:    #131A26;   /* panel bg dark */
  --bg-dark-3:    #1C2330;   /* card bg dark */
  --border:       #2A2A36;
  --border-subtle: #1A1A24;

  /* text */
  --fg-on-cream:  #181818;   /* body on cream */
  --fg-on-dark:   #EDEDF0;   /* body on dark */
  --fg-muted:     #8A8D9A;   /* secondary (MemWal value) */
  --fg-subtle:    #6A6A7C;

  /* signature accent — lavender mid-tone, owns the gap between MemWal lighter (#CAB1FF) and Olas deeper (#7E22CE) */
  --accent:        #B08FFF;
  --accent-hover:  #C4A8FF;
  --accent-soft:   rgba(176, 143, 255, 0.12);
  --accent-glow:   rgba(176, 143, 255, 0.35);

  /* secondary signature — chartreuse reserved EXCLUSIVELY for "Verify on-chain" affordances */
  --accent-2:      #D4FF5E;  /* richer than MemWal #E8FF75; differentiates while staying in same fluorescent family */

  /* ecosystem signal — Sui product blue used only for "anchor verified / view on Suiscan" affordances */
  --accent-sui:    #0090FF;  /* OnlyFins / dapp-kit value */

  /* status (GitHub-derived, accessible) */
  --status-success: #2EA043;
  --status-warning: #D4A017;
  --status-error:   #DA3633;
}
```

### 6.2 Brand rules (enforceable)

1. **`--accent` (lavender `#B08FFF`)** — primary buttons, active nav, chain-of-custody UI, MemoryNamespace badges. **DO NOT** use for verification states.
2. **`--accent-2` (chartreuse `#D4FF5E`)** — RESERVED for the **Verify on-chain** affordance. Every checkmark, every successful re-verification, every "all green" moment. This makes verification the visual signature of the product, the same way MemWal made lime a CTA color.
3. **`--accent-sui` (Sui blue `#0090FF`)** — RESERVED for "view on Suiscan / view on-chain object" links. Threads the ecosystem signal without diluting our own lavender ownership.
4. **No other chromatic accents.** No teal, no pink, no Tailwind purple-600. The corpus shows that strong brands commit to one or two accents and stop.
5. **Lavender-to-chartreuse animated gradient** on the Verify button hover — telegraphs the "verifiable" promise as a micro-moment.

### 6.3 Type stack

```css
/* paste into globals.css */
--font-display: 'Ratch', 'General Sans', 'Geist', system-ui, -apple-system, sans-serif;
--font-sans:    'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono:    'JetBrains Mono', 'Fira Code', ui-monospace, 'SF Mono', Menlo, monospace;
```

**Decision rules:**
- **Landing (`onemem.ai`)**: Ratch on H1 + section H2s IF Abu confirms the Ratch foundry license; else General Sans (free) as drop-in. Body Inter. Code JetBrains Mono.
- **Docs (`docs.onemem.ai`)**: Mintlify default with Inter override for body. Cream `#FAF8F5` bg theme override to stay on-brand.
- **Dashboards (local + hosted)**: System-font + Radix `size-adjust` pattern (OnlyFins-style) for speed. No custom typeface loaded. Inter as fallback. Fira Code for span detail / trace JSON rendering.

### 6.4 Geometry

- **Button radius**: 0px (square) on landing + dashboard primary CTAs. Matches mem0 + Sui + Helicone + Talus + Theoriq + elizaOS 4px-near-square cluster.
- **Card radius**: 12px (Radix default for `Card`). Soft enough to read as a surface, sharp enough not to feel SaaS-toy.
- **Span chips (trace viewer)**: 4px radius, color-coded by span kind (LLM blue / tool purple / retrieval green / anchor amber) — Phoenix + Langfuse + LangSmith convention.
- **Sidebar width** (docs + dashboard): **256px** — Phoenix uses 256, Langfuse 240, LangSmith 267, average settles around 256.

### 6.5 Docs framework recommendation

**Mintlify** — for v0.1 speed. Matches the dominant docs aesthetic in the corpus (mem0 + LangSmith + Phoenix all use it). Free for OSS. Cream theme override + Inter override + custom OneMem logo. Migrate to Fumadocs later only if Mintlify's hosted-only constraint becomes a problem.

### 6.6 Visual signature elements (cheap, ownable)

1. **Lavender-to-chartreuse animated gradient** on the Verify button hover — telegraphs the "verifiable" promise
2. **Live Merkle-chain visualization** as the hero animation (small SVG, ~50 KB, draws the hash chain in real-time as a user-intent is processed). Replaces the static SDK code block that mem0 + MemWal both use for their hero
3. **Per-runtime color tokens** on the trace tree (already specified in `../../TRACE_AND_PROVIDERS.md` §4.5: blue=llm, green=tool, purple=mcp, orange=subagent, gray=memory)
4. **Anchor receipt block** in CLI output — stylized 3-line block showing hash / tx-id / verify URL, terminal-truecolor-aware
5. **"Local · not anchored" badge** in local-dashboard top bar — so screen-recorded demos read clearly vs hosted

---

## §7 — Surface specs (condensed)

Full landing IA, docs IA, CLI command surface, and local-dashboard routes live in `../../BRAND_AND_SURFACES_LEGACY.md` §§3–5. Summary here:

### 7.1 `onemem.ai` (landing)
- 12-section IA mirroring mem0.ai (nav → hero → quickstart → social proof → 3 pillars → how-it-works → trace viewer demo → integrations grid → use cases → benchmarks → pricing → footer)
- Cream `#FAF8F5` bg, Ratch (or General Sans) H1, Inter body, square CTAs, lavender callout panel
- Hero swaps mem0's static code block for the live Merkle-chain SVG animation

### 7.2 `docs.onemem.ai`
- Mintlify default, 8-section top nav (Getting Started / Providers / Dashboard / CLI / Move + On-chain / API / Cookbooks / Changelog)
- 256px left nav, right TOC, cream theme override
- Card-tile feature grid on home (rounded-12, hover with `--accent`)

### 7.3 `app.onemem.ai` (hosted dashboard)
- Dark mode default (`--bg-dark` navy-tinted)
- Radix Themes + `@mysten/dapp-kit` for wallet-connect / zkLogin
- 256px left nav, span tree + detail pane layout
- Color-coded span chips + separate anchor-status chip group (✓ verified / ⏳ pending / ✗ failed)
- `/trace/[id]` is the headline route (tree + Gantt + Verify + Replay)

### 7.4 `localhost:4040` (local dashboard)
- Same Next.js codebase as hosted; build flag swaps auth (local: wallet-from-CLI / hosted: Enoki zkLogin)
- Local "Local · not anchored" badge in top bar
- SQLite mirror for fast reads (claude-mem pattern)

### 7.5 CLI (`onemem` command)
- Python + Node both ship at v0.1 (mirrors Mem0)
- Command surface mirrors `mem0` 1:1 for swap-cost-zero migration (add/search/list/get/update/delete/import/config/entity/event)
- ADDS: `onemem trace list/show/replay/verify/export/share`, `onemem namespace create/list/share/revoke`, `onemem dashboard`, `onemem login` (zkLogin), `onemem verify <tx-or-session>`
- Output modes: text (default) / json / table / quiet / agent (sanitized envelope for AI consumption)

---

## §8 — Things NOT to do

- **No multi-hue palettes.** Every product in the 18-product corpus uses one chromatic accent (sometimes two). OneMem picks lavender + chartreuse + Sui-blue-for-anchors and stops. No teal, no pink, no Tailwind purple-600 default.
- **No pure-white marketing bg.** mem0, Khoj, Helicone, Phoenix, Olas, Theoriq all blend together because of this. Cream `#FAF8F5` is the differentiator.
- **No serif body in the dashboard.** Khoj's serif works because of its personal-archive metaphor; observability needs sans.
- **No rounded-12 SaaS buttons.** The strongest brands go square (Sui, mem0, Helicone, Talus, Theoriq) or fully pill (Walrus 26px, Pieces 40px). Pick a position, don't default to Tailwind's 6/8px.
- **No copying lavender + light-blue paired fills** from LangSmith — would look derivative.
- **No copying the exact orange `#FF5800`** from elizaOS — they own that pigment in agent infra. Same for Theoriq yellow `#FFFD37` and Olas deep-violet `#7E22CE`.
- **No defaulting to pure-Inter + Tailwind purple-600 + rounded-md.** That's the "Olas trap" — looks like a Vercel starter template, not a serious infra product.
- **No GT America, no Roobert, no Neue Montreal, no TWK Lausanne**, no licensed face we can't ship. Ratch is the one exception — only if the foundry license is verified clean.
- **No "looks like every other Mintlify-default docs site"** — apply the cream theme override + Inter body + OneMem typography to make the docs feel adjacent-but-distinct.
- **No Google Analytics on any surface.** Plausible (OnlyFins's choice) is the ecosystem norm for privacy-aware infra.
- **No empty-shell-on-Walrus failure mode** for the `onemem.wal.app` mirror — when shipping to Walrus Sites, include a static fallback that renders without JS so partial Walrus outages don't break the demo (OnlyFins's `index-ENv837q1.js` 503 on capture day is the cautionary tale).

---

## §9 — Open captures still missing

The Playwright sweep is complete for the 18-product reference set. These remain as nice-to-have follow-ups:

- **Langfuse hosted demo trace UI** at `cloud.langfuse.com` — requires auth (throwaway account viable)
- **Phoenix live UI screenshots** beyond the marketing page — best source: their GitHub README + live demo if hosted
- **OnlyFins post-hydration capture** — re-run when the Walrus asset 503 clears, OR clone repo locally and capture the React app via `pnpm dev`. The dashboard/wallet-connect flows are the directly relevant patterns for `app.onemem.ai`
- **Theoriq inner pages** (`/docs`, `/blog`) — for agent-network topology diagram conventions, relevant to OneMem's `/trace/[id]` graph view
- **Olas inner pages** (`/whitepaper`, `/docs`) — for mechanism-design diagram conventions, relevant to MemoryNamespace capability-flow visuals
- **elizaOS inner pages** (`/docs`, `/plugin-registry`) — for plugin-grid layout patterns, relevant to OneMem's integrations grid

---

## §10 — Cross-references

- `../../BRAND_AND_SURFACES_LEGACY.md` — full surface spec with verbatim CLI command list and IA outlines; supersedes nothing in this file but contains paste-ready CLI surface
- `../../WEDGE_V2.md` — pillar 4 dashboard surface (this doc expands it to 5 surfaces)
- `../../TRACE_AND_PROVIDERS.md` — trace pillar design (§4 dashboard sketch + §4.5 per-runtime color tokens)
- `../../MEM0_DEEP_DIVE.md` — OpenMemory dashboard pattern (§3.2), the source for local-dashboard IA
- `../../DEEP_DIVE.md` — claude-mem viewer reference (port + read-only design)
- `./mem0/MEM0_DOCS_IA.md` — docs site IA reference, verbatim
- `./mem0/MEM0_DOCS_TECH.md` — Mintlify + Framer tech stack reference
- Per-product `VISUAL_DESIGN.md` files: `./zep/`, `./mem-ai/`, `./pieces/`, `./khoj/`, `./supermemory/`, `./letta/`, `./langsmith-langfuse/{LANGSMITH,LANGFUSE,PHOENIX,HELICONE}/`, `./other-memory-systems/{elizaos,theoriq,olas,onlyfins,talus}/`
- Sui-ecosystem `VISUAL_DESIGN.md` files: `../01-sui-ecosystem/visual/{sui,memwal,walrus}/`
