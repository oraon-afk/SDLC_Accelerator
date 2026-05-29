import os
import time
import hashlib
import threading
from typing import List, Dict, Any, Set

from Model.vector_store import LocalVectorStore
from Embedd_Model.embed_model_config import get_ollama_embedding, OLLAMA_URL
from Resources import document_parsers

# Configuration — Resource Docs is the canonical document source
RESOURCE_DOCS_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "Resource Docs")
SCAN_INTERVAL_SECONDS = 30  # Periodic scan frequency

# File extensions that we can parse
SUPPORTED_EXTENSIONS = {'.txt', '.docx', '.csv', '.xlsx', '.pdf', '.pptx', '.png', '.jpg', '.jpeg', '.bmp'}

# Extensions to always skip (non-parseable utility or media files)
SKIP_EXTENSIONS = {'.mp3', '.mp4', '.wav', '.html', '.py', '.js', '.json', '.zip', '.rar', '.exe'}

def get_md5_hash(file_path: str) -> str:
    hasher = hashlib.md5()
    try:
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hasher.update(chunk)
        return hasher.hexdigest()
    except Exception as e:
        print(f"Error hashing file {file_path}: {str(e)}")
        return ""

# Text Splitter with larger context windows for richer RAG retrieval
def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    chunks = []
    text_len = len(text)
    
    if text_len <= chunk_size:
        return [text] if text.strip() else []
        
    start = 0
    while start < text_len:
        end = min(start + chunk_size, text_len)
        chunk = text[start:end]
        if chunk.strip():
            chunks.append(chunk)
        start += (chunk_size - overlap)
        
    return chunks

def _find_duplicate_pdfs(files_in_dir: Dict[str, Dict]) -> Set[str]:
    """
    Identifies PDF files that have a matching .docx counterpart in the same directory.
    Returns a set of absolute file paths for the duplicate PDFs to skip.
    """
    # Group files by directory
    dir_files: Dict[str, Dict[str, str]] = {}  # dir_path -> {basename_no_ext -> set of extensions}
    for abs_path, meta in files_in_dir.items():
        dir_path = os.path.dirname(abs_path)
        base_name, ext = os.path.splitext(meta["file_name"])
        base_lower = base_name.lower()
        if dir_path not in dir_files:
            dir_files[dir_path] = {}
        if base_lower not in dir_files[dir_path]:
            dir_files[dir_path][base_lower] = {}
        dir_files[dir_path][base_lower][ext.lower()] = abs_path

    skip_paths = set()
    for dir_path, bases in dir_files.items():
        for base_lower, ext_map in bases.items():
            # If both .docx and .pdf exist, skip the .pdf
            if '.docx' in ext_map and '.pdf' in ext_map:
                skip_paths.add(ext_map['.pdf'])
    
    return skip_paths


