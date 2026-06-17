"""Unit tests for network resolution (pure; no network)."""

from __future__ import annotations

import pytest
from onemem_cli._validate import resolve_network


def test_explicit_known_network() -> None:
    assert resolve_network("testnet") == "testnet"
    assert resolve_network("mainnet") == "mainnet"


def test_explicit_typo_rejected() -> None:
    with pytest.raises(ValueError, match="unknown network"):
        resolve_network("mannet")


def test_env_fallback(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SUI_NETWORK", "devnet")
    assert resolve_network(None) == "devnet"


def test_unknown_env_falls_back_to_testnet(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SUI_NETWORK", "bogus")
    assert resolve_network(None) == "testnet"


def test_default_testnet(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("SUI_NETWORK", raising=False)
    assert resolve_network(None) == "testnet"
