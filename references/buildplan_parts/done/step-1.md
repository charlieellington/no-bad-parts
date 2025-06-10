Step 1: Prepare Project Repository & Environment
================================================

**Set up base code**
- Start from the existing `no-bad-parts` repository.  At the moment this repo contains ONLY the landing page + wait-list (no `/session` routes and no Python agent directory).

- **Add UI skeleton:**
  1. Create a `pages/session` directory (Pages Router) with two new files:
     - `partner.tsx` – simple Daily `<iframe>` placeholder (username=`partner`).
     - `facilitator.tsx` – Daily `<iframe>` + empty "Coach Hints" panel (username=`facilitator`).
  2. Both files should compile with zero props/state so the front-end still builds.
  3. Commit this as "feat: add basic session pages".
  
- **Add agent skeleton:**
  1. Create an `agent/` folder at repo root.
  2. Inside `agent/`, add:
     - `server.py` – FastAPI app exposing `GET /health` and `WS /ws` (echoes `WS_CONNECTED` for testing only).
     - `requirements.txt` – `fastapi`, `uvicorn[standard]`, `python-dotenv` (Pipecat added later).
     - `.env.example` – placeholder for env vars (`OPENAI_API_KEY`, `DAILY_ROOM_URL`, etc.).
  3. Add environment loading to `server.py`:
     ```python
     from dotenv import load_dotenv
     load_dotenv()  # Load .env file in agent directory
     ```
  4. Add a Makefile shortcut: `make agent-dev` → `uvicorn agent.server:app --reload --port 8000`.
  5. Commit this as "feat: scaffold FastAPI agent".
- Ensure both UI and agent live in the same monorepo so we can deploy UI to Vercel and agent to Fly.io later.


**Install required tooling on your workstation**
- Node 18+: `nvm install 18 && nvm use 18`
- pnpm: `npm i -g pnpm`
- Python 3.11+ (project builds & Docker images use python:3.11-slim)
- Docker Desktop: https://www.docker.com/products/docker-desktop/
- Fly CLI: `brew install flyctl` (or Windows installer)
- Vercel CLI: `npm i -g vercel`

**Verify tooling setup**
```bash
# Docker
docker --version
docker run --rm hello-world
# Node / pnpm
node --version
pnpm --version
# Fly
flyctl version
flyctl auth whoami
# Vercel (optional)
vercel --version
vercel whoami
```

**Install project dependencies**
```bash
# front-end
pnpm install
# agent
cd agent
python -m venv .venv && source .venv/bin/activate
pip install "pipecat-ai[daily,openai]==0.3.*" fastapi uvicorn python-dotenv
```

**Environment files**
- `.env` **(repo root – frontend public vars)**
```env
NEXT_PUBLIC_DAILY_URL=https://nobadparts.daily.co/ifs-coaching-demo-2p9g7utkz9
NEXT_PUBLIC_WS_URL=http://localhost:8000/ws
```

- `agent/.env` **(backend – secrets)**
```env
OPENAI_API_KEY=<your-openai-key>
DAILY_ROOM_URL=https://nobadparts.daily.co/ifs-coaching-demo-2p9g7utkz9
DAILY_TOKEN=
SYSTEM_PROMPT="You are a compassionate IFS coaching assistant. Respond with a brief <2-sentence coaching hint."
```

**Important:** The frontend does NOT need `OPENAI_API_KEY`. Keep sensitive keys only in the backend.

**Baseline smoke-test** (ports may auto-shift if 3000 is busy)
- `pnpm dev` ➜ visit the port printed by Next.js (typically http://localhost:3000)
- `cd agent && uvicorn server:app --host 0.0.0.0 --port 8000 --reload`
- WebSocket: `wscat -c ws://127.0.0.1:8000/ws` → expect `WS_CONNECTED`

**Step 1-B – Fly Smoke Deploy (optional)**
Minimal Dockerfile already sets `uvicorn server:app --host 0.0.0.0 --port 8000`.
Deploy in one command (non-interactive):
```bash
cd agent
flyctl launch --name nobadparts-agent-demo \
            --region ord \
            --dockerfile Dockerfile \
            --now --yes
```
After deploy:
```bash
flyctl secrets set SYSTEM_PROMPT="…"  # plus OPENAI_API_KEY, DAILY_* later
wscat -c wss://nobadparts-agent-demo.fly.dev/ws  # expect WS_CONNECTED
``` 