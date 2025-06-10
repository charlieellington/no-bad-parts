Testing Guide for No Bad Parts Development
==========================================

This guide documents how to properly start development servers, run tests, and avoid common pitfalls when working on the No Bad Parts project.

## Table of Contents
- [Quick Start](#quick-start)
- [Common Issues & Solutions](#common-issues--solutions)
- [Step-by-Step Testing Guide](#step-by-step-testing-guide)
- [Server Management](#server-management)
- [WebSocket Testing](#websocket-testing)
- [Troubleshooting](#troubleshooting)




---




## Quick Start

### Starting the System (NEW - Integrated Setup)

**Terminal 1 - Start BOTH FastAPI Backend + Bot:**
```bash
# Navigate to agent directory
cd /Users/charlieellington1/coding/no-bad-parts/agent

# Activate virtual environment (use whichever exists)
source venv_new/bin/activate    # or: source .venv/bin/activate

# Start the integrated server (this runs BOTH server and bot!)
python3.11 server.py

# Server will start on http://localhost:8000
# Bot will automatically start as background task
```

**Terminal 2 - Next.js Frontend:**
```bash
# From project root (no-bad-parts/)
pnpm dev
# Will start on http://localhost:3000
```

**That's it! Just two commands total.**




---




### Alternative FastAPI Start Methods

If `python3.11 server.py` doesn't work, try:
```bash
# Method 1: Using uvicorn directly
uvicorn server:app --host 0.0.0.0 --port 8000 --reload

# Method 2: Using python module
python3.11 -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

## Common Issues & Solutions

### Issue 1: "python: command not found"

**❌ WRONG - Using 'python' on macOS:**
```bash
python server.py
# Error: zsh: command not found: python
```

**✅ CORRECT - Use python3.11:**
```bash
python3.11 server.py    # macOS requires version-specific command
```

### Issue 2: Virtual Environment Not Found

**❌ WRONG - Running from project root:**
```bash
# This will fail because venv is inside agent/
charlieellington1@MacBook-Air-2 no-bad-parts % source .venv/bin/activate
source: no such file or directory: .venv/bin/activate
```

**✅ CORRECT - Change to agent directory first:**
```bash
cd agent                          # Navigate to agent directory
source venv_new/bin/activate      # or .venv/bin/activate
python3.11 server.py              # Now this works!
```

**Note:** You may have either `.venv` or `venv_new` - check which exists:
```bash
ls -la agent/    # Look for .venv or venv_new directory
```

### Issue 3: Port Already in Use

If you see "Port 8000 is already in use":
```bash
# Find process using port 8000
lsof -i :8000
# Kill the process
kill -9 <PID>

# For Next.js on port 3000
lsof -i :3000
kill -9 <PID>
```

## Step-by-Step Testing Guide

### Step 1: Environment Setup

1. **Verify Python Virtual Environment:**
   ```bash
   cd agent
   ls -la                           # Check if venv_new or .venv exists
   python3.11 -m venv venv_new      # Create if doesn't exist
   source venv_new/bin/activate     # Activate it
   pip install -r requirements.txt   # Install dependencies
   ```

2. **Test Server Health:**
   ```bash
   # With server running
   curl http://localhost:8000/health
   # Expected: {"status":"ok"}
   ```

3. **Check Environment Variables:**
   ```bash
   curl http://localhost:8000/debug/env
   # Should show status of all required env vars
   ```

### Step 2: Testing the Integrated System

1. **Start the Integrated Server:**
   ```bash
   cd agent
   source venv_new/bin/activate
   python3.11 server.py
   ```

2. **Expected Output:**
   ```
   INFO:     Started server process [12345]
   INFO:     Waiting for application startup.
   Starting AI coach bot as background task...
   🚀 Starting AI-Coach bot (Stage 4 – STT + GPT-4 + WebSocket)…
   AI coach bot task created
   INFO:     Application startup complete.
   INFO:     Uvicorn running on http://0.0.0.0:8000
   ```

3. **Verify Bot Joins Daily Room:**
   - Look for: "🤖 Bot joined room – waiting for participants…"
   - Open Daily room in browser
   - Check for "ai-coach" in participant list

### Step 3: WebSocket Connection Testing

1. **Open Facilitator Page:**
   - URL: http://localhost:3000/protected
   - Should see "Connected" status indicator

2. **Test Manual Hint:**
   ```bash
   # Send a test hint
   curl -X POST "http://localhost:8000/test-hint?hint=Test%20hint%20from%20curl"
   ```
   - Hint should appear in facilitator UI immediately

3. **Test Full Pipeline:**
   - Join Daily room as participant
   - Speak clearly
   - Watch server logs for:
     - "📝 [name] said: [transcript]"
     - "💡 Broadcasting hint: [hint]..."
   - Verify hint appears in facilitator UI

## Server Management

### Starting the Integrated System

**Primary Method (Recommended):**
```bash
cd agent
source venv_new/bin/activate    # or .venv/bin/activate
python3.11 server.py
```

**Alternative Methods:**
```bash
# If you prefer uvicorn command
uvicorn server:app --host 0.0.0.0 --port 8000 --reload

# Or as Python module
python3.11 -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

### Checking System Status

**Verify everything is running:**
```bash
# Check FastAPI + Bot
curl -s http://localhost:8000/health
ps aux | grep "server.py\|uvicorn"

# Check WebSocket connections
curl http://localhost:8000/debug/env

# Check Next.js  
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

## WebSocket Testing

### Manual WebSocket Testing

**Using wscat:**
```bash
# Install if needed
npm install -g wscat

# Connect to WebSocket
wscat -c ws://localhost:8000/ws
# Should stay connected (no immediate response expected)
```

### Testing Hint Broadcasting

1. **Connect as Facilitator:**
   - Open http://localhost:3000/protected
   - Verify "Connected" status

2. **Send Test Hints:**
   ```bash
   # Via API endpoint
   curl -X POST "http://localhost:8000/test-hint?hint=Testing%20hint%20broadcast"
   ```

3. **Via Daily Speech:**
   - Join Daily room
   - Speak as participant
   - Hints should auto-generate and broadcast

## Troubleshooting

### Server Won't Start

1. **"command not found: python"**
   ```bash
   # Use python3.11 instead
   python3.11 server.py
   ```

2. **"No module named 'fastapi'"**
   ```bash
   # Activate venv first!
   cd agent
   source venv_new/bin/activate
   pip install -r requirements.txt
   ```

3. **"cannot import name 'broadcast_hint'"**
   - This is fixed in the integrated setup
   - Make sure you're using the latest server.py

### WebSocket Issues

1. **"Broadcasting to 0 facilitators"**
   - Old issue from separate processes - now fixed
   - Make sure facilitator UI is connected
   - Check WebSocket status in browser

2. **No hints appearing:**
   - Check browser console for WebSocket errors
   - Verify server shows active connections
   - Test with manual hint endpoint first

### Daily/Bot Issues

1. **Bot doesn't join room:**
   - Check DAILY_ROOM_URL in .env
   - Verify DAILY_API_KEY is set
   - Look for token generation errors

2. **No transcriptions:**
   - Speak clearly and loudly
   - Check participant is being captured
   - Look for "🎤 Started transcription capture" in logs

## Environment Variables

Create `agent/.env` with:
```env
# Daily Configuration
DAILY_ROOM_URL=https://nobadparts.daily.co/your-room-name
DAILY_API_KEY=your-daily-api-key
# DAILY_TOKEN=optional-if-using-private-room

# OpenAI Configuration  
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
SYSTEM_PROMPT=You are a helpful Internal Family Systems (IFS) coaching assistant...
```

## Testing Checklist

### Initial Setup
- [ ] Python 3.11+ installed (`python3.11 --version`)
- [ ] Virtual environment exists in `agent/venv_new` or `agent/.venv`
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] `.env` file created in `agent/` directory
- [ ] Frontend dependencies installed (`pnpm install`)

### Daily Testing Routine
- [ ] Terminal 1: Start integrated server (`python3.11 server.py`)
- [ ] Terminal 2: Start Next.js (`pnpm dev`)
- [ ] Verify health endpoint works
- [ ] Check facilitator WebSocket connects
- [ ] Test manual hint broadcasting
- [ ] Join Daily room and test speech pipeline

### Before Committing
- [ ] No errors in server logs
- [ ] WebSocket maintains connection
- [ ] Hints display properly
- [ ] Bot processes speech correctly
- [ ] Clean shutdown (Ctrl+C) works

## Quick Command Reference

```bash
# Start everything (from agent/)
cd agent && source venv_new/bin/activate && python3.11 server.py

# Quick health check
curl http://localhost:8000/health

# Send test hint
curl -X POST "http://localhost:8000/test-hint?hint=Test"

# Check what's running
ps aux | grep -E "server.py|uvicorn|node"

# Kill servers
pkill -f "server.py"
pkill -f "next-server"
```

## Key URLs
- FastAPI Health: http://localhost:8000/health
- Environment Check: http://localhost:8000/debug/env
- WebSocket: ws://localhost:8000/ws
- Facilitator UI: http://localhost:3000/protected
- Daily Room: Check DAILY_ROOM_URL in .env

**Remember:** 
- Always use `python3.11`, not `python`
- Always activate venv before running
- The new setup runs BOTH server and bot together! 