import sys
import os
import time
import hashlib
import json
from typing import Optional, Dict, List, Any, TypedDict
from langgraph.graph import StateGraph, END
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

# Define LangGraph State Schema
class ChatbotState(TypedDict):
    prompt: str
    project_name: Optional[str]
    project_details: Optional[Dict[str, Any]]
    all_projects: Optional[List[Dict[str, Any]]]
    intent: Optional[str]
    extracted_project_name: Optional[str]
    extracted_file_name: Optional[str]
    project_files: Optional[List[str]]
    doc_context: Optional[str]
    response: Optional[str]

# Node 1: Classify Intent & Extract Project Entity
def classify_intent_node(state: ChatbotState) -> Dict[str, Any]:
    prompt = state["prompt"]
    all_projects = state.get("all_projects") or []
    
    # Extract names of available projects and files
    project_names = [p.get("name") for p in all_projects if p.get("name")]
    v_store = LocalVectorStore()
    all_tracked = []
    try:
        all_tracked = v_store.get_all_tracked_files()
    except Exception:
        pass
        
    if not project_names:
        try:
            import sqlite3
            conn = sqlite3.connect(v_store.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT DISTINCT project_name FROM indexed_files UNION SELECT DISTINCT project_name FROM vector_chunks")
            project_names = [r[0] for r in cursor.fetchall() if r[0]]
            conn.close()
        except Exception:
            pass
            
    if not project_names:
        project_names = ["PLM Program"]
        
    projects_list_str = ", ".join(f"'{p}'" for p in project_names)
    
    # Compile files list to assist extraction
    file_names = [f["file_name"] for f in all_tracked if f.get("file_name")]
    files_list_str = ", ".join(f"'{f}'" for f in file_names)
    
    # LLM Classification Prompt
    classification_prompt = f"""You are a query classifier and entity extractor.
Analyze the user prompt below and classify it into one of these intents:
1. 'general_chat': General questions, greetings, or questions about what you can do/capabilities.
2. 'document_list': Requests to list, show, or find the files/documents available for a project (e.g., "what are the documents available to project 'PLM Program'", "show files for PLM Program").
3. 'file_query': Requests asking about a specific file's content, summaries of a file, or questions about what is in a particular file (e.g. "what is in the file Plm Program Weekly Review Meeting minutes.docx?", "what is in the file Master Raid.xlsx" , "summarize Plm Program Weekly Review Summary transcript.docx").
4. 'project_query': Inquiries about a specific project's details, requirements, actions, risks, timeline, or milestones.
5. 'project_health': Specific requests asking how a project is going, its health status (e.g. status, overall health, progress).
6. 'out_of_scope': General chit-chat, programming, or topics completely unrelated to project management or available projects.

Also, extract:
- project name: Choose from [{projects_list_str}]. If no project is mentioned, return null.
- file name: If the user is asking about a specific file, extract the file name from the prompt. Match it against these available files if possible: [{files_list_str}]. If no specific file is mentioned, return null.

User Prompt: "{prompt}"

You MUST respond with a raw JSON object and nothing else. Do NOT include markdown code blocks. Follow this format:
{{
  "intent": "general_chat" | "document_list" | "file_query" | "project_query" | "project_health" | "out_of_scope",
  "extracted_project_name": "exact project name from available list, or null",
  "extracted_file_name": "exact file name from available list, or null"
}}
"""
    # Call local Ollama
    payload = llm_model_config.RequestData(
        content_type="text",
        file="",
        content="",
        prompt=classification_prompt
    )
    
    intent = "project_query"
    extracted_project_name = None
    extracted_file_name = None
    try:
        raw_response = llm_model_config.process_request(payload).strip()
        
        # Clean JSON wrapper if present
        clean_json_str = raw_response
        start_idx = clean_json_str.find('{')
        end_idx = clean_json_str.rfind('}')
        if start_idx != -1 and end_idx != -1:
            clean_json_str = clean_json_str[start_idx:end_idx+1]
            
        data = json.loads(clean_json_str)
        intent = data.get("intent") or "project_query"
        extracted_project_name = data.get("extracted_project_name")
        extracted_file_name = data.get("extracted_file_name")

        print("file_name====", extracted_file_name)
        print("project_name====", extracted_project_name)
        print("intent====", intent)
    except Exception as e:
        print(f"[LangGraph Chatbot] Error in classification: {str(e)}")
        
    # Fallback keyword matching in case LLM fails extraction
    lower_prompt = prompt.lower()
    for proj_name in project_names:
        if proj_name.lower() in lower_prompt:
            extracted_project_name = proj_name
            break
            
    # Fallback keyword matching for file names
    if not extracted_file_name:
        for f_name in file_names:
            base, _ = os.path.splitext(f_name.lower())
            if base in lower_prompt or f_name.lower() in lower_prompt:
                extracted_file_name = f_name
                break
            
    return {
        "intent": intent,
        "extracted_project_name": extracted_project_name,
        "extracted_file_name": extracted_file_name
    }

# Node 2: Fetch DB Context and Project Metadata
def fetch_context_node(state: ChatbotState) -> Dict[str, Any]:
    project_name = state.get("extracted_project_name") or state.get("project_name") or "PLM Program"
    v_store = LocalVectorStore()
    
    # Retrieve context from vector store for this project
    db_chunks = v_store.get_project_chunks(project_name)
    doc_context = ""
    if db_chunks:
        doc_context = "\n".join([f"[{c['file_name']}]: {c['text_content']}" for c in db_chunks])
        
    # Resolve metadata details
    project_details = state.get("project_details")
    all_projects = state.get("all_projects") or []
    
    # Map matching project details if not provided or mismatching
    if all_projects and (not project_details or project_details.get("name") != project_name):
        for p in all_projects:
            if p.get("name") == project_name:
                project_details = p
                break
                
    return {
        "doc_context": doc_context,
        "project_details": project_details,
        "extracted_project_name": project_name
    }

# Node 2b: Fetch Documents List
def fetch_documents_node(state: ChatbotState) -> Dict[str, Any]:
    project_name = state.get("extracted_project_name") or state.get("project_name") or "PLM Program"
    v_store = LocalVectorStore()
    
    try:
        all_tracked = v_store.get_all_tracked_files()
        project_files = [f["file_name"] for f in all_tracked if f["project_name"].lower() == project_name.lower()]
    except Exception as e:
        print(f"[LangGraph Chatbot] Error in fetch_documents_node: {str(e)}")
        project_files = []
        
    return {
        "project_files": project_files,
        "extracted_project_name": project_name
    }

# Node 2c: Fetch File Context Chunks
def fetch_file_context_node(state: ChatbotState) -> Dict[str, Any]:
    project_name = state.get("extracted_project_name") or state.get("project_name") or "PLM Program"
    file_name = state.get("extracted_file_name")
    v_store = LocalVectorStore()
    
    project_files = []
    try:
        all_tracked = v_store.get_all_tracked_files()
        # print("all", all_tracked)
        print("selected: ", project_name)
        project_files = [f["file_name"] for f in all_tracked if f["project_name"].lower() == project_name.lower()]
        print("total: ",project_files )
    except Exception:
        pass
        
    matched_file_name = None
    if file_name:
        file_name_lower = file_name.lower()
        for f in project_files:

            print("file: ", f )
            if file_name_lower == f.lower() or file_name_lower in f.lower() or f.lower() in file_name_lower:
                matched_file_name = f
                break
                
    if not matched_file_name and project_files:
        # Substring / manual match in the prompt as fallback
        prompt_lower = state["prompt"].lower()
        for f in project_files:
            base, _ = os.path.splitext(f.lower())
            if base in prompt_lower or f.lower() in prompt_lower:
                matched_file_name = f
                break
                
    doc_context = ""
    if matched_file_name:
        try:
            db_chunks = v_store.get_file_chunks(project_name, matched_file_name)
            if db_chunks:
                doc_context = "\n".join([c['text_content'] for c in db_chunks])
                print(f"[LangGraph Chatbot] Retrieved {len(db_chunks)} chunks for file '{matched_file_name}'")
            else:
                doc_context = f"No content chunks found for file '{matched_file_name}' in the database."
        except Exception as e:
            doc_context = f"Error retrieving chunks for file '{matched_file_name}': {str(e)}"
    else:
        doc_context = "Could not identify the specific file requested. Available files are: " + ", ".join(project_files)
        
    return {
        "doc_context": doc_context,
        "extracted_file_name": matched_file_name or file_name,
        "extracted_project_name": project_name
    }

# Node 3: Generate Guided AI Response
def generate_response_node(state: ChatbotState) -> Dict[str, Any]:
    intent = state.get("intent") or "project_query"
    project_name = state.get("extracted_project_name") or state.get("project_name") or "PLM Program"
    doc_context = state.get("doc_context") or ""
    meta = state.get("project_details")
    prompt = state["prompt"]
    all_projects = state.get("all_projects") or []
    
    # Compile available projects
    all_projects_names = [p.get("name") for p in all_projects if p.get("name")]
    if not all_projects_names:
        try:
            v_store = LocalVectorStore()
            import sqlite3
            conn = sqlite3.connect(v_store.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT DISTINCT project_name FROM indexed_files UNION SELECT DISTINCT project_name FROM vector_chunks")
            all_projects_names = [r[0] for r in cursor.fetchall() if r[0]]
            conn.close()
        except Exception:
            pass
    if not all_projects_names:
        all_projects_names = ["PLM Program"]
    all_projects_str = ", ".join(f"'{p}'" for p in all_projects_names)
    
    # Compile metadata string
    meta_str = ""
    if meta:
        objective = meta.get("objective") or {}
        scope = meta.get("scope") or {}
        stakeholders = meta.get("stakeholders") or {}
        budget = meta.get("budgetResources") or {}
        metrics = meta.get("successMetrics") or {}
        
        meta_str = (
            f"- Business Goal: {objective.get('businessGoal') or ''}\n"
            f"- Expected Outcome: {objective.get('expectedOutcome') or ''}\n"
            f"- Features Included: {', '.join(scope.get('featuresIncluded', [])) if isinstance(scope.get('featuresIncluded'), list) else (scope.get('featuresIncluded') or '')}\n"
            f"- Features Excluded: {', '.join(scope.get('featuresExcluded', [])) if isinstance(scope.get('featuresExcluded'), list) else (scope.get('featuresExcluded') or '')}\n"
            f"- Team Resources: {budget.get('teamSize') or ''}\n"
            f"- Budget Cost: {budget.get('costEstimation') or ''}\n"
            f"- Tool Requirements: {budget.get('toolRequirements') or ''}\n"
            f"- Success Metrics Performance: {', '.join(metrics.get('performanceTargets', [])) if isinstance(metrics.get('performanceTargets'), list) else (metrics.get('performanceTargets') or '')}\n"
            f"- User Adoption Targets: {', '.join(metrics.get('userAdoption', [])) if isinstance(metrics.get('userAdoption'), list) else (metrics.get('userAdoption') or '')}\n"
        )
        
    if intent == "general_chat":
        system_instruction = f"""You are an elite Project Management Officer (PMO) AI assistant.
The user is asking about your capabilities, greeting you, or initiating general project chat.
You MUST reply keeping strictly to the scope of this application:
1. Explain that you will assist the user regarding the available projects in the system.
2. List the currently available projects in the system: [{all_projects_str}].
3. Detail how you can help them analyze the status, overall health, timeline, milestones, risks, and actions of these projects.
4. Keep the tone helpful, professional, and aligned with your PMO role.
"""
    elif intent == "out_of_scope":
        system_instruction = f"""You are an elite Project Management Officer (PMO) AI assistant.
The user's query is completely unrelated to project management, software delivery lifecycle, or available projects.
You MUST politely decline to answer, explaining that your scope is limited strictly to assisting with the available projects in this SDLC Accelerator system (currently: [{all_projects_str}]).
"""
    elif intent == "document_list":
        project_files = state.get("project_files") or []
        files_list = "\n".join([f"- {f}" for f in project_files]) if project_files else "No documents found."
        system_instruction = f"""You are an elite Project Management Officer (PMO) AI assistant.
Your task is to list the documents/files available in the database for the project '{project_name}'.

Here are the documents currently available in the database for '{project_name}':
{files_list}

Please list these documents clearly for the user. Mention that these are the files indexed in the vector store database for this project. Keep it concise, helpful, and professional.
"""
    elif intent == "file_query":
        file_name = state.get("extracted_file_name")
        system_instruction = f"""You are an elite Project Management Officer (PMO) AI assistant.
Your task is to answer the user's question about the specific file '{file_name}' inside the project '{project_name}'.

CRITICAL RULES:
1. Ground your answer strictly in the provided document context below, which contains the content chunks of the file. Do not invent details.
2. If the user's question cannot be answered using the provided file content, state that clearly.
3. Keep the response professional and focused on the file content.

CONTENT CHUNKS FOR FILE '{file_name}':
{doc_context[:20000]}
"""
    elif intent == "project_health":
        system_instruction = f"""You are an elite Project Management Officer (PMO) AI assistant.
Your task is to analyze and guide the user on how the project '{project_name}' is going, specifically focusing on its status, progress, overall health, milestones, and health factors.

Available projects in the system: [{all_projects_str}]

CRITICAL RULES:
1. Ground your answer strictly in the provided project context (metadata and document chunks). Do not invent details.
2. If the user did not explicitly specify a project name in their health query, begin your response by stating: "I am analyzing the health of the currently focused project '{project_name}'. (Note: The available projects in the system are: [{all_projects_str}]. If you wanted to check another project, please specify its name.)"
3. Ground your analysis on delay factors, staffing gaps (Solution Architect, Technical Architect, Data Migration Lead), and downstream risks mentioned in the documents.

PROJECT METADATA FOR '{project_name}':
{meta_str}

PROJECT '{project_name}' DOCUMENT CONTEXT (FROM VECTOR DB):
{doc_context[:20000]}
"""
    else: # project_query
        system_instruction = f"""You are an elite Project Management Officer (PMO) AI assistant.
Your task is to assist the user by answering their query about the project '{project_name}' based strictly on the metadata and context provided below.

CRITICAL RULES:
1. Ground your answers strictly in the provided context. Do not invent details.
2. If the information is not present, state that it is not available in the project documents.

PROJECT METADATA FOR '{project_name}':
{meta_str}

PROJECT '{project_name}' DOCUMENT CONTEXT (FROM VECTOR DB):
{doc_context[:20000]}
"""

    payload = llm_model_config.RequestData(
        content_type="text",
        file="",
        content=system_instruction,
        prompt=prompt
    )
    ai_response = llm_model_config.process_request(payload)
    return {
        "response": ai_response
    }

# Build the LangGraph StateGraph
workflow = StateGraph(ChatbotState)

workflow.add_node("classify_intent", classify_intent_node)
workflow.add_node("fetch_context", fetch_context_node)
workflow.add_node("fetch_documents", fetch_documents_node)
workflow.add_node("fetch_file_context", fetch_file_context_node)
workflow.add_node("generate_response", generate_response_node)

workflow.set_entry_point("classify_intent")

def route_intent(state: ChatbotState) -> str:
    intent = state.get("intent")
    if intent == "document_list":
        return "fetch_documents"
    elif intent == "file_query":
        return "fetch_file_context"
    elif intent in ["project_query", "project_health"]:
        return "fetch_context"
    else:
        return "generate_response"

workflow.add_conditional_edges(
    "classify_intent",
    route_intent,
    {
        "fetch_documents": "fetch_documents",
        "fetch_file_context": "fetch_file_context",
        "fetch_context": "fetch_context",
        "generate_response": "generate_response"
    }
)

workflow.add_edge("fetch_documents", "generate_response")
workflow.add_edge("fetch_file_context", "generate_response")
workflow.add_edge("fetch_context", "generate_response")
workflow.add_edge("generate_response", END)

chatbot_app = workflow.compile()

@app.post("/query", tags=["AI_Analysis"])
def query(request: prompt_request):
    try:
        # Initialize LangGraph Chatbot State
        initial_state = ChatbotState(
            prompt=request.prompt,
            project_name=None,
            project_details=None,
            all_projects=None,
            intent=None,
            extracted_project_name=None,
            extracted_file_name=None,
            project_files=None,
            doc_context=None,
            response=None
        )
        
        # Invoke Compiled LangGraph App
        final_state = chatbot_app.invoke(initial_state)
        return {"message": final_state.get("response") or "No response could be generated."}
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
      "schedule": "<At risk / On track / Green - based on document evidence>",
      "resources": "<Adequate / At risk / Green - based on document evidence>",
      "quality": "<Green / At risk - based on document evidence>"
    }}
  }},
  "top_actions": [
    {{
      "action": "<action description extracted from documents>",
      "owner": "<owner name extracted from documents, or NA if not mentioned>",
      "due_date": "<YYYY-MM-DD extracted from documents, or NA>",
      "status": "<In Progress / Overdue / Not Started / Complete - from documents>",
      "age_days": 0,
      "priority": "<High / Medium / Low - from documents>"
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
    "likelihood": "<High / Medium / Low - based on document evidence>",
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
