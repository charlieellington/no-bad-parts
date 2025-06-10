Step 6: Deployment to Fly.io (Agent) and Vercel (UI)
===================================================

With the agent and front-end working locally, deploy them to cloud services, keeping them separate as planned—Python agent on Fly.io, Next.js app on Vercel. Real users will then access the demo via two URLs (one for Partner, one for Facilitator) while the agent runs persistently in the background.

**Reference:** https://github.com/daily-co/pipecat-cloud-simple-chatbot

## Deploying the FastAPI Agent to Fly.io

### 1. Containerize the Agent with Docker

Ensure you have a Dockerfile for the agent. If the base repo already includes one (e.g., `agent/Dockerfile` or `server/Dockerfile` in the Pipecat example), review it. It must install Python deps and launch FastAPI/uvicorn. If none exists, create:

```dockerfile
# agent/Dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY agent/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the agent source code
COPY agent/ .

# Set the port (FastAPI/Uvicorn will listen on this port)
ENV PORT=8000

# Expose the port (optional but recommended for documentation)
EXPOSE 8000

# Launch the FastAPI server with Uvicorn
CMD ["uvicorn", "agent.server:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Note:** Adjust paths/module names to match your layout—e.g., `agent/server.py` hosts the FastAPI app. The Dockerfile uses the official slim Python image and installs requirements before copying source code, following Docker caching best practices.

### 2. Initialize the Fly.io App

Navigate into the agent directory and use the Fly CLI to launch a new app:

```bash
cd agent
flyctl launch
```

During `flyctl launch`:
- Choose an app name (becomes your Fly subdomain)
- Select the nearest region (e.g., `fra` for Frankfurt in EU)
- This generates a `fly.toml` file with default configuration

The generated `fly.toml` will contain:
```toml
[[services]]
  internal_port = 8000
  protocol = "tcp"
  [[services.ports]]
    port = 80
    handlers = ["http"]
  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
```

**Important:** Fly automatically:
- Maps internal port 8000 to external ports 80/443
- Terminates TLS at the edge
- Supports WebSockets over TLS out of the box
- No special code needed for HTTPS/WSS

### 3. Set Environment Variables (Fly Secrets)

Use the Fly CLI to set required secrets:

```bash
flyctl secrets set \
  OPENAI_API_KEY=<your-openai-key> \
  DAILY_API_KEY=<your-daily-api-key> \
  DAILY_ROOM_URL=https://nobadparts.daily.co/ifs-coaching-demo \
  DAILY_TOKEN=<long-lived-room-token-or-blank> \
  SYSTEM_PROMPT="$(cat prompt.txt)"
```

**Environment Variables Explained:**
- **OPENAI_API_KEY**: For Whisper STT and GPT-4 API access
- **DAILY_API_KEY**: Your Daily API key from the dashboard (required even for public rooms)
- **DAILY_ROOM_URL**: Full Daily room URL including https://
- **DAILY_TOKEN**: JWT token if room requires auth
  - **Development**: Leave blank for public rooms
  - **Production**: Generate a long-lived token (see below)
- **SYSTEM_PROMPT**: The IFS coaching prompt (loaded from `prompt.txt`)

#### Daily Authentication Quick Reference

| Environment | Room Setting | DAILY_TOKEN | DAILY_API_KEY |
|------------|--------------|-------------|---------------|
| Development | Public | Leave empty | Required |
| Production | Private | Long-lived JWT | Required |

**Development Setup:**
```bash
# agent/.env (local development)
DAILY_API_KEY=your_api_key_here
DAILY_TOKEN=  # Leave empty for public rooms
```

**Production Setup:**
```bash
# Fly.io secrets
flyctl secrets set DAILY_API_KEY=your_api_key_here
flyctl secrets set DAILY_TOKEN=eyJhbGciOiJIUzI1NiIs...  # Generated token
```

#### Generating a Production Daily Token

For production deployment, secure your Daily room and generate a long-lived token:

**Step 1: Make your Daily room private**
1. Log into [Daily dashboard](https://dashboard.daily.co)
2. Navigate to your room settings
3. Change privacy from "public" to "private"
4. Save changes

**Step 2: Generate the token**

Option A - Using cURL:
```bash
curl --request POST \
  --url https://api.daily.co/v1/meeting-tokens \
  --header 'Authorization: Bearer YOUR_DAILY_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "properties": {
      "room_name": "ifs-coaching-demo",
      "exp": 1893456000,
      "is_owner": false,
      "user_name": "ai-coach",
      "enable_recording": false
    }
  }'
