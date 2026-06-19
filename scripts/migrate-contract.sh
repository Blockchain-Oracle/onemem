#!/usr/bin/env bash
# Move package UPGRADE flow (vs initial publish). Publishes a new package
# version + calls per-object `migrate_*_v<N>` entry functions to swap the
# version dynamic field on long-lived objects.
#
# Usage: bash scripts/migrate-contract.sh [testnet|mainnet|devnet] [--dry-run]
#
# v0.1: no upgrades have happened yet — the first call to this script will
# also need to be the FIRST migration so it can be tested end-to-end.
# Until v0.2 ships its first migration, this script just runs `sui client
# upgrade` and records the new package ID; per-object migrate calls land
# in a follow-up. Spec: docs/05-our-architecture/01-protocol/upgrade-strategy.md

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONTRACT_DIR="$REPO_ROOT/contracts/onemem"
NETWORKS_JSON="$REPO_ROOT/config/networks.json"
PUBLISHED_TOML="$CONTRACT_DIR/Published.toml"

GAS_BUDGET="${GAS_BUDGET:-200000000}"
DRY_RUN_ONLY=0
NETWORK="testnet"
PREVIOUS_ENV=""

usage() {
  echo "Usage: $0 [testnet|mainnet|devnet] [--dry-run]"
}

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN_ONLY=1 ;;
    testnet|mainnet|devnet) NETWORK="$arg" ;;
    -h|--help) usage; exit 0 ;;
    *) usage; exit 2 ;;
  esac
done

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERROR: required command not found: $1"
    exit 1
  fi
}

restore_env() {
  if [ -n "$PREVIOUS_ENV" ] && [ "$PREVIOUS_ENV" != "$NETWORK" ]; then
    echo "==> Restoring Sui CLI env to $PREVIOUS_ENV"
    if ! sui client switch --env "$PREVIOUS_ENV" >/dev/null 2>&1; then
      echo "WARNING: failed to restore Sui CLI env to $PREVIOUS_ENV"
    fi
  fi
}

trap restore_env EXIT

need_cmd jq
need_cmd sui

SUI_BIN="$(command -v sui)"
SUI_VERSION="$(sui --version)"

if [ "$DRY_RUN_ONLY" -eq 0 ]; then
  need_cmd pnpm
  need_cmd uv
fi

if [ ! -f "$NETWORKS_JSON" ]; then
  echo "ERROR: $NETWORKS_JSON does not exist."
  exit 1
fi

UPGRADE_CAP_ID="$(jq -r --arg n "$NETWORK" '.networks[$n].upgrade_cap_id // ""' "$NETWORKS_JSON")"
CURRENT_PACKAGE_ID="$(jq -r --arg n "$NETWORK" '.networks[$n].package_id // ""' "$NETWORKS_JSON")"
if [ -z "$UPGRADE_CAP_ID" ]; then
  echo "ERROR: No UpgradeCap recorded for $NETWORK in $NETWORKS_JSON"
  echo "Run \`bash scripts/deploy-contract.sh $NETWORK\` first for the initial publish."
  exit 1
fi

if [ -z "$CURRENT_PACKAGE_ID" ]; then
  echo "ERROR: No package ID recorded for $NETWORK in $NETWORKS_JSON"
  echo "Run \`bash scripts/deploy-contract.sh $NETWORK\` first for the initial publish."
  exit 1
fi

PUBLISHED_VERSION_BEFORE_UPGRADE="0"
if [ -f "$PUBLISHED_TOML" ]; then
  parsed_version="$(
    awk -v section="[published.$NETWORK]" '
      $0 == section { in_section = 1; next }
      in_section && /^\[/ { exit }
      in_section && $1 == "version" { print $3; exit }
    ' "$PUBLISHED_TOML"
  )"
  case "$parsed_version" in
    ""|*[!0-9]*) PUBLISHED_VERSION_BEFORE_UPGRADE="0" ;;
    *) PUBLISHED_VERSION_BEFORE_UPGRADE="$parsed_version" ;;
  esac
fi
DESIRED_PUBLISHED_VERSION=$((PUBLISHED_VERSION_BEFORE_UPGRADE + 1))

PREVIOUS_ENV="$(sui client active-env 2>/dev/null || true)"

echo "==> Switching to $NETWORK"
sui client switch --env "$NETWORK" >/dev/null

ACTIVE_ADDRESS="$(sui client active-address)"
echo "==> Sui CLI: $SUI_BIN ($SUI_VERSION)"
echo "==> Active address: $ACTIVE_ADDRESS"
echo "==> Current package ID: $CURRENT_PACKAGE_ID"
echo "==> UpgradeCap: $UPGRADE_CAP_ID"
echo "==> Published.toml version after upgrade will be $DESIRED_PUBLISHED_VERSION"

run_upgrade() {
  local mode="$1"
  local args=(
    client upgrade
    --upgrade-capability "$UPGRADE_CAP_ID"
    --gas-budget "$GAS_BUDGET"
    --json
  )
  if [ "$mode" = "dry-run" ]; then
    args+=(--dry-run)
  fi
  (cd "$CONTRACT_DIR" && sui "${args[@]}")
}

extract_package_id() {
  jq -r '[.objectChanges[]? | select(.type=="published") | .packageId][0] // ""'
}

extract_digest() {
  jq -r '.digest // .effects.transactionDigest // ""'
}

echo "==> Running dry-run preflight"
DRY_RUN_OUT="$(run_upgrade dry-run)"

