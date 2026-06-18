# Verification Audit: Ship-Readiness Go, Brand Copy, And Vendor Logos

## Verdict

Conditional pass.

The repo now has a replacement ship-readiness Go prompt, active public copy leads
with decentralized persistent memory for AI agents, and the brand package
vendor-logo export is covered by structure tests. Registry publication and
Vercel deployment remain blocked by missing or invalid auth and are not claimed.

## Artifacts Checked

- Plan: `.thoughts/plans/2026-06-18-ship-readiness-go.md`
- Research: `.thoughts/research/2026-06-18-onemem-product-code-audit.md`
- Research: `.thoughts/research/2026-06-18-vendor-logo-inventory.md`
- Quality profile: `.thoughts/quality/2026-06-17-project-quality-profile.md`
- Active copy surfaces: `apps/landing`, `apps/docs`, `packages/brand`
- Brand package manifest and vendor logo inventory.
- Vercel documentation fetched through Context7 on 2026-06-18.

## Requirement Traceability

| Requirement | Evidence |
| --- | --- |
| Replace the loose "Go" with a concrete autonomous operating prompt | Added `.thoughts/plans/2026-06-18-ship-readiness-go.md` with phases for truth audit, release, deployment, trust proofs, product/demo readiness, checks, and stop conditions. |
| Lead with memory-first positioning | Landing metadata, hero, docs introduction, quickstart description, brand README, and social SVG/PNG assets now lead with decentralized/persistent memory instead of "Etherscan for AI agents" or "Stop trusting agents." |
| Keep verification as a support capability | Landing still describes Merkle-chain proof, replay, and share flows, but not as the primary product category. |
| Make vendor-logo export honest | `@onemem/brand` exports `./vendor-logos/*`; README documents usage rules; manifest maps assets to checked-in files and sources. |
| Avoid growing active app files past preferred size | `apps/landing/app/page.tsx` was split into `apps/landing/app/landing-content.ts`; page file is 261 lines. |
| Do not claim publication/deployment without proof | Auth checks show no exported publish tokens, no GitHub repo secrets/variables, invalid local npm token, and no local Vercel auth/project link. |

## Acceptance Criteria Coverage

| Acceptance Criterion | Coverage |
| --- | --- |
| Current status is audited, not guessed | `git status`, `gh run list`, `registry:status`, `release:preflight`, and safe auth probes were run. |
| Active stale slogans are gone | `rg -n "Etherscan for AI agents|Stop trusting|Start verifying|Stop trusting agents|Verify them|onemem\\.ai marketing" apps/landing apps/docs packages/brand -g '!node_modules' -g '!\\.next'` returned no matches. |
| Landing UI is visually checked | Chrome loaded `http://localhost:3000`; DOM audit found title `OneMem - Decentralized persistent memory for AI agents`, H1 `One memory layer for every agent runtime.`, and no stale slogans. Screenshot was inspected. |
| Vendor-logo package surface is guarded | `tests/structure/brand-assets.test.ts` validates package exports, README, manifest fields, required ecosystem IDs, SVG structure, PNG signatures, and checked-in file paths. |
| Registry publication is not over-claimed | `pnpm registry:status` still reports missing/drifted npm and PyPI packages. |
| Deployment is not over-claimed | Vercel docs were fetched, but no Vercel auth/project link exists locally, so no deployment claim is made. |

## Quality Gates

- `mise exec -- pnpm --filter @onemem/brand lint` - pass.
- `mise exec -- pnpm --filter @onemem/landing lint` - pass.
- `mise exec -- pnpm --filter @onemem/landing typecheck` - pass.
- `mise exec -- pnpm --filter @onemem/landing build` - pass.
- `mise exec -- pnpm test:structure` - pass, 426/426 tests.
- `mise exec -- pnpm registry:status` - pass as read-only status; reports missing/drifted packages.
- `mise exec -- pnpm release:preflight` - pass as read-only preflight; reports missing npm/PyPI auth gates.
- `git diff --check` - pass.

## Deviations From Plan

- Registry publication was not attempted because safe probes showed no valid npm/PyPI publish auth. `~/.npmrc` contains an npm auth token line, but `npm whoami --registry=https://registry.npmjs.org/` returned 401 Unauthorized.
- Vercel deployment was not attempted because `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `~/.vercel/auth.json`, and local `.vercel/project.json` are absent.
- Live Codex/Claude hook and hosted wallet proofs were not attempted in this slice; they remain separate proof work.

## Gaps And Risks

- npm packages still missing or drifted: `@onemem/brand`, `@onemem/cli`, `@onemem/dashboard`, `@onemem/claude-code-plugin`, `@onemem/codex-plugin`, `@onemem/openai-agents`, and `@onemem/vercel-ai-provider`.
- PyPI packages still missing or drifted: `onemem-cli`, `hermes-onemem`, `onemem-crewai`, `onemem-elevenlabs`, `onemem-livekit`, and `onemem-sdk-python`.
- Vercel deployment needs login/project linking or CI `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`.
- Custom DNS for `onememe.xyz` is still unclaimed until DNS resolves and serves a deployed app.
- Chrome console showed warnings from an installed extension content script, not app page errors.

## Follow-ups

1. Restore valid npm/PyPI publishing credentials or configure trusted publishing, then publish and prove with strict registry status.
2. Link Vercel projects from the monorepo root or provide CI project IDs, deploy previews, verify URLs, then deploy production.
3. Run live trusted Codex/Claude hook proofs only when the runtime trust step is available, and record the on-chain `TraceSession`.
4. Continue hosted wallet/Enoki/MemWal proof only with real hosted config.
5. Prepare final demo/submission video and label mocked demo harness boundaries.

## Evidence Log

- Latest remote check: `gh run list -R Blockchain-Oracle/onemem --limit 12` showed latest `Verify historical trace packages` CI and Release runs successful on `main`.
- npm auth check: no `NPM_TOKEN` or `NODE_AUTH_TOKEN`; local `~/.npmrc` has a token line but `npm whoami` returned 401.
- PyPI auth check: no `PYPI_TOKEN`, no `UV_PUBLISH_TOKEN`, and no local PyPI auth config found.
- GitHub secrets/variables: `gh secret list` and `gh variable list` returned no names for this repo.
- Vercel auth check: no Vercel env token/project IDs and no local Vercel auth/project files.
- Context7 Vercel docs: monorepo docs recommend linking from repo root with `vercel link --repo`; CLI docs recommend preview deploy, verify, production deploy, and domain inspection before claiming production/custom domains.
