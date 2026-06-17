"""Unit tests for the ElevenLabs OneMem tracer (pure-stdlib; subprocess mocked)."""

from __future__ import annotations

import asyncio
import json
import subprocess
import threading

import pytest
from onemem_elevenlabs import OneMemTracer


def _join_flush_thread():
    # on_end flushes off-thread (never block the conversation loop); wait for it.
    for thread in threading.enumerate():
        if thread.name == "onemem-flush":
            thread.join(timeout=5)


class FakeClientTools:
    """Mimics elevenlabs ClientTools.register(name, handler, is_async)."""

    def __init__(self):
        self.registered = {}

    def register(self, tool_name, handler, is_async=False):
        self.registered[tool_name] = handler


def test_callbacks_buffer_transcripts_and_flush_on_end(monkeypatch):
    t = OneMemTracer(agent_id="voice-x")
    cbs = t.callbacks()
    assert set(cbs) == {
        "callback_user_transcript",
        "callback_agent_response",
        "callback_agent_response_correction",
        "callback_end_session",
    }

    cbs["callback_user_transcript"]("hi there")
    cbs["callback_agent_response"]("it is sunny")
    cbs["callback_agent_response_correction"]("its sunny", "it is sunny")

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
    cbs["callback_end_session"]()  # triggers off-thread flush
    _join_flush_thread()

    calls = captured["payload"]["calls"]
    assert captured["payload"]["agentId"] == "voice-x"
    assert [c["toolName"] for c in calls] == [
        "message.user",
        "message.agent",
        "message.agent.correction",
    ]
    assert calls[0]["output"] == "hi there"
    assert calls[2]["input"] == "its sunny"
    assert calls[2]["output"] == "it is sunny"
    assert t._calls == []  # cleared after flush


def test_callbacks_chain_user_handlers():
    t = OneMemTracer()
    seen = []
    cbs = t.callbacks(callback_user_transcript=lambda s: seen.append(s))
    cbs["callback_user_transcript"]("hello")
    assert seen == ["hello"]  # user's handler still runs
    assert t._calls[0]["output"] == "hello"  # and OneMem captured it


def test_correction_callback_chains_both_args_in_order():
    t = OneMemTracer()
    seen = []
    cbs = t.callbacks(callback_agent_response_correction=lambda o, c: seen.append((o, c)))
    cbs["callback_agent_response_correction"]("its sunny", "it is sunny")
    assert seen == [("its sunny", "it is sunny")]  # user handler gets (original, corrected)
    assert t._calls[0]["input"] == "its sunny"
    assert t._calls[0]["output"] == "it is sunny"


def test_chained_callback_failure_never_breaks_capture():
    t = OneMemTracer()

    def boom(_s):
        raise ValueError("user handler bug")

    cbs = t.callbacks(callback_agent_response=boom)
    cbs["callback_agent_response"]("answer")  # must not raise
    assert t._calls[0]["output"] == "answer"  # capture still happened


def test_wrap_tools_captures_sync_handler():
    t = OneMemTracer()
    tools = t.wrap_tools(FakeClientTools())
    tools.register("weather", lambda params: {"temp": 20})
    out = tools.registered["weather"]({"city": "x"})
    assert out == {"temp": 20}  # original return preserved
    assert t._calls[0]["toolName"] == "weather"
    assert t._calls[0]["toolNamespace"] == "elevenlabs-tool"
    assert t._calls[0]["input"] == {"city": "x"}
    assert t._calls[0]["output"] == {"temp": 20}


def test_wrap_tools_captures_async_handler():
    t = OneMemTracer()
    tools = t.wrap_tools(FakeClientTools())

    async def handler(params):
        return {"echo": params["q"]}

    tools.register("lookup", handler, is_async=True)
    out = asyncio.run(tools.registered["lookup"]({"q": "sui"}))
    assert out == {"echo": "sui"}
    assert t._calls[0]["toolName"] == "lookup"
    assert t._calls[0]["output"] == {"echo": "sui"}


def test_wrap_tools_records_even_when_handler_raises():
    t = OneMemTracer()
    tools = t.wrap_tools(FakeClientTools())

    def boom(params):
        raise RuntimeError("tool bug")

    tools.register("flaky", boom)
    with pytest.raises(RuntimeError):  # host still sees the error
        tools.registered["flaky"]({"q": "x"})
    # but the failed call is still captured in the trace
    assert t._calls[0]["toolName"] == "flaky"
    assert t._calls[0]["input"] == {"q": "x"}
    assert t._calls[0]["output"] is None


