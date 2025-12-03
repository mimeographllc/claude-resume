# Network Error Troubleshooting Guide

## Quick Diagnosis

### Step 1: Check Backend Status Indicator

Look at the bottom-right corner of the browser window:
- ✅ **Green "Backend Connected"** = Everything is working
- ❌ **Red "Backend Offline"** = Backend is not running or unreachable

### Step 2: Run Diagnostic Script

```bash
cd /path/to/resume-chatbot
./diagnose-network.sh
```

This will check:
- Backend running status
- Frontend configuration
- CORS settings
- PostgreSQL connection
- Environment files

---

## Common Issues & Solutions

### Issue 1: "Cannot reach backend" or ERR_NETWORK

**Symptoms:**
- Red status indicator in bottom-right
- Chat/upload fails with network error
- Browser console shows `ERR_NETWORK`

**Solutions:**

**A. Start the Backend**
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**B. Verify Backend is Accessible**
```bash
curl http://localhost:8000/health
```

Should return:
```json
{"status":"healthy","database":"connected"}
```

**C. Check Port Conflicts**
```bash
# See what's using port 8000
lsof -i :8000  # Mac/Linux
netstat -ano | findstr :8000  # Windows

# If something else is using it, kill it or change backend port
```

---

### Issue 2: CORS Error

**Symptoms:**
- Browser console shows: "CORS policy: No 'Access-Control-Allow-Origin' header"
- Backend is running but requests fail

**Solutions:**

**A. Verify CORS Configuration**

Check `backend/main.py` has:
```python
allow_origins=[
    "http://localhost:3000",
    "http://local.pingblender.com:3000",
    ...
]
```

**B. Restart Backend**
```bash
# Stop backend (Ctrl+C)
# Start again
cd backend
python main.py
```

**C. Check Frontend URL**

In browser, if you're visiting:
- `http://localhost:3000` → Should work
- `http://local.pingblender.com:3000` → Should work
- `http://127.0.0.1:3000` → Should work
- Anything else → Add to CORS origins list

---

### Issue 3: Missing .env Files

**Symptoms:**
- Frontend uses wrong API URL
- Backend can't connect to database
- OpenAI API errors

**Solutions:**

**A. Create Frontend .env**
```bash
cd frontend
cat > .env << EOF
REACT_APP_API_URL=http://localhost:8000
EOF
```

Then restart frontend (Ctrl+C, then `npm start`)

**B. Create Backend .env**
```bash
cd backend
cp .env.example .env
# Edit .env and add your keys:
nano .env  # or use your favorite editor
```

Required:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/resume_rag
OPENAI_API_KEY=sk-your-key-here
```

Then restart backend.

---

### Issue 4: PostgreSQL Not Running

**Symptoms:**
- Backend starts but crashes immediately
- Error: "could not connect to server"
- Database-related errors

**Solutions:**

**A. Start PostgreSQL**
```bash
# macOS
brew services start postgresql@14

# Linux
sudo systemctl start postgresql

# Windows
# Start from Services or pgAdmin
```

**B. Verify PostgreSQL**
```bash
psql --version
pg_isready
```

**C. Create Database**
```bash
createdb resume_rag
psql resume_rag -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

---

### Issue 5: API Key Issues

**Symptoms:**
- Upload works but chat fails
- Error: "Invalid API key" or "Insufficient credits"

**Solutions:**

**A. Verify API Key**
```bash
cat backend/.env | grep OPENAI_API_KEY
```

Should start with `sk-`

**B. Test API Key**
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY_HERE"
```

**C. Check Credits**
Visit: https://platform.openai.com/account/billing

---

### Issue 6: Frontend Not Picking Up .env Changes

**Symptoms:**
- Created .env but still getting errors
- API URL not updating

**Solutions:**

**A. Restart Frontend**
```bash
# In frontend terminal
Ctrl+C
npm start
```

React only reads .env on startup!

**B. Hard Refresh Browser**
```
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

