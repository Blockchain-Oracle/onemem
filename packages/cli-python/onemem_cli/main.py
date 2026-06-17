"""OneMem Python CLI — verify + inspect verifiable agent traces from the terminal.

Read-only mirror of the TS `@onemem/cli` (verify / trace / health). The Python
SDK is verification-focused, so provisioning (`init`) and memory (`add`/`search`)
remain TS-only; this CLI covers the independently-verifiable read surface, which
needs no signer, no Walrus, no Seal.
"""

from __future__ import annotations

from collections.abc import Callable

import click
from onemem import SuiRpc, addresses_for, fetch_trace_session, verify_session

from ._format import print_json, print_line, print_table, short_hex, short_id, status_label
from ._validate import resolve_network

ACTION_CALL_EMITTED = "events::ActionCallEmittedEvent"
SESSION_OPENED = "events::TraceSessionOpenedEvent"


def _ctx(network_opt: str | None) -> tuple[SuiRpc, str]:
    network = resolve_network(network_opt)
    addrs = addresses_for(network)
    return SuiRpc(addrs.rpc_url), addrs.package_id


def _run(fn: Callable[[], None]) -> None:
    """Wrap a command body: print errors per --json and exit non-zero."""
    ctx = click.get_current_context()
    try:
        fn()
    except (click.exceptions.Exit, click.exceptions.Abort):
        # click's control-flow exceptions (raised by ctx.exit) subclass Exception;
        # let them through untouched so an intentional exit(1) isn't reprinted.
        raise
    except Exception as err:
        if ctx.obj.get("json"):
            print_json({"ok": False, "error": f"{type(err).__name__}: {err}"})
        else:
            click.echo(f"error: {err}", err=True)
        ctx.exit(1)


@click.group()
@click.option("--json", "as_json", is_flag=True, help="Output JSON")
@click.option("--network", default=None, help="Sui network (testnet, mainnet, devnet, local)")
@click.pass_context
def cli(ctx: click.Context, as_json: bool, network: str | None) -> None:
    """OneMem — verifiable agent memory + trace on Sui + Walrus + Seal."""
    ctx.obj = {"json": as_json, "network": network}


@cli.command()
@click.argument("session_id")
@click.pass_context
def verify(ctx: click.Context, session_id: str) -> None:
    """Independently verify a TraceSession's Merkle chain."""

    def body() -> None:
        rpc, package_id = _ctx(ctx.obj["network"])
        with rpc:
            # Prove the session exists first — an absent session has a vacuously
            # valid (empty) chain, so this guard stops a false ✓ on a bad id.
            meta = fetch_trace_session(rpc, session_id)
            result = verify_session(rpc, package_id, session_id)
        agent_id = str(meta.get("agent_id", ""))
        if ctx.obj["json"]:
            print_json(
                {
                    "ok": result.ok,
                    "sessionId": session_id,
                    "callCount": result.call_count,
                    "sessionStatus": result.session_status,
                    "brokenAt": result.broken_at,
                    "computedMerkleRoot": short_hex(result.computed_merkle_root, 64),
                    "expectedMerkleRoot": short_hex(result.expected_merkle_root, 64),
                    "agentId": agent_id,
                }
            )
        else:
            print_line("✓ VERIFIED" if result.ok else "✗ VERIFICATION FAILED")
            print_line(f"  session    {session_id}")
            print_line(f"  agent      {agent_id} ({meta.get('environment', '')})")
            print_line(f"  status     {status_label(result.session_status)}")
            print_line(f"  calls      {result.call_count}")
            print_line(f"  merkleRoot {short_hex(result.computed_merkle_root, 64)}")
            if not result.ok:
                broken = (
                    result.broken_at if result.broken_at is not None else "merkle-root mismatch"
                )
                print_line(f"  brokenAt   {broken}")
        if not result.ok:
            ctx.exit(1)

    _run(body)


@cli.group()
def trace() -> None:
    """Inspect on-chain TraceSessions."""


@trace.command("get")
@click.argument("session_id")
@click.pass_context
def trace_get(ctx: click.Context, session_id: str) -> None:
    """Show session metadata."""

    def body() -> None:
        rpc, _ = _ctx(ctx.obj["network"])
        with rpc:
            f = fetch_trace_session(rpc, session_id)
        status = int(f.get("status", 0))
        meta = {
            "sessionId": session_id,
            "agentId": str(f.get("agent_id", "")),
            "environment": str(f.get("environment", "")),
            "namespaceId": str(f.get("namespace_id", "")),
            "status": status,
            "callCount": int(f.get("call_count", 0)),
        }
        if ctx.obj["json"]:
            print_json({**meta, "statusLabel": status_label(status)})
        else:
            print_line(f"session     {meta['sessionId']}")
            print_line(f"agent       {meta['agentId']}")
            print_line(f"environment {meta['environment']}")
            print_line(f"namespace   {meta['namespaceId']}")
            print_line(f"status      {status_label(status)}")
            print_line(f"calls       {meta['callCount']}")

    _run(body)


