Step 4: Connect the Agent to Daily Call Audio (Real-Time Speech Integration)
============================================================================

Now it's time to integrate the AI Coach agent with the Daily video call so it can receive the Partner's audio in real time and generate coaching hints on the fly. We will use Pipecat with Daily's **built-in transcription service** (powered by Deepgram) for Stage-2. Whisper-1 via OpenAI remains an optional fallback, but the production POC proved far more reliable when we let Daily handle STT directly.  The rest of the pipeline (GPT-4 + WebSocket broadcast) is unchanged.

4.1 Environment and Dependency Configuration
--------------------------------------------

Before writing any code, make sure all necessary configuration and dependencies are in place:

-   **Pipecat 0.3.x:** Install Pipecat version **0.3.*** (pinned to avoid breaking changes) with the Daily and OpenAI extras. For example, in `requirements.txt` include:

    ```
    pipecat-ai[daily,openai]==0.3.*

    ```

    This ensures you have the Daily WebRTC transport and OpenAI Whisper/GPT services available. Pipecat is evolving quickly, so pinning to 0.3.x guarantees compatibility with the code in this guide. (Older versions used different import paths; in 0.3+, we'll use the updated paths as shown below.)

-   **Environment Variables:** Create or update `agent/.env` to include all required settings. These values will be loaded at runtime (using `python-dotenv` or similar) so the agent can authenticate with Daily and OpenAI. **Ensure each is defined and non-empty** (unless noted as optional), otherwise the agent may fail to connect or operate. Required entries include:

    -   `DAILY_ROOM_URL` -- **(Required)** The full URL of the Daily room the agent should join (e.g. `https://your-domain.daily.co/your-room-name`). This tells Pipecat where to connect the bot.

    -   `DAILY_TOKEN` -- **(Optional)** A Daily meeting token (JWT) if the room is private or requires authentication. Leave this blank or omit it for an open/public room (no token needed). If provided, Pipecat will use it to join the call. For production, we recommend using a **pre-minted long-lived token** - generate it server-side via Daily's REST API `/meeting-tokens` endpoint with a long TTL and the `room_name` locked to your room. Store it as an environment variable. Remember to include an `exp` claim as Daily recommends (e.g., set it a few days or weeks out).

    -   `DAILY_API_KEY` -- **(Required by Daily SDK)** Your Daily API key for the domain, which the Daily transport may use under the hood. Obtain this from your Daily account dashboard and set it here. Even if using a public room without tokens, the Daily SDK expects a valid API key to establish the connection.

    -   `OPENAI_API_KEY` -- **(Required)** Your OpenAI API key, used by Pipecat's Whisper (STT) and GPT-4 services. Without this, the agent cannot call OpenAI for transcription or language modeling.

    -   `SYSTEM_PROMPT` -- **(Optional)** A system message to instruct GPT-4 with context or desired behavior. For example, this could contain the coaching style guidelines for IFS hints. If set, our code will pass it to the GPT-4 service; otherwise, a default or empty system prompt will be used.

-   **Load the .env in the app:** Ensure the FastAPI app or the bot module loads these variables on startup (e.g. by calling `dotenv.load_dotenv()` or similar) so that `os.getenv("VAR_NAME")` returns the expected values. Double-check that each variable is accessible in code. A missing `OPENAI_API_KEY` will cause OpenAI service calls to fail, and a missing Daily configuration will prevent the bot from joining the call.

With the environment configured and Pipecat installed, you are ready to build the audio pipeline.

4.2 Setting Up the Pipecat Bot Pipeline (`agent/bot.py`) - Staged Implementation
--------------------------------------------------------------------------------

We will create a dedicated module for the agent's audio pipeline logic in stages, testing each step before proceeding. This approach ensures each component works before adding complexity.

### Stage 1: Basic Bot Structure (10 min)
**Goal:** Create minimal bot that successfully joins the Daily room

Create `agent/bot.py` with just the Daily transport connection:

```python
import os
import asyncio
from dotenv import load_dotenv
from pipecat.transports.services.daily import DailyTransport, DailyParams
from pipecat.core import Pipeline, PipelineTask
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

async def run_bot():
    """Main bot pipeline function - Stage 1: Just join the room"""
    
    # Set up Daily transport (bot joins the Daily room as a silent participant)
    transport = DailyTransport(
        room_url=os.getenv("DAILY_ROOM_URL"),
        token=os.getenv("DAILY_TOKEN") or None,
        bot_name="ai-coach",
        params=DailyParams(
            audio_in_enabled=True, 
            audio_out_enabled=False,
            vad_enabled=True  # Voice activity detection
        )
    )
    
    # Build minimal pipeline - just transport in and out
    pipeline = Pipeline([
        transport.input(),
        transport.output()
    ])
    
    # Create and run the pipeline task
    task = PipelineTask(pipeline)
    
    logger.info("Bot starting - attempting to join Daily room...")
    
    # Run the pipeline
    await task.run()

if __name__ == "__main__":
    asyncio.run(run_bot())
```

**Test Stage 1:**
1. Run the bot: `python bot.py`
2. Check logs for "Bot starting - attempting to join Daily room..."
3. Open the Daily room in a browser
4. Verify "ai-coach" appears in the participant list
5. Bot should stay connected (no audio in/out)

### Stage 2: Add STT Pipeline (15 min)
**Goal:** Add Whisper STT - bot transcribes and logs speech

# -------------------------
# Updated (June 2025)
# -------------------------
# We now rely on Daily's transcription instead of Whisper-1.
# Whisper instructions are left commented for reference.
from pipecat.frames.frames import TranscriptionFrame

async def run_bot():
    """Main bot pipeline function - Stage 2: Add STT"""
    
    transport = DailyTransport(
        room_url=os.getenv("DAILY_ROOM_URL"),
        token=os.getenv("DAILY_TOKEN") or None,
        bot_name="ai-coach",
        params=DailyParams(
            audio_in_enabled=True, 
            audio_out_enabled=False,
            transcription_enabled=True  # �� enables Daily STT
        )
    )

    # No external STT processor needed – Daily delivers transcription
    # events via @transport.event_handler("on_transcription_message").

    pipeline = Pipeline([
        transport.input(),
        transport.output()
    ])

    task = PipelineTask(pipeline)
    
    logger.info("Bot starting with STT enabled (Daily transcription)…")

# Log final transcripts via event callback instead of frame loop
@transport.event_handler("on_transcription_message")
async def _on_tx(_t, message):
    if message.get("rawResponse", {}).get("is_final"):
        text = message["text"]
        user = message.get("participantId")
        logger.info(f"Transcript ({user}): {text}")

**Test Stage 2:**
1. Run the bot
2. Join as "partner" in one browser tab
3. Join as "facilitator" in another tab
4. Partner speaks - check logs for transcriptions
5. Facilitator speaks - verify it's ignored







### Stage 3: Add LLM Pipeline (15 min)
**Goal:** Add GPT-4 to generate hints from transcripts

Update `agent/bot.py` to add LLM processing:

```python
from pipecat.services.openai import OpenAILLMService
from pipecat.frames.frames import LLMResponseFrame

async def run_bot():
    """Main bot pipeline function - Stage 3: Add LLM"""
    
    transport = DailyTransport(
        room_url=os.getenv("DAILY_ROOM_URL"),
        token=os.getenv("DAILY_TOKEN") or None,
        bot_name="ai-coach",
        params=DailyParams(
            audio_in_enabled=True, 
            audio_out_enabled=False,
            vad_enabled=True
        )
    )
    
    stt = OpenAISTTService(
        model="whisper-1",
        api_key=os.getenv("OPENAI_API_KEY")
    )
    
    # Add GPT-4 LLM service
    llm = OpenAILLMService(
        model="gpt-4",
        api_key=os.getenv("OPENAI_API_KEY"),
        system_message=os.getenv("SYSTEM_PROMPT", "You are a helpful IFS coaching assistant.")
    )
    
    # Build complete pipeline: transport -> STT -> LLM -> transport
    pipeline = Pipeline([
        transport.input(),
        stt,
        llm,  # Add LLM to pipeline
        transport.output()
    ])
    
    task = PipelineTask(pipeline)
    
    logger.info("Bot starting with STT and LLM enabled...")
    
    async for frame in task:
        if isinstance(frame, TranscriptionFrame):
            if frame.participant and frame.participant.get("user_name") == "partner":
                logger.info(f"Partner said: {frame.text}")
        elif isinstance(frame, LLMResponseFrame):
            # Log the generated hint
            logger.info(f"Generated hint: {frame.text}")
```

**Test Stage 3:**
1. Run the bot
2. Partner speaks about an inner part
3. Check logs for both transcription and generated hint
4. Verify hints follow the system prompt format

### Stage 4: WebSocket Integration (10 min)
**Goal:** Connect bot output to WebSocket broadcast

Final update to `agent/bot.py` to integrate with FastAPI WebSocket:

```python
# Import the broadcast function from server
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from server import broadcast_hint

async def run_bot():
    """Main bot pipeline function - Stage 4: WebSocket Integration"""
    
    transport = DailyTransport(
        room_url=os.getenv("DAILY_ROOM_URL"),
        token=os.getenv("DAILY_TOKEN") or None,
        bot_name="ai-coach",
        params=DailyParams(
            audio_in_enabled=True, 
            audio_out_enabled=False,
            vad_enabled=True
        )
    )
    
    stt = OpenAISTTService(
        model="whisper-1",
        api_key=os.getenv("OPENAI_API_KEY")
    )
    
    llm = OpenAILLMService(
        model="gpt-4",
        api_key=os.getenv("OPENAI_API_KEY"),
        system_message=os.getenv("SYSTEM_PROMPT")
    )
    
    pipeline = Pipeline([
        transport.input(),
        stt,
        llm,
        transport.output()
    ])
    
    task = PipelineTask(pipeline)
    
    logger.info("Bot starting with full pipeline and WebSocket integration...")
    
    async for frame in task:
        if isinstance(frame, TranscriptionFrame):
            if frame.participant and frame.participant.get("user_name") == "partner":
                logger.info(f"Partner said: {frame.text}")
        elif isinstance(frame, LLMResponseFrame):
            # Send hint to facilitator via WebSocket
            hint_text = frame.text
            logger.info(f"Broadcasting hint: {hint_text[:50]}...")
            await broadcast_hint(hint_text)
```

**Test Stage 4:**
1. Start FastAPI server: `python server.py`
2. In another terminal, run bot: `python bot.py`
3. Open facilitator page in browser
4. Partner speaks
5. Verify hint appears in facilitator UI

### Implementation Notes

- **Start from Pipecat's sample:** The repository [daily-co/pipecat-cloud-simple-chatbot](https://github.com/daily-co/pipecat-cloud-simple-chatbot) contains a reference implementation. We're using its patterns but building incrementally.

- **No TTS/Audio Output:** We never include TTS services (`CartesiaTTSService`, `ElevenLabsTTSService`, etc.). The bot remains silent with `audio_out_enabled=False`.

- **Import Paths:** Using Pipecat 0.3.x paths:
  - `pipecat.transports.services.daily` (not `pipecat.contrib.daily`)
  - `pipecat.services.openai` for STT/LLM services

- **Error Handling:** Each stage should include try/except blocks in production, but we're keeping it simple for testing.

After completing all stages, you'll have a working bot that:
1. Joins the Daily room silently
2. Transcribes only the Partner's speech
3. Generates IFS coaching hints via GPT-4
4. Broadcasts hints to the facilitator's UI in real-time

4.3 Running the Pipeline in FastAPI's Event Loop (Non-Blocking Startup)
-----------------------------------------------------------------------

We need the Pipecat pipeline to run in parallel with the FastAPI server (which handles HTTP and WebSocket endpoints). To achieve this, we'll launch the pipeline task in the background when the application starts, using FastAPI's startup event. This ensures the pipeline begins processing as soon as the app is up, without blocking the server's ability to handle requests.

In your FastAPI app (e.g. `agent/server.py` or wherever the `FastAPI()` is defined), add a startup event that creates an asyncio task for the pipeline. For example:

```
from fastapi import FastAPI

app = FastAPI()

# Import the pipeline task (and any run function) from bot.py
from agent import bot

@app.on_event("startup")
async def startup_event():
    # Launch the Pipecat pipeline in the background when the app starts
    asyncio.create_task(bot.run_pipeline())

```

In the above:

-   We import our `bot` module, which contains the pipeline `task` and possibly a helper coroutine `run_pipeline()` to iterate over it. We'll define `run_pipeline()` in `agent/bot.py` to encapsulate the frame-processing loop (see next section).

-   Using `asyncio.create_task` schedules the `run_pipeline()` coroutine to start running concurrently, without waiting for it to finish. This is crucial: **do not** use `await` on the pipeline task here, as that would block the startup (and the server) until the pipeline ends. Instead, we let it run in the background.

-   FastAPI (with Uvicorn) uses an asynchronous event loop under the hood (AnyIO/asyncio), so our background task will co-exist with the server tasks. This pattern ensures the WebSocket endpoint and the pipeline can run simultaneously. The FastAPI app will start serving requests immediately, while the pipeline connects to the call and begins processing audio frames.

By embedding the pipeline startup in the FastAPI `startup` event, we integrate the audio agent into the same process as the web server. This avoids having to run a separate process for the bot and allows easy sharing of state (like calling our WebSocket broadcast function directly when a new hint is ready).

4.4 Processing Audio Frames and Filtering to the Partner
--------------------------------------------------------

With the pipeline running, we need to handle the incoming data (frames) from Pipecat. Each frame corresponds to an event or output from one stage of the pipeline. In our case, frames will include transcriptions from Whisper and responses from GPT-4. We'll loop over the `PipelineTask` (the `task` we created) to receive frames asynchronously. Inside this loop, we must filter and process frames appropriately:

In `agent/bot.py`, define an async function to run the pipeline, for example:

```
async def run_pipeline():
    # Start processing frames from the pipeline
    async for frame in task:
        if frame.is_transcription():
            # A new transcription (speech-to-text result from Whisper)
            if frame.participant and frame.participant.get("user_name") != "partner":
                continue  # Ignore audio from anyone who isn't the Partner
            transcript = frame.text  # The transcribed text of Partner's speech
            print(f"Partner said: {transcript}")  # (For debugging/testing)
            # We could also broadcast transcripts if needed, but for now we just log them.
        if frame.is_assistant():
            # A new assistant response (LLM output from GPT-4)
            hint = frame.text  # The coaching hint text
            await broadcast_hint(hint)  # send the hint to all facilitator clients via WebSocket

```

Let's break down this logic:

-   We iterate `async for frame in task:` which will yield frames as they are produced by the pipeline. This loop will run continuously until the pipeline is cancelled or ends. It needs to be defined as an `async` function because `PipelineTask` is an asynchronous generator.

-   **Transcription frames:** We check `if frame.is_transcription():` to catch Whisper's output. This frame contains the recognized text of a spoken utterance. We then **filter by participant** -- using `frame.participant.get("user_name")`. In our Daily setup, we expect the Partner to join the call with a user name "partner" (perhaps configured via the Daily Prebuilt URL query or by convention). We only want to process the Partner's speech, not the facilitator or any other participant. So if the frame's participant `user_name` is not "partner", we `continue` the loop immediately, skipping any further processing on that frame. This way, if the facilitator speaks or any background audio comes through, our agent ignores it. **This filter is crucial**: it ensures the AI only responds to the intended person's speech.

    -   If the frame is indeed the Partner's transcription, we retrieve the text via `frame.text`. During development, it's helpful to log this (e.g., print "Partner said: ...") to verify that speech is being picked up and transcribed correctly. In a production setting, you might remove or tone down such logging, but for now it's a good sanity check.

    -   (Optional advanced note: Pipecat provides more direct ways to capture a specific participant's audio, such as calling `transport.capture_participant_transcription(participant_id)` when the participant joins. In our simple case, using the known username is sufficient and straightforward.)

-   **Assistant (LLM) frames:** We check `if frame.is_assistant():` to catch the output from GPT-4 (Pipecat labels the LLM service's output as an "assistant" frame). When this fires, it means GPT-4 has generated a new coaching hint in response to the latest transcript. We extract the hint text (`frame.text`) and then call our WebSocket broadcast helper to send this hint out to all connected facilitator clients. We will implement `broadcast_hint` in the next section. By handling the assistant frame, we effectively replace what used to be the TTS stage in the original bot: instead of speaking the hint, we broadcast it as text to the UI.

This loop runs continuously, processing each piece of audio in sequence: when the Partner speaks, a transcription frame comes (if it's the Partner, we log it), then that triggers the LLM which produces an assistant frame (we broadcast it). The agent thereby listens and responds in real time. The filtering on `user_name == "partner"` guarantees that the pipeline's Whisper and GPT-4 are only triggered by the Partner's voice, preventing accidental hints from the facilitator's speech or other noise.

4.5 Broadcasting Hints via WebSocket to the Facilitator UI
----------------------------------------------------------

We have the mechanism to generate hints, but we need to deliver them to the facilitator's web application so they can see the coaching suggestions live. This is done through the WebSocket connection we set up in earlier steps (the facilitator client connects to our FastAPI server at `/ws`). We will maintain a list of active WebSocket connections and send each hint as a message to all connected facilitators.

In your FastAPI server code (where the WebSocket endpoint is defined), you likely already have something like:

```
active_connections: List[WebSocket] = []

```

and logic to append connections on websocket connect. Now implement a broadcast helper function and use it in our pipeline loop:

```
# Define this in a suitable place in server.py (or a shared utils module)
async def broadcast_hint(text: str):
    # Send the given text as a "hint" message to all active WebSocket clients
    for ws in list(active_connections):  # iterate over copy to allow removal
        try:
            await ws.send_json({"type": "hint", "text": text})
        except Exception:
            active_connections.remove(ws)  # drop closed or errored connections

```

A few notes on this implementation:

-   We send a JSON message with a structure like `{"type": "hint", "text": text}`. This allows the client to distinguish hint messages (if later we also send other types like transcripts or system messages). The facilitator UI should handle this JSON format and display the hint appropriately.

-   We iterate over a copy of `active_connections` and catch exceptions. If a WebSocket is closed or errors out (for example, if the facilitator navigated away and the socket is no longer alive), attempting to send will raise. We remove such connections from the list to prevent memory leaks or repetitive errors. This cleanup ensures our list only contains live clients.

-   You might already have a similar loop for broadcasting in earlier steps; adapt it as needed. Also, if you had any test or placeholder messages being sent (for example, echoing a "WS_CONNECTED" message upon connect for debugging), you should remove those now to keep the output clean. The facilitator should receive only the relevant JSON messages (hints, and possibly transcripts if you choose to send those).

Now, tie this into the pipeline loop (as shown in the previous section): when `frame.is_assistant()`, call `await broadcast_hint(hint)`. This will asynchronously send the hint to all connected clients. Since our pipeline loop and WebSocket sends are all running in the same event loop, this works seamlessly. The facilitator's browser will get the hint within moments of it being generated by GPT-4.

**Optional:** If you want to also show live transcriptions to the facilitator (which can be useful for transparency), you could similarly broadcast transcript frames. For example, on each `frame.is_transcription()` for the partner, call a `broadcast_transcript(transcript)` function that sends `{"type": "transcript", "text": transcript}`. This is not strictly required by the prompt (the primary goal is to send the AI coach hints), so implement it only if it's useful for your app. In our current plan, we stick to broadcasting hints.

With broadcasting in place, the real-time loop is complete: Partner speaks -> transcribed by Whisper -> GPT-4 generates hint -> hint is sent via WS to facilitator UI.

4.6 Handling Call Disconnects and Cleanup
-----------------------------------------

It's important to consider the lifecycle of the call and our agent's pipeline, especially to avoid resources running unnecessarily (and incurring costs or memory leaks) when the call is over. We need to define what happens when the Partner leaves the Daily call or the session ends:

-   **Detecting participant leave:** Pipecat's `DailyTransport` provides event hooks such as `on_participant_left` and `on_call_left`. In the Pipecat chatbot example, they attach an event handler to cancel the pipeline when the user disconnects. We should implement similar logic. One straightforward approach: when the Partner leaves, simply break out of the `async for frame` loop or cancel the pipeline task. Since our loop runs in `run_pipeline()`, we could check for a condition to exit. However, without an explicit signal, the loop will naturally end if the pipeline stops producing frames (which would happen if the transport disconnects). A cleaner way is to use Pipecat's event system:

    -   For example, you can decorate a function in `bot.py` with `@transport.event_handler("on_participant_left")` to listen for that event. In that handler, if the participant who left is the Partner, you can call `await task.cancel()` to terminate the pipeline task.

    -   Alternatively, monitor the frames: Pipecat might emit a special frame or end the generator when the call ends. In practice, implementing the event hook is more direct.

-   **Daily room authentication considerations:** For development and testing, we use an **open room** (Daily room with `privacy: "public"`), which requires no token – any participant (including our bot) can join via the URL alone. In this mode we leave `DAILY_TOKEN` blank and pass `token=None` to `DailyTransport`. For a production/secure setup, we can switch the room to **private** and require a Daily **meeting token** (JWT) for the bot (and/or participants) to join. Daily supports tokens with exp (expiry) and various claims for permissions. In summary: **dev mode** – open room, no tokens needed; **prod mode** – room locked, bot uses `DAILY_TOKEN` (and we could issue user-specific tokens for participants if needed).

-   **Canceling the pipeline:** When the pipeline task is canceled or the loop breaks, Pipecat will handle tearing down the resources. The `transport.output()` stage ensures the bot leaves the Daily room gracefully. By canceling the task when the Partner leaves (or the room becomes empty), we free up the Whisper and GPT-4 services so they stop listening and generating (preventing unnecessary OpenAI usage when no one is speaking). This also stops our background task, preventing it from running indefinitely and consuming memory/CPU.

-   **Rejoining or restarting:** In a simple single-session scenario, if the Partner or a new partner wants to start another session after a disconnect, you would typically restart the whole agent process or create a new pipeline task. Automating rejoin is possible (for instance, using an event like `on_first_participant_joined` to trigger a new PipelineTask), but that adds complexity. For now, our integration assumes one session per run. When the session ends, the agent stops. This is straightforward and avoids edge-case bugs. In a more robust system, you could keep the app running and spawn a new pipeline when a new user joins, but make sure not to leak the old one.

-   **Avoiding memory leaks:** By cleaning up WebSocket connections (as done in `broadcast_hint`) and cancelling the pipeline on disconnect, we prevent the two main sources of potential leaks: lingering WebSocket references and a hanging audio pipeline. Always remove or reset any references to the old session if you plan to handle subsequent sessions in the same process. Additionally, ensure that any long-lived asyncio tasks (like our pipeline task) are cancelled when no longer needed. If you follow the above approach, the task will end when the call ends, which is what we want.

In summary, implement a strategy so that when the Partner leaves the call, the agent also exits the pipeline loop and leaves. This keeps resource usage in check and avoids ghost tasks running in the background. For development, you might manually stop the server between sessions, which also resets everything.

4.7 Testing the Integration Step-by-Step
----------------------------------------

Given the multiple moving parts (Daily call, audio pipeline, STT, LLM, WebSockets), it's wise to test each piece in isolation before doing full end-to-end runs. Here's a suggested incremental test plan to catch issues early:

1.  **Test Daily connection alone:** Start the FastAPI server with the pipeline integration, but you can initially simplify the pipeline to just the Daily transport (input and output) without STT/LLM to ensure connectivity. For example, temporarily set `pipeline = Pipeline([ transport.input(), transport.output() ])` and comment out the STT/LLM stages. Run the server and join the Daily room from a browser as the Partner (and optionally as facilitator). Verify that the agent (bot) successfully joins the call. You should see the bot participant (e.g. "ai-coach") appear in the room's participant list. This confirms that your `DAILY_ROOM_URL`, `DAILY_API_KEY`, and optional `DAILY_TOKEN` are correct and the Daily transport can connect. If the bot doesn't join, check the server logs for errors (e.g. authentication issues or room not found) and fix those before proceeding.

2.  **Test speech-to-text (Whisper) integration:** Once the bot can connect, include the STT service in the pipeline (`Pipeline([ transport.input(), stt, transport.output() ])` or along with LLM but you can ignore LLM output for now). Keep the logging of transcripts (`print(f"Partner said: {transcript}")`) in place. Run the server and join the call again. This time, speak as the Partner (say a few words). Watch the agent's console logs. You should see a line like `Partner said: ...` with the transcribed text of your speech. This confirms that audio is flowing from Daily to the agent, Whisper is transcribing it, and your filtering is correct (only Partner speech triggers the log). If you don't see this:

    -   Ensure the Partner's `user_name` exactly matches "partner" (case-sensitive) or adjust the filter logic to whatever name you use.

    -   Check that your OpenAI API key is set and that the Whisper API is enabled for your account. Any errors from the OpenAI service should appear in the logs/exceptions.

    -   You can also test with very clear speech or different microphones if accuracy seems off, but generally Whisper is robust.

3.  **Test full pipeline with GPT-4 and WebSocket broadcasting:** Finally, include the LLM stage and the broadcasting logic (`Pipeline([ transport.input(), stt, llm, transport.output() ])` and the full loop with `broadcast_hint`). Open the facilitator UI (ensuring it connects via WebSocket to the server) and have the Partner speak in the call. Now, in addition to the transcript log, within a second or two you should see a **hint message appear in the facilitator's interface**. The facilitator UI, upon receiving the `{"type": "hint", "text": ...}` message, should display the hint (how this is done depends on your frontend code). Verify that this cycle works: Partner says something -> (agent prints transcript) -> facilitator gets a hint. This indicates that GPT-4 processed the transcript and the result was broadcast successfully. If the transcript appears but no hint arrives:

    -   Check the server logs for errors from the OpenAI LLM service (e.g., missing API key, model not available, token issues, etc.).

    -   Ensure that the `OPENAI_API_KEY` has access to GPT-4 (some keys might not have GPT-4 if it's not enabled in the account).

    -   Verify that the WebSocket connection is indeed open on the facilitator side and that `active_connections` list is being populated. If you had a bug where `active_connections` isn't updated or the WS endpoint not properly defined, the broadcast may not actually send to anyone. You can add a temporary log in `broadcast_hint` to confirm it's being called and sending.

    -   Also, ensure that the system prompt (if provided) is appropriate. In rare cases, GPT-4 might refuse to respond or delay if the prompt is unclear or if rate limits are hit. For testing, you might simplify the system prompt to ensure it's not causing an empty output.

4.  **Full end-to-end trial:** With all components verified individually, do a realistic test run: have the Partner speak a few sentences as in a coaching scenario, and observe the facilitator UI receiving multiple hints. Confirm that the timing is acceptable (there will be a short delay due to processing, but it should be a matter of seconds). Monitor the server logs for any exceptions or warnings throughout the interaction. If everything is set up correctly, the agent will continuously listen and produce hints without manual intervention.

Throughout these tests, keep an eye on resource usage and any error messages. Address issues step by step. For instance, if the bot isn't joining, fix that before worrying about Whisper. If Whisper works but GPT-4 doesn't, resolve the GPT issue next. This modular testing approach will save time and make debugging easier.

4.8 Error Handling and Best Practices
-------------------------------------

To ensure a smooth implementation, consider the following tips and potential pitfalls (and how to avoid them):

-   **Dotenv and config validation:** Make sure to call `load_dotenv()` (or equivalent) early in your app startup so environment variables are available. You can also programmatically check for critical configs and log a clear error if something like `DAILY_ROOM_URL` or `OPENAI_API_KEY` is not set, rather than failing mysteriously later. This will save you from chasing configuration issues when something doesn't work.

-   **Exception handling in the pipeline task:** When using `asyncio.create_task` for `run_pipeline()`, any exceptions in that task might not be immediately visible (they won't crash the app, since it's in a background task). During development, you can wrap the pipeline loop in a try/except and log exceptions, or use `task.add_done_callback` to inspect the result. This way if, say, the Daily connection drops or OpenAI returns an error that isn't handled internally, you get a stack trace in your logs.

-   **Cleanup on shutdown:** If you stop the FastAPI server (or if it crashes), the pipeline task should be cancelled automatically as the event loop closes. However, it's good practice to explicitly handle shutdown if possible. You could add a FastAPI `shutdown` event where you call `await task.cancel()` to gracefully stop the pipeline when the app is shutting down. This complements our handling of user disconnects and ensures no tasks linger.

-   **Avoid multiple simultaneous pipelines:** In this design, we assume a single pipeline (one Partner at a time). If you ever extended the app to handle multiple sessions or multiple partners, you'd need to manage separate pipeline tasks and transports for each, which is beyond our current scope. Do not call `run_pipeline()` more than once without cancelling the previous task -- doing so could spawn redundant bots or duplicate processing, quickly exhausting resources or causing confusion.

-   **Memory and resource management:** Our earlier steps ensure that we remove closed WebSocket connections and cancel the pipeline when appropriate. These actions prevent buildup of unused objects. Also be mindful of the OpenAI usage -- Whisper and GPT-4 calls for long sessions can be costly. It's wise to monitor how often hints are generated and perhaps implement some rate limiting or batching if needed (for example, you might decide to only generate a hint after the Partner finishes a long sentence or every X seconds, rather than for every short phrase -- but such logic would be an enhancement on top of this foundation).

-   **Logging and debugging:** Use print statements or logging during development to trace the flow (e.g., log when the bot joins the call, when a frame is processed, when a hint is broadcast). This can be very helpful to identify where something might be breaking. Just remember to remove or reduce verbose logging in production to avoid clutter and performance hits. Keep essential logs (like a confirmation that the pipeline started, or a summary when the session ends) for monitoring.

By following these best practices and the integration steps above, your AI Coach agent should reliably join the Daily call, listen **only** to the Partner's speech, transcribe it, generate IFS coaching hints using GPT-4, and deliver those hints in real time to the facilitator's UI. This completes the core real-time loop of the system.

* * * * *

**References:**

-   [Pipecat Daily Transport Documentation](https://docs.pipecat.ai/transports/daily) -- details on using Daily WebRTC transport with Pipecat, event handlers, etc.

-   [Pipecat OpenAI Services Documentation](https://docs.pipecat.ai/services/openai) -- usage of OpenAISTTService (Whisper) and OpenAILLMService (GPT) within pipelines.

-   [Daily REST API Documentation](https://docs.daily.co/reference/rest-api) -- information on Daily room tokens and API keys, if using private rooms and tokens for authentication.

-   [Reference implementation: daily-co/pipecat-cloud-simple-chatbot](https://github.com/daily-co/pipecat-cloud-simple-chatbot) -- The Pipecat sample bot that serves as the foundation for our modifications.