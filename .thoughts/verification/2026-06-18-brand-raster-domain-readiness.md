# Verification Audit: Brand Raster And Domain Readiness

## Verdict

Pass.

The brand package now contains platform-ready PNG exports beside the existing
SVG source assets, and CI-friendly structure tests verify the PNG signatures and
dimensions directly from file headers. The public campaign domain remains
un-deployed: `onememe.xyz` does not currently resolve.

## Artifacts Checked

- Research: `.thoughts/research/2026-06-18-brand-raster-domain-readiness.md`
- Plan: `.thoughts/plans/2026-06-18-brand-raster-domain-readiness.md`
- Previous brand verification:
  `.thoughts/verification/2026-06-18-brand-assets-package-readiness.md`
- Package docs: `packages/brand/README.md`
- Current marketing docs:
  `docs/05-our-architecture/07-marketing-and-docs/README.md`
- Source assets: `packages/brand/og-images/*.svg`
- PNG exports: `packages/brand/og-images/*.png`
- Guardrail: `tests/structure/brand-assets.test.ts`
- Domain checks: `curl` and `dig` output for `onememe.xyz`

## Requirement Traceability

| Requirement | Evidence |
|---|---|
| Add PNG exports for social/OG assets | Added `x-banner.png`, `discord-banner.png`, `github-og.png`, `product-card.png`, and `demo-video-cover.png` under `packages/brand/og-images/`. |
| Preserve SVG source of truth | SVG files remain present beside PNG exports; README says SVGs are the design source and PNGs are upload artifacts. |
| Verify raster dimensions without platform-specific dependencies | `tests/structure/brand-assets.test.ts` reads PNG signature and IHDR width/height directly from bytes. |
| Include PNGs in package contents | `pnpm --filter @onemem/brand pack --dry-run` listed all five PNG files. |
| Record domain truth honestly | `packages/brand/README.md` and marketing docs say `onememe.xyz` is not live yet; research records `curl` DNS failures and empty `dig` results. |

## Acceptance Criteria Coverage

| Acceptance Criteria | Evidence |
|---|---|
| Brand package has source SVGs and platform-ready PNGs | File inventory and dry-pack contents include both formats. |
| PNG dimensions match checklist | `file` and `sips` reported expected dimensions; structure tests assert dimensions from PNG headers. |
| DNS/hosting state is not overclaimed | `curl -I` for `https://onememe.xyz` and `http://onememe.xyz` failed with `Could not resolve host`; `dig` returned no A/AAAA records. |
| Existing brand asset guardrail remains under shard cap | `tests/structure/brand-assets.test.ts` is 115 lines, below the 300-line structure shard cap. |

## Quality Gates

- `mise exec -- pnpm exec tsx --test tests/structure/brand-assets.test.ts`
  - Pass: 5 tests, 0 failures.
- `mise exec -- pnpm test:structure`
  - Pass: 420 tests, 35 suites, 0 failures.
- `mise exec -- pnpm --filter @onemem/brand lint`
  - Pass.
- `mise exec -- pnpm --filter @onemem/brand pack --dry-run`
  - Pass; tarball contents included SVG and PNG brand assets.
- `file packages/brand/og-images/*.png`
  - Pass; reported PNG image data with expected dimensions.
- `sips -g pixelWidth -g pixelHeight packages/brand/og-images/*.png`
  - Pass; dimensions matched the checklist.
- `git diff --check`
  - Pass.
- Visual smoke:
  - Opened `packages/brand/og-images/x-banner.png`; logo, motto, domain, and
    handle rendered visibly without cropping.

## Deviations From Plan

- No DNS records were changed. The plan scoped DNS to verification only.
- No video or animated bumper was rendered.
- No cross-platform PNG generation script was added. The committed PNG files
  are the platform deliverables, and tests validate the committed bytes without
  requiring `sips` in CI.

## Gaps And Risks

- `onememe.xyz` still needs DNS and hosting before it can be used as a live URL.
- Final submission may require additional image or video dimensions that are not
  in the current brand checklist.
- PNGs are generated outputs. If SVGs change, the PNGs must be regenerated in
  the same change.

## Follow-ups

- Configure DNS/hosting for `onememe.xyz`, then update the domain status after
  `curl` and `dig` prove it.
- Render the 10-second animated bumper from the existing storyboard when video
  requirements are known.
- Consider adding a cross-platform raster export script later if PNG
  regeneration becomes frequent.

## Evidence Log

- `sips` rendered the PNG files from their SVG sources locally.
- A focused test failure caught a case-sensitive README assertion; the guardrail
  was corrected and then passed.
- `pnpm pack --dry-run` generated `onemem-brand-0.1.0.tgz`; the generated
  tarball was removed after inspection and is not part of the source change.
