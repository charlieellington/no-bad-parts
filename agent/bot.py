#!/usr/bin/env python3
"""
AI-Coach Bot – Stage 4 (WebSocket Integration)
----------------------------------------------
• Joins a Daily room silently
• Uses Daily's built-in transcription service (Deepgram) to capture speech
• Listens only to the participant whose `user_name == "partner"`
• For each FINAL transcript from the partner, calls GPT-4 to generate a coaching hint
• Broadcasts hints to facilitator UI via WebSocket

Environment variables used (loaded via .env):
  DAILY_ROOM_URL   – full Daily room URL
  DAILY_TOKEN      – (optional) meeting token
  DAILY_API_KEY    – required if DAILY_TOKEN is omitted (used to fetch a temp token)
  OPENAI_API_KEY   – OpenAI credentials for GPT-4
  SYSTEM_PROMPT    – (optional) system prompt for GPT-4
  OPENAI_MODEL     – (optional) LLM model name (default: gpt-4o-mini or gpt-4)
"""

import os
import asyncio
import json
import re
import sys
from typing import Dict, Optional, Callable, List
from datetime import datetime, timedelta

from dotenv import load_dotenv
from loguru import logger
import aiohttp
from openai import AsyncOpenAI, OpenAIError

from pipecat.transports.services.daily import DailyTransport, DailyParams
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.task import PipelineTask

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

load_dotenv()  # Load variables from agent/.env (or parent .env)

DAILY_ROOM_URL = os.getenv("DAILY_ROOM_URL")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SYSTEM_PROMPT = os.getenv(
    "SYSTEM_PROMPT",
    """You are an Internal Family Systems (IFS) coaching assistant helping a facilitator guide their partner through self-exploration.

You're receiving a stream of speech that may include partial phrases and some repetition. Consider the full context of what's being shared.

Based on what the partner shares, provide a brief coaching hint in this format:

SUMMARY: [One sentence capturing the essence of what you heard]
SUGGESTION: [One specific IFS-informed question or reflection the facilitator could offer]
FOLLOW-UP: [1-2 alternative approaches if the first doesn't resonate]

Focus on:
- Helping the partner notice and get curious about their parts
- Encouraging self-compassion and non-judgment
- Supporting the partner to speak FOR their parts rather than FROM them
- Inviting gentle exploration of what parts might need
- Understanding the emotional journey being described

Keep hints concise and actionable for the facilitator."""
)
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

MIN_WORDS_FOR_HINT = int(os.getenv("MIN_WORDS_FOR_HINT", "5"))  # Minimum words required to trigger GPT hint

if not DAILY_ROOM_URL:
    raise RuntimeError("DAILY_ROOM_URL env var is required.")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY env var is required.")

# Async OpenAI client
openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)

# Keep a mapping of participantId -> user_name
participants: Dict[str, str] = {}

# Global pipeline task (set later so event handlers can access it)
task: Optional[PipelineTask] = None

# Global broadcast function (will be set by server)
broadcast_hint_fn: Optional[Callable] = None

# Global conversation history (list of final partner utterances)
conversation_history: List[str] = []
MAX_HISTORY = 100  # cap to avoid unbounded growth

# ---------------------------------------------------------------------------
# NEW – speaker-filter configuration
# ---------------------------------------------------------------------------
# Regex that must match the *partner's* userName for their audio to be processed.
# Override with e.g. PARTNER_NAME_PATTERN="^charlie$" in the agent .env or Fly secrets.
PARTNER_NAME_PATTERN = os.getenv("PARTNER_NAME_PATTERN", r"^partner$")
_partner_regex = re.compile(PARTNER_NAME_PATTERN, re.IGNORECASE)

# Will be set once we identify the partner
partner_id: Optional[str] = None
# Track order of human participants (excludes this bot)
human_join_order: list[str] = []

