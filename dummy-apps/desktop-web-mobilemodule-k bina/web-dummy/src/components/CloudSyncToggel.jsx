import React, { useState, useEffect } from "react";
import { CloudOff, CloudUpload, CloudLightning, RefreshCw } from "lucide-react";
import { syncQueue } from "@repo/shared";

export default function CloudSyncToggel() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const checkStatus = () => setPendingCount(syncQueue.getQueue().length);
    
    const handleOnline = async () => {
      setIsOnline(true);
      setIsSyncing(true);
      await syncQueue.processQueue();
      checkStatus();
      setIsSyncing(false);
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    checkStatus();
    // Har 5 second me queue check karta rahega
    const interval = setInterval(checkStatus, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = async () => {
    if (isOnline) {
      setIsSyncing(true);
      await syncQueue.processQueue();
      setPendingCount(syncQueue.getQueue().length);
      setIsSyncing(false);
    }
  };

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1.5 rounded-full text-sm font-bold shadow-sm">
        <CloudOff size={16} /> Offline ({pendingCount} pending)
      </div>
    );
  }

  return (
    <button 
      onClick={handleManualSync}
      disabled={isSyncing || pendingCount === 0}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold shadow-sm transition ${pendingCount > 0 ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-green-100 text-green-700'}`}
    >
      {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : pendingCount > 0 ? <CloudUpload size={16} /> : <CloudLightning size={16} />}
      {isSyncing ? "Syncing..." : pendingCount > 0 ? `${pendingCount} Items to Sync` : "Cloud Synced"}
    </button>
  );
}