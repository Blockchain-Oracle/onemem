"""Unit tests for the LiveKit OneMem tracer (pure-stdlib; subprocess mocked)."""

from __future__ import annotations

import json
import subprocess
import threading

from onemem_livekit import OneMemTracer


def _join_flush_thread():
    # _on_close flushes off-thread (never block LiveKit's event loop); wait for it.
    for thread in threading.enumerate():
        if thread.name == "onemem-flush":
            thread.join(timeout=5)


class FakeSession:
    """Records .on() handlers and lets the test emit events."""

    def __init__(self):
        self.handlers = {}

    def on(self, event, fn):
        self.handlers[event] = fn
        return self

    def emit(self, event, ev):
        self.handlers[event](ev)


class Item:
    def __init__(self, role, text):
        self.role = role
        self.text_content = text


class FnCall:
    def __init__(self, name, arguments):
        self.name = name
        self.arguments = arguments


class FnOut:
    def __init__(self, output):
        self.output = output


class ToolsEvent:
    def __init__(self, pairs):
        self._pairs = pairs

    def zipped(self):
        return self._pairs


def test_attach_registers_and_buffers_then_flushes_on_close(monkeypatch):
    t = OneMemTracer(agent_id="voice-x")
    s = FakeSession()
    t.attach(s)
    assert set(s.handlers) == {"conversation_item_added", "function_tools_executed", "close"}

    s.emit("conversation_item_added", type("E", (), {"item": Item("user", "hi there")}))
    s.emit(
        "function_tools_executed", ToolsEvent([(FnCall("weather", {"city": "x"}), FnOut("sunny"))])
    )
    s.emit("conversation_item_added", type("E", (), {"item": Item("assistant", "it is sunny")}))

    captured = {}

    class Proc:
        returncode = 0
        stdout = '{"sessionId":"0xabc"}\n'
        stderr = ""

    def fake_run(cmd, **kw):
        with open(cmd[-1]) as fh:
            captured["payload"] = json.load(fh)
        return Proc()

    monkeypatch.setenv("ONEMEM_TRACE_CMD", "node /x/onemem-trace.mjs")
    monkeypatch.setattr(subprocess, "run", fake_run)
    s.emit("close", type("E", (), {"reason": "user_initiated"}))  # triggers off-thread flush
    _join_flush_thread()

    calls = captured["payload"]["calls"]
    assert captured["payload"]["agentId"] == "voice-x"
    assert [c["toolName"] for c in calls] == ["message.user", "weather", "message.assistant"]
    assert calls[1]["input"] == {"city": "x"}
    assert calls[1]["output"] == "sunny"
    assert calls[2]["output"] == "it is sunny"
    assert t._calls == []  # cleared after flush


def test_function_tools_without_zipped_falls_back_to_lists(monkeypatch):
    t = OneMemTracer()
    s = FakeSession()
    t.attach(s)
    ev = type(
        "E", (), {"function_calls": [FnCall("f", {"a": 1})], "function_call_outputs": [FnOut("r")]}
    )
    s.emit("function_tools_executed", ev)
    assert t._calls[0]["toolName"] == "f"
    assert t._calls[0]["output"] == "r"


def test_flush_never_raises(monkeypatch):
    t = OneMemTracer()
    s = FakeSession()
    t.attach(s)
    s.emit("conversation_item_added", type("E", (), {"item": Item("user", "x")}))

    def boom(*a, **k):
        raise subprocess.TimeoutExpired(cmd="x", timeout=1)

    monkeypatch.setenv("ONEMEM_TRACE_CMD", "node /x/onemem-trace.mjs")
    monkeypatch.setattr(subprocess, "run", boom)
    assert t.flush() is None
    assert len(t._calls) == 1  # retained for retry


def test_flush_clears_buffer_on_runtime_policy_skip(monkeypatch):
    t = OneMemTracer()
    t._on_item(type("E", (), {"item": Item("user", "x")}))

    class Proc:
        returncode = 0
        stdout = '{"skipped":true,"reason":"runtime-controls"}\n'
        stderr = ""

    monkeypatch.setenv("ONEMEM_TRACE_CMD", "node /x/onemem-trace.mjs")
    monkeypatch.setattr(subprocess, "run", lambda *a, **k: Proc())
    assert t.flush() is None
    assert t._calls == []
