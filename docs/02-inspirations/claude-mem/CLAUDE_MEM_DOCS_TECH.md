# Claude-Mem Docs — Tech Stack

Captured 2026-05-26. All findings anchored to either a `browser_evaluate()` result, a `curl -sI` header, or a screenshot in `screenshots/`. Where a thing is not determinable from the client, this file says so explicitly.

## TL;DR

`docs.claude-mem.ai` is a **Mintlify** site deployed on **Vercel** (same shared multi-tenant project as Mem0), fronted by **Cloudflare**. Search is **Mintlify first-party**. The "Ask AI" assistant slot is **wired but disabled** (slot exists in the DOM with `data-assistant-state="closed"` but no trigger button is rendered). **No analytics beyond Cloudflare Web Analytics.** No support widget. No cookie banner. The stack is meaningfully leaner than Mem0's (no PostHog, no Intercom, no Ask AI).

## Evidence

### Docs framework — Mintlify

| Signal | Value |
|---|---|
| `<meta name="generator">` | `Mintlify` |
| Asset path prefix | `/mintlify-assets/_next/...` |
| Response header `x-mint-proxy-version` | `1.0.0-prod` |
| Response header `x-mintlify-client-version` | `0.0.2952` (one minor ahead of Mem0's `0.0.2934`) |
| Response header `x-matched-path` | `/_sites/[subdomain]/[[...slug]]` (Mintlify multi-tenant proxy route) |
| Footer credit | "Powered by Mintlify" link (`https://www.mintlify.com?utm_campaign=poweredBy&utm_medium=referral&utm_source=claude-memai`) |
| OG image URL | `https://claude-memai.mintlify.app/mintlify-assets/_next/image?...` (tenant subdomain = `claude-memai`) |
| Favicon path | `/mintlify-assets/_mintlify/favicons/claude-memai/7NIUS2Cb5fgWKXUq/...` |
| `<meta name="msapplication-TileColor">` | `#3B82F6` (Mintlify reads `theme.primary` from config) |

Identical Next.js chunk naming convention as Mem0 (e.g., `main-app-70bb4e4e2c9a74cc.js` — same hash, same Mintlify deploy) and tied to the deployment hash `dpl_7eY2vpwLn5idSLafgsqkBRi3W2XH`. Confirms Mintlify managed multi-tenant SaaS.

### Hosting — Vercel + Cloudflare (same Mintlify Vercel project as Mem0)

From `curl -sI https://docs.claude-mem.ai/introduction`:

```
server: Vercel
cf-cache-status: HIT
cf-ray: a01b3cb10a6293a7-LIS
x-vercel-cache: BYPASS
x-vercel-id: cpt1:iad1::iad1::d79zw-1779782330944-a76e27935b4d
x-vercel-project-id: prj_NdMUpHpUIb41Po1H8c6hrChv2bgr   ← identical to Mem0
x-served-version: dpl_7eY2vpwLn5idSLafgsqkBRi3W2XH
strict-transport-security: max-age=63072000
x-frame-options: DENY
x-mint-proxy-version: 1.0.0-prod
```

The `x-vercel-project-id` value `prj_NdMUpHpUIb41Po1H8c6hrChv2bgr` is the same Mintlify-owned Vercel project that serves `docs.mem0.ai`. Multi-tenant routing happens at the Mintlify proxy via `x-matched-path: /_sites/[subdomain]/[[...slug]]`. Confirmation that two unrelated docs sites (claude-mem + mem0) share the same Mintlify infrastructure.

CDN front: `cf-ray: a01b3cb10a6293a7-LIS` (Lisbon edge for this fetch). `cf-cache-status: HIT` means the docs HTML is cached at Cloudflare edge (Mem0 was `DYNAMIC` — slight config difference).

Cloudflare Insights beacon: `https://static.cloudflareinsights.com/beacon.min.js/v833ccba57c9e4d2798f2e76cebdd09a11778172276447` — same beacon URL as Mem0, confirms standard CF proxied DNS.

### Search — Mintlify built-in (same as Mem0)

The search input inside the modal is `<input class="peer rounded-xl border outline-none border-gray-200 dark:border-white/10 bg-background-light dark:..." type="text" placeholder="Search...">` — identical class signature to Mem0's. Typing into it appends `?search=hook` to the URL (verified via navigation from `/architecture/overview` → `/architecture/overview?search=hook` in `screenshots/24-search-modal-query-hook-light.png`).

Result shape (verified by `dlg.querySelectorAll('a')` returning 6 results for query "hook"):

- Each result row: breadcrumb chain (e.g., "Architecture › Hooks architecture"), bold page title, multi-line excerpt with the matched term highlighted, anchor link to the H2/H3 (e.g., `/hooks-architecture#hooks-architecture`)
- Modal is a Headless UI dialog (`role="dialog"`)
- Cmd+K or click on the search pill in header opens it
- ESC dismisses

No third-party search (no `window.docsearch`, no `window.algoliasearch`, no `window.Kapa`, no `window.Inkeep`). Identical to Mem0.

### AI chat assistant — slot wired but DISABLED

This is the headline divergence from Mem0. The Mintlify assistant infrastructure is loaded — `document.documentElement.getAttribute('data-assistant-state')` returns `"closed"` and `--assistant-sheet-width: 0px` is set on `:root`. But **no "Ask AI" button is rendered in the header**. The header contains only:

```
[Open search] [Toggle dark mode]   ← desktop visible buttons
[More actions] ← overflow (mobile)
```

So the Mintlify Ask AI feature is either (a) on a plan that doesn't include it, (b) explicitly disabled in `docs.json`, or (c) the team is opted out. Either way, end users have search but no chat. Result: a meaningfully simpler help surface than Mem0's 368px right-side chat sheet.

### Analytics — Cloudflare Web Analytics only

Loaded scripts (6 total, all from Mintlify chunks + one Cloudflare beacon):

```
/mintlify-assets/_next/static/chunks/87c73c54-09e1ba5c70e60a51.js
/mintlify-assets/_next/static/chunks/90018-cea9e261a146e428.js
/mintlify-assets/_next/static/chunks/main-app-70bb4e4e2c9a74cc.js
/mintlify-assets/_next/static/chunks/polyfills-42372ed130431b0a.js
/mintlify-assets/_next/static/chunks/webpack-02116bd3760593f9.js
https://static.cloudflareinsights.com/beacon.min.js/v833...
```

Confirmed absent (verified by `typeof window.X` checks): PostHog, Intercom, GTM (`dataLayer`), Segment, Mixpanel, Amplitude, Crisp, Drift, HubSpot, Algolia, Kapa, Inkeep.

So claude-mem ships **zero product analytics + zero support widget + zero AI chat**. The only telemetry is Cloudflare's first-party beacon (page views, web vitals). This is meaningfully leaner than Mem0 (which runs PostHog reverse-proxied via `mango.mem0.ai` + Intercom widget + first-party Ask AI).

### Cookie banner / consent

None detected. No GDPR/CCPA prompt; no `cookieyes`, `osano`, `onetrust`, `cookiebot` scripts. Identical to Mem0.

### Fonts

Self-hosted by Mintlify (Next.js font optimization). Three preloaded WOFF2 files — same three filenames as Mem0:

```
/mintlify-assets/_next/static/media/bb3ef058b751a6ad-s.p.woff2  (preloaded)
/mintlify-assets/_next/static/media/c4b700dcb2187787-s.p.woff2  (preloaded)
/mintlify-assets/_next/static/media/e4af272ccee01ff0-s.p.woff2  (preloaded)
```

CSS variables exposed at runtime (verified via `getPropertyValue` on `documentElement`):

- `--font-inter: "Inter","Inter Fallback",-apple-system,BlinkMacSystemFont,Segoe UI,system-ui,sans-serif`
- `--font-jetbrains-mono: "JetBrains Mono","JetBrains Mono Fallback","SF Mono",SFMono-Regular,Menlo,Monaco,Cascadia Mono,Segoe UI Mono,Roboto Mono,Oxygen Mono,Ubuntu Monospace,Source Code Pro,Fira Mono,Droid Sans Mono,Consolas,Courier New,monospace`
- `--font-family-headings-custom: ""` (empty — claude-mem does NOT declare a custom heading font; Mem0 declares phantom `'TWK Lausanne'`)
- `--font-family-body-custom: ""` (empty)

So in practice: **Inter for body + headings, JetBrains Mono for code** — same stack as Mem0 BUT cleaner because claude-mem doesn't carry the phantom TWK Lausanne declaration that never resolves.

### KaTeX

`<link rel="stylesheet" href="https://d4tuoctqmanu0.cloudfront.net/katex.min.css">` is preloaded. So at least one page renders LaTeX math. Not visible in the captured screenshot set (architecture/search-architecture and architecture/database don't show inline math), but the asset is bundled. This is a Mintlify-default loaded-on-demand asset (Mem0 docs also bundle it implicitly when `$math$` syntax appears in MDX).

### Theme tokens (CSS variables on `:root`)

Resolved via `getComputedStyle(documentElement).getPropertyValue(...)`. All values are space-separated RGB triplets (Tailwind v4 / `<r> <g> <b>` convention so Mintlify can compose `rgb(var(--primary) / <alpha>)`):

| Variable | Value | Hex equivalent |
|---|---|---|
| `--primary` | `59 130 246` | **`#3B82F6`** (Tailwind blue-500) |
| `--primary-light` | `239 246 255` | `#EFF6FF` (blue-50) |
| `--primary-dark` | `30 64 175` | `#1E40AF` (blue-700) |
| `--background-light` | `255 255 255` | `#FFFFFF` |
| `--background-dark` | `14 14 16` | `#0E0E10` (slightly bluer than Mem0's `#0A0A0A`) |
| `--gray-50` | `244 246 250` | `#F4F6FA` (slightly cooler than Mem0's `#FAFAFA`) |
| `--gray-100` | `239 241 245` | `#EFF1F5` |
| `--gray-200` | `224 226 230` | `#E0E2E6` |
| `--gray-300` | `207 209 213` | `#CFD1D5` |
| `--gray-400` | `160 162 166` | `#A0A2A6` |
| `--gray-500` | `113 115 119` | `#717377` |
| `--gray-600` | `81 83 87` | `#515357` |
| `--gray-700` | `64 66 70` | `#404246` |
| `--gray-800` | `39 41 44` | `#27292C` |
| `--gray-900` | `24 26 30` | `#181A1E` |
| `--gray-950` | `11 14 17` | `#0B0E11` |

Cross-check from the OG image URL parameter string (`og:image` meta tag — Mintlify generates it server-side with the actual theme tokens):

```
primaryColor=#3B82F6     ← matches --primary
lightColor=#EFF6FF       ← matches --primary-light
darkColor=#1E40AF        ← matches --primary-dark
backgroundLight=#ffffff  ← matches --background-light
backgroundDark=#0e0e10   ← matches --background-dark
```

So the canonical theme config in claude-mem's `docs.json` is:

```json
{
  "colors": {
    "primary": "#3B82F6",
    "light":   "#EFF6FF",
    "dark":    "#1E40AF"
  }
}
```

This is the **vanilla Tailwind blue-500 family** — no custom hue at all. Mem0 ships a custom lavender `#8F74E0`; claude-mem ships an unmodified Mintlify-default blue. Maximum-vanilla configuration.

### Robots / LLM-friendly index

`link` header advertises:

```
link: </llms.txt>; rel="llms-txt", </llms-full.txt>; rel="llms-full-txt"
```

And `x-llms-txt: /llms.txt` response header is set.

`/llms.txt` is **48 lines** total (vs Mem0's 496). The structure is:

- Site title + 1-line description (`# Claude-Mem`, `> Persistent memory compression system that preserves context across Claude Code sessions`)
- `## Docs` section: 37 bullet links, one per page, each with `[Title](url.md): description`
- `## OpenAPI Specs` section: 1 entry pointing at `/api-reference/openapi.json`

So claude-mem maintains an `openapi.json` (Mintlify auto-detects and renders it as an API ref section), but **no actual `/api-reference/*` page is in the sidebar** — confirmed by the 38-item sidebar walk. The OpenAPI is exposed for LLM consumption only, not as a UI surface. This is a deliberate (or accidental) anti-pattern vs Mem0 which has 35 rendered API ref pages.

### CSS architecture

Three CSS bundles preloaded:

```
/mintlify-assets/_next/static/css/9e8832c8599d2dba.css   ← same hash as Mem0 (shared Mintlify base)
/mintlify-assets/_next/static/css/319c93c746aa105b.css   ← differs from Mem0
/mintlify-assets/_next/static/css/05d6d8fcb903870d.css   ← same hash as Mem0 (shared Mintlify base)
```

Two of the three CSS chunks are byte-identical to Mem0's. The middle bundle (`319c93c746aa105b.css` vs Mem0's `1accfb39600dfcdc.css`) is tenant-specific (encodes the per-customer theme override CSS — the `--primary: 59 130 246` value lives here for claude-mem; `--primary: 143 116 224` lives in the equivalent file for Mem0).

### CSP

Identical to Mem0:

```
content-security-policy:
  worker-src * blob: data: 'unsafe-eval' 'unsafe-inline';
  object-src data: ;
  base-uri 'self';
  upgrade-insecure-requests;
  frame-ancestors 'self' https://dashboard.mintlify.com https://app.mintlify.com;
  form-action 'self' https://codesandbox.io;
```

Same frame-ancestors allowlist for the Mintlify live-preview dashboard. Same form-action allowance for codesandbox.io (embedded sandboxes).

### Footer attribution + license

Footer text (verified via `document.querySelector('footer').textContent`):

```
Claude-Mem home page
github
Resources
  Documentation     → https://github.com/thedotmack/claude-mem
  Issues            → https://github.com/thedotmack/claude-mem/issues
Legal
  License (Apache-2.0)  → https://github.com/thedotmack/claude-mem/blob/main/LICENSE
github
Powered by  Mintlify
```

**License is Apache-2.0** (the parent `README.md` in this folder claims AGPL-3.0 — that is incorrect or out-of-date). Verified by the literal footer link text "License (Apache-2.0)" pointing at `https://github.com/thedotmack/claude-mem/blob/main/LICENSE`. This is meaningful for OneMem because Apache-2.0 is permissive — we can freely read claude-mem's storage, fork shapes, or borrow code without copyleft contamination.

## What's NOT used

- No Algolia / DocSearch
- No Kapa.ai or Inkeep AI assistant
- No Docusaurus, Nextra, Fern, Fumadocs, Starlight, GitBook, ReadMe, Bump.sh, Stoplight, Redocly
- No cookie consent banner
- No Segment / Mixpanel / Amplitude / GTM
- No HubSpot / Marketo / Drift / Crisp / Intercom
- No PostHog (Mem0 has it; claude-mem does not)
- No Mintlify Ask AI assistant (slot exists but disabled; Mem0 has it active)
- No status-page embed (no Statuspage / BetterStack / Instatus widget)
- No Twitter / OG embed widgets

## Putting it together

The claude-mem docs stack:

```
docs.claude-mem.ai
  ├── DNS  →  Cloudflare (proxied)
  ├── Cloudflare CDN  →  Vercel (Mintlify's shared project prj_NdMUpHpUIb41Po1H8c6hrChv2bgr)
  ├── Mintlify (Next.js multi-tenant SaaS, x-mintlify-client-version 0.0.2952)
  │     ├── Pages  →  MDX in github.com/thedotmack/claude-mem (38 indexed pages)
  │     ├── Search  →  Mintlify first-party
  │     ├── "Ask AI"  →  Mintlify slot WIRED but DISABLED (no trigger button rendered)
  │     ├── llms.txt + llms-full.txt  →  auto-generated (48 lines)
  │     ├── openapi.json  →  hosted at /api-reference/openapi.json but NOT rendered in sidebar
  │     └── Theme  →  primary #3B82F6 (vanilla Tailwind blue-500), Inter + JetBrains Mono
  └── Cloudflare Web Analytics  →  beacon.min.js (only telemetry)
```

The whole content surface is MDX in the team's GitHub repo (proven by both the footer link and the standard Mintlify webhook pattern). No "Suggest edits" link is exposed on individual doc pages — verified by the absence of `Was this page helpful?`, `Suggest edits`, `Raise issue` elements in the DOM scan.

## Implication for `docs.onemem.ai`

claude-mem demonstrates that **Mintlify can be configured almost-vanilla** with zero brand-color customization, zero analytics, zero AI chat, and the resulting docs site still works. This is the "Mintlify minimum-viable" reference:

- Single sidebar group (38 pages, no nesting)
- One brand color = an unmodified Tailwind palette swatch (`blue-500`)
- No top-nav pills, no integrations grid, no cookbooks section
- No "Suggest edits" link, no "Was this helpful?" feedback row
- No Ask AI assistant, no Intercom, no PostHog
- Footer = GitHub link + Apache-2.0 license + Mintlify badge

For OneMem v0.1 this is a more realistic baseline than Mem0. We can ship a Mintlify install with our brand purple + a 25-page sidebar + the standard 3-column layout and have a credible docs site in a day. Cost trade: the Mintlify Pro features Mem0 uses (Ask AI, custom subdomain in some plans) aren't strictly required.

Recommendation captured in `CLAUDE_MEM_DOCS_DESIGN.md` §7.
