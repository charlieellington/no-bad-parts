import LKWrapper from '@/components/livekit-wrapper';
import LocalCameraTile from '@/components/local-camera-tile';
import { useRoomContext } from '@livekit/components-react';
import { useEffect, useState } from 'react';
import { RoomEvent } from 'livekit-client';

function HintStream() {
  const room = useRoomContext();
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    const listener = (payload: Uint8Array, participant?: any) => {
      // TEMP DEBUG: Log every packet that arrives
      console.log('🔍 DataReceived →', {
        identity: participant?.identity,
        kind: participant?.kind,
        message: new TextDecoder().decode(payload)
      });
      
      if (participant?.kind === 'agent') {
        setLines((l) => [...l, new TextDecoder().decode(payload)]);
      }
    };
    room.on(RoomEvent.DataReceived, listener);
    return () => {
      room.off(RoomEvent.DataReceived, listener);
    };
  }, [room]);

  if (!room.canPlaybackAudio) {
    return <div className="p-4 text-red-500">AI offline — continue as normal.</div>;
  }

  return (
    <pre className="h-full overflow-auto bg-zinc-900 p-4 text-sm text-zinc-100">
      {lines.length === 0 ? 'Waiting for AI hints...' : lines.join('\n')}
    </pre>
  );
}

export default function Facilitator() {
  return (
    <LKWrapper token={process.env.NEXT_PUBLIC_FACILITATOR_TOKEN!}>
      <div className="grid h-full grid-cols-[2fr_1fr] bg-black">
        <LocalCameraTile />
        <HintStream />
      </div>
    </LKWrapper>
  );
} 