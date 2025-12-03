#!/usr/bin/env python3
"""
Script to load Daniel Shields' resume into the RAG database
"""

import asyncio
import sys
from pathlib import Path
import requests

async def load_resume():
    """Load the resume document via API"""
    
    # Read resume content
    resume_path = Path("/mnt/user-data/outputs/Daniel-Shields-AI-Systems-Architect-Resume.md")
    
    if not resume_path.exists():
        print(f"❌ Resume file not found at {resume_path}")
        print("Please ensure the resume markdown file is available.")
        return False
    
    resume_content = resume_path.read_text()
    
    print("📄 Loading Daniel Shields' resume...")
    print(f"   File size: {len(resume_content)} characters")
    
    # API endpoint
    api_url = "http://local.pingblender.com:8000/documents/upload"
    
    # Prepare document
    document = {
        "title": "Daniel Shields - AI Systems Architect Resume",
        "content": resume_content,
        "category": "resume"
    }
    
    try:
        print("\n🚀 Uploading to backend...")
        response = requests.post(api_url, json=document, timeout=60)
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n✅ Success!")
            print(f"   Document ID: {data['id']}")
            print(f"   Title: {data['title']}")
            print(f"   Chunks created: {data['chunk_count']}")
            print(f"   Category: {data['category']}")
            print(f"\n💬 You can now start chatting!")
            return True
        else:
            print(f"\n❌ Error: {response.status_code}")
            print(f"   {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("\n❌ Cannot connect to backend API")
        print("   Make sure the backend is running on http://local.pingblender.com:8000")
        print("\n   Start the backend with:")
        print("   cd backend && python main.py")
        return False
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(load_resume())
    sys.exit(0 if success else 1)
