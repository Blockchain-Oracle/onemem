"""Unit tests for LiveKit explicit memory helper."""

from __future__ import annotations

from onemem.memory import Memory, MemoryError
from onemem_livekit import create_onemem_memory


class FakeMemoryClient:
    def __init__(self, *, fail: bool = False) -> None:
        self.fail = fail
        self.searches: list[dict[str, object]] = []
        self.adds: list[dict[str, object]] = []

    def search(
        self, query: str, *, top_k: int = 5, namespace: str | None = None
    ) -> list[Memory]:
        self.searches.append({"query": query, "top_k": top_k, "namespace": namespace})
        if self.fail:
            raise MemoryError("search down")
        return [Memory(text="Alice prefers concise replies", walrus_blob_id="blob", relevance=0.9)]

    def add(self, text: str, *, namespace: str | None = None) -> object:
        self.adds.append({"text": text, "namespace": namespace})
        if self.fail:
            raise MemoryError("add down")
        return object()


def test_voice_context_helper_formats_livekit_memories() -> None:
    fake = FakeMemoryClient()
    memory = create_onemem_memory(client=fake, namespace="room-ns")

    text = memory.recall_context("How should I greet Alice?", top_k=1)
    assert text == (
        "Context from prior OneMem conversations:\n"
        "- Alice prefers concise replies\n\n"
        "How should I greet Alice?"
    )
    assert fake.searches == [
        {"query": "How should I greet Alice?", "top_k": 1, "namespace": "room-ns"}
    ]
    assert memory.capture("User: hi\nAssistant: hello") is True
    assert fake.adds == [{"text": "User: hi\nAssistant: hello", "namespace": "room-ns"}]


def test_disabled_memory_is_noop() -> None:
    fake = FakeMemoryClient()
    memory = create_onemem_memory(client=fake, enabled=False)

    assert memory.recall_context("hello") == "hello"
    assert memory.capture("turn") is False
    assert fake.searches == []
    assert fake.adds == []


def test_failures_are_swallowed_for_livekit() -> None:
    memory = create_onemem_memory(client=FakeMemoryClient(fail=True))

    assert memory.recall_context("hello") == "hello"
    assert memory.capture("turn") is False
