# Pillar 11 — Demo Apps + E2E Tests (OneMem)

> Current note, 2026-06-17: this is a historical design document. Treat demo
> folders as plans unless runnable code exists; verify current status in the
> repo and `.thoughts/`.

The 4 demos that exercise OneMem end-to-end. They drive the demo video, validate the integration story, and prove the cross-runtime composition wedge.

---

## Read order

| File | Purpose |
|---|---|
| `README.md` | This file — demo principles + matrix |
| `demo-switch-laptops.md` | "Switch laptops mid-project; memory follows" — Claude Code + Hermes |
| `demo-agent-sends-money.md` | Trace + verify flow demo (Abu's use case) |
| `demo-verifiable-research-agent.md` | Long-running agent w/ memory + replayable audit |
| `demo-multi-agent-coordination.md` | Hermes spawns sub-agents; traces compose |
| `e2e-test-plan.md` | Test matrix across runtimes + frameworks; CI integration |

---

## Demo principles

1. **Each demo is ≤90 seconds**. Demo Day judges have attention budgets.
2. **Each demo shows ONE wedge moment.** Don't try to show everything in every demo.
3. **Each demo is reproducible.** Anyone can run the demo end-to-end with the published packages.
4. **Each demo has a recorded video** (~90 sec) + a written reproducibility guide.
5. **Together, the 4 demos cover the full v0.1 surface.**

---

## Demo matrix

| Demo | Wedge moment | Runtimes | Frameworks | Pillars exercised |
|---|---|---|---|---|
| Switch laptops | Cross-device + Walrus | Claude Code, Hermes | — | 1, 2, 3, 7 |
| Agent sends money | Trace + verify + replay | Claude Code | OpenAI Agents (wallet tool) | 1, 2, 3, 4, 7 |
| Verifiable research agent | Long-running memory + audit | Hermes | Vercel AI SDK | 1, 2, 3, 4, 7 |
| Multi-agent coordination | Cross-runtime trace composition | Claude Code + Hermes + LangGraph | — | 1, 2, 3, 7 |

Combined: every v0.1 runtime + every v0.1 framework + every pillar is exercised across the 4 demos.

---

## What's NOT a demo at v0.1

- Pure SDK / library demos (not enough story)
- Just the dashboard with no agent (no narrative)
- Multi-modal demos (not in v0.1 scope)
- Long-form documentation tutorials (those go in docs.onemem.ai)

---

## Filming + production

- Asciinema for CLI demos (renders as web-embeddable)
- Screen recording (OBS / QuickTime) for dashboard + IDE flows
- Voice-over narration on each demo (~90 sec script)
- Edited together for the official 5-min Demo Day video (covers all 4 + intro + closing)

---

## Implementation status

| Demo | Status |
|---|---|
| Switch laptops | ⏳ pending |
| Agent sends money | ⏳ pending |
| Verifiable research agent | ⏳ pending |
| Multi-agent coordination | ⏳ pending |
| E2E test matrix CI | ⏳ pending |
| Final Demo Day video | ⏳ pending |
