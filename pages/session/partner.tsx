export default function Partner() {
  // Fallback URL for development if env variable is not set
  const dailyUrl = process.env.NEXT_PUBLIC_DAILY_URL || 'https://nobadparts.daily.co/ifs-coaching-demo';
  
  return (
    <>
      <header className="fixed top-0 left-0 w-full bg-white shadow z-30 py-2 flex justify-center">
        <h1 className="text-sm font-medium text-gray-700">No Bad Parts Collective</h1>
      </header>
      <iframe
        src={`${dailyUrl}?userName=partner`}
        allow="camera; microphone; fullscreen; display-capture"
        style={{
          position: 'fixed',
          top: '48px',
          left: 0,
          width: '100vw',
          height: 'calc(100vh - 48px)',
          border: 'none'
        }}
      />
    </>
  );
} 