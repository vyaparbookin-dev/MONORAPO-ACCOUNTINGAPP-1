import { useEffect, useState, useCallback } from "react";
import axios from "axios";

/**
 * Custom hook for offline data synchronization
 * Stores data locally when offline, syncs when online
 */
export const useSync = (collectionName, apiEndpoint) => {
  const [syncStatus, setSyncStatus] = useState("idle");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [unSyncedCount, setUnSyncedCount] = useState(0);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncData(); // Auto-sync when coming online
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const syncData = useCallback(async (data) => {
    if (!navigator.onLine) {
      setSyncStatus("offline");
      return false;
    }

    try {
      setSyncStatus("syncing");
      const response = await axios.post("/api/sync/data", {
        collectionName: collectionName || "general",
        data: Array.isArray(data) ? data : [data],
      });

      setSyncStatus("success");
      setUnSyncedCount(0);
      return true;
    } catch (err) {
      setSyncStatus("error");
      console.error("Sync error:", err);
      return false;
    }
  }, [collectionName]);

  // Store data locally when offline
  const storeLocal = useCallback((key, data) => {
    localStorage.setItem(`${collectionName}_${key}`, JSON.stringify(data));
  }, [collectionName]);

  // Retrieve local data
  const getLocal = useCallback((key) => {
    const stored = localStorage.getItem(`${collectionName}_${key}`);
    return stored ? JSON.parse(stored) : null;
  }, [collectionName]);

  // Clear local storage
  const clearLocal = useCallback((key) => {
    localStorage.removeItem(`${collectionName}_${key}`);
  }, [collectionName]);

  return {
    syncStatus,
    isOnline,
    syncData,
    storeLocal,
    getLocal,
    clearLocal,
    unSyncedCount,
    setUnSyncedCount,
  };
};

export default useSync;
