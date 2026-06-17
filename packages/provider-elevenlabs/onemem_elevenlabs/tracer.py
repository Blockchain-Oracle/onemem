"""OneMem tracer for ElevenLabs Conversational AI (voice).

Records an ElevenLabs `Conversation` as a verifiable on-chain OneMem TraceSession
(Sui + Walrus + Seal). ElevenLabs' SDK is Python; OneMem's trace stack
(Walrus/Seal) is JS-only, so the on-chain write — and zero-config provisioning of
namespace/cap/signer — is delegated to the `onemem-trace` Node CLI.

    from elevenlabs.conversational_ai.conversation import Conversation, ClientTools
    from onemem_elevenlabs import OneMemTracer

    tracer = OneMemTracer(agent_id="voice-bot")
    tools = tracer.wrap_tools(ClientTools())          # captures tool calls
    conv = Conversation(
        client, agent_id, requires_auth=True,
        client_tools=tools,
        **tracer.callbacks(),                          # captures transcripts; flushes on end
    )

`callbacks()` chains any callbacks you already pass, so OneMem never displaces
your own handlers. Targets the elevenlabs SDK 2.x conversational-AI surface
(callback_user_transcript / callback_agent_response /
callback_agent_response_correction / callback_end_session, ClientTools.register).
Defensive: a OneMem failure never breaks the voice conversation.
"""

from __future__ import annotations

import asyncio
import contextlib
import functools
import inspect
import json
import logging
import os
import shlex
import subprocess
import tempfile
import threading
from collections.abc import Awaitable, Callable
from typing import Any, cast

logger = logging.getLogger(__name__)

_DEFAULT_TRACE_CMD = "npx -y -p @onemem/sdk-ts@latest onemem-trace"
_FLUSH_TIMEOUT_S = 600
_BACKGROUND_CALLBACKS: set[asyncio.Future[Any]] = set()


def _safe(value: Any) -> Any:
    if value is None or isinstance(value, (str, int, float, bool, list, dict)):
        return value
    try:
        return str(value)[:4000]
    except Exception:
        return "<unrepresentable>"


