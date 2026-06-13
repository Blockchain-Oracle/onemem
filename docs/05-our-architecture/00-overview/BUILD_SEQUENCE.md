# OneMem Build Sequence — 26-Day Timeline

**Today:** 2026-05-26. **Submission deadline:** 2026-06-21 (PT). **Demo Day:** 2026-07-20/21 (virtual). **Winners:** 2026-08-27. **Mainnet-by-Aug-27 = 100% prize upfront.**

26 days to ship v0.1 + record demo + deploy + submit. Tight but real.

---

## Phase tracker — READ FIRST (the "what's next" source of truth)

**Autonomous loop.** After every completed chunk: research → TDD → verify → commit → flip checkbox + link commit SHA → start next chunk. Pause ONLY at MAJOR phase boundaries (pillar → pillar; code → mainnet deploy; pre-submission). Sub-stories within a pillar = just go.

- [x] **Phase 0** — Research (Sui Overflow handbook + 65-doc inspiration audit)
- [x] **Phase 1** — Architecture (65 design docs across `docs/05-our-architecture/`)
- [x] **Phase 2** — Build-prep (monorepo bootstrap — commits `658848d` + `b904d54`)
- [~] **Phase 3 — Pillar 1: Move contract** (testnet LIVE — mainnet pending Abu greenlight)
  - [x] Spec: `docs/06-specs/pillar-1-protocol/{README,PRD,architecture,epics}.md`. Commit `8569c76`.
  - [x] Code (TDD): all 6 Move modules + 34 unit tests across 8 epics. Commits `b317bb3` → `4f1b31a`.
  - [x] Deploy scripts + multi-network config + cross-language codegen. Commits `0025bab` + `8a38a48` + `afd34e3`.
  - [x] **Testnet deploy LIVE.** Package `0x64c14fc069fe3d3584b8474b4e9b58beb55373767edecedf6e4c53732d4ceafc`. Verify-script green. Commit `ac66ff1`. Suiscan: <https://suiscan.xyz/testnet/object/0x64c14fc069fe3d3584b8474b4e9b58beb55373767edecedf6e4c53732d4ceafc>
  - [ ] **Mainnet deploy** — gated on Abu's explicit "go mainnet" (mainnet writes are irreversible-ish; major phase boundary)
  - [ ] Pillar exit gate: mainnet package IDs in `MAINNET_DEPLOY.md` (testnet block already there); `pnpm test:structure` green ✓ already
