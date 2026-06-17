"""Unit tests for the CrewAI OneMem tracer (pure-stdlib; subprocess mocked)."""

from __future__ import annotations

import json
import subprocess

from onemem_crewai import OneMemTracer


class FakeStep:
    def __init__(self, tool, tool_input, result):
        self.tool = tool
        self.tool_input = tool_input
        self.result = result


class FakeTaskOutput:
    def __init__(self, name, raw):
        self.name = name
        self.raw = raw


def test_step_and_task_buffering():
    t = OneMemTracer(agent_id="crew-x")
    t.step(FakeStep("web_search", {"q": "sui"}, "3 hits"))
    t.step({"thought": "reasoning"})  # dict shape, no tool -> agent.step
    t.task(FakeTaskOutput("research", "final answer"))
    calls = t._calls
    assert len(calls) == 3
    assert calls[0]["toolName"] == "web_search"
    assert calls[0]["input"] == {"q": "sui"}
    assert calls[0]["output"] == "3 hits"
    assert calls[1]["toolName"] == "agent.step"
    assert calls[2]["toolName"] == "task"
    assert calls[2]["input"] == "research"
    assert calls[2]["output"] == "final answer"


def test_flush_builds_payload_and_parses_session(monkeypatch):
    t = OneMemTracer(agent_id="crew-x")
    t.step(FakeStep("t", "i", "o"))
    captured = {}

    class Proc:
        returncode = 0
        stdout = '{"sessionId":"0xabc","namespaceId":"0xns","rwCapId":"0xcap"}\n'
        stderr = ""

    def fake_run(cmd, **kw):
        with open(cmd[-1]) as fh:
            captured["payload"] = json.load(fh)
        return Proc()

    monkeypatch.setenv("ONEMEM_TRACE_CMD", "node /x/onemem-trace.mjs")
    monkeypatch.setattr(subprocess, "run", fake_run)
    assert t.flush() == "0xabc"
    assert captured["payload"]["agentId"] == "crew-x"
    assert captured["payload"]["calls"][0]["toolName"] == "t"
    assert t._calls == []  # cleared after success


def test_flush_empty_is_noop(monkeypatch):
    called = False

    def fake_run(*a, **k):
        nonlocal called
        called = True

    monkeypatch.setattr(subprocess, "run", fake_run)
    assert OneMemTracer().flush() is None
    assert called is False


def test_flush_retains_buffer_on_failure(monkeypatch):
    t = OneMemTracer()
    t.step(FakeStep("t", "i", "o"))

    class Proc:
        returncode = 1
        stdout = ""
        stderr = "boom"

    monkeypatch.setenv("ONEMEM_TRACE_CMD", "node /x/onemem-trace.mjs")
    monkeypatch.setattr(subprocess, "run", lambda *a, **k: Proc())
    assert t.flush() is None
    assert len(t._calls) == 1  # retained for retry


def test_flush_retains_buffer_on_unparseable_success(monkeypatch):
    t = OneMemTracer()
    t.step(FakeStep("t", "i", "o"))

    class Proc:
        returncode = 0
        stdout = "not json"
        stderr = ""

    monkeypatch.setenv("ONEMEM_TRACE_CMD", "node /x/onemem-trace.mjs")
    monkeypatch.setattr(subprocess, "run", lambda *a, **k: Proc())
    assert t.flush() is None
    assert len(t._calls) == 1  # exit 0 but no sessionId → retained for retry (no silent loss)


def test_flush_clears_buffer_on_runtime_policy_skip(monkeypatch):
    t = OneMemTracer()
    t.step(FakeStep("t", "i", "o"))

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
    t.step(FakeStep("t", "i", "o"))

    def boom(*a, **k):
        raise subprocess.TimeoutExpired(cmd="x", timeout=1)

    monkeypatch.setenv("ONEMEM_TRACE_CMD", "node /x/onemem-trace.mjs")
    monkeypatch.setattr(subprocess, "run", boom)
    assert t.flush() is None  # swallowed
