---
title: Scratchpad
---

# Scratchpad

## Project Status: No Bad Parts Collective - IFS Coaching Demo

### Completed Tasks

#### Step 1: UI Skeleton (✅ COMPLETED)
- **Created session pages** using Next.js Pages Router:
  - `pages/session/partner.tsx` - Daily iframe placeholder with username=partner
  - `pages/session/facilitator.tsx` - Daily iframe + empty "Coach Hints" panel with username=facilitator
- **Verified build** - Both pages compile successfully with zero props/state
- **Layout implemented** - Facilitator page uses flex layout with video (left) and hints sidebar (right)
- **Daily integration ready** - Both pages use environment variable for Daily URL with fallback

### Next Steps
- Add agent skeleton (FastAPI server with health check and WebSocket endpoint)
- Set up environment files (.env.local and agent/.env)
- Remove any existing LiveKit dependencies

### Current Project Structure
- Frontend: Next.js with App Router (`app/`) and Pages Router (`pages/`)
- Session routes: Using Pages Router for `/session/partner` and `/session/facilitator`
- Styling: Tailwind CSS with shadcn/ui components
- Environment: Development mode, local build successful

### Notes
- Project builds successfully (✓ Compiled successfully in 7.0s)
- Both session pages prerender as static content
- Daily iframe permissions configured for camera, microphone, fullscreen, display-capture

