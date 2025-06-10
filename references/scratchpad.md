---
title: Scratchpad
---

# Scratchpad

## Project Progress - No Bad Parts Collective

### Step 1: Prepare Project Repository & Environment

#### ✅ Required Tooling Installed
- **Node 18+**: v18.20.8 ✅ (already installed)
- **pnpm**: v10.11.0 ✅ (already installed)
- **Python 3.11+**: v3.11.13 ✅ (newly installed via Homebrew)
  - Available as `python3.11` command
  - Default `python3` still points to v3.9.6 but 3.11+ is available
- **Docker Desktop**: v28.0.4 ✅ (already installed)
- **Fly CLI**: v0.3.140 ✅ (already installed)
- **Vercel CLI**: v41.7.0 ✅ (already installed)

#### ✅ Project Dependencies Installed
- **Frontend**: `pnpm install` completed successfully ✅
- **Agent Backend**: Virtual environment created with Python 3.11 ✅
  - `pipecat-ai[daily,openai]` v0.0.69 ✅ (latest available version)
  - `fastapi` v0.115.12 ✅
  - `uvicorn` v0.34.3 ✅
  - `python-dotenv` v1.1.0 ✅
- All dependencies installed in virtual environment at `agent/.venv/`

#### ✅ UI Skeleton Completed
- Created `pages/session/` directory (Pages Router)
- Added `partner.tsx` - Simple Daily iframe placeholder with username=`partner`
- Added `facilitator.tsx` - Daily iframe placeholder + empty "Coach Hints" panel with username=`facilitator`
- Both files compile with zero props/state, front-end builds successfully
- Ready for commit: "feat: add basic session pages"

#### ✅ Agent Skeleton Completed
- Created `agent/` directory
- Added `agent/server.py` with FastAPI app exposing `GET /health` and `WS /ws`
- Added `agent/requirements.txt`
- Added top-level `Makefile` shortcut: `make agent-dev` (run inside activated venv)
- Smoke-tested: health & WebSocket OK

### Step 2: Embed Daily Prebuilt Video UI

#### ✅ Partner Page Updated (Fixed Layout)
- **File**: `pages/session/partner.tsx` ✅
- Full-screen Daily iframe with inline styles for reliability
- Uses `position: fixed` with `100vw/100vh` for true full viewport coverage
- Includes fallback Daily URL for development
- No wrapper divs to avoid constraint issues

#### ✅ Facilitator Page Updated (Fixed Layout)
- **File**: `pages/session/facilitator.tsx` ✅
- Separate desktop and mobile layouts for proper responsive behavior:
  - **Desktop**: Side-by-side with flex layout (video left, hints right 384px)
  - **Mobile**: Stacked layout (video flex-1, hints fixed 256px height)
- Uses inline styles for critical positioning to ensure reliability
- Fixed positioning ensures proper viewport coverage
- WebSocket preparation comments (implementation deferred to later steps)

#### ✅ Global Styles Added
- **File**: `pages/_app.tsx` ✅
- Created _app.tsx for Pages Router
- Ensures html, body, and #__next have 100% height
- Prevents any parent container constraints
- Imports global CSS and sets overflow hidden

#### ✅ LiveKit Cleanup Verified
- **No LiveKit packages found** in package.json ✅
- **No LiveKit imports** found in codebase ✅
- **No LiveKit configuration files** found ✅
- Ran `pnpm remove @livekit/components-react livekit-client` - confirmed no such dependencies exist
- Project is clean of any LiveKit references (only documentation mentions remain)

#### 📝 Environment Files Status
- `.env.local` configured with Daily URLs ✅
- Fallback URLs included in code for development
- Agent `.env` will be needed for backend in later steps

#### Next: Visual Testing
- Test full-screen video on Partner page
- Test responsive layout on Facilitator page
- Verify Daily room functionality
- Check mobile responsiveness

