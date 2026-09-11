self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(names.map((name) => caches.delete(name))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Always fetch live from network first so new Vite chunks never get MIME error
  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      
      // For navigation requests (HTML pages), fallback to root index.html if available
      if (event.request.mode === 'navigate') {
        const rootCache = await caches.match('/');
        if (rootCache) return rootCache;
      }
      
      // Return safe offline JSON or empty response to prevent "TypeError: Failed to convert value to 'Response'"
      if (event.request.headers.get('accept')?.includes('application/json')) {
        return new Response(JSON.stringify({ success: false, offline: true, message: "Offline mode active" }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response('', { status: 408, statusText: 'Offline/Network Timeout' });
    })
  );
});
