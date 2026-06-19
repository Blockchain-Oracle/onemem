"""OneMem Python CLI — a minimal Python-first companion to ``@onemem/cli``.

Memory ``add``/``search`` live in the TS CLI (and the ``onemem-memory`` bridge);
this CLI currently exposes a lightweight ``health`` check for the selected Sui
network. (A fuller Python memory surface is a later phase.)
"""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from collections.abc import Callable

import click

from ._format import print_json, print_line
from ._validate import resolve_network

_RPC_URL = {
    "testnet": "https://fullnode.testnet.sui.io:443",
    "mainnet": "https://fullnode.mainnet.sui.io:443",
    "devnet": "https://fullnode.devnet.sui.io:443",
    "local": "http://127.0.0.1:9000",
}


def _run(fn: Callable[[], None]) -> None:
    """Wrap a command body: print errors per --json and exit non-zero."""
    ctx = click.get_current_context()
    try:
        fn()
    except (click.exceptions.Exit, click.exceptions.Abort):
        raise
    except Exception as err:
        if ctx.obj.get("json"):
            print_json({"ok": False, "error": f"{type(err).__name__}: {err}"})
        else:
            click.echo(f"error: {err}", err=True)
        ctx.exit(1)


def _chain_identifier(rpc_url: str) -> str:
    payload = json.dumps(
        {"jsonrpc": "2.0", "id": 1, "method": "sui_getChainIdentifier", "params": []}
    ).encode("utf-8")
    req = urllib.request.Request(
        rpc_url, data=payload, headers={"content-type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        body = json.loads(resp.read().decode("utf-8"))
    if "error" in body:
        raise RuntimeError(str(body["error"]))
    return str(body.get("result", ""))


@click.group()
@click.option("--json", "as_json", is_flag=True, help="Output JSON")
@click.option("--network", default=None, help="Sui network (testnet, mainnet, devnet, local)")
@click.pass_context
def cli(ctx: click.Context, as_json: bool, network: str | None) -> None:
    """OneMem — decentralized memory for AI agents, stored on MemWal."""
    ctx.obj = {"json": as_json, "network": network}


@cli.command()
@click.pass_context
def health(ctx: click.Context) -> None:
    """Check Sui RPC reachability for the selected network."""

    def body() -> None:
        network = resolve_network(ctx.obj["network"])
        rpc_url = _RPC_URL[network]
        chain_id: str | None = None
        rpc_ok = False
        rpc_error: str | None = None
        try:
            chain_id = _chain_identifier(rpc_url)
            rpc_ok = True
        except (urllib.error.URLError, RuntimeError, ValueError, OSError) as err:
            rpc_error = str(err)

        if ctx.obj["json"]:
            print_json(
                {"ok": rpc_ok, "network": network, "chainId": chain_id, "rpcError": rpc_error}
            )
        else:
            print_line("✓ healthy" if rpc_ok else "✗ unhealthy")
            print_line(f"  network  {network}")
            rpc_state = f"ok (chain {chain_id})" if rpc_ok else f"unreachable ({rpc_error})"
            print_line(f"  rpc      {rpc_state}")
        if not rpc_ok:
            ctx.exit(1)

    _run(body)


if __name__ == "__main__":
    cli()
