I now have comprehensive reality across all four targets. Compiling the brief.

## Scope

Reference UX/docs reality for a later OneMem docs + UI rebuild, covering four targets:
1. Mem0 docs site (`https://docs.mem0.ai`) — navigation/taxonomy + Mintlify confirmation.
2. Mem0 OSS UI screens — `server/dashboard` (self-hosted dashboard) and `openmemory/ui`.
3. OneMem's current docs app (`onemem/apps/docs`) — Mintlify? + section structure.
4. claude-mem viewer screens (`src/ui/viewer`) — card/layout reference (brief).

Reality only: this documents what currently exists; no recommendations.

## Sources Checked

- `https://docs.mem0.ai/introduction` (live, via WebFetch).
- `/tmp/mem0-study/docs/docs.json` (full read), `/tmp/mem0-study/docs/` dir listing.
- `/tmp/mem0-study/server/dashboard/` dir tree; `src/app/(root)/dashboard/layout.tsx`, `.../components/main-nav.tsx`, `.../components/nav-wrapper.tsx`; `package.json`.
- `/tmp/mem0-study/openmemory/ui/` dir tree; `app/page.tsx`, `app/` route listing, `components/Navbar.tsx`, `components/dashboard/Stats.tsx`, `components/dashboard/Install.tsx`, `skeleton/` listing.
- `/Users/abu/dev/hackathon/sui-overflow/onemem/apps/docs/` — full dir, `docs.json`, `README.md`, all 9 `.mdx` content files (introduction, quickstart, concepts/{memory,trace,verify}, integrations/{runtimes,providers}, reference/{cli,sdk}).
- `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/dashboard/app/` route listing (to ground docs claims about dashboard routes).
- `/tmp/claude-mem-study/src/ui/viewer/` — `App.tsx`, `Feed.tsx`, `ObservationCard.tsx`, `SummaryCard.tsx`, `Header.tsx`, components listing.

## Verified Facts

### (1) Mem0 docs site — Mintlify + taxonomy

- **Mintlify, confirmed two ways.** `docs.json` line 1–2: `"$schema": "https://mintlify.com/docs.json"` (`/tmp/mem0-study/docs/docs.json:2`). Live site WebFetch reports CDN refs to `mintcdn.com` and `https://docs.mem0.ai/llms.txt`. The `docs/` folder is a canonical Mintlify project: `docs.json`, `_snippets/`, `images/`, `logo/`, `favicon.svg`, `openapi.json`, `llms.txt`, `*.mdx` (`/tmp/mem0-study/docs/` listing).
- **Theme `aspen`**, primary color `#8F74E0` (purple); light/dark backgrounds `#fff` / `#09090b` (`docs.json:5-10,582-587`).
- **Top-level navigation = one anchor "Documentation" containing tabs** (`docs.json:17-579`). The tabs (left-to-right):
  1. **Welcome** (group: Start Here → `introduction`).
  2. **Mem0 Platform** — groups: Getting Started, Core Concepts, Platform Features (with nested subgroups: Essential / Advanced / Data Management / Integration Features), Support & Troubleshooting, Migration Guide, Contribute.
  3. **OpenClaw** — group: Agent Harness (openclaw, hermes, pi-agent).
  4. **Open Source** — groups: Getting Started, Self-Hosting Features, Configuration (nested: LLMs / Vector Databases / Embedding Models / Rerankers, each with a "Supported …" sublist), Migration, Community & Support.
  5. **Cookbooks** — groups: Getting Started, Essentials, Companion Playbooks, Ops & Automations, Integrations & Platforms, Frameworks & Multimodal.
  6. **Integrations** — groups: Overview, Agent Frameworks, Voice & Real-time, Cloud & Infrastructure, Developer Tools.
  7. **Agent Plugins** — groups: Coding Agents (claude-code, cursor, codex, opencode, antigravity), Agent Harness.
  8. **API Reference** — groups: Getting Started, Core Memory Operations, Memory APIs, Events APIs, Entities APIs, Organizations APIs, Project APIs, Webhook APIs.
  9. **Release Notes** — group: Release Notes (highlights, sdk, platform, openclaw).