### Current Status (Step 2 Complete)
- **Frontend**: Both session pages have proper full viewport layouts
- **Partner Page**: True full-screen iframe with no constraints
- **Facilitator Page**: Proper split-screen with responsive mobile layout
- **Global Styles**: Added to ensure no parent container issues
- **LiveKit**: Verified completely removed from project
- **Dev Server**: Running on http://localhost:3000

### Architecture Notes
- Using hybrid Next.js routing: App Router for main site, Pages Router for session pages
- Following build plan from references/buildplan_parts/step-2.md
- Daily Prebuilt with inline styles for reliability
- Separate mobile/desktop layouts for facilitator view
- WebSocket integration prepared for future implementation (Step 4)
- No LiveKit dependencies or configuration remaining

### Workspace Clean-up (2025-06-09)
- Added virtual-environment directories (`venv/`, `.venv/`, `agent/venv/`, `agent/.venv/`) to `.gitignore` to keep Git and the VS Code Git extension fast and tidy.

### Step 3: Set Up Real-Time Hint WebSocket Channel (In Progress)
- **Testing Guide Created**: `references/buildplan_parts/testing.md` - comprehensive testing documentation
  - Documents the virtual environment directory issue and solution
  - Provides step-by-step server startup instructions
  - Includes testing procedures for all stages
  - Common troubleshooting scenarios
- **Documentation Updated**: Added staged implementation approach to step-3.md
- **4 Stages Defined**:
  - Stage 1: Basic Connection Test (15 min) - Verify WebSocket connectivity
  - Stage 2: Hint Display (20 min) - Show hints in UI
  - Stage 3: Structured Messaging (30 min) - JSON protocol implementation
  - Stage 4: Production Hardening (45 min) - Reconnection logic & polish

#### Stage 1: Basic Connection Test ✅ COMPLETED
- **Frontend Updates**:
  - Added `useEffect` import to facilitator.tsx
  - Implemented WebSocket client with console logging
  - Added fallback URL pattern: `ws://localhost:8000/ws`
  - Proper cleanup on component unmount
- **Backend Status**: Already has WebSocket endpoint with "WS_CONNECTED" test message
- **Ready for Testing**: Both servers need to be running

#### Testing Instructions for Stage 1:
1. **Terminal 1 - Start FastAPI backend**:
   ```bash
   cd agent
   python3.11 -m venv .venv  # if not already created
   source .venv/bin/activate
   pip install -r requirements.txt  # if not already installed
   python server.py
   # OR use: make agent-dev (from project root)
   ```

2. **Terminal 2 - Start Next.js frontend**:
   ```bash
   pnpm dev
   ```

3. **Browser Testing**:
   - Navigate to: http://localhost:3000/session/facilitator
   - Open browser DevTools Console (F12)
   - Expected console output:
     - "🔌 Attempting WebSocket connection to: ws://localhost:8000/ws"
     - "✅ WebSocket connected"
     - "📨 Received: WS_CONNECTED"
   - Check Network tab for WebSocket connection (101 Switching Protocols)

- **Testing Documentation Created**: `references/buildplan_parts/testing.md` with comprehensive guide
- **Current Status**: Stage 1 COMPLETE ✅
  - WebSocket connection verified working
  - Console shows all expected messages
  - Network tab shows "ws" connection with status 101
  - Ready to proceed to Stage 2: Hint Display

#### Stage 2: Hint Display
- **Frontend Updates**:
  - Added state management for hints in facilitator.tsx
  - WebSocket messages update hints array
  - UI dynamically displays hints with proper styling
  - Added test endpoint `/test-hint` for manual testing
- **Backend Status**:
  - WebSocket endpoint in FastAPI (`/ws`)
  - Frontend connects and logs connection status
  - Initial "WS_CONNECTED" message confirms connection

#### Testing Instructions for Stage 2

1. **Start both servers:**
   ```bash
   # Terminal 1 - FastAPI backend (from agent/ directory)
   cd agent
   source .venv/bin/activate
   uvicorn server:app --host 0.0.0.0 --port 8000 --reload
   
   # Terminal 2 - Next.js frontend (from project root)
   pnpm dev
   ```

