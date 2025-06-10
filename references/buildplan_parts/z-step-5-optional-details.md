Step 5: Implement Speech-to-Text and Hint Generation (Agent Pipeline)
====================================================================

> **Important:** Follow the `simple-chatbot` example's pattern for STT + GPT stages, but swap out any Cartesia TTS sinks for our Whisper → GPT-4 chain. See `pipecat-cloud-simple-chatbot/server/bot.py` and its README for the exact Pipecat API calls.

With the agent tapping into the audio stream, now implement the core AI logic: transcribe Partner's speech to text and generate coaching hints using GPT-4. Then send those hints to the facilitator via the WebSocket.

## Integrating Whisper Speech-to-Text (STT) with Pipecat

For real-time transcription you now have two paths:
1. **Preferred POC path (simpler)** — enable `DailyParams(transcription_enabled=True)` and rely on Daily's built-in Deepgram transcription.  Capture the desired participant with `await transport.capture_participant_transcription()`, then consume `on_transcription_message` events. No extra STT service is required.
2. **Fallback / advanced** — keep `OpenAISTTService` (Whisper-1) if you need model control or local Whisper.

The rest of this document still shows the Whisper variant for completeness.

To achieve real-time transcription, use Pipecat's `OpenAISTTService` that calls OpenAI's Whisper API. 

**Documentation:** https://docs.pipecat.ai/services/openai

**Implementation:**
```python
from pipecat.services.openai import OpenAISTTService

# Use OpenAI's Whisper API
stt_service = OpenAISTTService(model="whisper-1")

pipeline = Pipeline([
    transport.input(),    # audio input from Daily
    stt_service,          # Whisper API for transcription
    ...                   # (subsequent processing like LLM, etc.)
])
```

The service uses voice activity detection (VAD) to segment speech, ensuring it processes complete utterances and skips silence. It will emit `TranscriptionFrame` events containing the transcribed text.

## Filtering Transcription to Partner's Audio Only

**Critical:** Only transcribe the Partner's speech, not the facilitator's, to avoid confusion.

### For LiveKit Transport:
```python
from livekit.agents import RoomInputOptions

room_input_options = RoomInputOptions(
    participant_identities=["partner"],  # Only listen to "partner"
    audio_enabled=True,
    video_enabled=False,
)
```

### For Daily Transport:
```python
@transport.event_handler("on_first_participant_joined")
async def on_join(participant):
    if participant["user_name"] == "partner":
        await transport.capture_participant_transcription(participant["id"])
```

**Documentation:** https://docs.pipecat.ai/transports/daily

Your system prompt should also reinforce this behavior (explicitly stating to listen only to the participant with identity "partner").

## Upgrading to OpenAI Client v1 Syntax

Update your OpenAI API calls to the latest client syntax. The old `openai.ChatCompletion.create()` pattern has changed in OpenAI's v1.x Python library.

**Migration Guide:** https://github.com/openai/openai-python#usage

**Updated Implementation:**
```python
import openai
import os

client = openai.OpenAI(api_key=os.environ["OPENAI_API_KEY"])
system_prompt = os.getenv("SYSTEM_PROMPT")

def generate_hint(transcript: str) -> str:
    rsp = client.chat.completions.create(
        model="gpt-4",  # or "gpt-3.5-turbo" for development
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": transcript}
        ],
        temperature=0.7,
        max_tokens=180
    )
    return rsp.choices[0].message.content.strip()
```

Note: `openai.Audio.transcribe()` is now `client.audio.transcriptions.create()` if using the Whisper API directly.

## Maintaining Conversation Context with Pipecat

Use Pipecat's `ContextAggregator` to ensure GPT-4 sees full conversation history.

**Documentation:** https://docs.pipecat.ai/features/context-aggregation

**Implementation:**
```python
from pipecat.context import ContextAggregator
from pipecat.services.openai.llm import OpenAILLMService

# Maintain last 8 conversation turns
context = ContextAggregator(max_turns=8)

# Configure LLM service
llm_service = OpenAILLMService(
    model="gpt-4",  # or "gpt-3.5-turbo" for development
    params=OpenAILLMService.InputParams(temperature=0.7, max_tokens=180)
)

pipeline = Pipeline([
    transport.input(),
    stt_service,
    context.user(),          # add latest transcript to context
    llm_service,             # GPT-4 model generates hint
    context.assistant(),     # save AI hint to context history
])
```

This ensures each hint generation considers prior messages - both Partner's statements and earlier AI hints.

## Broadcasting Transcripts and Hints via WebSockets

Instead of LiveKit data channels, use dedicated WebSocket broadcast for reliability.

