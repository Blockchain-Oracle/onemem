"""Unit tests for verify_session against a fake RPC (no network)."""

from __future__ import annotations

from typing import Any

from onemem import ZERO_HASH, OneMemAddresses, chain_hash, verify_session
from onemem.client import OneMem

SESSION_ID = "0xsession"
PACKAGE_ID = "0xpkg"


class FakeRpc:
    """Stand-in for SuiRpc returning canned object + event payloads."""

    def __init__(self, fields: dict[str, Any], events: list[dict[str, Any]]) -> None:
        self._fields = fields
        self._events = events

    def get_object_fields(self, _object_id: str) -> dict[str, Any]:
        return self._fields

    def query_events_by_type(self, _event_type: str) -> list[dict[str, Any]]:
        return self._events


def _event(ts: int, content: bytes, prev: bytes) -> dict[str, Any]:
    return {
        "timestampMs": str(ts),
        "parsedJson": {
            "session_id": SESSION_ID,
            "call_id": "0xcall",
            "parent_call_id": None,
            "content_hash": list(content),
            "prev_hash": list(prev),
        },
    }


def test_verify_ok_for_intact_two_call_chain() -> None:
    c0 = b"\x0a" * 32
    c1 = b"\x0b" * 32
    expected_root = chain_hash(chain_hash(ZERO_HASH, c0), c1)
    rpc = FakeRpc(
        {"merkle_root": list(expected_root), "status": 2},
        [_event(1, c0, ZERO_HASH), _event(2, c1, c0)],
    )

    result = verify_session(rpc, PACKAGE_ID, SESSION_ID)  # type: ignore[arg-type]

    assert result.ok
    assert result.broken_at is None
    assert result.call_count == 2
    assert result.computed_merkle_root == expected_root


def test_verify_detects_broken_prev_hash_chain() -> None:
    c0 = b"\x0a" * 32
    c1 = b"\x0b" * 32
    # Second call's prev_hash is wrong (not c0) → insertion/drop detected.
    rpc = FakeRpc(
        {"merkle_root": list(chain_hash(chain_hash(ZERO_HASH, c0), c1)), "status": 2},
        [_event(1, c0, ZERO_HASH), _event(2, c1, b"\xff" * 32)],
    )

    result = verify_session(rpc, PACKAGE_ID, SESSION_ID)  # type: ignore[arg-type]

    assert result.ok is False
    assert result.broken_at == 1


def test_verify_fails_on_root_mismatch() -> None:
    c0 = b"\x0a" * 32
    rpc = FakeRpc(
        {"merkle_root": list(b"\x00" * 32), "status": 2},
        [_event(1, c0, ZERO_HASH)],
    )

    result = verify_session(rpc, PACKAGE_ID, SESSION_ID)  # type: ignore[arg-type]

    assert result.ok is False
    assert result.broken_at is None  # chain links fine; only the root differs


def test_client_verifier_uses_original_package_id_after_upgrades(monkeypatch: Any) -> None:
    calls: list[tuple[object, str, str]] = []

    def fake_verify_session(rpc: object, package_id: str, session_id: str) -> object:
        calls.append((rpc, package_id, session_id))
        return object()

    import onemem.client as client_module

    monkeypatch.setattr(client_module, "verify_session", fake_verify_session)
    addresses = OneMemAddresses(
        network="testnet",
        rpc_url="http://unused.invalid",
        suiscan_base="",
        package_id="0xcurrent",
        original_package_id="0xoriginal",
        registry_id="0xregistry",
        registry_admin_cap_id="0xadmin",
        upgrade_cap_id="0xupgrade",
        deployer_address="0xdeployer",
        tx_digest="digest",
        deployed_at="now",
    )
    client = OneMem(addresses=addresses)
    try:
        client.verify_session(SESSION_ID)
    finally:
        client.close()

    assert calls[0][1:] == ("0xoriginal", SESSION_ID)
