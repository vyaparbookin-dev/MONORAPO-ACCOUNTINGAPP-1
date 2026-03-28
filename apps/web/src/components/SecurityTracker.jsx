import api from '../services/api';

export const SecurityTracker = {
    track: (event, details) => {
        console.log(`[Security Event]: ${event}`, details);
        // Send log to the real backend
        return api.post('/security/log', { action: event, details }).catch(err => console.error(err));
    }
};