const CACHE_NAME = 'vyaparbook-offline-v2';

// Core shell assets to precache on installation
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache optional asset note:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Deleting stale cache:', name);
            return caches.delete(name);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((names) => Promise.all(names.map((name) => caches.delete(name))));
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Skip cross-origin non-HTTP(S) schemes (e.g. chrome-extension://)
  if (!url.protocol.startsWith('http')) return;

  // 1. API Requests (e.g. /api/*): Network first, graceful offline JSON fallback Response
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req).catch(() => {
        return new Response(
          JSON.stringify({
            success: false,
            offline: true,
            message: "Offline mode active (आप ऑफ़लाइन हैं, डेटा लोकल सुरक्षित है)"
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // 2. Navigation Requests (HTML / Page visit):
  // Network first: if online, get fresh HTML and update cache.
  // If offline: return cached HTML shell so PWA always boots up smoothly!
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, clone);
              cache.put('/', networkResponse.clone());
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(req) || await caches.match('/') || await caches.match('/index.html');
          if (cached) return cached;
          return new Response(
            '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>VyaparBook Offline</title></head><body style="font-family:sans-serif;padding:24px;text-align:center;background:#0F172A;color:#fff;"><h2>VyaparBook Offline</h2><p>कृपया इंटरनेट कनेक्ट करके ऐप को एक बार रिफ्रेश करें।</p><button onclick="location.reload()" style="padding:10px 20px;border-radius:10px;background:#4338CA;color:#fff;border:none;cursor:pointer;font-weight:bold;">पुनः प्रयास करें (Retry)</button></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // 3. Static Assets (JS chunks, CSS, fonts, icons, images):
  // Cache-First with Network fallback and SAFE synthetic responses (NEVER return undefined)
  event.respondWith(
    (async () => {
      // Step A: Check if already in cache
      const cached = await caches.match(req);
      if (cached) {
        // Background revalidate when online without throwing
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          fetch(req)
            .then((res) => {
              if (res && res.status === 200 && res.type !== 'opaque') {
                const clone = res.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
              }
            })
            .catch(() => {
              // Ignore background refresh failure
            });
        }
        return cached;
      }

      // Step B: Not in cache, fetch from network
      try {
        const networkResponse = await fetch(req);
        if (networkResponse && networkResponse.status === 200 && networkResponse.type !== 'opaque') {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return networkResponse;
      } catch (err) {
        // Step C: Network failed AND not in cache
        // MUST NEVER return undefined or reject, otherwise browser throws:
        // "TypeError: Failed to convert value to 'Response'"
        if (req.destination === 'image' || url.pathname.endsWith('.png') || url.pathname.endsWith('.jpg') || url.pathname.endsWith('.ico') || url.pathname.endsWith('.svg')) {
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192"><rect width="192" height="192" fill="#4338CA"/><text x="96" y="106" font-family="sans-serif" font-size="28" font-weight="bold" fill="#fff" text-anchor="middle">VB</text></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        }
        if (req.destination === 'style' || url.pathname.endsWith('.css')) {
          return new Response('/* offline fallback css */', {
            headers: { 'Content-Type': 'text/css' }
          });
        }
        if (req.destination === 'script' || url.pathname.endsWith('.js')) {
          return new Response('console.warn("VyaparBook [Offline]: Asset deferred:", ' + JSON.stringify(url.pathname) + ');', {
            headers: { 'Content-Type': 'application/javascript' }
          });
        }
        return new Response('Asset Unavailable Offline', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      }
    })()
  );
});
