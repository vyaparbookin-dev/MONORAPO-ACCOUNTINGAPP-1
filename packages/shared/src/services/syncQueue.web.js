/**
 * Sync Queue (Web/Desktop Version)
 * --------------------------------
 * This service queues up API requests made while the user is offline.
 * Once the connection is restored, it processes the queue.
 * This version uses localStorage for persistence in web/desktop environments.
 */
import api from './api';

let isProcessing = false;

const isElectron = typeof window !== 'undefined' && !!window.electron;

const getQueue = async () => {
  try {
    if (isElectron && window.electron?.db?.getSyncQueue) {
      return await window.electron.db.getSyncQueue();
    }

    if (typeof localStorage !== 'undefined') {
      const queueJson = localStorage.getItem('sync_queue');
      return queueJson ? JSON.parse(queueJson) : [];
    }

    return [];
  } catch (e) {
    console.error("Failed to get sync queue", e);
    return [];
  }
};

const saveQueue = async (queue) => {
  try {
    if (isElectron && window.electron?.db?.saveSyncQueue) {
      return await window.electron.db.saveSyncQueue(queue);
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sync_queue', JSON.stringify(queue));
    }
  } catch (e) {
    console.error("Failed to save sync queue", e);
  }
};

const enqueue = async (request) => {
  const isOnline = typeof navigator === 'undefined' || navigator.onLine;

  if (!isOnline) {
    const queue = await getQueue();
    // Simple deduplication: if an item with the same ID is already in the queue for update/delete, replace it.
    const existingIndex = queue.findIndex(item => item.entityId === request.entityId && item.entity === request.entity);
    if (existingIndex > -1) {
      // If a 'create' is followed by a 'delete', remove both.
      if (queue[existingIndex].method === 'POST' && request.method === 'DELETE') {
        queue.splice(existingIndex, 1);
      } else {
        queue[existingIndex] = request; // Replace with the latest action
      }
    } else {
      queue.push(request);
    }
    await saveQueue(queue);
    console.log(`Offline: Queued ${request.method} request for ${request.url}`);
    return { success: true, queued: true };
  } else {
    // If online, just make the call directly
    return api({ method: request.method, url: request.url, data: request.data });
  }
};

const processQueue = async () => {
  const isOnline = typeof navigator === 'undefined' || navigator.onLine;
  if (isProcessing || !isOnline) return;
  isProcessing = true;

  let queue = await getQueue();
  if (queue.length === 0) {
    isProcessing = false;
    return;
  }

  console.log(`Connection restored. Processing ${queue.length} items from sync queue...`);

  // We process one-by-one to maintain order
  while (queue.length > 0) {
    const request = queue.shift();
    try {
      await api({ method: request.method, url: request.url, data: request.data });
      console.log(`Successfully synced: ${request.method} ${request.url}`);
      await saveQueue(queue); // Save after each successful request
    } catch (error) {
      console.error(`Failed to sync: ${request.method} ${request.url}. Re-queuing.`, error);
      queue.unshift(request); // Add it back to the front
      await saveQueue(queue);
      isProcessing = false;
      return; // Stop processing on failure to avoid data loss
    }
  }

  isProcessing = false;
  console.log("Sync queue processed.");
};

// Listen for online/offline status changes
if (typeof window !== 'undefined') {
  window.addEventListener('online', processQueue);
}

// Initial check
if (typeof navigator !== 'undefined' && navigator.onLine) {
  setTimeout(processQueue, 2000); // Process queue shortly after app start if online
}

export const syncQueue = {
  enqueue,
  processQueue,
  getQueue,
};