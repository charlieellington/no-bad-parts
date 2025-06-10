#!/bin/bash

# Start script for No Bad Parts AI Coach
# This runs both the FastAPI server and bot in one process

echo "🚀 Starting No Bad Parts AI Coach..."

# Check if we're in the agent directory
if [ ! -f "server.py" ]; then
    echo "❌ Error: Must run from agent/ directory"
    echo "📁 Please run: cd agent && ./start.sh"
    exit 1
fi

# Check for virtual environment
if [ -d "venv_new" ]; then
    echo "✅ Found venv_new"
    source venv_new/bin/activate
elif [ -d ".venv" ]; then
    echo "✅ Found .venv"
    source .venv/bin/activate
else
    echo "❌ No virtual environment found!"
    echo "📦 Creating venv_new..."
    python3.11 -m venv venv_new
    source venv_new/bin/activate
    echo "📦 Installing requirements..."
    pip install -r requirements.txt
fi

# Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: No .env file found!"
    echo "📝 Please create agent/.env with your API keys"
fi

# Start the server
echo "🌐 Starting integrated server (FastAPI + Bot)..."
echo "📍 Server will be available at: http://localhost:8000"
echo "🤖 Bot will join Daily room automatically"
echo ""
echo "💡 Tips:"
echo "   - Open http://localhost:3000/protected for facilitator UI"
echo "   - Press Ctrl+C to stop"
echo ""

python3.11 server.py 