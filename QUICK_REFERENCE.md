# Quick Reference Guide

Quick command reference for common tasks.

## Starting the Application

### With Docker (Easiest)
```bash
docker-compose up -d                    # Start all services
docker-compose logs -f                  # View logs
docker-compose down                     # Stop all services
docker-compose restart backend          # Restart specific service
```

### Manual Start
```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
python main.py

# Terminal 2 - Frontend  
cd frontend
npm start

# Terminal 3 - Load Resume
python3 load_resume.py
```

## Development Commands

### Backend
```bash
# Install dependencies
pip install -r requirements.txt

# Run backend
python main.py

# Run with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Check code style
flake8 main.py

# Format code
black main.py
```

### Frontend
```bash
# Install dependencies
npm install

# Start dev server
npm start

# Build for production
npm run build

# Run tests
npm test

# Format code
npm run format
```

## Database Commands

```bash
# Create database
createdb resume_rag

# Enable PGVector
psql resume_rag -c "CREATE EXTENSION vector;"

# Connect to database
psql resume_rag

# Check documents
psql resume_rag -c "SELECT id, title FROM documents;"

# Check embeddings count
psql resume_rag -c "SELECT COUNT(*) FROM embeddings;"

# Delete all data (start fresh)
psql resume_rag -c "TRUNCATE documents CASCADE;"

# Backup database
pg_dump resume_rag > backup.sql

# Restore database
psql resume_rag < backup.sql
```

## API Testing

```bash
# Health check
curl http://localhost:8000/health

# List documents
curl http://localhost:8000/documents

# Upload document
curl -X POST http://localhost:8000/documents/upload \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Document",
    "content": "This is test content",
    "category": "test"
  }'

# Send chat message
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are Daniels skills?",
    "conversation_id": null
  }'

# Get conversation history
curl http://localhost:8000/conversations/{conversation_id}

# Delete document
curl -X DELETE http://localhost:8000/documents/{doc_id}
```

## Docker Commands

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose stop

# Remove containers
docker-compose down

# Remove containers and volumes
docker-compose down -v

# Restart a service
docker-compose restart backend

# Execute command in container
docker-compose exec backend python init_db.py
docker-compose exec postgres psql -U postgres resume_rag
```

## Git Commands

```bash
# Initialize repo
git init
git add .
git commit -m "Initial commit"

# Add GitHub remote
git remote add origin https://github.com/mimeographllc/claude-resume.git
git branch -M main
git push -u origin main

# Create feature branch
git checkout -b feature/new-feature

# Commit changes
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# Update from main
git checkout main
git pull origin main
git checkout feature/new-feature
git merge main
```

## Environment Setup

```bash
# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit environment files
nano backend/.env         # or vim, code, etc.
nano frontend/.env

# Check environment variables are loaded
# Backend (Python)
python -c "import os; print(os.getenv('OPENAI_API_KEY'))"

# Frontend (check .env exists)
cat frontend/.env
```

## Troubleshooting

```bash
# Check if ports are in use
lsof -i :8000              # Backend
lsof -i :3000              # Frontend
lsof -i :5432              # PostgreSQL

# Kill process on port
kill -9 $(lsof -t -i:8000)

# Check PostgreSQL status
pg_isready
brew services list | grep postgresql    # macOS
systemctl status postgresql             # Linux

# Restart PostgreSQL
brew services restart postgresql@14      # macOS
sudo systemctl restart postgresql        # Linux

# Check Python environment
which python3
python3 --version

# Check Node environment
which node
node --version
which npm
npm --version

# Clear Python cache
find . -type d -name __pycache__ -exec rm -r {} +

# Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Reset database
dropdb resume_rag
createdb resume_rag
psql resume_rag -c "CREATE EXTENSION vector;"
python3 load_resume.py
```

## Monitoring & Logs

```bash
# Backend logs (if using systemd)
journalctl -u resume-chatbot-backend -f

# Check API health
watch -n 5 'curl -s http://localhost:8000/health | jq'

# Monitor database connections
psql resume_rag -c "SELECT count(*) FROM pg_stat_activity;"

# Check document count
watch -n 5 'psql resume_rag -t -c "SELECT COUNT(*) FROM documents;"'

# Monitor file sizes
du -sh backend/
du -sh frontend/node_modules/
du -sh /var/lib/postgresql/14/data/
```

## Production Deployment

```bash
# Build frontend for production
cd frontend
npm run build
# Files in build/ ready to serve

# Test production build locally
npm install -g serve
serve -s build -p 3000

# Deploy to Vercel
npm install -g vercel
vercel login
vercel --prod

# Deploy backend to Railway
# 1. Push to GitHub
git push origin main

# 2. Connect repo in Railway dashboard
# 3. Add environment variables
# 4. Deploy!
```

## Maintenance

```bash
# Update Python dependencies
cd backend
pip list --outdated
pip install --upgrade package-name
pip freeze > requirements.txt

# Update Node dependencies
cd frontend
npm outdated
npm update
npm audit fix

# Backup before updates
pg_dump resume_rag > backup_$(date +%Y%m%d).sql

# Vacuum database (optimize)
psql resume_rag -c "VACUUM ANALYZE;"

# Check database size
psql resume_rag -c "SELECT pg_size_pretty(pg_database_size('resume_rag'));"
```

## Performance Testing

```bash
# Load test backend with ab (Apache Bench)
ab -n 100 -c 10 http://localhost:8000/health

# Load test with hey
hey -n 100 -c 10 http://localhost:8000/documents

# Monitor response times
time curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "conversation_id": null}'
```

## Quick Fixes

```bash
# "Port already in use"
kill -9 $(lsof -t -i:8000)
kill -9 $(lsof -t -i:3000)

# "Module not found"
pip install -r backend/requirements.txt
cd frontend && npm install

# "Database connection failed"
brew services restart postgresql@14

# "OpenAI API error"
cat backend/.env | grep OPENAI_API_KEY

# "PGVector not found"
psql resume_rag -c "CREATE EXTENSION IF NOT EXISTS vector;"

# "CORS error"
# Check REACT_APP_API_URL in frontend/.env
# Restart both backend and frontend

# Start completely fresh
docker-compose down -v
dropdb resume_rag
rm -rf backend/venv frontend/node_modules
./quickstart.sh
```

## Useful One-Liners

```bash
# Count lines of code
find . -name '*.py' -o -name '*.js' | xargs wc -l

# Find TODO comments
grep -r "TODO" --include="*.py" --include="*.js"

# Check API response time
time curl -s http://localhost:8000/health > /dev/null

# Monitor real-time chats
watch -n 2 'psql resume_rag -t -c "SELECT COUNT(*) FROM messages;"'

# Export all conversations
psql resume_rag -c "\copy (SELECT * FROM conversations) TO 'conversations.csv' CSV HEADER"

# Clean up Docker
docker system prune -a --volumes -f
```

---

**Pro Tips:**
- Use `&&` to chain commands: `cd backend && python main.py`
- Use `&` to run in background: `python main.py &`
- Use `Ctrl+C` to stop running processes
- Use `Ctrl+Z` then `bg` to background a process
- Use `jobs` to see background jobs
- Use `fg` to bring background job to foreground

**Keyboard Shortcuts:**
- Backend (in terminal): `Ctrl+C` to stop server
- Frontend (React): `Ctrl+C` to stop, then `Y` to confirm
- PostgreSQL: `\q` to quit, `\l` list databases, `\dt` list tables
- Docker logs: `Ctrl+C` to stop following logs
