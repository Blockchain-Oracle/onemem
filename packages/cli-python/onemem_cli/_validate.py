"""Boundary validation for user-supplied CLI input."""

from __future__ import annotations

import os

_NETWORKS = ("testnet", "mainnet", "devnet", "local")


def resolve_network(raw: str | None) -> str:
    """Validate an explicit --network, else fall back to $SUI_NETWORK, else testnet.

    A typo like ``--network mannet`` is rejected loudly rather than silently
    pointing at the wrong (or no) network.
    """
    if raw is not None:
        if raw not in _NETWORKS:
            raise ValueError(f'unknown network "{raw}" — expected one of: {", ".join(_NETWORKS)}')
        return raw
    env = os.environ.get("SUI_NETWORK")
    if env and env in _NETWORKS:
        return env
    return "testnet"
