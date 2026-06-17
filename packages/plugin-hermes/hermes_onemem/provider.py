"""OneMem memory provider for Hermes.

Records each Hermes agent session as a verifiable on-chain OneMem TraceSession
(Sui + Walrus + Seal). Hermes (Python) can't drive Walrus/Seal natively, so the
provider buffers turns and shells out to the ``onemem-trace`` Node CLI
(``@onemem/sdk-ts``) at session end for the full-fidelity on-chain write — which
also auto-provisions the namespace/cap/signer (zero-config).

Defensive throughout: a OneMem failure must never break the host agent.

Lifecycle (per agent.memory_provider.MemoryProvider):
  sync_turn        -> buffer the user/assistant turn as one ActionCall
  on_memory_write  -> buffer built-in memory writes
  on_delegation    -> buffer subagent task/result (cross-runtime observation)
  on_session_end   -> flush the buffer to chain via the CLI
"""

from __future__ import annotations

import contextlib
import json
import logging
import os
import shlex
import shutil
import subprocess
import tempfile
from typing import Any

from agent.memory_provider import MemoryProvider

logger = logging.getLogger(__name__)

# The Node bridge that owns the on-chain write (Walrus + Seal + Merkle) and the
# zero-config provisioning. Overridable for dev/testing via ONEMEM_TRACE_CMD.
_DEFAULT_TRACE_CMD = "npx -y -p @onemem/sdk-ts@latest onemem-trace"
# Generous: a first-run flush auto-provisions a namespace AND stores every call's
# content on Walrus (slow on testnet), so a multi-call session can take minutes.
_FLUSH_TIMEOUT_S = 600


class OneMemProvider(MemoryProvider):
    """Captures Hermes sessions as verifiable OneMem traces."""

    def __init__(self) -> None:
        self._session_id: str = ""
        self._network: str = os.environ.get("SUI_NETWORK", "testnet")
        # sessionKey -> ordered list of buffered calls
        self._buffers: dict[str, list[dict[str, Any]]] = {}
        # Cross-runtime stitch: when Hermes is spawned by another runtime, that
        # orchestrator sets ONEMEM_PARENT_CALL_ID so Hermes's first on-chain call
        # chains off the parent's call (same namespace) — see the Move
        # integration_tests::..._stitch_via_parent_call_id reference.
        self._parent_call_id: str | None = os.environ.get("ONEMEM_PARENT_CALL_ID") or None
        # The call ids the last flush emitted — an orchestrator can hand one to a
        # sub-runtime it spawns as that runtime's ONEMEM_PARENT_CALL_ID.
        self.last_call_ids: list[str] = []

    @property
    def name(self) -> str:
        return "onemem"

    def is_available(self) -> bool:
        """Ready if the Node bridge is invocable (no network calls here)."""
        parts = shlex.split(self._trace_cmd())
        return bool(parts) and shutil.which(parts[0]) is not None

    def initialize(self, session_id: str, **kwargs) -> None:
        self._session_id = session_id
        if kwargs.get("network"):
            self._network = str(kwargs["network"])
        if kwargs.get("parent_call_id"):
            self._parent_call_id = str(kwargs["parent_call_id"])
        logger.info("[onemem] trace provider active for session %s", session_id)

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
        self._record(session_id, "turn", user_content, assistant_content)

    def on_memory_write(
        self,
        action: str,
        target: str,
        content: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self._record("", f"memory_{action}", {"target": target}, content)

    def on_delegation(
        self, task: str, result: str, *, child_session_id: str = "", **kwargs
    ) -> None:
        self._record("", "delegation", task, {"result": result, "child": child_session_id})

    def on_session_end(self, messages: list[dict[str, Any]]) -> None:
        self._flush(self._session_id)

    def shutdown(self) -> None:
        # Flush anything still buffered across all sessions.
        for key in list(self._buffers.keys()):
            self._flush(key)

    # -- Internals -----------------------------------------------------------

    def _trace_cmd(self) -> str:
        return os.environ.get("ONEMEM_TRACE_CMD", _DEFAULT_TRACE_CMD)

    def _key(self, session_id: str) -> str:
        return session_id or self._session_id or "default"

    def _record(self, session_id: str, tool_name: str, input_val: Any, output_val: Any) -> None:
        key = self._key(session_id)
        self._buffers.setdefault(key, []).append(
            {"toolName": tool_name, "input": input_val, "output": output_val}
        )

    def _flush(self, session_id: str) -> str | None:
        """Write the buffered calls as one on-chain TraceSession via the CLI.

        The buffer is dropped ONLY on a confirmed on-chain write — a failed flush
        keeps it so shutdown()/a later flush can retry instead of silently losing
        the session.
        """
        key = self._key(session_id)
        calls = self._buffers.get(key, [])
        if not calls:
            return None
        payload = {
            "agentId": "hermes",
            "environment": "hermes",
            "label": "hermes",
            "network": self._network,
            "calls": calls,
        }
        if self._parent_call_id:
            payload["parentCallId"] = self._parent_call_id
        path = None
        try:
            with tempfile.NamedTemporaryFile(
                "w", suffix=".json", delete=False, encoding="utf-8"
            ) as f:
                json.dump(payload, f)
                path = f.name
            cmd = [*shlex.split(self._trace_cmd()), path]
            proc = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=_FLUSH_TIMEOUT_S,
                env=os.environ.copy(),
            )
            if proc.returncode != 0:
                logger.error(
                    "[onemem] trace flush FAILED (exit %s); %d call(s) retained for retry: %s",
                    proc.returncode,
                    len(calls),
                    proc.stderr.strip()[:500],
                )
                return None  # buffer intact -> retried on shutdown / next flush
            session = None
            try:
                parsed = json.loads(proc.stdout.strip().splitlines()[-1])
                if isinstance(parsed, dict) and parsed.get("skipped"):
                    self._buffers.pop(key, None)
                    self.last_call_ids = []
                    logger.info("[onemem] trace skipped by runtime controls")
                    return None
                session = parsed.get("sessionId")
                ids = parsed.get("callIds")
                if isinstance(ids, list):
                    self.last_call_ids = [str(c) for c in ids]
            except (ValueError, IndexError):
                session = None
            if not session:
                # Exit 0 but no parseable sessionId: can't confirm the write —
                # RETAIN the buffer for retry rather than risk silent loss.
                logger.error(
                    "[onemem] flush exit 0 but no sessionId; %d call(s) retained; raw: %s",
                    len(calls),
                    proc.stdout.strip()[:300],
                )
                return None
            self._buffers.pop(key, None)  # confirmed durable
            logger.info("[onemem] verifiable trace %s (%d calls)", session, len(calls))
            return session
        except subprocess.SubprocessError as e:  # timeout / spawn failure
            logger.error(
                "[onemem] trace flush error (%s); %d call(s) retained for retry", e, len(calls)
            )
            return None
        except Exception:  # never break the host agent; capture unexpected bugs
            logger.exception(
                "[onemem] unexpected trace flush error; %d call(s) retained", len(calls)
            )
            return None
        finally:
            if path:
                with contextlib.suppress(OSError):
                    os.unlink(path)
