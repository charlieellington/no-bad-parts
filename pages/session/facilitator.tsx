export default function Facilitator() {
  return (
    <div className="flex h-screen">
      {/* Video column - Daily iframe placeholder */}
      <div className="flex-1 border-r">
        <div className="w-full h-full flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-600 mb-4">Facilitator Video View</h1>
            <p className="text-gray-500">Daily iframe will be embedded here</p>
            <p className="text-sm text-gray-400 mt-2">Username: facilitator</p>
          </div>
        </div>
      </div>

      {/* Coach Hints panel */}
      <aside className="w-96 p-4 overflow-y-auto bg-gray-50">
        <h2 className="text-lg font-semibold mb-3">Coach Hints</h2>
        <div className="text-center text-gray-400 mt-8">
          <p>AI coaching hints will appear here</p>
          <p className="text-sm mt-2">WebSocket connection will be established in future steps</p>
        </div>
      </aside>
    </div>
  );
} 