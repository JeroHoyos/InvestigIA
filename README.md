<div align="center">
  <img src="assets/InvestigIA.svg" alt="InvestigIA" width="400"/>

  **Asistente de IA para investigación académica** · [🏆 Top 3 — DataHack 2026](https://www.instagram.com/p/DXhaP5NDWqp/?img_index=1)
</div>

InvestigIA genera una ecuación de búsqueda a partir de tu tema, consulta ArXiv y Google Scholar, arma una matriz bibliográfica, propone hipótesis y responde preguntas sobre los artículos encontrados. Todo corre en local con [Ollama](https://ollama.com).

## Uso

Necesitas [uv](https://docs.astral.sh/uv/) y [Ollama](https://ollama.com).

```bash
uv sync
ollama pull llama3.1:8b
ollama serve                # en otra terminal
uv run python -m src        # http://localhost:8000
```

Para desarrollo: `uv run python -m src --reload`.

El modelo y la URL de Ollama se pueden cambiar copiando `.env.example` a `.env`.

## Estructura

```
src/
  agent/    grafo LangGraph, prompts, búsqueda en ArXiv/Scholar
  api/      endpoints FastAPI y WebSocket
  export/   generación de Excel y Word
  static/   frontend (HTML, CSS, JS)
```
