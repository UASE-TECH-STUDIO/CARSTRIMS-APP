"use client";
import { useEffect } from "react";

// VAPID public key for Web Push
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BD14o70t4jjR4qL-G4-T_M3LalDMX043D51sRbH2bIM8s5WnKAOMzeF00YN3lOwZJRc91GNuMr4YFG4Zi3NbXYc";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw     = window.atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

async function subscribeUserToPush(registration: ServiceWorkerRegistration) {
  try {
    // Check if already subscribed
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      await savePushSubscription(existing);
      return;
    }

    // Subscribe
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    await savePushSubscription(sub);
  } catch (err) {
    console.log("[Push] Subscription failed:", err);
  }
}

async function savePushSubscription(sub: PushSubscription) {
  try {
    const raw = localStorage.getItem("auth-storage");
    if (!raw) return;
    const token = JSON.parse(raw)?.state?.user?.accessToken;
    if (!token) return;

    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    await fetch(`${API}/api/v1/push/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
      body: JSON.stringify(sub.toJSON()),
    });
  } catch (err) {
    console.log("[Push] Save subscription failed:", err);
  }
}

async function requestPushPermission(registration: ServiceWorkerRegistration) {
  if (!("Notification" in window)) return;
  if (!("PushManager" in window)) return;

  const currentPermission = Notification.permission;

  if (currentPermission === "granted") {
    await subscribeUserToPush(registration);
    return;
  }

  if (currentPermission === "denied") return;

  // Request permission - do after a small delay so it feels natural
  setTimeout(async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        await subscribeUserToPush(registration);
        // Show a welcome notification
        registration.showNotification("CARSTRIMS Notifications Enabled ", {
          body: "You will now receive real-time alerts for messages, requests and updates.",
          icon: "/icon-192.png",
          badge: "/icon-72.png",
          tag: "welcome-push",
        });
      }
    } catch (err) {
      console.log("[Push] Permission request failed:", err);
    }
  }, 3000);
}

export default function SWRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

        // Wait for SW to be ready
        await navigator.serviceWorker.ready;

        // Warm cache after 3s
        setTimeout(() => {
          if (registration.active) {
            registration.active.postMessage({
              type: "WARM_CACHE",
              pages: ["/feed", "/login", "/register"],
            });
          }
        }, 3000);

        // Request push permission if user is logged in
        const raw = localStorage.getItem("auth-storage");
        const isLoggedIn = raw ? JSON.parse(raw)?.state?.isAuthenticated : false;
        if (isLoggedIn) {
          await requestPushPermission(registration);
        }

        // Listen for auth changes - subscribe when user logs in
        window.addEventListener("storage", async (e) => {
          if (e.key === "auth-storage" && e.newValue) {
            try {
              const parsed = JSON.parse(e.newValue);
              if (parsed?.state?.isAuthenticated) {
                const reg = await navigator.serviceWorker.ready;
                await requestPushPermission(reg);
              }
            } catch (_) {}
          }
        });

      } catch (err) {
        console.log("[SW] Registration failed:", err);
      }
    };

    register();
  }, []);

  return null;
}
