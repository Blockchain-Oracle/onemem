# Reality Research: Package License Inclusion

## Scope

Audit publishable `@onemem/*` JavaScript packages for whether their npm
tarballs include the Apache-2.0 license file claimed by package metadata and
`files` allowlists.

## Sources Checked

- Root `LICENSE`
- `packages/*/package.json`
- `find packages -maxdepth 2 -name LICENSE -print`
- Node manifest scan over:
  - `packages/brand`
  - `packages/cli-ts`
  - `packages/dashboard`
  - `packages/mcp-server`
  - `packages/plugin-claude-code`
  - `packages/plugin-codex`
  - `packages/plugin-openclaw`
  - `packages/provider-openai-agents`
  - `packages/provider-vercel-ai`
  - `packages/sdk-ts`
- Representative dry-pack checks:
  - `npm pack --dry-run --json` in `packages/sdk-ts`
  - `npm pack --dry-run --json` in `packages/provider-vercel-ai`

## Verified Facts

- The root repo license is Apache License, Version 2.0.
- The ten publishable JavaScript `@onemem/*` package manifests list
  `"license": "Apache-2.0"`.
- The same ten manifests include `"LICENSE"` in their `files` allowlist.
- `find packages -maxdepth 2 -name LICENSE -print` returned no package-local
  license files.
- The manifest scan printed `files_has_LICENSE=true` and
  `local_LICENSE=false` for all ten JavaScript packages.
- `npm pack --dry-run --json` for `@onemem/sdk-ts@0.6.0` produced a tarball
  file list containing `README.md`, `bin/*`, `dist/*`, and `package.json`, but
  no `LICENSE`.
- `npm pack --dry-run --json` for `@onemem/vercel-ai-provider@0.1.1` produced a
  tarball file list containing `README.md`, `dist/*`, and `package.json`, but
  no `LICENSE`.

## Inferences

- The `files` allowlist entries express an intended release artifact, but npm
  cannot include package-local files that do not exist.
- A package-local full license file is safer than a pointer to the repo root,
  because npm tarballs are consumed outside the monorepo checkout.
- A structure guard can catch future publishable JS packages that list
  `LICENSE` but omit the package-local file.

## Unknowns And Questions

- This pass does not audit Python package source distributions or wheels.
- This pass does not prove every npm package has fully built `dist/` artifacts;
  it is scoped to license-file inclusion.

## Not Included

- Version bumps.
- npm publishing.
- Changes to package runtime code.
- SPDX header insertion across source files.
