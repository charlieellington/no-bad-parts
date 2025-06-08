from dotenv import load_dotenv
from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions
from livekit.plugins import openai, silero
from livekit import rtc

load_dotenv('.agent.env')

PARTNER_ID = "partner"  # must match .env

class DataPacketTTS:
    """Fake TTS that sends data packets instead of audio"""
    def __init__(self, room):
        self.room = room
        self.capabilities = type('obj', (object,), {'streaming': False})()
    
    async def synthesize(self, text: str):
        """Send text as data packet instead of synthesizing audio"""
        print(f"📤 Sending hint: {text[:100]}...")
        await self.room.local_participant.publish_data(
            text.encode('utf-8'),
            kind=rtc.DataPacketKind.KIND_RELIABLE
        )
        # Return empty generator since no audio frames
        return
        yield  # Never reached

class SilentCoach(Agent):
    def __init__(self) -> None:
        super().__init__(instructions="You are Silent Coach – see SYSTEM_PROMPT env var.")

async def entrypoint(ctx: agents.JobContext):
    await ctx.connect()
    
    # Only listen to audio from the participant with identity "partner"
    room_input_options = RoomInputOptions(
        participant_identity=PARTNER_ID,  # Only listen to "partner"
        audio_enabled=True,  # Enable audio input
        video_enabled=False,  # Disable video input for this agent
    )
    
    session = AgentSession(
        stt=openai.STT(),  # Whisper via OpenAI
        llm=openai.LLM(model="gpt-4o-mini"),
        tts=DataPacketTTS(ctx.room),  # Send data instead of audio
        vad=silero.VAD.load(),
    )

    await session.start(
        room=ctx.room,
        agent=SilentCoach(),
        room_input_options=room_input_options,
    )

    print("🔈 linked participant →", room_input_options.participant_identity)

if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint)) 