2. **Open facilitator page:**
   - Navigate to http://localhost:3000/session/facilitator
   - Open browser DevTools console
   - Verify you see "✅ WebSocket connected" and "📨 Received: WS_CONNECTED"

3. **Test hint display:**
   ```bash
   # Terminal 3 - Send test hints
   
   # Send default test hint
   curl -X POST http://localhost:8000/test-hint
   
   # Send custom hint
   curl -X POST "http://localhost:8000/test-hint?hint=Remember%20to%20validate%20the%20part's%20feelings"
   
   # Send multiple hints to test list display
   curl -X POST "http://localhost:8000/test-hint?hint=First%20hint"
   curl -X POST "http://localhost:8000/test-hint?hint=Second%20hint"
   curl -X POST "http://localhost:8000/test-hint?hint=Third%20hint"
   ```

4. **Verify in UI:**
   - Hints should appear in the right panel (desktop) or bottom panel (mobile)
   - Each hint displays in a white card with shadow
   - Multiple hints stack vertically with spacing
   - Initial placeholder text disappears when first hint arrives

### Testing Instructions for Stage 4

1. **Test auto-reconnection:**
   ```bash
   # Start both servers as usual
   # Terminal 1: FastAPI backend
   cd agent
   source .venv/bin/activate
   uvicorn server:app --host 0.0.0.0 --port 8000 --reload
   
   # Terminal 2: Next.js frontend
   pnpm dev
   ```

2. **Open facilitator page and verify connection:**
   - Navigate to http://localhost:3000/session/facilitator
   - Look for green dot with "Connected" status in the hints panel
   - Check console for connection logs with emojis

3. **Test reconnection logic:**
   - Kill the FastAPI server (Ctrl+C in Terminal 1)
   - Watch the UI - status should change to red dot with "Disconnected"
   - Console will show reconnection attempts with exponential backoff
   - Restart the FastAPI server
   - Connection should automatically restore (green dot returns)

4. **Test hint persistence:**
   - Send some test hints before killing the server
   - Kill and restart the server
   - Old hints should remain visible
   - New hints can be added after reconnection
   - "Clear hints" button should work

5. **Monitor production logging:**
   - Backend logs now show:
     - Client connections with unique IDs
     - Hint broadcasts with recipient count
     - Disconnection events
     - Any errors with proper context

### Next Steps
- Step 4: Integrate AI Agent Backend with real STT/LLM processing
  - **Documentation consolidated**: Step 4 documentation has been merged from step-4a.md and step-4b.md into a single comprehensive guide: step-4-new.md
  - Includes Pipecat 0.3.x integration, Daily transport setup, Whisper STT, GPT-4 LLM, and WebSocket broadcasting
  - **Stage 1 Complete ✅**: Basic bot structure implemented and tested
    - Bot successfully joins Daily room as "ai-coach" participant
    - Daily transport connection working with correct environment variables
    - Bot.py created with minimal pipeline (transport input/output only)
    - Testing procedures documented in testing.md to avoid common errors
  - **Next: Stage 2** - Add Whisper STT for speech transcription and filtering
- Step 5: Deploy to production environment
  - **Step 6 Updated**: Deployment documentation now includes detailed Daily token generation instructions for production
  - Clear distinction between development (public room, no token) and production (private room, long-lived token) approaches
  - Includes cURL and Node.js examples for token generation
- Step 8 (Optional): Comprehensive WebSocket resilience testing - See `references/buildplan_parts/step-8-optional.md`

## Current Project Status

### Completed ✅
- Step 1: Basic project setup with Next.js, TypeScript, and Tailwind CSS
- Step 2: Video embedding for partner and facilitator pages
  - Partner page: Full-screen Daily video
  - Facilitator page: Split-screen layout with video and hints panel
  - Responsive design for mobile and desktop
- Step 3 - Stage 1: Basic WebSocket connection test
  - WebSocket server endpoint in FastAPI (`/ws`)
  - Frontend connects and logs connection status
  - Initial "WS_CONNECTED" message confirms connection
  - Step 3 - Stage 2: Hint Display
  - Added state management for hints in facilitator page
  - WebSocket messages update hints array
  - UI dynamically displays hints with proper styling
  - Added test endpoint `/test-hint` for manual testing
