# Verification Audit: Walrus Sites Deploy Readiness

## Verdict

Pass.

The Walrus Sites deployment path is no longer a no-op skeleton. It now validates
a real static artifact and calls `site-builder` only when prerequisites are met.
The docs and workflow no longer rely on the invalid `next export -o out` command
path. Live Walrus deployment remains intentionally unclaimed.

## Artifacts Checked

- `.thoughts/research/2026-06-18-walrus-sites-deploy-readiness.md`
- `.thoughts/plans/2026-06-18-walrus-sites-deploy-readiness.md`
- `scripts/deploy-walrus-sites.sh`
- `.github/workflows/deploy-walrus-sites.yml`
- `apps/hosted-dashboard/walrus-sites/README.md`
- `apps/hosted-dashboard/walrus-sites/sites-config.yaml`
- `docs/05-our-architecture/06-dashboard/README.md`
- `docs/05-our-architecture/06-dashboard/purpose-local-vs-hosted.md`
- `docs/05-our-architecture/06-dashboard/walrus-sites-mirror.md`
- `tests/structure/deploy-scripts.test.ts`

## Requirement Traceability

- R1: Replace the no-op deploy skeleton.
  - Evidence: `scripts/deploy-walrus-sites.sh` now parses arguments, validates
    `index.html`, rejects the repo root, prints the `site-builder` command, and
    executes `site-builder` in deploy mode.
- R2: Remove the known-broken `next export -o out` workflow command.
  - Evidence: `.github/workflows/deploy-walrus-sites.yml` now runs the hosted
    production build, validates a prebuilt static artifact through the deploy
    script, and deploys only from the requested `dist` input.
- R3: Keep live mirror status honest.
  - Evidence: dashboard docs now say the deploy wrapper is built while live
    `site-builder` URL and full static mirror remain pending.
- R4: Add structure guardrails.
  - Evidence: `tests/structure/deploy-scripts.test.ts` checks that the script is
    not a skeleton, validates artifacts, calls `site-builder`, and that the
    workflow no longer uses `next export -o out`.

## Acceptance Criteria Coverage

- AC1: Valid static artifacts pass preflight.
  - Evidence:
    `tmp=$(mktemp -d); printf '<!doctype html><title>OneMem</title>\n' > "$tmp/index.html"; bash scripts/deploy-walrus-sites.sh --check --dist "$tmp" --epochs 2 --context testnet`
    passed and printed `site-builder --context=testnet deploy --epochs 2`.
- AC2: Dry-run can include an existing site object ID.
  - Evidence:
    `bash scripts/deploy-walrus-sites.sh --dry-run --dist "$tmp" --epochs 3 --context mainnet --object-id 0x123`
    passed and printed `--object-id 0x123`.
- AC3: Missing default artifact fails loudly.
  - Evidence: `bash scripts/deploy-walrus-sites.sh --check` failed with
    `ERROR: static artifact directory not found:
    /Users/abu/dev/hackathon/sui-overflow/onemem/apps/hosted-dashboard/out`.
- AC4: Existing hosted dashboard production build remains valid.
  - Evidence: `mise exec -- pnpm --filter @onemem/hosted-dashboard build`
    passed.
- AC5: Structure tests pass.
  - Evidence: `mise exec -- pnpm test:structure` passed 415 tests.

## Quality Gates

- `npx ctx7@latest library "Walrus" "Walrus Sites site-builder CLI deploy static website"`
  - Passed; selected `/mystenlabs/walrus`.
- `npx ctx7@latest docs /mystenlabs/walrus "Walrus Sites site-builder CLI deploy static website config epochs"`
  - Passed; confirmed `site-builder deploy --epochs <N> <DIRECTORY>` shape.
- `npx ctx7@latest docs /vercel/next.js/v15.1.11 "Next.js static export App Router output export API routes dynamic route generateStaticParams next export removed"`
  - Passed; confirmed dynamic routes need static params for static output.
- `mise exec -- pnpm --filter @onemem/hosted-dashboard build`
  - Passed.
- `mise exec -- pnpm --filter @onemem/hosted-dashboard exec next export -o out`
  - Failed as expected with `unknown option '-o'`; this is the broken command
    removed from the workflow.
- `mise exec -- pnpm exec tsx --test tests/structure/deploy-scripts.test.ts tests/structure/docs-frameworks.test.ts`
  - Passed: 22 tests.
- `mise exec -- pnpm test:structure`
  - Passed: 415 tests, 34 suites, 0 failures.
- `bash -n scripts/deploy-walrus-sites.sh`
  - Passed.
- `git diff --check`
  - Passed.
- Line counts:
  - `scripts/deploy-walrus-sites.sh`: 125 lines.
  - `tests/structure/deploy-scripts.test.ts`: 148 lines.
  - `docs/05-our-architecture/06-dashboard/walrus-sites-mirror.md`: 165 lines.

## Deviations From Plan

None.

## Gaps And Risks

- No live Walrus Sites deployment was performed.
- No `site-builder` binary or funded Sui/WAL environment was proven in this
  local shell.
- The hosted dashboard is still partly server-backed; a full static mirror
  requires a separate architecture/implementation slice.

## Follow-ups

- Decide whether the mirror should be a full static dashboard rewrite or a
  smaller public verifier shell.
- Produce a real static artifact at `apps/hosted-dashboard/out` or pass a custom
  `--dist`.
- Run the workflow in the configured Walrus environment and record the returned
  `<hash>.wal.app` URL.

## Evidence Log

```text
npx ctx7@latest library "Walrus" "Walrus Sites site-builder CLI deploy static website"
npx ctx7@latest docs /mystenlabs/walrus "Walrus Sites site-builder CLI deploy static website config epochs"
npx ctx7@latest docs /vercel/next.js/v15.1.11 "Next.js static export App Router output export API routes dynamic route generateStaticParams next export removed"
mise exec -- pnpm --filter @onemem/hosted-dashboard build
mise exec -- pnpm --filter @onemem/hosted-dashboard exec next export -o out
bash scripts/deploy-walrus-sites.sh --check --dist "$tmp" --epochs 2 --context testnet
bash scripts/deploy-walrus-sites.sh --dry-run --dist "$tmp" --epochs 3 --context mainnet --object-id 0x123
bash scripts/deploy-walrus-sites.sh --check
mise exec -- pnpm exec tsx --test tests/structure/deploy-scripts.test.ts tests/structure/docs-frameworks.test.ts
mise exec -- pnpm test:structure
bash -n scripts/deploy-walrus-sites.sh
git diff --check
```
