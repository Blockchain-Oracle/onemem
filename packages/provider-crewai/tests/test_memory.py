"""Unit tests for CrewAI explicit memory helper."""

from __future__ import annotations

from onemem.memory import Memory, MemoryError
from onemem_crewai import create_onemem_memory


class FakeMemoryClient:
    def __init__(self, *, fail_search: bool = False, fail_add: bool = False) -> None:
        self.fail_search = fail_search
        self.fail_add = fail_add
        self.searches: list[dict[str, object]] = []
        self.adds: list[dict[str, object]] = []

    def search(
        self, query: str, *, top_k: int = 5, namespace: str | None = None
    ) -> list[Memory]:
        self.searches.append({"query": query, "top_k": top_k, "namespace": namespace})
        if self.fail_search:
            raise MemoryError("search down")
        return [Memory(text="Remember the Sui package id", walrus_blob_id="blob", relevance=0.8)]

    def add(self, text: str, *, namespace: str | None = None) -> object:
        self.adds.append({"text": text, "namespace": namespace})
        if self.fail_add:
            raise MemoryError("add down")
        return object()


def test_recall_context_and_capture_use_namespace() -> None:
    fake = FakeMemoryClient()
    memory = create_onemem_memory(client=fake, namespace="crew-ns")

    prompt = memory.recall_context("Plan the crew task", top_k=2)
    assert prompt == (
        "Relevant OneMem memories for this crew:\n"
        "- Remember the Sui package id\n\n"
        "Plan the crew task"
    )
    assert fake.searches == [{"query": "Plan the crew task", "top_k": 2, "namespace": "crew-ns"}]
    assert memory.capture("Crew completed the task") is True
    assert fake.adds == [{"text": "Crew completed the task", "namespace": "crew-ns"}]


def test_memory_failures_do_not_break_crewai_flow() -> None:
    fake = FakeMemoryClient(fail_search=True, fail_add=True)
    memory = create_onemem_memory(client=fake)

    assert memory.recall_context("keep going") == "keep going"
    assert memory.capture("answer") is False
