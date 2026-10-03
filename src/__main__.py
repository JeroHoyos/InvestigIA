"""Punto de entrada: `uv run python -m src`."""

import argparse

import uvicorn

from src import config


def main() -> None:
    parser = argparse.ArgumentParser(prog="python -m src", description="Servidor web de InvestigIA")
    parser.add_argument("--host", default=config.HOST)
    parser.add_argument("--port", type=int, default=config.PORT)
    parser.add_argument("--reload", action="store_true", help="Recarga automática en desarrollo")
    args = parser.parse_args()

    uvicorn.run("src.server:app", host=args.host, port=args.port, reload=args.reload)


if __name__ == "__main__":
    main()
