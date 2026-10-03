"""Aplicación FastAPI: monta el frontend estático y los routers de la API."""

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from src import __version__
from src.api import export, session, upload, ws
from src.config import STATIC_DIR

app = FastAPI(title="InvestigIA", version=__version__)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

app.include_router(session.router)
app.include_router(export.router)
app.include_router(upload.router)
app.include_router(ws.router)


@app.get("/", include_in_schema=False)
async def root():
    return FileResponse(str(STATIC_DIR / "index.html"))
