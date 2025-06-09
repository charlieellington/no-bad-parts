export default function Facilitator() {
  const dailyUrl = process.env.NEXT_PUBLIC_DAILY_URL || 'https://nobadparts.daily.co/ifs-coaching-demo';

  return (
    <div className="flex h-screen">
      {/* Video column */}
      <div className="flex-1">
        <iframe
          src={`${dailyUrl}?username=facilitator`}
          allow="camera; microphone; fullscreen; display-capture"
          className="w-full h-full border-0"
          title="Facilitator Video Session"
        />
      </div>
      
      {/* Coach Hints panel */}
      <aside className="w-96 p-4 overflow-y-auto bg-gray-50 border-l border-gray-200">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">Coach Hints</h2>
        <div className="text-sm text-gray-600">
          <p>AI-generated coaching hints will appear here during the session.</p>
        </div>
      </aside>
    </div>
  );
} 