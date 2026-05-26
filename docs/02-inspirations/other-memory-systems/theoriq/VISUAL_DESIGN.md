# Theoriq — Visual Design

Captured 2026-05-23 from https://www.theoriq.ai. Source-of-truth screenshot in `./screenshots/`. Computed-style data via Playwright `getComputedStyle()`.

## Primary screenshots

- `screenshots/01-landing-full.png` — https://www.theoriq.ai full landing (page title: "Advancing the Agentic Economy")

## Brand colors

| Token | Hex | Role |
|---|---|---|
| `bg.page` | `#FFFFFF` / `#F4F4F4` | Primary light body bg |
| `bg.dark` | `#000000` / `#080808` / `#121315` | Inverted dark sections |
| `text.dark` | `#080808` | Body text on light |
| `text.light` | `#F4F4F4` | Body text on dark |
| `text.muted` | `rgba(8,8,8,0.5)` / `rgba(244,244,244,0.5)` | Secondary muted |
| `accent.yellow` | `#FFFD37` | Signature CTA accent (every primary button) |
| `accent.gold` | `#D4A843` | Secondary tier accent (highlights) |
| `accent.pink` | `#FFDEDE` | Tertiary highlight |
| `bg.divider` | `#DDDDDD` | Hairline borders |

The hi-vis yellow `#FFFD37` is **the** brand signature — it appears on every primary CTA: "Launch App", "AlphaStudio", "accept" cookie button. Black text on yellow, square corners (`border-radius: 0`). The contrast is the most ownable thing on the page.

## Typography

- Display family: `Test Founders Grotesk` (Test Foundry — premium licensed)
- H1: 64px, weight 600 — text: "Asset Management Evolved With AI"
- H2: 32px, weight 500 — examples: "Launch Theoriq Apps", "Follow us on X (Twitter)"
- Body: 14px (small body — pairs with large display for editorial feel)
- Secondary family: `Inter Variablefont Slnt Wght` (used for H1/H2 — Inter variable cut)
- Two-font system: Founders Grotesk (UI/button) + Inter Variable (display headlines)

## Component patterns observed

- Light-on-white + inverted dark sections (alternating rhythm, similar to Sui/Walrus)
- **All-square buttons** (`border-radius: 0`) — strict commitment to the geometric language
- Hi-vis yellow CTA on every primary action — single chromatic moment per section
- Dense top nav with multiple product entry points (AlphaStudio, Stake THQ, Launch App)
- Cookie consent banner styled as a brand element (yellow accept button — not generic UI)

## Layout signature

- White marketing landing with dark inverted product sections
- Editorial small-body (14px) under oversized 64px display (Letta-style ratio)
- Network/topology diagrams expected on inner pages (Theoriq publishes agent-graph visuals heavily in their docs and X content)
- Multiple product CTAs in nav (AlphaStudio + Stake + Launch) — suggests a portfolio-of-products IA rather than single-product

## What this teaches OneMem

- Yellow `#FFFD37` is a third candidate for a hi-vis brand accent (alongside MemWal lime `#E8FF75` and elizaOS orange `#FF5800`). All three sit in the same "fluorescent single-accent" pattern.
- Founders Grotesk pair with Inter Variable confirms a usable pattern: licensed display face + free Inter for body. We can substitute General Sans + Inter for free equivalents.
- Strict `border-radius: 0` commitment reads "infrastructure / serious / Web3" — distinguishes from rounded-12 SaaS default.
- The multi-product nav (AlphaStudio / Stake / Launch App) suggests Theoriq is positioning as a *platform* of products rather than one tool — OneMem should be careful not to overload the nav with sub-products at v0.1.

## What we'd borrow

- Square-corner button commitment (matches BRAND_AND_SURFACES recommendation)
- Hi-vis yellow on dark contrast as a CTA signature pattern (replace yellow with our lavender + chartreuse split)
- The editorial 64px-display / 14px-body ratio (currently Letta uses similar; consider it a confirmed pattern)
- Founders Grotesk as a reference voice — substitute General Sans (free) for production

## What we'd avoid

- Yellow `#FFFD37` itself — Theoriq owns this color in the agentic-economy space
- Test Founders Grotesk — paid, no need when General Sans / Geist are free
- The "multiple product silos in nav" pattern — at v0.1 OneMem ships one product

## Notes for trace-graph UI

Theoriq publishes detailed agent-network topology diagrams (referenced in their X content and docs). Worth re-visiting their `/docs` and `/blog` pages on a follow-up pass specifically for graph-rendering visual conventions (node sizing, edge weighting, layout algorithm choices) when we design OneMem's `/trace/[id]` graph view.
