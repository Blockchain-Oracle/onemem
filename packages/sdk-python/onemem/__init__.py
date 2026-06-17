"""onemem — verifiable cross-runtime AI agent memory + trace SDK (Python).

v0.1 surface: the off-chain trace verifier. Recomputes a session's Merkle
chain from on-chain data and confirms it matches — byte-for-byte identical to
the TypeScript SDK (cross-language verifier parity).

    from onemem import OneMem

    with OneMem(network="testnet") as onemem:
        assert onemem.verify_session("0x08f4ef5b...").ok
"""

from __future__ import annotations

from ._rpc import SuiRpc, SuiRpcError
from .client import OneMem
from .generated.addresses import ACTIVE_NETWORK, OneMemAddresses, SuiNetwork, addresses_for
from .hashing import ZERO_HASH, chain_hash
from .memory import AddResult, Memory, MemoryClient, MemoryError
from .traces import (
    EmittedEvent,
    VerifyResult,
    fetch_emitted_events,
    fetch_trace_session,
    verify_session,
)

__version__ = "0.2.0"

__all__ = [
    "ACTIVE_NETWORK",
    "ZERO_HASH",
    "AddResult",
    "EmittedEvent",
    "Memory",
    "MemoryClient",
    "MemoryError",
    "OneMem",
    "OneMemAddresses",
    "SuiNetwork",
    "SuiRpc",
    "SuiRpcError",
    "VerifyResult",
    "addresses_for",
    "chain_hash",
    "fetch_emitted_events",
    "fetch_trace_session",
    "verify_session",
]
