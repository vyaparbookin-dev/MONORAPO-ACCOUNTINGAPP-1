import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const useOfflineMode = () => {
  // Start with true until the first check completes
  const [isOffline, setIsOffline] = useState(true);

  useEffect(() => {
    // Check the connection status immediately on mount
    NetInfo.fetch().then(state => {
      setIsOffline(!state.isConnected);
    });

    // Subscribe to connection changes
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  return { isOffline };
};