- Step 3 - Stage 3: Structured JSON Messaging
  - Backend sends JSON messages with type, text, timestamp, and ID
  - Frontend parses JSON and handles different message types
  - Hints display with timestamps and unique IDs
  - TypeScript interfaces for type safety
- Step 3 - Stage 4: Production Hardening
  - Custom `useWebSocketWithReconnect` hook with auto-reconnection
  - Connection status indicator in UI
  - Exponential backoff for reconnection attempts
  - Production logging and error handling
  - CORS support and client tracking

### In Progress 🚧
- Step 4: Integrate AI Agent Backend (next step)

### Documentation Created 📚
- Step 8 (Optional): Comprehensive WebSocket resilience testing guide
  - MOSCOW Priority: Should Have
  - Contains 10 detailed test scenarios for production readiness
  - Includes performance benchmarks and debugging tips

### Completed - Stage 4: Production Hardening ✅
- **Frontend Updates**:
  - Created `useWebSocketWithReconnect` custom hook with:
    - Automatic reconnection with exponential backoff (1s, 2s, 4s... up to 30s)
    - Connection status tracking (disconnected/connecting/connected)
    - Proper cleanup on component unmount
    - Hint state management integrated into the hook
    - Optional ping/pong support for connection health
  - Updated facilitator page with:
    - Connection status indicator with colored dot and text
    - Dynamic status messages based on connection state
    - "Clear hints" button for better UX
    - Improved error handling and logging
- **Backend Updates**:
  - Added structured logging with timestamps and log levels
  - Added CORS middleware for WebSocket support
  - Improved connection tracking with unique client IDs
  - Added ping/pong message handling (optional)
  - Better error handling and connection cleanup
  - Production-ready logging for all WebSocket events

### Completed - Stage 3: Structured JSON Messaging ✅
- **Backend Updates**:
  - Updated `broadcast_hint()` function to send JSON messages with type, text, timestamp, and ID
  - Changed initial connection message from plain text to JSON format
  - Added imports for json, time, and uuid modules
- **Frontend Updates**:
  - Added TypeScript interfaces for HintMessage and WebSocketMessage types
  - Updated state to use structured HintMessage objects instead of plain strings
  - Implemented JSON parsing in onmessage handler with switch statement for message types
  - Enhanced hint display to show timestamp for each hint
- **Ready for Testing**: Structured messaging fully implemented

### Testing Instructions for Stage 3

1. **Start both servers:**
   ```bash
   # Terminal 1 - FastAPI backend (from agent/ directory)
   cd agent
   source .venv/bin/activate
   uvicorn server:app --host 0.0.0.0 --port 8000 --reload
   
   # Terminal 2 - Next.js frontend (from project root)
   pnpm dev
   ```

2. **Open facilitator page:**
   - Navigate to http://localhost:3000/session/facilitator
   - Open browser DevTools console
   - Verify you see "✅ Connection confirmed" (not plain text anymore)
   - WebSocket now sends JSON: `{"type": "connection", "status": "connected"}`

3. **Test structured hint messages:**
   ```bash
   # Terminal 3 - Send test hints
   
   # Send default test hint
   curl -X POST http://localhost:8000/test-hint
   
   # Send custom hint
   curl -X POST "http://localhost:8000/test-hint?hint=Try%20focusing%20on%20the%20protective%20part's%20positive%20intention"
   
   # Send multiple hints to test list display
   curl -X POST "http://localhost:8000/test-hint?hint=Notice%20the%20part's%20body%20sensations"
   curl -X POST "http://localhost:8000/test-hint?hint=Ask%20what%20the%20part%20is%20afraid%20would%20happen"
   curl -X POST "http://localhost:8000/test-hint?hint=Validate%20the%20part's%20concerns"
   ```

