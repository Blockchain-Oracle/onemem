# Reality Research: Python Package License Inclusion

## Scope

Audit publishable OneMem Python packages for whether their built PyPI artifacts
include license files, not only license metadata.

## Sources Checked

- Root `LICENSE`
- `packages/*/pyproject.toml`
- `find packages -maxdepth 2 -name LICENSE -print`
- `uv build <package> --out-dir /tmp/onemem-py-license-audit`
- Archive inspection of generated wheels and sdists under
  `/tmp/onemem-py-license-audit`
- Metadata inspection of generated wheel `METADATA` and sdist `PKG-INFO`

## Verified Facts

- The root repo license is Apache License, Version 2.0.
- Six Python packages exist in the uv workspace:
  - `packages/sdk-python`
  - `packages/cli-python`
  - `packages/plugin-hermes`
  - `packages/provider-crewai`
  - `packages/provider-livekit`
  - `packages/provider-elevenlabs`
- Each Python package `pyproject.toml` declares
  `license = { text = "Apache-2.0" }`.
- Each Python package uses Hatchling as its build backend.
- `find packages -maxdepth 2 -name LICENSE -print` returned only the ten JS
  package-local licenses added by the previous npm slice; no Python package
  had a package-local `LICENSE`.
- `uv build` succeeded for all six Python packages and generated both wheels
  and source distributions.
- Archive inspection found no `LICENSE` entries in any of the six wheels or six
  source distributions.
- Metadata inspection found `License: Apache-2.0` in each generated wheel
  `METADATA` and sdist `PKG-INFO`.

## Inferences

- The Python artifacts currently carry Apache-2.0 metadata but do not include
  the full license text as an archive file.
- Adding package-local `LICENSE` files is likely the smallest fix consistent
  with the npm package license inclusion slice.
- Built artifact inspection must be rerun after the fix because metadata alone
  is not strong enough evidence that license text ships.

## Unknowns And Questions

- This pass does not audit external PyPI project settings or already published
  artifacts.
- This pass does not decide whether the project should migrate from legacy
  `license = { text = ... }` to newer SPDX-style metadata.

## Not Included

- PyPI publishing.
- Version bumps.
- Runtime code changes.
- Source header insertion across Python files.
