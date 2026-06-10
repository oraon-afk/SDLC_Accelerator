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

def resolve_project_folder_name(project_name: str) -> str:
    """
    Fuzzy matches the requested project name to the actual subfolder in 'Resource Docs/'.
    If the requested name is 'Automotive_PLM_Consolidation', it maps to 'PLM Program'.
    Otherwise, scans 'Resource Docs' and picks the best matching directory.
    """
    backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    workspace_root = os.path.dirname(backend_root)
    resource_docs_root = os.path.join(workspace_root, "Resource Docs")
    
    if not os.path.exists(resource_docs_root):
        return project_name
        
    name_lower = project_name.lower().strip()
    if name_lower in ["automotive_plm_consolidation", "automotive plm consolidation", "plm program", "plm_program"]:
        # Direct check for 'PLM Program' subfolder
        for d in os.listdir(resource_docs_root):
            if d.lower() in ["plm program", "automotive_plm_consolidation"]:
                return d
        return "PLM Program"
        
    # Scan subdirectories to find a match
    dirs = [d for d in os.listdir(resource_docs_root) if os.path.isdir(os.path.join(resource_docs_root, d)) and not d.startswith('.')]
    for d in dirs:
        if d.lower() == name_lower or d.lower().replace(" ", "_") == name_lower.replace(" ", "_"):
            return d
            
    # Fallback to the first directory if only one is available
    if len(dirs) == 1:
        return dirs[0]
        
    return project_name

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

