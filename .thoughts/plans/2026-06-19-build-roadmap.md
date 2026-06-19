# OneMem Build Roadmap — 2026-06-19

**Source of truth:** `.thoughts/design/2026-06-19-target-architecture/00-TARGET-ARCHITECTURE.md`
**Diagnosis:** `.thoughts/research/2026-06-19-grounding/00-GROUNDING-SYNTHESIS.md`

**Locked decisions:**
- Identity: OneMem = verifiable record of what your agent DID (trace) + memory you OWN. Mem0/claude-mem = inspiration, not competitors.
- Headline = TRACE-LED.
- Execution-location principle: laptop runtimes → LOCAL; deployed frameworks → HOSTED; MCP-only → local explicit-tools-only.
- Frameworks REMOVED from local dashboard (packages keep shipping).
- Demo = laptop runtimes + public /verify + ONE deployed adapter (Vercel AI).
- Auth = WALLET-ONLY for the hackathon (Google/Enoki-login deferred; keep server-side Enoki sponsorship for gasless onboarding).

Method: de-risk → fix → build → enhance. Test each item on the REAL testnet, no batching. Codex for parallel chunks. Pause at phase transitions.

## Phase 0 — De-risk the keystone (FIRST)
- [x] **R1 spike — PROVEN 2026-06-19.** Recorded a real `environment=vercel-ai` TraceSession on testnet via the actual SDK path (`bin/onemem-trace.mjs`) → session `0x2571e27b604b587dcb828fc5de45821bf57d91f53afcf908b1333c31844117a6` → `onemem verify` = ✓ VERIFIED (Merkle root matched, full Walrus+Seal+Merkle ran). Owner-key signer proven; non-owner shared-cap (`rw-cap-share` to a deploy keypair) is the same write path with a different signer — do it while building the Vercel demo. **Op note:** testnet CLI faucet is disabled; use HTTP faucet `POST https://faucet.testnet.sui.io/v2/gas {"FixedAmountRequest":{"recipient":"0x.."}}`.

## Phase 1 — Honesty fixes (parallel; demo-critical; independent of R1)
- [x] BUG-1: dashboard event reads use `originalPackageId || packageId` (`lib/trace.ts` `client()`+`fetchRecentSessions`, `lib/memory.ts` `fetchMemories`). PROVEN on testnet: fixed query returns 25 sessions incl. keystone `0x2571…`; buggy query returned 0. (UI render confirmed in the consolidated local-dashboard live check below.)
- [x] BUG-2: local dashboard binds `127.0.0.1` by default (`bin/onemem-dashboard`, `HOST` override). Typecheck green; live boot verify pending.
- [x] Removed 5 framework cards from local `/apps`; rebuilt as 3 execution-location sections (Local runtimes w/ real controls · MCP clients · Deployed environments). Capability tiers replace "enforced"; API guard rejects controlling non-local runtimes; nav → "Integrations". Unit test + typecheck green; **live UI render verify pending**.
- [x] Wallet-only auth: Google/Enoki login gated behind `NEXT_PUBLIC_ONEMEM_ENABLE_GOOGLE` opt-in (default OFF → wallet-only); sponsored onboarding unaffected; login copy wallet-primary. Hosted typecheck green; live verify pending.
- [x] Deleted dishonest copy in dashboard: Settings "Auto-capture/Auto-trace on" → honest per-runtime text; Overview fake "Verifiable/Merkle-chained" card → "On-chain · anchored"; removed unconditional green check on session rows. (Landing copy in landing item below.)
- [x] Landing reposition: trace-led hero ("See exactly what your agent did — and prove it"), pillars reordered trace-first, honest 3-tier integration strip with **real vendor logos** (Native runtimes / MCP clients / Framework adapters), deleted "every runtime/framework" + "8+" + memory-led title/CTA. Typecheck green; **live-verified** on `:4060` (logos serve 200, render confirmed via screenshot).
- [x] **Phase 1 live UI verification (consolidated) — DONE.** Local dashboard booted (`:4040`, bound 127.0.0.1): Overview lists keystone `0x2571…` (not empty), `/apps` shows 3 honest sections, location-A runtimes have pause+trace toggles, framework adapters + MCP clients have ZERO toggles, no "Enforced"/"Merkle-chained"/"Verifiable" fake copy. Hosted booted (`:4050`): `/login` renders wallet-only ("Connect Sui wallet", no Google, no redirect_uri path). Landing booted (`:4060`): trace-led + tiered logos.

