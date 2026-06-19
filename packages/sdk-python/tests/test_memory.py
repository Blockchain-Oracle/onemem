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


def test_add_sends_scope_fields(monkeypatch: pytest.MonkeyPatch) -> None:
    captured: dict[str, Any] = {}

    def fake_run(cmd: Sequence[str], **kwargs: Any) -> SimpleNamespace:
        captured["input"] = json.loads(kwargs["input"])
        return _proc(json.dumps({"memoryId": "m1", "walrusBlobId": "b1"}))

    monkeypatch.setattr(subprocess, "run", fake_run)
    client = MemoryClient(command="onemem-memory")
    client.add(
        "alice likes dark mode",
        user_id="alice",
        agent_id="ag1",
        run_id="run1",
        metadata={"topic": "prefs"},
    )
    assert captured["input"]["op"] == "add"
    assert captured["input"]["userId"] == "alice"
    assert captured["input"]["agentId"] == "ag1"
    assert captured["input"]["runId"] == "run1"
    assert captured["input"]["metadata"] == {"topic": "prefs"}


def test_get_parses_stored_memory(monkeypatch: pytest.MonkeyPatch) -> None:
    captured: dict[str, Any] = {}

    def fake_run(cmd: Sequence[str], **kwargs: Any) -> SimpleNamespace:
        captured["input"] = json.loads(kwargs["input"])
        return _proc(
            json.dumps(
                {
                    "memory": {
                        "id": "m1",
                        "text": "alice likes dark mode",
                        "walrusBlobId": "b1",
                        "namespace": "user:alice",
                        "userId": "alice",
                        "metadata": {"topic": "prefs"},
                        "createdAt": 42,
                    }
                }
            )
        )

    monkeypatch.setattr(subprocess, "run", fake_run)
    client = MemoryClient(command="onemem-memory")
    memory = client.get("m1")

    assert captured["input"] == {"op": "get", "id": "m1", "network": "testnet"}
    assert memory is not None
    assert memory.id == "m1"
    assert memory.text == "alice likes dark mode"
    assert memory.user_id == "alice"
    assert memory.namespace == "user:alice"
    assert memory.metadata == {"topic": "prefs"}


def test_get_returns_none_when_missing(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_run(*_args: Any, **_kwargs: Any) -> SimpleNamespace:
        return _proc(json.dumps({"memory": None}))

    monkeypatch.setattr(subprocess, "run", fake_run)
    assert MemoryClient(command="onemem-memory").get("nope") is None


def test_get_all_parses_list(monkeypatch: pytest.MonkeyPatch) -> None:
    captured: dict[str, Any] = {}

    def fake_run(cmd: Sequence[str], **kwargs: Any) -> SimpleNamespace:
        captured["input"] = json.loads(kwargs["input"])
        return _proc(
            json.dumps(
                {
                    "memories": [
                        {"id": "m2", "text": "newer", "walrusBlobId": "b2", "namespace": "user:u"},
                        {"id": "m1", "text": "older", "walrusBlobId": "b1", "namespace": "user:u"},
                    ]
                }
            )
        )

    monkeypatch.setattr(subprocess, "run", fake_run)
    client = MemoryClient(command="onemem-memory")
    memories = client.get_all(user_id="u", limit=10)

    assert captured["input"]["op"] == "list"
    assert captured["input"]["userId"] == "u"
    assert captured["input"]["limit"] == 10
    assert [m.id for m in memories] == ["m2", "m1"]
    assert memories[0].text == "newer"


def test_get_all_passes_namespace_through_as_is(monkeypatch: pytest.MonkeyPatch) -> None:
    """get_all must NOT inject self.namespace (matches TS getAll: no ns filter)."""
    captured: dict[str, Any] = {}

    def fake_run(cmd: Sequence[str], **kwargs: Any) -> SimpleNamespace:
        captured["input"] = json.loads(kwargs["input"])
        return _proc(json.dumps({"memories": []}))

    monkeypatch.setattr(subprocess, "run", fake_run)
    # Client has a config namespace, but get_all() with no explicit namespace must
    # send NO namespace key (None is dropped by _run) -> lists across namespaces.
    client = MemoryClient(command="onemem-memory", namespace="cfg-ns")
    client.get_all(user_id="u")
    assert "namespace" not in captured["input"]
    assert captured["input"]["userId"] == "u"

    # An explicit namespace is passed through unchanged.
    client.get_all(namespace="explicit")
    assert captured["input"]["namespace"] == "explicit"


def test_add_namespace_priority_matches_ts(monkeypatch: pytest.MonkeyPatch) -> None:
    """config namespace is below userId: with a user_id and no explicit ns, add
    sends NO namespace so the CLI derives user:<id> (not the config namespace)."""
    captured: dict[str, Any] = {}

    def fake_run(cmd: Sequence[str], **kwargs: Any) -> SimpleNamespace:
        captured["input"] = json.loads(kwargs["input"])
        return _proc(json.dumps({"memoryId": "m1", "walrusBlobId": "b1"}))

    monkeypatch.setattr(subprocess, "run", fake_run)
    client = MemoryClient(command="onemem-memory", namespace="cfg-ns")

    # user_id present, no explicit ns -> no namespace key (CLI derives user:<id>).
    client.add("hi", user_id="alice")
    assert "namespace" not in captured["input"]

    # No ns, no user_id -> falls back to config namespace.
    client.add("hi")
    assert captured["input"]["namespace"] == "cfg-ns"

    # Explicit ns wins.
    client.add("hi", user_id="alice", namespace="team:x")
    assert captured["input"]["namespace"] == "team:x"


def test_delete_returns_bool(monkeypatch: pytest.MonkeyPatch) -> None:
    captured: dict[str, Any] = {}

    def fake_run(cmd: Sequence[str], **kwargs: Any) -> SimpleNamespace:
        captured["input"] = json.loads(kwargs["input"])
        return _proc(json.dumps({"id": "m1", "deleted": True}))

    monkeypatch.setattr(subprocess, "run", fake_run)
    client = MemoryClient(command="onemem-memory")
    assert client.delete("m1") is True
    assert captured["input"] == {"op": "delete", "id": "m1", "network": "testnet"}


def test_get_delete_empty_id_rejected() -> None:
    client = MemoryClient(command="onemem-memory")
    with pytest.raises(MemoryError):
        client.get("")
    with pytest.raises(MemoryError):
        client.delete("")