def sanitize_analysis_response(data: Any, default_priority: str, default_artifacts: List[str], active_modules: Optional[List[str]] = None) -> Dict[str, Any]:
    if not isinstance(data, dict):
        data = {}
        
    # Programmatic filtering based on active modules
    if active_modules is not None:
        if 'riskDetection' not in active_modules:
            data["risks"] = []
        if 'actionTracking' not in active_modules:
            data["top_actions"] = []
            data["action_tracker"] = {
                "total_actions": 0,
                "open_actions": 0,
                "overdue_actions": 0,
                "avg_age_open_days": 0,
                "actions_by_owner": {}
            }
        if 'scheduleAnalysis' not in active_modules:
            data["schedule_alerts"] = []
        if 'escalationPrediction' not in active_modules:
            data["escalation_prediction"] = {
                "likelihood": "NA",
                "indicators": [],
                "recommended_actions": []
            }

    # Ensure top-level fields
    if "analysis_timestamp" not in data or not isinstance(data["analysis_timestamp"], str):
        data["analysis_timestamp"] = time.strftime('%Y-%m-%dT%H:%M:%SZ')
    if "priority_level" not in data or not isinstance(data["priority_level"], str):
        data["priority_level"] = default_priority
        
    # project_health_summary
    if "project_health_summary" not in data or not isinstance(data["project_health_summary"], dict):
        data["project_health_summary"] = {}
    health = data["project_health_summary"]
    if "overall_health" not in health or not isinstance(health["overall_health"], str):
        health["overall_health"] = "NA"
    if "narrative" not in health or not isinstance(health["narrative"], str):
        health["narrative"] = "NA"
    if "health_factors" not in health or not isinstance(health["health_factors"], dict):
        health["health_factors"] = {}
    hf = health["health_factors"]
    for k in ["schedule", "resources", "quality"]:
        if k not in hf or not isinstance(hf[k], str):
            hf[k] = "NA"
            
    # top_actions
    if "top_actions" not in data or not isinstance(data["top_actions"], list):
        data["top_actions"] = []
    for item in data["top_actions"]:
        if not isinstance(item, dict):
            continue
        if "action" not in item or not isinstance(item["action"], str):
            item["action"] = "NA"
        if "owner" not in item or not isinstance(item["owner"], str):
            item["owner"] = "NA"
        if "due_date" not in item or not isinstance(item["due_date"], str):
            item["due_date"] = "NA"
        if "status" not in item or not isinstance(item["status"], str):
            item["status"] = "NA"
        try:
            item["age_days"] = int(item.get("age_days", 0))
        except Exception:
            item["age_days"] = 0
        if "priority" not in item or not isinstance(item["priority"], str):
            item["priority"] = "NA"
        if "source_file" not in item or not isinstance(item["source_file"], str):
            item["source_file"] = "NA"
            
    # action_tracker
    if "action_tracker" not in data or not isinstance(data["action_tracker"], dict):
        data["action_tracker"] = {}
    tracker = data["action_tracker"]
    for k in ["total_actions", "open_actions", "overdue_actions", "avg_age_open_days"]:
        if k not in tracker:
            tracker[k] = 0
        else:
            try:
                tracker[k] = int(tracker[k])
            except Exception:
                tracker[k] = 0
    if "actions_by_owner" not in tracker or not isinstance(tracker["actions_by_owner"], dict):
        tracker["actions_by_owner"] = {}
        
    # risks
    if "risks" not in data or not isinstance(data["risks"], list):
        data["risks"] = []
    for item in data["risks"]:
        if not isinstance(item, dict):
            continue
        if "risk" not in item or not isinstance(item["risk"], str):
            item["risk"] = "NA"
        if "impact" not in item or not isinstance(item["impact"], str):
            item["impact"] = "NA"
        if "probability" not in item or not isinstance(item["probability"], str):
            item["probability"] = "NA"
        if "mitigation" not in item or not isinstance(item["mitigation"], str):
            item["mitigation"] = "NA"
        if "owner" not in item or not isinstance(item["owner"], str):
            item["owner"] = "NA"
        if "status" not in item or not isinstance(item["status"], str):
            item["status"] = "NA"
        if "source_file" not in item or not isinstance(item["source_file"], str):
            item["source_file"] = "NA"
            
    # schedule_alerts
    if "schedule_alerts" not in data or not isinstance(data["schedule_alerts"], list):
        data["schedule_alerts"] = []
    for item in data["schedule_alerts"]:
        if not isinstance(item, dict):
            continue
        if "milestone" not in item or not isinstance(item["milestone"], str):
            item["milestone"] = "NA"
        if "baseline_date" not in item or not isinstance(item["baseline_date"], str):
            item["baseline_date"] = "NA"
        if "forecast_date" not in item or not isinstance(item["forecast_date"], str):
            item["forecast_date"] = "NA"
        try:
            item["variance_days"] = int(item.get("variance_days", 0))
        except Exception:
            item["variance_days"] = 0
        if "reason" not in item or not isinstance(item["reason"], str):
            item["reason"] = "NA"
        if "critical_path_flag" not in item:
            item["critical_path_flag"] = False
        else:
            item["critical_path_flag"] = bool(item["critical_path_flag"])
        if "source_file" not in item or not isinstance(item["source_file"], str):
            item["source_file"] = "NA"
            
    # escalation_prediction
    if "escalation_prediction" not in data or not isinstance(data["escalation_prediction"], dict):
        data["escalation_prediction"] = {}
    ep = data["escalation_prediction"]
    if "likelihood" not in ep or not isinstance(ep["likelihood"], str):
        ep["likelihood"] = "NA"
    if "indicators" not in ep or not isinstance(ep["indicators"], list):
        ep["indicators"] = []
    if "recommended_actions" not in ep or not isinstance(ep["recommended_actions"], list):
        ep["recommended_actions"] = []
        
    # confidence_scores
    if "confidence_scores" not in data or not isinstance(data["confidence_scores"], dict):
        data["confidence_scores"] = {}
    cs = data["confidence_scores"]
    for k in ["overall", "risk_detection", "action_tracking", "schedule_analysis"]:
        if k not in cs:
            cs[k] = 0.0
        else:
            try:
                cs[k] = float(cs[k])
            except Exception:
                cs[k] = 0.0
            
    # source_artifacts
    if "source_artifacts" not in data or not isinstance(data["source_artifacts"], list):
        data["source_artifacts"] = default_artifacts
    else:
        # Clean list to ensure strings
        data["source_artifacts"] = [str(x) for x in data["source_artifacts"] if x]
        
    return data

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
        raw_project_name = payload.project_name
        # Resolve the project name early so that ALL operations (disk scan, DB lookup) use the correct name
        resolved_folder_name = resolve_project_folder_name(raw_project_name)
        
        print(f"\n====================================================")
        print(f"[PIPELINE START] Analyzing project: '{raw_project_name}' (resolved to '{resolved_folder_name}')")
        print(f"====================================================")
        
        # Phase 1: On-the-Fly Scan and Indexing — use the resolved folder name so the disk path matches
        v_store = LocalVectorStore()
        analyzed_artifacts = on_the_fly_scan_and_index(resolved_folder_name, v_store)
                # Phase 2: Retrieve all contextual chunks from SQLite vector db
        # Try with resolved name first, then fall back to the raw payload name
        print(f"[Pipeline] Retrieving contextual chunks from Vector DB...")
        db_chunks = v_store.get_project_chunks(resolved_folder_name)
        if not db_chunks and resolved_folder_name != raw_project_name:
            print(f"[Pipeline] No chunks found under '{resolved_folder_name}', trying raw name '{raw_project_name}'...")
            db_chunks = v_store.get_project_chunks(raw_project_name)
            
        # Exclude chunks of files that are uploaded in this request to prevent double-feeding
        uploaded_names = {f.name for f in payload.uploaded_files} if payload.uploaded_files else set()
        if db_chunks and uploaded_names:
            orig_len = len(db_chunks)
            db_chunks = [c for c in db_chunks if c['file_name'] not in uploaded_names]
            print(f"[Pipeline] Filtered out {orig_len - len(db_chunks)} chunks belonging to uploaded files: {uploaded_names}")
            
        print(f"[Pipeline] Found {len(db_chunks)} chunks in vector space.")
        
        # Use resolved name as canonical project_name for the rest of the pipeline
        project_name = resolved_folder_name
        
        # Aggregate document contents with smart context assembly
        # Strategy: deduplicate file pairs, strip redundant prefixes, proportional budgets
        MAX_TOTAL_CONTEXT = 40000  # llama3.2 supports 128K tokens; 40K chars is safe
        doc_context = ""
        if db_chunks:
            from collections import OrderedDict
            import re
            
            # Group chunks by file name (with deduplication of duplicate chunks within the same file)
            file_chunks_map = OrderedDict()
            for c in db_chunks:
                fname = c['file_name']
                if fname not in file_chunks_map:
                    file_chunks_map[fname] = []
                # Avoid inserting duplicate chunks
                if not any(x['chunk_id'] == c['chunk_id'] and x['text_content'] == c['text_content'] for x in file_chunks_map[fname]):
                    file_chunks_map[fname].append(c)
            
            # Filter out non-informative image placeholder chunks
            informative_files = OrderedDict()
            for fname, chunks in file_chunks_map.items():
                all_placeholder = all("Visual analysis not available" in c['text_content'] for c in chunks)
                if not all_placeholder:
                    informative_files[fname] = chunks
                else:
                    print(f"[Pipeline] Skipping non-informative image file: {fname}")
            
            # Deduplicate: if both .csv and .xlsx exist with same basename, keep .csv (smaller overhead)
            basenames_seen = {}
            deduped_files = OrderedDict()
            for fname, chunks in informative_files.items():
                base, ext = os.path.splitext(fname)
                base_lower = base.lower()
                if ext.lower() in ['.csv', '.xlsx']:
                    if base_lower in basenames_seen:
                        existing_ext = basenames_seen[base_lower]
                        # Keep whichever has more content, skip the other
                        existing_fname = [k for k in deduped_files if os.path.splitext(k)[0].lower() == base_lower][0]
                        existing_chars = sum(len(c['text_content']) for c in deduped_files[existing_fname])
                        new_chars = sum(len(c['text_content']) for c in chunks)
                        if new_chars > existing_chars:
                            print(f"[Pipeline] Dedup: replacing '{existing_fname}' with '{fname}' (more content)")
                            del deduped_files[existing_fname]
                            deduped_files[fname] = chunks
                            basenames_seen[base_lower] = ext.lower()
                        else:
                            print(f"[Pipeline] Dedup: skipping '{fname}' (duplicate of '{existing_fname}')")
                        continue
                    basenames_seen[base_lower] = ext.lower()
                deduped_files[fname] = chunks
            
            informative_files = deduped_files
            num_files = len(informative_files)
            
            if num_files > 0:
                # Build clean text per file (strip redundant [Project:] [File:] prefixes from chunk content)
                file_clean_texts = OrderedDict()
                for fname, chunks in informative_files.items():
                    chunks.sort(key=lambda c: c['chunk_id'])
                    clean_parts = []
                    for c in chunks:
                        text = c['text_content']
                        # Strip redundant embedded metadata prefixes like [Project: X] [File: Y]
                        text = re.sub(r'^\[Project:\s*[^\]]*\]\s*', '', text)
                        text = re.sub(r'^\[File:\s*[^\]]*\]\s*', '', text)
                        clean_parts.append(text.strip())
                    file_clean_texts[fname] = "\n".join(clean_parts)
                
                # Proportional budget: allocate based on actual content size
                total_content_chars = sum(len(t) for t in file_clean_texts.values())
                context_parts = []
                for fname, clean_text in file_clean_texts.items():
                    if total_content_chars > 0:
                        proportion = len(clean_text) / total_content_chars
                    else:
                        proportion = 1.0 / num_files
                    file_budget = max(1500, int(MAX_TOTAL_CONTEXT * proportion))  # minimum 1500 per file
                    
                    # Add file header and truncated content
                    file_section = f"=== FILE: {fname} ===\n{clean_text[:file_budget]}"
                    context_parts.append(file_section)
                    print(f"[Pipeline] Context: [{fname}] {len(clean_text)} chars -> budget {file_budget} chars (used {min(len(clean_text), file_budget)})")
                
                doc_context = "\n\n".join(context_parts)
                
                # Final safety cap
                if len(doc_context) > MAX_TOTAL_CONTEXT:
                    doc_context = doc_context[:MAX_TOTAL_CONTEXT]
                    
                print(f"[Pipeline] Built context from {num_files} files ({len(doc_context)} chars total)")
            else:
                print("[Pipeline Warning] All DB chunks are non-informative placeholders.")
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

        # Phase 2.5: Parse and Summarize Uploaded Documents on-the-go
        document_summary = []
        uploaded_docs_content = ""
        # project_name is already the resolved folder name from Phase 1
        
        backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        workspace_root = os.path.dirname(backend_root)
        resource_docs_root = os.path.join(workspace_root, "Resource Docs")
        project_dir = os.path.join(resource_docs_root, project_name)
        
        if payload.uploaded_files and len(payload.uploaded_files) > 0:
            print(f"[Pipeline] Running extensive document summarization and extraction on-the-go for {len(payload.uploaded_files)} uploaded files...")
            for file_meta in payload.uploaded_files:
                file_name = file_meta.name
                file_path = os.path.join(project_dir, file_name)
                
                if os.path.exists(file_path):
                    try:
                        print(f"[Pipeline] Extracting content on-the-go directly from file: {file_path}")
                        file_text = document_parsers.parse_document(file_path, project_dir, ollama_url=OLLAMA_URL)
                        
                        if file_text:
                            # Store reconstructed text to inject into the main analysis context (truncated to prevent Ollama context overflows)
                            uploaded_docs_content += f"\n--- START OF DOCUMENT: {file_name} ---\n"
                            uploaded_docs_content += file_text[:8000]
                            uploaded_docs_content += f"--- END OF DOCUMENT: {file_name} ---\n"
                            
                            # Generate detailed summary via LLM call (truncated context to prevent Ollama context overflows)
                            summary_prompt = f"""You are an elite Project Management Officer (PMO) AI assistant.
Provide a highly detailed and extensive summary description of the following document content. Extract all key points, objectives, statuses, and issues discussed.
Document Name: {file_name}

Content:
{file_text[:8000]}

Respond ONLY with the summary. Do not include markdown headers or greetings.
"""
                            llm_payload = llm_model_config.RequestData(
                                content_type="text",
                                file="",
                                content="",
                                prompt=summary_prompt
                            )
                            print(f"[Pipeline] Invoking LLM for extensive summary of: {file_name}")
                            summary_res = llm_model_config.process_request(llm_payload).strip()
                            document_summary.append({
                                "file_name": file_name,
                                "summary": summary_res
                            })
                        else:
                            document_summary.append({
                                "file_name": file_name,
                                "summary": "Document content was empty."
                            })
                    except Exception as e:
                        print(f"[Pipeline Error] Failed parsing/summarizing {file_name}: {str(e)}")
                        document_summary.append({
                            "file_name": file_name,
                            "summary": f"Failed to parse or summarize document: {str(e)}"
                        })
                else:
                    print(f"[Pipeline Warning] File does not exist on disk at path: {file_path}")
                    document_summary.append({
                        "file_name": file_name,
                        "summary": "File could not be found on the server disk."
                    })
        else:
            print("[Pipeline] No files uploaded. Bypassing document summarization pipeline.")
            document_summary = [{"file_name": "NA", "summary": "NA"}]

        # Step 1: Risk Analysis
        print("[Pipeline Step 1] Running sequential Risk Analysis...")
        risk_prompt = f"""You are an elite Project Management Officer (PMO) AI assistant.
Your task is to analyze the provided project context and identify all active risks, their impact, probability, mitigation steps, owner, status, and source file.

### CRITICAL GROUNDING RULES:
- You MUST base your analysis STRICTLY and ONLY on the provided project artifact text below.
- Do NOT invent, fabricate, or hallucinate any details that are not explicitly present in the provided documents.
- If no risks are found, return an empty array [].
- Do not use angle brackets or placeholder text in the final output. Only report real data found.

### PROJECT BASELINE INFO:
Project Name: {project_name}
{meta_str}

### CONFIGURATIONS:
- Analysis Priority: {analysis_priority}
- Custom User Notes & Directives: {custom_notes}

### NEWLY UPLOADED DOCUMENTS CONTENT:
{uploaded_docs_content}

### PARSED PROJECT ARTIFACTS TEXT (FROM DB):
{doc_context}

### OUTPUT FORMAT:
You MUST return a JSON array of risk objects and nothing else. Follow this schema:
[
  {{
    "risk": "<risk description>",
    "impact": "High" | "Medium" | "Low",
    "probability": "High" | "Medium" | "Low",
    "mitigation": "<mitigation steps>",
    "owner": "<owner name, or NA>",
    "status": "Monitoring" | "In Progress" | "Open" | "Escalated",
    "source_file": "<source file name where this was found, or NA>"
  }}
]
"""
        llm_payload = llm_model_config.RequestData(
            content_type="text",
            file="",
            content="",
            prompt=risk_prompt,
            json_mode=True
        )
        extracted_risks = []
        try:
            raw_risks = llm_model_config.process_request(llm_payload).strip()
            # Clean JSON brackets
            start_idx = raw_risks.find('[')
            end_idx = raw_risks.rfind(']')
            if start_idx != -1 and end_idx != -1:
                raw_risks = raw_risks[start_idx:end_idx+1]
            extracted_risks = json.loads(raw_risks)
            if not isinstance(extracted_risks, list):
                extracted_risks = []
        except Exception as e:
            print(f"[Pipeline Step 1 Error] Failed to parse risks: {str(e)}")

        # Step 2: Action Items Generation based on identified risks
        print("[Pipeline Step 2] Running Action Items Generation based on risks...")
        risks_str = json.dumps(extracted_risks, indent=2)
        action_prompt = f"""You are an elite Project Management Officer (PMO) AI assistant.
Your task is to review the project documents AND the identified project risks list below, and generate actionable items. For every risk identified, ensure there are clear action items created to address or mitigate them.

### CRITICAL GROUNDING RULES:
- Ground your action items in the provided documents and the risk list. Do not invent details.
- For each action item, map it to an owner, due date (YYYY-MM-DD), status, and source file. If not specified, use "NA".
- If no action items are found, return an empty array [].

### PROJECT BASELINE INFO:
Project Name: {project_name}
{meta_str}

### PARSED RISKS LIST:
{risks_str}

### NEWLY UPLOADED DOCUMENTS CONTENT:
{uploaded_docs_content}

### PARSED PROJECT ARTIFACTS TEXT (FROM DB):
{doc_context}

### OUTPUT FORMAT:
You MUST return a JSON array of action objects and nothing else. Follow this schema:
[
  {{
    "action": "<action description>",
    "owner": "<owner name, or NA>",
    "due_date": "<YYYY-MM-DD, or NA>",
    "status": "In Progress" | "Overdue" | "Not Started" | "Complete",
    "priority": "High" | "Medium" | "Low",
    "source_file": "<source file name, or NA>"
  }}
]
"""
        llm_payload = llm_model_config.RequestData(
            content_type="text",
            file="",
            content="",
            prompt=action_prompt,
            json_mode=True
        )
        extracted_actions = []
        try:
            raw_actions = llm_model_config.process_request(llm_payload).strip()
            start_idx = raw_actions.find('[')
            end_idx = raw_actions.rfind(']')
            if start_idx != -1 and end_idx != -1:
                raw_actions = raw_actions[start_idx:end_idx+1]
            extracted_actions = json.loads(raw_actions)
            if not isinstance(extracted_actions, list):
                extracted_actions = []
        except Exception as e:
            print(f"[Pipeline Step 2 Error] Failed to parse actions: {str(e)}")

        total_actions = len(extracted_actions)
        open_actions = sum(1 for a in extracted_actions if a.get("status") in ["In Progress", "Not Started", "Overdue"])
        overdue_actions = sum(1 for a in extracted_actions if a.get("status") == "Overdue")
        total_age = 0
        for a in extracted_actions:
            try:
                a["age_days"] = int(a.get("age_days", 0))
            except Exception:
                a["age_days"] = 0
            total_age += a["age_days"]
        avg_age = (total_age / total_actions) if total_actions > 0 else 0
        actions_by_owner = {}
        for a in extracted_actions:
            owner = a.get("owner") or "Unassigned"
            actions_by_owner[owner] = actions_by_owner.get(owner, 0) + 1

        # Step 3: Schedule Analysis based on risks and actions
        print("[Pipeline Step 3] Running Schedule Analysis...")
        actions_str = json.dumps(extracted_actions, indent=2)
        schedule_prompt = f"""You are an elite Project Management Officer (PMO) AI assistant.
Your task is to analyze the project roadmap, milestones, and schedule delays based on the project documents, identified risks, and generated action items.

### CRITICAL GROUNDING RULES:
- Use August 15, 2026 as the current project date.
- Ground all milestones, dates, and delay forecasts in the documents, risks, and actions.
- Predict/extract milestone names, baseline dates, forecast dates, delay variances in days, reason, critical path flag, and source file.
- Focus Time Horizon: {time_horizon}
- If no milestone alerts are found, return an empty array [].

### PROJECT BASELINE INFO:
Project Name: {project_name}
{meta_str}

### PARSED RISKS:
{risks_str}

### GENERATED ACTION ITEMS:
{actions_str}

### NEWLY UPLOADED DOCUMENTS CONTENT:
{uploaded_docs_content}

### PARSED PROJECT ARTIFACTS TEXT (FROM DB):
{doc_context}

### OUTPUT FORMAT:
You MUST return a JSON array of schedule alert objects and nothing else. Follow this schema:
[
  {{
    "milestone": "<milestone name>",
    "baseline_date": "<YYYY-MM-DD, or NA>",
    "forecast_date": "<YYYY-MM-DD, or NA>",
    "variance_days": 0,
    "reason": "<reason for delay, or NA>",
    "critical_path_flag": true | false,
    "source_file": "<source file name, or NA>"
  }}
]
"""
        llm_payload = llm_model_config.RequestData(
            content_type="text",
            file="",
            content="",
            prompt=schedule_prompt,
            json_mode=True
        )
        extracted_schedule = []
        try:
            raw_schedule = llm_model_config.process_request(llm_payload).strip()
            start_idx = raw_schedule.find('[')
            end_idx = raw_schedule.rfind(']')
            if start_idx != -1 and end_idx != -1:
                raw_schedule = raw_schedule[start_idx:end_idx+1]
            extracted_schedule = json.loads(raw_schedule)
            if not isinstance(extracted_schedule, list):
                extracted_schedule = []
        except Exception as e:
            print(f"[Pipeline Step 3 Error] Failed to parse schedule: {str(e)}")

        # Step 4: Escalation Prediction
        print("[Pipeline Step 4] Running Escalation Prediction...")
        schedule_str = json.dumps(extracted_schedule, indent=2)
        escalation_prompt = f"""You are an elite Project Management Officer (PMO) AI assistant.
Your task is to predict potential project escalations based on the identified risks, actions, and schedule delays.

### CRITICAL GROUNDING RULES:
- Base the likelihood and indicators strictly on the inputs.
- Determine if the project is likely to escalate to executive leadership (High / Medium / Low).
- List the key indicators/triggers of escalation.
- Recommend preemptive governance and project actions.

### PARSED RISKS:
{risks_str}

### GENERATED ACTION ITEMS:
{actions_str}

### SCHEDULE ALERTS:
{schedule_str}

### OUTPUT FORMAT:
You MUST return a JSON object with this exact schema and nothing else:
{{
  "likelihood": "High" | "Medium" | "Low",
  "indicators": ["<indicator 1>", "<indicator 2>"],
  "recommended_actions": ["<recommendation 1>", "<recommendation 2>"]
}}
"""
        llm_payload = llm_model_config.RequestData(
            content_type="text",
            file="",
            content="",
            prompt=escalation_prompt,
            json_mode=True
        )
        extracted_escalation = {}
        try:
            raw_escalation = llm_model_config.process_request(llm_payload).strip()
            start_idx = raw_escalation.find('{')
            end_idx = raw_escalation.rfind('}')
            if start_idx != -1 and end_idx != -1:
                raw_escalation = raw_escalation[start_idx:end_idx+1]
            extracted_escalation = json.loads(raw_escalation)
            if not isinstance(extracted_escalation, dict):
                extracted_escalation = {}
        except Exception as e:
            print(f"[Pipeline Step 4 Error] Failed to parse escalation: {str(e)}")

        # Step 5: Overall Health Summary
        print("[Pipeline Step 5] Generating Overall Health Summary...")
        escalation_str = json.dumps(extracted_escalation, indent=2)
        health_prompt = f"""You are an elite Project Management Officer (PMO) AI assistant.
Your task is to write a cohesive project health summary narrative and evaluate the overall, schedule, resources, and quality health status flags.

### CRITICAL GROUNDING RULES:
- The overall health must be Red, Yellow, or Green, based strictly on the evidence.
- The narrative must summarize the actual status of the project, milestones, staffing gaps (Solution Architect, Technical Architect, Data Migration Lead), and downstream risks.
- Keep the narrative objective, professional, and directly grounded in the preceding analysis steps.

### PROJECT BASELINE INFO:
Project Name: {project_name}
{meta_str}

### ANALYSIS STEPS SUMMARY:
- Risks: {risks_str}
- Action Items: {actions_str}
- Schedule Alerts: {schedule_str}
- Escalation Prediction: {escalation_str}

### OUTPUT FORMAT:
You MUST return a JSON object with this exact schema and nothing else:
{{
  "overall_health": "Green" | "Yellow" | "Red",
  "narrative": "<detailed narrative text>",
  "health_factors": {{
    "schedule": "At risk" | "On track" | "Green",
    "resources": "Adequate" | "At risk" | "Green",
    "quality": "Green" | "At risk"
  }}
}}
"""
        llm_payload = llm_model_config.RequestData(
            content_type="text",
            file="",
            content="",
            prompt=health_prompt,
            json_mode=True
        )
        extracted_health = {}
        try:
            raw_health = llm_model_config.process_request(llm_payload).strip()
            start_idx = raw_health.find('{')
            end_idx = raw_health.rfind('}')
            if start_idx != -1 and end_idx != -1:
                raw_health = raw_health[start_idx:end_idx+1]
            extracted_health = json.loads(raw_health)
            if not isinstance(extracted_health, dict):
                extracted_health = {}
        except Exception as e:
            print(f"[Pipeline Step 5 Error] Failed to parse health summary: {str(e)}")

        analysis_data = {
            "analysis_timestamp": time.strftime('%Y-%m-%dT%H:%M:%SZ'),
            "priority_level": analysis_priority,
            "project_health_summary": extracted_health,
            "top_actions": extracted_actions,
            "action_tracker": {
                "total_actions": total_actions,
                "open_actions": open_actions,
                "overdue_actions": overdue_actions,
                "avg_age_open_days": avg_age,
                "actions_by_owner": actions_by_owner
            },
            "document_summary": document_summary,
            "risks": extracted_risks,
            "schedule_alerts": extracted_schedule,
            "escalation_prediction": extracted_escalation,
            "confidence_scores": {
                "overall": 0.95 if extracted_health else 0.0,
                "risk_detection": 0.95 if extracted_risks else 0.0,
                "action_tracking": 0.95 if extracted_actions else 0.0,
                "schedule_analysis": 0.95 if extracted_schedule else 0.0
            },
            "source_artifacts": analyzed_artifacts if analyzed_artifacts else []
        }

        # Sanitize the full response to guarantee schema safety for the frontend
        analysis_data = sanitize_analysis_response(
            analysis_data,
            default_priority=analysis_priority,
            default_artifacts=analyzed_artifacts if analyzed_artifacts else [],
            active_modules=active_modules
        )
                
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
            "document_summary": document_summary,
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
        return sanitize_analysis_response(fallback_data, default_priority="NA", default_artifacts=[], active_modules=active_modules)
