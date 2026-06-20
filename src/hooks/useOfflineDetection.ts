'use client';

import { useState, useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';

export function useOfflineDetection() {
  const setConnectionStatus = useUIStore((s) => s.setConnectionStatus);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isServerReachable, setIsServerReachable] = useState(true);

  async function checkHealth() {
    try {
      const response = await fetch('/api/health', { cache: 'no-store' });
      if (response.ok) {
        setIsServerReachable(true);
        setConnectionStatus('connected');
      } else {
        throw new Error('Server responded with error');
      }
    } catch (error) {
      setIsServerReachable(false);
      setConnectionStatus(navigator.onLine ? 'reconnecting' : 'disconnected');
    }
  }

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      
      if (!online) {
        setIsServerReachable(false);
        setConnectionStatus('disconnected');
      } else {
        // When coming back online, check if server is actually reachable
        checkHealth();
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Initial check
    updateOnlineStatus();

    // Health probe every 30s
    const interval = setInterval(() => {
      if (navigator.onLine) {
        checkHealth();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(interval);
    };
  }, [setConnectionStatus]);

  // Derived connection status for the hook return
  const connectionStatus = useUIStore((s) => s.connectionStatus);

  return {
    isOnline,
    isServerReachable,
    connectionStatus,
  };
}
