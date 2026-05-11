const CACHE = "carstrims-v1";

// Handle push events from server
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data?.json() || {}; } catch(_) { data = { title:"CARSTRIMS", body: event.data?.text() || "New notification" }; }

  const title   = data.title   || "CARSTRIMS";
  const options = {
    body:    data.message || data.body || "You have a new notification",
    icon:    "/icon-192.png",
    badge:   "/icon-72.png",
    tag:     data.tag || "carstrims",
    data:    { url: data.url || "/" },
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type:"window", includeUncontrolled:true }).then((list) => {
      for (const c of list) {
        if (c.url.includes(self.location.origin) && "focus" in c) return c.focus();
      }
      return clients.openWindow(url);
    })
  );
});

self.addEventListener("install",  () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));

// Background sync — poll for notifications when app is in background
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "carstrims-notif-check") {
    event.waitUntil(checkNotifications());
  }
});

async function checkNotifications() {
  // This runs in background when browser supports periodic sync
  try {
    const cache = await caches.open(CACHE);
    const tokenResp = await cache.match("/auth-token");
    if (!tokenResp) return;
    const token = await tokenResp.text();
    // Fetch unread count
    const resp = await fetch("/api/v1/notifications/?limit=1&unread=true", {
      headers: { Authorization: "Bearer " + token }
    });
    if (!resp.ok) return;
    const data = await resp.json();
    const unread = data.unreadCount || 0;
    if (unread > 0) {
      const latest = data.notifications?.[0];
      if (latest) {
        await self.registration.showNotification(latest.title || "CARSTRIMS", {
          body: latest.message,
          icon: "/icon-192.png",
          tag: "bg-" + latest._id,
        });
      }
    }
  } catch(_) {}
}