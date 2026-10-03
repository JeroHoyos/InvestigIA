"""Registro de streams de la matriz  (session_id → (asyncio.Queue, event_loop))."""

import threading

_matrix_streams: dict = {}
_stream_lock = threading.Lock()


def register_stream(tid: str, q, loop) -> None:
    with _stream_lock:
        _matrix_streams[tid] = (q, loop)


def unregister_stream(tid: str) -> None:
    with _stream_lock:
        _matrix_streams.pop(tid, None)


def get_stream(tid: str):
    with _stream_lock:
        return _matrix_streams.get(tid)
