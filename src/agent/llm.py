from langchain_ollama import ChatOllama

from src.config import OLLAMA_BASE_URL, OLLAMA_MODEL


def get_llm(temperature: float = 0.3, num_predict: int = 4096) -> ChatOllama:
    return ChatOllama(
        model=OLLAMA_MODEL,
        temperature=temperature,
        num_predict=num_predict,
        base_url=OLLAMA_BASE_URL,
    )
