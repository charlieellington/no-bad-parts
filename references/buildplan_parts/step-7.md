Step 7: Final Verification and Next Steps
=========================================

**Reliability check**

Run a full session for 5-10 minutes. Confirm the WebSocket stays open, agent handles multiple hints, and Fly memory/CPU remain stable. If you plan to keep the agent running 24/7, configure a simple keep-alive or automatic restart (Fly already restarts on crash).

**Code quality**

Clean any leftover debug prints ("WS_CONNECTED", verbose Whisper logs). Ensure no API keys or tokens are accidentally printed. Add a short README describing how to generate Daily tokens and start the agent.

**Documentation clarity**

The POC uses:
- **Speech-to-Text:** OpenAI's Whisper API (`whisper-1`) via `OpenAISTTService` - requires `OPENAI_API_KEY`
- **LLM:** GPT-4 for production demos, GPT-3.5-turbo for development/testing
- **Starting point:** Modified `pipecat-cloud-simple-chatbot` example with TTS removed

**Possible improvements (post-POC)**
• Add audio output (TTS) later—Pipecat already supports TTS sinks, e.g. Cartesia.
• Persist transcripts/hints for session summaries.
• Replace Whisper API with Deepgram streaming STT for lower latency (Pipecat one-liner).
• Maintain a short context window (previous 3 utterances) before each GPT call for richer hints.
• Secure WebSocket with JWT and restrict room to authenticated users.

**Backup & monitoring**

Keep Fly and Vercel dashboards open during demos; Fly's real-time logs help diagnose any agent crash. Fly automatically restarts unhealthy instances; Vercel serves static Next.js reliably.

By following each incremental stage—Daily video embed, WebSocket bridge, audio capture, STT, GPT hinting, and dual-cloud deployment—you eliminated large debugging marathons. You now have a clean, working codebase that fulfils the project goal: a Pipecat-powered agent on Fly.io providing live IFS coaching hints inside a Daily video call shown through a Vercel-hosted UI. 