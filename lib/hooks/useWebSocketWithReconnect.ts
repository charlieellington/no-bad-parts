import { useState, useEffect, useCallback, useRef } from 'react';

interface HintMessage {
  id: string;
  text: string;
  timestamp: number;
}

interface WebSocketMessage {
  type: 'hint' | 'connection' | 'error' | 'transcript';
  [key: string]: any;
}

interface UseWebSocketReturn {
  socket: WebSocket | null;
  isConnected: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  hints: HintMessage[];
  clearHints: () => void;
}

export const useWebSocketWithReconnect = (url: string): UseWebSocketReturn => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [hints, setHints] = useState<HintMessage[]>([]);
  
  const reconnectAttempts = useRef(0);
  const shouldReconnect = useRef(true);
  const socketRef = useRef<WebSocket | null>(null);
  
  const maxReconnectDelay = 30000; // 30 seconds
  const baseDelay = 1000; // 1 second

  const clearHints = useCallback(() => {
    setHints([]);
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected, skipping reconnect');
      return;
    }

    console.log(`🔄 Attempting WebSocket connection to: ${url}`);
    setConnectionStatus('connecting');
    
    const ws = new WebSocket(url);
    socketRef.current = ws;
    
    ws.onopen = () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
      setConnectionStatus('connected');
      reconnectAttempts.current = 0; // Reset on successful connection
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        
        switch (message.type) {
          case 'hint':
            setHints(prev => [...prev, {
              id: message.id,
              text: message.text,
              timestamp: message.timestamp
            }]);
            console.log('💡 Hint received:', message.text);
            break;
            
          case 'connection':
            console.log('✅ Connection confirmed:', message.status);
            break;
            
          case 'transcript':
            console.log('📝 Transcript:', message.text);
            // Handle transcript if needed in future
            break;
            
          case 'error':
            console.error('❌ Server error:', message.text);
            break;
            
          default:
            console.warn('⚠️ Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
        console.log('Raw message:', event.data);
      }
    };
    
    ws.onclose = (event) => {
      console.log(`🔌 WebSocket closed (code: ${event.code}, reason: ${event.reason})`);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      socketRef.current = null;
      
      // Attempt reconnection if not intentionally closed
      if (shouldReconnect.current && event.code !== 1000) { // 1000 = normal closure
        const delay = Math.min(
          baseDelay * Math.pow(2, reconnectAttempts.current),
          maxReconnectDelay
        );
        reconnectAttempts.current++;
        console.log(`⏱️ Reconnecting in ${delay}ms... (attempt ${reconnectAttempts.current})`);
        
        setTimeout(() => {
          if (shouldReconnect.current) {
            connect();
          }
        }, delay);
      }
    };
    
    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };
    
    setSocket(ws);
  }, [url]);

  useEffect(() => {
    shouldReconnect.current = true;
    connect();
    
    return () => {
      console.log('🧹 Cleaning up WebSocket connection');
      shouldReconnect.current = false;
      socketRef.current?.close(1000, 'Component unmounting');
    };
  }, [connect]);

  // Ping to keep connection alive (optional)
  useEffect(() => {
    if (!isConnected || !socket) return;
    
    const pingInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        // Could send a ping message if backend supports it
        // socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(pingInterval);
  }, [isConnected, socket]);

  return { socket, isConnected, connectionStatus, hints, clearHints };
}; 