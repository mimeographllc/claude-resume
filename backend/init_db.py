#!/usr/bin/env python3
"""
Initialize database and load resume documents
"""

import asyncio
import asyncpg
import os
import sys
from pathlib import Path

async def init_documents():
    """Load resume documents into the database"""
    
    # Read the main resume
    resume_path = Path("/mnt/user-data/outputs/Daniel-Shields-AI-Systems-Architect-Resume.md")
    if not resume_path.exists():
        print(f"Error: Resume file not found at {resume_path}")
        return
    
    resume_content = resume_path.read_text()
    
    # Connect to database
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/resume_rag")
    
    print("Connecting to database...")
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        # Check if document already exists
        existing = await conn.fetchval(
            "SELECT COUNT(*) FROM documents WHERE title = $1",
            "Daniel Shields - AI Systems Architect Resume"
        )
        
        if existing > 0:
            print("Resume document already loaded. Skipping...")
        else:
            print("Loading resume document...")
            
            # Note: We'll need to call the API endpoint to properly embed the document
            # This script just verifies the database is ready
            print("""
Database is ready!

To load documents, use the API:

curl -X POST http://localhost:8000/documents/upload \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Daniel Shields Resume",
    "content": "...",
    "category": "resume"
  }'

Or use the frontend UI to upload documents.
            """)
        
        # Show database stats
        doc_count = await conn.fetchval("SELECT COUNT(*) FROM documents")
        embedding_count = await conn.fetchval("SELECT COUNT(*) FROM embeddings")
        
        print(f"\nDatabase Stats:")
        print(f"  Documents: {doc_count}")
        print(f"  Embeddings: {embedding_count}")
        
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(init_documents())
