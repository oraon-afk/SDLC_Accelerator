import sys
import os
import time
import hashlib
import json
from typing import Optional, Dict, List, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add the parent Backend directory to sys.path to resolve relative import issue
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from LLM_Model import llm_model_config
from Model.vector_store import LocalVectorStore
from Embedd_Model.embed_model_config import get_ollama_embedding, OLLAMA_URL
from Resources import document_parsers
from project_scheduler import chunk_text

app = FastAPI(title="SDLC Accelerator Backend API", version="1.0.0")

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

class ProjectDetails(BaseModel):
    objective: Optional[Dict[str, Any]] = None
    scope: Optional[Dict[str, Any]] = None
    stakeholders: Optional[Dict[str, Any]] = None
    budgetResources: Optional[Dict[str, Any]] = None
    successMetrics: Optional[Dict[str, Any]] = None

class AnalysisConfig(BaseModel):
    modules: Optional[Dict[str, bool]] = None
    priority: Optional[str] = "Medium"
    timeHorizon: Optional[str] = "Entire project"
    notes: Optional[str] = ""

class UploadedFileMeta(BaseModel):
    name: str
    size: int
    type: str

class AnalysisRequestPayload(BaseModel):
    project_id: str
    project_name: str
    project_details: Optional[ProjectDetails] = None
    analysis_config: Optional[AnalysisConfig] = None
    uploaded_files: Optional[List[UploadedFileMeta]] = None

def get_file_hash(file_path: str) -> str:
    hasher = hashlib.md5()
    try:
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hasher.update(chunk)
        return hasher.hexdigest()
    except Exception as e:
        print(f"Error calculating hash for {file_path}: {str(e)}")
        return ""

