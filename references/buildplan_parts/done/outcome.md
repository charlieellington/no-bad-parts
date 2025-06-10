Outcome
-------

By the end of the build plan you will have:

- Two URLs -- `/session/partner` and `/session/facilitator` -- running on Vercel.
- A Fly-hosted agent at `wss://<app>.fly.dev/ws` that silently listens, thinks, and pushes hints.
- Incremental test checkpoints so each layer (video, WebSocket, STT, LLM) is verified before moving on, avoiding large debugging sessions. 