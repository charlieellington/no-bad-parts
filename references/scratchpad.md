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
- Added `agent/.env.example` with placeholder variables
- Added top-level `Makefile` shortcut: `make agent-dev` (run inside activated venv)
- Smoke-tested: health & WebSocket OK

#### 📝 Environment Files Needed
- Create `.env` at repo root **(frontend – public vars only)**
  ```env
  NEXT_PUBLIC_DAILY_URL=https://nobadparts.daily.co/ifs-coaching-demo
  NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
  ```
- Create `agent/.env` **(backend – secrets)** with placeholder values (do NOT commit real keys):
  ```env
  OPENAI_API_KEY=<your-openai-key>
  DAILY_ROOM_URL=https://nobadparts.daily.co/ifs-coaching-demo
  DAILY_TOKEN=
  SYSTEM_PROMPT="You are a compassionate IFS coaching assistant. Respond with a brief <2-sentence coaching hint."
  ```
- Both files are git-ignored by default (`.gitignore`). Update keys locally only.

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

### Workspace Clean-up (2025-06-09)
- Added virtual-environment directories (`venv/`, `.venv/`, `agent/venv/`, `agent/.venv/`) to `.gitignore` to keep Git and the VS Code Git extension fast and tidy.