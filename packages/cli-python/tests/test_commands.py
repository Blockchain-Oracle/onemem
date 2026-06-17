"""Command-level tests with the SDK calls mocked (no network).

Pins the click control-flow behaviour: an intentional ctx.exit(1) on a failed
verification must NOT be swallowed by the error wrapper and reprinted as
`error: 1` / a second JSON object.
"""

from __future__ import annotations

from dataclasses import dataclass

import pytest
from click.testing import CliRunner
from onemem_cli import main


@dataclass
class FakeResult:
    ok: bool
    broken_at: int | None
    expected_merkle_root: bytes
    computed_merkle_root: bytes
    call_count: int
    session_status: int


@pytest.fixture
def patched(monkeypatch: pytest.MonkeyPatch):
    class FakeRpc:
        def __enter__(self):
            return self

        def __exit__(self, *_):
            return False

    monkeypatch.setattr(main, "_ctx", lambda _n: (FakeRpc(), "0xpkg"))
    monkeypatch.setattr(
        main, "fetch_trace_session", lambda *_: {"agent_id": "a", "environment": "e"}
    )


def test_failed_verification_exits_1_without_spurious_error(monkeypatch, patched):
    monkeypatch.setattr(
        main,
        "verify_session",
        lambda *_: FakeResult(False, 2, b"\x01", b"\x02", 3, 1),
    )
    res = CliRunner().invoke(main.cli, ["verify", "0xsess"])
    assert res.exit_code == 1
    assert "✗ VERIFICATION FAILED" in res.output
    assert "error: 1" not in res.output  # ctx.exit not caught + reprinted


def test_failed_verification_json_emits_single_object(monkeypatch, patched):
    monkeypatch.setattr(
        main,
        "verify_session",
        lambda *_: FakeResult(False, 2, b"\x01", b"\x02", 3, 1),
    )
    res = CliRunner().invoke(main.cli, ["--json", "verify", "0xsess"])
    assert res.exit_code == 1
    assert res.output.count('"ok"') == 1  # not corrupted by a second {ok:false,error}
    assert '"ok": false' in res.output


def test_successful_verification_exits_0(monkeypatch, patched):
    monkeypatch.setattr(
        main,
        "verify_session",
        lambda *_: FakeResult(True, None, b"\x02", b"\x02", 2, 1),
    )
    res = CliRunner().invoke(main.cli, ["verify", "0xsess"])
    assert res.exit_code == 0
    assert "✓ VERIFIED" in res.output


def test_missing_session_errors_not_false_verified(monkeypatch, patched):
    def boom(*_):
        raise RuntimeError("no TraceSession object found")

    monkeypatch.setattr(main, "fetch_trace_session", boom)
    res = CliRunner().invoke(main.cli, ["verify", "0xbad"])
    assert res.exit_code == 1
    assert "VERIFIED" not in res.output
    assert "error:" in res.output


def test_unhealthy_exits_1_without_spurious_error(monkeypatch):
    # Same click ctx.exit bug class as verify, on a second command: an unhealthy
    # result must exit 1 cleanly, not be caught + reprinted as `error: 1`.
    class FakeRpc:
        def __enter__(self):
            return self

        def __exit__(self, *_):
            return False

        def _call(self, method, _params):
            if method == "sui_getChainIdentifier":
                return "abcd1234"
            return {"data": None}  # package not found

    monkeypatch.setattr(main, "SuiRpc", lambda _url: FakeRpc())
    res = CliRunner().invoke(main.cli, ["--network", "testnet", "health"])
    assert res.exit_code == 1
    assert "✗ unhealthy" in res.output
    assert "error: 1" not in res.output