**Custom Frame Processor Implementation:**
```python
class TranscriptionBroadcastProcessor(FrameProcessor):
    def __init__(self, websocket_manager):
        super().__init__()
        self._ws_manager = websocket_manager
    
    async def process_frame(self, frame, direction):
        await super().process_frame(frame, direction)
        
        if isinstance(frame, TranscriptionFrame):
            # Send transcription to facilitator UI
            await self._ws_manager.broadcast({
                "type": "transcript",
                "text": frame.text,
                "timestamp": frame.timestamp
            })
        
        await self.push_frame(frame)  # pass frame along pipeline

class HintBroadcastProcessor(FrameProcessor):
    def __init__(self, websocket_manager):
        super().__init__()
        self._ws_manager = websocket_manager
    
    async def process_frame(self, frame, direction):
        await super().process_frame(frame, direction)
        
        if frame.is_assistant():  # or check for LLMResponseFrame
            await self._ws_manager.broadcast({
                "type": "hint",
                "text": frame.text
            })
        
        await self.push_frame(frame)
```

**WebSocket Manager:**
```python
async def broadcast_ws(message: dict):
    """Send message to all active WebSocket connections"""
    for ws in active_connections:
        await ws.send_json(message)
```

## Hint Generation Timing and Throttling

### Utterance Finalization
- Only send final transcriptions to the LLM (VAD handles this automatically)
- Adjust VAD settings if needed for longer/shorter pauses

### Throttle Hint Frequency
Implement a cooldown to avoid overwhelming the facilitator:
```python
import time

class ThrottledHintProcessor(FrameProcessor):
    def __init__(self, cooldown_seconds=20):
        super().__init__()
        self.last_hint_time = 0
        self.cooldown = cooldown_seconds
    
    async def process_frame(self, frame, direction):
        if isinstance(frame, TranscriptionFrame):
            current_time = time.time()
            if current_time - self.last_hint_time >= self.cooldown:
                # Process for hint generation
                self.last_hint_time = current_time
                await self.push_frame(frame)
            # Otherwise skip this transcription
        else:
            await self.push_frame(frame)
```

## Resource Management and Performance

The POC uses OpenAI's Whisper API exclusively, which:
- Requires minimal memory on the agent VM
- Provides consistent performance
- Avoids model download/installation complexity
- Scales automatically with OpenAI's infrastructure

Monitor your OpenAI API usage to manage costs. Each audio chunk sent to Whisper incurs a charge based on duration.

## Error Handling and Lifecycle Management

### Error Handling
```python
try:
    # Whisper/GPT operations
except Exception as e:
    logger.error(f"Pipeline error: {e}")
    # Send error notification to UI if needed
    await broadcast_ws({"type": "error", "message": str(e)})
```

### Lifecycle Management
```python
@transport.event_handler("on_participant_left")
async def on_participant_left(participant):
    if participant["user_name"] == "partner":
        await pipeline.cancel()  # Free Whisper/GPT resources
```

## Token Strategy

**Development/Demo:** Room open → omit DAILY_TOKEN

**Production:** Create long-TTL participant token via Daily REST API
- **Documentation:** https://docs.daily.co/reference/rest-api/meeting-tokens
- Store as `DAILY_TOKEN` secret on Fly

## End-to-End Testing (Local)

1. **Start Services:**
   ```bash
   uvicorn agent.server:app --port 8000 --reload  # FastAPI server
   python agent/pipeline.py  # Pipecat pipeline
   pnpm dev  # Next.js frontend
   ```

2. **Test Flow:**
   - Open Partner and Facilitator pages
   - Partner speaks → Check agent logs for Whisper transcript
   - Verify GPT hint generation in logs
   - Confirm facilitator receives and displays hints
   - Test multiple utterances for proper ordering

3. **Edge Cases:**
   - Silence → No hint generated
   - Long utterance → Hint after user stops
   - Overlapping speech → Sequential processing

4. **Verification Checklist:**
   - ✓ Only Partner's speech is transcribed
   - ✓ Hints maintain conversation context
   - ✓ WebSocket delivery is reliable
   - ✓ Hint frequency is appropriately throttled
   - ✓ Errors are handled gracefully

## Troubleshooting

**No hints appearing in UI:**
- Check FastAPI logs for WebSocket connection errors
- Verify OpenAI API key and quota
- Ensure Partner's username parameter is exactly "partner"
- Check browser console for WebSocket errors

**Poor transcription quality:**
- Try a larger Whisper model
- Check audio quality/volume
- Verify VAD settings aren't cutting off speech

**Hints lack context:**
- Verify ContextAggregator is properly configured
- Check max_turns setting (increase if needed)
- Ensure context.user() and context.assistant() are in pipeline

Once all tests pass, the system performs live STT, contextual GPT-4 hint generation, and reliable WebSocket delivery. Proceed to deployment (Step 6). 