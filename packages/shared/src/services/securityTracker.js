import { api, getStorage } from "./api";

export const SecurityTracker = {
  track: async (action, details) => { // FIX: Renamed logEvent to track to match usage in DashboardLayout
    // Check if user is logged in before tracking
    const token = await getStorage("authToken");
    if (!token) return null;
    
    const data = await api.post("/security/log", { action, details });
    return data;
  },

  getLogs: async () => {
    const token = await getStorage("authToken");
    if (!token) return { data: [] };
    const data = await api.get("/security/logs");
    return data;
  },

  clearLogs: async () => {
    const token = await getStorage("authToken");
    if (!token) return null;
    const data = await api.delete("/security/logs/clear");
    return data;
  },
};