def on_the_fly_scan_and_index(project_name: str, vector_store: LocalVectorStore) -> List[str]:
    """
    Scans the specific project directory under 'Resource Docs/project_name/'.
    If any new or modified document is detected, parses it on-the-fly, 
    chunks it, embeds it via Ollama, and inserts it into SQLite.
    Returns the list of parsed document names.
    """
    backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    workspace_root = os.path.dirname(backend_root)
    resource_docs_root = os.path.join(workspace_root, "Resource Docs")
    project_dir = os.path.join(resource_docs_root, project_name)
    
    if not os.path.exists(project_dir):
        print(f"[On-the-Fly Pipeline] Directory not found at: {project_dir}. Skipping parsing phase.")
        return []
        
    print(f"[On-the-Fly Pipeline] Scanning project folder: {project_dir}")
    parsed_files = []
    
    # Extensions to skip (non-parseable utility or media files)
    skip_extensions = {'.mp3', '.mp4', '.wav', '.html', '.py', '.js', '.json', '.zip', '.rar', '.exe'}
    
    # Track files already processed in this scan to compare with database
    disk_files = {}
    
    for root, _, files in os.walk(project_dir):
        if ".image_cache" in root:
            continue
            
        for file_name in files:
            if file_name.startswith('.'):
                continue
                
            file_path = os.path.join(root, file_name)
            _, ext = os.path.splitext(file_name.lower())
            
            # Skip non-parseable files
            if ext in skip_extensions:
                continue
            
            # Supported file formats
            if ext in ['.txt', '.docx', '.csv', '.xlsx', '.pdf', '.pptx', '.png', '.jpg', '.jpeg', '.bmp']:
                try:
                    mtime = os.path.getmtime(file_path)
                    f_hash = get_file_hash(file_path)
                    disk_files[os.path.abspath(file_path)] = {
                        "file_name": file_name,
                        "last_modified": mtime,
                        "file_hash": f_hash
                    }
                except Exception as e:
                    print(f"[On-the-Fly Pipeline] Error scanning {file_name}: {str(e)}")

    # Deduplicate: skip PDFs that have a .docx counterpart
    docx_basenames = set()
    for abs_path, meta in disk_files.items():
        base_name, ext = os.path.splitext(meta["file_name"])
        if ext.lower() == '.docx':
            docx_basenames.add(base_name.lower())
    
    pdf_dupes = [p for p, m in disk_files.items() 
                 if os.path.splitext(m["file_name"])[1].lower() == '.pdf' 
                 and os.path.splitext(m["file_name"])[0].lower() in docx_basenames]
    for dup_path in pdf_dupes:
        print(f"[On-the-Fly Pipeline] Skipping duplicate PDF (docx preferred): {disk_files[dup_path]['file_name']}")
        del disk_files[dup_path]

    # Query tracked files in SQLite
    tracked_files = {os.path.abspath(f["file_path"]): f for f in vector_store.get_all_tracked_files()}

    # Check for new or modified files
    for file_path, disk_meta in disk_files.items():
        needs_indexing = False
        file_name = disk_meta["file_name"]
        
        if file_path not in tracked_files:
            print(f"[On-the-Fly Pipeline] New file detected on-the-fly: {file_name}")
            needs_indexing = True
        else:
            tracked_meta = tracked_files[file_path]
            if (disk_meta["last_modified"] > tracked_meta["last_modified"]) or (disk_meta["file_hash"] != tracked_meta["file_hash"]):
                print(f"[On-the-Fly Pipeline] Modified file detected on-the-fly: {file_name}")
                needs_indexing = True
                vector_store.delete_file_chunks(project_name, file_name)
                
        if needs_indexing:
            try:
                print(f"[On-the-Fly Pipeline] Parsing and indexing {file_name}...")
                content = document_parsers.parse_document(file_path, project_dir, ollama_url=OLLAMA_URL)
                chunks = chunk_text(content)
                
                for i, chunk in enumerate(chunks):
                    scoped_chunk_text = f"[File: {file_name}] {chunk}"
                    embedding = get_ollama_embedding(scoped_chunk_text, ollama_url=OLLAMA_URL)
                    
                    vector_store.add_chunk(
                        project_name=project_name,
                        file_name=file_name,
                        chunk_id=i,
                        text_content=scoped_chunk_text,
                        embedding=embedding
                    )
                    
                vector_store.track_file(
                    project_name=project_name,
                    file_name=file_name,
                    file_path=file_path,
                    last_modified=disk_meta["last_modified"],
                    file_hash=disk_meta["file_hash"]
                )
                print(f"[On-the-Fly Pipeline] Successfully indexed {file_name} on-the-fly.")
                parsed_files.append(file_name)
            except Exception as e:
                print(f"[On-the-Fly Pipeline Error] Failed to parse {file_name}: {str(e)}")
        else:
            # File is already indexed up-to-date
            parsed_files.append(file_name)
            
    return list(set(parsed_files))

@app.get("/", tags=["General"])
def root():
    return {
        "status": "online",
        "message": "SDLC Accelerator Vector Indexing and LLM analysis server running successfully."
    }

