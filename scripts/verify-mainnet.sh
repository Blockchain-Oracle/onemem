#!/usr/bin/env bash
# Smoke test against a deployed OneMem package.
#
# Usage: bash scripts/verify-mainnet.sh [testnet|mainnet]
#
# v0.1 scope: this is a LIGHTWEIGHT smoke test. It verifies:
#   1. The package ID recorded in MAINNET_DEPLOY.md exists on the target network
#   2. The OneMemRegistry shared object exists + is readable
#   3. The version-as-dynamic-field upgrade pattern is in place (registry's
#      version dynamic field reads cleanly)
#
# Full end-to-end verification (mint namespace → open session → emit call →
# walk Merkle chain → assert root) is a Pillar 2 SDK integration test —
# building a multi-step PTB in raw bash + sui CLI is brittle vs doing it
# through the TypeScript SDK once that ships.

set -euo pipefail

NETWORK="${1:-testnet}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NETWORKS_JSON="$REPO_ROOT/config/networks.json"

if [ ! -f "$NETWORKS_JSON" ]; then
  echo "ERROR: $NETWORKS_JSON does not exist."
  exit 1
fi

PACKAGE_ID="$(jq -r --arg n "$NETWORK" '.networks[$n].package_id // ""' "$NETWORKS_JSON")"
REGISTRY_ID="$(jq -r --arg n "$NETWORK" '.networks[$n].registry_id // ""' "$NETWORKS_JSON")"

if [ -z "$PACKAGE_ID" ] || [ -z "$REGISTRY_ID" ]; then
  echo "ERROR: No deployment recorded for $NETWORK in $NETWORKS_JSON"
  echo "Run \`bash scripts/deploy-contract.sh $NETWORK\` first."
  exit 1
fi

echo "==> Verifying onemem deployment on $NETWORK"
echo "  Package:  $PACKAGE_ID"
echo "  Registry: $REGISTRY_ID"
echo ""

sui client switch --env "$NETWORK" >/dev/null

# 1. Package object exists + is published.
echo "==> 1. Checking package object..."
PKG_JSON="$(sui client object "$PACKAGE_ID" --json 2>&1)" || { echo "FAIL: package not found"; exit 1; }
if ! echo "$PKG_JSON" | jq -e '.type == "package"' >/dev/null; then
  echo "FAIL: object $PACKAGE_ID is not a package"
  echo "$PKG_JSON" | jq .
  exit 1
fi
echo "    ✓ Package object readable"

# 2. Registry object exists + has the expected type.
echo "==> 2. Checking OneMemRegistry shared object..."
REG_JSON="$(sui client object "$REGISTRY_ID" --json 2>&1)" || { echo "FAIL: registry not found"; exit 1; }
REG_TYPE="$(echo "$REG_JSON" | jq -r '.content.type // empty')"
EXPECTED_REG_TYPE="${PACKAGE_ID}::registry::OneMemRegistry"
if [ "$REG_TYPE" != "$EXPECTED_REG_TYPE" ]; then
  echo "FAIL: registry has wrong type"
  echo "  expected: $EXPECTED_REG_TYPE"
  echo "  got:      $REG_TYPE"
  exit 1
fi
echo "    ✓ Registry type matches"

# 3. Version dynamic field is present + readable.
echo "==> 3. Checking registry version dynamic field..."
DF_JSON="$(sui client dynamic-field "$REGISTRY_ID" --json 2>&1)" || { echo "FAIL: could not list dynamic fields"; exit 1; }
if ! echo "$DF_JSON" | jq -e '.data[]?.name.value? // empty' | grep -q "version"; then
  echo "FAIL: no 'version' dynamic field on registry"
  echo "$DF_JSON" | jq .
  exit 1
fi
echo "    ✓ Version dynamic field present"

echo ""
echo "✓ VERIFIED — onemem is deployed + healthy on $NETWORK"
echo ""
echo "Suiscan:  https://suiscan.xyz/$NETWORK/object/$PACKAGE_ID"
echo "Registry: https://suiscan.xyz/$NETWORK/object/$REGISTRY_ID"
