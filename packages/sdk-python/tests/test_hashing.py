"""Unit tests for the Merkle hashing core (no network)."""

from __future__ import annotations

import hashlib

from onemem import ZERO_HASH, chain_hash


def test_zero_hash_is_32_zero_bytes() -> None:
    assert bytes(32) == ZERO_HASH
    assert len(ZERO_HASH) == 32


def test_chain_hash_is_sha256_of_concatenation() -> None:
    content = b"\x01" * 32
    assert chain_hash(ZERO_HASH, content) == hashlib.sha256(ZERO_HASH + content).digest()


def test_chain_hash_folds_deterministically() -> None:
    step1 = chain_hash(ZERO_HASH, b"alpha")
    step2 = chain_hash(step1, b"beta")
    assert step2 == hashlib.sha256(step1 + b"beta").digest()
    assert len(step2) == 32
