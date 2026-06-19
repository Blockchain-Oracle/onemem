"""OneMem memory provider for Hermes.

Decentralized memory for Hermes agents, stored on MemWal (Seal-encrypted blobs
on Walrus). The provider recalls relevant past memories before a turn and
captures the exchange after it, shelling out to the ``onemem-memory`` Node bridge
(``@onemem/sdk-ts``) for the full MemWal round-trip.

Defensive throughout: a OneMem failure must never break the host agent.

Lifecycle (per agent.memory_provider.MemoryProvider):
  sync_turn        -> capture the user/assistant exchange as a memory
  on_memory_write  -> capture an explicit memory write
"""

from __future__ import annotations

import logging
from typing import Any, Protocol

from agent.memory_provider import MemoryProvider
from onemem.provider_memory import ProviderMemory

logger = logging.getLogger(__name__)


class _MemoryLike(Protocol):
    """The recall/capture surface the provider needs (ProviderMemory satisfies it)."""

    @property
    def enabled(self) -> bool: ...

    def capture(self, text: str) -> bool: ...

    def recall_context(self, input_text: str, *, top_k: int = 5) -> str: ...


class OneMemProvider(MemoryProvider):
    """Captures Hermes sessions as decentralized memory on MemWal."""

    def __init__(self, memory: _MemoryLike | None = None) -> None:
        self._session_id: str = ""
        self._memory: _MemoryLike = memory or ProviderMemory(
            context_header="Relevant OneMem memories:"
        )

    @property
    def name(self) -> str:
        return "onemem"

    def is_available(self) -> bool:
        """Ready when memory is enabled (the bridge resolves config lazily)."""
        return self._memory.enabled

    def initialize(self, session_id: str, **kwargs) -> None:
        self._session_id = session_id
        logger.info("[onemem] memory provider active for session %s", session_id)

    def get_tool_schemas(self) -> list[dict[str, Any]]:
        # Context-only: OneMem observes from outside the decision loop; it
        # exposes no tools the model has to call.
        return []

    # -- Capture hooks -------------------------------------------------------

    def sync_turn(
        self,
        user_content: str,
        assistant_content: str,
        *,
        session_id: str = "",
        messages: list[dict[str, Any]] | None = None,
    ) -> None:
        text = f"User: {user_content}\nAssistant: {assistant_content}".strip()
        if text:
            self._memory.capture(text)

    def on_memory_write(
        self,
        action: str,
        target: str,
        content: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        if content:
            self._memory.capture(content)

    def recall_context(self, input_text: str, *, top_k: int = 5) -> str:
        """Search prior memories and render them as a context block for `input_text`."""
        return self._memory.recall_context(input_text, top_k=top_k)
