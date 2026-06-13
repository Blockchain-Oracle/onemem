# Pillar 2 Audit & Correction (2026-06-13)

Honest record of a build-vs-spec divergence found after Pillar 2 was merged, so the correction is tracked and the lesson sticks.

## What went wrong

Pillar 2 (SDKs) was built from the task list, not from `docs/00-goal/GOAL.md` + `docs/05-our-architecture/02-sdks/shared-api-surface.md`. Result: the SDK shipped the **trace layer** but **completely omitted the Memory API — the actual product** — and never wrapped MemWal despite that being the specced storage path.

## Built vs. intended

| Surface | Spec (`shared-api-surface.md` / `GOAL.md`) | What shipped | Verdict |
|---|---|---|---|
| Memory API (`add/search/get/update/delete/getAll/history/feedback/export`) | Mem0-mirror; **wraps MemWal** `remember`/`recall`/`analyze` via relayer | **Absent** | ❌ build |
| Trace API | `startSession/endSession/appendCall/closeCall/getSession/listSessions/getCalls/verifySession/replaySession/subscribe` | `openSession/emitCall/closeCall/closeSession/verifySession` | ⚠️ keep, rename to spec + add `getCalls`/`listSessions`/`replaySession`/`subscribe` |
| Namespace API | `create/list/get/share/revoke/deactivate/reactivate/getCapabilities` under `client.namespace.*` | `create/findByName/shareReadOnly/shareReadWrite/deactivate/reactivate` under `onemem.namespaces.*` | ⚠️ keep, align names |
| Auth/lifecycle | `OneMem.login/logout/currentAccount/health` | none | ❌ build |
| `OneMem.create` config | `{key, accountId, serverUrl, namespaceId, agentId, environment, network}` | `{signer, network, rpcUrl, walrus, seal}` | ⚠️ reconcile |
| Walrus + Seal | Memory storage = MemWal relayer's job; OneMem owns only **trace** blobs | Hand-rolled Walrus+Seal+SUI→WAL for everything | ⚠️ keep for trace; route memory through MemWal |
| Move contract (Pillar 1) | `onemem::{registry,namespace,trace,events,seal_policy,version}` | matches, live on testnet | ✅ correct |

## The correct architecture (the split)

- **Memory CRUD** → delegate to `@mysten-incubation/memwal` (`MemWal.create({key, accountId, serverUrl}).remember/recall/analyze`). The relayer does Walrus/Seal/Sui for memory. OneMem adds: an `ActionCall` trace per write + an `attestation` field on the response. Use the MemWal `/manual` (client-side encryption) flow per `sdk-ts/CLAUDE.md`.
- **Trace/attestation** → OneMem signs Sui directly against `onemem::trace` (the net-new pillar). Trace content blobs are OneMem's own Walrus + Seal (already built — keep).

## Correction plan

1. Verify the live `@mysten-incubation/memwal` SDK surface (context7 + read the installed package) — specs are hypotheses; confirm `MemWal.create`/`remember`/`recall` before wrapping. Confirm MemWal credential/relayer story (account id + delegate key; testnet relayer `relayer.staging.memwal.ai`).
2. Build the **Memory API** (`add/search/get/...`) wrapping MemWal, each write emitting an `ActionCall`. Mirror in Python.
3. Reconcile `OneMem.create` config to the spec shape; add `login/logout/health`.
4. Rename/extend the Trace API to the spec (`startSession/appendCall/getCalls/replaySession/...`).
5. Rebuild `@onemem/mcp` to the spec's 9 tools (`add_memory/search_memory/get_memory/update_memory/delete_memory/replay_session/verify_trace/share_namespace/trace_session`), now backed by the real memory API.
6. THEN plugins (Claude Code/OpenClaw/Hermes) — which record via `add()` + recall via `search()`, not raw trace plumbing.

## Lesson (encoded in CLAUDE.md)

Read `GOAL.md` + the matching `shared-api-surface.md`/inspiration docs before building any package. The task list is a checklist, not the spec.
