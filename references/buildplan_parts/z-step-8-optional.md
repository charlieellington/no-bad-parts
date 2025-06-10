Step 8: Optional Testing Scenarios (Should Have)
================================================

This document outlines additional testing scenarios that are recommended but not required for the MVP. These tests verify the robustness and resilience of the WebSocket implementation beyond basic functionality.

**Priority Level**: Should Have (MOSCOW Method)
**Prerequisites**: Complete Step 3 (WebSocket Implementation) with all 4 stages

> **VERY IMPORTANT P0 (add first!)**
>
> **Username → Participant Mapping Check**  
> The bot must reliably obtain the expected `userName` ("partner" / "facilitator") from Daily so that future filters work. Until this is fixed, the pipeline should **transcribe everyone**.  
> - Verify iframe URLs use `?userName=` (camel-case).  
> - Confirm that `participant.info.userName` arrives with the expected value.  
> - Add automated assertion in Stage-2 test to fail if username is still "unknown".  
> - Fallback: log all speakers if username isn't supplied (current POC behaviour).

## Step 4 Optional Enhancements 🤖

These items from Step 4 are functional but can be enhanced for production:

### A. Participant Disconnect Handling 🚪
**Purpose**: Gracefully handle when partner leaves the call

**Current State**: 
```python
# Currently commented out for easier testing
# if user_name == "partner" and task:
#     logger.info("Partner left – stopping bot.")
#     await task.cancel()
```

**Production Enhancement**:
- Uncomment the code to stop bot when partner leaves
- Send notification to facilitator via WebSocket
- Optionally save session transcript
- Clean up resources properly

### B. Private Room Authentication 🔐
**Purpose**: Use secure Daily rooms with proper authentication

**Current State**: Using public rooms with auto-generated tokens

**Production Enhancement**:
- Switch Daily room to `privacy: "private"`
- Generate long-lived tokens server-side via Daily REST API
- Include proper `exp` claim (expiration)
- Lock tokens to specific `room_name`
- Store tokens securely (environment variables or secrets manager)

### C. Session Management & Rejoining 🔄
**Purpose**: Handle multiple sessions and reconnections gracefully

**Current State**: One session per bot run

**Production Enhancement**:
- Detect new participants joining after session end
- Spawn new pipeline for new sessions
- Maintain session state and history
- Support facilitator switching between multiple partners
- Clean up old sessions properly

### D. Hint Generation Rate Limiting ⏱️
**Purpose**: Prevent overwhelming facilitator with too many hints

**Enhancement Ideas**:
- Throttle hints to max 1 per 10-15 seconds
- Batch related transcripts before generating hints
- Add "hint queue" with priority system
- Allow facilitator to pause/resume hints

### E. Conversation Memory & Context 🧠
**Purpose**: Maintain context across multiple exchanges

**Enhancement Ideas**:
- Store conversation history in session
- Pass last N exchanges to GPT-4 for context
- Track themes and parts mentioned
- Generate summary at session end
- Allow facilitator to mark "key moments"

### F. Enhanced Memory Management 💾
**Purpose**: Prevent memory leaks in long-running sessions

**Monitoring Points**:
- Track WebSocket connection count
- Monitor transcript buffer size
- Check for orphaned event listeners
- Implement connection limits
- Add memory usage alerts

## WebSocket Resilience Testing

### 1. Exponential Backoff Verification ⏱️
**Purpose**: Verify that reconnection attempts use exponential backoff to avoid overwhelming the server

**Test Steps**:
1. Start both servers (FastAPI and Next.js)
2. Open facilitator page and verify connection
3. Kill the backend server and keep it offline for ~60 seconds
4. Monitor browser console for reconnection attempts

**Expected Results**:
```
⏱️ Reconnecting in 1000ms... (attempt 1)
⏱️ Reconnecting in 2000ms... (attempt 2)  
⏱️ Reconnecting in 4000ms... (attempt 3)
⏱️ Reconnecting in 8000ms... (attempt 4)
⏱️ Reconnecting in 16000ms... (attempt 5)
⏱️ Reconnecting in 30000ms... (attempt 6+) - capped at max delay
```

**Success Criteria**: Delays double each time up to 30 seconds maximum

### 2. Server Flapping Test 🔄
**Purpose**: Ensure the client handles rapid server restarts gracefully

