# GOAL — OneMem build to honest, trace-led, demo-ready product (2026-06-19)

> Paste-ready goal. Re-feed this to the agent (or to `/loop`) to continue. It is
> idempotent: on each run, inspect current state, pick the next unchecked roadmap
> item, implement it, **prove it on the real system**, check it off, continue.

Set a goal to carry OneMem from its proven-keystone state to a coherent, honest,
**trace-led** product that matches the accepted target architecture — looping the
build roadmap phase-by-phase, **real-integration-testing every feature on the real
system as you go**, until every acceptance criterion passes.

## Objective
Execute the OneMem build roadmap (Phase 1 → 2 → 3) to completion. Make the local
dashboard honest and alive, make the hosted dashboard actually show a deployed
app's verifiable traces, and prove the flagship Vercel demo end-to-end on real
testnet. Stop overclaiming; ship only behavior you have watched work.

## Current context to inspect FIRST (read before acting — do not trust this summary)
- Product identity (frozen): `docs/00-goal/GOAL.md` — OneMem = verifiable record of what your agent DID (trace) + memory you OWN. Mem0/claude-mem are inspiration, not competitors.
- Diagnosis (what's wrong, file:line): `.thoughts/research/2026-06-19-grounding/00-GROUNDING-SYNTHESIS.md` (+ per-thread reports, + first-pass `v1/`).
- **Authoritative target architecture:** `.thoughts/design/2026-06-19-target-architecture/00-TARGET-ARCHITECTURE.md` (+ `01..06`). SHIPPED/BUILDABLE/RISKY tags + build sequence.
- **Live roadmap with checkboxes (source of next step):** `.thoughts/plans/2026-06-19-build-roadmap.md`. Update it as items complete.
- Repo routing + rules: `AGENTS.md`, root `CLAUDE.md`, package `CLAUDE.md` files. Quality gates: `.thoughts/quality/2026-06-17-project-quality-profile.md`.
- Proven keystone evidence: testnet TraceSession `0x2571e27b604b587dcb828fc5de45821bf57d91f53afcf908b1333c31844117a6` (`environment=vercel-ai`, `onemem verify` ✓). Real testnet creds in `~/.onemem/*.json`; active Sui address `0x633d…c235a` on testnet.

## Locked decisions (do not relitigate)
- Headline = TRACE-LED. Memory is substrate; breadth is mechanism.
- Execution-location principle: laptop runtimes (Claude Code, Codex, OpenClaw, Hermes) → LOCAL dashboard; deployed frameworks (Vercel AI, OpenAI Agents, CrewAI, LiveKit, ElevenLabs) → HOSTED / queryable namespace, NEVER local chrome; MCP-only clients (Cursor/Windsurf/Cline/OpenCode) → local but explicit-tools-only.
- Framework adapters REMOVED from local dashboard. Adapter packages keep shipping.
- Demo = laptop runtimes + public `/verify` + ONE deployed adapter: **Vercel AI SDK**.
- Hosted auth = **WALLET-ONLY** for the hackathon (Google/Enoki login deferred; keep server-side Enoki sponsorship for gasless onboarding). Hosted logs are **evidence-driven** (environment tabs from on-chain sessions), never a hardcoded "connected app" list with fake toggles.

## The loop (run this every iteration)
1. Read `.thoughts/plans/2026-06-19-build-roadmap.md`; pick the **first unchecked item** in the lowest open phase.
2. Read the **real code** for that item (file:line from the architecture doc); confirm current behavior — never assume.
3. Implement the **smallest complete change** that satisfies the item, matching surrounding code style.
4. **REAL-INTEGRATION TEST IT (gating — see below).** If it doesn't actually work, fix it now, like the keystone spike (run → hit the wall → fix → confirm). Do not move on until you've watched it work.
5. Write/extend unit + integration tests for it (mandatory, but secondary to #4).
6. Run the affected-stack quality gates (`pnpm lint`/`typecheck`/`build`/`test`; `uv run ruff/pyright/pytest`; `sui move build` as relevant; `pnpm test:structure` for docs/structure).
7. Check the item off in the roadmap; commit on a branch (never the default branch) only if asked, otherwise leave a clean working tree summary.
8. At each **phase completion**, post a brief progress checkpoint (what's proven, with the real-system evidence) and continue to the next phase **without waiting for permission** unless a real blocker (below) is hit.

## Real-integration testing is the priority gate (Abu's hard requirement)
"Done" means **you ran it on the real system and observed correct behavior**, not that tests pass. Per feature, not batched to the end:
- UI changes → launch the actual app (local dashboard via `onemem dashboard`; hosted via its dev server) and verify with **Playwright or chrome-devtools MCP** (screenshots, real navigation). e.g. after BUG-1, confirm the dashboard actually lists session `0x2571…117a6` and is no longer empty.
- Chain/SDK changes → run against **real testnet** (HTTP faucet `POST https://faucet.testnet.sui.io/v2/gas {"FixedAmountRequest":{"recipient":"0x.."}}` since the CLI faucet is dead), then `onemem verify`.
- MCP changes → make **real MCP tool calls** and inspect the actual recorded data (decode ActionCalls; confirm content is meaningful, not just that a tx exists).
- Vercel demo → make a real model call through the deployed/running app; confirm a `vercel-ai` TraceSession lands, verifies green, and appears in the hosted namespace view.
This loop — run it, find out, fix it, confirm — is what creates confidence. Treat it as the definition of progress.

## Acceptance criteria (per phase — all must be real-integration-proven)
- **Phase 1 (honesty + correctness):** BUG-1 fixed → local dashboard shows real testnet sessions (not empty) [Playwright-verified]; dashboard binds `127.0.0.1`; local `/apps` has NO framework cards and groups runtimes into honest tiers; hosted login is wallet-only with working connect + no `redirect_uri` error, onboarding still gasless; dishonest copy deleted (Settings "Auto-capture on", fake "Verifiable" card, landing "every runtime/framework"); landing H1 is trace-led. Gates green.
- **Phase 2 (hosted + Vercel):** MCP `add_memory` emits a real on-chain ActionCall [verified]; onboarding exports a deploy delegate-key env block; hosted `/n/[namespace]?env=` lists the namespace's sessions by environment and links to `/verify` [Playwright-verified showing the real `vercel-ai` session]; `apps/demo-vercel` makes a real model call that lands + verifies + appears in the hosted view.
- **Phase 3 (alive):** `@onemem/worker` auto-starts from SessionStart, writes each tool call to local SQLite, pushes SSE; local dashboard fills **live during** a session (not at Stop); proof badges flip local→anchored→verified [observed in a real Claude Code session].

## Autonomy rules
- Keep working through the roadmap without asking Abu to restate the process or to approve each item. Inspect real files before deciding what exists. Preserve frontend/prototype fidelity; do not lose screens, states, or copy. Never silently ship a mock or an overclaim as real behavior. No silent scope cuts — if you defer something, say why.

## Pause and ask Abu ONLY for real blockers
- Testnet funding if the HTTP faucet is rate-limited/blocked and you're stuck; an OpenAI (or model-provider) API key for the Vercel demo; a Vercel account/deploy token to actually deploy; any irreversible publish (npm/marketplace) or mainnet action; a product decision genuinely not answerable from the accepted artifacts. Otherwise do not pause.

## Definition of done
- Every roadmap item checked off and **each proven on the real system** (cite the evidence: session ids, screenshots, MCP outputs).
- Local dashboard: honest, populated, wallet-only hosted auth, no framework cards, no dishonest copy, alive during sessions.
- Hosted: a deployed Vercel app's traces are viewable by namespace and publicly verifiable.
- Quality gates green; unit + integration tests added.
- A `verification-audit` + `handoff` written; a completion audit (delivered-vs-planned, every gap/deferral called out); 5 pr-review agents run if a PR is opened.