**C. Check .env is Being Used**

In browser console:
```javascript
console.log(process.env.REACT_APP_API_URL)
```

Should show: `http://localhost:8000`

---

## Debugging Steps

### 1. Check Browser Console (F12)

Look for:
- Red errors
- Network errors
- CORS errors
- Specific error messages

### 2. Check Backend Terminal

Look for:
- Incoming requests
- Error stack traces
- Database connection errors

### 3. Check Network Tab (F12 → Network)

Click on failed request:
- **Status: (failed)** = Backend not reachable
- **Status: 0** = CORS issue
- **Status: 404** = Wrong endpoint
- **Status: 500** = Backend error (check terminal)

### 4. Test API Directly

```bash
# Test health
curl http://localhost:8000/health

# Test chat
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test","conversation_id":null}'

# Test upload
curl -X POST http://localhost:8000/documents/upload \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"Test content","category":"test"}'
```

---

## Still Not Working?

### Nuclear Option: Fresh Start

```bash
# 1. Stop everything
# Ctrl+C in all terminals

# 2. Clean up
cd backend
rm -rf __pycache__ venv
cd ../frontend
rm -rf node_modules package-lock.json

# 3. Reinstall
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cd ../frontend
npm install

# 4. Configure
cd backend
cp .env.example .env
# Edit .env with your keys

cd ../frontend
cat > .env << EOF
REACT_APP_API_URL=http://localhost:8000
EOF

# 5. Restart database
dropdb resume_rag
createdb resume_rag
psql resume_rag -c "CREATE EXTENSION vector;"

# 6. Start backend
cd backend
python main.py

# 7. Start frontend (new terminal)
cd frontend
npm start
```

---

## Visual Troubleshooting Flowchart

```
Start
  ↓
Is backend running? → NO → Start backend: cd backend && python main.py
  ↓ YES
  ↓
Does http://localhost:8000/health work? → NO → Check PostgreSQL, .env file
  ↓ YES
  ↓
Is frontend .env correct? → NO → Create/fix frontend/.env
  ↓ YES
  ↓
Did you restart frontend? → NO → Ctrl+C, npm start
  ↓ YES
  ↓
Hard refresh browser? → NO → Ctrl+Shift+R
  ↓ YES
  ↓
Check browser console (F12) for specific error
  ↓
Check backend terminal for incoming requests
  ↓
Run: ./diagnose-network.sh
  ↓
Still broken? → Create GitHub issue with:
  - Browser console screenshot
  - Backend terminal output
  - Output of diagnose-network.sh
```

---

## Success Checklist

✅ Backend running on http://localhost:8000  
✅ Health endpoint returns {"status":"healthy"}  
✅ PostgreSQL running with resume_rag database  
✅ backend/.env has OPENAI_API_KEY  
✅ frontend/.env has REACT_APP_API_URL  
✅ Frontend restarted after .env creation  
✅ Browser hard refreshed  
✅ Green "Backend Connected" indicator visible  
✅ No CORS errors in console  
✅ Network tab shows successful requests (200)  

If all checked: **You're ready to go!** 🚀

---

## Quick Command Reference

```bash
# Start backend
cd backend && source venv/bin/activate && python main.py

# Start frontend
cd frontend && npm start

# Check backend health
curl http://localhost:8000/health

# Check what's on port 8000
lsof -i :8000

# Restart PostgreSQL
brew services restart postgresql@14  # macOS
sudo systemctl restart postgresql     # Linux

# View backend logs (if running in background)
tail -f backend/logs/*.log

# Test CORS
curl -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS \
  http://localhost:8000/chat -i

# Run full diagnostics
./diagnose-network.sh
```

---

**Need More Help?**

1. Read this guide again carefully
2. Run `./diagnose-network.sh`
3. Check browser console + backend terminal
4. Create GitHub issue with details

The network indicator (bottom-right) should tell you immediately if backend is reachable!