**Test Steps**:
1. Start with a stable connection
2. Rapidly cycle the backend:
   - Kill backend → wait 2 seconds
   - Start backend → wait 5 seconds  
   - Kill backend → wait 2 seconds
   - Start backend → let it stabilize
3. Repeat this pattern 3-4 times

**Expected Results**:
- UI remains responsive throughout
- Status indicator accurately reflects state changes
- No JavaScript errors in console
- Connection eventually stabilizes

### 3. Network Interruption Simulation 🌐
**Purpose**: Test recovery from actual network connectivity issues

**Test Steps**:

**Option A - WiFi Toggle (macOS/Windows)**:
1. Establish successful WebSocket connection
2. Disable WiFi/Ethernet adapter
3. Wait 10-15 seconds
4. Re-enable network adapter

**Option B - Browser Offline Mode**:
1. Open DevTools → Network tab
2. Check "Offline" checkbox
3. Wait 10 seconds
4. Uncheck "Offline"

**Expected Results**:
- Connection status changes to "Disconnected"
- Reconnection attempts begin
- Auto-reconnects when network returns

### 4. Browser Tab Background Behavior 📱
**Purpose**: Verify connection persists when tab is not active

**Test Steps**:
1. Establish connection and send a test hint
2. Switch to a different browser tab
3. Wait 2-3 minutes
4. Return to facilitator tab
5. Send another test hint

**Expected Results**:
- Connection should remain active
- New hints appear immediately
- No reconnection needed

**Note**: Some browsers throttle background tabs, which is acceptable

### 5. Memory Leak Detection 💾
**Purpose**: Ensure repeated reconnections don't cause memory leaks

**Test Steps**:
1. Open Chrome DevTools → Memory tab
2. Click "Take heap snapshot" 
3. Note the heap size (e.g., 15.2 MB)
4. Kill and restart backend 10+ times over 5 minutes
5. Take another heap snapshot
6. Compare heap sizes

**Expected Results**:
- Memory usage remains relatively stable (±20%)
- No significant growth trend
- Old WebSocket objects are garbage collected

**How to Analyze**:
- Click "Comparison" view between snapshots
- Look for retained WebSocket objects
- Check for growing arrays or event listeners

### 6. Component Lifecycle Test 🔄
**Purpose**: Verify proper cleanup on component unmount

**Test Steps**:
1. Open facilitator page with console open
2. Verify "✅ WebSocket connected" message
3. Navigate to home page or another route
4. Check console for cleanup message
5. Navigate back to facilitator page

**Expected Results**:
- See "🧹 Cleaning up WebSocket connection" when leaving
- Fresh connection established on return
- No duplicate connections
- No console errors

### 7. Extended Downtime Recovery ⏰
**Purpose**: Test recovery after extended server unavailability

**Test Steps**:
1. Establish initial connection
2. Kill backend server
3. Wait 3+ minutes (6+ reconnection cycles)
4. Start backend server
5. Monitor for automatic reconnection

**Expected Results**:
- Client continues attempting reconnection at 30s intervals
- Reconnects within 30 seconds of server availability
- All functionality resumes normally

### 8. Concurrent Connection Test 👥
**Purpose**: Verify multiple facilitator tabs work correctly

**Test Steps**:
1. Open facilitator page in Tab 1
2. Open facilitator page in Tab 2 (incognito/private window)
3. Send test hints from backend
4. Kill backend and restart

**Expected Results**:
- Both tabs receive hints
- Both tabs show disconnection
- Both tabs reconnect successfully
- Backend logs show 2 active connections

### 9. Message Queue Resilience 📬
**Purpose**: Test behavior when hints are sent during reconnection

**Test Steps**:
1. Kill backend server
2. Wait for "Disconnected" status
3. Start backend
4. Immediately send multiple test hints while reconnecting

**Expected Results**:
- No hints lost once connection re-establishes
- Hints appear in correct order
- No duplicate hints

### 10. Browser Compatibility Matrix 🌏
**Purpose**: Verify cross-browser WebSocket behavior

Test on multiple browsers:
- [ ] Chrome/Edge (Chromium-based)
- [ ] Firefox
- [ ] Safari (macOS)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

**Key Points to Verify**:
- Connection establishment
- Auto-reconnection
- Status indicators
- Console logging

