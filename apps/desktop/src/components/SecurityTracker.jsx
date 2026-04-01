import api from '../services/api';
import { syncQueue } from '@repo/shared';

export const SecurityTracker = {
    track: async (event, details) => {
        console.log(`[Security Event]: ${event}`, details);

        // Check for token synchronously to avoid race conditions on app start.
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (!token) return; // If no token, do absolutely nothing. This prevents 401 on app load.

        // Push to Sync Queue for offline-first support
        await syncQueue.enqueue({ entityId: `sec-${Date.now()}`, entity: 'security', method: 'POST', url: '/api/security/log', data: { action: event, details } });
    }
};