- Groups carry **icons** (e.g. `home`, `rocket`, `brain`, `star`, `server`, `sliders`, `plug`) (`docs.json:21,39,53,...`).
- **navbar primary** is a button "Your Dashboard" → `https://app.mem0.ai` (`docs.json:588-594`). Footer socials: discord, x, github, linkedin (`docs.json:595-602`).
- **Integrations**: PostHog analytics + Intercom (`docs.json:603-611`). **Contextual menu** options: copy / chatgpt / claude / perplexity / "Try in Playground" (`docs.json:612-625`). ~260 redirect rules at the tail (`docs.json:626-1151`).
- Live WebFetch surfaced a slightly different top-level naming on the rendered homepage ("Mem0 Platform", "Mem0 Open Source", "Cookbooks", "Integrations", "API Reference", plus a "Sign up as an agent" CTA). The `docs.json` config is the authoritative tab list above; the homepage card grid is a curated subset.

### (2a) Mem0 OSS — `server/dashboard` (self-hosted dashboard)

- Next.js App Router, Tailwind, shadcn/ui (`components.json` present), Redux (`@/store/store`), themed with a custom **`mem*` design-token system** (e.g. `bg-surface-default-primary`, `border-memBorder-primary`, `text-memGold-600`, `font-fustat`) — tokens defined in `tailwind.config.ts` (11.9 KB). Fonts: Fustat, DM Mono, Roboto Mono, Inter (`public/fonts/`).
- Package name `mem0-dashboard` (`package.json:2`).
- **Route groups** (`src/app/`): `(auth)/login`, `setup`, `(root)/dashboard/*`, `api/{auth,health}`.
- **Dashboard screens** (`src/app/(root)/dashboard/*/page.tsx`): `analytics`, `api-keys`, `categories`, `configuration`, `entities`, `export`, `memories`, `requests`, `settings`, `webhooks` (10 pages).
- **Left sidebar nav** (`main-nav.tsx`) is grouped into three labeled sections:
  - **ACTIVITY**: Requests (`Activity` icon), Memories (`GalleryVerticalEnd`), Entities (`Users`).
  - **CLOUD FEATURES** (collapsible, each item badged **PRO**): Categories (`Tags`), Webhooks (`Webhook`), Analytics (`ChartLine`), Export (`FolderInput`).
  - **ACCOUNT**: API Keys (`KeyRound`), Configuration (`Wrench`), Settings (`Settings`).
- Layout shell: fixed collapsible left sidebar (`nav-wrapper.tsx` + `main-nav.tsx`) with collapse toggle, org/instance label (`NEXT_PUBLIC_INSTANCE_NAME || "Mem0"`), user dropdown (logout/settings/help, `Building2`); main content area is a rounded-corner bordered panel with `ScrollArea` (`layout.tsx`, `nav-wrapper.tsx:1-60`).
- Self-hosted gating components exist: `self-hosted/{empty-state,upgrade-banner,locked-page}.tsx`; shared `data-table.tsx`, `event-badge.tsx`, `table-skeleton.tsx`. Empty-state art in `public/images/` (`no-memories.svg`, `no-requests.svg`, dark variants).

### (2b) Mem0 OSS — `openmemory/ui` (OpenMemory dashboard)

- Next.js App Router, Tailwind, shadcn/ui (`components.json`), Redux (`store/`), `next-themes`. Distinct, simpler app from `server/dashboard`; dark zinc palette (`bg-zinc-950/900/800`).
- **Top nav (not sidebar)** — `components/Navbar.tsx`: brand "OpenMemory" + four links: **Dashboard** (`/`, Home icon), **Memories** (`/memories`, RectangleStack), **Apps** (`/apps`, Apps icon), **Settings** (`/settings`, Settings icon), plus a Refresh button and a `CreateMemoryDialog` ("+") action.
- **Routes/screens** (`app/`): `/` (Dashboard home), `/memories`, `/memory/[id]` (detail), `/apps`, `/apps/[appId]` (detail), `/settings` (`app/` listing).
- **Dashboard home composition** (`app/page.tsx`): 3-col grid — `Install` (2 cols) + `Stats` (1 col) on top, then `MemoryFilters` + `MemoriesSection` below; fade-slide-down entrance animations.
  - **`Install`** card: tabbed install snippets with a copyable command per client. Tabs: **MCP Link**, Claude, Cursor, Cline, Roo Cline, Windsurf, Witsy, Enconvo, Augment — each with brand icon + brand-colored active gradient. Command pattern: `npx @openmemory/install local <URL>/mcp/<tab>/sse/<user> --client <tab>` (`Install.tsx:9-55`).
  - **`Stats`** card: "Memories Stats" → Total Memories count + "Total Apps Connected" with overlapping app avatar stack + total apps count (`Stats.tsx`).
