import sqlite3
import json
import os
import math
from typing import List, Dict, Any, Tuple

# Database path is resolved dynamically relative to Backend root directory (parent of Model)
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sdlc_vector_store.db")

def dot_product(v1: List[float], v2: List[float]) -> float:
    return sum(x * y for x, y in zip(v1, v2))

def magnitude(v: List[float]) -> float:
    return math.sqrt(sum(x * x for x in v))

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    mag1 = magnitude(v1)
    mag2 = magnitude(v2)
    if mag1 == 0 or mag2 == 0:
        return 0.0
    return dot_product(v1, v2) / (mag1 * mag2)

class LocalVectorStore:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Table to track indexed files (to prevent redundant parsing)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS indexed_files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_name TEXT NOT NULL,
                file_name TEXT NOT NULL,
                file_path TEXT NOT NULL UNIQUE,
                last_modified REAL NOT NULL,
                file_hash TEXT NOT NULL
            )
        """)
        
        # Table to store text chunks and their embeddings
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS vector_chunks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_name TEXT NOT NULL,
                file_name TEXT NOT NULL,
                chunk_id INTEGER NOT NULL,
                text_content TEXT NOT NULL,
                embedding_vector TEXT NOT NULL
            )
        """)
        
        conn.commit()
        conn.close()

    def track_file(self, project_name: str, file_name: str, file_path: str, last_modified: float, file_hash: str):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO indexed_files (project_name, file_name, file_path, last_modified, file_hash)
            VALUES (?, ?, ?, ?, ?)
        """, (project_name, file_name, file_path, last_modified, file_hash))
        conn.commit()
        conn.close()

    def remove_file_tracking(self, file_path: str):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM indexed_files WHERE file_path = ?", (file_path,))
        conn.commit()
        conn.close()

    def get_tracked_file(self, file_path: str) -> Dict[str, Any]:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT project_name, file_name, last_modified, file_hash FROM indexed_files WHERE file_path = ?", (file_path,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return {
                "project_name": row[0],
                "file_name": row[1],
                "last_modified": row[2],
                "file_hash": row[3]
            }
        return {}

    def get_all_tracked_files(self) -> List[Dict[str, Any]]:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT project_name, file_name, file_path, last_modified, file_hash FROM indexed_files")
        rows = cursor.fetchall()
        conn.close()
        return [
            {
                "project_name": r[0],
                "file_name": r[1],
                "file_path": r[2],
                "last_modified": r[3],
                "file_hash": r[4]
            } for r in rows
        ]

    def add_chunk(self, project_name: str, file_name: str, chunk_id: int, text_content: str, embedding: List[float]):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        # Serialize embedding list to JSON string for SQLite storage
        embedding_str = json.dumps(embedding)
        cursor.execute("""
            INSERT INTO vector_chunks (project_name, file_name, chunk_id, text_content, embedding_vector)
            VALUES (?, ?, ?, ?, ?)
        """, (project_name, file_name, chunk_id, text_content, embedding_str))
        conn.commit()
        conn.close()

    def delete_file_chunks(self, project_name: str, file_name: str):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM vector_chunks WHERE project_name = ? AND file_name = ?", (project_name, file_name))
        conn.commit()
        conn.close()

    def similarity_search(self, project_name: str, query_embedding: List[float], k: int = 5) -> List[Dict[str, Any]]:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Fetch chunks scoped by the exact Project Name
        cursor.execute("""
            SELECT file_name, chunk_id, text_content, embedding_vector 
            FROM vector_chunks 
            WHERE project_name = ?
        """, (project_name,))
        rows = cursor.fetchall()
        conn.close()
        
        results = []
        for file_name, chunk_id, text_content, embedding_str in rows:
            try:
                embedding = json.loads(embedding_str)
                score = cosine_similarity(query_embedding, embedding)
                results.append({
                    "file_name": file_name,
                    "chunk_id": chunk_id,
                    "text_content": text_content,
                    "score": score
                })
            except Exception as e:
                print(f"Error computing similarity for {file_name} chunk {chunk_id}: {str(e)}")
                
        # Sort by similarity score in descending order
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:k]

    def get_project_chunks(self, project_name: str) -> List[Dict[str, Any]]:
        """
        Fetches all text chunks indexed under the given project_name 
        directly from SQLite.
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT file_name, chunk_id, text_content 
            FROM vector_chunks 
            WHERE project_name = ?
        """, (project_name,))
        rows = cursor.fetchall()
        conn.close()
        return [
            {
                "file_name": r[0],
                "chunk_id": r[1],
                "text_content": r[2]
            } for r in rows
        ]
