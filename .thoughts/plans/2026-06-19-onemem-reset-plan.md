# OneMem Reset — Detailed Implementation Plan (v2)

## Context

OneMem drifted into an agent action-**trace + on-chain verify** product. Abu has rejected that, repeatedly and explicitly. The locked product:

> **OneMem = claude-mem + Mem0, but decentralized. Nothing else. NO trace. NO verify-as-product.**

- **Product A — claude-mem, decentralized:** drop-in memory for coding agents (Claude Code / Codex), with a readable, *alive* local dashboard.
- **Product B — Mem0, decentralized:** an embeddable memory-layer SDK (`add`/`search`/…) + framework providers so any AI app remembers its users.
- **Decentralization is delivered by MemWal** (`@mysten-incubation/memwal`) = Seal-encrypted blobs on Walrus + a Sui account/delegate ownership model. The Walrus track's "verifiable memory layer" is satisfied inherently by living on MemWal/Walrus/Seal — not by a verify feature.

This plan is grounded in four primary-source studies (Mem0 full surface + the MemWal gap; claude-mem full architecture + every feature; Mem0/claude-mem docs+dashboard UX; an exhaustive OneMem cleanup audit). No improvising — every decision below cites real files. Deadline is **not** a constraint (Abu): quality only, no mocks, real per-feature testing. **No post-hackathon deferral** — everything here ships in the hackathon; "milestones" are only a judge-facing docs section.

Repo: `/Users/abu/dev/hackathon/sui-overflow/onemem` (branch `pillar-3-plugins`, remote `Blockchain-Oracle/onemem`).

---

## Architecture decision (load-bearing): build entirely on MemWal; delete the custom contract

MemWal already provides, on Sui, everything memory needs: **account + user-configurable delegate-key ownership**, **Walrus storage**, **Seal encryption**. OneMem's custom Move contract + its Seal/Walrus SDK code exist almost entirely for the *trace* product.

**Decision:** delete the entire custom on-chain layer; store all memory through MemWal. Evidence from the cleanup audit:
- `contracts/onemem/` (registry/namespace/trace/events/seal_policy/version) = the trace/verify chain. → delete.
- `sdk-ts/src/seal.ts` + `walrus.ts` are **OneMem-contract-gated** (encrypt with the OneMem package id; decrypt via `onemem::seal_policy`). **MemWal does its own Seal+Walrus** via `@mysten-incubation/memwal/manual`. → delete.
- Trade-off: OneMem has **no custom Sui package id**; the on-chain component is MemWal's (which is genuine, sanctioned Sui+Walrus usage). Abu has accepted not deploying our contract ("we have the commits").

Two design consequences this forces (not deletions — builds): **(a)** memory listing currently derives from the on-chain `memwal_write` event, which vanishes → we need a new memory **inventory/index** source; **(b)** memory **sharing** currently uses OneMem's NamespaceCapability → moves to MemWal's delegate/account ACL.

---

## Product B scope — the Mem0↔MemWal gap (KEY scope decision)

MemWal HAS: `remember`/`recall`/`analyze`/`ask`/`restore`/`embed`/`health` (+bulk, +manual), namespace-only scoping, 6 MCP tools, Vercel AI + OpenClaw integrations.

MemWal LACKS (the Mem0 gap): `get(id)`/`get_all`/`update`/`delete`/`history`; multi-level scoping (`user_id`/`agent_id`/`run_id`); metadata + filter DSL; rerank/hybrid; entities/graph; categories; the breadth of ~30 framework integrations; a management dashboard.

