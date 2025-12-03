# Setup Guide - Daniel Shields Resume Chatbot

Complete step-by-step guide to get the RAG chatbot running locally or deployed to production.

## Table of Contents

1. [Quick Start (Docker)](#quick-start-docker)
2. [Manual Setup](#manual-setup)
3. [Configuration](#configuration)
4. [Loading Resume Data](#loading-resume-data)
5. [Testing](#testing)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start (Docker)

The fastest way to get running with Docker:

```bash
# 1. Clone the repository
git clone https://github.com/mimeographllc/claude-resume.git
cd claude-resume

# 2. Set up environment variables
cp backend/.env.example backend/.env
# Edit backend/.env and add your OPENAI_API_KEY

# 3. Start all services
docker-compose up -d

# 4. Wait ~30 seconds for services to initialize, then load resume
python3 load_resume.py

# 5. Open the app
open http://localhost:3000
```

That's it! Skip to [Loading Resume Data](#loading-resume-data) section.

---

## Manual Setup

### Step 1: Prerequisites

Install the following on your system:

**PostgreSQL 14+**
```bash
# macOS
brew install postgresql@14
brew services start postgresql@14

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql-14 postgresql-contrib
sudo systemctl start postgresql

# Verify
psql --version
```

**Python 3.9+**
```bash
# Check version
python3 --version

# macOS
brew install python@3.11

# Ubuntu/Debian
sudo apt install python3.11 python3.11-venv python3-pip
```

**Node.js 16+**
```bash
# Check version
node --version

# macOS
brew install node

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

**PGVector Extension**
```bash
# macOS
brew install pgvector

# Ubuntu/Debian (PostgreSQL 14)
sudo apt install postgresql-14-pgvector

# Or build from source
git clone https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install
```

### Step 2: Clone Repository

```bash
git clone https://github.com/mimeographllc/claude-resume.git
cd claude-resume
```

### Step 3: Database Setup

```bash
# Create database
createdb resume_rag

# Enable PGVector extension
psql resume_rag -c "CREATE EXTENSION vector;"

# Verify extension
psql resume_rag -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
```

### Step 4: Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Edit .env file and set:
# - OPENAI_API_KEY=your_key_here
# - DATABASE_URL=postgresql://postgres:postgres@localhost:5432/resume_rag
```

### Step 5: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment (optional)
cp .env.example .env

# Edit .env if needed:
# - REACT_APP_API_URL=http://localhost:8000
# - REACT_APP_DID_API_KEY=your_key_here (optional)
```

### Step 6: Start Services

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
python main.py
```

You should see:
```
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

Browser should open automatically to `http://localhost:3000`

---

## Configuration

### Backend Environment Variables

Edit `backend/.env`:

```bash
# Required
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/resume_rag
OPENAI_API_KEY=sk-...your-key-here...

# Optional
PORT=8000
HOST=0.0.0.0
```

**Get OpenAI API Key:**
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy and paste into `.env`

### Frontend Environment Variables

Edit `frontend/.env`:

```bash
# Backend API URL
REACT_APP_API_URL=http://localhost:8000

# Optional: D-ID API Key for avatar features
REACT_APP_DID_API_KEY=your_did_key_here
```

**Get D-ID API Key (Optional):**
1. Create account at https://studio.d-id.com
2. Go to Account Settings
3. Copy API key
4. Paste into `.env`

---

## Loading Resume Data

### Option 1: Using the Load Script (Recommended)

```bash
# Make sure backend is running first!
python3 load_resume.py
```

Expected output:
```
📄 Loading Daniel Shields' resume...
   File size: 45234 characters

🚀 Uploading to backend...

✅ Success!
   Document ID: a1b2c3d4e5f6g7h8
   Title: Daniel Shields - AI Systems Architect Resume
   Chunks created: 47
   Category: resume

💬 You can now start chatting!
```

### Option 2: Using the Web UI

1. Open http://localhost:3000
2. Click **"Documents"** tab
3. Click **"Load Default Resume"** button
4. Click **"Upload Document"** button
5. Wait for embedding to complete (~30 seconds)
6. Switch to **"Chat"** tab

### Option 3: Using cURL

```bash
# Read resume file
RESUME_CONTENT=$(cat Daniel-Shields-AI-Systems-Architect-Resume.md)

# Upload via API
curl -X POST http://localhost:8000/documents/upload \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Daniel Shields Resume\",
    \"content\": \"$RESUME_CONTENT\",
    \"category\": \"resume\"
  }"
```

---

## Testing

### Test Backend API

```bash
# Health check
curl http://localhost:8000/health

# List documents
curl http://localhost:8000/documents

# Test chat
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are Daniels main skills?",
    "conversation_id": null
  }'
```

### Test Frontend

1. Open http://localhost:3000
2. Should see welcome screen
3. Try suggested questions
4. Check that sources appear with responses

### Test Database

```bash
# Check documents
psql resume_rag -c "SELECT id, title, category FROM documents;"

# Check embeddings count
psql resume_rag -c "SELECT COUNT(*) FROM embeddings;"

# Test vector search
psql resume_rag -c "SELECT chunk_text FROM embeddings LIMIT 1;"
```

---

## Deployment

### Deploy to Railway (Backend + Database)

1. Create account at https://railway.app
2. Click "New Project" → "Deploy PostgreSQL"
3. Add service → "GitHub Repo" → Select your repo
4. Set root directory to `/backend`
5. Add environment variables:
   - `OPENAI_API_KEY`
   - `DATABASE_URL` (auto-filled by Railway)
6. Deploy!

Railway will give you a URL like: `https://your-app.railway.app`

### Deploy to Vercel (Frontend)

1. Push code to GitHub
2. Go to https://vercel.com
3. Import project from GitHub
4. Set root directory to `/frontend`
5. Add environment variable:
   - `REACT_APP_API_URL` = Your Railway backend URL
   - `REACT_APP_DID_API_KEY` (optional)
6. Deploy!

### Deploy to Heroku

```bash
# Install Heroku CLI
brew install heroku/brew/heroku  # macOS
# or download from https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create app
heroku create your-resume-chatbot

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set OPENAI_API_KEY=your_key_here

# Deploy
git push heroku main

# Run migrations
heroku run python init_db.py
```

### Cost Estimates (Production)

**Free Tier Options:**
- Railway: $5/month credits (covers small projects)
- Vercel: Free for personal projects
- Render: Free PostgreSQL (expires after 90 days)

**Paid Recommendations:**
- Database: $7-10/month (Railway/Render/Neon)
- Backend: $7/month (Railway/Render)
- Frontend: Free (Vercel/Netlify)
- OpenAI: ~$5-10/month for moderate usage
- **Total: $12-27/month**

---

## Troubleshooting

### Backend Won't Start

**Error: `ModuleNotFoundError: No module named 'fastapi'`**
```bash
# Make sure venv is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

**Error: `could not connect to server`**
```bash
# Check PostgreSQL is running
pg_isready

# Start PostgreSQL
# macOS:
brew services start postgresql@14
# Linux:
sudo systemctl start postgresql
```

**Error: `relation "documents" does not exist`**
```bash
# Database tables aren't created yet
# Restart backend - it will auto-create tables on startup
python main.py
```

### Frontend Won't Start

**Error: `Cannot find module 'react'`**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Error: `Failed to fetch` or CORS errors**
```bash
# Check backend is running
curl http://localhost:8000/health

# Check REACT_APP_API_URL in .env
cat .env
```

### Database Issues

**PGVector extension not found:**
```bash
# Install pgvector
# macOS:
brew install pgvector

# Ubuntu:
sudo apt install postgresql-14-pgvector

# Then enable in database:
psql resume_rag -c "CREATE EXTENSION vector;"
```

**Can't create database:**
```bash
# Check PostgreSQL is running
brew services list | grep postgresql

# Try with full path
/usr/local/opt/postgresql@14/bin/createdb resume_rag
```

### OpenAI API Issues

**Error: `Invalid API key`**
- Verify key is correct in backend/.env
- Check key hasn't been revoked at https://platform.openai.com/api-keys
- Ensure key starts with `sk-`

**Error: `Rate limit exceeded`**
- You're making too many requests
- Wait a few minutes
- Consider upgrading OpenAI tier

**Error: `Insufficient credits`**
- Add credits at https://platform.openai.com/account/billing

### D-ID Avatar Issues

**Avatar not loading:**
- Check API key in frontend/.env
- D-ID requires HTTPS in production (works on localhost)
- Free tier limited to 20 minutes/month
- Check browser console for errors

**WebRTC connection failed:**
- Try a different browser (Chrome recommended)
- Check firewall/antivirus isn't blocking WebRTC
- May not work on some corporate networks

### Performance Issues

**Slow embedding:**
- Normal for first document (~30-60 seconds)
- Progress shown in terminal/logs
- Consider smaller chunk_size in backend/main.py

**Slow chat responses:**
- First response in conversation is slower
- Check OpenAI API status
- Consider using gpt-3.5-turbo instead of gpt-4

### Getting Help

1. Check logs:
   ```bash
   # Backend logs
   tail -f backend/logs/app.log
   
   # Frontend logs (in browser)
   Open DevTools → Console
   
   # Docker logs
   docker-compose logs -f
   ```

2. Enable debug mode:
   ```bash
   # Backend
   export FASTAPI_DEBUG=1
   python main.py
   ```

3. Common fixes:
   - Restart services
   - Clear browser cache
   - Delete and recreate database
   - Check environment variables
   - Verify API keys

4. Still stuck? File an issue on GitHub with:
   - Error message
   - Steps to reproduce
   - Your environment (OS, Python version, Node version)

---

## Next Steps

Once everything is working:

1. ✅ Customize the resume content
2. ✅ Adjust system prompt in `backend/main.py`
3. ✅ Add more documents (projects, skills, etc.)
4. ✅ Deploy to production
5. ✅ Share the link on your resume!

Happy chatting! 🚀
