self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Garde le contexte en vie même si l'onglet est fermé (sur Android)
self.addEventListener('message', (event) => {
    if (event.data === 'keepalive') {
        // On fait juste ça pour garder le worker actif
    }
});
