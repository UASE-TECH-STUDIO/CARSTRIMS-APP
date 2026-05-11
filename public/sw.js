// CARSTRIMS Service Worker - Push Notifications
const CACHE_NAME = "carstrims-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// Handle push notification
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data = {};
  try { data = event.data.json(); } catch { data = { title: "CARSTRIMS", body: event.data.text() }; }

  const options = {
    body: data.body || data.message || "You have a new notification",
    icon: "/icon-192.png",
    badge: "/icon-72.png",
    tag: data.tag || "carstrims-notif",
    renotify: true,
    requireInteraction: false,
    data: { url: data.url || "/dashboard/user/notifications" },
    vibrate: [200, 100, 200],
    silent: false,
    sound: "/audio.mp3",
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "CARSTRIMS", options)
  );
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
