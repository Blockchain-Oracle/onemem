"""Memory mirror — add/search over MemWal, mirroring the TS MemoryAPI.

Python can't drive Walrus/Seal/embeddings natively, so this shells out to the
``onemem-memory`` Node CLI from ``@onemem/sdk-ts``, which owns the full MemWal
round-trip (client-side Seal encryption + Walrus + embeddings). MemWal config +
signer come from env, read by the CLI:

    ONEMEM_DELEGATE_KEY / ONEMEM_ACCOUNT_ID / ONEMEM_EMBEDDING_API_KEY
    [+ MEMWAL_PACKAGE_ID / MEMWAL_RELAYER_URL / ONEMEM_RPC_URL]

MemWal 0.0.5 has no get-by-id / update / delete / list primitive, so — exactly
as in the TS SDK — only ``add`` + ``search`` are exposed here.
"""

from __future__ import annotations

import json
import os
import shlex
import subprocess
from dataclasses import dataclass
from typing import Any, cast

# The Node bridge that owns the MemWal round-trip. Overridable for dev/testing.
DEFAULT_MEMORY_CMD = "npx -y -p @onemem/sdk-ts@latest onemem-memory"
# A first add auto-provisions + stores on Walrus (slow on testnet); be generous.
DEFAULT_TIMEOUT_S = 600


class MemoryError(RuntimeError):
    """Raised when the memory bridge fails (spawn, non-zero exit, or bad output)."""


@dataclass(frozen=True, slots=True)
class Memory:
    text: str
    walrus_blob_id: str
    #: Normalized relevance in [0, 1] (1 - L2 distance).
    relevance: float


@dataclass(frozen=True, slots=True)
class AddResult:
    memory_id: str
    walrus_blob_id: str
    #: The verifiability receipt (sui tx digest, call id, content hash, ...).
    attestation: dict[str, Any]


class MemoryClient:
    """add/search memories via the ``onemem-memory`` Node bridge."""

    def __init__(
        self,
        *,
        network: str | None = None,
        namespace: str | None = None,
        command: str | None = None,
        timeout_s: int = DEFAULT_TIMEOUT_S,
    ) -> None:
        self.network = network or os.environ.get("SUI_NETWORK", "testnet")
        self.namespace = namespace
        self.command = command or os.environ.get("ONEMEM_MEMORY_CMD", DEFAULT_MEMORY_CMD)
        self.timeout_s = timeout_s

    def add(self, text: str, *, namespace: str | None = None) -> AddResult:
        """Store a memory (Seal-encrypted on Walrus + on-chain ActionCall attestation)."""
        if not text:
            raise MemoryError("add requires non-empty text")
        out = self._run({"op": "add", "text": text, "namespace": namespace or self.namespace})
        attestation = out.get("attestation", {})
        return AddResult(
            memory_id=str(out.get("memoryId", "")),
            walrus_blob_id=str(out.get("walrusBlobId", "")),
            attestation=cast("dict[str, Any]", attestation)
            if isinstance(attestation, dict)
            else {},
        )

    def search(self, query: str, *, top_k: int = 5, namespace: str | None = None) -> list[Memory]:
        """Vector-search memories; returns decrypted hits ranked by relevance."""
        if not query:
            raise MemoryError("search requires non-empty query")
        out = self._run(
            {
                "op": "search",
                "query": query,
                "topK": top_k,
                "namespace": namespace or self.namespace,
            }
        )
        results = out.get("results", [])
        rows = cast("list[dict[str, Any]]", results) if isinstance(results, list) else []
        return [
            Memory(
                text=str(r.get("text", "")),
                walrus_blob_id=str(r.get("walrusBlobId", "")),
                relevance=float(r.get("relevance", 0.0)),
            )
            for r in rows
        ]

    def _run(self, payload: dict[str, Any]) -> dict[str, Any]:
        body: dict[str, Any] = {k: v for k, v in payload.items() if v is not None}
        body.setdefault("network", self.network)
        cmd = shlex.split(self.command)
        try:
            proc = subprocess.run(
                cmd,
                input=json.dumps(body),
                capture_output=True,
                text=True,
                timeout=self.timeout_s,
                env=os.environ.copy(),
                check=False,
            )
        except (OSError, subprocess.SubprocessError) as e:
            raise MemoryError(f"onemem-memory spawn failed: {e}") from e
        if proc.returncode != 0:
            raise MemoryError(
                f"onemem-memory exited {proc.returncode}: {proc.stderr.strip()[:500]}"
            )
        line = proc.stdout.strip().splitlines()[-1] if proc.stdout.strip() else ""
        try:
            parsed = json.loads(line)
        except ValueError as e:
            raise MemoryError(f"onemem-memory returned non-JSON output: {line[:200]}") from e
        if not isinstance(parsed, dict):
            raise MemoryError(f"onemem-memory returned unexpected output: {line[:200]}")
        return cast("dict[str, Any]", parsed)
