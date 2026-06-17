# CLI Python Implementation — `onemem-cli`

> Historical note, 2026-06-17: this file is a larger planned Python parity
> sketch, not the current package shape. Current truth lives in
> `command-surface.md` and `packages/cli-python/onemem_cli/main.py`. The current
> Python CLI uses Click and mirrors only the read surface: verify, trace
> list/get/events, and health.

Python implementation sketch for the larger planned OneMem CLI.

---

## Package layout

```
onemem-cli/
├── pyproject.toml
├── README.md
├── onemem_cli/
│   ├── __init__.py
│   ├── __main__.py                    # python -m onemem_cli
│   ├── cli.py                         # typer app entry
│   ├── commands/
│   │   ├── __init__.py
│   │   ├── login.py
│   │   ├── logout.py
│   │   ├── init_cmd.py
│   │   ├── dashboard.py
│   │   ├── search.py
│   │   ├── add.py
│   │   ├── get.py
│   │   ├── update.py
│   │   ├── delete.py
│   │   ├── list_cmd.py
│   │   ├── history.py
│   │   ├── export.py
│   │   ├── namespace.py               # all namespace subcommands
│   │   ├── trace.py                   # all trace subcommands
│   │   ├── verify.py
│   │   ├── replay.py
│   │   ├── stats.py
│   │   ├── health.py
│   │   ├── set_namespace.py
│   │   ├── set_agent.py
│   │   ├── install.py
│   │   └── uninstall.py
│   ├── installers/
│   │   ├── __init__.py
│   │   ├── claude_code.py
│   │   ├── openclaw.py
│   │   ├── hermes.py
│   │   ├── cursor.py
│   │   ├── windsurf.py
│   │   ├── codex.py
│   │   ├── claude_desktop.py
│   │   ├── cline.py
│   │   ├── vscode.py
│   │   ├── antigravity.py
│   │   └── all.py
│   ├── ui/
│   │   ├── colors.py                  # rich.console with brand tokens
│   │   ├── tables.py                  # rich.table helpers
│   │   ├── tree.py                    # rich.tree for trace tree
│   │   ├── progress.py                # rich.progress wrapper
│   │   └── errors.py                  # formatted error output
│   ├── login_server.py                # ephemeral HTTP server for browser callback
│   └── util/
│       ├── credentials.py
│       └── json_output.py
├── tests/
│   ├── test_commands/
│   ├── test_installers/
│   └── test_ui/
└── README.md
```

---

## `pyproject.toml`

```toml
[project]
name = "onemem-cli"
version = "0.1.0"
description = "OneMem CLI — verifiable agent memory + trace, controlled from your terminal"
authors = [{name = "OneMem contributors"}]
license = {text = "Apache-2.0"}
readme = "README.md"
requires-python = ">=3.10"
dependencies = [
    "onemem-sdk-python>=0.1.0",
    "typer[all]>=0.12",
    "rich>=13.0",
    "httpx>=0.25",
    "anyio>=4.0",
    "tomli-w>=1.0",
]

[project.scripts]
onemem = "onemem_cli.cli:app"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

---

## Entry point (`onemem_cli/cli.py`)

```python
import typer
from rich.console import Console
from typing import Optional
from . import commands

app = typer.Typer(
    name="onemem",
    help="OneMem — verifiable agent memory + trace on Walrus + Sui",
    no_args_is_help=True,
    rich_markup_mode="rich",
)

console = Console()
err_console = Console(stderr=True)


# Global options via callback
@app.callback()
def main(
    ctx: typer.Context,
    json: bool = typer.Option(False, "--json", help="Output JSON"),
    verbose: bool = typer.Option(False, "--verbose", "-v"),
    quiet: bool = typer.Option(False, "--quiet", "-q"),
    config: Optional[str] = typer.Option(None, help="Override credentials file"),
    namespace: Optional[str] = typer.Option(None, help="Override default namespace"),
    server: Optional[str] = typer.Option(None, help="Override relayer URL"),
    network: str = typer.Option("mainnet", help="Sui network"),
):
    ctx.obj = {
        "json": json,
        "verbose": verbose,
        "quiet": quiet,
        "config": config,
        "namespace": namespace,
        "server": server,
        "network": network,
    }


# Register commands
app.command("login")(commands.login.run)
app.command("logout")(commands.logout.run)
app.command("init")(commands.init_cmd.run)
app.command("dashboard")(commands.dashboard.run)
app.command("search")(commands.search.run)
app.command("add")(commands.add.run)
app.command("get")(commands.get.run)
app.command("update")(commands.update.run)
app.command("delete")(commands.delete.run)
app.command("list")(commands.list_cmd.run)
app.command("history")(commands.history.run)
app.command("export")(commands.export.run)
app.command("verify")(commands.verify.run)
app.command("replay")(commands.replay.run)
app.command("stats")(commands.stats.run)
app.command("health")(commands.health.run)
app.command("set-namespace")(commands.set_namespace.run)
app.command("set-agent")(commands.set_agent.run)
app.command("install")(commands.install.run)
app.command("uninstall")(commands.uninstall.run)

# Sub-typers for grouped commands
namespace_app = typer.Typer(help="Namespace operations")
namespace_app.command("create")(commands.namespace.create)
namespace_app.command("list")(commands.namespace.list_)
namespace_app.command("get")(commands.namespace.get)
namespace_app.command("share")(commands.namespace.share)
namespace_app.command("revoke")(commands.namespace.revoke)
namespace_app.command("deactivate")(commands.namespace.deactivate)
namespace_app.command("reactivate")(commands.namespace.reactivate)
namespace_app.command("caps")(commands.namespace.caps)
app.add_typer(namespace_app, name="namespace")

