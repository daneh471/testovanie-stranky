const CACHE_NAME = 'bp-inr-v29'; // Aktualizácia po zmene int64 štruktúry
const ASSETS = [
  './',
  'index.html',
  'styles.css',
  'manifest.json',
  'app-mockup.png',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap'
];

// Inštalácia a kešovanie zdrojov
self.addEventListener('install', (event) => {
  console.log('Service Worker inštalácia...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Kešovanie zdrojov');
      return cache.addAll(ASSETS).catch(err => {
        console.log('Chyba pri kešovaní (ignorované pre CDN):', err);
        return cache.addAll(ASSETS.filter(url => !url.includes('http')));
      });
    })
  );
  self.skipWaiting();
});

// Aktivácia a premazanie starej keše
self.addEventListener('activate', (event) => {
  console.log('Service Worker aktivovaný');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Mazanie starej keše:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Stratégia: Najprv sieť, ak zlyhá, tak keš
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Ak sme online a je to náš zdroj, uložíme ho do keše
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => {
        // Ak sme offline, skúsime nájsť súbor v keši, ignorujeme search params (?v=1.4)
        return caches.match(event.request, { ignoreSearch: true });
      })
  );
});