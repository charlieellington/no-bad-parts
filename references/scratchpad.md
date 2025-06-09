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

#### ✅ Agent Skeleton Completed
- Created `agent/` directory (fast-dev purpose only – contains virtualenv in `.venv/` **and** code)
- Added `agent/server.py` with FastAPI app exposing `GET /health` and `WS /ws` (sends `WS_CONNECTED` on connect)
- Added `agent/requirements.txt` with `fastapi`, `uvicorn[standard]`, `python-dotenv`
- Added `agent/env.example` (dotfiles blocked) as a stand-in for `.env.example` with placeholder variables
- Added top-level `Makefile` shortcut: `make agent-dev` → `uvicorn agent.server:app --reload --port 8000`
- Smoke-tested: `make agent-dev` serves `/health` (200 OK) & WebSocket echoes `WS_CONNECTED`
- Committed as "feat: scaffold FastAPI agent"

#### Next: Step 2 – Embed Daily Prebuilt Video UI
- Replace placeholders in partner/facilitator pages with actual Daily iframe URLs
- Connect facilitator sidebar to agent WebSocket URL

### Current Status (after Step 1)
- **Frontend**: Session skeleton finished
- **Backend**: FastAPI agent skeleton running locally on port 8000
- **Monorepo**: Ready for Daily integration & Pipecat pipeline in later steps

### Architecture Notes
- Using hybrid Next.js routing: App Router for main site, Pages Router for session pages
- Following build plan from references/buildplan_parts/step-1.md
- Preparing for Daily.co integration (Step 2) and Pipecat agent (Step 4)