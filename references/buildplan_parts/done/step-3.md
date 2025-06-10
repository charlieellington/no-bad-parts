Step 3: Set Up Real-Time Hint WebSocket Channel (Agent ↔ UI)
===========================================================

With the video in place, the next step is to establish a WebSocket channel for streaming AI-generated hints from the **agent (backend)** to the **facilitator's browser (frontend UI)** in real time. This involves implementing a WebSocket server in the FastAPI-based Python agent and connecting to it from the Next.js client. Below is a full guide with best practices, drawn from documentation and experience, on how to implement and test this WebSocket communication channel.

## Implementing the WebSocket Server in the FastAPI Agent

First, set up a WebSocket endpoint on the FastAPI agent that will handle real-time hint streaming. FastAPI (built on Starlette) provides built-in support for WebSockets.

### Core WebSocket Implementation

**Define a WebSocket route:** Use `@app.websocket("/ws")` to designate a WebSocket endpoint. In the endpoint function, accept the connection by calling `await websocket.accept()`. Once accepted, the connection remains open for bi-directional communication until closed.

```python
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI()
active_connections = []  # Track active client connections

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    active_connections.append(ws)
    # Send an initial confirmation (for testing only - remove in production)
    # await ws.send_text("WS_CONNECTED")
    try:
        while True:
            # Wait for any incoming data (optional if not used)
            _ = await ws.receive_text()
            # (No incoming message expected from UI in this use-case)
    except WebSocketDisconnect:
        print("WebSocket disconnected")
    finally:
        # Remove the connection from active list on disconnect
        active_connections.remove(ws)
```

### Key Implementation Details

**Maintain active connections:** Keep track of connected WebSocket clients so the agent can send hints to them. A simple approach is to store connections in an in-memory list. The FastAPI docs illustrate this with a ConnectionManager class that adds the WebSocket to a list on connect and removes it on disconnect. Since the facilitator UI is the only client, we manage one connection, but using a list allows flexibility for multiple connections.

**Send an initial test message (optional):** Send a test message upon connection to verify the channel is working. As soon as the WebSocket is accepted, the server sends `"WS_CONNECTED"` to the client. This message is just for debugging and should be removed for production.

**Handle incoming messages (if needed):** In many cases, the facilitator's UI may not need to send data to the agent. To keep the connection alive, include a loop that awaits `websocket.receive_text()` without doing much with the data. FastAPI's WebSocket will wait indefinitely for incoming data; if the UI never sends anything, that await will block.

**Broadcast hints to clients:** When the AI agent generates a new hint, send it to the facilitator via the WebSocket:

```python
async def broadcast_hint(hint_text: str):
    """Send hint to all connected facilitators"""
    disconnected = []
    for ws in active_connections:
        try:
            await ws.send_json({"type": "hint", "text": hint_text})
        except:
            # Mark failed connections for removal
            disconnected.append(ws)
    
    # Clean up disconnected clients
    for ws in disconnected:
        active_connections.remove(ws)
```

**Handle disconnects cleanly:** WebSocket connections can drop or be closed by the client. FastAPI raises a `WebSocketDisconnect` exception when a client disconnects. Catch this exception and remove the WebSocket from `active_connections` to prevent errors from trying to write to stale connections.

## Connecting the Next.js Facilitator UI to the WebSocket

On the frontend side, the facilitator's Next.js application needs to create a WebSocket client that listens for incoming hints and displays them. We'll use the **WebSocket browser API** directly within a React component.

### Basic WebSocket Client Implementation

**Use an environment variable for the WebSocket URL:** Define the WebSocket server URL in a Next.js environment variable. By prefixing with `NEXT_PUBLIC_`, the value will be embedded into the frontend bundle:

```bash
# .env.local
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws  # Development
# Production: wss://your-domain.fly.dev/ws
```

**Open the WebSocket connection:** In your React component (the facilitator page), initiate the connection using a `useEffect` hook:

```tsx
// Inside the Facilitator component
useEffect(() => {
  const socket = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!);
  
  socket.onopen = () => {
    console.log("WebSocket connected");
  };
  
  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
  
  socket.onmessage = (event) => {
    const hintText = event.data;
    console.log("Received hint:", hintText);
    // TODO: update state to display the new hint in the UI
  };
  
  socket.onclose = () => {
    console.log("WebSocket closed");
    // TODO: optional: attempt to reconnect or notify user
  };
  
  return () => {
    socket.close();  // cleanup on component unmount
  };
}, []);
```

