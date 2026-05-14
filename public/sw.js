const CACHE = "carstrims-v2";
const NOTIF_ICON = "/icon-192.png";
const NOTIF_BADGE = "/icon-72.png";

// Install — take control immediately
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));

// ── PUSH from server (Web Push API) ──────────────────────────
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data?.json() || {}; } catch(_) {
    data = { title: "CARSTRIMS", body: event.data?.text() || "New notification" };
  }

  const title   = data.title   || "CARSTRIMS";
  const body    = data.message || data.body || "You have a new notification";
  const tag     = data.tag     || "carstrims-" + Date.now();
  const url     = data.url     || "/dashboard";

  const options = {
    body,
    icon:    NOTIF_ICON,
    badge:   NOTIF_BADGE,
    tag,
    data:    { url },
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: false,
    silent: false,
    actions: [
      { action: "open",    title: "Open"    },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification click ────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
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

// ── Background polling (fallback when Web Push not set up) ───
self.addEventListener("message", (event) => {
  if (event.data?.type === "POLL_NOTIFICATIONS") {
    // SW can relay messages from the page
    self.clients.matchAll().then(clients => {
      clients.forEach(c => c.postMessage({ type: "POLL_ACK" }));
    });
  }
});
