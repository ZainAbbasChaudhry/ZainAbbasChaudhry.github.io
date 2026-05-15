const CACHE_NAME = "easylands-v5";
const STATIC_ASSETS = [
  "/easylands-logo.jpg",
  "/favicon.svg",
  "/manifest.json",
  "/easylands-icon-180.png",
  "/easylands-icon-192.png",
  "/easylands-icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Never intercept API calls
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  // Never intercept Vite HMR, module scripts, or TS/JS/CSS source files
  const ext = url.pathname.split(".").pop()?.toLowerCase();
  if (["ts", "tsx", "js", "jsx", "mjs", "css", "html"].includes(ext ?? "")) return;
  if (url.pathname.includes("/@") || url.pathname.includes("/src/")) return;

  // For truly static assets (images, manifest) use cache-first with network fallback
  if (STATIC_ASSETS.some((a) => url.pathname.endsWith(a.replace(/^\//, "")))) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone)).catch(() => {});
          }
          return res;
        }).catch(() => Response.error());
      })
    );
    return;
  }

  // Everything else: network-only (no caching)
});

// ── Web Push: receive background notifications ────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "🔔 Easylands Reminder", body: event.data.text() };
  }

  const title  = payload.title  || "Easylands";
  const options = {
    body:    payload.body   || "You have a new notification",
    icon:    payload.icon   || "/easylands-icon-192.png",
    badge:   payload.badge  || "/easylands-icon-96.png",
    image:   payload.image  || undefined,
    tag:     payload.tag    || "easylands-notification",
    vibrate: [200, 100, 200],
    requireInteraction: false,
    silent:  false,
    data:    payload.data   || { url: "/" },
    actions: [
      { action: "open",    title: "Open App" },
      { action: "dismiss", title: "Dismiss"  },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification click: open or focus the app ─────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const targetUrl = (event.notification.data && event.notification.data.url) || "/crm";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
