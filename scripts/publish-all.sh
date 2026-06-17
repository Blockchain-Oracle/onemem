#!/usr/bin/env bash
# Publish flow that handles TS (Changesets/npm) + Python (uv/PyPI) in one pass.
# Called by .github/workflows/release.yml after the Changesets PR merges.
#
# Usage: bash scripts/publish-all.sh [ts|python|all]
# Default: all
#
# Set PUBLISH_ALL_DRY_RUN=1 to build packages and run `uv publish --dry-run`
# without uploading artifacts.

set -euo pipefail

MODE="${1:-all}"
cd "$(dirname "$0")/.."

case "$MODE" in
  ts | python | all) ;;
  *)
    echo "ERROR: expected mode ts, python, or all; got: $MODE" >&2
    exit 2
    ;;
esac

if [[ "$MODE" == "ts" || "$MODE" == "all" ]]; then
  echo "==> Publishing TS packages via Changesets..."
  pnpm changeset publish
fi

if [[ "$MODE" == "python" || "$MODE" == "all" ]]; then
  publish_args=()
  if [[ "${PUBLISH_ALL_DRY_RUN:-0}" == "1" ]]; then
    publish_args+=(--dry-run --trusted-publishing never)
    echo "==> Dry run enabled: uv publish will not upload artifacts."
  fi

  echo "==> Publishing Python packages to PyPI..."
  for pkg in packages/sdk-python packages/cli-python packages/plugin-hermes packages/provider-crewai packages/provider-livekit packages/provider-elevenlabs; do
    if [[ -f "$pkg/pyproject.toml" ]]; then
      echo "  publishing $pkg"
      rm -rf "$pkg/dist"
      uv build "$pkg" --out-dir "$pkg/dist" --clear
      uv publish "${publish_args[@]}" "$pkg"/dist/*
    fi
  done
fi
