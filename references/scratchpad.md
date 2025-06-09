---
title: Scratchpad
---

# Scratchpad

## Project Progress - No Bad Parts Collective

### Step 1: Prepare Project Repository & Environment

#### ✅ UI Skeleton Completed
- Created `pages/session/` directory (Pages Router)
- Added `partner.tsx` - Simple Daily iframe placeholder with username=`partner`
- Added `facilitator.tsx` - Daily iframe placeholder + empty "Coach Hints" panel with username=`facilitator`
- Both files compile with zero props/state, front-end builds successfully
- Ready for commit: "feat: add basic session pages"

#### Next: Agent Skeleton
- Create `agent/` folder at repo root
- Add `server.py` with FastAPI app exposing `GET /health` and `WS /ws`
- Add `requirements.txt` with fastapi, uvicorn[standard], python-dotenv
- Add `.env.example` with placeholder env vars
- Add Makefile shortcut for `make agent-dev`

### Current Status
- **Frontend**: Session page skeletons ready for Daily integration
- **Backend**: Not yet started
- **Environment**: Pages Router structure established alongside existing App Router

### Architecture Notes
- Using hybrid Next.js routing: App Router for main site, Pages Router for session pages
- Following build plan from references/buildplan_parts/step-1.md
- Preparing for Daily.co integration (Step 2) and Pipecat agent (Step 4)