from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import os
import uvicorn
import asyncio
from datetime import datetime
import json
import time
import uuid
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables from .env file in this directory
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

# Track active WebSocket clients (facilitators) - moved before lifespan
active_connections: list[WebSocket] = []

# Optional admin token for privileged actions such as restarting the bot. When set,
# clients must supply this token as a query parameter (?token=XYZ) when calling
# the admin endpoints.
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "")


# Broadcast function defined before lifespan
async def broadcast_hint(hint_text: str):
    """Send hint to all connected facilitators"""
    disconnected = []
    message = {
        "type": "hint",
        "text": hint_text,
        "timestamp": time.time(),
        "id": str(uuid.uuid4())
    }
    
    logger.info(f"Broadcasting hint to {len(active_connections)} facilitator(s): {hint_text[:50]}...")
    
    for ws in active_connections:
        try:
            await ws.send_json(message)
        except Exception as e:
            logger.warning(f"Failed to send hint to connection: {e}")
            # Mark failed connections for removal
            disconnected.append(ws)
    
    # Clean up disconnected clients
    for ws in disconnected:
        active_connections.remove(ws)
        logger.info(f"Removed disconnected client. Active connections: {len(active_connections)}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage startup and shutdown events"""
    # Startup
    logger.info("Starting AI coach bot as background task...")
    
    # Import bot module. When running from project root (monorepo), the module is
    # available as `agent.bot`. Inside the Docker image (which copies *contents*
    # of the agent/ dir to /app), it is just `bot`.
    try:
        from agent.bot import run_bot  # type: ignore
    except ModuleNotFoundError:
        from bot import run_bot  # type: ignore
    
    # Create background task for the bot with broadcast function
    asyncio.create_task(run_bot(broadcast_hint))
    logger.info("AI coach bot task created")
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")


app = FastAPI(title="No Bad Parts Agent", version="0.1.0", lifespan=lifespan)

# Add CORS middleware for WebSocket support
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://localhost:3000"],  # Add production URLs later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Simple health-check endpoint used for liveness probes."""
    return {"status": "ok"}


@app.get("/debug/env")
async def debug_env():
    """Debug endpoint to verify environment variables are loaded.
    
    Only use in development - remove or protect in production!
    """
    env_status = {
        "OPENAI_API_KEY": "✓ Loaded" if os.getenv("OPENAI_API_KEY") else "✗ Missing",
        "DAILY_API_KEY": "✓ Loaded" if os.getenv("DAILY_API_KEY") else "✗ Missing",
        "DAILY_ROOM_URL": os.getenv("DAILY_ROOM_URL") or "✗ Missing",
        "DAILY_TOKEN": "✓ Set" if os.getenv("DAILY_TOKEN") else "✓ Empty (OK for dev)",
        "SYSTEM_PROMPT": f"✓ Loaded ({len(os.getenv('SYSTEM_PROMPT', ''))} chars)" if os.getenv("SYSTEM_PROMPT") else "✗ Missing"
    }
    
    # Log the check
    logger.info("Environment check performed")
    
    return {
        "status": "Environment variables check",
        "variables": env_status,
        "note": "Remove this endpoint before production deployment"
    }


@app.post("/test-hint")
async def send_test_hint(hint: str = None):
    """Test endpoint to manually send hints to connected facilitators.
    
    Usage: curl -X POST "http://localhost:8000/test-hint?hint=Your%20test%20hint%20here"
    """
    if hint is None:
        # Generate a default test hint with timestamp
        hint = f"Test hint sent at {datetime.now().strftime('%H:%M:%S')}: Try focusing on the protective part's positive intention."
    
    await broadcast_hint(hint)
    return {"message": f"Sent hint to {len(active_connections)} connected facilitator(s)", "hint": hint}


@app.post("/regenerate-hint")
async def regenerate_hint_api():
    """Manually trigger a new hint based on full conversation history."""
    from bot import regenerate_hint
    hint = await regenerate_hint()
    # Fallback: ensure the freshly generated hint is broadcast even if the bot
    # (for some reason) did not send it. This call is idempotent for connected
    # clients since hints carry unique IDs, so double-sending is harmless.
    await broadcast_hint(hint)
    return {"status": "ok", "hint": hint}


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    """WebSocket endpoint for real-time hint streaming.
    
    Accepts connections from facilitator UI and maintains them for
    broadcasting AI-generated hints. Connections are automatically
    cleaned up on disconnect.
    """
    client_id = str(uuid.uuid4())[:8]  # Short ID for logging
    logger.info(f"WebSocket connection attempt from client {client_id}")
    
    await ws.accept()
    active_connections.append(ws)
    logger.info(f"Client {client_id} connected. Total connections: {len(active_connections)}")
    
    # Removed test connection message for production readiness
    
    try:
        while True:
            # Keep the connection alive by awaiting messages
            # We could handle ping/pong here if needed
            data = await ws.receive_text()
            
            # Optional: Handle ping messages for connection health
            try:
                message = json.loads(data)
                if message.get("type") == "ping":
                    await ws.send_json({"type": "pong", "timestamp": time.time()})
                    logger.debug(f"Ping/pong from client {client_id}")
            except json.JSONDecodeError:
                logger.warning(f"Received non-JSON message from client {client_id}: {data}")
                
    except WebSocketDisconnect:
        logger.info(f"Client {client_id} disconnected normally")
    except Exception as e:
        logger.error(f"Client {client_id} error: {e}")
    finally:
        # Clean up after disconnect
        if ws in active_connections:
            active_connections.remove(ws)
            logger.info(f"Client {client_id} removed. Active connections: {len(active_connections)}")


# ---------------------------------------------------------------------------
# Admin – restart the agent (causes Fly.io to recycle the VM automatically)
# ---------------------------------------------------------------------------

# IMPORTANT: This endpoint intentionally exits the process after returning a 202
# response. Fly.io (and most process managers) will automatically restart the
# container. Protect with ADMIN_TOKEN in production.


@app.post("/admin/restart", status_code=202)
async def admin_restart(token: str | None = Query(default=None)):
    """Gracefully exit the process so Fly.io restarts the VM.

    Usage (no token set):
        curl -X POST https://<app>.fly.dev/admin/restart

    Usage (with ADMIN_TOKEN):
        curl -X POST "https://<app>.fly.dev/admin/restart?token=SECRET"
    """

    if ADMIN_TOKEN and token != ADMIN_TOKEN:
        logger.warning("Unauthorized restart attempt")
        raise HTTPException(status_code=403, detail="Forbidden")

    logger.warning("⚠️  Restart requested via /admin/restart – exiting process…")

    # Delay the exit just long enough for the HTTP response to be sent
    loop = asyncio.get_event_loop()
    loop.call_later(0.1, lambda: os._exit(0))

    return {"detail": "Restarting agent"}


if __name__ == "__main__":
    # Allow `python server.py` for quick local testing
    # Note: reload=False to avoid import issues with bot module
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=False) 