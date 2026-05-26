# Letta — Visual Design

Captured 2026-05-23. Source-of-truth screenshots in `./screenshots/`.

## Primary screenshots

- `screenshots/01-landing-full.png` — https://www.letta.com full landing

## Brand colors

- Body bg: `#C9CDD1` (cool gray — distinctive, neither white nor dark)
- Body text: `#202020`
- Inverse text (on dark blocks): `#C9CDD1`
- Dark surface: `#111111`
- Secondary gray: `#B8BCC0`
- Light alpha overlays: `rgba(201,205,209,0.15)`

## Typography

- Family: `Roobert` (custom geometric sans, refined)
- H1: 40px, weight 400 (modest size)
- H2: 42px
- Body: 28px (very large for body — reads like a manifesto)
- Code: `Fira Code` (monospace)

## Component patterns observed

- Cool gray bg as the dominant surface (`#C9CDD1`) — extremely unusual, distinctive
- Inverted dark section blocks
- Large body text (28px) — feels editorial, slow, considered
- Roobert is the same font family used by OpenAI, Whoop, Linear — high-end signal

## Layout signature

- Hero with restrained headline size + oversized body text
- Cool-gray-on-cool-gray with dark blocks for emphasis
- Code samples use Fira Code with no card chrome

## UX moments worth borrowing

1. **Cool gray bg `#C9CDD1`** as the dominant surface — third option vs cream and white. Reads "industrial / serious / memory-as-state".
2. **Roobert font** — premium signal but free for non-commercial via Displaay.
3. **Large body text (28px)** — editorial pacing, reduces visual density.
4. **Fira Code in code blocks** — ligature-friendly, free, dev-favored.

## What this teaches OneMem

- Three viable bg surface options across this corpus: cream (`#FAF8F5`), light-blue tint (`#F5F9FF`), cool gray (`#C9CDD1`). All beat pure white for differentiation.
- Letta's cool gray reads as "system memory" / "RAM" — a thematic match for a memory-layer tool, worth considering for our dashboard.
- Roobert is licensed but Geist / Inter Tight are credible free substitutes.
- Fira Code is the right pick for our trace JSON / span detail rendering.
