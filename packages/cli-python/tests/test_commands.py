"""Command-level tests with the RPC call mocked (no network).

Pins the click control-flow behaviour: an intentional ctx.exit(1) on a failed
health check must NOT be swallowed by the error wrapper and reprinted as
`error: 1` / a second JSON object.
"""

from __future__ import annotations

import pytest
from click.testing import CliRunner
from onemem_cli import main


def test_healthy_exits_0(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(main, "_chain_identifier", lambda _url: "abcd1234")
    res = CliRunner().invoke(main.cli, ["--network", "testnet", "health"])
    assert res.exit_code == 0
    assert "✓ healthy" in res.output
    assert "abcd1234" in res.output


def test_unhealthy_exits_1_without_spurious_error(monkeypatch: pytest.MonkeyPatch):
    def boom(_url):
        raise RuntimeError("connection refused")

    monkeypatch.setattr(main, "_chain_identifier", boom)
    res = CliRunner().invoke(main.cli, ["--network", "testnet", "health"])
    assert res.exit_code == 1
    assert "✗ unhealthy" in res.output
    assert "error: 1" not in res.output  # ctx.exit not caught + reprinted


def test_unhealthy_json_emits_single_object(monkeypatch: pytest.MonkeyPatch):
    def boom(_url):
        raise RuntimeError("connection refused")

    monkeypatch.setattr(main, "_chain_identifier", boom)
    res = CliRunner().invoke(main.cli, ["--json", "--network", "testnet", "health"])
    assert res.exit_code == 1
    assert res.output.count('"ok"') == 1
    assert '"ok": false' in res.output