@app.post("/query", tags=["AI_Analysis"])
def query(request: prompt_request):
    try:
        payload = llm_model_config.RequestData(
            content_type="text",
            file="",
            content="",
            prompt=request.prompt
        )
        ai_response = llm_model_config.process_request(payload)
        return {"message": ai_response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/projects/{project_name}/search", tags=["Vector_Search"])
def search_project_documents(project_name: str, query: str):
    try:
        query_emb = get_ollama_embedding(query)
        v_store = LocalVectorStore()
        search_results = v_store.similarity_search(project_name, query_emb, k=5)
        return {
            "project_name": project_name,
            "query": query,
            "results": search_results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analysis", tags=["AI_Analysis"])
def analyze_project_payload(payload: AnalysisRequestPayload):
    """
    Unified Endpoint Pipeline:
    1. Scan projects directory & parse new/modified documents on-the-fly.
    2. Retrieve all related text chunks from the vector database.
    3. Merge document context with analysis configuration scopes.
    4. Call LLM to run deep PMO analysis, returning a strict, complete JSON payload.
    """
    try:
        project_name = payload.project_name
        print(f"\n====================================================")
        print(f"[PIPELINE START] Analyzing project: '{project_name}'")
        print(f"====================================================")
        
        # Phase 1: On-the-Fly Scan and Indexing
        v_store = LocalVectorStore()
        analyzed_artifacts = on_the_fly_scan_and_index(project_name, v_store)
        
        # Phase 2: Retrieve all contextual chunks from SQLite vector db
        print(f"[Pipeline] Retrieving contextual chunks from Vector DB...")
        db_chunks = v_store.get_project_chunks(project_name)
        print(f"[Pipeline] Found {len(db_chunks)} chunks in vector space.")
        
        # Aggregate document contents
        doc_context = ""
        if db_chunks:
            # Sort and format chunks for complete readability
            doc_context = "\n".join([f"[{c['file_name']} (Segment {c['chunk_id']})]: {c['text_content']}" for c in db_chunks])
            print(doc_context)
        else:
            print("[Pipeline Warning] No chunks found in Vector DB. Relying on frontend metadata.")
            
        # Compile frontend project metadata details
        meta = payload.project_details
        meta_str = ""
        if meta:
            meta_str = (
                f"- Business Goal: {meta.objective.get('businessGoal') if meta.objective else ''}\n"
                f"- Expected Outcome: {meta.objective.get('expectedOutcome') if meta.objective else ''}\n"
                f"- Features Included: {', '.join(meta.scope.get('featuresIncluded', [])) if meta.scope else ''}\n"
                f"- Features Excluded: {', '.join(meta.scope.get('featuresExcluded', [])) if meta.scope else ''}\n"
                f"- Team Resources: {meta.budgetResources.get('teamSize') if meta.budgetResources else ''}\n"
                f"- Budget Cost: {meta.budgetResources.get('costEstimation') if meta.budgetResources else ''}\n"
                f"- Tool Requirements: {meta.budgetResources.get('toolRequirements') if meta.budgetResources else ''}\n"
                f"- Success Metrics Performance: {', '.join(meta.successMetrics.get('performanceTargets', [])) if meta.successMetrics else ''}\n"
                f"- User Adoption Targets: {', '.join(meta.successMetrics.get('userAdoption', [])) if meta.successMetrics else ''}\n"
            )

        # Merge active modules and configs
        conf = payload.analysis_config
        active_modules = []
        custom_notes = ""
        analysis_priority = "Medium"
        time_horizon = "Entire project"
        
        if conf:
            analysis_priority = conf.priority
            time_horizon = conf.timeHorizon
            custom_notes = conf.notes
            if conf.modules:
                active_modules = [k for k, v in conf.modules.items() if v]

        print(f"[Pipeline] Analysis Config - Modules: {active_modules} | Priority: {analysis_priority} | Notes: {custom_notes}")

        # Phase 3: Build the Deep LLM Prompt
        analysis_prompt = f"""You are an elite Project Management Officer (PMO) AI assistant with deep expertise in analyzing complex project documents, tracking risks, identifying action item owners, and forecasting schedule variances.

### CRITICAL GROUNDING RULES:
- You MUST base your entire analysis STRICTLY and ONLY on the provided project artifact text below.
- Do NOT invent, fabricate, or hallucinate any names, dates, milestones, risks, actions, or metrics that are NOT explicitly present in the provided documents.
- If information for a field is not available in the provided documents, use the value "NA" for text fields, 0 for numeric fields, and empty arrays [] for list fields.
- Every action item owner, risk description, milestone name, and date you output MUST be directly traceable to a specific passage in the provided documents.
- Do NOT generate example or placeholder data. Only report what is actually found.

Perform a highly thorough project analysis based on the following project data:

### PROJECT BASELINE INFO:
Project Name: {project_name}
{meta_str}

### PROJECT ACTIVE CONFIGURATIONS:
- Analysis Modules Requested: {", ".join(active_modules)}
- Analysis Priority: {analysis_priority}
- Focus Time Horizon: {time_horizon}
- Custom User Notes & Directives: {custom_notes}

### PARSED PROJECT ARTIFACTS TEXT (FROM VECTOR DB):
{doc_context[:25000]}

### INSTRUCTION:
Analyze ONLY the provided document segments above to discover:
1. Overall project health summary (Green, Yellow, Red) and a detailed, context-rich narrative. In this narrative summary, you MUST give a consolidated summary of exactly what is in the uploaded documents (such as the Weekly review meeting minutes highlights, RAID CSV actions, whiteboard timeline descriptions, and audio transcripts), explaining the key program statuses, delayed milestones, active action items, and technical/solution architect staffing risks identified directly from these source documents. Keep the tone professional, objective, and analytical.
2. Top actions (Action description, Owner name, Due date YYYY-MM-DD, status, age_days, priority High/Medium/Low). Map these to owners mentioned in documents.
3. Tracked risks (risk description, impact High/Medium/Low, probability High/Medium/Low, mitigation steps, owner name, status).
4. Schedule milestones alerts & forecast variances (Milestone name, baseline date, forecast date, variance delay in days, reason for variance delay, and critical path flag).
5. Escalation predictions (likelihood High/Medium/Low, key triggers/indicators, recommended preemptive actions).
6. Document summaries: A file-by-file breakdown array under "document_summary" containing the "file_name" (e.g. Plm Program Weekly Review Meeting minutes.docx, Master RAID Tracker.csv, Master program plan.png) and a concise, context-rich "summary" of what was discovered in each uploaded file.

### OUTPUT FORMAT:
You MUST return a JSON object conforming EXACTLY to the following JSON schema. Do NOT include any markdown code blocks, conversational text, or prefixes outside of the JSON block.
IMPORTANT: The placeholder values below (e.g. "<description>") are ONLY to describe the expected data type and meaning. You MUST replace every placeholder with REAL data extracted from the provided documents. Do NOT copy any placeholder text into your output.

{{
  "analysis_timestamp": "{time.strftime('%Y-%m-%dT%H:%M:%SZ')}",
  "priority_level": "{analysis_priority}",
  "project_health_summary": {{
    "overall_health": "<Green, Yellow, or Red based on document evidence>",
    "narrative": "<detailed narrative summarizing the actual project status, milestones, risks, and key findings from the provided documents only>",
    "health_factors": {{
      "schedule": "<At risk / On track / Green — based on document evidence>",
      "resources": "<Adequate / At risk / Green — based on document evidence>",
      "quality": "<Green / At risk — based on document evidence>"
    }}
  }},
  "top_actions": [
    {{
      "action": "<action description extracted from documents>",
      "owner": "<owner name extracted from documents, or NA if not mentioned>",
      "due_date": "<YYYY-MM-DD extracted from documents, or NA>",
      "status": "<In Progress / Overdue / Not Started / Complete — from documents>",
      "age_days": 0,
      "priority": "<High / Medium / Low — from documents>"
    }}
  ],
  "action_tracker": {{
    "total_actions": 0,
    "open_actions": 0,
    "overdue_actions": 0,
    "avg_age_open_days": 0,
    "actions_by_owner": {{
      "<owner name from documents>": 0
    }}
  }},
  "document_summary": [
    {{
      "file_name": "<actual file name from source_artifacts>",
      "summary": "<concise summary of what was found in this specific file>"
    }}
  ],
  "risks": [
    {{
      "risk": "<risk description extracted from documents>",
      "impact": "<High / Medium / Low>",
      "probability": "<High / Medium / Low>",
      "mitigation": "<mitigation steps from documents, or NA>",
      "owner": "<owner name from documents, or NA>",
      "status": "<Monitoring / In Progress / Open / Escalated>"
    }}
  ],
  "schedule_alerts": [
    {{
      "milestone": "<milestone name from documents>",
      "baseline_date": "<YYYY-MM-DD from documents>",
      "forecast_date": "<YYYY-MM-DD from documents>",
      "variance_days": 0,
      "reason": "<reason for delay from documents>",
      "critical_path_flag": true
    }}
  ],

  "escalation_prediction": {{
    "likelihood": "<High / Medium / Low — based on document evidence>",
    "indicators": [
      "<indicator extracted from documents>"
    ],
    "recommended_actions": [
      "<recommended action based on document findings>"
    ]
  }},
  "confidence_scores": {{
    "overall": 0.0,
    "risk_detection": 0.0,
    "action_tracking": 0.0,
    "schedule_analysis": 0.0
  }},
  "source_artifacts": {json.dumps(analyzed_artifacts if analyzed_artifacts else [])}
}}

CRITICAL REMINDERS:
- Replace ALL placeholder values (text inside < >) with REAL data extracted from the provided documents.
- Every owner name, action, risk, milestone, and date MUST come directly from the document text. If not found, use "NA".
- Do NOT copy the placeholder text or angle brackets into your output.
- Do NOT invent or fabricate any names, dates, or details that are not in the documents.
"""

        # Call local Ollama model to generate the deep analysis response
        print(f"[Pipeline] Dispatching analysis request to local LLM ({llm_model_config.resolve_active_text_model()})...")
        llm_payload = llm_model_config.RequestData(
            content_type="text",
            file="",
            content="",
            prompt=analysis_prompt
        )
        llm_raw_response = llm_model_config.process_request(llm_payload)
        
        # Clean and extract JSON response
        clean_json_str = llm_raw_response.strip()
        
        # Self-healing extraction: locate the outermost JSON brackets
        start_idx = clean_json_str.find('{')
        end_idx = clean_json_str.rfind('}')
        if start_idx != -1 and end_idx != -1:
            clean_json_str = clean_json_str[start_idx:end_idx+1]
            
        print(f"[Pipeline] Successfully received response from LLM (size: {len(clean_json_str)} chars).")
        
        # Attempt to parse into python dictionary to ensure validity
        analysis_data = json.loads(clean_json_str)
        print(f"[PIPELINE COMPLETED] Dynamic project analysis compiled successfully.")
        print(f"====================================================\n")
        return analysis_data
        
    except Exception as e:
        print(f"[Pipeline Error] Critical error during parsing/analysis: {str(e)}")
        try:
            print(f"[Pipeline Debug] Raw LLM string tried to parse (first 500 chars): {clean_json_str[:500]}")
        except Exception:
            pass
        
        # Return NA-valued skeleton — no static/fabricated data
        print("[Pipeline Fallback] Returning NA-valued empty skeleton (no static data).")
        fallback_data = {
            "analysis_timestamp": time.strftime('%Y-%m-%dT%H:%M:%SZ'),
            "priority_level": payload.analysis_config.priority if payload.analysis_config else "NA",
            "project_health_summary": {
                "overall_health": "NA",
                "narrative": f"Analysis could not be completed for project '{payload.project_name}'. The backend LLM service may be offline or returned an unparseable response. Please ensure the Ollama server is running and try again.",
                "health_factors": {
                    "schedule": "NA",
                    "resources": "NA",
                    "quality": "NA"
                }
            },
            "top_actions": [],
            "action_tracker": {
                "total_actions": 0,
                "open_actions": 0,
                "overdue_actions": 0,
                "avg_age_open_days": 0,
                "actions_by_owner": {}
            },
            "document_summary": [],
            "risks": [],
            "schedule_alerts": [],
            "escalation_prediction": {
                "likelihood": "NA",
                "indicators": [],
                "recommended_actions": []
            },
            "confidence_scores": {
                "overall": 0,
                "risk_detection": 0,
                "action_tracking": 0,
                "schedule_analysis": 0
            },
            "source_artifacts": []
        }
        return fallback_data
