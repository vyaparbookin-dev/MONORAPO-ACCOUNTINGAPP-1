import api from '../services/api';
import { syncQueue } from '@repo/shared';

export const SecurityTracker = {
    track: async (event, details) => {
        console.log(`[Security Event]: ${event}`, details);
        // Push to Sync Queue for offline-first support
        await syncQueue.enqueue({ entityId: `sec-${Date.now()}`, entity: 'security', method: 'POST', url: '/api/security/log', data: { action: event, details } });
    }
};