class OneMemTracer:
    """Buffers ElevenLabs Conversation events and flushes them as one on-chain trace."""

    def __init__(
        self,
        agent_id: str = "elevenlabs",
        environment: str = "elevenlabs",
        network: str | None = None,
    ) -> None:
        self._agent_id = agent_id
        self._environment = environment
        self._network = network or os.environ.get("SUI_NETWORK", "testnet")
        self._calls: list[dict[str, Any]] = []

    # -- Wiring --------------------------------------------------------------

    def callbacks(
        self,
        callback_user_transcript: Callable[[str], Any] | None = None,
        callback_agent_response: Callable[[str], Any] | None = None,
        callback_agent_response_correction: Callable[[str, str], Any] | None = None,
        callback_end_session: Callable[[], Any] | None = None,
    ) -> dict[str, Callable[..., Any]]:
        """Return the `Conversation(...)` callback kwargs that record this session.

        Any callback you already use is chained (called first), so OneMem
        observes without replacing your handlers. The end-session callback
        triggers an off-thread flush.
        """

        def on_user(transcript: str) -> None:
            self._record("message.user", output=transcript)
            _chain(callback_user_transcript, transcript)

        def on_agent(response: str) -> None:
            self._record("message.agent", output=response)
            _chain(callback_agent_response, response)

        def on_correction(original: str, corrected: str) -> None:
            self._record("message.agent.correction", input=original, output=corrected)
            _chain(callback_agent_response_correction, original, corrected)

        def on_end() -> None:
            # flush() runs a blocking subprocess (Walrus is slow); never block the
            # conversation's loop on teardown — do it off-thread.
            threading.Thread(target=self.flush, name="onemem-flush", daemon=True).start()
            _chain(callback_end_session)

        return {
            "callback_user_transcript": on_user,
            "callback_agent_response": on_agent,
            "callback_agent_response_correction": on_correction,
            "callback_end_session": on_end,
        }

    def wrap_tools(self, client_tools: Any) -> Any:
        """Wrap a `ClientTools` so every registered handler's call is traced.

        Returns the same `client_tools` for chaining. Preserves sync/async
        handler semantics.
        """
        original_register = client_tools.register

        @functools.wraps(original_register)
        def register(tool_name: str, handler: Callable[..., Any], is_async: bool = False) -> Any:
            return original_register(tool_name, self._wrap_handler(tool_name, handler), is_async)

        client_tools.register = register
        return client_tools

    def _wrap_handler(self, tool_name: str, handler: Callable[..., Any]) -> Callable[..., Any]:
        # Record in `finally` so a failed tool call is still captured (a failed
        # tool is often the most important thing in the trace); the handler's
        # exception still propagates to the host.
        if inspect.iscoroutinefunction(handler):

            @functools.wraps(handler)
            async def awrapped(params: dict) -> Any:
                result = None
                try:
                    result = await handler(params)
                    return result
                finally:
                    self._record(
                        tool_name, input=params, output=result, namespace="elevenlabs-tool"
                    )

            return awrapped

        @functools.wraps(handler)
        def wrapped(params: dict) -> Any:
            result = None
            try:
                result = handler(params)
                return result
            finally:
                self._record(tool_name, input=params, output=result, namespace="elevenlabs-tool")

        return wrapped

    # -- Buffer --------------------------------------------------------------

    def _record(
        self,
        tool_name: str,
        *,
        input: Any = None,
        output: Any = None,
        namespace: str = "elevenlabs",
    ) -> None:
        # Capture must never break the conversation, even on weird payloads.
        try:
            self._calls.append(
                {
                    "toolName": tool_name,
                    "toolNamespace": namespace,
                    "input": _safe(input),
                    "output": _safe(output),
                }
            )
        except Exception:
            logger.exception("[onemem] %s capture failed", tool_name)

    # -- Flush ---------------------------------------------------------------

    def flush(self) -> str | None:
        """Write the buffered calls as one on-chain TraceSession (never raises)."""
        if not self._calls:
            return None
        payload = {
            "agentId": self._agent_id,
            "environment": self._environment,
            "label": "elevenlabs",
            "network": self._network,
            "calls": self._calls,
        }
        path = None
        try:
            with tempfile.NamedTemporaryFile(
                "w", suffix=".json", delete=False, encoding="utf-8"
            ) as f:
                json.dump(payload, f)
                path = f.name
            cmd = [*shlex.split(os.environ.get("ONEMEM_TRACE_CMD", _DEFAULT_TRACE_CMD)), path]
            proc = subprocess.run(
                cmd, capture_output=True, text=True, timeout=_FLUSH_TIMEOUT_S, env=os.environ.copy()
            )
            if proc.returncode != 0:
                logger.error(
                    "[onemem] trace flush FAILED (exit %s); %d call(s) retained: %s",
                    proc.returncode,
                    len(self._calls),
                    proc.stderr.strip()[:500],
                )
                return None
            session = None
            with contextlib.suppress(ValueError, IndexError):
                parsed = json.loads(proc.stdout.strip().splitlines()[-1])
                if isinstance(parsed, dict) and parsed.get("skipped"):
                    self._calls.clear()
                    logger.info("[onemem] trace skipped by runtime controls")
                    return None
                session = parsed.get("sessionId") if isinstance(parsed, dict) else None
            if not session:
                logger.error(
                    "[onemem] flush exit 0 but no sessionId; %d call(s) retained: %s",
                    len(self._calls),
                    proc.stdout.strip()[:300],
                )
                return None
            self._calls.clear()
            logger.info("[onemem] verifiable trace %s (%d calls)", session, len(payload["calls"]))
            return session
        except subprocess.SubprocessError as e:
            logger.error(
                "[onemem] trace flush error (%s); %d call(s) retained", e, len(self._calls)
            )
            return None
        except Exception:
            logger.exception(
                "[onemem] unexpected trace flush error; %d call(s) retained", len(self._calls)
            )
            return None
        finally:
            if path:
                with contextlib.suppress(OSError):
                    os.unlink(path)


def _chain(fn: Callable[..., Any] | None, *args: Any) -> None:
    """Invoke a user-supplied callback (sync or async), never raising."""
    if fn is None:
        return
    try:
        result = fn(*args)
        if inspect.isawaitable(result):
            awaitable = cast(Awaitable[Any], result)
            # ElevenLabs fires callbacks from both async and sync (WS worker
            # thread) contexts. Schedule on the running loop if there is one;
            # otherwise run to completion ourselves so the user's coroutine is
            # never silently dropped.
            try:
                future = asyncio.ensure_future(awaitable)
                _BACKGROUND_CALLBACKS.add(future)
                future.add_done_callback(_BACKGROUND_CALLBACKS.discard)
            except RuntimeError:
                if inspect.iscoroutine(awaitable):
                    asyncio.run(awaitable)
                else:
                    loop = asyncio.new_event_loop()
                    try:
                        loop.run_until_complete(awaitable)
                    finally:
                        loop.close()
    except Exception:
        logger.exception("[onemem] chained callback failed")