## Performance Benchmarks

### Connection Metrics to Track
- Initial connection time: < 100ms locally
- Reconnection time: < 100ms + backoff delay
- Message latency: < 50ms locally
- Memory per connection: < 1MB

### Load Testing (Optional)
For production readiness:
1. Use tools like `websocat` or `wscat` to create multiple connections
2. Send hints at various rates (1/sec, 10/sec, 100/sec)
3. Monitor server CPU and memory usage
4. Verify no message loss or delays

## Debugging Tips

### Useful Browser DevTools Features
1. **Network Tab**: Filter by "WS" to see WebSocket frames
2. **Console**: Filter by log level to focus on errors
3. **Performance Tab**: Record during reconnection cycles
4. **Memory Tab**: Use allocation profiler during tests

### Common Issues and Solutions
- **Connection immediately closes**: Check CORS settings
- **No reconnection attempts**: Verify `shouldReconnect` flag
- **Memory growth**: Look for event listener leaks
- **Delayed reconnection**: Check browser throttling

## Test Automation Considerations

While manual testing is sufficient for MVP, consider:
- Playwright/Cypress E2E tests for connection scenarios
- Jest tests for the `useWebSocketWithReconnect` hook
- Backend integration tests for WebSocket endpoints

## Summary

These optional tests provide confidence in the WebSocket implementation's reliability. Priority order for "Should Have" testing:

1. **Exponential Backoff** - Most important for production
2. **Memory Leak Detection** - Critical for long-running sessions  
3. **Extended Downtime Recovery** - Common real-world scenario
4. **Network Interruption** - Validates error handling
5. **Browser Compatibility** - Important for broad user support

Complete at minimum tests 1-3 before production deployment.

### 11. Clear Hints on Reconnect (UI) 🧹
**Purpose**: Optionally reset the hints panel when a new session begins or after reconnection**

**Implementation Idea**:
- Listen for `connectionStatus` transition from `disconnected` → `connected`
- Automatically call `clearHints()` hook function on first reconnect
- Provide toggle in settings to enable/disable this behavior

**Testing**:
1. Fill hints panel with test hints
2. Kill backend for >30s
3. Observe panel clears after successful reconnect (if feature enabled)

### 12. Error Boundaries for WebSocket UI 💣
**Purpose**: Prevent a fatal rendering error from crashing the entire page

**Implementation Idea**:
- Wrap `Facilitator` hints panel in a React Error Boundary
- Display fallback UI with error message and "Reload" button
- Log errors to monitoring service (e.g., Sentry)

**Testing**:
1. Temporarily throw an error inside `HintDisplay`
2. Verify fallback UI appears and overall page remains functional

Complete at minimum tests 1-3 before production deployment. 

## Pipecat Bot Optional Enhancements 🤖

This section covers optional enhancements for the Pipecat transcription bot from Step 4. The bot functions without these, but they improve production readiness and monitoring capabilities.

### 13. Pipeline Observer for Detailed Logging 📊
**Purpose**: Add frame-level observability for debugging and metrics

**Implementation**:
```python
# Add observer to pipeline task for frame monitoring
@pipeline_task.add_observer
async def frame_observer(frame):
    if isinstance(frame, TranscriptionFrame):
        logger.debug(f"📊 Transcription latency: {frame.timestamp - frame.audio_timestamp}ms")
    elif isinstance(frame, VADFrame):
        logger.debug(f"🎤 VAD event: {frame.event_type}")
```

**Benefits**:
- Track transcription latency
- Monitor VAD performance
- Debug frame flow issues
- Collect usage metrics

### 14. VAD Parameter Fine-Tuning 🎛️
**Purpose**: Optimize voice detection for your specific use case

**Tunable Parameters**:
```python
VADParams(
    confidence=0.7,    # Increase if getting false positives (0.0-1.0)
    start_secs=0.2,    # Decrease if cutting off speech starts
    stop_secs=0.8      # Increase if cutting off during pauses
)
```

**Testing Approach**:
1. Record sample conversations with different speakers
2. Test with various accents and speaking speeds
3. Adjust parameters based on results
4. Document optimal settings per environment

### 15. Local Whisper STT Option 🏠
**Purpose**: Reduce latency and API costs by running Whisper locally

