import { useLocalParticipant, VideoTrack, useRoomContext } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useState } from 'react';

export default function LocalCameraTile() {
  const { localParticipant, cameraTrack, microphoneTrack } = useLocalParticipant();
  const room = useRoomContext();
  const [permissionStatus, setPermissionStatus] = useState<string>('');
  
  const requestPermissions = async () => {
    try {
      setPermissionStatus('Requesting permissions...');
      if (localParticipant) {
        await localParticipant.setCameraEnabled(true);
        await localParticipant.setMicrophoneEnabled(true);
        setPermissionStatus('Permissions granted');
      }
    } catch (err) {
      setPermissionStatus(`Error: ${err}`);
      console.error('Permission error:', err);
    }
  };
  
  // Show loading state while connecting
  if (!localParticipant) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-900 text-zinc-400">
        <div className="text-center">
          <p>Connecting to room...</p>
          <p className="text-xs mt-2">Room state: {room?.state || 'unknown'}</p>
        </div>
      </div>
    );
  }
  
  // Show permission request state
  if (!cameraTrack) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-900 text-zinc-400">
        <div className="text-center space-y-4">
          <p>Camera not active</p>
          <p className="text-xs">Identity: {localParticipant.identity}</p>
          <p className="text-xs">Room: {room?.name}</p>
          <p className="text-xs">Connection: {room?.state}</p>
          <button 
            onClick={requestPermissions}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
          >
            Request Camera & Mic
          </button>
          {permissionStatus && <p className="text-xs text-yellow-400">{permissionStatus}</p>}
        </div>
      </div>
    );
  }
  
  return (
    <VideoTrack
      trackRef={{ 
        participant: localParticipant, 
        source: Track.Source.Camera,
        publication: cameraTrack
      }}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );
} 