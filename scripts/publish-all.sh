#!/usr/bin/env bash
# Publish flow that handles TS (Changesets/npm) + Python (uv/PyPI) in one pass.
# Called by .github/workflows/release.yml after the Changesets PR merges.
#
# Usage: bash scripts/publish-all.sh [ts|python|all]
# Default: all

set -euo pipefail

MODE="${1:-all}"
cd "$(dirname "$0")/.."

if [[ "$MODE" == "ts" || "$MODE" == "all" ]]; then
  echo "==> Publishing TS packages via Changesets..."
  pnpm changeset publish
fi

if [[ "$MODE" == "python" || "$MODE" == "all" ]]; then
  echo "==> Publishing Python packages to PyPI..."
  for pkg in packages/sdk-python packages/cli-python packages/plugin-hermes packages/provider-crewai packages/provider-livekit packages/provider-elevenlabs; do
    if [[ -f "$pkg/pyproject.toml" ]]; then
      echo "  publishing $pkg"
      (cd "$pkg" && uv build && uv publish || echo "  (skeleton — uv publish wiring lands in Pillar 2)")
    fi
  done
fi
