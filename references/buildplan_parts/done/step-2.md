Step 2: Embed Daily Prebuilt Video UI
====================================

Daily's **Prebuilt** video call UI lets us drop a full-featured video chat into our app with minimal effort. Instead of building a custom interface (or using LiveKit), we'll embed Daily's ready-made call interface so we get features like camera/mic controls, screen sharing, and chat out-of-the-box.

**Documentation:** https://docs.daily.co/guides/products/prebuilt

> **Important:** Make sure we're using the Prebuilt kit here - this gives us a complete video UI with no custom code needed.

## Create a Daily Room

First, create a new video room in the Daily dashboard:

1. In your Daily dashboard, click **"Create room"**
2. Name it `ifs-coaching-demo` (or any slug you like)
3. For dev speed, set **"Room has no owner / no token required"** (you can tighten security later)
4. Note the full call URL, e.g. `https://nobadparts.daily.co/ifs-coaching-demo-2p9g7utkz9`

The room URL will look like:
```
https://nobadparts.daily.co/ifs-coaching-demo-2p9g7utkz9
```

> **Security Note:** An open room (no token required) means anyone with the URL can join. This speeds up development, but use **Daily meeting tokens** or designate an owner in production for controlled access. Daily's REST API supports generating tokens with `is_owner` flags for host privileges.

## Environment Setup

Configure the Daily room URL in your `.env.local` file:

```bash
NEXT_PUBLIC_DAILY_URL=https://nobadparts.daily.co/ifs-coaching-demo
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

**Important:** In Next.js, only environment variables prefixed with `NEXT_PUBLIC_` are exposed to browser-side code. Restart your dev server after adding these variables.

## Update the Partner Page

The Partner page embeds Daily Prebuilt for the user/trainee. We'll use an iframe approach for minimal code.

**File:** `pages/session/partner.tsx`

```tsx
export default function Partner() {
  return (
    <iframe
      src={`${process.env.NEXT_PUBLIC_DAILY_URL}?username=partner`}
      allow="camera; microphone; fullscreen; display-capture"
      className="w-full h-screen border-0"
    />
  );
}
```

**Key Points:**
- `?username=partner` - Sets the participant name automatically (avoids "Guest" label)
- `allow` attribute - Grants necessary permissions for cross-origin iframe:
  - `camera` - Access to camera
  - `microphone` - Access to mic
  - `fullscreen` - Allow maximizing video
  - `display-capture` - Enable screen sharing
- Tailwind classes make iframe fill viewport (`w-full h-screen`)

## Create/Refactor the Facilitator Page

The Facilitator page shows both the video call and a sidebar for AI coaching hints.

**File:** `pages/session/facilitator.tsx`

```tsx
import { useEffect, useState } from "react";

export default function Facilitator() {
  const [hints, setHints] = useState<string[]>([]);

  useEffect(() => {
    // Open WebSocket connection to the AI coach server
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!);
    ws.onmessage = (e) => setHints((h) => [...h, e.data]);
    return () => ws.close();
  }, []);

  return (
    <div className="flex h-screen">
      {/* Video column */}
      <iframe
        src={`${process.env.NEXT_PUBLIC_DAILY_URL}?username=facilitator`}
        allow="camera; microphone; fullscreen; display-capture"
        className="flex-1 border-0"
      />
      {/* Hint column */}
      <aside className="w-96 p-4 overflow-y-auto bg-gray-50">
        <h2 className="text-lg font-semibold mb-3">Coach Hints</h2>
        {hints.map((txt, i) => (
          <p key={i} className="mb-2 text-sm leading-snug">{txt}</p>
        ))}
      </aside>
    </div>
  );
}
```

**Layout Details:**
Desktop:
- Flex layout splits screen into video (left) and hints (right)
- Video iframe uses `flex-1` to fill remaining space
- Sidebar has fixed width (`w-96`) with scrollable content
Mobile:
- Flex layout for mobile splits the screen into video (top) and hints (bottom)
Other: 
- WebSocket connection prepares for receiving AI hints (implemented in later steps, not now)



## Agent Presence Configuration

The AI agent will join the room as a participant (username `ai-coach`) with camera disabled and audio output muted. This keeps wiring straightforward and provides visual confirmation during tests.

### Hiding the Agent's Video Tile

During development, seeing the `ai-coach` tile confirms the agent joined successfully. For production, hide it with CSS:

```css
/* Add to your global CSS file */
iframe [data-participant-id="ai-coach"] { 
  display: none; 
}
```

**Alternative:** Daily supports **hidden participants** via room configuration. Set `enable_hidden_participants: true` and use meeting tokens where the agent joins as a non-owner. This completely hides the agent from the UI.

## Visual Test

1. Run your development server:
   ```bash
   pnpm dev
   ```

2. Open two browser tabs:
   - `http://localhost:3000/session/partner` - Partner's view
   - `http://localhost:3000/session/facilitator` - Facilitator's view