@trace.command("events")
@click.argument("session_id")
@click.pass_context
def trace_events(ctx: click.Context, session_id: str) -> None:
    """Show the decoded ActionCall chain."""

    def body() -> None:
        rpc, package_id = _ctx(ctx.obj["network"])
        with rpc:
            # Prove the session exists so an empty result means "no calls", not
            # "bad id" (mirrors verify's guard).
            fetch_trace_session(rpc, session_id)
            raw = rpc.query_events_by_type(f"{package_id}::{ACTION_CALL_EMITTED}")
        # Sort by the event envelope timestamp (timestampMs), matching the SDK
        # verifier's ordering so CLI output stays consistent with verification.
        matching = [e for e in raw if e.get("parsedJson", {}).get("session_id") == session_id]
        matching.sort(key=lambda e: int(e.get("timestampMs", 0)))
        calls = [e.get("parsedJson", {}) for e in matching]
        if ctx.obj["json"]:
            print_json(
                [
                    {
                        "sequence": i,
                        "toolName": j.get("tool_name", ""),
                        "toolNamespace": j.get("tool_namespace", ""),
                        "walrusInputBlob": j.get("walrus_input_blob") or None,
                        "contentHash": short_hex(j.get("content_hash"), 64),
                        "linked": j.get("parent_call_id") is not None,
                    }
                    for i, j in enumerate(calls)
                ]
            )
        else:
            rows = [
                {
                    "#": str(i),
                    "tool": f"{j.get('tool_namespace', '')}/{j.get('tool_name', '')}",
                    "chain": "linked" if j.get("parent_call_id") else "root",
                    "content": short_hex(j.get("content_hash")),
                    "blob": (
                        f"{j['walrus_input_blob'][:14]}…"
                        if j.get("walrus_input_blob")
                        else "(empty)"
                    ),
                }
                for i, j in enumerate(calls)
            ]
            print_table(rows, ["#", "tool", "chain", "content", "blob"])

    _run(body)


@trace.command("list")
@click.pass_context
def trace_list(ctx: click.Context) -> None:
    """List the most recent sessions opened on this package (newest first)."""

    def body() -> None:
        rpc, package_id = _ctx(ctx.obj["network"])
        with rpc:
            raw = rpc.query_events_by_type(f"{package_id}::{SESSION_OPENED}")
        raw.sort(key=lambda e: int(e.get("timestampMs", 0)), reverse=True)
        rows = [
            {
                "session": short_id(str(e.get("parsedJson", {}).get("session_id", ""))),
                "agent": str(e.get("parsedJson", {}).get("agent_id", "")),
                "environment": str(e.get("parsedJson", {}).get("environment", "")),
            }
            for e in raw[:25]
        ]
        if ctx.obj["json"]:
            print_json(rows)
        else:
            print_table(rows, ["session", "agent", "environment"])

    _run(body)


@cli.command()
@click.pass_context
def health(ctx: click.Context) -> None:
    """Check RPC + package reachability."""

    def body() -> None:
        network = resolve_network(ctx.obj["network"])
        addrs = addresses_for(network)
        chain_id: str | None = None
        rpc_ok = False
        rpc_error: str | None = None
        package_deployed = False
        package_error: str | None = None
        with SuiRpc(addrs.rpc_url) as rpc:
            try:
                chain_id = rpc._call("sui_getChainIdentifier", [])
                rpc_ok = True
            except Exception as err:
                rpc_error = str(err)
            if rpc_ok:
                try:
                    obj = rpc._call("sui_getObject", [addrs.package_id, {"showType": True}])
                    data = (obj or {}).get("data")
                    if data and data.get("type") == "package":
                        package_deployed = True
                    else:
                        package_error = "not found"
                except Exception as err:
                    package_error = str(err)
        ok = rpc_ok and package_deployed
        if ctx.obj["json"]:
            print_json(
                {
                    "ok": ok,
                    "network": network,
                    "chainId": chain_id,
                    "rpc": rpc_ok,
                    "rpcError": rpc_error,
                    "package": addrs.package_id,
                    "packageDeployed": package_deployed,
                    "packageError": package_error,
                }
            )
        else:
            print_line("✓ healthy" if ok else "✗ unhealthy")
            print_line(f"  network  {network}")
            rpc_state = f"ok (chain {chain_id})" if rpc_ok else f"unreachable ({rpc_error})"
            print_line(f"  rpc      {rpc_state}")
            if rpc_ok:
                deployed = (
                    f"deployed ({addrs.package_id})"
                    if package_deployed
                    else f"unverified ({package_error})"
                )
                print_line(f"  package  {deployed}")
        if not ok:
            ctx.exit(1)

    _run(body)


if __name__ == "__main__":
    cli()