> **DEPLOY-PENDING (needs Abu's Vercel access):** the wallet-only fix is in code + verified locally, but the LIVE `app.onemem.xyz` still runs the OLD build, so Abu still sees the Google `redirect_uri_mismatch`. To fix the live site: redeploy the hosted-dashboard (wallet-only by default → Google hidden), OR as a stopgap unset `NEXT_PUBLIC_ENOKI_GOOGLE_CLIENT_ID` in Vercel env + redeploy. Either way a redeploy is required. Blocked on Abu.

## Legibility — SEE the content, not just proof (CRITICAL — raised by Abu 2026-06-19)
The dashboard was leading with PROOF (hashes, merkle, verify) and BURYING content. claude-mem's whole value is you open it and READ what happened. This is the actual product point.
- [x] Trace content readable (`packages/dashboard/app/trace/[session_id]/TraceView.tsx`): detail pane now DEFAULTS to **Content**, auto-decrypts **input AND output** (Seal, on your machine), renders plain text. Was: metadata-first, input-only, 3 clicks to reveal. typecheck ✓, Biome ✓. **Live-verified**: keystone session renders `{"prompt":"keystone spike: prove deployed trace-write"}` / `{"text":"ok"}` decrypted (screenshot).
- [ ] Decrypt latency ~40s/blob (Seal-over-testnet). Instant path = the worker's local store holds plaintext as the agent runs (no decrypt for the live/local view); cache on-chain decrypts for historical sessions.
- [ ] Memory TEXT in `/memories`: BLOCKED by MemWal 0.0.5 (no get-by-id; `lib/decrypt.ts:9-12`). Text only via semantic recall (`search`), which needs `ONEMEM_EMBEDDING_API_KEY`. Honest UX = a "search your memories" box returning decrypted matches. Gated on the embedding key.

## Phase 2 — Hosted + Vercel (after R1 proven)
- [x] MCP attestation fix (BUG-3): `add_memory` now opens an ambient `environment="mcp"` TraceSession and passes `sessionId`+`onememNamespaceId`+`rwCapId` so each memory write emits a verifiable `memwal_write` ActionCall (`mcp-server/src/index.ts`); honest "stored-but-unattested" fallback + `onemem_session_status` tool when unconfigured. Typecheck ✓, tests ✓. **PROVEN on testnet**: mcp session `0x00770b3a…23f3` + `memwal_write` callId `0x6449943b…` → `verify ok=true, callCount=1`. NOTE: full end-to-end `add_memory` (MemWal remember + embedding) needs `ONEMEM_EMBEDDING_API_KEY` (OpenAI/OpenRouter) — Abu dependency; the on-chain attestation path itself is proven.
- [ ] Hosted onboarding: export delegate-key env block (`rw-cap-share` to a deploy keypair)
- [x] Hosted namespace logs view `/n/[namespace_id]?env=` — built (`lib/namespace-sessions.ts` BUG-1-immune reader + `app/n/[namespace_id]/page.tsx`): evidence-driven environment tabs, rows link to public `/verify`, honest empty-state with env block. Typecheck ✓. **Live-verified** on `:4050`: lists real `vercel-ai` keystone `0x2571…` + the `mcp` attestation session; env filter works (screenshot captured).
- [ ] `apps/demo-vercel/`: deployed chat app using `withOneMem` + `createOneMemMemory`
- [ ] (optional) memory attestation in the Vercel capture path

## Phase 3 — Alive (last)
`@onemem/worker` local daemon: auto-start from SessionStart, local SQLite, live SSE, async `proof_status` badges (local → anchored → verified). Built incrementally:
- [x] **Local store** (`packages/worker/src/store.ts`, node:sqlite, zero native deps): sessions + observations w/ `proof_status`, instant `addObservation` (hot path), async `setProofStatus` reconciliation (local→anchored→verified), `pendingProof` queue, per-session seq, idempotent `initSession`. typecheck ✓, 3 unit tests ✓, Biome ✓.
- [x] HTTP daemon (`packages/worker/src/server.ts`, 127.0.0.1-bound): `POST /api/sessions/init` + `/api/sessions/observations` (hot-path ingest → instant local write → SSE push), `GET /api/observations`, `GET /api/sessions`, `GET /stream` (REAL push SSE, not poll), `GET /health`. typecheck ✓, 5 unit tests ✓ incl. a live SSE push test (observation reaches a connected client in real time), Biome ✓. (PID file + readiness lands with auto-spawn below.)
- [x] Background reconciler (`packages/worker/src/reconciler.ts`): drains `pendingProof` off the hot path, anchors each via an injectable `AnchorFn` (so it's unit-testable without a signer; real impl = SDK `appendCall`), flips `proof_status` local→queued→anchored (or failed=retryable), pushes each update for SSE. typecheck ✓, 2 unit tests ✓ (success + failure/retry paths), Biome ✓.
- [x] Daemon assembly `startWorker()` (`packages/worker/src/index.ts`): wires store + HTTP/SSE server + a non-overlapping periodic reconcile loop; anchor injectable (off = local-only but still live). typecheck ✓, 2 unit tests ✓ incl. a `vi.waitFor` test proving the loop flips a live observation to `anchored`, Biome ✓. **The `@onemem/worker` core is a complete, tested runnable daemon (9 tests total).**
- [x] SDK anchor factory (`packages/worker/src/anchor.ts`): `createSdkAnchor()` lazily opens ONE TraceSession per local session and appends each observation as an ActionCall — structurally typed (TraceWriter) so the worker needs no sdk-ts dep and it's fully mockable. typecheck ✓, 1 unit test ✓ (session-per-local-session + append-per-obs), Biome ✓. On-chain reality of startSession/appendCall already proven on testnet (keystone + MCP).
  > Remaining worker wiring (cross-package; needs a real Claude Code session + namespace/cap config to verify "alive end-to-end"): a thin `bin/onemem-worker` that constructs `OneMem.create(...)` and passes `onemem.traces` as the anchor's TraceWriter + reads env; hooks POST to the worker + auto-spawn it from SessionStart (replacing buffer-and-flush-at-Stop); the local dashboard consuming `/stream`.
- [ ] Hooks post to worker first (replace buffer-and-flush-at-Stop); worker auto-spawned from SessionStart (like claude-mem).
- [ ] Local dashboard consumes `/stream` so it fills LIVE during a session; proof badges flip live.
