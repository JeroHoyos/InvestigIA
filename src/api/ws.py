import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from langgraph.types import Command

from src.agent import INITIAL_STATE, graph
from src.agent.streaming import register_stream, unregister_stream
from src.api.session import get_config, get_interrupt_value

router = APIRouter()

STATUS_BY_TYPE = {
    "question": "Generando ecuación de búsqueda elaborada...",
    "equation": "Buscando artículos en ArXiv y Google Scholar...",
    "papers": "Generando matriz bibliográfica e hipótesis de investigación...",
    "qa": "Analizando tu pregunta...",
}


@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    config = get_config(session_id)

    try:
        existing = graph.get_state(config)
        if existing.values:
            iv = get_interrupt_value(session_id)
            if iv:
                await websocket.send_json(iv)
        else:
            await asyncio.to_thread(graph.invoke, dict(INITIAL_STATE), config)
            iv = get_interrupt_value(session_id)
            if iv:
                await websocket.send_json(iv)

        while True:
            data = await websocket.receive_json()

            current_iv = get_interrupt_value(session_id)
            current_type = (current_iv or {}).get("type", "")

            status_msg = STATUS_BY_TYPE.get(current_type)
            if status_msg:
                await websocket.send_json({"type": "status", "content": status_msg})

            if current_type == "equation":
                resume_value = {
                    "equation": data.get("content", "confirmar"),
                    "count": data.get("count", 5),
                }
            elif current_type == "papers":
                resume_value = {
                    "template_id": data.get("template_id", ""),
                    "custom": data.get("content", ""),
                }
            else:
                resume_value = data.get("content", "").strip()
                if not resume_value:
                    continue

            # ── Matrix streaming ────────────────────────────────────────────
            if current_type == "papers":
                loop = asyncio.get_running_loop()
                stream_q: asyncio.Queue = asyncio.Queue()
                register_stream(session_id, stream_q, loop)

                invoke_task = asyncio.create_task(
                    asyncio.to_thread(graph.invoke, Command(resume=resume_value), config)
                )

                while True:
                    try:
                        chunk = await asyncio.wait_for(stream_q.get(), timeout=3.0)
                        if chunk is None:
                            break
                        await websocket.send_json({"type": "matrix_chunk", "content": chunk})
                    except asyncio.TimeoutError:
                        if invoke_task.done():
                            break

                unregister_stream(session_id)
                await websocket.send_json({"type": "status", "content": "Generando hipótesis de investigación..."})
                await invoke_task
            else:
                await asyncio.to_thread(graph.invoke, Command(resume=resume_value), config)
            # ────────────────────────────────────────────────────────────────

            new_iv = get_interrupt_value(session_id)
            if new_iv:
                await websocket.send_json(new_iv)
            else:
                await websocket.send_json({"type": "complete", "content": "Sesión completada."})

    except WebSocketDisconnect:
        pass
    except Exception as exc:
        try:
            await websocket.send_json({"type": "error", "content": str(exc)})
        except Exception:
            pass
