import json
from datetime import datetime
from io import BytesIO

import pdfplumber
from fastapi import APIRouter, File, Form, UploadFile

from src.agent import graph
from src.agent.llm import get_llm
from src.api.session import get_config

router = APIRouter(prefix="/api/upload")


async def _extract_pdf_text(contents: bytes) -> str:
    try:
        buf = BytesIO(contents)
        text_parts = []
        with pdfplumber.open(buf) as pdf:
            for page in pdf.pages[:8]:
                t = page.extract_text()
                if t:
                    text_parts.append(t)
        return "\n\n".join(text_parts)
    except Exception as e:
        return f"Error extracting PDF: {e}"


async def _extract_metadata_llm(text: str) -> dict:
    try:
        llm = get_llm(temperature=0)
        prompt = (
            "Extract metadata from this academic paper. Return ONLY valid JSON with these exact keys:\n"
            '{"title":"","authors":"Author A, Author B","year":"2024","abstract":"","keywords":"kw1,kw2","journal":"","doi":""}\n\n'
            f"Paper text:\n{text[:2500]}\n\nJSON only:"
        )
        response = llm.invoke(prompt)
        raw = response.content.strip()
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start >= 0 and end > start:
            raw = raw[start:end]
        data = json.loads(raw)
        data["source"] = "Subido"
        data["url"] = ""
        data["pdf_url"] = ""
        data["open_access"] = "Sí"
        data["citations"] = ""
        return data
    except Exception:
        snippet = text[:400].replace("\n", " ")
        return {
            "title": "Paper subido manualmente",
            "authors": "",
            "year": str(datetime.now().year),
            "abstract": snippet,
            "keywords": "",
            "journal": "",
            "doi": "",
            "source": "Subido",
            "url": "",
            "pdf_url": "",
            "open_access": "Sí",
            "citations": "",
        }


@router.post("/paper/{session_id}")
async def upload_paper(
    session_id: str,
    file: UploadFile | None = File(None),
    metadata: str | None = Form(None),
):
    config = get_config(session_id)
    snap = graph.get_state(config)

    paper_data: dict = {}

    if metadata:
        try:
            paper_data = json.loads(metadata)
        except Exception:
            paper_data = {}

    if file and file.filename:
        contents = await file.read()
        if file.filename.lower().endswith(".pdf"):
            text = await _extract_pdf_text(contents)
            paper_data = await _extract_metadata_llm(text)
        else:
            return {"error": "Solo se admiten archivos PDF"}

    if not paper_data.get("title"):
        return {"error": "No se pudo extraer metadata del paper"}

    # Ensure required fields
    paper_data.setdefault("source", "Subido")
    paper_data.setdefault("url", "")
    paper_data.setdefault("pdf_url", "")
    paper_data.setdefault("citations", "")
    paper_data.setdefault("open_access", "Sí")

    # Update session state
    if snap.values:
        papers = list(snap.values.get("papers", []))
        papers.append(paper_data)
        graph.update_state(config, {"papers": papers})
    else:
        return {"error": "Sesión no encontrada. Inicia una búsqueda primero."}

    return {"success": True, "paper": paper_data}
