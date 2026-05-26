# Mem0 Docs — Tech Stack

Captured 2026-05-23. All findings anchored to either a `browser_evaluate()` result, a `curl -I` header, or a screenshot in `screenshots/`. Where a thing is not determinable from the client, this file says so explicitly.

## TL;DR

`docs.mem0.ai` is a **Mintlify** site deployed on **Vercel**, fronted by **Cloudflare** (CDN + analytics beacon). Search and the AI chat assistant are both **Mintlify first-party** features — no Algolia DocSearch, no Kapa.ai, no Inkeep. Support widget is **Intercom**. Product analytics is **PostHog** behind a custom reverse-proxy domain (`mango.mem0.ai`).

## Evidence

### Docs framework — Mintlify

| Signal | Value |
|---|---|
| `<meta name="generator">` | `Mintlify` |
| Asset path prefix | `/mintlify-assets/_next/...` |
| Response header `x-mint-proxy-version` | `1.0.0-prod` |
| Response header `x-mintlify-client-version` | `0.0.2934` |
| Response header `x-matched-path` | `/_sites/[subdomain]/[[...slug]]` (Mintlify multi-tenant proxy route) |
| Footer credit | "Powered by Mintlify" link (`https://www.mintlify.com?utm_campaign=poweredBy&utm_medium=referral&utm_source=mem0`) |
| OG image URL | `https://mem0.mintlify.app/mintlify-assets/_next/image?...` |
| Favicon path | `/mintlify-assets/_mintlify/favicons/mem0/...` |
| `<meta name="msapplication-TileColor">` | `#8F74E0` (Mintlify reads `theme.primary` from config) |

Mintlify under the hood is a Next.js app (`mintlify-assets/_next/static/chunks/...`, `webpack-d8379f63b0c7c029.js`). The fact that the chunk filenames are static across pages (e.g., `main-app-70bb4e4e2c9a74cc.js`) and tied to a deployment hash (`dpl_9fLWiEk9CzCkzHWampdPAxEGr1he`) confirms Mintlify is a managed multi-tenant SaaS, not a self-hosted fork.

### Hosting — Vercel + Cloudflare

From `curl -sI https://docs.mem0.ai/introduction`:

```
server: cloudflare
cf-ray: a0055f825dd4eba6-CDG
cf-cache-status: DYNAMIC
x-vercel-cache: BYPASS
x-vercel-id: cdg1:iad1::iad1::4fnvl-1779553070460-b65cd19050e4
x-vercel-project-id: prj_NdMUpHpUIb41Po1H8c6hrChv2bgr
x-served-version: dpl_9fLWiEk9CzCkzHWampdPAxEGr1he
```

`docs.mem0.ai` resolves to Cloudflare first (`server: cloudflare`, `cf-ray`), then origins to Vercel (`x-vercel-id`, `x-vercel-project-id`). The Vercel project ID belongs to Mintlify — every Mintlify customer's docs are served from the same Vercel project, routed by subdomain via `x-matched-path: /_sites/[subdomain]/[[...slug]]`. So Mem0 doesn't manage the Vercel project; Mintlify does. This is how Mintlify's CDN model works.

Cloudflare Insights beacon is loaded: `https://static.cloudflareinsights.com/beacon.min.js/v833ccba57c9e4d2798f2e76cebdd09a11778172276447` — likely automatic if the domain proxies through Cloudflare.

### Search — Mintlify built-in

Evidence: with the search modal open, `window.docsearch`, `window.algoliasearch`, `window.Kapa`, `window.Inkeep` are all `false`. No `algolia.net`, `kapa.ai`, or `inkeep.com` script tags or XHRs. The search input itself is rendered inside Mintlify's bundle — `<input class="peer rounded-xl border outline-none border-gray-200 dark:border-white/10 bg-background-light dark:bg-background-dark h-full w-full ... text-gray-950 dark:text-white placeholder:text-...">` with `placeholder="Search..."`. The result modal is a Headless UI `dialog` (`id="headlessui-dialog-_r_0_" role="dialog" aria-modal="true"`).

Search results URL pattern: `?search=memory` is appended to the current URL as state (verified by navigating to `https://docs.mem0.ai/platform/overview` and observing the URL become `https://docs.mem0.ai/platform/overview?search=memory` after typing).

