import { useEffect, useRef, useState } from 'react';

// Hook Function & State
export function useWebSocket(url) {
  const [lastMessage, setLastMessage] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const ws = useRef(null);

    //lastMessage: Stores the most recent message received from server
    // connectionStatus: Tracks connection state ('disconnected', 'connected', 'error')
    // ws: Ref to store WebSocket instance (doesn't cause re-renders when changed)
    // url: WebSocket server URL passed as parameter (e.g., 'ws://localhost:3000')

// Connection Setup & Handlers
  useEffect(() => {
    console.log('🔌 Connecting to WebSocket:', url);
    
    // Create WebSocket connection
    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      console.log('✅ WebSocket connected');
      setConnectionStatus('connected');
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 Received:', data);
        setLastMessage(data);
      } catch (error) {
        console.error('❌ Failed to parse WebSocket message:', error);
        console.log('Raw message:', event.data);
      }
    };

    ws.current.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      setConnectionStatus('error');
    };

    ws.current.onclose = (event) => {
      console.log('🔌 WebSocket disconnected', event.code, event.reason);
      setConnectionStatus('disconnected');
    };

    // Cleanup on unmount
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url]);

  // Function to send messages to the server
  const sendMessage = (message) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send message');
    }
  };

  return { lastMessage, connectionStatus, sendMessage };
    // lastMessage: Latest data from server (updates trigger re-renders)
    // connectionStatus: 'connected', 'disconnected', or 'error'
    // sendMessage: Function to send data to server
}