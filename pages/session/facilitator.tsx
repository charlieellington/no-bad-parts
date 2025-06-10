import React, { useState } from 'react';
import { useWebSocketWithReconnect } from '../../lib/hooks/useWebSocketWithReconnect';

// shadcn/ui components
import { Button } from '@/components/ui/button';

export default function Facilitator() {
  // Fallback URL for development if env variable is not set
  const dailyUrl = process.env.NEXT_PUBLIC_DAILY_URL || 'https://nobadparts.daily.co/ifs-coaching-demo';
  
  // WebSocket URL with fallback for development
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
  
  // Stage 4: Use the production-ready WebSocket hook
  const { connectionStatus, hints, clearHints } = useWebSocketWithReconnect(wsUrl);
  
  // -----------------
  // Start Guide inline
  // -----------------
  const [guideStep, setGuideStep] = useState<'hidden' | 'question' | 'yes' | 'no'>('hidden');
  const [facilitatorGuideOpen, setFacilitatorGuideOpen] = useState(false);

  const longIntro = `Long Intro Script (for someone new to IFS)
"Brilliant, let's take a moment to set the scene.

Parts: In IFS we view the mind as a small community. Each 'Part' carries its own feelings, memories and motives. Some protect you, some hold pain, others drive action. All of them started with good intentions, even if their methods feel unhelpful today.

Self: Beneath every Part is you at your calmest and clearest — what we call 'Self'. Self shows up as curiosity, confidence, compassion and courage. Our aim is to let Self take the lead while the Parts feel seen and heard.

What we'll do:

Notice which Parts are present right now.

Listen to what each one needs.

Help them unburden old roles so they can support you in healthier ways.

Ground-rules:
• Nothing gets forced or exiled; we invite every Part to speak in its own time.
• You can pause, stretch, or ask for clarification at any point.
• Everything you share stays confidential within this space.

That's all you need to know to begin. I'll guide you step by step, and you can't do it 'wrong'.

*Are you ready to start the session?`;

  const shortIntro = `Brief Refresher Script (for someone with IFS experience)
"Great — a quick reminder before we dive in.

• We'll invite whichever Parts are most active today, greet them with curiosity, and let Self lead the conversation.
• Remember, every Part carries positive intent, even if its strategy feels tough.
• You're free to slow down, pause, or switch focus at any time.

*Are you ready to start the session? Please answer Yes when you are.`;
  
  const isWsConnected = connectionStatus === 'connected';
  
  // Connection status indicator component
  const ConnectionStatus = () => {
    const statusConfig = {
      connected: { 
        color: 'bg-green-500', 
        bgColor: '#10b981',
        text: 'Connected',
        pulse: false 
      },
      connecting: { 
        color: 'bg-yellow-500', 
        bgColor: '#f59e0b',
        text: 'Connecting...',
        pulse: true 
      },
      disconnected: { 
        color: 'bg-red-500', 
        bgColor: '#ef4444',
        text: 'Disconnected',
        pulse: false 
      }
    };
    
    const config = statusConfig[connectionStatus];
    
    return (
      <div className="flex items-center gap-2">
        <div 
          className={`w-3 h-3 rounded-full ${config.color} ${config.pulse ? 'animate-pulse' : ''}`}
          style={{ backgroundColor: config.bgColor }}
          aria-label={`Connection status: ${config.text}`}
        />
        <span className="text-xs text-gray-500">{config.text}</span>
      </div>
    );
  };
  
  // Hint display component (newest first + scroll)
  const HintDisplay = () => {
    if (hints.length === 0) {
      return (
        <div className="text-center text-gray-400 mt-8">
          <p>Facilitator AI guided hints will appear here</p>
          <p className="text-sm mt-2">
            {connectionStatus === 'connected' 
              ? 'WebSocket connected and waiting for hints...' 
              : connectionStatus === 'connecting'
              ? 'Connecting to hint server...'
              : 'Connection lost. Attempting to reconnect...'}
          </p>
        </div>
      );
    }

    // Sort hints newest → oldest
    const sortedHints = [...hints].sort((a, b) => b.timestamp - a.timestamp);

    return (
      <div className="flex flex-col items-center space-y-4 pr-1">
        {sortedHints.map((hint) => (
          <div key={hint.id} className="p-6 bg-white rounded-lg shadow-md max-w-2xl w-full">
            {hint.text.split('\n').map((para, idx) => (
              <p key={idx} className="text-sm leading-7 mb-3 last:mb-0 whitespace-pre-line">
                {para}
              </p>
            ))}
            <p className="text-[11px] text-gray-500 mt-3 text-right">
              {new Date(hint.timestamp * 1000).toLocaleTimeString()}
            </p>
          </div>
        ))}
      </div>
    );
  };
  
  // Render guide content inside hints pane
  const GuideDisplay = () => {
    if (guideStep === 'hidden') return null;

    if (guideStep === 'question') {
      return (
        <div className="space-y-4 p-4 bg-white rounded-lg shadow-md max-w-md">
          <h3 className="text-base font-semibold">Is the partner new to IFS?</h3>
          <p className="text-sm">You can ask them: <span className="italic">"Is this your first time working with Internal Family Systems (IFS)?"</span></p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setGuideStep('yes')}>Yes</Button>
            <Button size="sm" variant="outline" onClick={() => setGuideStep('no')}>No</Button>
            <Button size="sm" variant="ghost" onClick={() => setGuideStep('hidden')}>Close</Button>
          </div>
        </div>
      );
    }

    const script = guideStep === 'yes' ? longIntro : shortIntro;
    return (
      <div className="space-y-4 p-4 bg-white rounded-lg shadow-md w-full max-w-none">
        <p className="whitespace-pre-wrap text-sm leading-6">{script}</p>
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={() => setGuideStep('hidden')}>Close</Button>
        </div>
      </div>
    );
  };
  
  const facilitatorGuideText = `Welcome! This panel is your backstage assistant. While the participant sees only the video call, you'll receive real-time AI prompts here.

• Generate Hint – Click anytime you're unsure how to proceed. The AI will summarise what's happening and suggest a helpful next question.

• Start Script – Use at the very beginning of a session. It helps you set context for the participant based on their IFS experience.

• Scrolling – Older hints stay above; scroll to review or copy text.

Tip: After you ask a question from a hint, give the participant space to respond before generating another.`;

  const FacilitatorGuideDisplay = () => (
    <div className="space-y-4 p-4 bg-white rounded-lg shadow-md w-full max-w-none">
      <h3 className="text-base font-semibold">Facilitator Guide</h3>
      <p className="text-sm leading-6 whitespace-pre-line">{facilitatorGuideText}</p>
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => setFacilitatorGuideOpen(false)}>Close</Button>
      </div>
    </div>
  );
  
  return (
    <>
      {/* Branding Banner */}
      <header className="fixed top-0 left-0 w-full bg-white shadow z-30 py-2 flex justify-center">
        <h1 className="text-sm font-medium text-gray-700">No Bad Parts Collective</h1>
      </header>

      {/* Desktop Layout – stacked vertically */}
      <div className="hidden md:flex flex-col" style={{ position: 'fixed', left: 0, right: 0, top: '48px', bottom: 0, height: 'calc(100vh - 48px)' }}>
        {/* Video (fixed 55vh max) */}
        <div className="shrink-0" style={{ position: 'relative', height: '55vh' }}>
          <iframe
            src={`${dailyUrl}?userName=facilitator`}
            allow="camera; microphone; fullscreen; display-capture"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none'
            }}
          />
        </div>

        {/* Hints (fills remaining space) */}
        <section 
          className="bg-gray-50 border-t border-gray-200 flex flex-col"
          style={{ height: '45vh', padding: '1rem', overflow: 'hidden' }}
        >
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <h2 className="text-lg font-semibold">Facilitator Hints</h2>
            <ConnectionStatus />
          </div>
          <div className="flex flex-wrap gap-2 mb-4 flex-shrink-0">
            {connectionStatus !== 'disconnected' && hints.length > 0 && (
              <Button size="sm" variant="outline" onClick={clearHints}>
                Clear Hints
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              disabled={!isWsConnected}
              onClick={async () => {
                if (!isWsConnected) return;
                try {
                  await fetch(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/regenerate-hint', { method: 'POST' });
                } catch (e) {
                  console.error('Failed to request regenerate-hint', e);
                }
              }}
            >
              ♻️ Generate Hint
            </Button>
            <Button size="sm" variant="secondary" onClick={() => {setGuideStep('question'); setFacilitatorGuideOpen(false);}}>
              Start Script
            </Button>
            <Button size="sm" variant="outline" onClick={() => {setFacilitatorGuideOpen(true); setGuideStep('hidden');}}>
              Facilitator Guide
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {facilitatorGuideOpen ? (
              <FacilitatorGuideDisplay />
            ) : guideStep === 'hidden' ? (
              <HintDisplay />
            ) : (
              <GuideDisplay />
            )}
          </div>
        </section>
      </div>

      {/* Mobile Layout */}
      <div className="flex md:hidden flex-col" style={{ position: 'fixed', left:0, right:0, top:'48px', bottom:0, height: 'calc(100vh - 48px)' }}>
        {/* Video section - takes remaining space */}
        <div style={{ flex: 1, position: 'relative' }}>
          <iframe
            src={`${dailyUrl}?userName=facilitator`}
            allow="camera; microphone; fullscreen; display-capture"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none'
            }}
          />
        </div>
        
        {/* Hint section - fixed height on mobile */}
        <aside 
          className="bg-gray-50 border-t border-gray-200 overflow-y-auto flex flex-col"
          style={{ height: '380px', padding: '1rem' }}
        >
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <h2 className="text-lg font-semibold">Facilitator Hints</h2>
            <ConnectionStatus />
          </div>
          <div className="flex flex-wrap gap-2 mb-4 flex-shrink-0">
            {connectionStatus !== 'disconnected' && hints.length > 0 && (
              <Button size="sm" variant="outline" onClick={clearHints}>
                Clear Hints
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              disabled={!isWsConnected}
              onClick={async () => {
                if (!isWsConnected) return;
                try {
                  await fetch(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/regenerate-hint', { method: 'POST' });
                } catch (e) {
                  console.error('Failed to request regenerate-hint', e);
                }
              }}
            >
              ♻️ Generate Hint
            </Button>
            <Button size="sm" variant="secondary" onClick={() => {setGuideStep('question'); setFacilitatorGuideOpen(false);}}>
              Start Script
            </Button>
            <Button size="sm" variant="secondary" onClick={() => {setFacilitatorGuideOpen(true); setGuideStep('hidden');}}>
              Facilitator Guide
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {facilitatorGuideOpen ? (
              <FacilitatorGuideDisplay />
            ) : guideStep === 'hidden' ? (
              <HintDisplay />
            ) : (
              <GuideDisplay />
            )}
          </div>
        </aside>
      </div>
    </>
  );
} 