**Recommended hackathon scope for Product B (complete, not half-built):**
- **Core (wrap MemWal):** `add`/`search`/`analyze` with namespace.
- **Build the highest-value gap** on top of MemWal via a **lightweight per-account index** (the same local-store pattern claude-mem/Mem0 use as a cache over the durable store): `get(id)`, `get_all`, `delete`, `metadata` + filter, and **multi-level scoping** (`user_id`/`agent_id`/`run_id`) mapped onto MemWal namespaces/metadata. This is the differentiator over a bare MemWal wrapper.
- **Rework the existing providers to memory** (they're trace shims today): Vercel AI, OpenAI Agents (TS), CrewAI / LiveKit / ElevenLabs / Hermes (Python).
- **Login:** add a "bring your own MemWal account id + delegate key" path (env or manual), alongside the existing hosted-mint convenience.
- **Milestone (judge-facing docs, not deferred core):** entities/graph memory, rerank, the remaining ~25 framework integrations.

> This is the one scope I most want your steer on, but my recommendation is: build the core + the index-backed CRUD/scoping gap + rework the 5 existing providers. That's a real "Mem0, decentralized," not a re-skin.

---

## Product A feature parity (match claude-mem, decentralized)

The current OneMem worker already has the **local SQLite + SSE** (survives 100%). What's missing vs claude-mem (to build):
- **Observer compression:** a background LLM turns each raw tool call into a readable observation — `type` (8 types: bugfix/feature/refactor/change/discovery/decision/security_alert/security_note), `title`, `subtitle`, `facts[]`, `narrative`, `concepts[]` (7), **`files_read[]` / `files_modified[]` (the files view Abu values)**. (claude-mem `parser.ts`, `prompts.ts`, `plugin/modes/code.json`.)
- **Session summaries:** 5 sections (request/investigated/learned/completed/next_steps).
- **Dual-ID + content-hash dedup** for idempotent writes (important for a decentralized/replayed store).
- **Durable store = MemWal** (compressed observations/summaries written to MemWal for cross-session/cross-device recall); **local SQLite = the alive cache + full feed** (cost-aware: not every raw tool call goes to Walrus — see Risks).
- **Readable dashboard** (claude-mem viewer is the reference): centered live feed of cards (observation/summary/prompt), per-runtime color pills, project selector, **files view**, facts↔narrative toggle, strong empty state, **alive SSE** (`processing_status` → queue badge + spinning favicon), settings/"tune it" modal, theme toggle. Built in OneMem's existing **cdr-kit** identity (lavender/chartreuse/cream/sui; Ratch/Inter/JetBrains Mono; Radix Themes) — not repainted to mem0 purple.
- **Recall:** SessionStart deterministic recent-timeline injection + UserPromptSubmit semantic injection (MemWal `recall`); the 3-layer MCP recall (`search`→`timeline`→`get_observations`).
- **Cost meter (nice-to-have, ship it):** dashboard shows total WAL/on-chain cost spent so far (like Claude Code's token counter).

---

## Phase 0 — Salvage, wipe `.thoughts`, lock the definition

1. **Salvage** the non-reconstructable items into a fresh `/.thoughts/SALVAGE-2026-06-19.md`: ~30 demo/smoke on-chain object IDs, live deployment IDs (`onemem.xyz`, `app.onemem.xyz`, Vercel ids, `docs.onemem.xyz`), and operational facts (testnet faucet endpoint, `~/.onemem/*.json` credential inventory by name).
2. **Wipe** `.thoughts/` (357 files, mostly reconstructable) and re-seed with the context-engineering structure.
3. **Lock docs:** rewrite `CLAUDE.md` + `AGENTS.md` to the locked two-product definition — **keep `CLAUDE.md` lightweight (≤50 lines, it loads every turn)** but authoritative, and **rewrite any stale / old-trace-era content** rather than leaving it (move detail into linked docs). Add a **Rule Enforcement** block to `CLAUDE.md`: every change ships via a **PR**; the **PR review toolkit (the 5 pr-review agents) runs before merge**; **no direct commits to main**. Create `BUILD_SEQUENCE.md` (checkbox roadmap) referenced from `CLAUDE.md`.

---

## Phase 1 — Full cleanup (exhaustive, no dead code)

**Delete (packages/dirs):** `services/nautilus-relayer/`, `contracts/onemem/`, all `demos/*` (pure trace demos). **Rework, don't delete:** the 5 framework providers + `plugin-hermes` (trace shims → memory). **Delete `provider-openai-agents`?** — it's trace-only with zero code inbound; rework to memory (Product B) rather than delete.

**sdk-ts:** delete `traces.ts`, `fetchers/trace.ts`, `types/move.ts`, `generated/addresses.ts`, **`seal.ts`**, **`walrus.ts`**, `namespaces.ts`/`namespace-capabilities.ts`/`namespace-history.ts`; bin `onemem-trace.mjs`. Strip `client.ts` (drop walrus/seal/namespaces/traces wiring; keep signer/network/memory), `runtime.ts` (drop `ensureNamespace`/`recordSession`/`createTraceRecorder`; keep `resolveSigner`/`resolveNetwork`/`ensureGas`), `memory.ts` (drop the ActionCall-attestation branch + `getAll()` chain-derivation), `index.ts` exports. Keep `runtime-memory.ts`, `credentials.ts`, bin `onemem-memory.mjs`.

**worker:** delete `anchor.ts` + `reconciler.ts` (+tests); strip `index.ts`/`bin` (anchor wiring + `ONEMEM_NAMESPACE_ID`/`RW_CAP_ID`/`PRIVATE_KEY`), `store.ts` (`proof_status`/`call_id`/`tx_digest`), `server.ts` (`proof_update`). SQLite + SSE survive.

**dashboard:** delete `app/sessions/`, `app/trace/[session_id]/`, `app/api/sessions/{verify,[id],export}`, `app/api/trace/.../export`, `app/api/stream`; lib `trace.ts`/`sessions.ts`/`session-export.ts`/`decrypt.ts`; strip `runtimes.ts` (dishonest control cards), `memory.ts` (re-source listing), nav in `AppShell.tsx`.

**scripts/CI/tests:** delete `codegen-move-*`, `deploy-contract.sh`, `migrate-contract.sh`, `verify-mainnet.sh`, `sdk-smoke-testnet.ts`; CI: remove Sui CLI + Move build/test steps, delete `deploy-contract.yml`; structure tests: drop `MOVE_*`, deleted packages, `verify/[session_id]` route; delete/rewrite `protocol.test.ts`, `deploy-scripts.test.ts`, `walrus-static-verifier.test.ts`. Delete `config/networks.json`(+schema) and the generated address files.

**MemWal version:** consolidate `0.0.5`/`0.0.7`/`oc-memwal@0.0.4` to one pinned version.

**Exit criterion:** repo builds + typechecks + non-trace tests green; dashboard boots with no trace routes; **no dead code, no dangling imports.**

---

## Phase 2 — Product B: Mem0 on MemWal

- **SDK (`sdk-ts/memory.ts` + new index layer):** `add`/`search`/`analyze` (MemWal) + `get`/`get_all`/`delete`/metadata/multi-scope (index). Config via env → `~/.onemem/credentials.json` (`credentials.ts` already supports this).
- **Login rework (`cli-ts/login.ts`, hosted `cli-login`):** keep hosted-mint convenience; add manual "own account id + delegate key" path (skip wallet-lookup/minting). Drop vestigial trace fields from the callback.
- **CLI:** finish `onemem add`/`search`; rework `init` (ensure MemWal account+delegate, not OneMem namespace) and `health` (check MemWal/relayer); delete `verify`/`trace`/`namespace share|revoke`.
- **MCP:** keep `onemem_add_memory`/`onemem_search_memory` (strip attestation); delete trace/replay/namespace tools.
- **Providers:** Vercel AI + OpenAI Agents (TS), CrewAI/LiveKit/ElevenLabs/Hermes (Python) → memory recall+capture wrapping the SDK.
- **Verify (manual, on testnet):** real `add`/`search` round-trip from the **SDK**, the **CLI**, the **MCP server**, and the **Vercel AI provider with the real OpenAI key** — inspect actual recalled text. Validate **account+delegate provisioning end-to-end** here (don't assume it).

---

## Phase 3 — Product A: claude-mem on MemWal

- **Capture:** keep hooks (`plugin-claude-code`/`plugin-codex`) → worker (`127.0.0.1:4041`); rework hooks from trace-recorders to **recall-on-start + capture-salient-memory** (drop the on-chain anchor).
- **Observer compression:** background LLM (configurable; OpenAI key available) compresses tool calls → readable observations (8 types/7 concepts/files view) and session summaries (5 sections). Dual-ID + content-hash dedup.
- **Store:** local SQLite (alive feed cache) + MemWal (durable, cost-aware selection).
- **Dashboard rebuild (`packages/dashboard`):** readable live feed as the primary view (observation/summary/prompt cards, files view, per-runtime color pills, project selector, alive SSE `processing_status` + spinning favicon, settings modal, theme), recall view via MemWal `search`, **cost meter**. Remove the hash table / proof badges / "before proof settles" framing / dishonest framework cards. Keep the cdr-kit identity; borrow patterns (OpenMemory install panel, claude-mem live-feed) into it.
- **Fix** the `/memories` hydration error (date-format mismatch).
- **Verify (manual):** real Claude Code session + real Codex session → readable memories appear live, persist to MemWal, recall works; **Chrome DevTools** for UI + mobile responsiveness; no hashes-as-content; no console errors.

---

## Phase 4 — Docs (Mintlify, Mem0-quality, our identity)

- Restructure `apps/docs` to Mem0's IA patterns (multi-anchor tabs + icon groups; Card/CardGroup hubs + "Next steps" footers; CodeGroup multi-runtime; Steps quickstarts; Info/Warning callouts; `_snippets`; `<Update>` changelog; contextual copy/AI menu) — but in OneMem's cdr-kit design, single brand accent.
- **Custom `mode:"custom"` welcome page** with a **light/dark thumbnail card grid** (Mem0's showpiece) — screenshots of the real dashboard.
- **Images:** `apps/docs/images/{thumbnails/{light,dark},diagrams,screenshots}/`; embed via `<Frame>` / dual-`<img>` light-dark swap. Source: **image MCP** for designed tiles + architecture diagrams; **browser MCP** for real dashboard screenshots.
- Content: delete `concepts/trace.mdx` + `concepts/verify.mdx`; keep/expand `concepts/memory.mdx`; add Product A, Product B (SDK+providers), decentralization (MemWal/Walrus/Seal + delegate/account config), per-runtime quickstarts. Fix all `/verify` → `/share` link drift.
- **Milestone section** (judge-facing): the future roadmap (entities/graph, more integrations) — signals seriousness, not deferred core.

---

## Phase 5 — Landing (matters for judging; honest + simple + human)

- Rewrite `apps/landing` copy to say **exactly** what we do, in few, plain words a non-technical judge gets instantly. **Never claim what we're not** (no trace/verify language, no overclaiming). Creative/polished visually, but the message is dead-simple; detail lives in docs. Motto is low priority/undecided.

---

## Phase 6 — Deployment + env cleanup + demo

- **Env cleanup:** create a memory-only `.env.example` (there's no committed one today). Remove trace/contract-only vars: `ONEMEM_NAMESPACE_ID`, `ONEMEM_RW_CAP_ID`, `ONEMEM_ADMIN_CAP_ID`, `ONEMEM_PARENT_CALL_ID`, `ONEMEM_TRACE_CMD`/`_CLI`, trace-smoke vars; trim `turbo.json` `env`. Keep MemWal/memory/embedding/login vars. **Rotate the live secrets in the root `.env`.**
- **Deploy:** products work against MemWal **testnet** throughout; validate the MemWal **mainnet** relayer path (prize: 100% if on mainnet by August; eligibility allows testnet). Front end already on Vercel; evaluate Walrus Sites as an extra Walrus-track signal.
- **Demo:** Abu produces it; I help write the script at the end (not now).

---

## Verification approach (HIGH PRIORITY — per feature, as built)

Abu's non-negotiable: **never batch testing to the end.** For *every* feature slice:
1. **Unit tests** (the basics) — worker store, memory add/search/index, config resolution, dashboard render.
2. **Real manual integration test on testnet, immediately** — build a CLI → run the CLI; SDK → run it; MCP → exercise it; Vercel AI → run it with the real OpenAI key. Inspect actual recalled memory content (not just pass/fail).
3. **UI** via Chrome DevTools — click through, check mobile responsiveness, watch the console.
4. **No `try/catch` masking** — when something breaks, find *where* and *why*; surface it, don't swallow it.
5. **PR discipline (enforced via `CLAUDE.md`):** every slice ships as a **PR** — never a direct commit to main; before merge, run a **completion audit** (delivered-vs-planned item-by-item, every cut called out) + the **PR review toolkit (5 pr-review agents)** + code review.

---

## Risks / open decisions

1. **Custom-contract deletion** (incl `seal.ts`/`walrus.ts`) — load-bearing; now strongly evidenced. Confirm.
2. **Product B gap scope** — how far to close the Mem0 gap (my rec: core + index-backed CRUD/scoping + rework 5 providers; entities/graph/breadth = milestone). Your steer welcome.
3. **New memory inventory source** — MemWal 0.0.5 has no list endpoint and the on-chain event is gone; the index layer must provide listing (local SQLite for A; per-account index for B).
4. **Walrus testnet epochs = 1 day**, no renewal logic → testnet memories ephemeral (fine for dev/demo; mainnet = 14 days). Informs "compress/select, don't write every tool call."
5. **Per-write WAL cost** unmeasured → drives the cost meter + the local-cache-vs-MemWal-durable split.
6. **MemWal account/delegate provisioning** end-to-end not yet exercised on testnet → validate first in Phase 2.
