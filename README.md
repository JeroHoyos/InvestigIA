<div align="center">
  <img src="assets/InvestigIA.svg" alt="InvestigIA Logo" width="400"/>

  **Asistente de IA para investigación académica**

  [![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.104%2B-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
  [![LangGraph](https://img.shields.io/badge/LangGraph-0.2%2B-FF6B35?style=flat-square)](https://langchain-ai.github.io/langgraph/)
  [![Ollama](https://img.shields.io/badge/Ollama-local%20LLM-000000?style=flat-square)](https://ollama.com)

  **[🏆 Top 3 — DataHack 2026 ](https://www.instagram.com/p/DXhaP5NDWqp/?img_index=1)**

  *Herramienta de soporte a la investigación académica que automatiza la búsqueda bibliográfica, la construcción de matrices de análisis y la generación de hipótesis, ejecutándose de forma completamente local sin dependencias de servicios externos.*
</div>

---

## ¿Qué es InvestigIA?

InvestigIA es un agente conversacional orientado a la investigación académica. A partir de la descripción de un tema, el sistema genera una ecuación de búsqueda booleana editable, consulta ArXiv y Google Scholar, construye una matriz bibliográfica en tiempo real y propone hipótesis originales basadas en la literatura encontrada. El ciclo cierra con un módulo de preguntas y respuestas sobre el corpus recopilado.

Todo el procesamiento ocurre localmente mediante [Ollama](https://ollama.com), sin enviar datos a servicios externos ni requerir claves de API.

---

## Instalación rápida

**Requisitos:** Python 3.10+, [uv](https://docs.astral.sh/uv/), [Ollama](https://ollama.com)

```bash
git clone https://github.com/tu-usuario/ResearchAgent-DataHack2026.git
cd ResearchAgent-DataHack2026
uv venv && uv pip install -r requirements.txt
ollama pull llama3.1:8b
```

## Ejecución

```bash
ollama serve          # terminal 1
uv run uvicorn app.main:app --reload   # terminal 2
```

Abre **<http://localhost:8000>**

Para usar otro modelo: `OLLAMA_MODEL=qwen2.5:7b-instruct-q8_0 uv run uvicorn app.main:app --reload`

---

## Stack

| Capa | Tecnología |
| --- | --- |
| Orquestación | LangGraph (grafo de 8 nodos con `interrupt`) |
| LLM local | Ollama + llama3.1:8b |
| Backend | FastAPI + WebSocket |
| Frontend | HTML + D3.js + Chart.js |
| Búsqueda | `arxiv` library + `scholarly` |
| Exportación | openpyxl (Excel) + python-docx (Word) |

---

## Plantillas de matriz

| Plantilla | Ideal para |
| --- | --- |
| Estado del Arte | Panorama general de un campo |
| Revisión Sistemática | Síntesis rigurosa tipo PRISMA |
| Benchmarking Técnico | Comparación cuantitativa de modelos |

---

## Variables de entorno

| Variable | Default |
| --- | --- |
| `OLLAMA_MODEL` | `llama3.1:8b` |
| `OLLAMA_BASE_URL` | `http://localhost:11434` |