# Transcript accumulator for debouncing
class TranscriptAccumulator:
    def __init__(self, silence_threshold: float = 1.5, context_window: int = 5):
        self.final_transcripts: List[str] = []
        self.interim_transcripts: List[str] = []
        self.all_transcripts: List[tuple[str, bool]] = []  # (text, is_final)
        self.last_transcript_time: Optional[datetime] = None
        self.silence_threshold = silence_threshold  # seconds
        self.context_window = context_window  # number of recent transcripts to include
        self.processing = False
        
    def add_transcript(self, text: str, is_final: bool = True) -> None:
        """Add a transcript and update the timestamp"""
        if text.strip():
            self.all_transcripts.append((text, is_final))
            
            if is_final:
                self.final_transcripts.append(text)
            else:
                self.interim_transcripts.append(text)
                
            self.last_transcript_time = datetime.now()
            
    def should_process(self) -> bool:
        """Check if we should process accumulated transcripts"""
        if not self.final_transcripts or self.processing:
            return False
            
        if self.last_transcript_time is None:
            return False
            
        # Check if enough silence has passed
        time_since_last = datetime.now() - self.last_transcript_time
        return time_since_last.total_seconds() >= self.silence_threshold
        
    def get_combined_transcript(self) -> str:
        """Get the combined transcript with context and clear the buffer"""
        # Get recent context (both interim and final)
        recent_context = self.all_transcripts[-self.context_window:] if len(self.all_transcripts) > self.context_window else self.all_transcripts
        
        # Combine all recent transcripts with deduplication
        combined_parts = []
        last_text = ""
        
        for text, is_final in recent_context:
            # Skip if this is a duplicate of the last text (common with interim->final)
            if text.lower() != last_text.lower():  # Case-insensitive comparison
                combined_parts.append(text)
                last_text = text
            
        combined = " ".join(combined_parts)
        
        # Clear buffers
        self.final_transcripts = []
        self.interim_transcripts = []
        self.all_transcripts = []
        self.last_transcript_time = None
        
        return combined
        
    def mark_processing(self, state: bool) -> None:
        """Mark whether we're currently processing"""
        self.processing = state

# ---------------------------------------------------------------------------
# Helper: Generate a coaching hint from a transcript
# ---------------------------------------------------------------------------

async def generate_hint(transcript: str) -> str:
    """Call GPT-4 (or specified model) to generate a short coaching hint."""
    try:
        response = await openai_client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": transcript},
            ],
            max_tokens=200,  # Increased for structured responses
            temperature=0.7,
        )
        return response.choices[0].message.content.strip()
    except OpenAIError as e:
        logger.error(f"OpenAI API error: {e}")
        # Return a more helpful fallback message
        return "The AI coach is processing... Please continue supporting your partner with curiosity and compassion."

# ---------------------------------------------------------------------------
# Bot main logic
# ---------------------------------------------------------------------------