3. Verify the following:
   - **Permissions:** Both pages prompt for camera/mic access
   - **Video & Audio:** Participants can see/hear each other
   - **Names:** "partner" and "facilitator" labels appear in the UI
   - **Layout:** Facilitator shows video on left, empty hints sidebar on right
   - **No LiveKit:** Console shows no LiveKit errors or imports

4. Test features:
   - Camera/mic toggle buttons work
   - Screen sharing is available (thanks to `display-capture` permission)
   - Resize browser to verify responsive layout

## Cleanup and Best Practices

### Remove LiveKit Dependencies
If your project had LiveKit packages, uninstall them:
```bash
npm uninstall @livekit/components-react livekit-client
# or
pnpm remove @livekit/components-react livekit-client
```

Delete any LiveKit configuration files or imports.

### Daily Prebuilt Configuration Options

**Prejoin Lobby:** Daily shows a device preview by default. Control this in the Daily dashboard:
- Toggle **"Enable prejoin UI"** at room or domain level
- With `?username=` in URL, name prompt is skipped but device preview remains

**Permissions Best Practices:**
- Always include all needed permissions in the `allow` attribute
- Modern browsers require explicit permissions for cross-origin iframes
- Safari iOS requires user interaction before audio autoplay (Daily handles this)

### Cross-Browser Testing
Test in multiple browsers to ensure compatibility:
- **Chrome/Edge:** Full support with our `allow` attributes
- **Firefox:** Same permissions model as Chrome
- **Safari:** Supports same attributes, check iOS audio behavior

### Responsive Design Considerations
Our Tailwind utilities ensure responsive behavior:
- Partner page: Full screen video (`h-screen`)
- Facilitator page: Flexible video + fixed sidebar
- No unexpected scrollbars (except sidebar overflow)

### Production Considerations

1. **Security:** Implement meeting tokens for controlled access
   - Generate tokens via Daily REST API
   - Set `is_owner` flag for host privileges
   - **Documentation:** https://docs.daily.co/reference/rest-api/meeting-tokens

2. **Performance:** Daily Prebuilt handles:
   - Media stream optimization
   - Network adaptation
   - Device selection
   - Up to 2 simultaneous screen shares

3. **Customization:** While using Prebuilt as-is for now, Daily offers:
   - Custom themes via CSS variables
   - Logo/branding options
   - Layout configurations

## Summary

By completing Step 2, we've successfully:
- ✅ Replaced LiveKit with Daily Prebuilt UI
- ✅ Created separate Partner and Facilitator views
- ✅ Prepared WebSocket structure for AI hints
- ✅ Enabled all video features (camera, mic, screen share)
- ✅ Set up responsive layouts with Tailwind

The video communication layer is now complete with minimal code. Next steps will wire up the WebSocket and backend (using Pipecat and Whisper/GPT) so the facilitator's hint panel shows real-time AI coaching guidance.

## References

1. **Daily.co Documentation** - *Embedding Daily Prebuilt*: https://docs.daily.co/guides/products/prebuilt
2. **Daily.co Blog** - *Getting to Know Daily Prebuilt UI* (integration examples and features)
3. **AddPipe Blog** - *Camera and Microphone Access in Cross-Origin iframes* (using the `allow` attribute)
4. **Next.js Documentation** - *Environment Variables*: https://nextjs.org/docs/basic-features/environment-variables
5. **Daily API Reference** - *Hidden Participants*: https://docs.daily.co/reference/rest-api/rooms/config 