- [~] **Phase 4 — Pillar 2: SDKs** (PR [#1](https://github.com/Blockchain-Oracle/onemem/pull/1) — ready to merge)
  - [x] TS SDK: namespaces + traces + off-chain Merkle verifier (live testnet round-trip + re-verify). Commits `c1293a5`→`644f143`.
  - [x] **Real Walrus blob storage** (`@mysten/walrus` upload relay + retry; emit/close upload content, on-chain hash = sha256(plaintext)). Verified live. Commit `a5f5a02`.
  - [x] **Seal encryption** (encrypt before upload, decrypt gated by `seal_approve<KIND>`; permissionless testnet key servers). Verified live encrypt→Walrus→decrypt. Commits `cb66d44`+`95639dd`.
  - [x] Python SDK: cross-language verifier — recomputes the IDENTICAL `merkle_root` as TS (verified live). Commit `570103d`.
  - [x] CI/CD live + green (repo public; logger rules enforced; pytest wired). Commits `658…`→`029833b`.
  - [ ] Pillar exit gate: PR #1 review (`pr-review-toolkit` done per-feature) + merge to main. Follow-ups tracked: #48 sui-in-CI, #50 union args, #51 Seal hardening.
- [ ] **Phase 5 — Pillar 3: Per-runtime plugins** ← **NEXT** (Claude Code + OpenClaw + Hermes) + MCP server
- [ ] **Phase 6 — Pillar 4: Framework providers** (Vercel AI + OpenAI Agents + CrewAI + LiveKit + ElevenLabs)
- [ ] **Phase 7 — Pillar 5: CLI** (TS + Python)
- [ ] **Phase 8 — Pillar 6: Dashboard** (`packages/dashboard` + `apps/hosted-dashboard` + public `/verify/[session_id]`)
- [ ] **Phase 9 — Pillar 7: Marketing landing + docs site** (`apps/landing` + Mintlify `apps/docs`)
- [ ] **Phase 10 — Pillar 8: Demos + e2e tests** (4 demo videos)
- [ ] **Phase 11 — Pillar 9 stretch: Nautilus TEE relayer** (if time)
- [ ] **Phase 12 — Submission** (DeepSurge by 2026-06-21)
- [ ] **Phase 13 — Demo Day pitch prep** (Jul 9-19; only if shortlisted Jul 8)
- [ ] **Phase 14 — Mainnet stability + v0.2 features** (Jul 22 - Aug 26)

---

## Day-by-day timeline

### Days 1-2 (May 26-27) — Architecture phase (current)

**Today (Day 1):** Foundation docs + Phase 0 research complete + protocol design starts.

| Day | Work |
|---|---|
| 1 | Foundation docs (`05-our-architecture/README.md`, `00-overview/PRODUCT_INVENTORY.md`, `DEPENDENCY_GRAPH.md`, this `BUILD_SEQUENCE.md`); Phase 0 research integration |
| 2 | Protocol design (`01-protocol/move-contract.md`, `data-model.md`, `events-and-attestation.md`, `access-control-and-sharing.md`, `upgrade-strategy.md`) |

### Days 3-5 (May 28-30) — Architecture phase (parallel sub-groups)

| Day | Workstream |
|---|---|
| 3 | SDKs design (`02-sdks/*`) — 2 parallel agents |
| 3 | CLI design (`05-cli/*`) — 1 agent |
| 4 | Runtimes design (`03-runtimes/*`) — 5 parallel agents (one per runtime + MCP server) |
| 4 | Frameworks design (`04-frameworks/*`) — 5 parallel agents (one per provider) |
| 5 | Dashboard design (`06-dashboard/*`) — 3 parallel agents (data flow + design system + routes) |
| 5 | Marketing + docs design (`07-marketing-and-docs/*`) — 1 agent |
| 5 | Demos design (`08-demos-and-tests/*`) + stretch (`09-stretch/*`) — 1 agent |

**End of Day 5:** all architecture docs frozen. Implementation starts.

### Days 6-8 (May 31 - Jun 2) — Protocol implementation

| Day | Work |
|---|---|
| 6 | Move package skeleton + `MemoryNamespace` struct + `TraceSession` struct + tests |
| 7 | `ActionCall` struct + Merkle chain logic + `event::emit_authenticated` events + capability transfer |
| 8 | `seal_approve` policy + upgrade strategy (version-as-dynamic-field) + integration tests + **deploy to mainnet** |

**End of Day 8:** Pillar 1 mainnet contract IDs in hand.

### Days 9-12 (Jun 3-6) — Core SDKs

| Day | Work |
|---|---|
| 9 | `@onemem/sdk-ts` skeleton + `MemWal` wrap + namespace ops |
| 10 | `@onemem/sdk-ts` trace emit + Seal `/manual` flow + tests + publish to npm |
| 11 | `onemem-sdk-python` skeleton + same API surface + tests |
| 12 | `onemem-sdk-python` publish to PyPI + compatibility contract |

**End of Day 12:** SDKs on npm + PyPI. Downstream work unblocked.

### Days 13-17 (Jun 7-11) — Plugins, providers, CLI, MCP server (PARALLEL)

| Workstream | Days |
|---|---|
| **MCP server** (`@onemem/mcp`) | 13 — 1 day |
| **Claude Code plugin** | 13-14 — 2 days |
| **OpenClaw plugin** | 14-15 — 1 day (uses `oc-memwal` underneath) |
| **Hermes plugin** | 14-16 — 2-3 days |
| **CLI** (Node + Python) | 13-15 — 2 days each, mostly parallel |
| **Vercel AI provider** | 13 — 1 day |
| **OpenAI Agents tools** | 14 — 1 day |
| **CrewAI provider** | 15 — 1 day |
| **LiveKit + ElevenLabs voice providers** | 16-17 — 2 days |

**End of Day 17:** all v0.1 plugins + providers + CLI shipped.

### Days 18-22 (Jun 12-16) — Dashboard implementation

| Day | Work |
|---|---|
| 18 | Next.js scaffold + Tailwind + shadcn + Radix Themes + dapp-kit setup + brand tokens |
| 19 | SSE wiring + REST API skeleton + `/` overview route + `/memories` route |
| 20 | `/trace/[id]` headline route (tree + Gantt + Verify drawer + Replay modal) |
| 21 | `/apps`, `/sessions/[id]`, `/share/[capability-id]`, `/settings` routes |
| 22 | Polish + responsive + dark mode + bundle with `@onemem/dashboard` + CLI integration (`onemem dashboard` launches) |

**End of Day 22:** Pillar 7 (local dashboard) shipped. Hosted variant (Pillar 8) gets done in spare time + Walrus Sites mirror.

### Days 23-25 (Jun 17-19) — Polish, demos, mainnet, video, submission

| Day | Work |
|---|---|
| 23 | All 4 demo apps wired + recorded; landing page (`onemem.ai`) + Mintlify docs (`docs.onemem.ai`) + 5 must-have pages; hosted dashboard at `app.onemem.ai`; Walrus Sites mirror; (stretch) start Nautilus TEE integration |
| 24 | Demo video editing; landing copy polish; docs proof-read; OneZeppelin OZ contracts review pass (security score); end-to-end test matrix run |
| 25 | Final integration tests + bug fixes; demo video uploaded to YouTube; GitHub README per-package polish; submission preview |

### Day 26 (Jun 20-21) — Submission

| Day | Work |
|---|---|
| 26 | Final submission to DeepSurge; KYC for prize payout; community announcement (Twitter, Telegram); Walrus Discord post |

---

## Buffer (after Jun 21 submission)

- Jun 22 - Jul 7: bug fixes, mainnet stability, additional integrations (Pipecat for voice, LangChain provider, etc.)
- **Jul 8: shortlist announced.** If shortlisted: prep for Demo Day.
- Jul 9 - Jul 19: Demo Day pitch deck + practice pitch + dry run
- **Jul 20-21: Demo Day** (virtual; pitch live to judges)
- Jul 22 - Aug 26: continue development; additional v0.2 features ship
- **Aug 27: winners announced.** If already mainnet by Aug 27 → 100% prize upfront.

---

## Risk-adjusted timeline (slippage budget)

If any phase slips:

| Phase | Slip impact | Mitigation |
|---|---|---|
| Days 1-5 architecture | Pushes implementation start; OK if ≤2 days slip | Cut docs that aren't load-bearing (e.g., `09-stretch/`) |
| Days 6-8 protocol | Blocks everything; CRITICAL | Hard time-box; if Move issues arise, simplify v0.1 contract scope (defer Merkle chain complexity to v0.2 if needed — keep just `MemoryNamespace` + `TraceSession` at v0.1) |
| Days 9-12 SDKs | Blocks plugins/providers/dashboard | Ship TS first (Day 11), Python second (Day 14); don't gate v0.1 on both |
| Days 13-17 plugins/providers | Per-component slippage low impact (each is independent) | Cut to minimum: Claude Code + Hermes + Vercel AI SDK = 3 integrations is still a credible cross-runtime story |
| Days 18-22 dashboard | High-impact (it's the headline demo) | Cut to 3 routes minimum: `/`, `/memories`, `/trace/[id]` |
| Days 23-25 polish | OK to slip into Day 26 | Submission demo doesn't need perfect; needs working |

**Hard floor (worst case):** Move contract on mainnet + TS SDK + Claude Code plugin + Hermes plugin + Vercel AI provider + 3-route dashboard + 1 demo video + landing + 5 docs pages. This still wins shortlist eligibility per the Walrus track must-haves. Everything else is upside.

---

## What we do NOT touch during the build

To prevent scope drift:

- No additional research dispatches mid-build (research phase is closed after Day 5)
- No new framework providers beyond the v0.1 list (LangChain etc. wait for v0.2)
- No mobile, no browser extension, no SOC2 paperwork
- No alternate brand exploration (lavender + chartreuse + cream is locked)
- No name changes (OneMem locked 2026-05-26)

If a great idea arises mid-build: note it in `09-stretch/` for v0.2; do not pull into v0.1.

---

## Daily standup ritual (optional)

If you want to keep tempo:

- Every morning: read `BUILD_SEQUENCE.md` to know what today targets
- Every evening: update the status table in the relevant pillar's `README.md` (`✅ done` / `🔄 in flight` / `⏳ pending`)
- End of week: re-read the lens check in `PRODUCT_INVENTORY.md` ("satisfies + surprises") — make sure you haven't drifted

---

## Cross-references

- `PRODUCT_INVENTORY.md` — what the 12 pillars are
- `DEPENDENCY_GRAPH.md` — what blocks what
- `../README.md` — folder overview
- `../../../06-references/SUI_OVERFLOW_2026_HANDBOOK.md` — canonical hackathon handbook