async def run_bot(broadcast_fn: Optional[Callable] = None) -> None:
    """Join the Daily room, capture partner speech, and generate hints."""

    global broadcast_hint_fn
    broadcast_hint_fn = broadcast_fn

    logger.info("🚀 Starting AI-Coach bot (Stage 4 – STT + GPT-4 + WebSocket)…")

    # Create transcript accumulator
    accumulator = TranscriptAccumulator(silence_threshold=1.5, context_window=10)
    
    # Background task to check for accumulated transcripts
    async def process_accumulated_transcripts():
        """Background task to process accumulated transcripts after silence"""
        while True:
            await asyncio.sleep(0.5)  # Check every 500ms
            
            if accumulator.should_process():
                # Word-count check BEFORE we clear the accumulator
                words_in_buffer = sum(len(t.split()) for (t,fin) in accumulator.all_transcripts if fin)
                if words_in_buffer < MIN_WORDS_FOR_HINT:
                    logger.debug(f"Not enough words yet ({words_in_buffer}) – waiting for more context")
                    accumulator.mark_processing(False)
                    continue

                combined_transcript = accumulator.get_combined_transcript()
                if not combined_transcript:
                    accumulator.mark_processing(False)
                    continue

                accumulator.mark_processing(True)
                    
                # Log with context info
                num_parts = len(combined_transcript.split())
                logger.info(f"🗣️ Processing transcript with context ({num_parts} words): {combined_transcript[:100]}...")
                
                # Generate hint for the combined transcript
                hint = await generate_hint(combined_transcript)
                logger.info(f"💡 Broadcasting hint: {hint[:50]}...")
                
                # Send hint to facilitator via WebSocket
                if broadcast_hint_fn:
                    await broadcast_hint_fn(hint)
                else:
                    logger.warning("No broadcast function available - hint not sent")
                
                accumulator.mark_processing(False)

                if len(conversation_history) > MAX_HISTORY:
                    del conversation_history[0]

    token = os.getenv("DAILY_TOKEN")

    # If no token provided, attempt to fetch a temporary meeting token using Daily REST API
    if not token:
        daily_api_key = os.getenv("DAILY_API_KEY")
        if daily_api_key:
            logger.info("🔑 No DAILY_TOKEN provided – requesting one via Daily REST API…")
            # Extract room name from URL (last path segment)
            m = re.search(r"/([^/?#]+)$", DAILY_ROOM_URL)
            room_name = m.group(1) if m else None
            token = await _create_daily_token(daily_api_key, room_name)
            if token:
                logger.info("✅ Got temporary meeting token")
            else:
                logger.warning("Failed to fetch meeting token; attempting to join without it…")

    # Configure Daily transport (enable built-in transcription)
    transport = DailyTransport(
        room_url=DAILY_ROOM_URL,
        token=token,
        bot_name="ai-coach",
        params=DailyParams(
            audio_in_enabled=True,
            audio_out_enabled=False,  # Silent bot
            transcription_enabled=True,
        ),
    )

    # ---------------------------------------------------------------------
    # Event handlers
    # ---------------------------------------------------------------------

    @transport.event_handler("on_joined")
    async def _on_joined(_transport, _data):
        logger.info("🤖 Bot joined room – waiting for participants…")

    @transport.event_handler("on_participant_joined")
    async def _on_participant_joined(_transport, participant):
        user_id = participant.get("id")
        user_name = participant.get("user_name") or participant.get("info", {}).get(
            "userName", "unknown"
        )
        participants[user_id] = user_name
        logger.info(f"👤 Participant joined: {user_name} (ID {user_id})")

        # Start transcription capture for every participant. We will filter later.
        await transport.capture_participant_transcription(user_id)
        logger.debug(f"🎤 Started transcription capture for {user_name}")

        # ---------------- speaker-filter logic ----------------
        global partner_id
        if user_name != "ai-coach":  # ignore bot itself
            human_join_order.append(user_id)

            # Primary rule: regex match wins
            if partner_id is None and _partner_regex.match(user_name):
                partner_id = user_id
                logger.info(f"🎯 Marked {user_name} as the partner via regex (ID {user_id})")

            # Fallback: second human participant becomes partner
            elif partner_id is None and len(human_join_order) == 2:
                partner_id = user_id
                logger.info(f"🎯 No regex match – defaulting second human {user_name} as partner")
        # ------------------------------------------------------

    @transport.event_handler("on_participant_left")
    async def _on_participant_left(_transport, participant, reason):
        user_id = participant.get("id")
        user_name = participants.get(user_id, "unknown")
        logger.info(f"👋 {user_name} left ({reason})")
        # Temporarily keep bot running even after partner leaves for easier testing
        global partner_id  # allow mutation

        # If the departing participant *was* the current partner, reset state so that the next
        # human who joins becomes the new partner and we start with a clean slate. This avoids
        # situations where the bot stays alive but no longer processes transcripts after a
        # tab refresh or disconnect.

        if user_id == partner_id:
            logger.info("🔄 Partner left – clearing conversation state and waiting for new partner…")

            # Reset partner tracking so the next human to join becomes the partner again
            partner_id = None

            # Clear join order and conversation memory
            human_join_order.clear()
            conversation_history.clear()

            # Reset transcript accumulator buffers so a new session starts fresh
            accumulator.final_transcripts.clear()
            accumulator.interim_transcripts.clear()
            accumulator.all_transcripts.clear()
            accumulator.last_transcript_time = None
            accumulator.processing = False

            # Optionally notify connected facilitators that the session has ended (future)
            # if broadcast_hint_fn:
            #     await broadcast_hint_fn("Partner disconnected – waiting for new participant…")

    @transport.event_handler("on_transcription_message")
    async def _on_transcription(_transport, message):
        """Handle transcription messages from Daily (Deepgram)."""
        logger.debug(f"Transcription message received: {message}")
        text = message.get("text", "")
        user_id = message.get("participantId")
        is_final = message.get("rawResponse", {}).get("is_final", False)
        user_name = participants.get(user_id, "unknown")

        # Ignore if we haven't determined the partner yet or this is not the partner
        if partner_id is None or user_id != partner_id:
            return

        # Capture both interim and final transcripts
        if text.strip():
            if is_final:
                logger.info(f"📝 {user_name} said: {text}")
                conversation_history.append(text)
                
                # NEW: Generate and broadcast a hint immediately for each final utterance
                # This ensures facilitators receive timely suggestions even if the
                # silence-based accumulator logic fails to trigger (e.g., when the
                # partner speaks continuously without a long enough pause).
                if len(text.split()) >= MIN_WORDS_FOR_HINT:
                    try:
                        hint = await generate_hint(text)
                        logger.info(f"💡 Broadcasting (instant) hint: {hint[:50]}…")
                        if broadcast_hint_fn:
                            await broadcast_hint_fn(hint)
                        else:
                            logger.warning("broadcast_hint_fn not set – instant hint not sent")
                    except Exception as e:
                        logger.error(f"Instant hint generation failed: {e}")
            else:
                logger.debug(f"📝 {user_name} saying: {text} (interim)")
            
            # Add to accumulator with is_final flag
            accumulator.add_transcript(text, is_final)

    # ---------------------------------------------------------------------
    # Minimal pipeline – transport in/out only (transcription via event hooks)
    # ---------------------------------------------------------------------

    pipeline = Pipeline([transport.input(), transport.output()])
    global task  # so inner event handlers can reference it
    task = PipelineTask(pipeline, idle_timeout_secs=600)

    # Ensure Pipecat task uses the current event loop (avoids TaskManager bug)
    task.set_event_loop(asyncio.get_event_loop())

    # Start the background transcript processor
    asyncio.create_task(process_accumulated_transcripts())

    # Run until cancelled / partner leaves
    await task.run()

