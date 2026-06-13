"""Live-testnet integration: cross-language Merkle parity.

Gated behind ONEMEM_INTEGRATION=1 (hits live testnet). Proves the Python
verifier recomputes the EXACT SAME merkle_root the TypeScript SDK produced for
the canonical demo session — the cross-language verifiability claim.

Run: ONEMEM_INTEGRATION=1 uv run pytest -k integration
"""

from __future__ import annotations

import os

import pytest
from onemem import OneMem

# Canonical verified demo session (docs/.../DEMO_SESSIONS.md) — the TS SDK
# computed this exact root for it.
DEMO_SESSION_ID = "0x08f4ef5b53c768eb446a18659ecc0775ac1a58763890ae51d6658c301a3f33e8"
TS_MERKLE_ROOT_HEX = "82fb3f4cd63059e4172938178d1a8b4dd59bf66a1575c1c4002727df5aae806e"

pytestmark = pytest.mark.skipif(
    os.environ.get("ONEMEM_INTEGRATION") != "1",
    reason="needs ONEMEM_INTEGRATION=1 + live testnet access",
)


def test_python_verifier_matches_ts_root_for_demo_session() -> None:
    with OneMem(network="testnet") as onemem:
        result = onemem.verify_session(DEMO_SESSION_ID)

    assert result.ok is True
    assert result.broken_at is None
    # The headline: Python recomputes the identical root TS did, byte-for-byte.
    assert result.computed_merkle_root.hex() == TS_MERKLE_ROOT_HEX
    assert result.expected_merkle_root.hex() == TS_MERKLE_ROOT_HEX