- **Memory feature components** (`app/memories/components/`): `CreateMemoryDialog`, `MemoryTable`, `FilterComponent`, `MemoryFilters`, `MemoryPagination`, `PageSizeSelector`, `MemoriesSection`.
- **Memory detail** (`app/memory/[id]/components/`): `MemoryDetails`, `MemoryActions`, `AccessLog`, `RelatedMemories`.
- **Apps screens** (`app/apps/components/` + `app/apps/[appId]/components/`): `AppCard`, `AppGrid`, `AppFilters`, `AppDetailCard`, `MemoryCard`.
- Loading states: dedicated `skeleton/` dir (AppCardSkeleton, AppDetailCardSkeleton, AppFiltersSkeleton, MemoryCardSkeleton, MemorySkeleton, MemoryTableSkeleton).
- Shared: `shared/{source-app,update-memory,categories}.tsx`; full shadcn `components/ui/*` set (~55 primitives).

### (3) OneMem `apps/docs` — Mintlify + structure

- **Mintlify, confirmed.** `docs.json:2` = `"$schema": "https://mintlify.com/docs.json"`. Theme **`mint`** (not Mem0's `aspen`). Name "OneMem". Colors: primary `#4F46E5` (indigo), light `#16A34A` (green), dark `#0EA5E9` (cyan) (`docs.json:3-9`). SEO canonical `https://docs.onemem.xyz` (`docs.json:10-14`). Footer social: github only (`docs.json:41-45`).
- **Navigation = one tab "Documentation", four groups** (`docs.json:16-39`), no anchors, no icons (unlike Mem0):
  - **Get Started**: `introduction`, `quickstart`.
  - **Concepts**: `concepts/memory`, `concepts/trace`, `concepts/verify`.
  - **Integrations**: `integrations/runtimes`, `integrations/providers`.
  - **Reference**: `reference/cli`, `reference/sdk`.
- **9 content `.mdx` files total.** Content is concrete and product-specific (verbatim from files):
  - `introduction.mdx`: positions OneMem as "decentralized persistent memory for AI agents" on Sui · Walrus · Seal · MemWal; uses `<CardGroup>` (3-col "Why it matters", 2-col "Next steps"), `<Card icon=...>`.
  - `quickstart.mdx`: 4 steps (Install CLI `@onemem/cli`, `onemem init`, instrument runtime via `<CodeGroup>` with Claude Code / Hermes / Vercel AI SDK / OpenAI Agents tabs, `onemem verify`). Contains dated `<Note>` publication/verification stamps (e.g. "Publication note, 2026-06-19 … `@onemem/cli@0.6.3` … prints `0.6.3`").
  - `concepts/{memory,trace,verify}.mdx`: code blocks (`ts`/`bash`/`text` ASCII chain diagram), `<Note>`, `<Card>`/`<CardGroup>` (verify uses a 2-col "Proven"/"Not proven" grid).
  - `integrations/runtimes.mdx`: Claude Code, Codex, OpenClaw, Hermes — each with install snippet; embeds live testnet proof tx digests + dated registry `<Note>`s.
  - `integrations/providers.mdx`: Vercel AI SDK, OpenAI Agents (TS `<CodeGroup>`), CrewAI/LiveKit/ElevenLabs (Python `<CodeGroup>`); dated registry `<Note>`.
  - `reference/cli.mdx`: install commands + a markdown **command table** (`onemem verify / trace / health / dashboard / login / init / namespace */ add / search`) + examples; dated publication `<Note>`.
  - `reference/sdk.mdx`: `@onemem/sdk-ts` — create client, traces, memory, namespaces, standalone verification, runtime helpers; `<Note>`.
- **Deployment reality** (`README.md`): docs are live at `docs.onemem.xyz`, served as a **Mintlify static export deployed to Vercel** (`onemem-docs` project, deployment `dpl_F4iKnanzYDEq968cbtq1Z3hHNwLb`), *not* a native Mintlify dashboard deployment. Local dev: `npx mintlify dev`; publish: `npx mintlify@latest export` → deploy static dir to Vercel. `/`, `/quickstart`, `/reference/cli`, `/integrations/runtimes` return HTTP 200 (per README; not re-verified live in this pass).
- **Docs/dashboard route naming discrepancy (verified):** docs repeatedly reference a public web verify page at `app.onemem.xyz/verify/<session-id>` (`introduction.mdx:45`, `quickstart.mdx:86`, `concepts/verify.mdx`). The actual dashboard package (`packages/dashboard/app/`) has routes `page.tsx` (`/`), `settings`, `sessions`, `apps`, `memories`, `share`, `trace/[session_id]`, `vendor-logo/[file]`, and `api/*` — there is **no `/verify` route**; the public-share route present is `/share`. The docs' `/trace/[id]` reference (`concepts/trace.mdx`) matches the real `trace/[session_id]` route.

### (4) claude-mem viewer (`src/ui/viewer`) — card/layout reference

- Single-page React app (not Mintlify, not Next.js); `App.tsx` + `index.tsx`, plain CSS classes (`.card`, `.feed`, CSS variables like `var(--color-type-badge-bg)`), real-time via SSE (`useSSE`).
- **Layout = `Header` + single vertical `Feed`** of cards + floating buttons + modals (`App.tsx:101-157`).
- **`Header`** (`Header.tsx`): logomark (spins while processing) + "claude-mem" wordmark; right side = icon links (Docs `docs.claude-mem.ai`, X, Discord), `GitHubStarsButton`, an **"All Projects" filter `<select>`**, `ThemeToggle`, help button, settings button. A `queue-bubble` badge overlays the logo when `queueDepth > 0`.
- **`Feed`** (`Feed.tsx`): merges three item types (observations, summaries, prompts), sorts by `created_at_epoch` desc, renders one card per item via `IntersectionObserver` infinite scroll ("Loading more…" / "No more items to load"); `ScrollToTop`; empty state "No items to display".
- **Card types:**
  - **`ObservationCard`** (`ObservationCard.tsx`): header row of badges (type, platform source, project, optional "merged →" badge) + top-right toggle buttons ("facts" / "narrative", mutually exclusive); title; subtitle OR a `facts` `<ul>` OR a `narrative` block; meta footer with `#id • date`, concept chips, and `read:`/`modified:` file lists (file paths stripped to project-relative).
  - **`SummaryCard`** (`SummaryCard.tsx`): `<article>` with badge row (Session Summary / source / project), request title, then up to four labeled sections with icons — **Investigated / Learned / Completed / Next Steps** (only non-empty render), staggered animation; footer `Session #id • date`.
  - **`PromptCard`** (present, not read in detail).
- Other components: `WelcomeCard` (dismissible onboarding, localStorage), `ContextSettingsModal`, `LogsModal`/`LogsDrawer` (console toggle), `TerminalPreview`, `ErrorBoundary`, `ThemeToggle`, `ScrollToTop`, `GitHubStarsButton`.

## Inferences

- The two Mem0 OSS UIs are different products with different design languages: `server/dashboard` is the polished managed-style self-hosted dashboard (custom `mem*` token system, PRO gating, sidebar layout); `openmemory/ui` is the simpler OpenMemory MCP-memory app (zinc shadcn defaults, top-nav layout). Inferred from divergent palettes, nav patterns, and component sets — not from a doc stating the relationship.
- OneMem's docs `docs.json` mirrors the *Mintlify mechanism* of Mem0's docs but is a far smaller, flatter IA (1 tab / 4 groups / 9 pages vs. Mem0's 9 tabs / dozens of groups / hundreds of pages). Inference of intent only insofar as both use the same tool.
- The `app.onemem.xyz/verify/...` vs. `/share` route mismatch *appears* to be a docs-vs-implementation drift, but I did not confirm whether the hosted app rewrites `/verify` → `/share` or whether a redirect/alias exists; flagged as a fact about the repo, inference about user impact.

## Unknowns And Questions

- Live `docs.onemem.xyz` was not fetched in this pass (README asserts 200s); not independently verified here.
- The actual *rendered* appearance (screenshots) of any of these sites/dashboards was not captured — this brief is from config + source only. Mem0's live left-sidebar group ordering on the rendered site was not visually confirmed beyond `docs.json`.
- `openmemory/ui/app/settings/page.tsx` and `apps/[appId]` content were listed but not read in detail (screen composition beyond route existence is unconfirmed).
- Whether OneMem's hosted app actually serves a working `/verify/<session-id>` page (vs. only `/share`) is unresolved — needs a live check or a look at `packages/dashboard/app/share/page.tsx` + any rewrites in `next.config`/Vercel config.
- claude-mem `PromptCard.tsx` and the exact CSS theme tokens (`viewer/assets`, `constants/ui`) were not read; card visual styling values (radii, colors) are known only by class name, not value.