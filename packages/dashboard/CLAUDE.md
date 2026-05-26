# `@onemem/dashboard` — Coding Agent Context

Next.js 15 standalone dashboard. Same code serves BOTH local (`localhost:4040`) and hosted (`app.onemem.ai`). Routes split per `purpose-local-vs-hosted.md`: this package owns the SHARED routes; `apps/hosted-dashboard/` owns the hosted-only ones (`/login`, `/cli-login`, `/onboarding`, `/verify/[session_id]`).

## Read before editing
- `docs/05-our-architecture/06-dashboard/purpose-local-vs-hosted.md` (READ FIRST — authoritative purpose split)
- `docs/05-our-architecture/06-dashboard/ui-architecture.md` (routes, state mgmt, SSE, data fetching)
- `docs/05-our-architecture/06-dashboard/design-system.md` (brand token application)
- `docs/05-our-architecture/06-dashboard/route-<name>.md` (per-route specs)
- `docs/02-inspirations/claude-mem/HOOKS_AND_VIEWER_REFERENCE.md` (SSE pattern reference)

## Non-negotiables
- **App Router only.** No pages/ directory. Next.js 15 conventions.
- **Brand tokens come from `@onemem/brand`** (workspace dep). Don't hardcode lavender/chartreuse/cream/sui-blue hex values; import from `@onemem/brand/tokens.css`.
- **Chartreuse `#D4FF5E` is reserved for Verify affordances ONLY.** Sui blue `#0090FF` is reserved for Suiscan links ONLY. Per `BRAND_AND_SURFACES.md`.
- **Decrypt CLIENT-side via Seal `/manual`.** Server never sees plaintext.
- **SSE pattern lifted from claude-mem viewer.** Don't invent a new transport.
- **TDD per `superpowers:test-driven-development`.** Vitest unit + integration. Visual regression via `sahil-visual-loop` + Playwright (see `sahil-anti-slop-audit` before merge).

## Build
- `next build` produces `.next/standalone` (per `next.config.mjs` `output: 'standalone'`). The `bin/onemem-dashboard` script launches that bundle for local mode.

## Headline view
- `/trace/[session_id]` is THE demo moment. The Verify drawer turning the page chartreuse "Verified ✓" is the trust narrative. Don't ship without it polished.
