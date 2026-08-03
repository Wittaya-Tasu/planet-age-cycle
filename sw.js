const CACHE_NAME = "planet-age-cycle-v0.6.0";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/fonts.css",
  "./css/variables.css",
  "./css/base.css",
  "./css/layout.css",
  "./css/wheel.css",
  "./css/responsive.css",
  "./js/app.js",
  "./js/data/planets.js",
  "./js/data/durations.js",
  "./js/data/birth-days.js",
  "./data/planets.json",
  "./data/subperiods.json",
  "./data/predictions.json",
  "./data/day-planet-relations.json",
  "./data/app-config.json",
  "./data/ui-text.th.json",
  "./js/data/loadData.js",
  "./js/core/calendar.js",
  "./js/core/calendarJourney.js",
  "./js/core/periodCalculator.js",
  "./js/core/predictionLookup.js",
  "./js/core/exportImage.js",
  "./js/core/relations.js",
  "./js/core/time.js",
  "./js/core/angles.js",
  "./js/core/age.js",
  "./js/core/sequence.js",
  "./js/core/geometry.js",
  "./js/components/wheel.js",
  "./js/components/timeline.js",
  "./js/components/tooltip.js",
  "./js/components/legend.js",
  "./js/components/detail-panel.js",
  "./js/components/birth-form.js",
  "./js/components/journey-summary.js",
  "./js/utils/format.js",
  "./js/utils/validation.js",
  "./assets/fonts/sarabun-thai-400-normal.woff2",
  "./assets/fonts/sarabun-latin-400-normal.woff2",
  "./assets/fonts/sarabun-thai-600-normal.woff2",
  "./assets/fonts/sarabun-latin-600-normal.woff2",
  "./assets/fonts/sarabun-thai-700-normal.woff2",
  "./assets/fonts/sarabun-latin-700-normal.woff2",
  "./assets/fonts/sarabun-thai-800-normal.woff2",
  "./assets/fonts/sarabun-latin-800-normal.woff2",
  "./assets/icons/icon.svg",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html")),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === "opaque") {
            return response;
          }

          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match("./index.html"));
    }),
  );
});
