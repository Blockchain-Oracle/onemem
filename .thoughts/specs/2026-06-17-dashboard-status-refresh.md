# Spec: Dashboard Status Refresh

## Objective

Make the current-facing dashboard status documentation match the current
route/API implementation, and add a guard against reintroducing stale pending
status for already-built dashboard surfaces.

## Background And Current Reality

The dashboard README still marks many implemented local and hosted routes as
pending. The current codebase contains the local dashboard routes, hosted auth
routes, hosted public verifier, hosted share routes, and associated APIs.
`purpose-local-vs-hosted.md` is closer to current reality, but the dashboard
README remains a high-level entry point.

## Users

- Future Codex/Claude agents onboarding to dashboard work.
- Developers checking dashboard implementation status.
- Abu, when deciding the next product slice.

## Goals

- Replace stale pending entries in `docs/05-our-architecture/06-dashboard/README.md`
  with evidence-backed statuses.
- Keep Walrus Sites mirror marked pending unless verified otherwise.
- Update Context Engineering status/index/log for the cleanup.
- Add a structure test that fails if the dashboard README again says core built
  routes are pending.

## Non-goals

- Do not change dashboard runtime behavior.
- Do not claim live wallet-popup proof.
- Do not claim Walrus Sites mirror deployment.
- Do not rewrite historical design rationale unrelated to status truth.

## Requirements

- R1: Dashboard README implementation status must distinguish built route/API
  surfaces from pending deploy/mirror follow-ups.
- R2: Current route status must cover local dashboard, hosted dashboard, public
  verifier, recipient capability view, share history, and browser smoke.
- R3: Structure tests must guard against stale pending status for built dashboard
  routes.
- R4: Context Engineering artifacts and wiki/log must record the cleanup.

## Acceptance Criteria

- AC1: `pnpm test:structure` passes.
- AC2: A repository search for pending status in the dashboard README does not
  identify built local/hosted routes as pending.
- AC3: The cleanup has a verification artifact with command evidence.
- AC4: No product source behavior changes are required for this docs slice.

## Constraints

- The repo is already dirty from earlier work; do not revert unrelated changes.
- Docs-only cleanup requires `pnpm test:structure` at minimum.
- Use repo-local `.thoughts/` artifacts only.

## Stories Needed

- Developer reads the dashboard README and sees accurate built/pending status.
- Agent runs structure tests and catches stale dashboard pending-route claims.

## Open Questions

- Whether a later release-readiness slice should convert the broader historical
  architecture docs into explicitly versioned snapshots.

## Source References

- `.thoughts/research/2026-06-17-dashboard-status-refresh.md`
- `.thoughts/wiki/context-engineering-status.md`
- `docs/05-our-architecture/06-dashboard/purpose-local-vs-hosted.md`
- `packages/dashboard/app/`
- `apps/hosted-dashboard/app/`