4. **Verify structured messaging:**
   - Each hint now displays with a timestamp (e.g., "2:34:56 PM")
   - Hints have unique IDs (check React DevTools)
   - Console shows proper JSON parsing (no more plain text logs)
   - Error messages would be logged to console with "Server error:" prefix
   - Connection message shows as "✅ Connection confirmed"

### Next Steps
- Implement Stage 3: Convert to JSON message protocol for better structure
- Add timestamp and ID to hints
- Implement different message types (hint, transcript, error)
- Add Stage 4: Production features like auto-reconnection

# No Bad Parts - Development Scratchpad

## Current Status: Step 4 Complete ✅ - Full Pipeline with Context-Aware Hints!

### Summary of Progress:
- **Step 1**: Environment Setup ✅
- **Step 2**: Daily Room Setup ✅  
- **Step 3**: Frontend Pages & WebSocket ✅
- **Step 4**: Agent-Daily Integration ✅
  - Stage 1: Basic Bot Structure ✅
  - Stage 2: STT Pipeline (Daily Transcription) ✅
  - Stage 3: LLM Pipeline (GPT-4) ✅
  - Stage 4: WebSocket Integration ✅
  - **NEW**: Context-aware transcription with interim messages ✅

### What's Working:
✅ **Complete end-to-end pipeline:**
- Partner speaks in Daily room
- Captures BOTH interim and final transcripts for context
- Maintains last 10 transcript fragments for context window
- Deduplicates repeated text (common with interim→final)
- Waits for 1.5 seconds of silence before processing
- GPT-4 receives full context for better understanding
- Generates contextually relevant IFS coaching hints
- Hints broadcast via WebSocket to facilitator UI

✅ **Enhanced architecture:**
- Context window of 10 recent transcripts
- Captures interim transcripts for better flow understanding
- Deduplication prevents repeated phrases
- Improved system prompt acknowledges speech stream
- Bot handles partial phrases and natural speech patterns

### Key Implementation Details:

**Context-Aware Transcript Accumulator:**
```python
# Captures both interim and final transcripts
accumulator = TranscriptAccumulator(
    silence_threshold=1.5,  # Wait for pause
    context_window=10       # Include last 10 messages
)

# Handles both types of transcripts
if text.strip():
    if is_final:
        logger.info(f"📝 {user_name} said: {text}")
    else:
        logger.debug(f"📝 {user_name} saying: {text} (interim)")
    accumulator.add_transcript(text, is_final)

# Deduplication in get_combined_transcript()
if text.lower() != last_text.lower():
    combined_parts.append(text)
```

**Example Context Flow:**
```
Interim: "I'm feeling"
Interim: "I'm feeling very" 
Final: "I'm feeling very anxious"
Interim: "about tomorrow"
Final: "about tomorrow's meeting"

→ Combined: "I'm feeling very anxious about tomorrow's meeting"
→ GPT-4 gets full context, not just fragments
```

**Running the System:**
```bash
# Terminal 1 - Start BOTH server and bot together
cd agent
python server.py  # or ./start.sh

# Browser - Open facilitator UI
http://localhost:3000/protected
```

### Test Results:
- Captures complete thought streams ✅
- Includes natural speech progression ✅
- Avoids duplicate phrases ✅
- Generates hints based on full context ✅
- Much more coherent and relevant hints ✅

### Recent Improvements:
1. **Context Window**: Includes last 10 transcript messages
2. **Interim Transcripts**: Captures speech as it develops
3. **Deduplication**: Removes repeated phrases
4. **Enhanced Prompt**: Acknowledges speech stream nature
5. **Better Logging**: Shows word count and context

### Next Steps (Future Enhancements):
1. Add conversation history across multiple exchanges
2. Implement speaker diarization (partner vs others)
3. Add hint quality feedback mechanism
4. Context-aware hint throttling
5. Production deployment optimizations

### Environment Variables Required:
```
DAILY_ROOM_URL=https://nobadparts.daily.co/ifs-coaching-demo-2p9g7utkz9
DAILY_API_KEY=<your-api-key>
OPENAI_API_KEY=<your-api-key>
SYSTEM_PROMPT=<custom IFS prompt - optional>
OPENAI_MODEL=gpt-4o-mini
```

