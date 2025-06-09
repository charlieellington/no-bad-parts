from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from dotenv import load_dotenv
import os
import uvicorn

# Load environment variables from .env file in this directory
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

app = FastAPI(title="No Bad Parts Agent", version="0.1.0")


@app.get("/health")
async def health_check():
    """Simple health-check endpoint used for liveness probes."""
    return {"status": "ok"}


# Track active WebSocket clients (facilitators)
active_connections: list[WebSocket] = []


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    """Echo-style WebSocket endpoint for local smoke tests.

    On connect the server immediately sends a `WS_CONNECTED` text message so
    that the front-end can verify the connection works. Incoming messages are
    discarded – this agent currently only pushes data outward.
    """
    await ws.accept()
    active_connections.append(ws)

    # Send a quick confirmation message for dev purposes only
    await ws.send_text("WS_CONNECTED")

    try:
        while True:
            # Keep the connection alive by awaiting messages
            # We intentionally ignore any data sent from the client
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        # Clean up after disconnect
        if ws in active_connections:
            active_connections.remove(ws)


if __name__ == "__main__":
    # Allow `python server.py` for quick local testing – rarely used in prod.
    uvicorn.run("agent.server:app", host="0.0.0.0", port=8000, reload=True) 