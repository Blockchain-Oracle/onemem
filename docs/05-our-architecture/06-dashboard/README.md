# Pillar 7 + 8 — Dashboard (OneMem)

> Current note, 2026-06-17: this is a historical design document. Current
> dashboard implementation truth lives in `packages/dashboard/`,
> `apps/hosted-dashboard/`, the package README, and the prototype discovery
> report under `.thoughts/`.

The OneMem dashboard. Same codebase serves the **local** install (`localhost:4040`, launched via `onemem dashboard`) and the **hosted** deploy (`app.onemem.ai`, Enoki-authenticated). Plus a **Walrus Sites mirror** for decentralized fallback.

This is the **headline visual surface** — judges + users see this first.

---

## Read order

| File | Purpose |
|---|---|
| `README.md` | This file — design principles + nav |
| **`purpose-local-vs-hosted.md`** | **READ FIRST.** Why local + hosted both exist; what each is for; what each is NOT for; the route inventory per deploy. Owns the philosophical "why each exists" question. |
| `ui-architecture.md` | Routes, components, state mgmt, data fetching (Next.js 15 per audit fix; updated from earlier "Vite" mistake) |
| `design-system.md` | Tokens + components from `BRAND_AND_SURFACES.md` applied |
| `data-flow.md` | How dashboard reads from Sui + Walrus + MemWal + SSE |
| `route-root.md` | `/` overview screen |
| `route-memories.md` | `/memories` list + filter + per-app provenance |
| `route-apps.md` | `/apps` connected runtimes monitor + pause/permissions |
| `route-trace.md` | `/trace/[session_id]` — **headline view** (tree + Gantt + Verify drawer + Replay modal) |
| `route-sessions.md` | `/sessions/[session_id]` multi-trace replay |
| `route-share.md` | `/share` owner capability mint and `/share/[capability_id]` recipient object view |
| `route-settings.md` | `/settings` delegate keys + providers + runtimes |
| `route-verify-public.md` | **NEW v0.1 addition** — `/verify/[session_id]` public chain-integrity verifier; no login; hosted-only route (defined per `purpose-local-vs-hosted.md`) |
| `local-deploy.md` | `localhost:4040` specifics (Next.js standalone via `onemem dashboard` CLI command) |
| `hosted-deploy.md` | `app.onemem.ai` + Enoki/zkLogin + sponsored-tx |
| `walrus-sites-mirror.md` | Decentralized fallback via Walrus Sites |

---

## Design principles

1. **Same codebase, three deployments.** Local + Hosted + Walrus Sites — one Next.js app, three deploy modes.
2. **Brand applied per `BRAND_AND_SURFACES.md`.** Cream surface (`#FAF8F5`), lavender primary (`#B08FFF`), chartreuse Verify-only (`#D4FF5E`), Sui blue Suiscan-only (`#0090FF`). Type stack: Ratch / General Sans (display) + Inter (body) + JetBrains Mono (code).
3. **Stack: Next.js 15 (App Router, standalone output) + Tailwind + shadcn/ui + Radix Themes + `@mysten/dapp-kit-react`.** Mirrors MystenLabs's official Sui visual language (confirmed from OnlyFins CSS parse per `BRAND_AND_SURFACES.md`). Rationale for Next.js 15 vs Vite is in `../00-overview/TOOLING_DECISIONS.md`.
4. **SSE for live updates.** Pattern lifted from claude-mem viewer (per `HOOKS_AND_VIEWER_REFERENCE.md`). Event types: `connected | initial_load | new_action_call | new_trace_session | new_attestation | processing_status`.
5. **Headline route is `/trace/[session_id]`.** Everything else exists to support that view. The Verify drawer (chartreuse turns the page "Verified ✓") is THE demo moment.
6. **Coverage tier badges.** Per-runtime card shows "full coverage" (Claude Code / OpenClaw / Hermes) or "partial coverage" (Cursor / Codex MCP / etc) — honest about what we capture.
7. **Mobile-responsive, but desktop-first.** Most users are on laptops 1280-1440; design there. Mobile is functional, not optimized.
8. **Apache-2.0 license.**

---

## What the dashboard does NOT do

- Render or store memory content unencrypted on the server side (everything decrypts client-side via Seal `/manual`)
- Replace `app.onemem.ai`'s account-management surface with a different one (same codebase, same UX)
- Compete with the MemWal credentials dashboard at `memwal.ai` (we're orthogonal — they manage keys, we render content + traces)

---

## Implementation status

| Component | Status |
|---|---|
| Next.js scaffold + Tailwind + Radix Themes setup | Built in `packages/dashboard`; shadcn remains a design/component convention, not a generated dependency. |
| dApp Kit / Enoki provider wiring | Built in `apps/hosted-dashboard` for hosted account surfaces; local dashboard remains credential-file oriented. |
| SSE wiring | Built as `packages/dashboard/app/api/stream/route.ts`; live event breadth continues to evolve per route docs. |
| `/` route | Built in `packages/dashboard/app/page.tsx`. |
| `/memories` route | Built with provenance drawer and origin verification. |
| `/apps` route | Built with runtime status and pause/trace controls. |
| `/trace/[session_id]` route (headline) | Built with trace tree, content/decrypt tab, verify drawer, and replay modal. |
| `/sessions` route | Built with grouped sessions, verify-all, replay, and export. |
| `/share` route | Built locally for CLI-guided sharing and hosted for sponsored capability minting plus event-backed history. |
| `/share/[capability_id]` recipient view | Built as read-only capability object inspection; no claim transaction in v0.1. |
| `/settings` route | Built with credential and delegate lifecycle status. |
| `/login` route (hosted only) | Built with Enoki/dApp Kit account state and missing-config honesty. |
| `/cli-login` route (hosted only) | Built for CLI pairing, delegate key generation, callback validation flow, and missing-config honesty. |
| `/onboarding` route (hosted only) | Built for sponsored namespace/RW-cap provisioning. |
| `/verify/[session_id]` route (hosted only, PUBLIC) | Built as public chain verifier with Proven / Not proven boundary panels. |
| Local deploy (`localhost:4040`) | Built as `@onemem/dashboard` with `build`, `start`, `dev`, and `browser:smoke` scripts. |
| Hosted app shell | Built as `@onemem/hosted-dashboard` with hosted-only routes, API guardrails, production build, and browser smoke coverage. |
| Hosted production deployment (`app.onemem.ai`) | External deploy step; current repo proves the app build/smoke, not live DNS deployment. |
| Walrus Sites mirror | ⏳ pending deploy evidence. |

---

## Cross-references

- `../02-sdks/shared-api-surface.md` — SDK API the dashboard consumes
- `../01-protocol/events-and-attestation.md` — events the dashboard subscribes to
- `../../02-inspirations/BRAND_AND_SURFACES.md` — canonical brand
- `../../02-inspirations/claude-mem/HOOKS_AND_VIEWER_REFERENCE.md` — claude-mem viewer REST + SSE pattern
- `../../02-inspirations/langsmith-langfuse/TRACE_VIEWERS_COMPARISON.md` — `/trace/[id]` UX patterns
- `../../02-inspirations/mem0/README.md` — OpenMemory dashboard pattern (per-app provenance, etc)
