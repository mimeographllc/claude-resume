#!/bin/bash

echo "🔍 Network Error Diagnostics"
echo "================================"
echo ""

# Check backend is running
echo "1. Checking if backend is running..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ Backend is running on port 8000"
    echo "   Response: $(curl -s http://localhost:8000/health | head -c 100)"
else
    echo "   ❌ Backend is NOT running on port 8000"
    echo "   Action: Start backend with 'cd backend && python main.py'"
fi
echo ""

# Check frontend environment
echo "2. Checking frontend configuration..."
if [ -f "frontend/.env" ]; then
    echo "   ✅ Frontend .env file exists"
    echo "   Content:"
    cat frontend/.env | grep -v "API_KEY" | sed 's/^/      /'
else
    echo "   ⚠️  Frontend .env file does NOT exist"
    echo "   Creating it now..."
    cat > frontend/.env << 'EOF'
REACT_APP_API_URL=http://localhost:8000
EOF
    echo "   ✅ Created frontend/.env with REACT_APP_API_URL=http://localhost:8000"
fi
echo ""

# Check if backend .env exists
echo "3. Checking backend configuration..."
if [ -f "backend/.env" ]; then
    echo "   ✅ Backend .env file exists"
    if grep -q "OPENAI_API_KEY=sk-" backend/.env 2>/dev/null; then
        echo "   ✅ OpenAI API key is configured"
    else
        echo "   ⚠️  OpenAI API key may not be set"
    fi
    if grep -q "DATABASE_URL=" backend/.env 2>/dev/null; then
        echo "   ✅ Database URL is configured"
    else
        echo "   ⚠️  Database URL may not be set"
    fi
else
    echo "   ⚠️  Backend .env file does NOT exist"
    echo "   Action: Copy backend/.env.example to backend/.env and configure"
fi
echo ""

# Test CORS
echo "4. Testing CORS from localhost:3000..."
CORS_TEST=$(curl -s -H "Origin: http://localhost:3000" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" \
    -X OPTIONS \
    http://localhost:8000/chat \
    -i 2>/dev/null | grep -i "access-control-allow-origin")

if [ ! -z "$CORS_TEST" ]; then
    echo "   ✅ CORS is properly configured"
    echo "   Headers: $CORS_TEST"
else
    echo "   ⚠️  CORS headers not found (backend may not be running)"
fi
echo ""

# Test from local.pingblender.com
echo "5. Testing CORS from local.pingblender.com..."
CORS_TEST2=$(curl -s -H "Origin: http://local.pingblender.com:3000" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" \
    -X OPTIONS \
    http://localhost:8000/chat \
    -i 2>/dev/null | grep -i "access-control-allow-origin")

if [ ! -z "$CORS_TEST2" ]; then
    echo "   ✅ CORS works for local.pingblender.com"
    echo "   Headers: $CORS_TEST2"
else
    echo "   ⚠️  CORS headers not found"
fi
echo ""

# Check PostgreSQL
echo "6. Checking PostgreSQL..."
if command -v psql > /dev/null 2>&1; then
    if psql -U postgres -d resume_rag -c "SELECT 1;" > /dev/null 2>&1; then
        echo "   ✅ PostgreSQL is running and resume_rag database exists"
    else
        echo "   ⚠️  Cannot connect to resume_rag database"
        echo "   Action: Create database with 'createdb resume_rag'"
    fi
else
    echo "   ⚠️  PostgreSQL command not found"
fi
echo ""

# Summary
echo "================================"
echo "📋 Summary & Next Steps:"
echo ""

if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "❗ CRITICAL: Backend is not running"
    echo "   Start it with:"
    echo "   cd backend"
    echo "   source venv/bin/activate  # On Windows: venv\\Scripts\\activate"
    echo "   python main.py"
    echo ""
fi

if [ ! -f "frontend/.env" ]; then
    echo "⚠️  Frontend needs .env file (just created it)"
    echo "   Restart frontend to pick up changes:"
    echo "   Ctrl+C in frontend terminal, then 'npm start'"
    echo ""
fi

if [ ! -f "backend/.env" ]; then
    echo "⚠️  Backend needs .env file with API keys"
    echo "   cp backend/.env.example backend/.env"
    echo "   Edit backend/.env and add your OPENAI_API_KEY"
    echo ""
fi

echo "✅ If all checks pass above, try:"
echo "   1. Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)"
echo "   2. Check browser console (F12) for specific error"
echo "   3. Check backend terminal for incoming requests"
echo ""
echo "🔧 Common Fixes:"
echo "   • Restart backend after changing .env"
echo "   • Restart frontend after changing .env"
echo "   • Clear browser cache"
echo "   • Try incognito/private window"