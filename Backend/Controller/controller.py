import sys
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add the parent Backend directory to sys.path to resolve relative import issue
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from LLM_Model import llm_model_config

app = FastAPI()

# Configure CORS Middleware to handle preflight OPTIONS requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class prompt_request(BaseModel):
    prompt: str

@app.get("/", tags=["AI_Analysis"])
def root():
    return {
        "message": "Help"
    }

@app.post("/query", tags=["AI_Analysis"])
def query(request: prompt_request):
    try:
        # Wrap arguments inside the required RequestData schema
        payload = llm_model_config.RequestData(
            content_type="text",
            file="",
            content="",
            prompt=request.prompt
        )
        
        # Now calls process_request with the single, valid Pydantic model
        ai_response = llm_model_config.process_request(payload)
        
        return {
            "message": ai_response
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
