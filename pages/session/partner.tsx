import LKWrapper from '@/components/livekit-wrapper';
import LocalCameraTile from '@/components/local-camera-tile';

export default function Partner() {
  return (
    <LKWrapper token={process.env.NEXT_PUBLIC_PARTNER_TOKEN!}>
      <div className="flex h-full items-center justify-center bg-black">
        <LocalCameraTile />
      </div>
    </LKWrapper>
  );
} 