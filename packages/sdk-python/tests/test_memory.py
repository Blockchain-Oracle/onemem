"""Unit tests for the memory bridge — no network. Mocks subprocess so the
add/search payload wiring + error handling run in CI."""

from __future__ import annotations

import json
import subprocess
from collections.abc import Sequence
from types import SimpleNamespace
from typing import Any, NoReturn

import pytest
from onemem.memory import MemoryClient, MemoryError


def _proc(stdout: str = "", returncode: int = 0, stderr: str = "") -> SimpleNamespace:
    return SimpleNamespace(stdout=stdout, returncode=returncode, stderr=stderr)


def test_add_sends_payload_and_parses_result(monkeypatch: pytest.MonkeyPatch) -> None:
    captured: dict[str, Any] = {}

    def fake_run(cmd: Sequence[str], **kwargs: Any) -> SimpleNamespace:
        captured["cmd"] = cmd
        captured["input"] = json.loads(kwargs["input"])
        return _proc(json.dumps({"memoryId": "m1", "walrusBlobId": "b1", "inputHashHex": "0xhash"}))

    monkeypatch.setattr(subprocess, "run", fake_run)
    client = MemoryClient(network="testnet", namespace="ns", command="onemem-memory")
    res = client.add("remember Move")

    assert captured["input"]["op"] == "add"
    assert captured["input"]["text"] == "remember Move"
    assert captured["input"]["namespace"] == "ns"
    assert captured["input"]["network"] == "testnet"
    assert res.memory_id == "m1"
    assert res.walrus_blob_id == "b1"
    assert res.input_hash_hex == "0xhash"


def test_search_parses_ranked_memories(monkeypatch: pytest.MonkeyPatch) -> None:
    captured: dict[str, Any] = {}

    def fake_run(cmd: Sequence[str], **kwargs: Any) -> SimpleNamespace:
        captured["input"] = json.loads(kwargs["input"])
        return _proc(
            json.dumps(
                {"results": [{"text": "I build on Sui", "walrusBlobId": "b", "relevance": 0.8}]}
            )
        )

    monkeypatch.setattr(subprocess, "run", fake_run)
    client = MemoryClient(command="onemem-memory")
    hits = client.search("what chain", top_k=3)

    assert captured["input"] == {
        "op": "search",
        "query": "what chain",
        "topK": 3,
        "network": "testnet",
    }
    assert len(hits) == 1
    assert hits[0].text == "I build on Sui"
    assert hits[0].relevance == 0.8


def test_nonzero_exit_raises_memory_error(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_run(*_args: Any, **_kwargs: Any) -> SimpleNamespace:
        return _proc(returncode=1, stderr="boom")

    monkeypatch.setattr(subprocess, "run", fake_run)
    with pytest.raises(MemoryError, match="exited 1"):
        MemoryClient(command="onemem-memory").add("x")


def test_non_json_output_raises_memory_error(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_run(*_args: Any, **_kwargs: Any) -> SimpleNamespace:
        return _proc(stdout="not json")

    monkeypatch.setattr(subprocess, "run", fake_run)
    with pytest.raises(MemoryError, match="non-JSON"):
        MemoryClient(command="onemem-memory").search("x")


def test_spawn_failure_raises_memory_error(monkeypatch: pytest.MonkeyPatch) -> None:
    def boom(*_args: Any, **_kwargs: Any) -> NoReturn:
        raise FileNotFoundError("no node")

    monkeypatch.setattr(subprocess, "run", boom)
    with pytest.raises(MemoryError, match="spawn failed"):
        MemoryClient(command="missing-bin").add("x")


def test_empty_input_rejected() -> None:
    client = MemoryClient(command="onemem-memory")
    with pytest.raises(MemoryError):
        client.add("")
    with pytest.raises(MemoryError):
        client.search("")
