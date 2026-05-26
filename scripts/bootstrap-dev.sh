#!/usr/bin/env bash
# One-shot dev environment setup. Run after `git clone`.
#
# Usage: bash scripts/bootstrap-dev.sh

set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Installing toolchain via mise..."
mise install

echo "==> Installing TS workspace deps..."
pnpm install

echo "==> Installing Python workspace deps..."
uv sync

echo "==> Registering git hooks..."
pnpm exec lefthook install

echo ""
echo "✓ Bootstrap complete."
echo ""
echo "Next:"
echo "  pnpm dev               # run all dev servers"
echo "  pnpm test              # run all tests"
echo "  cd contracts/onemem && sui move build && sui move test"