# ---------------------------------------------------------------------------
# Helper: Generate a Daily meeting token (owner/admin) if needed
# ---------------------------------------------------------------------------

async def _create_daily_token(api_key: str, room_name: str | None):
    if not room_name:
        logger.warning("Cannot parse room name from DAILY_ROOM_URL – skipping token generation")
        return None

    payload = {
        "properties": {
            "room_name": room_name,
            "is_owner": True,  # owner token grants admin + transcription
            "user_name": "ai-coach",
        },
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(
            "https://api.daily.co/v1/meeting-tokens", headers=headers, data=json.dumps(payload)
        ) as resp:
            if resp.status == 200:
                data = await resp.json()
                return data.get("token")
            text = await resp.text()
            logger.warning(f"Token request failed [{resp.status}]: {text[:200]}")
    return None

# ---------------------------------------------------------------------------
# Public helper: regenerate hint from full history (called by /regenerate-hint)
# ---------------------------------------------------------------------------
async def regenerate_hint(last_n: int = 3) -> str:
    """Generate a new hint using full conversation history (weighted to last_n)."""
    if not conversation_history:
        return "No conversation yet."

    # Build prompt: full context + emphasis on recent lines
    recent = " ".join(conversation_history[-last_n:])
    full_context = " ".join(conversation_history)
    prompt = f"PARTNER SAID (chronological): {full_context}\n\nMOST RECENT: {recent}"

    hint = await generate_hint(prompt)

    if broadcast_hint_fn:
        await broadcast_hint_fn(hint)
    return hint

# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    # Pretty console logs
    logger.remove()
    logger.add(lambda m: print(m, end=""), format="<green>{time:HH:mm:ss}</green> | {level} | {message}")

    try:
        asyncio.run(run_bot())
    except KeyboardInterrupt:
        logger.info("Interrupted by user – shutting down.") 