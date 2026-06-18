"""Defensive memory helpers for Python framework providers.

These helpers mirror the explicit TypeScript provider memory boundary: recall
before a framework call, capture after it, and never let OneMem memory failures
break the host agent workflow.
"""

from __future__ import annotations

import logging
from collections.abc import Sequence
from typing import Protocol

from .memory import Memory, MemoryClient, MemoryError

DEFAULT_CONTEXT_HEADER = "Relevant OneMem memories:"


class MemoryClientLike(Protocol):
    def search(
        self, query: str, *, top_k: int = 5, namespace: str | None = None
    ) -> list[Memory]: ...

    def add(self, text: str, *, namespace: str | None = None) -> object: ...


class ProviderMemory:
    """Small explicit recall/capture wrapper for provider packages."""

    def __init__(
        self,
        *,
        client: MemoryClientLike | None = None,
        network: str | None = None,
        namespace: str | None = None,
        command: str | None = None,
        enabled: bool = True,
        context_header: str = DEFAULT_CONTEXT_HEADER,
        logger: logging.Logger | None = None,
    ) -> None:
        self.namespace = namespace
        self.enabled = enabled
        self.context_header = context_header
        self._logger = logger or logging.getLogger(__name__)
        self._client = client or MemoryClient(network=network, namespace=namespace, command=command)

    def recall(self, query: str, *, top_k: int = 5) -> list[Memory]:
        """Return matching memories, swallowing bridge failures defensively."""
        if not self.enabled or not query:
            return []
        try:
            return self._client.search(query, top_k=top_k, namespace=self.namespace)
        except MemoryError as exc:
            self._logger.warning("[onemem] memory recall failed: %s", exc)
            return []

    def recall_context(self, input_text: str, *, top_k: int = 5) -> str:
        """Prepend recalled memories to input text; unchanged when none/failing."""
        memories = self.recall(input_text, top_k=top_k)
        return inject_memories(input_text, memories, header=self.context_header)

    def capture(self, text: str) -> bool:
        """Store text as memory; return success instead of raising."""
        if not self.enabled or not text:
            return False
        try:
            self._client.add(text, namespace=self.namespace)
            return True
        except MemoryError as exc:
            self._logger.warning("[onemem] memory capture failed: %s", exc)
            return False


def inject_memories(
    input_text: str,
    memories: Sequence[Memory],
    *,
    header: str = DEFAULT_CONTEXT_HEADER,
) -> str:
    """Format memories as a compact context block plus the original input."""
    if not memories:
        return input_text
    lines = [header]
    for memory in memories:
        lines.append(f"- {memory.text}")
    return "\n".join(lines) + f"\n\n{input_text}"