Result shape (from `screenshots/25-search-modal-query-memory.png` + accessibility snapshot at `.playwright-mcp/mem0-assistant-snapshot-full.md`):

- Modal: 640px max-width, centered, backdrop = `bg-background-dark/20 backdrop-blur-sm`
- Each result row shows: product breadcrumb (Mem0 Platform → Platform Features → Essential Features → Memory Filters), bold page title with `<mark>` highlighting on the matched terms, paragraph excerpt with `<mark>` on matches, and for API endpoints, an HTTP method badge inline (e.g., `POST`)
- Below results: "Ask AI assistant" CTA + 3 prefilled suggestion buttons (e.g., "Can you tell me about memory?")
- `ESC` keyboard hint pill on the right

### AI chat assistant — Mintlify built-in

Triggered by clicking the "Ask AI" button in the top bar (`button[aria-label="Toggle assistant panel"]`). When opened, `document.documentElement` gets `data-assistant-state="open"` and CSS variable `--assistant-sheet-width: 368px` is set — the page content shifts left to accommodate a 368px right-side sheet.

Sheet contents (from accessibility snapshot lines 409–438):

- Header: "Assistant" label with two icon buttons (likely close + new chat)
- Disclaimer: "Responses are generated using AI and may contain mistakes."
- "Suggestions" heading + 3 starter prompt buttons:
  - "Can I use Mem0 with any AI client?"
  - "What makes Mem0 production-ready?"
  - "How do I get started with Mem0?"
- Input: `<textbox placeholder="Ask a question...">`
- Two action buttons (likely attach + send; send is disabled until input has text)
- Footer: "Contact support" link → `mailto:support@mem0.ai`

No third-party assistant script (Kapa / Inkeep). Mintlify ships this as a first-party RAG product. Backend model + retrieval pipeline are **not determinable from the client**.

### Analytics — PostHog (reverse-proxied)

Scripts loaded:

```
https://mango.mem0.ai/static/surveys.js?v=1.302.2
https://mango.mem0.ai/array/phc_hgJkUVJFYtmaJqrvf6CYN67TIQ8yhXAkWzUn9AMU4yX/config.js
https://mango.mem0.ai/static/exception-autocapture.js?v=1.302.2
https://mango.mem0.ai/static/web-vitals.js?v=1.302.2
https://mango.mem0.ai/static/dead-clicks-autocapture.js?v=1.302.2
https://mango.mem0.ai/static/posthog-recorder.js?v=1.302.2
```

`mango.mem0.ai` is a reverse proxy for `app.posthog.com` (standard PostHog cloud pattern to evade ad-blockers and keep first-party cookies). Project key `phc_hgJkUVJFYtmaJqrvf6CYN67TIQ8yhXAkWzUn9AMU4yX`. PostHog modules enabled: surveys, exception autocapture, web vitals, dead-click autocapture, session recording.

Mem0 set this up themselves — Mintlify provides hooks to add analytics, but the reverse-proxy domain and project key are Mem0-controlled.

### Support widget — Intercom

```html
<script>https://widget.intercom.io/widget/jjv2r0tt</script>
```

App ID `jjv2r0tt`. Bottom-right floating button labeled "Open Intercom Messenger". Rendered as an `<iframe title="Intercom">`.

### Cookie banner / consent

None detected on initial load. No GDPR/CCPA consent prompt; no `cookieyes`, `osano`, `onetrust`, etc. scripts.

### Fonts

Self-hosted by Mintlify (Next.js font optimization):

```
/mintlify-assets/_next/static/media/bb3ef058b751a6ad-s.p.woff2  (preloaded)
/mintlify-assets/_next/static/media/c4b700dcb2187787-s.p.woff2  (preloaded)
/mintlify-assets/_next/static/media/e4af272ccee01ff0-s.p.woff2  (preloaded)
```

Three preloaded WOFF2 files. CSS variables expose:

- `--font-inter: "Inter","Inter Fallback",-apple-system,BlinkMacSystemFont,Segoe UI,system-ui,sans-serif`
- `--font-jetbrains-mono: "JetBrains Mono","JetBrains Mono Fallback",SF Mono,SFMono-Regular,Menlo,...`
- `--font-family-headings-custom: 'TWK Lausanne', sans-serif` (declared but **not actually applied** — H1 computes to Inter; either the woff for TWK Lausanne is not bundled or the rule loses specificity)
- `--font-family-body-custom: 'Inter', sans-serif`

