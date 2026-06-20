"""Unit tests for the OneMem Hermes memory provider.

Pure logic only — the MemWal round-trip is stubbed via a fake ProviderMemory, so
these run without Node or a network. The live end-to-end is covered separately
against testnet.
"""

from __future__ import annotations

import pytest

# The provider subclasses Hermes's MemoryProvider; skip cleanly if hermes-agent
# isn't installed in this environment.
pytest.importorskip("agent.memory_provider")

from hermes_onemem.provider import OneMemProvider


class FakeMemory:
    def __init__(self, *, enabled: bool = True) -> None:
        self.enabled = enabled
        self.captured: list[str] = []
        self.recalled: list[str] = []

    def capture(self, text: str) -> bool:
        self.captured.append(text)
        return True

    def recall_context(self, input_text: str, *, top_k: int = 5) -> str:
        self.recalled.append(input_text)
        return f"memories for: {input_text}\n\n{input_text}"


def test_name_and_no_tools():
    p = OneMemProvider(memory=FakeMemory())
    assert p.name == "onemem"
    assert p.get_tool_schemas() == []


def test_is_available_reflects_memory_enabled():
    assert OneMemProvider(memory=FakeMemory(enabled=True)).is_available() is True
    assert OneMemProvider(memory=FakeMemory(enabled=False)).is_available() is False


def test_sync_turn_captures_the_exchange():
    mem = FakeMemory()
    p = OneMemProvider(memory=mem)
    p.initialize("s1")
    p.sync_turn("hi", "hello", session_id="s1")
    assert mem.captured == ["User: hi\nAssistant: hello"]


def test_on_memory_write_captures_content():
    mem = FakeMemory()
    p = OneMemProvider(memory=mem)
    p.on_memory_write("add", "user", "likes concise answers")
    assert mem.captured == ["likes concise answers"]


def test_recall_context_searches_and_prepends():
    mem = FakeMemory()
    p = OneMemProvider(memory=mem)
    out = p.recall_context("what do I like?")
    assert mem.recalled == ["what do I like?"]
    assert out.endswith("what do I like?")
