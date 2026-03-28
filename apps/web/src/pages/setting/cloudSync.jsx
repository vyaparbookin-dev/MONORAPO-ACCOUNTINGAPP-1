import React, { useState } from "react";
import api from "../../services/api";

const CloudSync = () => {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.post("/api/cloud/sync");
      alert("Data synced with cloud successfully!");
    } catch {
      alert("Cloud sync failed. Try again later.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-2">Cloud Sync</h2>
      <button
        onClick={handleSync}
        disabled={syncing}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {syncing ? "Syncing..." : "Sync Now"}
      </button>
    </div>
  );
};

export default CloudSync;