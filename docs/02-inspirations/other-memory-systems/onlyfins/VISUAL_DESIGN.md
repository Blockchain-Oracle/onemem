# OnlyFins (MystenLabs example app) — Visual Design

Captured 2026-05-23. Source-of-truth screenshot in `./screenshots/`. Live site partially failed (Walrus asset 503) but CSS bundle was successfully extracted.

## Primary screenshots

- `screenshots/01-landing-full.png` — https://onlyfins.wal.app live deploy (root div empty — JS bundle returned 503 from Walrus on capture day; screenshot shows the bare HTML shell with `dark-theme` class applied)

## Live-deploy status

- Repo: https://github.com/MystenLabs/onlyfins-example-app
- Live URL: **https://onlyfins.wal.app** — confirmed served (HTML loads, dark-theme class applied) but `/assets/index-ENv837q1.js` returned HTTP 503 on capture, so the React app did not hydrate. CSS bundle (`/assets/index-VkVqEY7f.css`, 701 KB) loaded successfully — extracted brand tokens from it.
- Repo README is sparse (no screenshots, no demo link, no design docs) — points only to https://docs.sui.io as reference.

## Brand colors (extracted from `/assets/index-VkVqEY7f.css`)

| Token | Hex | Source | Role |
|---|---|---|---|
| `bg.page` | `#000000` (19 occurrences) | most-frequent hex | Dark theme primary bg |
| `text.fg` | `#FFFFFF` (17) | most-frequent hex | Body text on dark |
| `accent.sui-blue` | `#0090FF` (4) | most frequent chromatic | **Sui brand blue** (CTA + active state) |
| `bg.dark-1` | `#21201C` (3) | Radix Themes dark-1 | Card surface dark |
| `bg.dark-2` | `#1C2024` (2) | Radix Themes | Panel bg |
| `text.dark-bg` | `#1A211E` / `#1D211C` | Radix gray-12 dark | Inverted body text |
| `accent.amber` | `#FFC53D` (3) | Radix amber-9 | Warning/highlight |
| `accent.amber-dim` | `#FFB300` (2) | Radix amber-10 | Hover amber |
| `accent.cyan` | `#00A2C7` (3) | Radix cyan-9 | Secondary accent |
| `accent.electric-blue` | `#0044FF` (3) | Radix indigo | Tertiary chromatic |
| `accent.yellow` | `#FFE629` (3) | Radix yellow-9 | Yellow chip |
| `accent.green` | `#46A758` / `#30A46C` (2 each) | Radix green-9/grass-9 | Success state |
| `accent.red` | `#FF0000` (3) | hard red | Error state |
| `accent.pink` | `#E93D82` (2) | Radix pink-9 | Tertiary chromatic |
| `accent.indigo` | `#3E63DD` / `#5B5BD6` (2 each) | Radix indigo/iris-9 | Link |
| `bg.light` | `#FDFDFC` (2) | Radix sand-1 | Light-mode bg |
| `bg.light-pure` | `#FFFCFD` (2) | Radix pink-1 | Light-mode pink wash |

**Color stack signal:** OnlyFins is built on **Radix Themes** (the entire palette ladder maps 1:1 to Radix's `sand`, `amber`, `cyan`, `indigo`, `grass`, `green`, `pink`, `iris` scales). The signature chromatic is `#0090FF` — the Sui brand blue — used as the active CTA color over Radix's neutral dark theme.

## Typography (extracted from CSS bundle)

20 `@font-face` declarations total. Primary stack:

- **Segoe UI (Custom)** with system-local fallback (`local("Segoe UI Semilight"), local("Segoe UI")`) — weights 300/400 with custom `size-adjust: 103%`, `descent-override: 35%`, `ascent-override: 105%` (this is a Radix Themes pattern for stable cross-OS rendering)
- **Open Sans (Custom)** — secondary
- **Consolas (Custom)** — code
- **Menlo** + system monospace fallbacks
- CSS vars: `--default-font-family`, `--heading-font-family`, `--code-font-family`, `--em-font-family`, `--quote-font-family` (Radix Themes token system)
- dapp-kit own typography: `var(--dapp-kit-typography-fontFamily)`

**No custom display face** — OnlyFins uses system fonts via Radix's adjustment pattern (no Inter, no Geist, no TWK Everett). This is the lightest possible typography setup.

## Component patterns observed

- **Radix Themes** as the entire component layer — buttons, dialogs, cards, dropdowns all inherit Radix structure
- **dapp-kit** (`@mysten/dapp-kit`) for wallet-connect, account display, transaction signing — provides its own typography token (`--dapp-kit-typography-fontFamily`)
- Dark-theme default (HTML class `dark-theme` + inline `style="color-scheme: dark"`)
- Plausible analytics embedded (privacy-friendly choice)
- Vite build (Vite splash favicon, Vite asset hashing in filenames)

## Layout signature

Cannot capture without working JS bundle. From repo structure and Radix conventions:
- Top-bar wallet-connect (dapp-kit ConnectButton)
- Card-based content surfaces (Radix `Card`)
- Modal/Dialog patterns (Radix `Dialog`)

## What this teaches OneMem

- **MystenLabs ships their reference apps on Radix Themes + dapp-kit** — not custom design systems. This is the official-Sui visual language. If OneMem wants ecosystem-native credibility, building on Radix Themes is the cheapest path to "looks like Sui".
- The signature color is **`#0090FF`** — slightly different from the marketing-site Sui blue (`#298DFF` on sui.io). Sui's product surfaces use a brighter, more saturated blue than the marketing brand blue.
- Plausible (not Google Analytics) signals a privacy-aware ecosystem norm — OneMem should match.
- System-font + Radix's `size-adjust` hack avoids loading any custom typeface — fastest possible setup, but also undifferentiated. For OneMem's landing we want custom display (Geist or Ratch); for our `app.` dashboard we can mirror OnlyFins's Radix + system-font choice for speed.

## What we'd borrow

- **Radix Themes** as the dashboard component library (matches MystenLabs official pattern, ships fast)
- **`@mysten/dapp-kit`** for wallet-connect + transaction signing (zero design work, official Sui SDK)
- Sui-blue `#0090FF` reserved as our "anchor verified" status color — the chromatic moment that says "this is a real Sui object you can click through to Suiscan"
- Plausible analytics
- System-font + `size-adjust` pattern for the local dashboard (`localhost:4040`) where load speed > brand polish

## What we'd avoid

- Defaulting the entire brand to Radix's full color palette — too many chromatic options (Radix exposes 20+ scales); the BRAND_AND_SURFACES spec says one accent + one secondary, period
- Pure system-font on the marketing landing — too generic to differentiate
- The empty-shell-on-Walrus failure mode — when shipping to Walrus Sites mirror, we need a static fallback that renders without JS so partial Walrus outages don't break the demo

## Open captures for follow-up

- A working capture of the OnlyFins dashboard UI (post-JS-hydration) — re-run when the Walrus asset 503 clears, OR run repo locally (`pnpm install && pnpm dev`) to capture the React app
- Inner routes (the actual "fin" creation flow, profile pages, sponsored-tx flow) — these show the wallet-connect UX patterns directly relevant to OneMem's `app.` zkLogin flow
