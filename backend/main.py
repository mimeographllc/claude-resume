"""
FastAPI backend for Daniel Shields Resume RAG Chatbot
Integrates with PostgreSQL/PGVector for embeddings and OpenAI for chat
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from datetime import datetime
import asyncpg
import openai
from openai import OpenAI
import hashlib

app = FastAPI(title="Resume RAG API", version="1.0.0")

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://127.0.0.1:3000",
        "http://local.pingblender.com",
        "http://local.pingblender.com:3000",
        "https://local.pingblender.com",
        "https://local.pingblender.com:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration from environment variables
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/resume_rag")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai.api_key = OPENAI_API_KEY
client = OpenAI(api_key=OPENAI_API_KEY)

# Database connection pool
db_pool = None

# Pydantic models
class ChatMessage(BaseModel):
    message: str
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    sources: List[dict]

class DocumentUpload(BaseModel):
    title: str
    content: str
    category: str = "resume"

class DocumentResponse(BaseModel):
    id: str
    title: str
    category: str
    chunk_count: int
    created_at: str

# Database initialization
@app.on_event("startup")
async def startup():
    global db_pool
    db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
    
    # Initialize database schema
    async with db_pool.acquire() as conn:
        # Enable pgvector extension
        await conn.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        
        # Create documents table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                category TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );
        """)
        
        # Create embeddings table with vector support
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS embeddings (
                id SERIAL PRIMARY KEY,
                document_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
                chunk_text TEXT NOT NULL,
                chunk_index INTEGER NOT NULL,
                embedding vector(1536),
                created_at TIMESTAMP DEFAULT NOW()
            );
        """)
        
        # Create index for faster similarity search
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS embeddings_vector_idx 
            ON embeddings USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 100);
        """)
        
        # Create conversations table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        """)
        
        # Create messages table
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );
        """)

@app.on_event("shutdown")
async def shutdown():
    if db_pool:
        await db_pool.close()

# Helper functions
def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    """Split text into overlapping chunks"""
    chunks = []
    start = 0
    text_length = len(text)
    
    while start < text_length:
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start += chunk_size - overlap
    
    return chunks

async def get_embedding(text: str) -> List[float]:
    """Get embedding from OpenAI"""
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding

async def similarity_search(query_embedding: List[float], limit: int = 5) -> List[dict]:
    """Search for similar chunks using cosine similarity"""
    # Convert embedding list to PostgreSQL vector format: '[1,2,3]'
    embedding_str = '[' + ','.join(map(str, query_embedding)) + ']'
    
    async with db_pool.acquire() as conn:
        results = await conn.fetch("""
            SELECT 
                e.chunk_text,
                d.title,
                d.category,
                1 - (e.embedding <=> $1::vector) as similarity
            FROM embeddings e
            JOIN documents d ON e.document_id = d.id
            ORDER BY e.embedding <=> $1::vector
            LIMIT $2;
        """, embedding_str, limit)
        
        return [
            {
                "text": r["chunk_text"],
                "title": r["title"],
                "category": r["category"],
                "similarity": float(r["similarity"])
            }
            for r in results
        ]

# API Endpoints

@app.get("/")
async def root():
    return {
        "service": "Resume RAG API",
        "status": "operational",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        async with db_pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")

@app.post("/documents/upload", response_model=DocumentResponse)
async def upload_document(doc: DocumentUpload):
    """Upload and embed a document"""
    try:
        # Generate document ID
        doc_id = hashlib.sha256(f"{doc.title}{datetime.now().isoformat()}".encode()).hexdigest()[:16]
        
        # Insert document
        async with db_pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO documents (id, title, category, content)
                VALUES ($1, $2, $3, $4)
            """, doc_id, doc.title, doc.category, doc.content)
            
            # Chunk the content
            chunks = chunk_text(doc.content)
            
            # Generate and store embeddings for each chunk
            for idx, chunk in enumerate(chunks):
                embedding = await get_embedding(chunk)
                # Convert embedding list to PostgreSQL vector format
                embedding_str = '[' + ','.join(map(str, embedding)) + ']'
                await conn.execute("""
                    INSERT INTO embeddings (document_id, chunk_text, chunk_index, embedding)
                    VALUES ($1, $2, $3, $4)
                """, doc_id, chunk, idx, embedding_str)
            
            return DocumentResponse(
                id=doc_id,
                title=doc.title,
                category=doc.category,
                chunk_count=len(chunks),
                created_at=datetime.now().isoformat()
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading document: {str(e)}")

@app.get("/documents", response_model=List[DocumentResponse])
async def list_documents():
    """List all documents"""
    async with db_pool.acquire() as conn:
        docs = await conn.fetch("""
            SELECT 
                d.id,
                d.title,
                d.category,
                d.created_at,
                COUNT(e.id) as chunk_count
            FROM documents d
            LEFT JOIN embeddings e ON d.id = e.document_id
            GROUP BY d.id, d.title, d.category, d.created_at
            ORDER BY d.created_at DESC
        """)
        
        return [
            DocumentResponse(
                id=doc["id"],
                title=doc["title"],
                category=doc["category"],
                chunk_count=doc["chunk_count"],
                created_at=doc["created_at"].isoformat()
            )
            for doc in docs
        ]

@app.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    """Delete a document and its embeddings"""
    async with db_pool.acquire() as conn:
        result = await conn.execute("DELETE FROM documents WHERE id = $1", doc_id)
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="Document not found")
        return {"message": "Document deleted successfully"}

