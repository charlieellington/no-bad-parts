---
title: Front End Build Plan
---

# Front End Build Plan

### STEP 4 – FRONT-END (detailed, copy-paste friendly)

_Assumes you’re now on the `video-poc` branch inside the **private** `no-bad-parts-landing` repo._

---

#### 4.1 Install LiveKit deps & restart dev server

```bash
# still inside repo root
npm i @livekit/components-react @livekit/client
npm run dev          # or `pnpm dev` / `yarn dev`
```

Open `http://localhost:3000` – existing landing page should still load.

---

#### 4.2 Add a **route group** for all session pages

Create a new folder:

```
app/(session)/
```

_(The parentheses tell Next.js to group routes without affecting URL paths.)_

---

#### 4.3 Shared LiveKit wrapper

Create `app/livekit-wrapper.tsx`

```tsx
// simple provider for any child route
"use client";
import { LiveKitRoom } from "@livekit/components-react";

export default function LKWrapper({
  token,
  children,
}: {
  token: string;
  children: React.ReactNode;
}) {
  return (
    <LiveKitRoom
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LK_URL}
      connectOptions={{ autoSubscribe: true }}
      style={{ height: "100%" }}
    >
      {children}
    </LiveKitRoom>
  );
}
```

---

#### 4.4 `/partner` page (self-view only)

`app/(session)/partner/page.tsx`

```tsx
"use client";
import LKWrapper from "@/livekit-wrapper";
import { ParticipantTile } from "@livekit/components-react";

export default function Partner() {
  return (
    <LKWrapper token={process.env.NEXT_PUBLIC_PARTNER_TOKEN!}>
      <div className="flex h-screen items-center justify-center bg-black">
        <ParticipantTile isLocal />
      </div>
    </LKWrapper>
  );
}
```

_Check:_ visit **`/partner`** → you should see your webcam tile.

---

#### 4.5 `/facilitator` page (video + hint stream)

`app/(session)/facilitator/page.tsx`

```tsx
"use client";
import LKWrapper from "@/livekit-wrapper";
import {
  ParticipantTile,
  useRoomContext,
} from "@livekit/components-react";
import { useEffect, useState } from "react";

function HintStream() {
  const { room } = useRoomContext();
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    const handle = room.on("dataReceived", ({ payload, participant }) => {
      if (participant?.identity?.startsWith("agent")) {
        setLines((l) => [...l, new TextDecoder().decode(payload)]);
      }
    });
    return () => {
      room.off("dataReceived", handle);
    };
  }, [room]);

  return (
    <pre className="h-screen overflow-auto bg-zinc-900 p-4 text-sm text-zinc-100">
      {lines.join("\n")}
    </pre>
  );
}

export default function Facilitator() {
  return (
    <LKWrapper token={process.env.NEXT_PUBLIC_FACILITATOR_TOKEN!}>
      <div className="grid h-screen grid-cols-[2fr_1fr] bg-black">
        <ParticipantTile isLocal />
        <HintStream />
      </div>
    </LKWrapper>
  );
}
```

_Check:_ open **`/facilitator`** – you’ll see your video left, blank panel right (hints appear once the Agent is running).

---

#### 4.6 Temporary placeholder feed (for Day-1 demo)

If you need scrolling text before wiring the real Agent:

```bash
# tiny Node script (save as dummy-hints.js)
const WebSocket = require("ws");
const ws = new WebSocket(process.env.NEXT_PUBLIC_LK_URL, {
  headers: { Authorization: process.env.NEXT_PUBLIC_FACILITATOR_TOKEN },
});
ws.on("open", () => {
  let i = 1;
  setInterval(() => {
    const msg = `Hint ${i++}: breathe and stay curious.`;
    ws.send(msg); // LiveKit server will broadcast to same room
  }, 5000);
});
```

`node dummy-hints.js` in another terminal → text appears every 5 s in the panel.

_(Comment out once the real Agent is connected.)_


---
### 4.7 Front-end tweak: **soft brand bar** at the top of every session page

You can keep each route file unchanged and add a tiny header right in the wrapper.

---

#### 1 Update `app/livekit-wrapper.tsx`

```tsx
"use client";
import { LiveKitRoom } from "@livekit/components-react";

export default function LKWrapper({
  token,
  children,
}: {
  token: string;
  children: React.ReactNode;
}) {
  return (
    <LiveKitRoom
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LK_URL}
      connectOptions={{ autoSubscribe: true }}
      style={{ height: "100%" }}
    >
      {/* brand bar */}
      <header className="h-10 w-full bg-zinc-900 px-4 flex items-center text-sm tracking-wide text-white/90">
        No&nbsp;Bad&nbsp;Parts&nbsp;•&nbsp;alpha
      </header>

      {/* main content fills the rest */}
      <main className="h-[calc(100vh-2.5rem)]">{children}</main>
    </LiveKitRoom>
  );
}
```

- Tailwind classes keep it tiny: `bg-zinc-900` dark bar, `text-white/90` soft white text.
- `h-10` (2.5 rem) bar; `calc(100vh-2.5rem)` lets the video grid still fill remaining space.


---

#### 4.8 Failure toast (optional polish)

Add to `HintStream` top:

```tsx
if (!room.connected) {
  return <div className="p-4 text-red-500">AI offline — continue as normal.</div>;
}
```

