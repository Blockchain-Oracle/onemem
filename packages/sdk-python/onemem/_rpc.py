"""Minimal Sui JSON-RPC reads over httpx.

The Python SDK's headline is the off-chain verifier, which only needs reads
(get object, query events). We hit the JSON-RPC directly rather than depend on
pysui's heavier transaction stack — keeping the verifier version-robust and
usable from any Python.
"""

from __future__ import annotations

from typing import Any, cast

import httpx


class SuiRpcError(RuntimeError):
    """A Sui JSON-RPC call returned an error or malformed payload."""


class SuiRpc:
    """Tiny synchronous JSON-RPC client for the Sui fullnode read methods."""

    def __init__(self, rpc_url: str, *, timeout_s: float = 30.0) -> None:
        self._url = rpc_url
        self._client = httpx.Client(timeout=timeout_s)
        self._id = 0

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> SuiRpc:
        return self

    def __exit__(self, *_exc: object) -> None:
        self.close()

    def _call(self, method: str, params: list[Any]) -> Any:
        self._id += 1
        resp = self._client.post(
            self._url,
            json={"jsonrpc": "2.0", "id": self._id, "method": method, "params": params},
        )
        resp.raise_for_status()
        body: dict[str, Any] = cast(dict[str, Any], resp.json())
        if "error" in body:
            raise SuiRpcError(f"{method}: {body['error']}")
        return body["result"]

    def get_object_fields(self, object_id: str) -> dict[str, Any]:
        """Return a Move object's `content.fields`, or raise SuiRpcError."""
        result: dict[str, Any] = cast(
            dict[str, Any],
            self._call("sui_getObject", [object_id, {"showContent": True, "showType": True}]),
        )
        if result.get("error") or not result.get("data"):
            raise SuiRpcError(f"sui_getObject({object_id}): {result.get('error')}")
        data: dict[str, Any] = cast(dict[str, Any], result["data"])
        content: dict[str, Any] | None = cast("dict[str, Any] | None", data.get("content"))
        if not content or content.get("dataType") != "moveObject":
            raise SuiRpcError(f"sui_getObject({object_id}): not a Move object")
        return cast(dict[str, Any], content["fields"])

    def query_events_by_type(self, event_type: str) -> list[dict[str, Any]]:
        """Return all events of `event_type`, ascending, following pagination."""
        events: list[dict[str, Any]] = []
        cursor: Any = None
        while True:
            page: dict[str, Any] = cast(
                dict[str, Any],
                self._call("suix_queryEvents", [{"MoveEventType": event_type}, cursor, 100, False]),
            )
            events.extend(cast("list[dict[str, Any]]", page.get("data", [])))
            if not page.get("hasNextPage") or not page.get("nextCursor"):
                break
            cursor = page["nextCursor"]
        return events
