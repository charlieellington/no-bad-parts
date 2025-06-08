#!/bin/bash

# Agent setup script for No Bad Parts Collective
# Sets up Python agent from source instead of Docker image

set -e

echo "Setting up No Bad Parts agent from source..."

# Navigate to the no-bad-parts directory
cd "$(dirname "$0")/.."

# Create agent directory if it doesn't exist
mkdir -p agent

# Copy environment variables
if [ -f ".agent.env" ]; then
    cp .agent.env agent/.env
    echo "✓ Copied .agent.env to agent/.env"
else
    echo "❌ .agent.env file not found!"
    exit 1
fi

# Create agent.py if it doesn't exist
if [ ! -f "agent/agent.py" ]; then
    cat > agent/agent.py << 'EOF'
from dotenv import load_dotenv
from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions
from livekit.plugins import openai, silero

load_dotenv()

PARTNER_ID = "partner"  # must match .env

class SilentCoach(Agent):
    def __init__(self) -> None:
        super().__init__(instructions="You are Silent Coach – see SYSTEM_PROMPT env var.")

async def entrypoint(ctx: agents.JobContext):
    session = AgentSession(
        stt=silero.VAD.load(),  # we only need VAD; Whisper runs in LiveKit backend
        llm=openai.LLM(model="gpt-4o-mini"),
        tts=None,  # coach stays silent
        vad=silero.VAD.load(),
    )

    await session.start(
        room=ctx.room,
        agent=SilentCoach(),
        room_input_options=RoomInputOptions(),
    )

    await ctx.connect()

if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))
EOF
    echo "✓ Created agent.py"
fi

# Create requirements.txt if it doesn't exist
if [ ! -f "agent/requirements.txt" ]; then
    cat > agent/requirements.txt << 'EOF'
livekit-agents[openai,silero,deepgram,cartesia,turn-detector]~=1.0
python-dotenv
EOF
    echo "✓ Created requirements.txt"
fi

# Set up virtual environment
cd agent

if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
    echo "✓ Created virtual environment"
fi

echo "Activating virtual environment and installing packages..."
source venv/bin/activate

# Install packages
pip install -r requirements.txt

# Download model files
echo "Downloading model files..."
python agent.py download-files

echo ""
echo "🎉 Agent setup complete!"
echo ""
echo "To run the agent:"
echo "  cd $(pwd)"
echo "  source venv/bin/activate"
echo "  python agent.py dev"
echo "" 