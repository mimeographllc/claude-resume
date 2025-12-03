#!/bin/bash

echo "🚀 Daniel Shields Resume Chatbot - Quick Start"
echo "=============================================="
echo ""

# Check if .env files exist
if [ ! -f backend/.env ]; then
    echo "⚠️  Backend .env not found. Creating from template..."
    cp backend/.env.example backend/.env
    echo "   Please edit backend/.env and add your OPENAI_API_KEY"
    echo ""
fi

if [ ! -f frontend/.env ]; then
    echo "⚠️  Frontend .env not found. Creating from template..."
    cp frontend/.env.example frontend/.env
    echo "   You can optionally add REACT_APP_DID_API_KEY for avatar features"
    echo ""
fi

# Check if Docker is available
if command -v docker-compose &> /dev/null; then
    echo "🐳 Docker Compose detected. Would you like to use Docker? (y/n)"
    read -r use_docker
    
    if [ "$use_docker" = "y" ]; then
        echo ""
        echo "Starting services with Docker..."
        docker-compose up -d
        
        echo ""
        echo "⏳ Waiting for services to be ready..."
        sleep 10
        
        echo ""
        echo "✅ Services started!"
        echo "   Backend: http://localhost:8000"
        echo "   Frontend: http://localhost:3000"
        echo "   PostgreSQL: localhost:5432"
        echo ""
        echo "📄 To load the resume, run:"
        echo "   python3 load_resume.py"
        echo ""
        echo "📋 To view logs:"
        echo "   docker-compose logs -f"
        echo ""
        echo "🛑 To stop:"
        echo "   docker-compose down"
        exit 0
    fi
fi

# Manual setup
echo ""
echo "📦 Setting up manually..."
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.9+

"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 16+"
    exit 1
fi

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL not found. Please install PostgreSQL 14+"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Setup backend
echo "🔧 Setting up backend..."
cd backend || exit
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements.txt
cd ..
echo "   ✅ Backend ready"
echo ""

# Setup frontend
echo "🔧 Setting up frontend..."
cd frontend || exit
if [ ! -d "node_modules" ]; then
    npm install --silent
fi
cd ..
echo "   ✅ Frontend ready"
echo ""

# Database setup
echo "🗄️  Setting up database..."
createdb resume_rag 2>/dev/null || echo "   Database already exists"
psql resume_rag -c "CREATE EXTENSION IF NOT EXISTS vector;" &>/dev/null
echo "   ✅ Database ready"
echo ""

echo "=============================================="
echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo ""
echo "Terminal 1 - Backend:"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   python main.py"
echo ""
echo "Terminal 2 - Frontend:"
echo "   cd frontend"
echo "   npm start"
echo ""
echo "Terminal 3 - Load Resume:"
echo "   python3 load_resume.py"
echo ""
echo "Then open http://localhost:3000"
echo "=============================================="
