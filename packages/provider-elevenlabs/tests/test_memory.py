"""Unit tests for ElevenLabs explicit memory helper."""

from __future__ import annotations

from onemem.memory import Memory, MemoryError
from onemem_elevenlabs import create_onemem_memory


class FakeMemoryClient:
    def __init__(self, *, results: list[Memory] | None = None, fail: bool = False) -> None:
        self.results = results or []
        self.fail = fail
        self.searches: list[dict[str, object]] = []
        self.adds: list[dict[str, object]] = []

    def search(
        self, query: str, *, top_k: int = 5, namespace: str | None = None
    ) -> list[Memory]:
        self.searches.append({"query": query, "top_k": top_k, "namespace": namespace})
        if self.fail:
            raise MemoryError("search down")
        return self.results

    def add(self, text: str, *, namespace: str | None = None) -> object:
        self.adds.append({"text": text, "namespace": namespace})
        if self.fail:
            raise MemoryError("add down")
        return object()


def test_empty_recall_returns_original_voice_prompt() -> None:
    fake = FakeMemoryClient()
    memory = create_onemem_memory(client=fake, namespace="conv-ns")

    assert memory.recall_context("Start the call") == "Start the call"
    assert fake.searches == [{"query": "Start the call", "top_k": 5, "namespace": "conv-ns"}]


def test_capture_success_and_failure() -> None:
    ok = FakeMemoryClient()
    failing = FakeMemoryClient(fail=True)

    assert create_onemem_memory(client=ok).capture("User: hi\nAssistant: hello") is True
    assert ok.adds == [{"text": "User: hi\nAssistant: hello", "namespace": None}]
    assert create_onemem_memory(client=failing).capture("turn") is False


def test_recall_failure_is_non_fatal() -> None:
    memory = create_onemem_memory(client=FakeMemoryClient(fail=True))

    assert memory.recall_context("hello") == "hello"
