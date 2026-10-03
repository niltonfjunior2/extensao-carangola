// Service Worker Institucional - UEMG Carangola PWA Offline-First (Day 2 Performance)
const CACHE_NAME = 'uemg-extensao-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/assets/logos/uemg-symbol.svg',
  '/assets/logos/uemg-logo-white.jpg',
  '/monitor/checkin',
  '/validar',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cacheando assets estáticos do App Shell');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Purgando cache legado:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Não intercepta mutações POST ou chamadas de API de sincronização
  if (request.method !== 'GET' || request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Se a resposta for válida, atualiza o cache para próximas leituras offline
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback para cache quando estiver offline
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Se for navegação de página e não estiver em cache, retorna a página do leitor ou inicial
          if (request.mode === 'navigate') {
            return caches.match('/monitor/checkin').then((checkinResp) => {
              return checkinResp || caches.match('/');
            });
          }
          return new Response('Offline: Recurso indisponível sem conexão.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' }),
          });
        });
      })
  );
});
