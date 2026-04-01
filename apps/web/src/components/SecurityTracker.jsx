import api from '../services/api';

export const SecurityTracker = {
    track: (event, details) => {
        console.log(`[Security Event]: ${event}`, details);
        
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (!token) return Promise.resolve(); // Don't send API request if not logged in
        
        return api.post('/api/security/log', { action: event, details }).catch(err => console.error(err));
    }
};