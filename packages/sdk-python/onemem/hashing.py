"""Merkle-chain hashing — byte-for-byte identical to the TS SDK.

The on-chain `trace.move` builds a running Merkle root by hashing each call's
content hash into the accumulator: ``running = sha256(running || content)``,
starting from 32 zero bytes. The verifier (here and in TS) replays that to
confirm nothing was inserted, dropped, or tampered. Both SDKs MUST agree on
the byte layout or cross-language verification breaks.
"""

from __future__ import annotations

import hashlib

#: The genesis accumulator value (matches ZERO_HASH in traces.ts + trace.move).
ZERO_HASH: bytes = b"\x00" * 32


def chain_hash(running: bytes, content: bytes) -> bytes:
    """Fold ``content`` into the running Merkle accumulator.

    ``sha256(running || content)`` — the exact operation in
    ``packages/sdk-ts/src/traces.ts`` ``chainHash`` and ``trace.move``.
    """
    return hashlib.sha256(running + content).digest()