def test_chain_runs_async_user_callback_without_running_loop():
    t = OneMemTracer()
    seen = []

    async def handler(s):
        seen.append(s)

    # Called from a sync context (no running loop) — the coroutine must still run.
    cbs = t.callbacks(callback_user_transcript=handler)
    cbs["callback_user_transcript"]("async hi")
    assert seen == ["async hi"]


def test_wrap_tools_records_async_handler_that_raises():
    t = OneMemTracer()
    tools = t.wrap_tools(FakeClientTools())

    async def boom(params):
        raise RuntimeError("async tool bug")

    tools.register("aflaky", boom, is_async=True)
    with pytest.raises(RuntimeError):
        asyncio.run(tools.registered["aflaky"]({"q": "x"}))
    assert t._calls[0]["toolName"] == "aflaky"
    assert t._calls[0]["output"] is None  # recorded in finally despite the raise


def test_chain_runs_async_user_callback_on_running_loop():
    t = OneMemTracer()
    seen = []

    async def handler(s):
        seen.append(s)

    async def drive():
        cbs = t.callbacks(callback_user_transcript=handler)
        cbs["callback_user_transcript"]("loop hi")  # scheduled via create_task
        await asyncio.sleep(0)  # let the task run

    asyncio.run(drive())
    assert seen == ["loop hi"]


def test_flush_returns_session_and_clears_on_success(monkeypatch):
    t = OneMemTracer()
    t._record("message.user", output="x")

    class Proc:
        returncode = 0
        stdout = '{"sessionId":"0xabc"}\n'
        stderr = ""

    monkeypatch.setenv("ONEMEM_TRACE_CMD", "node /x/onemem-trace.mjs")
    monkeypatch.setattr(subprocess, "run", lambda *a, **k: Proc())
    assert t.flush() == "0xabc"
    assert t._calls == []  # cleared only after a parsed sessionId


def test_flush_retains_buffer_on_nonzero_exit(monkeypatch):
    t = OneMemTracer()
    t._record("message.user", output="x")

    class Proc:
        returncode = 1
        stdout = ""
        stderr = "walrus write failed"

    monkeypatch.setenv("ONEMEM_TRACE_CMD", "node /x/onemem-trace.mjs")
    monkeypatch.setattr(subprocess, "run", lambda *a, **k: Proc())
    assert t.flush() is None
    assert len(t._calls) == 1  # non-zero exit → retained for retry (no silent loss)


def test_flush_empty_is_noop(monkeypatch):
    called = False

    def fake_run(*a, **k):
        nonlocal called
        called = True

    monkeypatch.setattr(subprocess, "run", fake_run)
    assert OneMemTracer().flush() is None
    assert called is False


def test_flush_retains_buffer_on_unparseable_success(monkeypatch):
    t = OneMemTracer()
    t._record("message.user", output="x")

    class Proc:
        returncode = 0
        stdout = "not json"
        stderr = ""

    monkeypatch.setenv("ONEMEM_TRACE_CMD", "node /x/onemem-trace.mjs")
    monkeypatch.setattr(subprocess, "run", lambda *a, **k: Proc())
    assert t.flush() is None
    assert len(t._calls) == 1  # exit 0 but no sessionId → retained for retry


def test_flush_clears_buffer_on_runtime_policy_skip(monkeypatch):
    t = OneMemTracer()
    t._record("message.user", output="x")

    class Proc:
        returncode = 0
        stdout = '{"skipped":true,"reason":"runtime-controls"}\n'
        stderr = ""

    monkeypatch.setenv("ONEMEM_TRACE_CMD", "node /x/onemem-trace.mjs")
    monkeypatch.setattr(subprocess, "run", lambda *a, **k: Proc())
    assert t.flush() is None
    assert t._calls == []


def test_flush_never_raises_on_subprocess_error(monkeypatch):
    t = OneMemTracer()
    t._record("message.user", output="x")

    def boom(*a, **k):
        raise subprocess.TimeoutExpired(cmd="x", timeout=1)

    monkeypatch.setenv("ONEMEM_TRACE_CMD", "node /x/onemem-trace.mjs")
    monkeypatch.setattr(subprocess, "run", boom)
    assert t.flush() is None  # swallowed
    assert len(t._calls) == 1  # retained
