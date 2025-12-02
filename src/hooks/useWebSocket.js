import { useEffect, useRef, useState } from 'react';

export function useWebSocket(url) {
  const [lastMessage, setLastMessage] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const ws = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const isUnmounting = useRef(false);
  const isConnecting = useRef(false); // ✅ Track connection attempt

  useEffect(() => {
    isUnmounting.current = false;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_DELAY = 3000;

    const connect = () => {
      // ✅ Prevent multiple simultaneous connection attempts
      if (isConnecting.current) {
        console.log('⚠️ Connection attempt already in progress, skipping...');
        return;
      }

      // Prevent multiple simultaneous connections
      if (ws.current?.readyState === WebSocket.CONNECTING || 
          ws.current?.readyState === WebSocket.OPEN) {
        console.log('⚠️ WebSocket already connecting/connected, skipping...');
        return;
      }

      // Prevent reconnection after unmount
      if (isUnmounting.current) {
        console.log('⚠️ Component unmounting, skipping reconnection');
        return;
      }

      console.log('🔌 Connecting to WebSocket:', url);
      isConnecting.current = true; // ✅ Mark as connecting
      
      try {
        ws.current = new WebSocket(url);

        ws.current.onopen = () => {
          console.log('✅ WebSocket connected');
          setConnectionStatus('connected');
          reconnectAttempts = 0;
          isConnecting.current = false; // ✅ Connection successful
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
          isConnecting.current = false; // ✅ Connection failed
        };

        ws.current.onclose = (event) => {
          console.log('🔌 WebSocket disconnected', event.code, event.reason);
          setConnectionStatus('disconnected');
          isConnecting.current = false; // ✅ Connection closed

          // Attempt reconnection if not intentionally closed and not unmounting
          if (!isUnmounting.current && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            console.log(`🔄 Reconnecting... (Attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, RECONNECT_DELAY);
          } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.error('❌ Max reconnection attempts reached');
          }
        };
      } catch (error) {
        console.error('❌ Failed to create WebSocket:', error);
        setConnectionStatus('error');
        isConnecting.current = false; // ✅ Connection failed
      }
    };

    // ✅ Delay initial connection slightly to avoid race conditions
    const initialConnectionTimeout = setTimeout(() => {
      connect();
    }, 100);

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up WebSocket connection');
      isUnmounting.current = true;
      isConnecting.current = false;
      
      // ✅ Clear initial connection timeout
      clearTimeout(initialConnectionTimeout);
      
      // Clear any pending reconnection attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Close WebSocket connection
      if (ws.current) {
        // Remove event listeners to prevent callbacks after cleanup
        ws.current.onopen = null;
        ws.current.onmessage = null;
        ws.current.onerror = null;
        ws.current.onclose = null;

        if (ws.current.readyState === WebSocket.OPEN || 
            ws.current.readyState === WebSocket.CONNECTING) {
          ws.current.close(1000, 'Component unmounting');
        }
        
        ws.current = null;
      }
    };
  }, [url]);

  // Function to send messages to the server
  const sendMessage = (message) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send message. State:', 
        ws.current?.readyState === 0 ? 'CONNECTING' :
        ws.current?.readyState === 2 ? 'CLOSING' :
        ws.current?.readyState === 3 ? 'CLOSED' : 'UNKNOWN'
      );
    }
  };

  return { lastMessage, connectionStatus, sendMessage };
}