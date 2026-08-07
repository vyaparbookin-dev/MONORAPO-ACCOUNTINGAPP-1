import { api, getStorage } from "./api"; // Aapka existing axios instance

const QUEUE_KEY = "offline_sync_queue";

// Helper to use SQLite for Desktop, fallback to localStorage for Web
const getQueueData = async () => {
  if (typeof window !== 'undefined' && window.electron?.db?.getSyncQueue) {
    try { return await window.electron.db.getSyncQueue() || []; } catch(e) {}
  }
  if (typeof window !== 'undefined' && localStorage) {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  }
  return [];
};

const saveQueueData = async (queue) => {
  if (typeof window !== 'undefined' && window.electron?.db?.saveSyncQueue) {
    try { await window.electron.db.saveSyncQueue(queue); return; } catch(e) {}
  }
  if (typeof window !== 'undefined' && localStorage) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }
};

export const syncQueue = {
  enqueue: async (requestObj) => {
    let queue = await getQueueData();

    // DEDUPLICATION: Only keep the latest state for the same entityId
    if (requestObj.entityId) {
      queue = queue.filter(q => q.entityId !== requestObj.entityId);
    }

    queue.push({
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      entityId: requestObj.entityId || null,
      entity: requestObj.entity || null,
      method: requestObj.method,
      url: requestObj.url,
      data: requestObj.data,
      headers: requestObj.headers,
      timestamp: new Date().toISOString()
    });

    await saveQueueData(queue);
    console.log("📦 Request queued for offline sync:", requestObj.url);
    
    syncQueue.processQueue(); // Try instantly
  },

  getQueue: async () => {
    return await getQueueData();
  },

  clearQueue: async () => {
    await saveQueueData([]);
  },

  processQueue: async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    // Do not process queue if user is not logged in
    const token = await getStorage("authToken");
    if (!token) return;

    const queue = await getQueueData();
    if (queue.length === 0) return;

    console.log(`🚀 [SYNC] Processing ${queue.length} offline requests (Web)...`);
    const failedQueue = [];

    for (const req of queue) {
      try {
        await api({ method: req.method, url: req.url, data: req.data, headers: req.headers });
        console.log("✅ [SYNC] Successfully uploaded to cloud:", req.url);
      } catch (err) {
        console.error("❌ [SYNC] Failed for:", req.url, err.message);
        if (!err.response || err.response.status >= 500) {
          failedQueue.push(req);
        }
      }
    }
    await saveQueueData(failedQueue);
  },
};

// Auto-Sync Web Listener
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log("🌐 Internet is BACK! Triggering Auto-Sync...");
    syncQueue.processQueue();
  });
}