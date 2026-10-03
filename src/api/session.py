import uuid

from fastapi import APIRouter

from src.agent import graph

router = APIRouter(prefix="/api")


def get_config(session_id: str) -> dict:
    return {"configurable": {"thread_id": session_id}}


def get_session_values(session_id: str) -> dict | None:
    snap = graph.get_state(get_config(session_id))
    return snap.values or None


def get_interrupt_value(session_id: str) -> dict | None:
    state = graph.get_state(get_config(session_id))
    if state.next:
        for task in state.tasks:
            for interrupt_obj in task.interrupts:
                return interrupt_obj.value
    return None


@router.get("/session")
async def create_session():
    return {"session_id": str(uuid.uuid4())}
