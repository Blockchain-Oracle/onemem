# Reality Research: Brand Raster And Domain Readiness

## Scope

Check whether the new OneMem brand package has platform-ready raster assets and
whether the active public campaign domain `onememe.xyz` resolves today.

## Sources Checked

- `git status --short --branch`
- `find packages/brand -maxdepth 3 -type f -print | sort`
- `packages/brand/package.json`
- `packages/brand/README.md`
- `tests/structure/brand-assets.test.ts`
- `curl -I --max-time 10 https://onememe.xyz`
- `curl -I --max-time 10 http://onememe.xyz`
- `dig +short onememe.xyz A`
- `dig +short onememe.xyz AAAA`
- `dig +short www.onememe.xyz A`
- Local tool availability: `sips` is available at `/usr/bin/sips`

## Verified Facts

- The worktree started clean on `pillar-3-plugins` at commit `2f6d061`.
- `packages/brand/package.json` exports `./og-images/*` and includes the
  `og-images` directory in package files.
- `packages/brand/og-images/` currently contains five SVG source assets:
  `x-banner.svg`, `discord-banner.svg`, `github-og.svg`,
  `product-card.svg`, and `demo-video-cover.svg`.
- `packages/brand/og-images/` does not currently contain committed PNG exports.
- `tests/structure/brand-assets.test.ts` currently verifies SVG existence,
  dimensions, and identity strings, but does not verify PNG raster files.
- Both `curl` checks for `https://onememe.xyz` and `http://onememe.xyz` fail
  with `Could not resolve host: onememe.xyz`.
- `dig` returns no A records for `onememe.xyz`, no AAAA records for
  `onememe.xyz`, and no A records for `www.onememe.xyz`.
- The local macOS `sips` command can render SVG files to PNG for this checkout.

## Inferences

- The brand package is ready as a source-asset package, but not yet as a
  platform-upload package because the expected PNG files are absent.
- Committing deterministic PNG exports under the existing `og-images` export
  path will make the package immediately usable for X, Discord/community,
  GitHub/OG, product-card, and demo-cover uploads.
- CI should validate PNG existence and dimensions from PNG file headers rather
  than requiring `sips`, `sharp`, or another raster dependency.
- `onememe.xyz` can remain the campaign identity in source assets, but docs
  should not claim it is live until DNS resolves.

## Unknowns And Questions

- Whether the final Sui Overflow submission form has additional image/video
  dimensions beyond the current brand checklist.
- Which hosting provider or DNS registrar owns `onememe.xyz`.
- Whether `www.onememe.xyz` should redirect to the apex once DNS is configured.

## Not Included

- No DNS records were created or changed.
- No social account was created.
- No video or animated bumper was rendered.
