# Plan: OneMem Ship-Readiness Go

## Inputs

- Repo-local Context Engineering artifacts in `.thoughts/`.
- Project quality profile: `.thoughts/quality/2026-06-17-project-quality-profile.md`.
- Current status/wiki: `.thoughts/wiki/context-engineering-status.md` and `.thoughts/wiki/project-map.md`.
- Registry status scripts: `pnpm registry:status` and `pnpm release:preflight`.
- Vercel deployment docs fetched with Context7 on 2026-06-18.
- User direction: do not expand optional Walrus/static verifier work; prioritize release, public deploy, trust proofs, product copy, and demo readiness.

## Assumptions

- `.thoughts/` is the local project context root.
- `~/thoughts` is not used for this project.
- Simulated tests are useful only when labeled simulated; public claims require real execution evidence.
- Live publish/deploy actions are allowed when credentials are valid, but secrets must never be printed.
- If credentials are missing or invalid, harden status and docs instead of claiming publication or deployment.

## Open Questions

- Which Vercel team/project should own `apps/landing`, `apps/docs`, and `apps/hosted-dashboard` once Vercel auth exists?
- Which custom domains should map to each app: `onememe.xyz`, `app.onememe.xyz`, `docs.onememe.xyz`, or the older `onemem.ai` names?
- Whether hosted wallet flows should use Enoki-only, wallet-only, or both for the final demo.

## Phase 1: Truth Audit

### Goal

Establish exactly what is committed, green in CI, locally modified, missing from registries, and blocked by auth.

### Work

- Run `git status --short --branch`.
- Inspect latest GitHub Actions runs.
- Run `pnpm test:structure`, `pnpm registry:status`, and `pnpm release:preflight` when the repo state changes.
- Separate remote-green work from local WIP.

### Checks

- Latest CI/Release status is recorded.
- Local WIP files are named explicitly.
- Registry drift and auth blockers are recorded without exposing secrets.

### Acceptance Criteria Covered

- No hallucinated status.
- No deployment, registry, hook, wallet, or demo proof is claimed without evidence.

### Stop Condition

The next implementation slice has an explicit evidence baseline.

## Phase 2: Release And Publication

### Goal

Publish missing or drifted npm/PyPI packages when auth is valid; otherwise preserve a precise blocker.

### Work

- Check env vars and local auth config by presence only.
- Use `npm whoami` and equivalent safe probes to prove auth works.
- Run repo publish/preflight scripts.
- Re-run `pnpm registry:status -- --strict` after publication.

### Checks

- Published versions resolve from npm/PyPI registries.
- Missing auth is recorded as a blocker, not a partial success.

### Acceptance Criteria Covered

- Public install commands are truthful.
- Claude/Codex plugin install paths are not advertised as registry-published until the registry agrees.

### Stop Condition

Registries match local package versions, or the exact auth blocker is recorded.

## Phase 3: Public Deployment

### Goal

Deploy public surfaces through Vercel when auth/project linking exists.

### Work

- Use Context7 before Vercel-specific commands.
- Link monorepo projects from the repo root with Vercel CLI, or use `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`.
- Pull project env when available.
- Deploy preview first, verify it, then production.
- Record DNS records needed for Namecheap before claiming a custom domain.

### Checks

- Vercel preview URL responds.
- Production URL responds.
- Vercel logs show no recent production errors.
- Custom domain is claimed only after DNS resolves and serves the app.

### Acceptance Criteria Covered

- Public landing/dashboard/docs URLs are real.
- DNS status is explicit.

### Stop Condition

URLs are verified live, or auth/linking/DNS blockers are recorded.

## Phase 4: Live Trust Proofs

### Goal

Turn remaining hook and wallet statements into real proof where possible.

### Work

- Prove Codex MCP package install/use path.
- Attempt trusted Codex `/hooks` session and verify it emits a real on-chain `TraceSession`.
- Prove trusted Claude Code hook smoke separately.
- Prove hosted wallet/Enoki/MemWal popup flows with real config, or keep them unclaimed.

### Checks

- On-chain session IDs and verification commands are recorded.
- Simulated tests stay labeled simulated.

### Acceptance Criteria Covered

- No automatic hook coverage claim without trusted runtime execution.
- Hosted wallet claims require real wallet/Enoki/MemWal configuration.

### Stop Condition

Live proof exists, or the precise external blocker is recorded.

## Phase 5: Product And Demo Readiness

### Goal

Make the public story memory-first and prepare demo/submission artifacts.

### Work

- Replace active product copy that leads with "Etherscan for AI agents" or "Stop trusting agents."
- Lead with decentralized persistent memory for AI agents.
- Keep verification/replay/share as support capabilities.
- Finish brand/vendor-logo assets with structure tests.
- Run demo matrix and label mocked runtimes/actions honestly.
- Prepare final demo video/submission checklist.

### Checks

- Product-copy search finds no stale active landing/docs/brand slogans.
- Brand assets pass structure tests.
- Demo harnesses pass and mocked boundaries are documented.

### Acceptance Criteria Covered

- Product narrative matches what OneMem actually is.
- Demo claims are honest and reproducible.

### Stop Condition

Active public surfaces and submission artifacts are ready, or the exact remaining blockers are listed.

## Verification Checkpoint

Before claiming this Go complete, run or record:

- `git status --short --branch`
- `mise exec -- pnpm test:structure`
- `mise exec -- pnpm registry:status`
- `mise exec -- pnpm release:preflight`
- Relevant app lint/typecheck/build commands for changed apps.
- Browser/Chrome verification for changed public UI.
- Live URL, registry, hook, wallet, and demo evidence where claimed.

## Handoff Notes

Use this as the replacement "Go" prompt:

Continue the OneMem ship-readiness run from repo-local `.thoughts/`. Audit current truth first, then publish packages if auth is valid, deploy public surfaces if Vercel auth/linking exists, close live trust proofs only with real on-chain evidence, clean active product copy to lead with decentralized persistent memory for AI agents, and prepare demo/submission assets. Use subagents for independent registry, deployment, product-copy, trust-proof, and demo audits when useful. Do not claim registry publication, DNS, hooks, wallet flows, or live demos without direct verification. Fix real errors as they appear, keep changes scoped, run the matching quality gates, and update `.thoughts/` with concise evidence.
