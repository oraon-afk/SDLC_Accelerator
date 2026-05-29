import os
import requests
import hashlib
from typing import List

# Configuration
OLLAMA_URL = "http://127.0.0.1:11434"
DEFAULT_EMBEDDING_MODEL = "mxbai-embed-large:latest"

# Global cache variables to prevent redundant connections and model searches
OLLAMA_OFFLINE = False
RESOLVED_EMBEDDING_MODEL = None

def get_mock_embedding(text: str) -> List[float]:
    """Generates a deterministic 768-dimensional mock embedding fallback using SHA-256."""
    dimension = 768
    vector = []
    text_bytes = text.encode('utf-8', errors='ignore')
    for i in range(dimension):
        h = hashlib.sha256(text_bytes + str(i).encode('utf-8')).hexdigest()
        val = int(h[:8], 16) / 4294967295.0
        vector.append(val - 0.5)
    return vector

def get_ollama_embedding(text: str, ollama_url: str = OLLAMA_URL, preferred_model: str = DEFAULT_EMBEDDING_MODEL) -> List[float]:
    """Retrieves embedding vector from local Ollama service, with resilient timeout, model caching, and hash fallback."""
    global OLLAMA_OFFLINE, RESOLVED_EMBEDDING_MODEL
    
    if OLLAMA_OFFLINE:
        return get_mock_embedding(text)
        
    if RESOLVED_EMBEDDING_MODEL:
        try:
            response = requests.post(
                f"{ollama_url}/api/embeddings",
                json={
                    "model": RESOLVED_EMBEDDING_MODEL,
                    "prompt": text
                },
                timeout=60 # Resilient timeout for local embedded processing
            )
            if response.status_code == 200:
                return response.json().get("embedding", [])
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
            OLLAMA_OFFLINE = True
            return get_mock_embedding(text)
        except Exception:
            pass
        
    # Search for an available model
    models_to_try = [preferred_model, "llama3.2:latest"]
    
    # Try fetching tags to prioritize installed models
    try:
        tags_response = requests.get(f"{ollama_url}/api/tags", timeout=30) # Resilient timeout for local tag listing
        if tags_response.status_code == 200:
            installed_models = [m.get("name") for m in tags_response.json().get("models", [])]
            for model in installed_models:
                if model not in models_to_try:
                    models_to_try.insert(0, model) # Prioritize installed models
    except Exception:
        pass

    last_error = None
    for model in models_to_try:
        try:
            response = requests.post(
                f"{ollama_url}/api/embeddings",
                json={
                    "model": model,
                    "prompt": text
                },
                timeout=60 # Resilient timeout for initial model loads
            )
            if response.status_code == 200:
                RESOLVED_EMBEDDING_MODEL = model
                print(f"[Ollama] Successfully resolved and cached embedding model: {model}")
                return response.json().get("embedding", [])
            else:
                last_error = f"Ollama HTTP {response.status_code}: {response.text}"
        except (requests.exceptions.ConnectionError, requests.exceptions.Timeout) as e:
            # Only switch to offline if we couldn't even connect
            OLLAMA_OFFLINE = True
            print(f"[Ollama Offline] Connection failure to {ollama_url}. Switching to mock embeddings globally.")
            return get_mock_embedding(text)
        except Exception as e:
            last_error = str(e)
            
    # If all models fail but Ollama is online, fallback to mock embeddings
    print(f"[Ollama Warning] All embedding attempts failed. Checked models: {models_to_try}. Using mock.")
    return get_mock_embedding(text)
