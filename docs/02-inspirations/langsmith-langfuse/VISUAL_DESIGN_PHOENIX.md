# Arize Phoenix — Visual Design

Captured 2026-05-23. Source-of-truth screenshots in `./phoenix/screenshots/`.

## Primary screenshots

- `phoenix/screenshots/01-docs-landing.png` — https://arize.com/docs/phoenix

NOTE: Phoenix is open source — the live UI screenshots are best viewed in their GitHub README at github.com/Arize-ai/phoenix. The hosted demo is part of arize.com platform (requires login). Public docs captured.

## Brand colors

- Body bg: white (transparent body, parent white)
- Body text: `#000000` (pure black)
- Headline color: `#161A1C`
- Primary blue: `#0384C3` (Arize blue — distinctive cyan-blue)
- Section bg: `#FFFFFF`, `rgba(242,246,248,0.5)`, `#EEF2F3`
- Sticky overlay: `rgba(255,255,255,0.9)`

## Typography

- Family: `Roboto` throughout (sidebar, body, headlines)
- H1: 30px
- Sidebar: 256px wide

## Component patterns observed

- 256px sidebar (close to LangSmith's 267px — standard docs IA)
- Cyan-blue `#0384C3` as the only chromatic accent (close to but lighter than Sui blue)
- Roboto everywhere (Google Fonts, free, neutral)
- Very white, very clean — least visually distinctive in this corpus

## Layout signature

- Standard docs 3-column
- Tabbed sections common
- Heavy use of callout boxes (visible in screenshot)

## What Phoenix's actual trace UI looks like (from their public README/screenshots)

- **Span tree with timing bars** on the left — Gantt-like waterfall
- **Span detail** on the right with Input/Output/Attributes/Events tabs
- **Latency histograms** and **token cost rollups** at the top
- **Project list** as the entry point — switch between projects, each has its own trace stream
- Color coding: blue (LLM), green (retrieval), purple (tool), gray (other)

## What this teaches OneMem

- Phoenix is the most "generic Google Material" of the corpus — functional, forgettable.
- The Gantt-style waterfall (span timing as horizontal bars) is the strongest UX pattern they have — adopt it; it makes timing legible at a glance.
- Project-as-entry-point is the right top-level IA for OneMem (each agent / app = a project, trace stream below).
- Their span color coding (LLM/retrieval/tool/other) is a useful starting set — we add anchor-status colors as a parallel dimension.
