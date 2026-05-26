from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage
from typing import Optional
from pydantic import BaseModel

class RequestData(BaseModel):
    content_type: Optional[str] = ""
    file: Optional[str] = ""
    content: Optional[str] = ""
    prompt: str

available_models = {
    "text": "deepseek-r1:7b",
    "image": "llama3.2-vision:latest",
}

def process_request(data: RequestData) -> str:
    if data.content_type == "text":
        model = available_models["text"]
    elif data.content_type == "image":
        model = available_models["image"]
    else:
        raise ValueError("Invalid content type")
    
    llm = ChatOllama(
        model=model,
        base_url="http://localhost:11434"
    )

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