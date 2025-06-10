Gotchas & Tips
--------------

* Safari may block mic/camera inside iframes unless the `allow` attribute is exactly `"camera; microphone; fullscreen"`.
* Browsers refuse insecure WebSockets; remember `wss://` in production (Vercel → Fly) and `ws://` locally.
* Pipecat's Daily connector must run in its own asyncio task; start it in a FastAPI `startup` event.
* GPT-4o-mini has lower RPM than GPT-3.5 — long demos may hit rate limits; request quota if needed.
* Fly builds are ephemeral; if Pipecat writes temp files, set `TMPDIR=/tmp`.
* Vercel's monorepo detection might attempt to build the agent; add `vercel.json` ignore if that happens. 