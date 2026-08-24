const CACHE = "carstrims-v6";
const STATIC = [
  "/favicon.svg", "/logo.png", "/icon-192.png", "/icon-72.png", "/audio.mp3",
];
const NOTIF_ICON  = "/icon-192.png";
const NOTIF_BADGE = "/icon-72.png";

// Install  pre-cache static assets
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC).catch(() => {}))
  );
  self.skipWaiting();
});

// Activate  remove old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

// Fetch  cache-first for hashed static assets only. Page/navigation
// requests are deliberately NOT intercepted here at all (see below) -
// this was the root cause of a real white-screen-on-refresh bug:
// a stale cached HTML shell from an old deployment references JS
// chunk filenames that Next.js deletes on every new deploy, so
// serving that cached shell as a fallback left the app's JS 404ing
// and never hydrating. Letting the browser handle navigations
// natively avoids that entirely, since only content-hashed assets
// (safe to cache indefinitely, since a hash change means a new URL)
// pass through this handler.
self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (request.method !== "GET") return;
  if (request.mode === "navigate") return;
  if (request.destination === "document") return;

  if (/\.(js|css|png|svg|jpg|jpeg|webp|woff2?|ico|mp3)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
        }
        return res;
      }).catch(() => cached || new Response("", { status: 503 })))
    );
    return;
  }
  // Anything else (non-navigation, non-hashed-asset GET) - let the
  // browser handle it normally, don't intercept.
});

//  PUSH from server 
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data?.json() || {}; }
  catch(_) { data = { title: "CARSTRIMS", body: event.data?.text() || "New notification" }; }

  const title   = data.title   || "CARSTRIMS";
  const body    = data.message || data.body || "You have a new notification";
  const tag     = data.tag     || "carstrims-" + Date.now();
  const url     = data.url     || "/dashboard";
  const sound   = data.sound   !== false; // default true

  event.waitUntil(
    (async () => {
      // Check user notification prefs from IndexedDB or skip
      // Play audio by posting to all open clients
      if (sound) {
        const allClients = await clients.matchAll({ type: "window", includeUncontrolled: true });
        allClients.forEach(c => c.postMessage({ type: "PLAY_SOUND" }));
      }

      await self.registration.showNotification(title, {
        body,
        icon:    NOTIF_ICON,
        badge:   NOTIF_BADGE,
        tag,
        silent:  !sound,
        data:    { url },
        vibrate: [200, 100, 200],
        actions: [
          { action: "open",    title: "Open" },
          { action: "dismiss", title: "Dismiss" },
        ],
      });
    })()
  );
});

//  Notification click 
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes(self.location.origin) && "focus" in c) {
          c.postMessage({ type: "NAVIGATE", url });
          return c.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

//  Messages from page  (reserved for future use)
self.addEventListener("message", (event) => {
});
