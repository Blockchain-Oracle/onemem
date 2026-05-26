# elizaOS — Visual Design

Captured 2026-05-23 from https://elizaos.ai. Source-of-truth screenshot in `./screenshots/`. Computed-style data via Playwright `getComputedStyle()`.

## Primary screenshots

- `screenshots/01-landing-full.png` — https://elizaos.ai full landing (page title: "Home | Eliza")

## Brand colors

| Token | Hex | Role |
|---|---|---|
| `bg.page` | `#000000` | Primary body bg (full dark) |
| `text.fg` | `#FFFFFF` | Body text on dark |
| `text.dark` | `#000000` | Text on light surfaces |
| `text.muted-dark` | `#333333` | Secondary muted on light |
| `text.muted` | `#666666` | Tertiary muted |
| `accent.orange` | `#FF5800` | Signature accent (Start Building button text, brand color) |
| `accent.blue` | `#0B35F1` | Secondary accent (electric blue, used in section blocks) |
| `bg.tan` | `#D7D5CA` | Warm light-gray section bg (paper-card surface) |

Primary CTA "Get Started": black bg, white text, 4px corner. Secondary CTA "Join Community": transparent bg, white text border, 4px corner. The orange `#FF5800` shows up specifically on the "Start Building" button as text color over a black background — a stark, ownable contrast moment.

## Typography

- Family: `NHaasFont` (custom Neue Haas Grotesk variant — licensed)
- H1: 72px, weight 700 — text: "Your Agentic Operating System"
- Body: 16px
- Single-family system (no separate display vs body)
- HTML fallback chain: `ui-sans-serif, system-ui, sans-serif`

NHaasFont is the modernized digital cut of Neue Haas Grotesk (Helvetica's ancestor) — used by serious-infra brands (Lyft, MIT Media Lab). Premium signal.

## Component patterns observed

- Full-black hero with white type
- Square-leaning buttons (4px radius) — not pure-square but close
- Single signature accent (`#FF5800` orange) used sparingly on one CTA
- Tan section card (`#D7D5CA`) as a mid-page break against the black ground — "kraft paper" / "manila folder" texture metaphor
- No gradients, no glassmorphism, no rounded-12 SaaS feel

## Layout signature

- Hero with 72px H1, dual CTA stacked
- Editorial pacing: dark hero → tan card section → dark continuation
- Restrained chrome (small nav, no hamburger flash)

## What this teaches OneMem

- **Full-black ground + one fluorescent accent** (`#FF5800`) is a viable third position vs cream-paper (MemWal/Walrus) and white-SaaS (mem0/Helicone). Confirms that ownership of *one* electric color beats palette diversity.
- elizaOS's classical-Greek statue aesthetic on social media is NOT carried into the marketing site — the site is a clean dark-infra brand. The statue reads on X but the dev surface stays serious.
- Orange `#FF5800` is too close to elizaOS's territory to copy — but the *pattern* (one fluorescent accent over pure black) is exactly what the BRAND_AND_SURFACES synthesis recommends with lavender + chartreuse.
- NHaasFont is licensed — free equivalent: `Inter`, `Geist`, or `Neue Haas Grotesk Display` (Adobe Fonts) for a similar serious-infra feel.

## What we'd borrow

- The "one fluorescent accent over black" hierarchy (steal the *pattern*, not the orange)
- The 4px button radius as middle ground between pure-square and rounded
- The tan-card section break — a warm neutral panel against dark ground is a usable layout move for OneMem's "anchored receipt" section

## What we'd avoid

- The orange itself — too associated with elizaOS / ai16z
- NHaasFont — licensed, use Inter or Geist
- The classical-statue brand metaphor — too specific to their ai16z lineage