class ProjectFileScheduler:
    def __init__(self, projects_root: str = RESOURCE_DOCS_ROOT, ollama_url: str = OLLAMA_URL):
        self.projects_root = os.path.abspath(projects_root)
        self.ollama_url = ollama_url
        self.vector_store = LocalVectorStore()
        self._stop_event = threading.Event()
        self._thread = None
        os.makedirs(self.projects_root, exist_ok=True)

    def start(self):
        if self._thread is None:
            self._stop_event.clear()
            self._thread = threading.Thread(target=self._run_loop, daemon=True)
            self._thread.start()
            print(f"[Watcher] Started background watcher scanning: {self.projects_root}")

    def stop(self):
        if self._thread is not None:
            self._stop_event.set()
            self._thread.join()
            self._thread = None
            print("[Watcher] Stopped background watcher thread.")

    def _run_loop(self):
        while not self._stop_event.is_set():
            try:
                self.scan_and_index()
            except Exception as e:
                print(f"[Watcher Error] Exception in scan loop: {str(e)}")
            
            # Wait with interruption check
            for _ in range(SCAN_INTERVAL_SECONDS):
                if self._stop_event.is_set():
                    break
                time.sleep(1)

    def scan_and_index(self):
        if not os.path.exists(self.projects_root):
            print(f"[Watcher] Resource Docs directory not found: {self.projects_root}")
            return
            
        print(f"\n[Watcher] Running periodic folder check on: {self.projects_root}")
        
        # Scan statistics
        stats = {"files_found": 0, "new": 0, "modified": 0, "deleted": 0, "skipped_duplicate": 0, "skipped_unsupported": 0, "chunks_indexed": 0}
        
        # 1. Gather all actual files on disk
        disk_files = {}  # file_path -> (project_name, file_name, last_modified, file_hash)
        
        for project_dir_name in os.listdir(self.projects_root):
            project_path = os.path.join(self.projects_root, project_dir_name)
            if not os.path.isdir(project_path) or project_dir_name.startswith('.'):
                continue
                
            # Every subfolder represents the exact Project Name
            project_name = project_dir_name
            
            for root, _, files in os.walk(project_path):
                # Ignore hidden cache directories
                if ".image_cache" in root:
                    continue
                    
                for file_name in files:
                    # Skip hidden or system files
                    if file_name.startswith('.'):
                        continue
                    
                    _, ext = os.path.splitext(file_name.lower())
                    
                    # Skip non-parseable files explicitly
                    if ext in SKIP_EXTENSIONS:
                        stats["skipped_unsupported"] += 1
                        continue
                    
                    # Skip unsupported extensions
                    if ext not in SUPPORTED_EXTENSIONS:
                        stats["skipped_unsupported"] += 1
                        continue
                        
                    file_path = os.path.join(root, file_name)
                    try:
                        mtime = os.path.getmtime(file_path)
                        f_hash = get_md5_hash(file_path)
                        disk_files[os.path.abspath(file_path)] = {
                            "project_name": project_name,
                            "file_name": file_name,
                            "last_modified": mtime,
                            "file_hash": f_hash
                        }
                        stats["files_found"] += 1
                    except Exception as e:
                        print(f"[Watcher] Error getting details for {file_name}: {str(e)}")

        # 1b. Deduplicate: skip PDFs that have a .docx counterpart
        duplicate_pdfs = _find_duplicate_pdfs(disk_files)
        for dup_path in duplicate_pdfs:
            del disk_files[dup_path]
            stats["skipped_duplicate"] += 1
            stats["files_found"] -= 1
            print(f"[Watcher] Skipping duplicate PDF (docx preferred): {os.path.basename(dup_path)}")

        # 2. Query tracked files in SQLite
        tracked_files = {os.path.abspath(f["file_path"]): f for f in self.vector_store.get_all_tracked_files()}

        # 3. Detect deleted files
        for tracked_path, file_meta in tracked_files.items():
            if tracked_path not in disk_files:
                print(f"[Watcher] Detected deleted file: {file_meta['file_name']} in project {file_meta['project_name']}")
                self.vector_store.delete_file_chunks(file_meta["project_name"], file_meta["file_name"])
                self.vector_store.remove_file_tracking(tracked_path)
                stats["deleted"] += 1

        # 4. Detect new or modified files
        for file_path, disk_meta in disk_files.items():
            needs_indexing = False
            
            if file_path not in tracked_files:
                print(f"[Watcher] Detected new file: {disk_meta['file_name']} in project {disk_meta['project_name']}")
                needs_indexing = True
                stats["new"] += 1
            else:
                tracked_meta = tracked_files[file_path]
                # Compare modified timestamp and content hash
                if (disk_meta["last_modified"] > tracked_meta["last_modified"]) or (disk_meta["file_hash"] != tracked_meta["file_hash"]):
                    print(f"[Watcher] Detected modified file: {disk_meta['file_name']} in project {disk_meta['project_name']}")
                    needs_indexing = True
                    stats["modified"] += 1
                    # Purge old chunks for this file
                    self.vector_store.delete_file_chunks(disk_meta["project_name"], disk_meta["file_name"])
            
            if needs_indexing:
                chunks_count = self._index_file(file_path, disk_meta)
                stats["chunks_indexed"] += chunks_count

        # 5. Print scan summary
        print(f"\n[Watcher] ── Scan Summary ──────────────────────────")
        print(f"  Files found:        {stats['files_found']}")
        print(f"  New indexed:        {stats['new']}")
        print(f"  Modified reindexed: {stats['modified']}")
        print(f"  Deleted cleaned:    {stats['deleted']}")
        print(f"  Duplicate PDFs skipped: {stats['skipped_duplicate']}")
        print(f"  Unsupported skipped:    {stats['skipped_unsupported']}")
        print(f"  Total chunks indexed:   {stats['chunks_indexed']}")
        print(f"[Watcher] ────────────────────────────────────────\n")

    def _index_file(self, file_path: str, meta: Dict[str, Any]) -> int:
        """Parse, chunk, embed and store a file. Returns the number of chunks indexed."""
        project_dir = os.path.join(self.projects_root, meta["project_name"])
        print(f"[Indexer] Processing {meta['file_name']}...")
        
        try:
            # 1. Parse content
            content = document_parsers.parse_document(file_path, project_dir, ollama_url=self.ollama_url)
            
            if not content or content.startswith("Error") or content.startswith("Unsupported"):
                print(f"[Indexer Warning] No usable content extracted from {meta['file_name']}: {content[:100]}")
                return 0
            
            # 2. Chunk text
            chunks = chunk_text(content)
            
            print(f"[Indexer] Chunked {meta['file_name']} into {len(chunks)} fragments.")
            
            # 3. For each chunk: prefix title scope, embed, and store
            for i, chunk in enumerate(chunks):
                # Apply explicit scoping title as requested by user
                scoped_chunk_text = f"[Project: {meta['project_name']}] [File: {meta['file_name']}] {chunk}"
                
                # Fetch embeddings via local Ollama
                embedding = get_ollama_embedding(scoped_chunk_text, ollama_url=self.ollama_url)
                
                # Add to SQLite Vector Store
                self.vector_store.add_chunk(
                    project_name=meta["project_name"],
                    file_name=meta["file_name"],
                    chunk_id=i,
                    text_content=scoped_chunk_text,
                    embedding=embedding
                )
                
            # 4. Save file metadata tracking to database
            self.vector_store.track_file(
                project_name=meta["project_name"],
                file_name=meta["file_name"],
                file_path=file_path,
                last_modified=meta["last_modified"],
                file_hash=meta["file_hash"]
            )
            print(f"[Indexer] Successfully indexed: {meta['file_name']} ({len(chunks)} chunks)")
            return len(chunks)
            
        except Exception as e:
            print(f"[Indexer Error] Failed to index file {meta['file_name']}: {str(e)}")
            return 0

# Self-running entry point
if __name__ == "__main__":
    print("====================================================")
    print("  SDLC Accelerator — Resource Docs File Watcher")
    print("====================================================")
    watcher = ProjectFileScheduler()
    watcher.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        watcher.stop()
