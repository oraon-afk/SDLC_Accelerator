import os
import time
import sqlite3
from Model.vector_store import LocalVectorStore
from project_scheduler import ProjectFileScheduler, RESOURCE_DOCS_ROOT
from Embedd_Model.embed_model_config import get_ollama_embedding

def verify_pipeline():
    print("====================================================")
    print("VECTOR INDEXING & SCHEDULER VERIFICATION SYSTEM")
    print("====================================================")
    
    # 1. Resolve paths — Resource Docs is the canonical source
    current_dir = os.path.dirname(os.path.abspath(__file__))
    workspace_root = os.path.dirname(current_dir)
    resource_docs_root = os.path.join(workspace_root, "Resource Docs")
    
    print(f"Workspace Root resolved: {workspace_root}")
    print(f"Resource Docs Root: {resource_docs_root}")
    
    # List available projects (subfolders)
    if os.path.exists(resource_docs_root):
        projects = [d for d in os.listdir(resource_docs_root) 
                     if os.path.isdir(os.path.join(resource_docs_root, d)) and not d.startswith('.')]
        print(f"Available projects: {projects}")
    else:
        print(f"Error: Resource Docs directory not found at {resource_docs_root}")
        return
    
    if not projects:
        print("Error: No project folders found in Resource Docs.")
        return
    
    # Use the first available project for testing
    test_project_name = projects[0]
    test_project_dir = os.path.join(resource_docs_root, test_project_name)
    print(f"Testing with project: '{test_project_name}' at {test_project_dir}")
    
    # Purge existing SQLite database file to ensure a clean, reliable, and complete indexing run
    db_file = os.path.join(current_dir, "sdlc_vector_store.db")
    if os.path.exists(db_file):
        try:
            os.remove(db_file)
            print("Cleared previous vector database for a fresh, complete indexation run.")
        except Exception as e:
            print(f"Notice: Could not delete database file (active connection): {str(e)}")

    # 2. Instantiate and run scheduler indexer synchronously against Resource Docs
    print("\n[Instantiating File Indexer Scheduler on Resource Docs...]")
    scheduler = ProjectFileScheduler(projects_root=resource_docs_root)
    
    print("\n[Running incremental indexing scan...]")
    scheduler.scan_and_index()
    
    # 3. Verify SQLite records
    print("\n[Verifying SQLite Vector Database contents...]")
    v_store = LocalVectorStore()
    tracked_files = v_store.get_all_tracked_files()
    print(f"Total Tracked Files in SQLite: {len(tracked_files)}")
    for tf in tracked_files:
        print(f" - Project: {tf['project_name']} | File: {tf['file_name']} | Hash: {tf['file_hash']}")
        
    # Query database chunks count
    conn = sqlite3.connect(v_store.db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM vector_chunks")
    chunks_count = cursor.fetchone()[0]
    print(f"Total Indexed Chunks in SQLite: {chunks_count}")
    
    cursor.execute("SELECT project_name, file_name, chunk_id, SUBSTR(text_content, 1, 120) FROM vector_chunks LIMIT 5")
    sample_chunks = cursor.fetchall()
    print("\n[Sample Indexed Chunks preview (top 5):]")
    for r in sample_chunks:
        print(f" - [{r[0]} | {r[1]} | Chunk {r[2]}]: {r[3]}...")
    conn.close()

    # 4. Perform a semantic query similarity search
    query_text = "What is the status of the Solution Architect role and other staffing gaps?"
    print(f"\n[Executing Semantic Similarity Query: '{query_text}']")
    try:
        query_emb = get_ollama_embedding(query_text)
        print(f"Generated query embedding dimensions: {len(query_emb)}")
        
        # Search chunks scoped to our project
        search_results = v_store.similarity_search(test_project_name, query_emb, k=3)
        print(f"\nSimilarity Search Results (Top 3 matches for project '{test_project_name}'):")
        for i, match in enumerate(search_results):
            print(f"\n{i+1}. [Source File: {match['file_name']}] (Score: {match['score']:.4f})")
            print(f"   Content: {match['text_content'][:250]}...")
    except Exception as e:
        print(f"Error during query embedding or search execution: {str(e)}")
        
    print("\n====================================================")
    print("VERIFICATION COMPLETED")
    print("====================================================")

if __name__ == "__main__":
    verify_pipeline()