So in practice: **Inter for body + headings, JetBrains Mono for code**.

### Robots / LLM-friendly index

The HTML `<link>` header advertises two LLM-targeted indexes:

```
link: </llms.txt>; rel="llms-txt", </llms-full.txt>; rel="llms-full-txt"
```

And the response carries `x-llms-txt: /llms.txt`. `/llms.txt` is 496 lines covering install instructions, route discovery, scope tags (`[Platform]` / `[OSS]` / `[Both]`), per-section page indexes, and code samples for both Python and TypeScript. `/llms-full.txt` (not fetched here) is the full-content version. This is a Mintlify-provided feature, configured by the Mem0 docs team via the `llms.txt` config in `docs.json`/`mint.json`.

### CSS architecture

Three CSS bundles preloaded (Tailwind-compiled):

```
/mintlify-assets/_next/static/css/9e8832c8599d2dba.css
/mintlify-assets/_next/static/css/1accfb39600dfcdc.css
/mintlify-assets/_next/static/css/05d6d8fcb903870d.css
```

Class names on real elements show full Tailwind utility usage: `flex flex-col mx-auto max-w-[640px] transform overflow-hidden border border-gray-200 dark:border-white/10 ...`. Mintlify exposes design tokens via CSS variables (`--primary`, `--gray-50` through `--gray-950`, `--background-light`, `--background-dark`, etc.) — see `MEM0_DOCS_DESIGN.md` for the full token map.

### CSP

```
content-security-policy: worker-src * blob: data: 'unsafe-eval' 'unsafe-inline';
  object-src data: ;
  base-uri 'self';
  upgrade-insecure-requests;
  frame-ancestors 'self' https://dashboard.mintlify.com https://app.mintlify.com;
  form-action 'self' https://codesandbox.io;
```

Frame ancestors restricted to self + Mintlify dashboard (for live-preview editing). Forms can post to codesandbox.io (likely for embedded sandboxes).

## What's NOT used

- No Algolia / DocSearch
- No Kapa.ai or Inkeep AI assistant
- No Docusaurus, Nextra, Fern, Fumadocs, Starlight, Vercel `nextra/`, GitBook, ReadMe, Bump.sh, Stoplight, Redocly
- No cookie consent banner
- No Segment / Mixpanel / Amplitude / GTM
- No HubSpot / Marketo / Drift / Crisp
- No status-page embed (no Statuspage / BetterStack / Instatus widget)

## Putting it together

The Mem0 docs stack:

```
docs.mem0.ai
  ├── DNS  →  Cloudflare (proxied)
  ├── Cloudflare CDN  →  Vercel (Mintlify's project)
  ├── Mintlify (Next.js multi-tenant SaaS)
  │     ├── Pages  →  MDX in github.com/mem0ai/mem0/tree/main/docs
  │     ├── Search  →  Mintlify first-party
  │     ├── "Ask AI"  →  Mintlify first-party RAG assistant
  │     ├── llms.txt + llms-full.txt  →  auto-generated by Mintlify
  │     └── Theme  →  custom primary #8F74E0, Inter + JetBrains Mono
  ├── Intercom widget  →  app jjv2r0tt (sales/support chat)
  ├── PostHog  →  reverse-proxied via mango.mem0.ai
  └── Cloudflare Web Analytics  →  beacon.min.js
```

The whole content surface is MDX in Mem0's GitHub repo (proven by the "Suggest edits" link pointing to `https://github.com/mem0ai/mem0/edit/main/docs/<slug>.mdx`). Mintlify pulls from the repo via webhook, builds, deploys to its shared Vercel project, and proxies via Cloudflare.

## Implication for `docs.onemem.ai`

If we want this exact shape — managed-CDN docs with first-party AI chat, instant Vercel deploys, GitHub-as-source, `llms.txt` for free — **Mintlify is the off-the-shelf answer**. Pricing is a separate question (Mintlify Pro is currently the tier required for custom domain + analytics + Ask AI). Self-hosted alternatives with the closest shape: **Fumadocs** (Next.js, MDX, has search out of the box, no first-party AI chat), or **Docusaurus + DocSearch + Kapa.ai** (more assembly required). Recommendation in `MEM0_DOCS_DESIGN.md`.
