import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import { ReactNode } from 'react';

interface LKWrapperProps {
  token: string;
  children: ReactNode;
}

export default function LKWrapper({ token, children }: LKWrapperProps) {
  return (
    <div className="flex h-screen flex-col">
      {/* Brand Bar */}
      <header className="flex h-12 items-center justify-center bg-zinc-900 text-zinc-100">
        <h1 className="text-sm font-medium">No Bad Parts • alpha</h1>
      </header>
      
      {/* LiveKit Room Container */}
      <div className="flex-1 overflow-hidden">
        <LiveKitRoom
          token={token}
          serverUrl={process.env.NEXT_PUBLIC_LK_URL}
          connect={true}
          video={true}
          audio={true}
        >
          <RoomAudioRenderer />
          {children}
        </LiveKitRoom>
      </div>
    </div>
  );
} 