### Updating UI State

Instead of just logging to console, present the hints to the facilitator using React state:

```tsx
const [hints, setHints] = useState<string[]>([]);

// In the onmessage handler:
socket.onmessage = (event) => {
  const hintText = event.data;
  setHints(prev => [...prev, hintText]);
};

// In your JSX:
<div className="hints-panel">
  {hints.map((hint, index) => (
    <div key={index} className="hint-item">{hint}</div>
  ))}
</div>
```

### Important Considerations

**Use the correct WebSocket URL (ws vs wss):**
- Local development over HTTP: `ws://localhost:8000/ws`
- Production or HTTPS: `wss://example.com/ws` (WebSocket Secure)
- Browsers require `wss://` when the page is loaded via HTTPS

**Lifecycle and cleanup:** The cleanup function ensures that if the facilitator page unmounts, the WebSocket is closed and resources are freed. This prevents leaving WebSocket connections hanging.

## Testing the WebSocket Connection Locally

After implementing the server and client, test the WebSocket channel thoroughly:

### 1. Start Both Servers

```bash
# Terminal 1: FastAPI server
uvicorn agent:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Next.js dev server
npm run dev  # or pnpm dev
```

### 2. Open Facilitator Page
Navigate to `http://localhost:3000/session/facilitator` and open browser DevTools console.

### 3. Verify Connection
You should see:
- ✓ Console log: "WebSocket connected"
- ✓ Console log: "Received hint: WS_CONNECTED" (only if test message is enabled)
- ✓ FastAPI logs showing WebSocket endpoint hit
- ✓ Network tab shows 101 (Switching Protocols) status

### 4. Troubleshooting Common Issues

