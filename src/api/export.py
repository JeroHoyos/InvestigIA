from datetime import datetime

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from src.api.session import get_session_values
from src.export import build_docx, build_xlsx

router = APIRouter(prefix="/api/download")

XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


def _attachment(buf, media_type: str, prefix: str, ext: str) -> StreamingResponse:
    filename = f"{prefix}_{datetime.now().strftime('%Y%m%d_%H%M')}.{ext}"
    return StreamingResponse(
        buf,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/xlsx/{session_id}")
async def download_xlsx(session_id: str):
    vals = get_session_values(session_id)
    if not vals:
        return {"error": "Sesión no encontrada"}
    return _attachment(build_xlsx(vals), XLSX_MIME, "matriz_bibliografica", "xlsx")


@router.get("/docx/{session_id}")
async def download_docx(session_id: str):
    vals = get_session_values(session_id)
    if not vals:
        return {"error": "Sesión no encontrada"}
    return _attachment(build_docx(vals), DOCX_MIME, "metodologia_investigacion", "docx")
