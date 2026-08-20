import React, { useState, useEffect } from "react";
import { CloudOff, CloudUpload, CloudLightning, RefreshCw, ShieldCheck, HardDrive } from "lucide-react";
import { syncQueue } from "@repo/shared";
import { getCurrentPlan } from "../utils/planManager";
import { useCompany } from "../contexts/CompanyContext";

export default function CloudSyncToggel() {
  const { selectedCompany } = useCompany();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const plan = getCurrentPlan(selectedCompany);

  useEffect(() => {
    const checkStatus = () => setPendingCount(syncQueue.getQueue().length);
    
    const handleOnline = async () => {
      setIsOnline(true);
      if (plan.features.cloudSync) {
        setIsSyncing(true);
        await syncQueue.processQueue();
        checkStatus();
        setIsSyncing(false);
      }
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    checkStatus();
    const interval = setInterval(checkStatus, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [plan]);

  const handleManualSync = async () => {
    if (isOnline && plan.features.cloudSync) {
      setIsSyncing(true);
      await syncQueue.processQueue();
      setPendingCount(syncQueue.getQueue().length);
      setIsSyncing(false);
    }
  };

  // Tier 1: Offline Edition Badge
  if (!plan.features.cloudSync) {
    return (
      <div 
        className="flex items-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-full text-xs font-bold shadow-xs cursor-default"
        title="Offline Edition Active — All data stored in high-speed local SQLite"
      >
        <HardDrive size={14} className="text-slate-600" />
        <span className="hidden sm:inline">100% Offline SQLite</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
        <CloudOff size={14} /> Offline ({pendingCount} pending)
      </div>
    );
  }

  return (
    <button 
      onClick={handleManualSync}
      disabled={isSyncing || pendingCount === 0}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm transition ${
        pendingCount > 0 
          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-300' 
          : plan.id === 'pro'
          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
          : 'bg-blue-100 text-blue-800 border border-blue-300'
      }`}
      title={plan.id === 'pro' ? "Universal 3-Way Realtime Sync Active" : "Cloud Backup Active"}
    >
      {isSyncing ? (
        <RefreshCw size={14} className="animate-spin" />
      ) : pendingCount > 0 ? (
        <CloudUpload size={14} />
      ) : (
        <CloudLightning size={14} />
      )}
      <span>
        {isSyncing 
          ? "Syncing..." 
          : pendingCount > 0 
          ? `${pendingCount} to Sync` 
          : plan.id === 'pro' 
          ? "3-Way Synced" 
          : "Cloud Synced"}
      </span>
    </button>
  );
}