"""onemem-cli entry point. Implemented in Pillar 5."""

import click


@click.group()
def cli() -> None:
    """OneMem Python CLI (skeleton)."""


if __name__ == "__main__":
    cli()