**Connection failures:**
- Double-check URL and protocol (ws:// vs wss://)
- Verify FastAPI is running on expected port
- Check for firewall blocking the port

**CORS issues (rare for WebSockets):**
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Use specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Mixed content errors:**
- HTTPS pages block ws:// connections
- Use wss:// when serving over HTTPS

## Additional Improvements and Best Practices

### Use Structured JSON Messages

Instead of plain text, send JSON payloads for extensibility:

**Server-side:**
```python
# Send structured hint
await ws.send_json({
    "type": "hint",
    "text": "Try focusing on the character's motivation.",
    "timestamp": time.time(),
    "id": str(uuid.uuid4())
})

# Send transcript
await ws.send_json({
    "type": "transcript",
    "text": "Partner: I think I understand this part.",
    "speaker": "partner",
    "timestamp": time.time()
})
```

**Client-side:**
```tsx
socket.onmessage = (event) => {
  try {
    const message = JSON.parse(event.data);
    
    switch (message.type) {
      case "hint":
        setHints(prev => [...prev, {
          id: message.id,
          text: message.text,
          timestamp: message.timestamp
        }]);
        break;
      case "transcript":
        setTranscripts(prev => [...prev, message]);
        break;
      case "error":
        console.error("Server error:", message.text);
        break;
      default:
        console.warn("Unknown message type:", message.type);
    }
  } catch (error) {
    console.error("Failed to parse message:", error);
  }
};
```

### Implement Auto-Reconnect Logic

Real-world networks are unreliable. Implement auto-reconnect with exponential backoff:

```tsx
const useWebSocketWithReconnect = (url: string) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttempts = useRef(0);
  const shouldReconnect = useRef(true);
  const maxReconnectDelay = 30000; // 30 seconds

  const connect = useCallback(() => {
    const ws = new WebSocket(url);
    
    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      reconnectAttempts.current = 0;  // Reset on successful connection
    };
    
    ws.onmessage = (event) => {
      // Handle messages as before
      const message = JSON.parse(event.data);
      // Process based on message.type...
    };
    
    ws.onclose = () => {
      console.log("WebSocket closed");
      setIsConnected(false);
      
      // Attempt reconnection if not intentionally closed
      if (shouldReconnect.current) {
        const delay = Math.min(
          1000 * Math.pow(2, reconnectAttempts.current),
          maxReconnectDelay
        );
        reconnectAttempts.current++;
        console.log(`Reconnecting in ${delay}ms...`);
        setTimeout(connect, delay);
      }
    };
    
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    
    setSocket(ws);
  }, [url]);

  useEffect(() => {
    shouldReconnect.current = true;
    connect();
    
    return () => {
      shouldReconnect.current = false;
      socket?.close();
    };
  }, [connect]);

  return { socket, isConnected };
};
```

### Single Facilitator Connection

In this setup, we assume only one facilitator will be connected at any given time. This simplifies the design significantly. However, the broadcasting approach (looping through `active_connections`) naturally handles one or many connections, making the code flexible for future expansion.

### Production Considerations

**Security (for production):**
```python
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket, token: str = Query(None)):
    # Verify token before accepting connection
    if not verify_jwt_token(token):
        await ws.close(code=1008, reason="Unauthorized")
        return
    
    await ws.accept()
    # ... rest of implementation
```

**Connection monitoring:**
- Log connection/disconnection events
- Track connection duration
- Monitor message frequency

## Summary

You now have a robust real-time WebSocket channel between the AI agent and facilitator UI:

✅ **FastAPI WebSocket server** with connection management and broadcasting
✅ **Next.js client** with proper lifecycle management
✅ **Structured JSON messaging** for extensibility
✅ **Auto-reconnect logic** for network resilience
✅ **Comprehensive testing procedures**

The WebSocket channel is ready to stream AI-generated hints. When the agent generates a hint (in later steps), it will call the broadcast function to send the hint to all connected facilitators, who will see it appear in real-time in their UI.

## Staged Implementation Approach

To make the WebSocket implementation more manageable and testable, consider breaking it into these four stages:

### Stage 1: Basic Connection Test ⚡
*Goal: Verify WebSocket connection works between frontend and backend*

**Backend Prerequisites:**
- Ensure basic WebSocket endpoint exists in `agent/server.py` (as shown above)
- Keep the test "WS_CONNECTED" message enabled temporarily

**Frontend Implementation:**
1. Add WebSocket URL to `.env.local`:
   ```bash
   NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
   ```

2. Add minimal WebSocket client to `pages/session/facilitator.tsx`:
   ```tsx
   import { useEffect } from 'react';
   
   // Inside the Facilitator component
   useEffect(() => {
     const socket = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!);
     
     socket.onopen = () => console.log("✅ WebSocket connected");
     socket.onmessage = (event) => console.log("📨 Received:", event.data);
     socket.onerror = (error) => console.error("❌ WebSocket error:", error);
     socket.onclose = () => console.log("🔌 WebSocket closed");
     
     return () => socket.close();
   }, []);
   ```

**Testing:**
- Start both servers (FastAPI on port 8000, Next.js on port 3000)
- Open `http://localhost:3000/session/facilitator`
- Check browser console for "WS_CONNECTED" message
- Verify Network tab shows 101 (Switching Protocols) status

### Stage 2: Hint Display 💬
*Goal: Display hints in the UI instead of just console*

**Frontend Updates:**
1. Add state management:
   ```tsx
   import { useState, useEffect } from 'react';
   
   const [hints, setHints] = useState<string[]>([]);
   ```

2. Update onmessage handler:
   ```tsx
   socket.onmessage = (event) => {
     console.log("📨 Received:", event.data);
     setHints(prev => [...prev, event.data]);
   };
   ```

3. Replace placeholder hint panel content:
   ```tsx
   {hints.length === 0 ? (
     <div className="text-center text-gray-400 mt-8">
       <p>AI coaching hints will appear here</p>
       <p className="text-sm mt-2">WebSocket connected and waiting for hints...</p>
     </div>
   ) : (
     <div className="space-y-2">
       {hints.map((hint, index) => (
         <div key={index} className="p-3 bg-white rounded shadow">
           {hint}
         </div>
       ))}
     </div>
   )}
   ```

**Testing:**
- Manually send test hints from backend (can use a temporary test endpoint)
- Verify hints appear in the UI panel

### Stage 3: Structured Messaging 📦
*Goal: Implement JSON message protocol for future extensibility*

**Backend Updates:**
1. Add the `broadcast_hint()` function to `agent/server.py`:
   ```python
   import json
   import time
   import uuid
   
   async def broadcast_hint(hint_text: str):
       """Send hint to all connected facilitators"""
       disconnected = []
       for ws in active_connections:
           try:
               await ws.send_json({
                   "type": "hint",
                   "text": hint_text,
                   "timestamp": time.time(),
                   "id": str(uuid.uuid4())
               })
           except:
               disconnected.append(ws)
       
       for ws in disconnected:
           active_connections.remove(ws)
   ```

2. Update initial connection message to use JSON:
   ```python
   # Replace: await ws.send_text("WS_CONNECTED")
   await ws.send_json({"type": "connection", "status": "connected"})
   ```

**Frontend Updates:**
1. Define message types:
   ```tsx
   interface HintMessage {
     id: string;
     text: string;
     timestamp: number;
   }
   
   interface WebSocketMessage {
     type: 'hint' | 'connection' | 'error';
     // other fields depend on type
   }
   ```

2. Update state and message handler:
   ```tsx
   const [hints, setHints] = useState<HintMessage[]>([]);
   
   socket.onmessage = (event) => {
     try {
       const message = JSON.parse(event.data) as WebSocketMessage;
       
       switch (message.type) {
         case 'hint':
           const hintMsg = message as any; // Type assertion for brevity
           setHints(prev => [...prev, {
             id: hintMsg.id,
             text: hintMsg.text,
             timestamp: hintMsg.timestamp
           }]);
           break;
         case 'connection':
           console.log("✅ Connection confirmed");
           break;
         case 'error':
           console.error("Server error:", (message as any).text);
           break;
       }
     } catch (error) {
       console.error("Failed to parse message:", error);
     }
   };
   ```

**Testing:**
- Create a temporary test endpoint that calls `broadcast_hint()`
- Verify structured messages are properly parsed and displayed

### Stage 4: Production Hardening 🛡️
*Goal: Add reconnection logic and polish for production*

**Frontend Enhancements:**
1. Implement the `useWebSocketWithReconnect` hook (as shown in the guide above)
2. Add connection status indicator:
   ```tsx
   const { socket, isConnected } = useWebSocketWithReconnect(
     process.env.NEXT_PUBLIC_WS_URL!
   );
   
   // In JSX:
   <div className="flex items-center justify-between mb-3">
     <h2 className="text-lg font-semibold">Coach Hints</h2>
     <div className={`w-2 h-2 rounded-full ${
       isConnected ? 'bg-green-500' : 'bg-red-500'
     }`} />
   </div>
   ```

3. Handle edge cases:
   - Show reconnecting status
   - Clear old hints on reconnect (optional)
   - Add error boundaries

**Backend Cleanup:**
- Remove the test connection message
- Add proper logging
- Consider implementing heartbeat/ping-pong for connection health

**Testing:**
- Kill the backend while connected, verify auto-reconnect
- Test with network interruptions
- Verify no memory leaks on repeated connections

### Implementation Checklist

**Stage 1 (15 minutes):**
- [ ] Add `NEXT_PUBLIC_WS_URL` to `.env.local`
- [ ] Add basic WebSocket connection in facilitator page
- [ ] Verify connection in browser console
- [ ] Confirm FastAPI logs show connection

**Stage 2 (20 minutes):**
- [ ] Add hints state management
- [ ] Update UI to display hints
- [ ] Test with manual hint sending
- [ ] Style hint display components

**Stage 3 (30 minutes):**
- [ ] Implement `broadcast_hint()` function
- [ ] Convert to JSON messaging
- [ ] Update frontend message parsing
- [ ] Add TypeScript interfaces
- [ ] Test structured message flow

**Stage 4 (45 minutes):**
- [ ] Implement reconnection hook
- [ ] Add connection status UI
- [ ] Remove test messages
- [ ] Add production error handling
- [ ] Thoroughly test reliability

This staged approach allows you to verify each piece works before moving to the next, making debugging easier and ensuring a solid foundation for the real-time hint system.

## References

1. **FastAPI Documentation** - *WebSockets*: https://fastapi.tiangolo.com/advanced/websockets/
2. **FastAPI Documentation** - *CORS (Cross-Origin Resource Sharing)*: https://fastapi.tiangolo.com/tutorial/cors/
3. **MDN Web Docs** - *Writing WebSocket client applications*: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications
4. **Next.js Documentation** - *Environment Variables*: https://nextjs.org/docs/basic-features/environment-variables
5. **Software Engineering Stack Exchange** - *WebSocket reconnection best practices* (exponential backoff strategies) 