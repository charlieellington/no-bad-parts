export default function Partner() {
  const dailyUrl = process.env.NEXT_PUBLIC_DAILY_URL || 'https://nobadparts.daily.co/ifs-coaching-demo';
  
  return (
    <div className="w-full h-screen">
      <iframe
        src={`${dailyUrl}?username=partner`}
        allow="camera; microphone; fullscreen; display-capture"
        className="w-full h-full border-0"
        title="Partner Video Session"
      />
    </div>
  );
} 