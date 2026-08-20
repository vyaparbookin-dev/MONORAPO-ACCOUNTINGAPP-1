import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { api, getStorage } from './api.native';

const QUEUE_KEY = "offline_sync_queue";

export const syncQueue = {
  // 1. Request ko Queue me daalna
  enqueue: async (requestObj) => {
    const storedQueue = await AsyncStorage.getItem(QUEUE_KEY);
    const queue = storedQueue ? JSON.parse(storedQueue) : [];
    
    queue.push({
      id: Date.now(),
      method: requestObj.method,
      url: requestObj.url,
      data: requestObj.data,
      headers: requestObj.headers,
    });
    
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log("📦 Request queued for offline sync (Native):", requestObj.url);
    
    // Try syncing immediately just in case internet is actually back
    syncQueue.processQueue();
  },

  getQueue: async () => {
    const storedQueue = await AsyncStorage.getItem(QUEUE_KEY);
    return storedQueue ? JSON.parse(storedQueue) : [];
  },

  clearQueue: async () => {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([]));
  },

  processQueue: async () => {
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected || !networkState.isInternetReachable) {
      return; // Agar net nahi hai toh wapas jao
    }

    // Do not process queue if user is not logged in
    const token = await getStorage("authToken");
    if (!token) return; // Don't sync if not logged in

    const queue = await syncQueue.getQueue();
    if (queue.length === 0) return;

    console.log(`🚀 [SYNC] Processing ${queue.length} offline requests (Native)...`);
    const failedQueue = [];

    for (const req of queue) {
      try {
        await api({ method: req.method, url: req.url, data: req.data, headers: req.headers });
        console.log("✅ [SYNC] Successfully uploaded to cloud:", req.url);
      } catch (err) {
        console.error("❌ [SYNC] Failed for:", req.url, err.message || err);
        // If it's a 401/403 or unauthenticated token error, drop the stale request to prevent looping
        const errMsg = String(err?.message || JSON.stringify(err));
        const isAuthError = errMsg.includes("401") || errMsg.includes("token") || errMsg.includes("authorized");
        if (!isAuthError) {
          failedQueue.push(req);
        } else {
          console.warn("⚠️ [SYNC] Dropping invalid/unauthorized offline request:", req.url);
        }
      }
    }
    
    // Save only retryable requests
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failedQueue));
  },
};

// Auto-Sync: Jaise hi internet chalu hoga, background me data bhejna shuru kar dega
try {
  NetInfo.addEventListener(state => {
    if (state.isConnected && state.isInternetReachable) {
      console.log("🌐 Internet is BACK! Triggering Auto-Sync...");
      syncQueue.processQueue();
    } else {
      console.log("🚫 Internet disconnected. App is fully offline.");
    }
  });
} catch (e) {
  console.warn("Could not attach NetInfo listener:", e);
}