```

Option B - Using Node.js:
```javascript
const createBotToken = async () => {
  const response = await fetch('https://api.daily.co/v1/meeting-tokens', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_DAILY_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        room_name: 'ifs-coaching-demo',
        exp: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60), // 90 days
        is_owner: false,
        user_name: 'ai-coach',
        enable_recording: false
      }
    })
  });
  const data = await response.json();
  console.log('Bot token:', data.token);
};
```

**Step 3: Set the token on Fly.io**
```bash
flyctl secrets set DAILY_TOKEN=<generated-token-here>
flyctl deploy  # Redeploy to use new token
```

**Token Parameters:**
- `room_name`: Must match your Daily room name exactly
- `exp`: Unix timestamp for expiration (set 30-90 days out)
- `is_owner`: false (bot doesn't need owner privileges)
- `user_name`: "ai-coach" (matches bot name in code)
- `enable_recording`: false (bot doesn't record)

**Tips:**
- Variable names are case-sensitive
- Use `$(cat file)` for multi-line prompts
- Secrets are encrypted and only available at runtime
- Update secrets with `flyctl secrets set` then redeploy

### 4. Deploy the Agent

```bash
flyctl deploy
```

This command:
- Builds the Docker image (locally or in Fly's builder)
- Releases it to Fly
- Allocates a VM and runs your container

**Verify deployment:**
```bash
flyctl logs
```

Look for:
- "Uvicorn running on 0.0.0.0:8000"
- "Agent server running"
- "Joined Daily room ifs-coaching-demo"

**Troubleshooting:**
- Use `flyctl status` to check app health
- Common issues: missing/misnamed secrets, startup errors
- Fix locally, then rebuild and deploy

### 5. Networking & WebSocket Configuration

Your Fly app will be reachable at:
- **Base URL:** `https://<your-app-name>.fly.dev`
- **WebSocket:** `wss://<your-app-name>.fly.dev/ws`

**Key Points:**
- Always use `wss://` (secure WebSockets) in production
- Browsers block insecure `ws://` from HTTPS pages
- Fly handles TLS termination automatically
- No additional WebSocket configuration needed

**Test the deployment:**
```bash
flyctl open /   # opens base URL in browser
```

Or test WebSocket with `wscat`:
```bash
wscat -c wss://<your-app>.fly.dev/ws
```

## Deploying the Next.js Front-End to Vercel

### 1. Prepare Repository for Vercel

Since this is a monorepo (Next.js + agent code), configure Vercel to only deploy the Next.js app:

**Option A: Configure Root Directory**
- In Vercel dashboard: **Project Settings → General → Root Directory**
- Set to the folder containing Next.js (leave blank if at repo root)
- Vercel will ignore other folders (like `agent/`)

**Option B: Use `.vercelignore`**
Create `.vercelignore` at repo root:
```
agent/**
*.py
Dockerfile
fly.toml
```

### 2. Import and Deploy on Vercel

Connect your repository to Vercel:
```bash
npm i -g vercel
vercel deploy --prod
```

Or push to main branch if auto-deploy is configured.

**Ensure:**
- Vercel detects Next.js framework
- Build only processes front-end code
- No Python/agent files are included

### 3. Configure Environment Variables on Vercel

In Vercel dashboard, add these environment variables:

```env
NEXT_PUBLIC_WS_URL=wss://<your-fly-app>.fly.dev/ws
NEXT_PUBLIC_DAILY_URL=https://nobadparts.daily.co/ifs-coaching-demo
```

**Optional (if using waitlist/Supabase):**
```env
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

**Important:**
- Must use `NEXT_PUBLIC_` prefix for browser-accessible vars
- Always use `wss://` for WebSocket URL (not `ws://`)
- Redeploy after adding/changing env vars

### 4. Finalize Deployment

After successful build, Vercel provides URLs:
- Production: `https://<project>.vercel.app`
- Partner page: `/session/partner`
- Facilitator page: `/session/facilitator`

## Production Testing and Validation

### 1. Open Both Session Pages

In separate browsers/incognito windows:
- **Facilitator:** `https://<project>.vercel.app/session/facilitator`
- **Partner:** `https://<project>.vercel.app/session/partner`

### 2. Verify Video Call
- Both pages load Daily Prebuilt iframe
- Participants join the same room
- Video/audio streams work correctly

