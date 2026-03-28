import axios from "axios";

// Cloud API helper
const CLOUD_BASE_URL = "https://api.yourapp.com/cloud"; // Backend cloud endpoint

export const uploadToCloud = async (userId, data) => {
  try {
    const response = await axios.post(`${CLOUD_BASE_URL}/upload`, { userId, data });
    return response.data;
  } catch (err) {
    console.error("Cloud upload failed:", err);
    throw err;
  }
};

export const downloadFromCloud = async (userId) => {
  try {
    const response = await axios.get(`${CLOUD_BASE_URL}/download`, { params: { userId } });
    return response.data;
  } catch (err) {
    console.error("Cloud download failed:", err);
    throw err;
  }
};

// Optional: sync queue for offline mode
export const syncQueue = [];
export const addToSyncQueue = (userId, data) => {
  syncQueue.push({ userId, data, timestamp: new Date().toISOString() });
};