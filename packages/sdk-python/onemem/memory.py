"""Memory mirror — add/search over MemWal, mirroring the TS MemoryAPI.

Python can't drive Walrus/Seal/embeddings natively, so this shells out to the
``onemem-memory`` Node CLI from ``@onemem/sdk-ts``, which owns the full MemWal
round-trip (client-side Seal encryption + Walrus + embeddings). MemWal config +
signer come from env, read by the CLI:

    ONEMEM_DELEGATE_KEY / ONEMEM_ACCOUNT_ID / ONEMEM_EMBEDDING_API_KEY
    [+ MEMWAL_PACKAGE_ID / MEMWAL_RELAYER_URL / ONEMEM_RPC_URL]

MemWal 0.0.7 is append-only (no get/get_all/delete primitive). The TS SDK backs
``get`` / ``get_all`` / ``delete`` with a local SQLite index that mirrors every
write; this Python client exposes the same surface through the bridge. ``delete``
is a SOFT delete (the encrypted Walrus blob persists until its epoch expires),
mirroring the honest TS semantics.
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
    #: Client-side SHA-256 of the plaintext, for local dedup — NOT a chain
    #: attestation. May be absent if the bridge did not return it.
    input_hash_hex: str | None = None


@dataclass(frozen=True, slots=True)
class StoredMemory:
    """A memory as held in the local index — the CRUD/listing shape."""

    id: str
    text: str
    walrus_blob_id: str
    namespace: str
    user_id: str | None = None
    agent_id: str | None = None
    run_id: str | None = None
    metadata: dict[str, Any] | None = None
    created_at: int = 0


def _to_stored(row: dict[str, Any]) -> StoredMemory:
    meta = row.get("metadata")
    metadata = cast("dict[str, Any]", meta) if isinstance(meta, dict) else None
    user_id = row.get("userId")
    agent_id = row.get("agentId")
    run_id = row.get("runId")
    return StoredMemory(
        id=str(row.get("id", "")),
        text=str(row.get("text", "")),
        walrus_blob_id=str(row.get("walrusBlobId", "")),
        namespace=str(row.get("namespace", "default")),
        user_id=str(user_id) if isinstance(user_id, str) else None,
        agent_id=str(agent_id) if isinstance(agent_id, str) else None,
        run_id=str(run_id) if isinstance(run_id, str) else None,
        metadata=metadata,
        created_at=int(row.get("createdAt", 0)),
    )


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

    def _effective_namespace(self, namespace: str | None, user_id: str | None) -> str | None:
        """Mirror the TS effectiveNamespace priority for add/search.

        explicit namespace > userId derivation (done by the CLI) > config
        namespace (``self.namespace``) > "default" (also the CLI). We only apply
        ``self.namespace`` when there is neither an explicit namespace nor a
        user_id, so the CLI's ``user:<id>`` derivation is NOT clobbered — config
        namespace is below userId in TS, not above it.
        """
        if namespace is not None:
            return namespace
        if user_id is not None:
            return None  # let the CLI derive `user:<id>`
        return self.namespace

    def add(
        self,
        text: str,
        *,
        namespace: str | None = None,
        user_id: str | None = None,
        agent_id: str | None = None,
        run_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> AddResult:
        """Store a memory via MemWal (client-side Seal-encrypted, saved to Walrus).

        Optionally scope it to a user/agent/run + attach JSON metadata. Returns
        the MemWal memory id + Walrus blob id (and the client-side input hash,
        when the bridge supplies it).
        """
        if not text:
            raise MemoryError("add requires non-empty text")
        out = self._run(
            {
                "op": "add",
                "text": text,
                "namespace": self._effective_namespace(namespace, user_id),
                "userId": user_id,
                "agentId": agent_id,
                "runId": run_id,
                "metadata": metadata,
            }
        )
        input_hash = out.get("inputHashHex")
        return AddResult(
            memory_id=str(out.get("memoryId", "")),
            walrus_blob_id=str(out.get("walrusBlobId", "")),
            input_hash_hex=str(input_hash) if isinstance(input_hash, str) else None,
        )

    def search(
        self,
        query: str,
        *,
        top_k: int = 5,
        namespace: str | None = None,
        user_id: str | None = None,
        agent_id: str | None = None,
        run_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> list[Memory]:
        """Vector-search memories; returns decrypted hits ranked by relevance.

        Scope kwargs (user/agent/run/metadata) mirror the TS surface: they pick
        the namespace and post-filter the recall against the local index.
        """
        if not query:
            raise MemoryError("search requires non-empty query")
        out = self._run(
            {
                "op": "search",
                "query": query,
                "topK": top_k,
                "namespace": self._effective_namespace(namespace, user_id),
                "userId": user_id,
                "agentId": agent_id,
                "runId": run_id,
                "metadata": metadata,
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

    def get(self, memory_id: str) -> StoredMemory | None:
        """Fetch one stored memory by id from the local index (None if missing/deleted)."""
        if not memory_id:
            raise MemoryError("get requires a non-empty id")
        out = self._run({"op": "get", "id": memory_id})
        memory = out.get("memory")
        return _to_stored(cast("dict[str, Any]", memory)) if isinstance(memory, dict) else None

    def get_all(
        self,
        *,
        user_id: str | None = None,
        agent_id: str | None = None,
        run_id: str | None = None,
        namespace: str | None = None,
        metadata: dict[str, Any] | None = None,
        limit: int | None = None,
    ) -> list[StoredMemory]:
        """List stored memories from the local index, newest-first, scope-filtered."""
        # Pass namespace through AS-IS (None -> no namespace filter), matching the
        # TS getAll: config/default namespace is NOT applied as a list filter, so
        # get_all() with no namespace lists across all namespaces for the account.
        out = self._run(
            {
                "op": "list",
                "userId": user_id,
                "agentId": agent_id,
                "runId": run_id,
                "namespace": namespace,
                "metadata": metadata,
                "limit": limit,
            }
        )
        memories = out.get("memories", [])
        rows = cast("list[dict[str, Any]]", memories) if isinstance(memories, list) else []
        return [_to_stored(r) for r in rows]

    def delete(self, memory_id: str) -> bool:
        """Soft-delete a memory by id.

        Removes it from get/get_all/search. The encrypted Walrus blob persists
        until its storage epoch expires — a true hard delete is not possible on
        append-only MemWal. Returns True if a row was flipped to deleted.
        """
        if not memory_id:
            raise MemoryError("delete requires a non-empty id")
        out = self._run({"op": "delete", "id": memory_id})
        return bool(out.get("deleted", False))

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