### 3. Confirm Agent Presence
Check Fly logs:
```bash
flyctl logs
```

Look for:
- "Joined Daily room as ai-coach"
- Agent appears in participant list (may be hidden via CSS)

### 4. Test End-to-End Flow
1. Partner speaks into microphone
2. Agent captures audio → Whisper STT → GPT-4
3. Facilitator sees hints appear in sidebar
4. Verify timing (should be near real-time, ~1-2 seconds)

### 5. Verify WebSocket Connection

In Facilitator browser DevTools:
- Network tab shows active WebSocket to `wss://<app>.fly.dev/ws`
- No mixed content warnings
- Messages flowing when Partner speaks

### 6. Troubleshooting Checklist

**If no hints appear:**

✓ **Environment Variables**
- Verify `NEXT_PUBLIC_WS_URL` in Vercel matches Fly app exactly
- Ensure it starts with `wss://` (not `ws://`)
- Check for typos in domain name

✓ **Agent Health**
```bash
flyctl logs --tail
```
- Look for OpenAI API errors (quota/rate limits)
- Check Daily room join failures
- Verify all secrets are set correctly

✓ **Daily Token Issues**
- **Development**: Ensure room is public and `DAILY_TOKEN` is blank/empty
- **Production**: If room is private, ensure `DAILY_TOKEN` is valid
  - Token must not be expired (check `exp` claim)
  - Token must have correct `room_name`
  - Generate new long-TTL token if needed:
```bash
# Generate new token using methods above, then:
flyctl secrets set DAILY_TOKEN=<new-token>
flyctl deploy
```

✓ **CORS/Network**
- FastAPI WebSocket accepts all origins by default
- If custom CORS middleware added, ensure it allows Vercel domain

## Best Practices and Monitoring

### Logging and Monitoring
- **Fly.io:** Use `flyctl logs` for real-time logs
- **Vercel:** Check function logs in dashboard
- Consider adding structured logging for production

### Environment Management
- Changes require redeployment:
  - Fly: `flyctl secrets set` → `flyctl deploy`
  - Vercel: Update env vars → trigger new build
- Keep env vars documented in team wiki

### Scaling Considerations
- **Single Room:** Current setup handles one coaching session
- **Multiple Rooms:** Would need agent per room or room routing
- **Performance:** Monitor Whisper/GPT resource usage
- **Fly Scaling:** Can add more VMs or increase VM size
- **Important:** Run only one instance for the demo: `fly scale count 1`

### Security Hardening
- **Production Daily Tokens:** Implement proper auth
- **Rate Limiting:** Add to FastAPI endpoints
- **HTTPS Only:** Enforced by default on both platforms
- **API Keys:** Rotate regularly, use least privilege

### Cost Optimization
- **Fly.io:** Free tier includes 3 VMs
- **Vercel:** Free tier generous for demos
- **OpenAI:** Monitor usage, consider GPT-3.5-turbo for cost savings during development
- **Daily:** Check participant minutes in dashboard

## Summary

You now have a fully deployed, cloud-hosted IFS coaching demo:

✅ **Agent on Fly.io**
- Persistent Python service
- Joins Daily room automatically
- Processes audio → generates hints
- Serves WebSocket for real-time updates

✅ **UI on Vercel**
- Partner and Facilitator pages
- Daily Prebuilt video embedded
- WebSocket client for hints
- Production-ready with HTTPS

✅ **Complete Pipeline**
- Partner speaks → Agent listens
- Whisper STT → GPT-4 hints
- WebSocket → Facilitator UI
- All secure with TLS/WSS

The system is ready for testing with real users. Share the two URLs and gather feedback on the coaching experience.

## References

1. **Fly.io Documentation** - *Deploying FastAPI*: https://fly.io/docs/languages-and-frameworks/python/
2. **Fly.io Documentation** - *Managing Secrets*: https://fly.io/docs/reference/secrets/
3. **Vercel Documentation** - *Monorepos*: https://vercel.com/docs/monorepos
4. **Vercel Documentation** - *Environment Variables*: https://vercel.com/docs/environment-variables
5. **Next.js Documentation** - *Environment Variables*: https://nextjs.org/docs/basic-features/environment-variables
6. **Daily REST API** - *Meeting Tokens*: https://docs.daily.co/reference/rest-api/meeting-tokens
7. **Pipecat Cloud Example** - *Simple Chatbot*: https://github.com/daily-co/pipecat-cloud-simple-chatbot 