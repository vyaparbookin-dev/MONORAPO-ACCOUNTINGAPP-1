import api from '../services/api';

export const SecurityTracker = {
    track: (event, details) => {
        console.log(`[Security Event]: ${event}`, details);

        // Check for token synchronously to avoid race conditions on app start.
        const token = typeof localStorage !== 'undefined' ? (localStorage.getItem('authToken') || localStorage.getItem('token')) : null;
        if (!token || token === "null" || token === "undefined") return; // Prevents 401 on app load

        // This will only run if a token exists.
        api.post('/api/security/log', { action: event, details }).catch(err => console.error("SecurityTracker API call failed:", err.message));
    }
};