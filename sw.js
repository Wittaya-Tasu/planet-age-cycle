const CACHE_NAME = "maha-thasa-v0.8.0";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/variables.css",
  "./css/base.css",
  "./css/layout.css",
  "./css/visuals.css",
  "./css/responsive.css",
  "./js/app.js",
  "./js/data/loadData.js",
  "./js/core/calendar.js",
  "./js/core/thaiCalendar.js",
  "./js/core/mahabhuta.js",
  "./js/core/mahadasha.js",
  "./js/core/relationships.js",
  "./js/core/exportImage.js",
  "./js/components/kalayok-table.js",
  "./js/components/summary.js",
  "./js/components/wheel.js",
  "./js/components/timeline.js",
  "./js/components/subperiod-explorer.js",
  "./data/planets.json",
  "./data/kalayok-positions.json",
  "./data/planet-relationships.json",
  "./data/annual-boundaries.json",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy));
      return response;
    }).catch(() => caches.match("./index.html")));
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      if (response.ok && new URL(event.request.url).origin === self.location.origin) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      }
      return response;
    })),
  );
});