if [ "$DRY_RUN_ONLY" -eq 1 ]; then
  echo ""
  echo "✓ Dry-run preflight completed for $NETWORK"
  echo "  No chain state changed."
  echo "  No repo files were updated."
  exit 0
fi

echo "==> Dry-run preflight passed"
echo "==> Executing live upgrade"
UPGRADE_OUT="$(run_upgrade live)"

NEW_PACKAGE_ID="$(echo "$UPGRADE_OUT" | extract_package_id)"
TX_DIGEST="$(echo "$UPGRADE_OUT" | extract_digest)"

if [ -z "$NEW_PACKAGE_ID" ]; then
  echo "ERROR: Could not parse new package ID from upgrade output. Full JSON:"
  echo "$UPGRADE_OUT" | jq .
  exit 1
fi

if [ -z "$TX_DIGEST" ]; then
  echo "ERROR: Could not parse transaction digest from upgrade output. Full JSON:"
  echo "$UPGRADE_OUT" | jq .
  exit 1
fi

echo ""
echo "✓ Upgrade published on $NETWORK"
echo "  Previous package ID: $CURRENT_PACKAGE_ID"
echo "  New package ID: $NEW_PACKAGE_ID"
echo "  Tx digest:      $TX_DIGEST"

DEPLOYED_AT="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
ORIGINAL_PACKAGE_ID="$(jq -r --arg n "$NETWORK" '.networks[$n].original_package_id // .networks[$n].package_id // ""' "$NETWORKS_JSON")"
tmp="$(mktemp)"
jq \
  --arg net "$NETWORK" \
  --arg pkg "$NEW_PACKAGE_ID" \
  --arg original "${ORIGINAL_PACKAGE_ID:-$CURRENT_PACKAGE_ID}" \
  --arg digest "$TX_DIGEST" \
  --arg ts "$DEPLOYED_AT" \
  '.networks[$net].package_id = $pkg
   | .networks[$net].original_package_id = $original
   | .networks[$net].tx_digest = $digest
   | .networks[$net].deployed_at = $ts
   | .active = $net' \
  "$NETWORKS_JSON" > "$tmp" && mv "$tmp" "$NETWORKS_JSON"
echo "==> Updated $NETWORKS_JSON (.networks.$NETWORK package + tx digest)"

SUI_TOOLCHAIN_VERSION="$(sui --version | awk '{print $2}' | sed 's/-.*//')"
uv run python - "$PUBLISHED_TOML" "$NETWORK" "$NEW_PACKAGE_ID" "$CURRENT_PACKAGE_ID" "$UPGRADE_CAP_ID" "$SUI_TOOLCHAIN_VERSION" "$DESIRED_PUBLISHED_VERSION" <<'PY'
from __future__ import annotations

import re
import sys
from pathlib import Path

path = Path(sys.argv[1])
network, package_id, previous_package_id, upgrade_cap, toolchain, desired_version = sys.argv[2:]
section = f"[published.{network}]"
lines = path.read_text().splitlines()

start = next((i for i, line in enumerate(lines) if line.strip() == section), None)
if start is None:
    if lines and lines[-1].strip():
        lines.append("")
    lines.extend(
        [
            section,
            f'published-at = "{package_id}"',
            f'original-id = "{previous_package_id or package_id}"',
            f"version = {desired_version}",
            f'toolchain-version = "{toolchain}"',
            f'upgrade-capability = "{upgrade_cap}"',
        ]
    )
else:
    end = next(
        (
            i
            for i in range(start + 1, len(lines))
            if lines[i].startswith("[") and lines[i].endswith("]")
        ),
        len(lines),
    )
    existing: dict[str, int] = {}
    original_id = previous_package_id or package_id
    for i in range(start + 1, end):
        match = re.match(r"([A-Za-z0-9_-]+)\s*=\s*(.*)", lines[i].strip())
        if not match:
            continue
        key, value = match.groups()
        existing[key] = i
        if key == "original-id":
            original_id = value.strip().strip('"') or original_id

    updates = {
        "published-at": f'"{package_id}"',
        "original-id": f'"{original_id}"',
        "version": str(desired_version),
        "toolchain-version": f'"{toolchain}"',
        "upgrade-capability": f'"{upgrade_cap}"',
    }
    insert_at = end
    for key, value in updates.items():
        rendered = f"{key} = {value}"
        if key in existing:
            lines[existing[key]] = rendered
        else:
            lines.insert(insert_at, rendered)
            insert_at += 1

path.write_text("\n".join(lines) + "\n")
PY
echo "==> Updated $PUBLISHED_TOML ([published.$NETWORK])"

echo "==> Regenerating SDK address artifacts"
(cd "$REPO_ROOT" && pnpm exec tsx scripts/codegen-move-types.ts)
(cd "$REPO_ROOT" && uv run python scripts/codegen-move-python.py)

echo ""
echo "NEXT: per-object migrate_*_v<N> entry functions must be called for each"
echo "long-lived object (MemoryNamespace, TraceSession). v0.1 has no v2 schema"
echo "yet so no per-object migration is required — this script will be extended"
echo "with that loop when the first schema-breaking change ships in v0.2."
echo ""
echo "Verification next steps:"
echo "  1. Run \`bash scripts/verify-mainnet.sh $NETWORK\`"
echo "  2. Review config/networks.json, contracts/onemem/Published.toml, and generated SDK addresses"
echo "  3. Commit the manifest and generated address changes"