### Architecture Overview:
```
Partner Speech → Daily Transcription → Context Accumulator
       ↓              ↓                      ↓
   Interim        Interim               Final (1.5s pause)
   "I'm feeling"  "very anxious"        "about tomorrow"
                      ↓
              Combined Context (10 messages)
                      ↓
               GPT-4 (Full Understanding)
                      ↓
Facilitator UI ← WebSocket ← Structured IFS Hint
```

**Status: Production-Ready AI Coach with Full Context! 🎉**
The assistant now understands the complete flow of conversation, not just fragments.

### 2025-06-10 – Bugfix: Hints not broadcasting 🐛➡️✅

**Issue**: No hints were appearing in facilitator UI (neither automatic nor manual). Analysis showed `broadcast_hint_fn` was never invoked, likely due to the debounce logic never triggering and manual `/regenerate-hint` relying on that path.

**Fixes implemented**:
1. **agent/bot.py** – Added *instant* hint generation & broadcasting for every FINAL transcript that meets `MIN_WORDS_FOR_HINT`. This bypasses the silence-based accumulator if the partner is speaking continuously.
2. **agent/server.py** – Ensured `/regenerate-hint` endpoint explicitly calls `broadcast_hint()` after creating the hint, guaranteeing it reaches all connected facilitators even if the bot skipped it.
3. Added robust logging messages (`💡 Broadcasting (instant) hint:`) for easier verification.

**Next actions**:
- Restart backend (`python3.11 server.py`) and retest.
- Verify server logs show `Broadcasting (instant) hint` and `Broadcasting hint to 1 facilitator(s)`.
- Confirm hints now render in facilitator UI.

### Step 6: Containerize Agent with Docker ✅
- Verified existing `agent/Dockerfile` matches recommended best practices (Python 3.11-slim base, installs requirements, exposes port 8000, runs `uvicorn server:app`).
- Added `agent/.dockerignore` to exclude virtual-env folders, caches, git metadata, local env files, and editor configs ensuring a lean Docker image.
- Added `git` package install in Dockerfile to support git-based pip dependencies.
- Next up: initialize the Fly.io app with `flyctl launch`, set secrets, and deploy (`flyctl deploy`).

### Step 6: Fly.io Initialization 🚀
- Renamed `agent/fly.toml` app to `ifs-poc`.
- Ready to run `flyctl launch` / `flyctl deploy` with secrets.

- Deployed to Fly.io app `ifs-poc` (region ord). Build succeeded with git installed.
- Machines started (`flyctl status` shows two machines). Verify `/health` endpoint.

- Added `.vercelignore` to exclude backend files from Vercel build.

### Workspace Clean-up (2025-06-10)
- Added `references/` directory to `.gitignore` to prevent committing large documentation assets.

### 2025-06-10 — Docs Refresh & Cleanup Suggestions

- Replaced outdated *Waitlist-Kit* README with a fresh project overview detailing LiveKit, the Python Agent, and setup steps.
- Added up-to-date screenshots referencing `public/assets/facilitator.jpg` and `public/assets/partcipant.jpg`.
- Proposed repository cleanup tasks:
  1. **Remove committed virtual-envs** – delete `agent/venv/` and `agent/venv_new/`, ensure `**/venv*/` patterns are in `.gitignore`.
  2. **Deprecate Supabase artefacts** – `supabase/` and wait-list auth pages are likely legacy; archive or delete if not used by the current LiveKit flow.
  3. **Prune bulky assets** – audit `public/assets/` for images >500 KB and optimise or drop unused ones.
  4. **Thin out docs** – move archival build-plan fragments from `references/` into the energy-flow knowledge base or delete.

*(Awaiting team decision before running a sweeping removal PR.)*

### 2025-06-10 – Documentation Update
- README rewritten using build-plan summary & outcome
- Added facilitator and partner screenshots to showcase views

---