**Implementation**:
```python
# Replace OpenAI STT with local Whisper
from pipecat.services.whisper.stt import WhisperSTTService

stt = WhisperSTTService(
    model_size="base",  # tiny, base, small, medium, large
    device="cpu",       # or "cuda" for GPU
    compute_type="int8" # Optimization for CPU
)
```

**Trade-offs**:
- ✅ No network latency (~50-200ms faster)
- ✅ No API costs
- ✅ Works offline
- ❌ Higher CPU/memory usage
- ❌ Initial model download (100-1500MB)
- ❌ May be less accurate than OpenAI

**Model Selection Guide**:
- `tiny`: Fast but less accurate (39MB)
- `base`: Good balance (74MB) 
- `small`: Better accuracy (244MB)
- `medium`: High accuracy (769MB)
- `large`: Best accuracy (1550MB)

### 16. Pipeline Idle Detection ⏰
**Purpose**: Automatically handle extended silence or disconnections

**Implementation**:
```python
from pipecat.pipeline import PipelineParams

pipeline_params = PipelineParams(
    idle_timeout_secs=300,  # 5 minutes of silence
    idle_timeout_callback=handle_idle_timeout
)

async def handle_idle_timeout():
    logger.warning("⏰ Pipeline idle for 5 minutes")
    await pipeline_task.cancel()
    # Optionally notify user or restart
```

**Use Cases**:
- Detect abandoned sessions
- Free resources during inactivity
- Alert on technical issues

### 17. Error & Interruption Handling 🛡️
**Purpose**: Gracefully handle STT errors and user interruptions

**Error Handler**:
```python
@pipeline_task.event_handler("on_error")
async def on_pipeline_error(error):
    logger.error(f"❌ Pipeline error: {error}")
    # Send error notification via WebSocket
    # Attempt recovery or graceful shutdown
```

**Interruption Strategy**:
```python
# Configure to cancel ongoing STT if user speaks again
pipeline_params = PipelineParams(
    interruption_strategy="cancel_current"  
)
```

### 18. Production Monitoring Integration 📈
**Purpose**: Send metrics to monitoring services

**Examples**:
```python
# Prometheus metrics
transcription_counter.inc()
transcription_duration.observe(duration)

# Sentry error tracking
import sentry_sdk
sentry_sdk.capture_exception(error)

# Custom analytics
await analytics.track("transcription_completed", {
    "user_id": user_id,
    "duration": duration,
    "word_count": len(text.split())
})
```

### 19. Transcription Post-Processing 🔧
**Purpose**: Clean up or enhance raw transcriptions

**Options**:
- Remove filler words ("um", "uh", "like")
- Add punctuation if missing
- Correct common misheard terms
- Format numbers and dates
- Redact sensitive information

**Example**:
```python
def process_transcription(text):
    # Remove filler words
    fillers = ["um", "uh", "like", "you know"]
    for filler in fillers:
        text = re.sub(rf'\b{filler}\b', '', text, flags=re.IGNORECASE)
    
    # Clean up extra spaces
    text = ' '.join(text.split())
    return text.strip()
```

### 20. Multi-Language Support 🌍
**Purpose**: Support transcription in multiple languages

**Implementation**:
```python
# Detect language from participant metadata or settings
language = participant.get("language", "en")

stt = OpenAISTTService(
    model="whisper-1",
    language=language  # ISO 639-1 code
)
```

**Supported Languages**: 50+ languages including Spanish, French, German, Chinese, Japanese, etc.

## Implementation Priority

For production deployment, consider implementing in this order:

1. **Error Handling** (#17) - Essential for reliability
2. **VAD Tuning** (#14) - Improves user experience  
3. **Pipeline Observers** (#13) - Helps debugging
4. **Idle Detection** (#16) - Saves resources
5. **Local Whisper** (#15) - If latency/cost matters

The remaining enhancements can be added based on specific needs.

## Testing These Enhancements

### Performance Testing
- Measure transcription latency with/without local Whisper
- Compare CPU usage across model sizes
- Test VAD accuracy with different parameters

### Reliability Testing  
- Simulate STT service failures
- Test error recovery mechanisms
- Verify idle timeout behavior

### Load Testing
- Run multiple concurrent transcription sessions
- Monitor resource usage over time
- Check for memory leaks in observers

Remember: The bot works without any of these enhancements. Only implement what adds value to your specific use case. 