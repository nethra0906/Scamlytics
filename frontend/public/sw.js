/**
 * sw.js — Service Worker for Scamlytics
 *
 * Strategy:
 *  - HTML navigation requests  → Network First (always get latest index.html)
 *  - API requests              → Network First (cache fallback for offline)
 *  - Static assets (JS/CSS)   → Cache First (network fallback)
 *  - Offline fallback page     → Served from cache when network is unavailable
 *
 * FIX: HTML must be Network First — Vite hashes JS/CSS filenames on every build,
 * so serving a cached index.html that references old hashed filenames causes a
 * blank page until the user hard-refreshes.
 */

const CACHE_NAME = "scamlytics-v3"; // bumped — purges old v2 cache on activate
const OFFLINE_URL = "/offline.html";

const APP_SHELL = [
  "/offline.html",
];

// ── Install: cache app shell ───────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

// ── Activate: purge old caches ─────────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ──────────────────────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests (except /api pass-through)
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin && !url.pathname.startsWith("/api")) return;

  // 1. HTML navigation (e.g. /, /dashboard, /map) → Network First
  //    This is critical: Vite hashes JS/CSS filenames every build, so a cached
  //    index.html pointing at old hashed files causes a blank page on first load.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return res;
        })
        .catch(() =>
          caches.match("/").then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // 2. API requests → Network First, cache fallback for offline
  if (url.port === "8000" || url.pathname.startsWith("/api")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return res;
        })
        .catch(() =>
          caches.match(request).then((cached) => {
            if (cached) return cached;
            return new Response(
              JSON.stringify({ error: "Offline - cached response unavailable." }),
              { headers: { "Content-Type": "application/json" } }
            );
          })
        )
    );
    return;
  }

  // 3. Static assets (JS, CSS, images) → Cache First, network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match(OFFLINE_URL));
    })
  );
});
