import requests
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage
from typing import Optional, Dict
from pydantic import BaseModel

class RequestData(BaseModel):
    content_type: Optional[str] = ""
    file: Optional[str] = ""
    content: Optional[str] = ""
    prompt: str
    json_mode: Optional[bool] = False

# Local Ollama address
OLLAMA_URL = "http://127.0.0.1:11434"

available_models = {
    "text": "llama3.2:latest", # Adjusted to user's local installed model
    "image": "llama3.2-vision:latest",
}

RESOLVED_TEXT_MODEL = None

def resolve_active_text_model(ollama_url: str = OLLAMA_URL) -> str:
    """Queries Ollama endpoint to locate and resolve a running/installed text model."""
    global RESOLVED_TEXT_MODEL
    if RESOLVED_TEXT_MODEL:
        return RESOLVED_TEXT_MODEL
        
    preferred_model = available_models["text"]
    try:
        response = requests.get(f"{ollama_url}/api/tags", timeout=5)
        if response.status_code == 200:
            installed = [m.get("name") for m in response.json().get("models", [])]
            if preferred_model in installed:
                RESOLVED_TEXT_MODEL = preferred_model
                return preferred_model
            
            # Fallback to the first installed model that isn't an embedding model
            for model in installed:
                if "embed" not in model.lower():
                    RESOLVED_TEXT_MODEL = model
                    print(f"[Ollama LLM] Resolved model fallback: {model}")
                    return model
    except Exception:
        pass
        
    RESOLVED_TEXT_MODEL = preferred_model
    return preferred_model

def process_request(data: RequestData) -> str:
    if data.content_type == "text":
        model = resolve_active_text_model()
    elif data.content_type == "image":
        model = available_models["image"]
    else:
        raise ValueError("Invalid content type")
    
    kwargs = {
        "model": model,
        "base_url": OLLAMA_URL,
        "num_ctx": 16384,
        "temperature": 0.0
    }
    if getattr(data, "json_mode", False):
        kwargs["format"] = "json"
        
    llm = ChatOllama(**kwargs)

    message_content = data.prompt
    if data.content:
        message_content = f"{data.content}\n\nInstruction: {data.prompt}"

    response = llm.invoke([HumanMessage(content=message_content)])
    return response.content

# Example usage
call_llm = RequestData(
    content_type="text",
    file=None,
    content="Hello World",
    prompt="Summarize this text"
)