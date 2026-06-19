"""onemem — decentralized memory for AI agents (Python).

Memory is stored on MemWal (Seal-encrypted blobs on Walrus). This package wraps
the ``onemem-memory`` Node bridge (@onemem/sdk-ts) for the add/search round-trip.

    from onemem.memory import MemoryClient

    client = MemoryClient(namespace="my-app")
    client.add("alice prefers TypeScript")
    hits = client.search("what language?")
"""

from __future__ import annotations

from typing import Literal

from .memory import AddResult, Memory, MemoryClient, MemoryError

#: Sui networks OneMem understands (display/config only).
SuiNetwork = Literal["testnet", "mainnet", "devnet", "local"]

__version__ = "0.2.0"

__all__ = [
    "AddResult",
    "Memory",
    "MemoryClient",
    "MemoryError",
    "SuiNetwork",
]
