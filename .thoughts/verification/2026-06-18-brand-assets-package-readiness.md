# Verification Audit: Brand Assets Package Readiness

## Verdict

Pass.

The `@onemem/brand` package no longer advertises empty `logo/*` and
`og-images/*` exports. It now contains deterministic SVG source assets for the
OneMem mark, lockups, and social/OG templates, plus structure coverage that will
fail if the inventory disappears or loses the active public identity.

## Artifacts Checked

- Research: `.thoughts/research/2026-06-18-sui-overflow-brand-presence.md`
- Design input: `.thoughts/design/2026-06-18-social-brand-kit-prompt.md`
- Plan: `.thoughts/plans/2026-06-18-brand-assets-package-readiness.md`
- Brand package: `packages/brand/README.md`, `packages/brand/package.json`,
  `packages/brand/tokens.css`
- Logo assets: `packages/brand/logo/*.svg`
- Social/OG assets: `packages/brand/og-images/*.svg`
- Guardrail: `tests/structure/brand-assets.test.ts`
- Status docs: `README.md`,
  `docs/05-our-architecture/07-marketing-and-docs/README.md`
- External reference noted from Abu:
  `https://github.com/contract-hero/sui-pilot`

## Requirement Traceability

| Requirement | Evidence |
|---|---|
| Populate package-exported logo directory | Six SVG logo files added under `packages/brand/logo/`. |
| Populate package-exported OG/social directory | Five fixed-size SVG source templates added under `packages/brand/og-images/`. |
| Preserve existing app icon DNA | `onemem-mark.svg` keeps the dark cube, lime verification outline, and violet trace spine from the existing favicon/icon. |
| Record active public identity | `packages/brand/README.md` and every social SVG include `onememe.xyz` and `@OneMemAI`. |
| Keep raster boundary honest | `packages/brand/README.md` says PNG exports are generated from SVG sources when a platform requires raster uploads. |
| Prevent empty exported directories from returning | `tests/structure/brand-assets.test.ts` checks package exports, required files, SVG roots, dimensions, and identity strings. |
| Keep Context Engineering trail local | Research, plan, design input, and this audit are under repo-local `.thoughts/`. |

## Acceptance Criteria Coverage

| Acceptance Criteria | Evidence |
|---|---|
| `@onemem/brand` has usable source assets | `pnpm --filter @onemem/brand pack --dry-run` included every new logo and social SVG in the tarball contents. |
| SVG sources are structurally valid | `xmllint --noout` passed across `packages/brand/logo/*.svg` and `packages/brand/og-images/*.svg`. |
| New guardrail passes alone | `mise exec -- pnpm exec tsx --test tests/structure/brand-assets.test.ts` passed 4/4 tests. |
| Repo structure remains clean | `mise exec -- pnpm test:structure` passed 419/419 tests across 35 suites. |
| Package lint remains clean | `mise exec -- pnpm --filter @onemem/brand lint` passed. |
| Diff formatting is clean | `git diff --check` passed. |
| Visual smoke catches obvious layout failure | `sips` rendered `product-card.svg`, `onemem-lockup-dark.svg`, `onemem-lockup-light.svg`, and `onemem-lockup-horizontal.svg`; the dark lockup crop found during smoke was fixed and re-rendered cleanly. |
| Line-count rule remains satisfied | `tests/structure/brand-assets.test.ts` is 84 lines; touched docs/plans are below the enforced caps. |

## Quality Gates

- `mise exec -- pnpm exec tsx --test tests/structure/brand-assets.test.ts`
  - Pass: 4 tests, 0 failures.
- `mise exec -- pnpm test:structure`
  - Pass: 419 tests, 35 suites, 0 failures.
- `mise exec -- pnpm --filter @onemem/brand lint`
  - Pass.
- `mise exec -- pnpm --filter @onemem/brand pack --dry-run`
  - Pass; tarball contents included `logo/` and `og-images/` assets.
- `find packages/brand/logo packages/brand/og-images -name '*.svg' -print0 | xargs -0 xmllint --noout`
  - Pass.
- `git diff --check`
  - Pass.
- `sips -s format png ...`
  - Pass for product card and lockup SVG render smokes.

## Deviations From Plan

- The slice shipped SVG source assets, not final PNG exports. This matches the
  plan assumption that deterministic SVG is the source of truth. PNG generation
  remains platform-specific output.
- The dashboard inline lockbox mark was not replaced. The current slice only
  made the brand package honest and publishable; UI consolidation is a separate
  visual consistency pass.
- No social account creation, DNS deployment, or live website deployment was
  performed.

## Gaps And Risks

- `onememe.xyz` DNS/hosting is not verified in this slice.
- Final Sui Overflow submission may require raster uploads or video assets; this
  slice provides source templates but does not export and commit PNG/video
  deliverables.
- Wordmark SVGs use live text with fallback font families. If the final identity
  needs exact glyph outlines, export outlined SVGs from a design tool later.

## Follow-ups

- Generate final PNG exports from these SVG sources when the exact platform
  dimensions and upload requirements are known.
- Decide whether the dashboard inline lockbox glyph should be replaced with the
  canonical cube mark.
- Confirm DNS/hosting for `onememe.xyz` and update docs that still deliberately
  refer to historical `onemem.ai` placeholders.

## Evidence Log

- `sui-pilot` reference checked through GitHub CLI and raw README. It is useful
  as an external Sui doc-first plugin reference, not a new OneMem dependency.
- Initial structure test run failed because two social SVGs missed one of the
  public identifiers. Assets were fixed and the guardrail then passed.
- Initial dark-lockup render cropped the motto line. The caption sizing was
  reduced and the rendered lockup was rechecked successfully.
