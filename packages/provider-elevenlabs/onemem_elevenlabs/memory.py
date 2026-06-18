"""Explicit OneMem memory helper for ElevenLabs Conversational AI apps."""

from __future__ import annotations

import logging

from onemem.provider_memory import MemoryClientLike, ProviderMemory


def create_onemem_memory(
    *,
    client: MemoryClientLike | None = None,
    network: str | None = None,
    namespace: str | None = None,
    command: str | None = None,
    enabled: bool = True,
    context_header: str = "Context from prior OneMem conversations:",
    logger: logging.Logger | None = None,
) -> ProviderMemory:
    """Create an explicit recall/capture helper for ElevenLabs voice workflows."""
    return ProviderMemory(
        client=client,
        network=network,
        namespace=namespace,
        command=command,
        enabled=enabled,
        context_header=context_header,
        logger=logger,
    )
