"""Unit tests for the OneMem Hermes memory provider.

Pure logic only — the on-chain write (the `onemem-trace` CLI) is mocked, so these
run without Node or a network. The live end-to-end is covered separately against
testnet.
"""

from __future__ import annotations

import json
import subprocess

import pytest

# The provider subclasses Hermes's MemoryProvider; skip cleanly if hermes-agent
# isn't installed in this environment.
pytest.importorskip("agent.memory_provider")

from hermes_onemem.provider import OneMemProvider


def test_name_and_no_tools():
    p = OneMemProvider()
    assert p.name == "onemem"
    assert p.get_tool_schemas() == []


def test_is_available_checks_cli_executable(monkeypatch):
    p = OneMemProvider()
    monkeypatch.setenv("ONEMEM_TRACE_CMD", "node /x/onemem-trace.mjs")
    monkeypatch.setattr("shutil.which", lambda exe: "/usr/bin/node" if exe == "node" else None)
    assert p.is_available() is True
    monkeypatch.setattr("shutil.which", lambda exe: None)
    assert p.is_available() is False


def test_buffering_isolates_sessions_and_falls_back_to_default():
    p = OneMemProvider()
    p.initialize("s1")
    p.sync_turn("u1", "a1", session_id="s1")
    p.sync_turn("u2", "a2", session_id="s2")
    p.on_memory_write("add", "user", "likes concise answers")  # no session_id -> default key (s1)
    p.on_delegation("do x", "did x", child_session_id="c1")
    assert (
        len(p._buffers["s1"]) == 3
    )  # turn + memory_add + delegation (default key == initialized session)
    assert len(p._buffers["s2"]) == 1
    assert p._buffers["s1"][0]["toolName"] == "turn"
    assert p._buffers["s1"][1]["toolName"] == "memory_add"
    assert p._buffers["s1"][2]["toolName"] == "delegation"


def test_flush_empty_is_noop(monkeypatch):
    p = OneMemProvider()
    called = False

    def fake_run(*a, **k):
        nonlocal called
        called = True

    monkeypatch.setattr(subprocess, "run", fake_run)
    assert p._flush("nope") is None
    assert called is False


def test_flush_builds_payload_and_parses_session_id(monkeypatch):
    p = OneMemProvider()
    p.initialize("s1")
    p.sync_turn("hi", "hello", session_id="s1")
    captured = {}

    class FakeProc:
        returncode = 0
        stdout = '{"sessionId":"0xabc","namespaceId":"0xns","rwCapId":"0xcap"}\n'
        stderr = ""

    def fake_run(cmd, **kwargs):
        captured["cmd"] = cmd
        with open(cmd[-1]) as fh:
            captured["payload"] = json.load(fh)
        return FakeProc()

    monkeypatch.setenv("ONEMEM_TRACE_CMD", "node /x/onemem-trace.mjs")
    monkeypatch.setattr(subprocess, "run", fake_run)
    sid = p._flush("s1")
    assert sid == "0xabc"
    assert captured["payload"]["agentId"] == "hermes"
    assert captured["payload"]["calls"][0]["toolName"] == "turn"
    assert p._buffers.get("s1") is None  # buffer cleared after flush


def test_flush_retains_buffer_on_cli_failure(monkeypatch):
    p = OneMemProvider()
    p.initialize("s1")
    p.sync_turn("hi", "hello", session_id="s1")

    class FakeProc:
        returncode = 1
        stdout = ""
        stderr = "boom"

    monkeypatch.setenv("ONEMEM_TRACE_CMD", "node /x/onemem-trace.mjs")
    monkeypatch.setattr(subprocess, "run", lambda *a, **k: FakeProc())
    assert p._flush("s1") is None  # never raises
    # buffer is RETAINED so shutdown()/a later flush can retry (no silent loss)
    assert len(p._buffers["s1"]) == 1


def test_flush_retains_buffer_on_unparseable_success(monkeypatch):
    # Exit 0 but no parseable sessionId — can't confirm the write, so RETAIN
    # the buffer for retry rather than risk silent loss.
    p = OneMemProvider()
    p.initialize("s1")
    p.sync_turn("hi", "hello", session_id="s1")

    class FakeProc:
        returncode = 0
        stdout = "not json"
        stderr = ""

    monkeypatch.setenv("ONEMEM_TRACE_CMD", "node /x/onemem-trace.mjs")
    monkeypatch.setattr(subprocess, "run", lambda *a, **k: FakeProc())
    assert p._flush("s1") is None
    assert len(p._buffers["s1"]) == 1  # retained for retry


def test_flush_clears_buffer_on_runtime_policy_skip(monkeypatch):
    p = OneMemProvider()
    p.initialize("s1")
    p.sync_turn("hi", "hello", session_id="s1")

    class FakeProc:
        returncode = 0
        stdout = '{"skipped":true,"reason":"runtime-controls"}\n'
        stderr = ""

    monkeypatch.setenv("ONEMEM_TRACE_CMD", "node /x/onemem-trace.mjs")
    monkeypatch.setattr(subprocess, "run", lambda *a, **k: FakeProc())
    assert p._flush("s1") is None
    assert p._buffers.get("s1") is None


def test_flush_defensive_on_subprocess_exception(monkeypatch):
    p = OneMemProvider()
    p.initialize("s1")
    p.sync_turn("hi", "hello", session_id="s1")

    def boom(*a, **k):
        raise subprocess.TimeoutExpired(cmd="x", timeout=1)

    monkeypatch.setenv("ONEMEM_TRACE_CMD", "node /x/onemem-trace.mjs")
    monkeypatch.setattr(subprocess, "run", boom)
    assert p._flush("s1") is None  # swallowed, host unaffected