trace_app = typer.Typer(help="Trace session operations")
trace_app.command("list")(commands.trace.list_)
trace_app.command("get")(commands.trace.get)
trace_app.command("tree")(commands.trace.tree)
trace_app.command("events")(commands.trace.events)
trace_app.command("end")(commands.trace.end)
app.add_typer(trace_app, name="trace")


if __name__ == "__main__":
    app()
```

---

## Command implementation pattern

```python
# onemem_cli/commands/search.py
import asyncio
import json as json_module
import typer
from typing import Optional
from onemem import OneMem, OneMemConfig
from ..ui import render_table, render_error
from ..util.credentials import load_credentials

def run(
    ctx: typer.Context,
    query: str = typer.Argument(...),
    top_k: int = typer.Option(5, "--top-k"),
    threshold: float = typer.Option(0.3, "--threshold"),
):
    global_opts = ctx.obj
    
    async def _run():
        creds = load_credentials(global_opts["config"])
        config = OneMemConfig(
            key=creds.delegate_key,
            account_id=creds.account_id,
            server_url=global_opts["server"] or "https://relayer.memwal.ai",
            namespace_id=global_opts["namespace"] or creds.active_namespace_id,
            agent_id=creds.agent_id,
            network=global_opts["network"],
        )
        client = await OneMem.create(config)
        try:
            result = await client.search(query, top_k=top_k, threshold=threshold)
            if global_opts["json"]:
                typer.echo(json_module.dumps({"results": [m.dict() for m in result.results]}))
            else:
                render_table(
                    result.results,
                    columns=["id", "memory_class", "context_tier", "text", "verified"],
                    headers=["ID", "Class", "Tier", "Text", "Verified"],
                )
            raise typer.Exit(0)
        except Exception as e:
            render_error(e, global_opts["json"])
            raise typer.Exit(_exit_code_for(e))
    
    asyncio.run(_run())
```

---

## UI helpers (`onemem_cli/ui/`)

```python
# onemem_cli/ui/colors.py
from rich.style import Style

PRIMARY = Style(color="#B08FFF", bold=True)           # lavender
VERIFY = Style(color="#D4FF5E", bold=True)            # chartreuse
SUI_BLUE = Style(color="#0090FF", underline=True)
SUCCESS = Style(color="green")
WARNING = Style(color="yellow")
ERROR = Style(color="red", bold=True)
MUTED = Style(color="bright_black")
```

```python
# onemem_cli/ui/tables.py
from rich.console import Console
from rich.table import Table
from .colors import PRIMARY, VERIFY, MUTED

console = Console()

def render_table(rows, columns, headers):
    table = Table(show_header=True, header_style=PRIMARY)
    for h in headers:
        table.add_column(h)
    for row in rows:
        cells = []
        for col in columns:
            value = getattr(row, col, "") if not isinstance(row, dict) else row.get(col, "")
            if col == "verified":
                cells.append("[#D4FF5E]✓[/]" if value else "[red]✗[/]")
            else:
                cells.append(str(value))
        table.add_row(*cells)
    console.print(table)
```

```python
# onemem_cli/ui/tree.py
from rich.tree import Tree
from rich.console import Console
from .colors import PRIMARY, VERIFY, ERROR, MUTED

console = Console()

def render_trace_tree(session, calls):
    root = Tree(
        f"[{PRIMARY}]Session {session.id}[/] "
        f"([{MUTED}]{session.agent_id}, {session.status}, {session.call_count} calls[/])"
    )
    _build_tree(root, calls, parent_id=None)
    console.print(root)

def _build_tree(parent_node, calls, parent_id):
    children = [c for c in calls if c.parent_call_id == parent_id]
    for call in children:
        icon = "[#D4FF5E]✓[/]" if call.status == "SUCCESS" else "[red]✗[/]"
        label = f"{icon} {call.tool_name} [[#94a3b8]{call.tool_namespace}[/]]"
        node = parent_node.add(label)
        _build_tree(node, calls, parent_id=call.id)
```

---

## Login server (Python)

```python
# onemem_cli/login_server.py
import asyncio
import webbrowser
import secrets
from aiohttp import web
from .util.credentials import write_credentials

async def start_login_flow(server_url: str) -> dict:
    nonce = secrets.token_hex(16)
    port = 12340
    
    received = asyncio.Future()
    
    async def callback(request):
        body = await request.json()
        # Validate signature against nonce
        await write_credentials(body)
        received.set_result(body)
        return web.Response(text="OneMem login complete. You can close this tab.")
    
    app = web.Application()
    app.router.add_post("/callback", callback)
    
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "localhost", port)
    await site.start()
    
    url = f"{server_url.replace('relayer.', 'app.')}/cli-login?nonce={nonce}&port={port}"
    webbrowser.open(url)
    print(f"Opening browser: {url}")
    print("Waiting for wallet authentication...")
    
    try:
        creds = await asyncio.wait_for(received, timeout=5 * 60)
    finally:
        await runner.cleanup()
    
    return creds
```

---

## Distribution

```bash
# Install
pip install onemem-cli

# Run
onemem search "dark mode"
onemem trace tree 0xsession...
```

PyPI: `onemem-cli`. GitHub: `onemem/onemem-cli`.

---

## Cross-references

- `command-surface.md` — what each command does (same as TS version)
- `output-design.md` — output rendering
- `login-flow.md` — browser auth detail
- `cli-typescript-impl.md` — sibling Node implementation
- `../02-sdks/sdk-python.md` — SDK the CLI wraps
