# Pillar 1 — Move Protocol Spec

**Phase 3 of [BUILD_SEQUENCE.md](../../05-our-architecture/00-overview/BUILD_SEQUENCE.md). Status: spec in review.**

This folder is the BMad-style spec for the OneMem Move contract. It translates the architecture docs at `docs/05-our-architecture/01-protocol/*` into an executable work plan: PRD → architecture summary → epics with inline stories.

## Read order

| File | Purpose |
|---|---|
| `PRD.md` | The **what** + **why** of Pillar 1. Reader: anyone. Outcome the contract delivers. |
| `architecture.md` | The **how**, in summary. Points at the canonical architecture docs that already exist. No new design decisions live here. |
| `epics.md` | The **work plan** — 8 epics, 22 stories enumerated inline. Each story has acceptance criteria + file pointers. This is what TDD execution iterates against. |

## Source of truth

Architecture is canonical at `docs/05-our-architecture/01-protocol/`:
- `README.md` — pillar overview
- `data-model.md` — Move struct definitions (MemoryNamespace, TraceSession, ActionCall, NamespaceCapability)
- `move-contract.md` — module layout + entry functions
- `access-control-and-sharing.md` — capability pattern + transfer/revoke
- `events-and-attestation.md` — Merkle chain + `event::emit_authenticated`
- `upgrade-strategy.md` — version-as-dynamic-field pattern (lifted from MemWal)

If the architecture changes mid-implementation, update the architecture doc FIRST, then this spec. The spec mirrors the architecture, never overrides it.

## Pillar exit gate

Pillar 1 is "done" when ALL of:

1. All Move modules implement the spec; `sui move test` is green (`contracts/onemem/`)
2. Mainnet deploy succeeded via `deploy-contract.yml` workflow (manual approval gate)
3. Mainnet package IDs captured in `docs/05-our-architecture/01-protocol/MAINNET_DEPLOY.md`
4. `scripts/verify-mainnet.sh` smoke test green (open session → emit call → verify chain)
5. `scripts/codegen-move-types.ts` + `scripts/codegen-move-python.py` produce up-to-date type files
6. `pnpm test:structure` green
7. Phase 3 checkbox flipped in `BUILD_SEQUENCE.md` + commit SHA linked

Once green: move to Phase 4 (Pillar 2 — SDKs).

## Process

Per the per-pillar cycle in `/Users/abu/.claude/plans/lovely-painting-crane.md`:

1. **Spec phase (we are HERE)** — write PRD + architecture + epics; Abu reviews; greenlight
2. **Code phase** — git worktree per pillar (`superpowers:using-git-worktrees`); story-by-story via `superpowers:writing-plans` → `superpowers:executing-plans`; TDD red-green-refactor per `superpowers:test-driven-development`; `superpowers:verification-before-completion` before reporting each story done
3. **Review phase** — `sahil-pr-audit` + `security-reviewer` subagent on every Move diff (load-bearing); merge to main
4. **Deploy phase** — testnet first; smoke test; mainnet via approval gate; capture IDs

Security-reviewer subagent runs on EVERY Move diff. This is the surface where bugs are catastrophic.