@app.post("/chat", response_model=ChatResponse)
async def chat(message: ChatMessage):
    """Chat endpoint with RAG"""
    try:
        # Generate embedding for the query
        query_embedding = await get_embedding(message.message)
        
        # Search for relevant context
        relevant_chunks = await similarity_search(query_embedding, limit=5)
        
        # Build context from relevant chunks
        context = "\n\n".join([
            f"[From {chunk['title']}]\n{chunk['text']}"
            for chunk in relevant_chunks
        ])
        
        # Get or create conversation
        conversation_id = message.conversation_id or hashlib.sha256(
            f"{datetime.now().isoformat()}".encode()
        ).hexdigest()[:16]
        
        async with db_pool.acquire() as conn:
            # Create conversation if new
            if not message.conversation_id:
                await conn.execute("""
                    INSERT INTO conversations (id) VALUES ($1)
                    ON CONFLICT (id) DO NOTHING
                """, conversation_id)
            
            # Get conversation history
            history = await conn.fetch("""
                SELECT role, content FROM messages
                WHERE conversation_id = $1
                ORDER BY created_at ASC
                LIMIT 10
            """, conversation_id)
            
            # Build messages for OpenAI
            messages = [
                {
                    "role": "system",
                    "content": f"""You are an AI assistant representing Daniel Shields, helping answer questions about his background, experience, and capabilities. 

Your personality:
- Professional yet personable
- Technically precise without being overwhelming
- Enthusiastic about AI/ML and technology
- Honest about strengths and working style needs
- Direct communicator (reflecting Daniel's ADHD/ASD traits)

Key facts to emphasize:
- Production AI systems architect with real deployments
- Built Graffiti AI Amplifier (TRL5-9) with RAG, vector DBs, LLMs
- Healthcare AI expertise (HIPAA, FHIR, EDI)
- Patent holder (US 20090182643A1)
- Seeking $180K-$250K+ AI architect roles
- Prefers remote-first, hands-on technical work
- Not a fit for heavy management or political environments

Use the following context from Daniel's resume and documents to answer questions accurately:

{context}

If you don't know something or it's not in the context, say so honestly. Keep responses concise but informative."""
                }
            ]
            
            # Add conversation history
            for msg in history:
                messages.append({"role": msg["role"], "content": msg["content"]})
            
            # Add current user message
            messages.append({"role": "user", "content": message.message})
            
            # Get response from OpenAI
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                temperature=0.7,
                max_tokens=500
            )
            
            assistant_response = response.choices[0].message.content
            
            # Store messages
            await conn.execute("""
                INSERT INTO messages (conversation_id, role, content)
                VALUES ($1, $2, $3)
            """, conversation_id, "user", message.message)
            
            await conn.execute("""
                INSERT INTO messages (conversation_id, role, content)
                VALUES ($1, $2, $3)
            """, conversation_id, "assistant", assistant_response)
            
            # Update conversation timestamp
            await conn.execute("""
                UPDATE conversations SET updated_at = NOW()
                WHERE id = $1
            """, conversation_id)
        
        return ChatResponse(
            response=assistant_response,
            conversation_id=conversation_id,
            sources=relevant_chunks[:3]  # Return top 3 sources
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")

@app.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Get conversation history"""
    async with db_pool.acquire() as conn:
        messages = await conn.fetch("""
            SELECT role, content, created_at
            FROM messages
            WHERE conversation_id = $1
            ORDER BY created_at ASC
        """, conversation_id)
        
        return {
            "conversation_id": conversation_id,
            "messages": [
                {
                    "role": msg["role"],
                    "content": msg["content"],
                    "timestamp": msg["created_at"].isoformat()
                }
                for msg in messages
            ]
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)