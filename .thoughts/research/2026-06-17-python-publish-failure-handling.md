# Reality Research: Python Publish Failure Handling

## Scope

Audit the release workflow and publish script for Python/PyPI package publishing
behavior, especially whether CI can falsely pass when `uv publish` fails.

## Sources Checked

- `.github/workflows/release.yml`
- `scripts/publish-all.sh`
- `.changeset/README.md`
- `docs/05-our-architecture/00-overview/TOOLING_DECISIONS.md`
- `uv publish --help`
- Context7 docs for `/astral-sh/uv`:
  - `uv publish command CI token dry-run check-url failure behavior`
  - `uv publish --check-url skip duplicate uploads existing files`

## Verified Facts

- The release workflow runs `bash scripts/publish-all.sh python` when
  `steps.changesets.outputs.published == 'true'`.
- The workflow sets `UV_PUBLISH_TOKEN` from `${{ secrets.PYPI_TOKEN }}`.
- `scripts/publish-all.sh` loops over all six Python packages.
- The current Python publish command is:
  `(cd "$pkg" && uv build && uv publish || echo "  (skeleton — uv publish wiring lands in Pillar 2)")`.
- Because the `uv build && uv publish` chain is followed by `|| echo`, a real
  publish failure can be converted into a successful subshell command.
- `uv publish --help` shows supported auth/env behavior:
  `UV_PUBLISH_TOKEN`, `UV_PUBLISH_USERNAME`, `UV_PUBLISH_PASSWORD`, and
  `UV_PUBLISH_URL`.
- `uv publish --help` also shows `--dry-run` and `--check-url`.
- Current uv docs say `uv publish` uploads built distributions, can use
  environment credentials, and supports dry runs.
- Current uv docs say if `uv publish` fails mid-upload, the command can be
  retried; for PyPI, existing identical files are ignored. For other registries,
  `--check-url <index url>` can skip already-present identical files.
- `.changeset/README.md` says the Python publish script reads note metadata, but
  `scripts/publish-all.sh` does not parse changeset notes.
- `TOOLING_DECISIONS.md` references `python scripts/publish-python.py`, but no
  such script exists in the repo.

## Inferences

- The publish script should fail honestly when `uv publish` fails, instead of
  treating PyPI publishing as a skeleton.
- The script can remain simple and publish all Python packages because PyPI can
  ignore already-uploaded identical files; a changed artifact for an existing
  version should fail.
- A dry-run mode is useful for local/CI verification without uploading packages.
- Docs should describe the actual `publish-all.sh` behavior rather than a
  missing `publish-python.py` or unimplemented changeset metadata parsing.

## Unknowns And Questions

- Whether the team wants trusted publishing instead of `PYPI_TOKEN` remains a
  separate release-infra decision.
- This pass does not verify live PyPI credentials or perform real uploads.

## Not Included

- PyPI publishing.
- Version bumps.
- Changeset parser implementation.
- Npm publish behavior changes.
